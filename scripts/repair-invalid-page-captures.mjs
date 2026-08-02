import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {loadManifest, projectRelative, resolveCanonicalRun, resolveRunRoot, transitionRunStatus} from "./lib/filesystem-contract.mjs";
import {imageDimensions} from "./lib/two-level-image-resolution.mjs";
import {capturePageImageElement, dismissPageImageOverlays, isInvalidAcceptedCapture, locatePageImageCandidate} from "./lib/page-image-capture.mjs";
import {resolveBrowserExecutable} from "./lib/browser-executable.mjs";
import {assertVerifiedImageEvidence} from "./lib/verified-image-evidence-contract.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const index = value.indexOf("=");
  if (!value.startsWith("--") || index < 0) throw new Error(`Expected --key=value, received ${value}`);
  return [value.slice(2, index), value.slice(index + 1)];
}));
const projectRoot = path.resolve(args["project-root"] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const manifest = await loadManifest(projectRoot);
const parentRunId = args["parent-run-id"];
const museumId = args.museum;
if (!parentRunId || !museumId || !args.case || !args["run-id"]) throw new Error("--parent-run-id, --museum, --case and --run-id are required");
const parentRoot = resolveRunRoot({projectRoot, manifest, runKind: "production", museumId, runId: parentRunId});
const {runRoot, descriptor} = await resolveCanonicalRun({projectRoot, manifest, runKind: "experiment", caseId: args.case, runId: args["run-id"], writable: true});
if (descriptor.targetMuseumId !== museumId) throw new Error("repair run target museum does not match");
const evidencePath = path.join(parentRoot, "image-evidence", "verified-image-evidence.json");
const parentEvidenceBytes = await fs.readFile(evidencePath);
const parentEvidence = JSON.parse(parentEvidenceBytes);
const invalid = parentEvidence.works.filter(work => {
  const candidate = work.page?.candidates?.find(item => item.candidateId === work.selected?.candidateId);
  return isInvalidAcceptedCapture(work.selected, candidate);
});
if (!invalid.length) throw new Error("No invalid accepted page captures were found");

const modules = [process.env.MEOWSEUM_NODE_MODULES, ...(process.env.NODE_PATH || "").split(path.delimiter), path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")].filter(Boolean);
let chromium;
for (const directory of modules) { try { ({chromium} = createRequire(import.meta.url)(path.join(directory, "playwright"))); break; } catch {} }
if (!chromium) throw new Error("Playwright is unavailable; set MEOWSEUM_NODE_MODULES");
const browser = await chromium.launch({headless: true, executablePath: await resolveBrowserExecutable(chromium)});
const assetsRoot = path.join(runRoot, "image-evidence", "assets");
await fs.mkdir(assetsRoot, {recursive: true});
if (descriptor.status === "created") await transitionRunStatus({projectRoot, runRoot, manifest, nextStatus: "running"});
const repaired = [];
try {
  for (const work of invalid) {
    const chosen = work.page.candidates.find(item => item.candidateId === work.selected.candidateId);
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1});
    try {
      await page.goto(work.sourcePageUrl, {waitUntil: "domcontentloaded", timeout: 45000});
      await page.waitForTimeout(1800);
      await dismissPageImageOverlays(page);
      const locator = await locatePageImageCandidate(page, chosen);
      const captured = await capturePageImageElement(page, locator);
      const dimensions = imageDimensions(captured.bytes, "image/png");
      if (!dimensions || dimensions.width < 140 || dimensions.height < 120) throw new Error(`${work.workId}: repaired capture is too small`);
      const file = path.join(assetsRoot, `${work.workId}.png`);
      await fs.writeFile(file, captured.bytes, {flag: "wx"});
      const selected = {
        ...work.selected,
        localPath: projectRelative(projectRoot, file),
        sha256: crypto.createHash("sha256").update(captured.bytes).digest("hex"),
        width: dimensions.width,
        height: dimensions.height,
        capture: {...captured.capture, selector: chosen.selector, elementIndex: chosen.elementIndex ?? null, repairedFromSha256: work.selected.sha256},
      };
      repaired.push({...work, selected, warnings: [], repairedInvalidCapture: true});
    } finally { await page.close(); }
  }
} finally { await browser.close(); }

const hashes = new Set(repaired.map(work => work.selected.sha256));
if (hashes.size !== repaired.length) throw new Error("repaired captures contain duplicate images");
const output = {
  schemaVersion: 2,
  stage: "verified_image_evidence",
  museumId,
  pipelineVersion: manifest.pipelineVersion,
  generatedAt: new Date().toISOString(),
  parentRunId,
  parentEvidencePath: projectRelative(projectRoot, evidencePath),
  parentEvidenceSha256: crypto.createHash("sha256").update(parentEvidenceBytes).digest("hex"),
  resolver: {version: 4, mode: "deterministic_invalid_capture_repair", modelCalls: 0},
  summary: {works: repaired.length, repaired: repaired.length, modelCalls: 0, unresolved: 0},
  works: repaired,
};
assertVerifiedImageEvidence(output);
await fs.writeFile(path.join(runRoot, "image-evidence", "verified-image-evidence.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(runRoot, "reports", "invalid-capture-repair.json"), `${JSON.stringify({
  schemaVersion: 1, museumId, parentRunId, repaired: repaired.map(work => ({workId: work.workId, width: work.selected.width, height: work.selected.height, sha256: work.selected.sha256})), guarantees: {modelCalls: 0, nonImageStagesRun: [], parentRunModified: false},
}, null, 2)}\n`, "utf8");
await transitionRunStatus({projectRoot, runRoot, manifest, nextStatus: "verified"});
process.stdout.write(`${JSON.stringify({status: "verified", repaired: repaired.length, workIds: repaired.map(work => work.workId)}, null, 2)}\n`);
