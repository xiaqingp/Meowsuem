import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
import {assertPathInside, loadManifest, resolveCanonicalRun, projectRelative} from "./lib/filesystem-contract.mjs";
import {assertSafeRemoteUrl, fetchSafeImage} from "./image-providers/url-safety.mjs";
import {
  acceptFastCandidate,
  assertNoDuplicateObjectImages,
  imageDimensions,
  normalizeAiResult,
  sha256,
} from "./lib/two-level-image-resolution.mjs";

const arg = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(arg("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const manifest = await loadManifest(projectRoot);
const {runRoot, descriptor} = await resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind: arg("--kind"),
  museumId: arg("--museum"),
  caseId: arg("--case"),
  runId: arg("--run-id"),
  suppliedRunRoot: arg("--run-root"),
  writable: true,
});
const parentRunRoot = arg("--parent-run-root");
if (parentRunRoot && path.resolve(projectRoot, parentRunRoot) === path.resolve(runRoot)) throw new Error("parent run must be distinct from image experiment run");
const readJson = file => fs.readFile(file, "utf8").then(JSON.parse);
const scope = await readJson(path.join(runRoot, "scope", "scope.json"));
const pool = await readJson(path.join(runRoot, "candidate-pool", "candidate-pool.json"));
const selection = await readJson(path.join(runRoot, "selection", "selection.json"));
const structure = await readJson(path.join(runRoot, "structure", "structure.json"));
const museumId = pool.museumId || pool.museum?.id || descriptor.targetMuseumId || descriptor.museumId;
if (museumId !== (descriptor.museumId || descriptor.targetMuseumId)) throw new Error("two-level image evidence museum identity drift");
const selectedIds = new Set((selection.selectedWorks || selection.works || []).map(item => item.workId || item.id));
const poolById = new Map((pool.candidates || []).map(item => [item.workId || item.id, item]));
const structureById = new Map((structure.works || []).map(item => [item.workId || item.id, item]));
const candidates = [...selectedIds].map(workId => {
  const item = poolById.get(workId);
  if (!item) throw new Error(`selected work missing from candidate pool: ${workId}`);
  const identity = item.identity || {};
  return {
    workId,
    identity: {
      museumId,
      workId,
      title: identity.title?.en || identity.title?.zh || identity.titleEn || identity.titleZh || "",
      objectType: identity.objectType || item.objectType || "unknown",
      titleZh: identity.title?.zh || identity.titleZh || item.titleZh || "",
      titleEn: identity.title?.en || identity.titleEn || item.titleEn || "",
      creator: identity.artistOrCulture || identity.creator || item.makerOrCulture || "",
      artistOrCulture: identity.artistOrCulture || identity.creator || item.makerOrCulture || "",
      displayDate: identity.displayDate || item.date || "",
      medium: identity.medium || item.medium || "",
      identityAnchor: item.identityAnchor || identity.identityAnchor || workId,
      officialObjectUrl: item.officialObjectUrl || identity.officialObjectUrl || item.identitySourceUrl,
      identitySourceUrl: item.identitySourceUrl || item.officialObjectUrl || identity.officialObjectUrl,
      accessionNumber: item.accessionNumber || identity.accessionNumber || null,
      collectionGroup: item.collectionGroup || null,
    },
    structure: structureById.get(workId) || null,
  };
});
if (!candidates.length) throw new Error("two-level image evidence requires a non-empty frozen selection");

const modules = [
  process.env.MEOWSEUM_NODE_MODULES,
  ...(process.env.NODE_PATH || "").split(path.delimiter),
  path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules"),
].filter(Boolean);
let chromium;
for (const directory of modules) {
  try { ({chromium} = createRequire(import.meta.url)(path.join(directory, "playwright"))); break; } catch {}
}
if (!chromium) throw new Error("Playwright is unavailable; set MEOWSEUM_NODE_MODULES");
const chromePath = process.env.MEOWSEUM_CHROME || null;
if (chromePath) await fs.access(chromePath);
const evidenceRoot = path.join(runRoot, "image-evidence");
const assetsRoot = path.join(evidenceRoot, "assets");
const modelRoot = path.join(evidenceRoot, "model-run");
const rel = target => projectRelative(projectRoot, target);
await assertPathInside(runRoot, evidenceRoot, {allowEqual: false});
if (process.argv.includes("--fresh")) await fs.rm(evidenceRoot, {recursive: true, force: true});
await fs.mkdir(assetsRoot, {recursive: true});
const ext = type => ({"image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/gif":".gif","image/tiff":".tif"}[type] || ".img");
const records = [];
const browser = await chromium.launch({headless: true, ...(chromePath ? {executablePath: chromePath} : {})});

