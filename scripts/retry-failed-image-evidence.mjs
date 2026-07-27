import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
import {loadManifest, projectRelative, resolveCanonicalRun, resolveRunRoot, transitionRunStatus} from "./lib/filesystem-contract.mjs";
import {assertSafeRemoteUrl, fetchSafeImage} from "./image-providers/url-safety.mjs";
import {imageDimensions, sha256} from "./lib/two-level-image-resolution.mjs";
import {capturePageImageElement} from "./lib/page-image-capture.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(value => { if (!value.startsWith("--")) throw new Error(`Expected --key[=value], received ${value}`); const body = value.slice(2); const index = body.indexOf("="); return index < 0 ? [body, "true"] : [body.slice(0, index), body.slice(index + 1)]; }));
const projectRoot = path.resolve(args["project-root"] || path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const parentCase = args["parent-case"] || "chichu-image-resolution-agent-test";
const parentRunId = args["parent-run-id"];
const retryCase = args.case || "chichu-image-resolution-agent-retry";
if (!parentRunId) throw new Error("--parent-run-id is required");
if (args["allow-model"] !== "true") throw new Error("image retry requires explicit --allow-model=true");
const manifest = await loadManifest(projectRoot);
const parentRoot = resolveRunRoot({projectRoot, manifest, runKind: "experiment", caseId: parentCase, runId: parentRunId});
const {runRoot, descriptor} = await resolveCanonicalRun({projectRoot, manifest, runKind: "experiment", caseId: retryCase, runId: args["run-id"], writable: true});
const rel = target => projectRelative(projectRoot, target);
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
const writeJson = async (file, value) => fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const hashFile = async file => crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
const now = () => new Date().toISOString();
const parentEvidencePath = path.join(parentRoot, "image-evidence", "verified-image-evidence.json");
const parentEvidence = await readJson(parentEvidencePath);
const previousEvidenceHash = await hashFile(parentEvidencePath);
const previousWorks = Array.isArray(parentEvidence.works) ? parentEvidence.works : [];
const retryStatuses = new Set(["object_image_unresolved", "provider_unavailable", "candidate_page_found", "image_download_failed", "validation_failed", "ambiguous"]);
const retryWorks = previousWorks.filter(work => retryStatuses.has(work.status) || (!work.selected && work.objectImageResolved !== true));
if (!retryWorks.length) throw new Error("No failed image records were found in the parent evidence");
const acceptedWorks = previousWorks.filter(work => !retryWorks.some(item => item.workId === work.workId));

for (const name of ["scope/scope.json", "candidate-pool/candidate-pool.json", "selection/selection.json", "structure/structure.json"]) await fs.copyFile(path.join(parentRoot, name), path.join(runRoot, name));
const evidenceRoot = path.join(runRoot, "image-evidence");
const assetsRoot = path.join(evidenceRoot, "assets");
const modelRoot = path.join(evidenceRoot, "model-runs", "page-selection");
await fs.mkdir(assetsRoot, {recursive: true}); await fs.mkdir(modelRoot, {recursive: true});
await fs.copyFile(parentEvidencePath, path.join(evidenceRoot, "previous-image-evidence.json"));
if (descriptor.status === "created") await transitionRunStatus({projectRoot, runRoot, manifest, nextStatus: "running"});
else if (descriptor.status !== "running") throw new Error(`retry run must be created or running; received ${descriptor.status}`);

const modules = [process.env.MEOWSEUM_NODE_MODULES, ...(process.env.NODE_PATH || "").split(path.delimiter), path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")].filter(Boolean);
let chromium;
for (const directory of modules) { try { ({chromium} = createRequire(import.meta.url)(path.join(directory, "playwright"))); break; } catch {} }
if (!chromium) throw new Error("Playwright is unavailable; set MEOWSEUM_NODE_MODULES");
const browser = await chromium.launch({headless: true, ...(process.env.MEOWSEUM_CHROME ? {executablePath: process.env.MEOWSEUM_CHROME} : {})});
const absoluteUrl = (value, base) => { try { const url = new URL(value, base); return /^https?:$/.test(url.protocol) ? url.href : null; } catch { return null; } };

async function enumeratePage(sourcePageUrl) {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1});
  const networkImages = [];
  page.on("response", response => { const type = String(response.headers()["content-type"] || "").split(";", 1)[0].toLowerCase(); if (type.startsWith("image/") && /^https?:$/.test(new URL(response.url()).protocol)) networkImages.push({url: response.url(), contentType: type, sourceType: "network_image"}); });
  try {
    await assertSafeRemoteUrl(sourcePageUrl); await page.goto(sourcePageUrl, {waitUntil: "domcontentloaded", timeout: 45000}); await page.waitForTimeout(1800); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1400); await page.evaluate(() => window.scrollTo(0, 0));
    const raw = await page.evaluate(() => {
      const esc = value => { try { return CSS.escape(value); } catch { return String(value).replace(/[^a-zA-Z0-9_-]/g, "_"); } };
      const selector = element => { const parts = []; let current = element; while (current && current.nodeType === 1 && parts.length < 8) { let part = current.tagName.toLowerCase(); if (current.id) { parts.unshift(`${part}#${esc(current.id)}`); break; } const parent = current.parentElement; if (parent) { const siblings = [...parent.children].filter(item => item.tagName === current.tagName); if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`; } parts.unshift(part); current = parent; } return parts.join(" > "); };
      const box = element => { const rect = element.getBoundingClientRect(); return {x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height)}; };
      const visible = element => { const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"; };
      const nearby = element => (element.closest("figure,article,[role=figure],section,main")?.innerText || element.parentElement?.innerText || "").trim().slice(0, 800);
      const items = []; const add = (candidateType, url, element, extra = {}) => { if (!url || (!/^https?:/i.test(url) && !(candidateType === "page_image_element" && /^blob:/i.test(url)))) return; items.push({candidateType, url: /^blob:/i.test(url) ? null : url, selector: element ? selector(element) : null, alt: element?.alt || "", nearbyText: element ? nearby(element) : "", visible: element ? visible(element) : false, boundingBox: element ? box(element) : null, naturalWidth: element?.naturalWidth || 0, naturalHeight: element?.naturalHeight || 0, ...extra}); };
      const largestSrc = element => { const raw = element.srcset || element.getAttribute("data-srcset") || ""; const values = raw.split(",").map(value => { const [url, descriptor] = value.trim().split(/\s+/); const scale = descriptor?.endsWith("w") ? Number(descriptor.slice(0, -1)) : descriptor?.endsWith("x") ? Number(descriptor.slice(0, -1)) * 1000 : 0; return {url, scale}; }).filter(item => item.url); return values.sort((a, b) => b.scale - a.scale)[0]?.url || null; };
      document.querySelectorAll("img").forEach((element, elementIndex) => { const url = largestSrc(element) || element.currentSrc || element.src || element.getAttribute("data-src") || element.getAttribute("data-lazy-src"); add(/^blob:/i.test(url || "") ? "page_image_element" : "direct_image", url, element, {elementKind: "img", elementIndex}); });
      document.querySelectorAll("picture source").forEach(element => add("direct_image", (element.srcset || "").split(",")[0].trim().split(" ")[0], element.parentElement?.querySelector("img") || element, {elementKind: "picture_source"}));
      document.querySelectorAll("[style*='background-image']").forEach(element => { const match = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/i); if (match) add("direct_image", match[1], element, {elementKind: "css_background"}); });
      document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(element => add("direct_image", element.content, null, {elementKind: "meta"}));
      document.querySelectorAll('script[type="application/ld+json"]').forEach(script => { try { const parsed = JSON.parse(script.textContent || "null"); for (const item of Array.isArray(parsed) ? parsed : [parsed]) { const image = typeof item?.image === "string" ? item.image : item?.image?.url || item?.image?.contentUrl; if (image) add("direct_image", image, null, {elementKind: "jsonld", jsonLdName: item?.name || "", jsonLdCreator: item?.creator?.name || item?.creator || ""}); } } catch {} });
      return {title: document.title || "", url: location.href, bodyText: (document.body?.innerText || "").slice(0, 12000), items};
    });
    const deduped = []; const seen = new Set();
    for (const item of [...raw.items, ...networkImages]) { const url = item.url ? absoluteUrl(item.url, raw.url) : null; const identity = `${item.selector || ""}|${url || "page-element"}|${item.candidateType || ""}`; if (seen.has(identity)) continue; seen.add(identity); const generic = /logo|icon|avatar|favicon|header|footer|banner|hero|menu|ticket|artist[_-]?monet|artist[_-]?turrell|artist[_-]?demaria|app[-_]?download|badge|qr[-_]?code|g\.gif|\.svg|\/\d+px-|resize=\d+%2C\d+/i.test(`${url || ""} ${item.alt || ""} ${item.nearbyText || ""}`); deduped.push({...item, url, genericPenalty: generic ? 1 : 0}); }
    const usable = deduped.filter(item => !item.genericPenalty && ((item.naturalWidth || 0) >= 180 && (item.naturalHeight || 0) >= 120 || (item.boundingBox?.width || 0) >= 180 && (item.boundingBox?.height || 0) >= 120 || item.sourceType === "network_image" || /lh3\.googleusercontent\.com|upload\.wikimedia\.org|wp-content\/uploads/i.test(item.url || "")));
    const usableOrdered = [...usable].sort((a, b) => {
      const elementBias = (b.candidateType === "page_image_element" ? 1 : 0) - (a.candidateType === "page_image_element" ? 1 : 0);
      if (elementBias) return elementBias;
      const networkBias = (b.sourceType === "network_image" ? 1 : 0) - (a.sourceType === "network_image" ? 1 : 0);
      if (networkBias) return networkBias;
      return ((b.naturalWidth || 0) * (b.naturalHeight || 0)) - ((a.naturalWidth || 0) * (a.naturalHeight || 0));
    });
    const ordered = [...usableOrdered, ...deduped.filter(item => !usable.includes(item) && !item.genericPenalty), ...deduped.filter(item => item.genericPenalty)].slice(0, 5);
    return {sourcePageUrl, finalUrl: raw.url, pageTitle: raw.title, bodyText: raw.bodyText, candidateCount: deduped.length, candidates: ordered.map((item, index) => ({candidateId: `page-image-${String(index + 1).padStart(3, "0")}`, ...item, sourcePageUrl: raw.url}))};
  } catch (error) { return {sourcePageUrl, finalUrl: null, pageTitle: "", bodyText: "", candidateCount: 0, candidates: [], error: error.message}; }
  finally { await page.close(); }
}

const enumerated = [];
for (const work of retryWorks) { const sourcePageUrl = work.aiResult?.selectedCandidate?.sourcePageUrl || work.fastPath?.finalUrl || work.identity?.identitySourceUrl || work.identity?.officialObjectUrl; enumerated.push({workId: work.workId, identity: work.identity, sourcePageUrl, page: await enumeratePage(sourcePageUrl)}); }
const packetPath = path.join(modelRoot, "image-research-packet.json");
const packet = {schemaVersion: 2, stage: "image_page_selection_retry", museumId: parentEvidence.museumId, parentEvidencePath: rel(parentEvidencePath), parentEvidenceSha256: previousEvidenceHash, works: enumerated.map(item => ({workId: item.workId, identity: item.identity, sourcePageUrl: item.sourcePageUrl, page: {sourcePageUrl: item.page.sourcePageUrl, finalUrl: item.page.finalUrl, pageTitle: item.page.pageTitle, bodyText: item.page.bodyText, candidateCount: item.page.candidateCount}, candidates: item.page.candidates}))};
await writeJson(packetPath, packet);
await writeJson(path.join(modelRoot, "run-header.json"), {runId: descriptor.runId, startedAt: now(), stage: "image_disambiguation", imageResearchMode: "page_selection_v2", caseId: descriptor.caseId, targetMuseumId: parentEvidence.museumId, pipelineVersion: manifest.pipelineVersion, instructionVersion: manifest.currentVersion, executionProfile: manifest.modelRouting.image_disambiguation, allowedInputs: [{path: rel(packetPath), role: "image_candidate_packet", sha256: await hashFile(packetPath)}], outputs: ["image-decisions.json"], reviewer: "disabled", retry: "failed_images_only", publicationBoundary: "evidence_only"});
const runner = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", path.join(projectRoot, "scripts", "run-isolated-generation.ps1"), "-ProjectRoot", projectRoot, "-RunDirectory", modelRoot], {cwd: projectRoot, encoding: "utf8", timeout: 30 * 60 * 1000});
if (runner.status !== 0) { await transitionRunStatus({projectRoot, runRoot, manifest, nextStatus: "failed"}).catch(() => {}); throw new Error(`image page selection model failed: ${runner.stderr || runner.stdout}`); }
const cleanModelText = value => {
  if (typeof value === "string") return value.replace(/(?:\\r\\n|\\n|\\r|[\r\n])+/g, "").replace(/\s{2,}/g, " ");
  if (Array.isArray(value)) return value.map(cleanModelText);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key.replace(/[\r\n]+/g, ""), cleanModelText(item)]));
  return value;
};
const aiOutput = cleanModelText(await readJson(path.join(modelRoot, "image-decisions.json")));
if (aiOutput.schemaVersion !== 2 || !Array.isArray(aiOutput.works) || aiOutput.works.length !== retryWorks.length) throw new Error("page selection model must return schemaVersion 2 and exactly one result per retried work");
const byWork = new Map(aiOutput.works.map(item => [item.workId, item])); const retryResults = [];
for (const item of enumerated) {
  const decision = byWork.get(item.workId); const pageInfo = item.page; const result = {workId: item.workId, identity: item.identity, sourcePageUrl: item.sourcePageUrl, page: pageInfo, status: "object_image_unresolved", objectImageResolved: false, imagePolicy: "none", selected: null, aiDecision: decision || null, warnings: [], retried: true};
  if (!decision || decision.status !== "candidate_found" || !decision.selectedImage?.candidateId) { result.warnings.push(...(decision?.limitations || ["AI did not select a candidateId"])); retryResults.push(result); continue; }
  const chosen = pageInfo.candidates.find(candidate => candidate.candidateId === decision.selectedImage.candidateId); if (!chosen) { result.warnings.push(`AI candidateId not found in enumerated page candidates: ${decision.selectedImage.candidateId}`); retryResults.push(result); continue; }
  const role = decision.selectedImage.imageRole || "unknown"; if (role === "museum_only") { result.warnings.push("museum_only candidate is not accepted as a work image"); retryResults.push(result); continue; }
  try {
    let imageUrl = chosen.url;
    if (decision.selectedImage.candidateType === "page_image_element" && chosen.selector) {
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1});
      await page.goto(pageInfo.finalUrl || item.sourcePageUrl, {waitUntil: "domcontentloaded", timeout: 45000});
      await page.waitForTimeout(1200);
      let locator = page.locator(chosen.selector);
      if (await locator.count() !== 1 && Number.isInteger(chosen.elementIndex)) locator = page.locator("img").nth(chosen.elementIndex);
      if (await locator.count() !== 1) throw new Error("page image element selector was not unique");
      await locator.scrollIntoViewIfNeeded();
      const currentUrl = await locator.evaluate(element => element.currentSrc || element.src || element.getAttribute("data-src") || null);
      if (currentUrl && /^https?:/i.test(currentUrl)) imageUrl = absoluteUrl(currentUrl, page.url());
      else {
        const captured = await capturePageImageElement(page, locator);
        const bytes = captured.bytes;
        const dims = imageDimensions(bytes, "image/png");
        const file = path.join(assetsRoot, `${item.workId}.png`);
        await fs.writeFile(file, bytes, {flag: "wx"});
        const hash = sha256(bytes);
        const context = item.identity.objectType === "museum_level_context" || ["context_view", "architecture_view"].includes(role);
        result.status = context ? "context_image_accepted" : "object_image_accepted";
        result.objectImageResolved = !context;
        result.imagePolicy = context ? "context_image" : "object_image";
        result.selected = {url: null, sourcePageUrl: page.url(), sourceType: "page_image_element", caption: decision.selectedImage.caption || "", identityEvidence: decision.selectedImage.identityEvidence || [], confidence: decision.selectedImage.confidence ?? null, localPath: rel(file), sha256: hash, width: dims.width, height: dims.height, contentType: "image/png", method: "ai_page_element_capture", provider: "browser-fallback", imageRole: role, candidateId: chosen.candidateId, capture: {...captured.capture, selector: chosen.selector, elementIndex: chosen.elementIndex ?? null}};
        await page.close();
        retryResults.push(result);
        continue;
      }
      await page.close();
    }
    if (!imageUrl) throw new Error("selected page candidate has no image resource"); await assertSafeRemoteUrl(imageUrl); const fetched = await fetchSafeImage(imageUrl); const bytes = (() => { const input = fetched.bytes; const signatures = [Buffer.from([0xff, 0xd8, 0xff]), Buffer.from("PNG"), Buffer.from("GIF"), Buffer.from("RIFF"), Buffer.from("II"), Buffer.from("MM")]; const offset = signatures.map(signature => input.indexOf(signature)).filter(index => index >= 0).sort((a, b) => a - b)[0]; return offset > 0 && offset < 32 ? input.subarray(offset) : input; })(); const dimensions = imageDimensions(bytes, fetched.type); if (!dimensions || dimensions.width < 140 || dimensions.height < 120) throw new Error("image dimensions are missing or too small");
    const file = path.join(assetsRoot, `${item.workId}${fetched.type === "image/png" ? ".png" : fetched.type === "image/webp" ? ".webp" : ".jpg"}`); await fs.writeFile(file, bytes, {flag: "wx"}); const hash = sha256(bytes); const context = item.identity.objectType === "museum_level_context" || ["context_view", "architecture_view"].includes(role); result.status = context ? "context_image_accepted" : "object_image_accepted"; result.objectImageResolved = !context; result.imagePolicy = context ? "context_image" : "object_image"; result.selected = {url: fetched.url, sourcePageUrl: item.sourcePageUrl, sourceType: chosen.sourceType || "page_image", caption: decision.selectedImage.caption || "", identityEvidence: decision.selectedImage.identityEvidence || [], confidence: decision.selectedImage.confidence ?? null, localPath: rel(file), sha256: hash, width: dimensions.width, height: dimensions.height, contentType: fetched.type, method: "ai_page_candidate_download", provider: "page-image-candidate", imageRole: role, candidateId: chosen.candidateId};
  } catch (error) { result.warnings.push(`selected candidate processing failed: ${error.message}`); }
  retryResults.push(result);
}
await browser.close();
const retryById = new Map(retryResults.map(item => [item.workId, item]));
const finalWorks = previousWorks.map(previous => { const replacement = retryById.get(previous.workId); return replacement || {...previous, reusedFromParent: true, parentEvidencePath: rel(parentEvidencePath), parentEvidenceSha256: previousEvidenceHash}; });
const duplicateHashes = new Map(); for (const work of finalWorks) { if (work.status !== "object_image_accepted" || !work.selected?.sha256) continue; const list = duplicateHashes.get(work.selected.sha256) || []; list.push(work.workId); duplicateHashes.set(work.selected.sha256, list); }
const duplicateObjectImageGroups = [...duplicateHashes.entries()].filter(([, ids]) => ids.length > 1).map(([hash, workIds]) => ({sha256: hash, workIds})); if (duplicateObjectImageGroups.length) throw new Error(`duplicate object image SHA detected: ${JSON.stringify(duplicateObjectImageGroups)}`);
const modelResult = await readJson(path.join(modelRoot, "image_disambiguation-result.json"));
const runnerLogText = await fs.readFile(path.join(modelRoot, "runner.log"), "utf8").catch(() => "");
const webSearchCount = (runnerLogText.match(/^web search:/gim) || []).length;
const evidence = {schemaVersion: 2, stage: "verified_image_evidence", museumId: parentEvidence.museumId, pipelineVersion: manifest.pipelineVersion, generatedAt: now(), parentRunId, parentEvidencePath: rel(parentEvidencePath), parentEvidenceSha256: previousEvidenceHash, resolver: {version: 2, mode: "page_image_selection_retry", fastPath: "none_for_retry", modelPolicy: "failed_images_only", model: modelResult.model, reasoningEffort: modelResult.reasoningEffort}, summary: {works: finalWorks.length, previousAcceptedPreserved: acceptedWorks.length, retried: retryResults.length, newlyAccepted: retryResults.filter(work => work.selected).length, directImageDownloads: retryResults.filter(work => work.selected?.method === "ai_page_candidate_download").length, elementCaptures: retryResults.filter(work => work.selected?.method === "ai_page_element_capture").length, objectImageAccepted: finalWorks.filter(work => work.status === "object_image_accepted").length, contextImagesAccepted: finalWorks.filter(work => work.status === "context_image_accepted").length, unresolved: finalWorks.filter(work => work.status === "object_image_unresolved" || !work.selected).length, duplicateObjectImageGroups, modelCalls: 1, modelTokens: modelResult.tokenUsage?.total || 0, webSearchCount}, modelRun: {runRoot: rel(modelRoot), model: modelResult.model, reasoningEffort: modelResult.reasoningEffort, durationMs: modelResult.modelDurationMs, tokens: modelResult.tokenUsage?.total || 0, webSearchCount}, works: finalWorks};
await writeJson(path.join(evidenceRoot, "verified-image-evidence.json"), evidence);
const report = {schemaVersion: 1, stage: "image_evidence_retry", runId: descriptor.runId, runRoot: rel(runRoot), parentRunRoot: rel(parentRoot), parentEvidenceSha256: previousEvidenceHash, failedWorksRetried: retryWorks.map(work => ({workId: work.workId, priorStatus: work.status, priorFailure: work.warnings || [], sourcePageUrl: work.aiResult?.selectedCandidate?.sourcePageUrl || null})), newlyAccepted: retryResults.filter(work => work.selected).map(work => ({workId: work.workId, sourcePageUrl: work.selected.sourcePageUrl, imageUrl: work.selected.url, localPath: work.selected.localPath, sha256: work.selected.sha256, method: work.selected.method, imageRole: work.selected.imageRole, candidateId: work.selected.candidateId})), stillUnresolved: retryResults.filter(work => !work.selected).map(work => ({workId: work.workId, sourcePageUrl: work.sourcePageUrl, warnings: work.warnings})), counts: evidence.summary, model: {model: modelResult.model, reasoningEffort: modelResult.reasoningEffort, calls: 1, durationMs: modelResult.modelDurationMs, tokens: modelResult.tokenUsage || null, webSearchCount}, guarantees: {acceptedWorksNotRerun: acceptedWorks.map(work => work.workId), nonImageStagesRun: [], imageGenerationModelUsed: false, parentRunModified: false, assemblyNetworkAccess: false, productionModified: false}};
await writeJson(path.join(runRoot, "reports", "image-retry-report.json"), report);
const mdLines = ["# Chichu failed-image retry", "", `- Run: ${rel(runRoot)}`, `- Parent: ${rel(parentRoot)}`, `- Retried: ${retryResults.length}`, `- Newly accepted: ${report.newlyAccepted.length}`, `- Still unresolved: ${report.stillUnresolved.length}`, `- Model: ${modelResult.model} (${modelResult.reasoningEffort})`, `- Raw tokens: ${modelResult.tokenUsage?.total ?? "unavailable"}`, "- Non-image stages: none", "", "## Newly accepted", ...report.newlyAccepted.map(item => `- ${item.workId}: ${item.method}; source page ${item.sourcePageUrl}; image ${item.imageUrl || "element capture"}; ${item.localPath}`), "", "## Still unresolved", ...report.stillUnresolved.map(item => `- ${item.workId}: ${item.warnings.join("; ")}`)];
await fs.writeFile(path.join(runRoot, "reports", "image-retry-report.md"), `${mdLines.join("\n")}\n`, "utf8");
const descriptorForCompletion = await readJson(path.join(runRoot, "run.json"));
await writeJson(path.join(runRoot, "run.json"), {...descriptorForCompletion, parentRunId, parentRunRoot: rel(parentRoot), retryPolicy: "failed_images_only", imageStageStatus: "mechanical_image_stage_completed", retriedWorks: retryResults.map(work => work.workId), previousAcceptedPreserved: acceptedWorks.map(work => work.workId), modelCalls: 1, modelTokens: modelResult.tokenUsage?.total || 0, webSearchCount});
await transitionRunStatus({projectRoot, runRoot, manifest, nextStatus: "verified"});
const freeze = {schemaVersion: 1, runId: descriptor.runId, runRoot: ".", generatedAt: now(), hashes: {}};
for (const relative of ["run.json", "scope/scope.json", "candidate-pool/candidate-pool.json", "selection/selection.json", "structure/structure.json", "image-evidence/previous-image-evidence.json", "image-evidence/verified-image-evidence.json", "image-evidence/model-runs/page-selection/image-research-packet.json", "image-evidence/model-runs/page-selection/image-decisions.json", "image-evidence/model-runs/page-selection/image_disambiguation-result.json", "reports/image-retry-report.json", "reports/image-retry-report.md"]) { const file = path.join(runRoot, relative); if (await fs.access(file).then(() => true).catch(() => false)) freeze.hashes[relative] = await hashFile(file); }
await writeJson(path.join(runRoot, "reports", "blind-run-freeze.json"), freeze);
console.log(JSON.stringify({runRoot: rel(runRoot), retried: retryResults.length, newlyAccepted: report.newlyAccepted.length, unresolved: report.stillUnresolved.length, model: modelResult.model, tokens: modelResult.tokenUsage?.total || 0}, null, 2));
