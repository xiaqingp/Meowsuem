import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
import {assertPathInside, loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";

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
const museumId = pool.museum?.id;
if (!/^[a-z][a-z0-9-]*$/.test(museumId || "")) throw new Error("candidate pool has no valid museum id");
if (descriptor.museumId && museumId !== descriptor.museumId) throw new Error("Filesystem contract violation: image evidence museum identity drift");
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

const chromeCandidates = [
  process.env.MEOWSEUM_CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe")
].filter(Boolean);
let chromePath;
for (const candidate of chromeCandidates) {
  try { await fs.access(candidate); chromePath = candidate; break; } catch {}
}
if (!chromePath) throw new Error("Google Chrome was not found; set MEOWSEUM_CHROME");

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

const inspectWithBrowser = async candidate => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: chromePath,
    args: ["--window-position=-32000,-32000", "--disable-notifications"]
  });
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    const response = await page.goto(candidate.identitySourceUrl, {waitUntil: "domcontentloaded", timeout: 30000});
    await page.waitForTimeout(250);
    const pageData = await page.evaluate(() => ({
      title: document.title,
      body: (document.body?.innerText || "").slice(0, 50000),
      og: document.querySelector('meta[property="og:image"]')?.content
        || document.querySelector('meta[name="twitter:image"]')?.content
        || null,
      images: Array.from(document.images).map(image => ({
        url: image.currentSrc || image.src,
        alt: image.alt || "",
        width: image.naturalWidth || 0,
        height: image.naturalHeight || 0
      })).filter(image => image.url && image.width >= 180 && image.height >= 120).slice(0, 40)
    }));
    const finalUrl = page.url();
    if (!response || response.status() >= 400 || /just a moment|access denied/i.test(pageData.title)) {
      return {status: "provider_unavailable", finalUrl, httpStatus: response?.status() || 0, pageTitle: pageData.title, candidates: []};
    }
    if (!identityMatches(candidate, pageData)) {
      return {status: "identity_conflict", finalUrl, httpStatus: response.status(), pageTitle: pageData.title, candidates: []};
    }
    const found = [];
    if (pageData.og) {
      const url = absoluteUrl(pageData.og, finalUrl);
      if (url) found.push({id: "og", url, method: "official_og_image", alt: "", width: 0, height: 0});
    }
    for (const [index, image] of pageData.images.entries()) {
      const url = absoluteUrl(image.url, finalUrl);
      if (url) found.push({id: `img-${index + 1}`, ...image, url, method: "official_rendered_image"});
    }
    const unique = new Map();
    for (const item of found) {
      const key = dispatcherIdentity(item.url);
      const existing = unique.get(key);
      if (!existing || candidateScore(item) > candidateScore(existing)) unique.set(key, item);
    }
    const ranked = [...unique.values()]
      .map(item => ({...item, score: candidateScore(item)}))
      .filter(item => item.score >= 80)
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
        fetched = await page.evaluate(async target => {
          const response = await fetch(target, {credentials: "include"});
          const blob = await response.blob();
          const bitmap = response.ok && blob.type.startsWith("image/") ? await createImageBitmap(blob) : null;
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          return {
            status: response.status,
            type: blob.type,
            width: bitmap?.width || 0,
            height: bitmap?.height || 0,
            base64: String(dataUrl).split(",", 2)[1] || ""
          };
        }, url);
        if (fetched.status < 400 && fetched.type.startsWith("image/")) {
          usedUrl = url;
          break;
        }
      }
      if (fetched.status >= 400) throw new Error(`image returned ${fetched.status}`);
      const type = imageType({"content-type": fetched.type});
      if (!type.startsWith("image/")) throw new Error(`asset is not an image: ${type || "unknown"}`);
      const bytes = Buffer.from(fetched.base64, "base64");
      if (!bytes.length || bytes.length > 30_000_000) throw new Error(`invalid image byte size: ${bytes.length}`);
      const dimensions = {width: fetched.width, height: fetched.height};
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
  } finally {
    await browser.close();
  }
};

const records = [];
const startedAt = new Date();
for (const candidate of pool.candidates) {
  const itemStarted = Date.now();
  let result;
  try {
    result = await inspectWithBrowser(candidate);
  } catch (error) {
    result = {status: "provider_unavailable", reason: error.message, candidates: []};
  }
  records.push({
    workId: candidate.id,
    identity: {
      title: candidate.title,
      artistOrCulture: candidate.makerOrCulture,
      date: candidate.date,
      identityAnchor: candidate.objectNumber || candidate.identityAnchor,
      identitySourceUrl: candidate.identitySourceUrl
    },
    ...result,
    resolver: "official_browser_v1",
    durationMs: Date.now() - itemStarted
  });
}

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
    museumId,
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
    browser: "Google Chrome via Playwright",
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