async function inspectFast(candidate) {
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  try {
    await assertSafeRemoteUrl(candidate.identity.identitySourceUrl);
    const response = await page.goto(candidate.identity.identitySourceUrl, {waitUntil: "domcontentloaded", timeout: 30000});
    await page.waitForTimeout(250);
    const data = await page.evaluate(() => {
      const jsonLdRecords = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).flatMap(script => {
        try {
          const value = JSON.parse(script.textContent || "null");
          return (Array.isArray(value) ? value : [value]).map(item => ({
            name: item?.name || "",
            creator: typeof item?.creator === "string" ? item.creator : item?.creator?.name || "",
            image: typeof item?.image === "string" ? item.image : item?.image?.contentUrl || item?.image?.url || null,
          }));
        } catch { return []; }
      });
      const explicitRecords = Array.from(document.querySelectorAll("figure, article, [data-object-id], [data-work-id]")).map(node => ({
        title: node.querySelector("figcaption,h1,h2,h3,[data-title]")?.textContent || node.getAttribute("aria-label") || "",
        creator: node.querySelector("[data-artist],.artist,.creator")?.textContent || "",
      }));
      const images = Array.from(document.images).map((image, index) => {
        const figure = image.closest("figure");
        const container = image.closest("figure,article,[data-object-id],[data-work-id]") || image.parentElement;
        return {
          id: `dom-${index + 1}`,
          url: image.currentSrc || image.src,
          alt: image.alt || "",
          caption: figure?.querySelector("figcaption")?.textContent || "",
          nearbyText: (container?.innerText || "").slice(0, 1000),
          width: image.naturalWidth || 0,
          height: image.naturalHeight || 0,
          figureCaptionRelation: Boolean(figure?.querySelector("figcaption")),
        };
      }).filter(image => image.url);
      return {
        title: document.title || "",
        body: (document.body?.innerText || "").slice(0, 50000),
        og: document.querySelector('meta[property="og:image"]')?.content || document.querySelector('meta[name="twitter:image"]')?.content || null,
        iiifUrls: Array.from(document.querySelectorAll('link[rel="manifest"],link[rel="alternate"][type*="json"]')).map(link => link.href).filter(Boolean).slice(0, 5),
        jsonLdRecords,
        explicitRecords,
        images,
      };
    });
    const pageUrl = page.url();
    const pageImages = data.images.map(image => ({...image, url: new URL(image.url, pageUrl).href}));
    const jsonLdImages = data.jsonLdRecords.filter(item => item.image).map((item, index) => ({
      id: `jsonld-${index + 1}`,
      url: new URL(item.image, pageUrl).href,
      title: item.name,
      creator: item.creator,
      jsonLdObjectRelation: true,
    }));
    const iiifImages = [];
    for (const manifestUrl of data.iiifUrls || []) {
      try {
        const iiif = await page.evaluate(async url => {
          const response = await fetch(url);
          if (!response.ok) return null;
          const data = await response.json();
          const item = data?.items?.[0]?.items?.[0]?.items?.[0]?.body;
          const service = Array.isArray(item?.service) ? item.service[0] : item?.service;
          return service?.id || service?.["@id"] || item?.id || item?.["@id"] || null;
        }, new URL(manifestUrl, pageUrl).href);
        if (iiif) iiifImages.push({id: `iiif-${iiifImages.length + 1}`, url: `${iiif.replace(/\/$/, "")}/full/max/0/default.jpg`, iiifManifestRelation: true});
      } catch {}
    }
    const ogImages = data.og ? [{id: "og", url: new URL(data.og, pageUrl).href, alt: "", caption: "", nearbyText: "", officialOgImage: true}] : [];
    const normalizedPage = {...data, url: pageUrl, images: [...jsonLdImages, ...iiifImages, ...ogImages, ...pageImages]};
    const fast = normalizedPage.images.map(image => acceptFastCandidate(candidate.identity, normalizedPage, image)).filter(Boolean)[0] || null;
    return {
      status: fast ? "fast_candidate_found" : "fast_path_unresolved",
      pageTitle: data.title,
      finalUrl: pageUrl,
      fastCandidate: fast,
      excludedImageUrls: normalizedPage.images.map(image => image.url).slice(0, 20),
      fastPageSignals: fast ? fast.identitySignals : [],
    };
  } catch (error) {
    return {status: "provider_unavailable", reason: error.message, fastCandidate: null, excludedImageUrls: []};
  } finally { await page.close(); }
}

