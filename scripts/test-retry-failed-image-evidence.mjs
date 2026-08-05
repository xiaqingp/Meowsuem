import fs from "node:fs/promises";
import syncFs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const arg = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const run = arg("--run") || "research/runs/experiment/chichu-image-resolution-agent-retry/20260727T011500Z-p2.11.5";
const runRoot = path.resolve(root, run);
const read = file => JSON.parse(syncFs.readFileSync(file, "utf8"));
const resolverSource = syncFs.readFileSync(path.join(root, "scripts", "retry-failed-image-evidence.mjs"), "utf8");
const captureSource = syncFs.readFileSync(path.join(root, "scripts", "lib", "page-image-capture.mjs"), "utf8");
if (!resolverSource.includes('args["source-pages"]') || !resolverSource.includes("...extraSourcePages")) throw new Error("image retry must accept additional official source pages without changing parent evidence");
if (!resolverSource.includes('args["retry-accepted"] === "true"') || !resolverSource.includes('retryAccepted && !onlyWorks.size') || !resolverSource.includes('(retryAccepted && work.selected)')) throw new Error("accepted-image retry must be explicit and target named works only");
if (!resolverSource.includes('args["source-image"]') || !resolverSource.includes('candidateId:"explicit-image-001"') || !resolverSource.includes('identityScore:3000')) throw new Error("explicit identity-bound image retry candidate is missing");
if (!resolverSource.includes('element.closest("figure,.image,[role=figure]')) throw new Error("image retry must bind candidates to adjacent image captions before broad article text");
if (!resolverSource.includes("capturePageImageElement") || !captureSource.includes('page.screenshot({type: "png", clip: box})') || captureSource.includes("locator.screenshot({type: \"png\"})") || captureSource.includes("page.screenshot({type: \"png\"})")) {
  throw new Error("page-image capture must use the shared clipped image-container helper, never a locator/full-page screenshot");
}
const evidence = read(path.join(runRoot, "image-evidence", "verified-image-evidence.json"));
const report = read(path.join(runRoot, "reports", "image-retry-report.json"));
const descriptor = read(path.join(runRoot, "run.json"));
if (descriptor.runKind !== "experiment" || descriptor.status !== "verified") throw new Error("retry run is not a verified experiment");
if (report.failedWorksRetried.length !== 5 || report.newlyAccepted.length !== 5 || report.stillUnresolved.length !== 0) throw new Error("retry counts do not match the failed-only contract");
if (evidence.summary.previousAcceptedPreserved !== 5 || evidence.summary.retried !== 5) throw new Error("accepted parent work preservation failed");
if (report.guarantees.nonImageStagesRun.length !== 0 || report.guarantees.imageGenerationModelUsed !== false || report.guarantees.productionModified !== false) throw new Error("image-only or production protection contract failed");
for (const work of evidence.works) {
  if (!work.selected) throw new Error(`missing selected evidence for ${work.workId}`);
  const file = path.join(root, work.selected.localPath);
  await fs.access(file);
  const hash = crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
  if (hash !== work.selected.sha256) throw new Error(`asset hash mismatch for ${work.workId}`);
  if (!work.reusedFromParent && !work.selected.candidateId) throw new Error(`new evidence lacks candidateId for ${work.workId}`);
  if (!work.reusedFromParent && work.selected.url && /^https?:\/\/.*(?:artsandculture|benesse-artsite)\.com\/asset\//i.test(work.selected.url)) throw new Error(`source page was incorrectly accepted as image for ${work.workId}`);
}
const freeze = read(path.join(runRoot, "reports", "blind-run-freeze.json"));
const runHash = crypto.createHash("sha256").update(await fs.readFile(path.join(runRoot, "run.json"))).digest("hex");
if (freeze.hashes["run.json"] !== runHash) throw new Error("blind-run-freeze run.json hash is stale");
console.log(`retry failed-image evidence contract passed: ${evidence.summary.retried} failed works retried, ${evidence.summary.newlyAccepted} new images accepted, ${evidence.summary.previousAcceptedPreserved} parent images preserved`);
