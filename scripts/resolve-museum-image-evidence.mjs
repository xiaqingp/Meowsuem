import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
import {assertPathInside, loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {discoverGenericHtml} from "./image-providers/generic-html.mjs";
import {discoverEmuseum} from "./image-providers/emuseum.mjs";
import {discoverIiif} from "./image-providers/iiif.mjs";
import {discoverCollectionApi} from "./image-providers/collection-api.mjs";
import {discoverWikidataCommons, searchWikidataCommons} from "./image-providers/wikidata-commons.mjs";
import {museumImageProviderConfig} from "./image-providers/registry.mjs";
import {assertSafeRemoteUrl, fetchSafeImage} from "./image-providers/url-safety.mjs";

const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const allowModel = process.argv.includes("--allow-model");
const fresh = process.argv.includes("--fresh");
const manifest = await loadManifest(projectRoot);
const {runRoot, descriptor} = await resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind: argument("--kind"),
  museumId: argument("--museum"),
  caseId: argument("--case"),
  runId: argument("--run-id"),
  suppliedRunRoot: argument("--run-root"),
  writable: true
});
const pool = JSON.parse(await fs.readFile(path.join(runRoot, "candidate-pool", "candidate-pool.json"), "utf8"));
const selection = JSON.parse(await fs.readFile(path.join(runRoot, "selection", "selection.json"), "utf8"));
const scope = JSON.parse(await fs.readFile(path.join(runRoot, "scope", "scope.json"), "utf8"));
const museumId = pool.museum?.id ?? pool.museumId;
if (!/^[a-z][a-z0-9-]*$/.test(museumId || "")) throw new Error("candidate pool has no valid museum id");
if (museumId !== (descriptor.museumId??descriptor.targetMuseumId)) throw new Error("Filesystem contract violation: image evidence museum identity drift");
const evidenceRoot = path.join(runRoot, "image-evidence");
const assetsRoot = path.join(evidenceRoot, "assets");
const candidateAssetsRoot = path.join(evidenceRoot, "candidates");
if (fresh) {
  const resolved = path.resolve(evidenceRoot);
  await assertPathInside(runRoot, resolved, {allowEqual: false});
  await fs.rm(resolved, {recursive: true, force: true});
}
await fs.mkdir(assetsRoot, {recursive: true});
await fs.mkdir(candidateAssetsRoot, {recursive: true});

const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const normalize = value => String(value || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, "");
const rel = target => path.relative(projectRoot, target).replaceAll("\\", "/");
const absoluteUrl = (value, base) => {
  try { return new URL(value, base).href; } catch { return null; }
};
const extension = type => ({
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/tiff": ".tif"
}[String(type || "").split(";")[0].toLowerCase()] || ".img");
const imageType = headers => String(headers["content-type"] || headers.get?.("content-type") || "").split(";")[0].toLowerCase();
const selectedIds = new Set((selection.selectedWorks ?? selection.works ?? []).map(record => record.workId ?? record.id));
if (!selectedIds.size) throw new Error("image evidence requires a non-empty frozen selection");
const candidates = (pool.candidates ?? []).filter(record => selectedIds.has(record.workId ?? record.id)).map(record => ({
  ...record,
  id: record.id ?? record.workId,
  title: record.title ?? record.identity?.titleEn ?? record.identity?.titleZh,
  makerOrCulture: record.makerOrCulture ?? record.identity?.artistEn ?? record.identity?.artistZh
    ?? record.identity?.cultureEn ?? record.identity?.cultureZh,
  date: record.date ?? record.identity?.displayDate,
  objectNumber: record.objectNumber ?? record.accessionNumber ?? record.identity?.accessionNumber,
  identityAnchor: record.identityAnchor ?? record.accessionNumber ?? record.identity?.accessionNumber,
  identitySourceUrl: record.identitySourceUrl ?? record.officialObjectUrl ?? record.identity?.officialObjectUrl,
}));
if (candidates.length !== selectedIds.size) throw new Error("image evidence selection contains an unknown candidate");