async function saveRemoteImage(record, candidate, selected, method) {
  await assertSafeRemoteUrl(selected.imageUrl);
  const fetched = await fetchSafeImage(selected.imageUrl);
  const dimensions = imageDimensions(fetched.bytes, fetched.type);
  if (!dimensions || dimensions.width < 180 || dimensions.height < 120) throw new Error("image dimensions are missing or too small");
  const hash = sha256(fetched.bytes);
  const file = path.join(assetsRoot, `${record.workId}${ext(fetched.type)}`);
  await fs.writeFile(file, fetched.bytes, {flag: "wx"}).catch(async error => {
    if (error.code !== "EEXIST") throw error;
    const existing = await fs.readFile(file);
    if (sha256(existing) !== hash) throw new Error(`asset collision for ${record.workId}`);
  });
  const isContext = candidate.identity.objectType === "museum_level_context";
  record.status = isContext ? "context_image_accepted" : "object_image_accepted";
  record.objectImageResolved = !isContext;
  record.imagePolicy = isContext ? "context_image" : "object_image";
  record.selected = {
    url: fetched.url,
    sourcePageUrl: selected.sourcePageUrl || record.finalUrl || candidate.identity.officialObjectUrl,
    sourceType: selected.sourceType || "other",
    caption: selected.caption || "",
    identityEvidence: selected.identityEvidence || [],
    confidence: selected.confidence ?? null,
    localPath: rel(file),
    sha256: hash,
    width: dimensions.width,
    height: dimensions.height,
    contentType: fetched.type,
    method,
    provider: selected.sourceType || "ai-image-research",
    evidenceId: `img:${museumId}:${record.workId}:${hash.slice(0, 12)}`,
  };
}

try {
  const queue = [...candidates];
  const worker = async () => {
    while (queue.length) {
      const candidate = queue.shift();
      const started = Date.now();
      const fast = await inspectFast(candidate);
      const record = {
        workId: candidate.workId,
        identity: candidate.identity,
        fastPath: fast,
        status: "object_image_unresolved",
        objectImageResolved: false,
        imagePolicy: "none",
        selected: null,
        warnings: [],
        durationMs: Date.now() - started,
      };
      if (fast.fastCandidate) {
        try { await saveRemoteImage(record, candidate, {imageUrl: fast.fastCandidate.url, sourcePageUrl: fast.finalUrl, sourceType: "official_museum", caption: fast.fastCandidate.caption, identityEvidence: fast.fastCandidate.identitySignals}, "official_fast_path"); }
        catch (error) { record.warnings.push(`fast path download failed: ${error.message}`); }
      }
      record.aiRequired = !record.selected;
      records.push(record);
    }
  };
  await Promise.all(Array.from({length: Math.min(6, queue.length)}, worker));
} finally {
  await browser.close();
}

