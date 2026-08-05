import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
import {assertPathInside, loadManifest, resolveCanonicalRun, projectRelative} from "./lib/filesystem-contract.mjs";
import {workIdentityMatches} from "./lib/prior-work-identity.mjs";
import {resolveBrowserExecutable} from "./lib/browser-executable.mjs";
import {readModelJson} from "./lib/model-json.mjs";
import {assertSafeRemoteUrl, fetchSafeImage} from "./image-providers/url-safety.mjs";
import {
  acceptFastCandidate,
  assertNoDuplicateObjectImages,
  imageDimensions,
  normalizeAiResult,
  partitionImageBatchResults,
  sha256,
} from "./lib/two-level-image-resolution.mjs";
import {assertVerifiedImageEvidence} from "./lib/verified-image-evidence-contract.mjs";

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
const onlyWork = arg("--only-work");
if (onlyWork && !selectedIds.has(onlyWork)) throw new Error(`--only-work is not in frozen selection: ${onlyWork}`);
const poolById = new Map((pool.candidates || []).map(item => [item.workId || item.id, item]));
const structureById = new Map((structure.works || []).map(item => [item.workId || item.id, item]));
const candidates = [...selectedIds].filter(workId => !onlyWork || workId === onlyWork).map(workId => {
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
      creator: identity.artistOrCulture || identity.creator || identity.artistEn || identity.artistZh || identity.cultureEn || identity.cultureZh || item.makerOrCulture || "",
      artistOrCulture: identity.artistOrCulture || identity.creator || identity.artistEn || identity.artistZh || identity.cultureEn || identity.cultureZh || item.makerOrCulture || "",
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
const browserExecutable = await resolveBrowserExecutable(chromium);
const evidenceRoot = path.join(runRoot, "image-evidence");
const assetsRoot = path.join(evidenceRoot, "assets");
const modelRoot = path.join(evidenceRoot, "model-run");
const rel = target => projectRelative(projectRoot, target);
await assertPathInside(runRoot, evidenceRoot, {allowEqual: false});
if (process.argv.includes("--fresh")) await fs.rm(evidenceRoot, {recursive: true, force: true});
await fs.mkdir(assetsRoot, {recursive: true});
const ext = type => ({"image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/gif":".gif","image/tiff":".tif"}[type] || ".img");
const records = [];
const modelBatchSize = 10;

async function reusePriorEvidence() {
  if (descriptor.runKind !== "production" || !process.argv.includes("--reuse-prior-evidence")) return [];
  const museumRoot=path.dirname(runRoot);
  const entries=await fs.readdir(museumRoot,{withFileTypes:true});
  const prior=[];
  for(const entry of entries.filter(item=>item.isDirectory()&&item.name!==descriptor.runId).sort((a,b)=>b.name.localeCompare(a.name))){
    const priorRoot=path.join(museumRoot,entry.name);
    const priorDescriptor=await readJson(path.join(priorRoot,"run.json")).catch(()=>null);
    if(!priorDescriptor||!["accepted","published"].includes(priorDescriptor.status)) continue;
    const evidence=await readJson(path.join(priorRoot,"image-evidence","verified-image-evidence.json")).catch(()=>null);
    if(evidence?.museumId===museumId) prior.push({runId:entry.name,root:priorRoot,evidenceRoot:path.join(priorRoot,"image-evidence"),works:evidence.works??[]});
  }
  const attemptsRoot=path.join(runRoot,"attempts");
  const attempts=await fs.readdir(attemptsRoot,{withFileTypes:true}).catch(()=>[]);
  for(const entry of attempts.filter(item=>item.isDirectory()).sort((a,b)=>b.name.localeCompare(a.name))){
    const attemptRoot=path.join(attemptsRoot,entry.name);
    const evidence=await readJson(path.join(attemptRoot,"verified-image-evidence.json")).catch(()=>null);
    if(evidence?.museumId===museumId) prior.push({runId:descriptor.runId,root:runRoot,evidenceRoot:attemptRoot,attempt:entry.name,works:evidence.works??[]});
  }
  const reused=[];
  const used=new Set();
  for(const candidate of candidates){
    const matches=[];
    for(const sourceRun of prior){
      for(const work of sourceRun.works){
        if(!["accepted","object_image_accepted","context_image_accepted"].includes(work.status)||!work.selected?.localPath) continue;
        if(workIdentityMatches(candidate.identity,work.identity)) matches.push({sourceRun,work});
      }
      if(matches.length) break;
    }
    if(matches.length!==1) continue;
    const {sourceRun,work}=matches[0];
    const key=`${sourceRun.runId}:${work.workId}`;
    if(used.has(key)) continue;
    let source=path.resolve(projectRoot,work.selected.localPath);
    if(!await fs.access(source).then(()=>true).catch(()=>false)) source=path.join(sourceRun.evidenceRoot,"assets",path.basename(work.selected.localPath));
    await assertPathInside(sourceRun.root,source);
    const bytes=await fs.readFile(source);
    if(sha256(bytes)!==work.selected.sha256) continue;
    const dimensions=imageDimensions(bytes,work.selected.contentType);
    if(!dimensions||dimensions.width!==work.selected.width||dimensions.height!==work.selected.height) continue;
    const destination=path.join(assetsRoot,`${candidate.workId}${ext(work.selected.contentType)}`);
    await fs.copyFile(source,destination);
    used.add(key);
    reused.push({
      ...work,workId:candidate.workId,identity:candidate.identity,
      fastPath:{status:"prior_verified_evidence_reused",fastCandidate:null,excludedImageUrls:[]},
      selected:{...work.selected,localPath:rel(destination),method:"prior_verified_evidence",provider:"prior_production_run",evidenceId:`img:${museumId}:${candidate.workId}:${work.selected.sha256.slice(0,12)}`},
      aiRequired:false,reusedFromRunId:sourceRun.runId,reusedFromAttempt:sourceRun.attempt??null,reusedFromWorkId:work.workId,durationMs:0,
    });
  }
  return reused;
}

records.push(...await reusePriorEvidence());
const reusedIds=new Set(records.map(record=>record.workId));
const browser = await chromium.launch({headless: true, executablePath: browserExecutable});

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
      const largestSrcset = value => String(value || "").split(",").map(part => {
        const [url, descriptor = ""] = part.trim().split(/\s+/);
        const weight = descriptor.endsWith("w") ? Number(descriptor.slice(0, -1)) : descriptor.endsWith("x") ? Number(descriptor.slice(0, -1)) * 1000 : 0;
        return {url, weight};
      }).filter(item => item.url).sort((a, b) => b.weight - a.weight)[0]?.url || null;
      const images = Array.from(document.images).map((image, index) => {
        const figure = image.closest("figure");
        const container = image.closest("figure,article,[data-object-id],[data-work-id]") || image.parentElement;
        return {
          id: `dom-${index + 1}`,
          url: largestSrcset(image.getAttribute("data-srcset")) || largestSrcset(image.srcset) || image.getAttribute("data-src") || image.getAttribute("data-lazy-src") || image.currentSrc || image.src,
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
  const queue = candidates.filter(candidate=>!reusedIds.has(candidate.workId));
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
  const batchRoot = path.join(evidenceRoot, "model-runs");
  await fs.mkdir(batchRoot, {recursive: true});
  const aiOutputs = [];
  const stageResults = [];
  const pendingBatches = [];
  for (let offset = 0; offset < unresolved.length; offset += modelBatchSize) {
    pendingBatches.push({batchWorks: unresolved.slice(offset, offset + modelBatchSize), batchNumber: offset / modelBatchSize + 1, supplement: false});
  }
  let batchRuns = 0;
  while (pendingBatches.length) {
    const {batchWorks, batchNumber, supplement} = pendingBatches.shift();
    batchRuns += 1;
    const batchKey = sha256(batchWorks.map(record => record.workId).join("\n")).slice(0, 12);
    const batchDirectory = path.join(batchRoot, `batch-${String(batchNumber).padStart(2, "0")}${supplement ? "-supplement" : ""}-${batchKey}`);
    await fs.mkdir(batchDirectory, {recursive: true});
    const packetPath = path.join(batchDirectory, "image-research-packet.json");
    const packet = {
      schemaVersion: 1,
      museumId,
      works: batchWorks.map(record => ({
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
      ...(descriptor.runKind === "production"
        ? {museumId}
        : {caseId: descriptor.caseId, targetMuseumId: museumId}),
      pipelineVersion: manifest.pipelineVersion,
      instructionVersion: manifest.currentVersion,
      executionProfile: manifest.modelRouting.image_disambiguation,
      allowedInputs: [{path: rel(packetPath), role: "image_candidate_packet", sha256: sha256(await fs.readFile(packetPath))}],
      outputs: ["image-decisions.json"],
      reviewer: "disabled",
      retry: "disabled",
      publicationBoundary: "evidence_only",
    };
    await fs.writeFile(path.join(batchDirectory, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
    const modelOutputPath = path.join(batchDirectory, "image-decisions.json");
    const existingModelOutput = await readModelJson(modelOutputPath).catch(() => null);
    const expectedWorkIds = batchWorks.map(record => record.workId);
    let reusablePartition = null;
    try {
      if (existingModelOutput) reusablePartition = partitionImageBatchResults(normalizeAiResult(existingModelOutput).works, expectedWorkIds);
    } catch {}
    const reuseModelOutput = Boolean(reusablePartition) && !process.argv.includes("--rerun-model");
    if (!reuseModelOutput) {
      const run = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", path.join(projectRoot, "scripts", "run-isolated-generation.ps1"), "-ProjectRoot", projectRoot, "-RunDirectory", batchDirectory], {cwd: projectRoot, encoding: "utf8", timeout: 20 * 60 * 1000});
      if (run.status !== 0) throw new Error(`two-level image research failed: ${run.stderr || run.stdout}`);
    }
    const aiOutput = normalizeAiResult(await readModelJson(modelOutputPath));
    const partition = partitionImageBatchResults(aiOutput.works, expectedWorkIds);
    aiOutputs.push(...partition.works);
    const resultFile = path.join(batchDirectory, "image_disambiguation-result.json");
    const stageResult = await readJson(resultFile).catch(() => null);
    if (stageResult) stageResults.push(stageResult);
    if (partition.missingWorkIds.length) {
      if (supplement) throw new Error(`AI image research supplement still omitted: ${partition.missingWorkIds.join(", ")}`);
      const missing = new Set(partition.missingWorkIds);
      pendingBatches.push({batchWorks: batchWorks.filter(record => missing.has(String(record.workId || "").toLowerCase().replace(/[^a-z0-9-]/g, ""))), batchNumber, supplement: true});
    }
  }
  for (const item of aiOutputs) {
    const workId = String(item.workId || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    const record = records.find(value => String(value.workId || "").toLowerCase().replace(/[^a-z0-9-]/g, "") === workId);
    const candidate = candidates.find(value => String(value.workId || "").toLowerCase().replace(/[^a-z0-9-]/g, "") === workId);
    item.workId = workId;
    record.aiResult = item;
    if (item.status !== "candidate_found" || !item.selectedCandidate?.imageUrl) {
      record.warnings.push(...(item.limitations || ["No identity-bound object image found"]));
      continue;
    }
    try { await saveRemoteImage(record, candidate, item.selectedCandidate, "ai_image_research"); }
    catch (error) { record.warnings.push(`AI candidate download failed: ${error.message}`); }
  }
  modelRun = {
    runRoot: rel(batchRoot),
    model: manifest.modelRouting.image_disambiguation.model,
    reasoningEffort: manifest.modelRouting.image_disambiguation.reasoningEffort,
    durationMs: stageResults.reduce((sum, result) => sum + (result.modelDurationMs || 0), 0) || null,
    tokens: stageResults.reduce((sum, result) => sum + (result.tokenUsage?.total || 0), 0) || null,
    batches: batchRuns,
  };
}

const heroPath = path.join(assetsRoot, "museum-hero-placeholder.jpg");
let heroMeta = null;
if (!await fs.access(heroPath).then(() => true).catch(() => false)) {
  const heroBrowser = await chromium.launch({headless: true, executablePath: browserExecutable});
  try {
    const page = await heroBrowser.newPage();
    await page.goto(scope.officialCollectionUrl, {waitUntil: "domcontentloaded", timeout: 30000});
    const heroUrl = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]')?.content || document.querySelector('meta[name="twitter:image"]')?.content;
      if (meta) return meta;
      return Array.from(document.images)
        .map(image => ({url: image.currentSrc || image.src, alt: image.alt || "", width: image.naturalWidth || 0, height: image.naturalHeight || 0}))
        .filter(image => image.url && image.width >= 480 && image.height >= 280 && !/logo|icon|avatar|ticket|menu/i.test(`${image.url} ${image.alt}`))
        .sort((a, b) => b.width * b.height - a.width * a.height)[0]?.url || null;
    });
    if (heroUrl) {
      const hero = await fetchSafeImage(new URL(heroUrl, page.url()).href);
      const dimensions = imageDimensions(hero.bytes, hero.type);
      if (!dimensions || dimensions.width < 180 || dimensions.height < 120) throw new Error("museum hero is too small");
      await fs.writeFile(heroPath, hero.bytes);
      heroMeta = {url: hero.url, bytes: hero.bytes, type: hero.type, dimensions};
    }
    await page.close();
  } catch {}
  await heroBrowser.close();
}
if (!heroMeta && await fs.access(heroPath).then(() => true).catch(() => false)) {
  const bytes = await fs.readFile(heroPath);
  const type = "image/jpeg";
  const dimensions = imageDimensions(bytes, type);
  if (dimensions) heroMeta = {url: scope.officialCollectionUrl, bytes, type, dimensions};
}
// Museum-level hero images are never valid substitutes for unresolved works.
if (false && heroMeta) {
  const hash = sha256(heroMeta.bytes);
  for (const record of records.filter(item => item.status === "object_image_unresolved" || item.status === "provider_unavailable")) {
    record.originalStatus = record.status;
    record.status = "accepted";
    record.imagePolicy = "museum_hero_placeholder";
    record.selected = {
      url: heroMeta.url,
      localPath: rel(heroPath),
      sha256: hash,
      width: heroMeta.dimensions.width,
      height: heroMeta.dimensions.height,
      contentType: heroMeta.type,
      method: "museum_hero_placeholder",
      provider: "locked_museum_hero",
      identitySignals: ["museum_level_context_only"],
      evidenceId: `img:${museumId}:museum-hero:${hash.slice(0, 12)}`,
    };
  }
}

const duplicateObjectImageGroups = assertNoDuplicateObjectImages(records);
const output = {
  schemaVersion: 2,
  stage: "verified_image_evidence",
  museumId,
  pipelineVersion: manifest.pipelineVersion,
  generatedAt: new Date().toISOString(),
  parentRunId: descriptor.parentRunId || null,
  resolver: {version: 3, mode: "four_tier", tiers: ["official_api_iiif", "luna_official_page_plan", "wikidata_commons", "luna_open_web"], fastPath: "official_structured_or_identity_bound_dom", modelPolicy: "unresolved_only", model: manifest.modelRouting.image_disambiguation.model, reasoningEffort: manifest.modelRouting.image_disambiguation.reasoningEffort},
  summary: {
    works: records.length,
    priorEvidenceReused: records.filter(record => record.selected?.method === "prior_verified_evidence").length,
    fastPathAccepted: records.filter(record => record.selected?.method === "official_fast_path").length,
    aiResearchTriggered: unresolved.length,
    aiAccepted: records.filter(record => record.selected?.method === "ai_image_research").length,
    contextImagesAccepted: records.filter(record => record.status === "context_image_accepted").length,
    objectImageAccepted: records.filter(record => record.status === "object_image_accepted").length,
    unresolved: records.filter(record => record.status === "object_image_unresolved").length,
    providerUnavailable: records.filter(record => record.status === "provider_unavailable").length,
    duplicateObjectImageGroups,
    modelCalls: modelRun?.batches || 0,
    modelTokens: modelRun?.tokens || 0,
  },
  modelRun,
  works: records,
};
assertVerifiedImageEvidence(output);
await fs.writeFile(path.join(evidenceRoot, "verified-image-evidence.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`${museumId} two-level image evidence: ${output.summary.objectImageAccepted} object images, ${output.summary.contextImagesAccepted} context images, ${output.summary.unresolved} unresolved, ${output.summary.modelCalls} model calls`);