const moduleCandidates = [
  process.env.MEOWSEUM_NODE_MODULES,
  ...(process.env.NODE_PATH || "").split(path.delimiter),
  path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")
].filter(Boolean);
let chromium;
for (const directory of moduleCandidates) {
  try {
    const require = createRequire(import.meta.url);
    ({chromium} = require(path.join(directory, "playwright")));
    break;
  } catch {}
}
if (!chromium) throw new Error("Playwright is unavailable; set MEOWSEUM_NODE_MODULES to a node_modules directory containing playwright");

const chromePath = process.env.MEOWSEUM_CHROME || null;
if (chromePath) await fs.access(chromePath);

const identityMatches = (candidate, page) => {
  const title = normalize(candidate.title);
  const pageTitle = normalize(page.title.replace(/\s+[–-]\s+Works.*$/i, ""));
  const anchor = normalize(candidate.objectNumber || candidate.identityAnchor);
  return Boolean(title && pageTitle.includes(title) && (!anchor || normalize(page.body).includes(anchor)));
};
const candidateScore = item => {
  let score = item.method === "official_og_image" ? 200 : 100;
  if (/\/full(?:$|[?#])/i.test(item.url)) score += 40;
  else if (/\/preview(?:$|[?#])/i.test(item.url)) score += 25;
  else if (/\/thumbnail(?:$|[?#])/i.test(item.url)) score -= 30;
  if (/logo|menu|ticket|icon|avatar/i.test(`${item.url} ${item.alt || ""}`)) score -= 120;
  if ((item.width || 0) >= 400 && (item.height || 0) >= 250) score += 10;
  return score;
};
const dispatcherIdentity = url => url.match(/\/internal\/media\/dispatcher\/(\d+)\//i)?.[1] || url;

const inspectWithBrowser = async (browser, candidate) => {
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  try {
    await assertSafeRemoteUrl(candidate.identitySourceUrl);
    const response = await page.goto(candidate.identitySourceUrl, {waitUntil: "domcontentloaded", timeout: 30000});
    await page.waitForTimeout(250);
    const pageData = await page.evaluate(() => ({
      title: document.title,
      body: (document.body?.innerText || "").slice(0, 50000),
      og: document.querySelector('meta[property="og:image"]')?.content
        || document.querySelector('meta[name="twitter:image"]')?.content
        || null,
      iiifUrls: Array.from(document.querySelectorAll('link[rel="manifest"],link[rel="alternate"][type*="json"]'))
        .map(link => link.href).filter(Boolean).slice(0, 5),
      jsonLdImages: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).flatMap(script => {
        try {
          const value = JSON.parse(script.textContent || "null");
          const records = Array.isArray(value) ? value : [value];
          return records.flatMap(record => {
            const image = record?.image;
            const images = Array.isArray(image) ? image : image ? [image] : [];
            return images.map(item => typeof item === "string"
              ? {imageUrl:item,jsonLd:true,title:record.name,creator:record.creator?.name}
              : {imageUrl:item?.contentUrl ?? item?.url,jsonLd:true,title:record.name,creator:record.creator?.name});
          });
        } catch { return []; }
      }).filter(item => item.imageUrl).slice(0, 10),
      images: Array.from(document.images).map(image => ({
        url: image.currentSrc || image.src,
        alt: image.alt || "",
        width: image.naturalWidth || 0,
        height: image.naturalHeight || 0
      })).filter(image => image.url && image.width >= 180 && image.height >= 120).slice(0, 40)
    }));
    const finalUrl = page.url();
    await assertSafeRemoteUrl(finalUrl);
    if (!response || response.status() >= 400 || /just a moment|access denied/i.test(pageData.title)) {
      return {status: "provider_unavailable", finalUrl, httpStatus: response?.status() || 0, pageTitle: pageData.title, candidates: []};
    }
    if (!identityMatches(candidate, pageData)) {
      return {status: "identity_conflict", finalUrl, httpStatus: response.status(), pageTitle: pageData.title, candidates: []};
    }
    const identity = {
      title: candidate.title,
      creator: candidate.makerOrCulture,
      accessionNumber: candidate.objectNumber || candidate.identityAnchor,
    };
    const normalizedPage = {
      ...pageData,
      og: pageData.og ? absoluteUrl(pageData.og, finalUrl) : null,
      images: pageData.images.map(image => ({...image, url: absoluteUrl(image.url, finalUrl)})).filter(image => image.url),
    };
    const providerConfig = museumImageProviderConfig(museumId, candidate.identitySourceUrl);
    const manifests = [];
    for (const manifestUrl of pageData.iiifUrls ?? []) {
      try {
        const manifest = await page.evaluate(async url => {
          const response = await fetch(url,{credentials:"include"});
          if (!response.ok) return null;
          const data = await response.json();
          const body = data?.items?.[0]?.items?.[0]?.items?.[0]?.body;
          const service = Array.isArray(body?.service) ? body.service[0] : body?.service;
          return {
            imageUrl: body?.id ?? body?.["@id"] ?? null,
            serviceId: service?.id ?? service?.["@id"] ?? null,
            label: typeof data?.label === "string" ? data.label : data?.label?.en?.[0],
            width: body?.width ?? data?.width ?? 0,
            height: body?.height ?? data?.height ?? 0,
          };
        }, absoluteUrl(manifestUrl,finalUrl));
        if (manifest) manifests.push(manifest);
      } catch {}
    }
    const found = [
      ...(providerConfig.providerOrder.includes("emuseum") ? discoverEmuseum({identity, images: normalizedPage.images}) : []),
      ...(providerConfig.providerOrder.includes("iiif") ? discoverIiif({identity, manifests}) : []),
      ...(providerConfig.providerOrder.includes("collection-api") ? discoverCollectionApi({identity, records:pageData.jsonLdImages}) : []),
      ...discoverGenericHtml({identity, page: normalizedPage}),
    ];
    const hasStrongOfficialCandidate = found.some(item =>
      item.officialObjectRelation && (item.score ?? candidateScore(item)) >= 80);
    if (!hasStrongOfficialCandidate && providerConfig.providerOrder.includes("wikidata-commons")) {
      try {
        const commonsRecords = await searchWikidataCommons({identity});
        found.push(...discoverWikidataCommons({identity, records: commonsRecords}));
      } catch {}
    }
    const unique = new Map();
    for (const item of found) {
      const key = dispatcherIdentity(item.url);
      const existing = unique.get(key);
      if (!existing || (item.score ?? candidateScore(item)) > (existing.score ?? candidateScore(existing))) unique.set(key, item);
    }
    const ranked = [...unique.values()]
      .map(item => ({...item, score: item.score ?? candidateScore(item)}))
      .filter(item => item.score >= 80 || (item.provider === "wikidata-commons" && item.score >= 50))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    if (!ranked.length) return {status: "not_found", finalUrl, httpStatus: response.status(), pageTitle: pageData.title, candidates: []};
    const selected = ranked[0].method === "official_og_image" || ranked.length === 1 || ranked[0].score - ranked[1].score >= 35
      ? ranked[0]
      : null;

    const download = async (item, targetRoot, basename) => {
      const alternatives = [item.url];
      if (/\/full(?:$|[?#])/i.test(item.url)) alternatives.push(item.url.replace(/\/full(?=$|[?#])/i, "/preview"));
      let fetched;
      let usedUrl;
      for (const url of alternatives) {
        try {
          fetched = await fetchSafeImage(url);
          usedUrl = fetched.url;
          break;
        } catch {}
      }
      if (!fetched) throw new Error("all safe image download attempts failed");
      const type = fetched.type;
      const bytes = fetched.bytes;
      const dimensions = await page.evaluate(async ({base64,type}) => {
        const response = await fetch(`data:${type};base64,${base64}`);
        const bitmap = await createImageBitmap(await response.blob());
        return {width: bitmap.width, height: bitmap.height};
      }, {base64: bytes.toString("base64"), type});
      if (dimensions.width < 180 || dimensions.height < 120) throw new Error(`image is too small: ${dimensions.width}x${dimensions.height}`);
      const file = path.join(targetRoot, `${basename}${extension(type)}`);
      await fs.mkdir(path.dirname(file), {recursive: true});
      await fs.writeFile(file, bytes);
      return {file, bytes, type, url: usedUrl, ...dimensions};
    };

    if (selected) {
      try {
        const saved = await download(selected, assetsRoot, candidate.id);
        const hash = sha256(saved.bytes);
        return {
          status: "accepted",
          finalUrl,
          httpStatus: response.status(),
          pageTitle: pageData.title,
          selected: {
            ...selected,
            url: saved.url,
            localPath: rel(saved.file),
            contentType: saved.type,
            width: saved.width,
            height: saved.height,
            sha256: hash,
            evidenceId: `img:${museumId}:${candidate.id}:${hash.slice(0, 12)}`
          },
          candidates: ranked.map(({id, url, method, score}) => ({id, url, method, score}))
        };
      } catch (error) {
        return {status: "broken_image", finalUrl, httpStatus: response.status(), pageTitle: pageData.title, reason: error.message, candidates: ranked};
      }
    }

    const savedCandidates = [];
    for (const [index, item] of ranked.entries()) {
      try {
        const saved = await download(item, path.join(candidateAssetsRoot, candidate.id), `candidate-${index + 1}`);
        savedCandidates.push({
          id: `candidate-${index + 1}`,
          url: item.url,
          method: item.method,
          score: item.score,
          localPath: rel(saved.file),
          contentType: saved.type,
          width: saved.width,
          height: saved.height,
          sha256: sha256(saved.bytes)
        });
      } catch {}
    }
    return {
      status: savedCandidates.length ? "ambiguous_identity" : "broken_image",
      finalUrl,
      httpStatus: response.status(),
      pageTitle: pageData.title,
      candidates: savedCandidates
    };
  } finally { await page.close(); }
};

const records = [];
const startedAt = new Date();
const browser = await chromium.launch({
  headless: true,
  ...(chromePath ? {executablePath: chromePath} : {}),
  args: ["--disable-notifications"],
});
try {
  const queue = [...candidates];
  const worker = async () => {
    while (queue.length) {
      const candidate = queue.shift();
      const itemStarted = Date.now();
      let result;
      try { result = await inspectWithBrowser(browser, candidate); }
      catch (error) { result = {status: "provider_unavailable", reason: error.message, candidates: []}; }
      records.push({
        workId: candidate.id,
        identity: {
          title: candidate.title,
          creator: candidate.makerOrCulture,
          identityAnchor: candidate.identityAnchor,
          accessionNumber: candidate.objectNumber || candidate.identityAnchor,
          officialObjectUrl: candidate.identitySourceUrl,
        },
        ...result,
        resolver: "provider_adapters_v1",
        durationMs: Date.now() - itemStarted,
      });
    }
  };
  await Promise.all(Array.from({length: Math.min(6, queue.length || 1)}, worker));
} finally { await browser.close(); }

const ambiguous = records.filter(record => record.status === "ambiguous_identity" && record.candidates.length);
let modelRun = null;
if (allowModel && ambiguous.length) {
  const modelRoot = path.join(evidenceRoot, "model-run");
  await fs.mkdir(modelRoot, {recursive: true});
  const packetPath = path.join(modelRoot, "image-candidate-packet.json");
  const packet = {
    museumId,
    works: ambiguous.map(record => ({
      workId: record.workId,
      identity: record.identity,
      officialPageTitle: record.pageTitle,
      candidates: record.candidates
    }))
  };
  await fs.writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  const instructionPath = path.join(projectRoot, "research", "meowseum-content-instruction.md");
  const header = {
    runId: descriptor.runId,
    startedAt: new Date().toISOString(),
    stage: "image_disambiguation",
    ...(descriptor.runKind === "production" ? {museumId} : {caseId: descriptor.caseId, targetMuseumId: museumId}),
    works: ambiguous.map(record => ({museumId, workId: record.workId, workIdentity: record.identity})),
    pipelineVersion: manifest.pipelineVersion,
    instructionVersion: manifest.currentVersion,
    executionProfile: {
      model: manifest.modelRouting.image_disambiguation.model,
      reasoningEffort: manifest.modelRouting.image_disambiguation.reasoningEffort,
      runner: "scripts/run-isolated-generation.ps1"
    },
    allowedInputs: [
      {path: rel(instructionPath), role: "content_instruction", sha256: sha256(await fs.readFile(instructionPath))},
      {path: rel(packetPath), role: "image_candidate_packet", sha256: sha256(await fs.readFile(packetPath))}
    ],
    outputs: ["image-decisions.json"],
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "evidence_only"
  };
  await fs.writeFile(path.join(modelRoot, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
  const run = spawnSync("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
    "-File", path.join(projectRoot, "scripts", "run-isolated-generation.ps1"),
    "-ProjectRoot", projectRoot,
    "-RunDirectory", modelRoot
  ], {cwd: projectRoot, encoding: "utf8", timeout: 10 * 60 * 1000});
  if (run.status !== 0) throw new Error(`image disambiguation failed: ${run.stderr || run.stdout}`);
  const decisions = JSON.parse(await fs.readFile(path.join(modelRoot, "image-decisions.json"), "utf8"));
  const decisionItems = decisions.decisions || [];
  if (decisionItems.length !== ambiguous.length || new Set(decisionItems.map(item => item.workId)).size !== decisionItems.length) {
    throw new Error("image disambiguation must return exactly one decision per work");
  }
  for (const decision of decisionItems) {
    if (!["accepted", "ambiguous", "rejected"].includes(decision.status)) throw new Error(`invalid image decision status: ${decision.status}`);
    if (typeof decision.confidence !== "number" || decision.confidence < 0 || decision.confidence > 1) throw new Error(`invalid image decision confidence: ${decision.workId}`);
    const record = records.find(item => item.workId === decision.workId);
    const selected = record?.candidates.find(item => item.id === decision.selectedCandidateId);
    if (!record || decision.status !== "accepted" || !selected) continue;
    const bytes = await fs.readFile(path.join(projectRoot, selected.localPath));
    const target = path.join(assetsRoot, `${record.workId}${extension(selected.contentType)}`);
    await fs.copyFile(path.join(projectRoot, selected.localPath), target);
    const hash = sha256(bytes);
    record.status = "accepted";
    record.selected = {
      ...selected,
      localPath: rel(target),
      evidenceId: `img:${museumId}:${record.workId}:${hash.slice(0, 12)}`,
      decisionMethod: "luna_visual_disambiguation",
      modelConfidence: decision.confidence,
      modelEvidence: decision.evidence
    };
  }
  const result = JSON.parse(await fs.readFile(path.join(modelRoot, "image_disambiguation-result.json"), "utf8"));
  modelRun = {
    runRoot: rel(modelRoot),
    model: result.model,
    reasoningEffort: result.reasoningEffort,
    durationMs: result.modelDurationMs,
    tokens: result.tokenUsage?.total || 0
  };
}

const unresolved = records.filter(record => record.status !== "accepted");
if (unresolved.length) {
  const heroPageUrl = scope.officialCollectionUrl;
  if (heroPageUrl) {
    try {
      const sizingBrowser = await chromium.launch({
        headless: true,
        ...(chromePath ? {executablePath: chromePath} : {}),
      });
      const page = await sizingBrowser.newPage();
      await assertSafeRemoteUrl(heroPageUrl);
      await page.goto(heroPageUrl, {waitUntil: "domcontentloaded", timeout: 30000});
      await assertSafeRemoteUrl(page.url());
      const pageCandidates = await page.evaluate(() => {
        const og = document.querySelector('meta[property="og:image"]')?.content
          || document.querySelector('meta[name="twitter:image"]')?.content;
        const images = Array.from(document.images).map(image => ({
          url: image.currentSrc || image.src,
          alt: image.alt || "",
          width: image.naturalWidth || 0,
          height: image.naturalHeight || 0,
        })).filter(image => image.url && image.width >= 480 && image.height >= 280)
          .sort((a,b) => b.width * b.height - a.width * a.height);
        return [
          ...(og ? [{url: og, alt: "official page social image", score: 1000}] : []),
          ...images.slice(0, 10).map((image,index) => ({...image,score:500-index})),
        ];
      });
      let saved;
      let selectedHero;
      for (const candidate of pageCandidates) {
        const url = absoluteUrl(candidate.url, page.url());
        if (!url || /logo|icon|avatar|ticket|menu/i.test(`${url} ${candidate.alt}`)) continue;
        try {
          saved = await fetchSafeImage(url);
          selectedHero = candidate;
          break;
        } catch {}
      }
      if (!saved) throw new Error("official museum page exposed no safely downloadable hero image");
      const dimensions = await page.evaluate(async ({base64,type}) => {
        const response = await fetch(`data:${type};base64,${base64}`);
        const bitmap = await createImageBitmap(await response.blob());
        return {width: bitmap.width, height: bitmap.height};
      }, {base64: saved.bytes.toString("base64"), type: saved.type});
      await sizingBrowser.close();
      if (dimensions.width < 180 || dimensions.height < 120) throw new Error(`museum hero is too small: ${dimensions.width}x${dimensions.height}`);
      const heroPath = path.join(assetsRoot, `museum-hero-placeholder${extension(saved.type)}`);
      await fs.writeFile(heroPath, saved.bytes);
      const hash = sha256(saved.bytes);
      for (const record of unresolved) {
        record.warnings = [...(record.warnings ?? []), `object image unresolved: ${record.status}`];
        record.originalStatus = record.status;
        record.status = "accepted";
        record.imagePolicy = "museum_hero_placeholder";
        record.selected = {
          url: saved.url,
          localPath: rel(heroPath),
          sha256: hash,
          width: dimensions.width,
          height: dimensions.height,
          contentType: saved.type,
          method: "museum_hero_placeholder",
          provider: "locked_museum_hero",
          identitySignals: ["museum_level_context_only", selectedHero.alt || "official_page_hero"],
          evidenceId: `img:${museumId}:museum-hero:${hash.slice(0, 12)}`,
        };
      }
    } catch (error) {
      for (const record of unresolved) record.warnings = [...(record.warnings ?? []), `museum hero placeholder unavailable: ${error.message}`];
    }
  }
}

const output = {
  schemaVersion: 1,
  stage: "verified_image_evidence",
  museumId,
  pipelineVersion: manifest.pipelineVersion,
  generatedAt: new Date().toISOString(),
  fresh: true,
  legacyAssetInputsRead: false,
  resolver: {
    version: 4,
    browser: chromePath ? "optional Chrome override via Playwright" : "Playwright bundled Chromium",
    modelPolicy: "ambiguity_only",
    model: "gpt-5.6-luna",
    reasoningEffort: "medium"
  },
  summary: {
    works: records.length,
    accepted: records.filter(record => record.status === "accepted").length,
    ambiguous: records.filter(record => record.status === "ambiguous_identity").length,
    unresolved: records.filter(record => record.status !== "accepted" && record.status !== "ambiguous_identity").length,
    wallClockMs: Date.now() - startedAt.getTime(),
    modelCalls: modelRun ? 1 : 0,
    modelTokens: modelRun?.tokens || 0
  },
  modelRun,
  works: records
};
await fs.writeFile(path.join(evidenceRoot, "verified-image-evidence.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`${museumId} image evidence: ${output.summary.accepted}/${output.summary.works} accepted, ${output.summary.ambiguous} ambiguous, ${output.summary.unresolved} unresolved, ${output.summary.modelCalls} model calls`);