const unresolved = records.filter(record => !record.selected);
let modelRun = null;
if (unresolved.length) {
  await fs.mkdir(modelRoot, {recursive: true});
  const packetPath = path.join(modelRoot, "image-research-packet.json");
  const packet = {
    schemaVersion: 1,
    museumId,
    works: unresolved.map(record => ({
      workId: record.workId,
      identity: record.identity,
      officialObjectUrl: record.identity.officialObjectUrl,
      collectionGroup: record.identity.collectionGroup,
      fastPathCandidates: record.fastPath.fastCandidate ? [record.fastPath.fastCandidate] : [],
      excludedImageUrls: record.fastPath.excludedImageUrls || [],
    })),
  };
  await fs.writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  const header = {
    runId: descriptor.runId,
    startedAt: new Date().toISOString(),
    stage: "image_disambiguation",
    imageResearchMode: "two_level",
    caseId: descriptor.caseId,
    targetMuseumId: museumId,
    pipelineVersion: manifest.pipelineVersion,
    instructionVersion: manifest.currentVersion,
    executionProfile: manifest.modelRouting.image_disambiguation,
    allowedInputs: [{path: rel(packetPath), role: "image_candidate_packet", sha256: sha256(await fs.readFile(packetPath))}],
    outputs: ["image-decisions.json"],
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "evidence_only",
  };
  await fs.writeFile(path.join(modelRoot, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
  const modelOutputPath = path.join(modelRoot, "image-decisions.json");
  const reuseModelOutput = await fs.access(modelOutputPath).then(() => true).catch(() => false) && !process.argv.includes("--rerun-model");
  if (!reuseModelOutput) {
    const run = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", path.join(projectRoot, "scripts", "run-isolated-generation.ps1"), "-ProjectRoot", projectRoot, "-RunDirectory", modelRoot], {cwd: projectRoot, encoding: "utf8", timeout: 20 * 60 * 1000});
    if (run.status !== 0) throw new Error(`two-level image research failed: ${run.stderr || run.stdout}`);
  }
  const aiOutput = normalizeAiResult(await readJson(modelOutputPath));
  if (aiOutput.works.length !== unresolved.length || new Set(aiOutput.works.map(item => item.workId)).size !== unresolved.length) throw new Error("AI image research must return exactly one result per unresolved work");
  for (const item of aiOutput.works) {
    const record = records.find(value => value.workId === item.workId);
    const candidate = candidates.find(value => value.workId === item.workId);
    record.aiResult = item;
    if (item.status !== "candidate_found" || !item.selectedCandidate?.imageUrl) {
      record.warnings.push(...(item.limitations || ["No identity-bound object image found"]));
      continue;
    }
    try { await saveRemoteImage(record, candidate, item.selectedCandidate, "ai_image_research"); }
    catch (error) { record.warnings.push(`AI candidate download failed: ${error.message}`); }
  }
  const resultFile = path.join(modelRoot, "image_disambiguation-result.json");
  const stageResult = await readJson(resultFile).catch(() => null);
  modelRun = stageResult
    ? {runRoot: rel(modelRoot), model: stageResult.model, reasoningEffort: stageResult.reasoningEffort, durationMs: stageResult.modelDurationMs, tokens: stageResult.tokenUsage?.total || 0}
    : {runRoot: rel(modelRoot), model: manifest.modelRouting.image_disambiguation.model, reasoningEffort: manifest.modelRouting.image_disambiguation.reasoningEffort, durationMs: null, tokens: null, reusedOutput: true};
}

const heroPath = path.join(assetsRoot, "museum-hero-placeholder.jpg");
if (!await fs.access(heroPath).then(() => true).catch(() => false)) {
  const heroBrowser = await chromium.launch({headless: true, ...(chromePath ? {executablePath: chromePath} : {})});
  try {
    const page = await heroBrowser.newPage();
    await page.goto(scope.officialCollectionUrl, {waitUntil: "domcontentloaded", timeout: 30000});
    const heroUrl = await page.evaluate(() => document.querySelector('meta[property="og:image"]')?.content || document.querySelector('meta[name="twitter:image"]')?.content || null);
    if (heroUrl) {
      const hero = await fetchSafeImage(new URL(heroUrl, page.url()).href);
      await fs.writeFile(heroPath, hero.bytes);
    }
    await page.close();
  } catch {}
  await heroBrowser.close();
}

const duplicateObjectImageGroups = assertNoDuplicateObjectImages(records);
const output = {
  schemaVersion: 1,
  stage: "verified_image_evidence",
  museumId,
  pipelineVersion: manifest.pipelineVersion,
  generatedAt: new Date().toISOString(),
  parentRunId: descriptor.parentRunId || null,
  resolver: {version: 1, mode: "two_level", fastPath: "official_object_url", modelPolicy: "all_unresolved_to_ai", model: manifest.modelRouting.image_disambiguation.model, reasoningEffort: manifest.modelRouting.image_disambiguation.reasoningEffort},
  summary: {
    works: records.length,
    fastPathAccepted: records.filter(record => record.selected?.method === "official_fast_path").length,
    aiResearchTriggered: unresolved.length,
    aiAccepted: records.filter(record => record.selected?.method === "ai_image_research").length,
    contextImagesAccepted: records.filter(record => record.status === "context_image_accepted").length,
    objectImageAccepted: records.filter(record => record.status === "object_image_accepted").length,
    unresolved: records.filter(record => record.status === "object_image_unresolved").length,
    providerUnavailable: records.filter(record => record.status === "provider_unavailable").length,
    duplicateObjectImageGroups,
    modelCalls: modelRun ? 1 : 0,
    modelTokens: modelRun?.tokens || 0,
  },
  modelRun,
  works: records,
};
await fs.writeFile(path.join(evidenceRoot, "verified-image-evidence.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`${museumId} two-level image evidence: ${output.summary.objectImageAccepted} object images, ${output.summary.contextImagesAccepted} context images, ${output.summary.unresolved} unresolved, ${output.summary.modelCalls} model calls`);
