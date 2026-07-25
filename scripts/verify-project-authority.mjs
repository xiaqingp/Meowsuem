import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const read = relative => fs.readFile(path.join(root, relative), "utf8");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const failures = [];

const required = [
  "coho_museum/PRD.md",
  "coho_museum/TechDesign.md",
  "research/README.md",
  "research/meowseum-content-instruction.md",
  "research/generation-pipeline.md",
  "research/content-standard-manifest.json",
  "scripts/report-museum-generation.mjs",
  "scripts/assemble-museum-candidate.mjs",
  "scripts/finalize-museum.mjs",
  "scripts/verify-future-museum-contract.mjs",
  "scripts/prepare-museum-stage-inputs.mjs",
  "scripts/run-generation-batch.mjs",
  "scripts/verify-release-candidate.mjs",
  "scripts/publish-museum-candidate.mjs"
];
for (const file of required) {
  try { await fs.access(path.join(root, file)); }
  catch { failures.push(`missing authority file: ${file}`); }
}

const manifest = JSON.parse(await read("research/content-standard-manifest.json"));
if (manifest.canonicalInstruction !== "research/meowseum-content-instruction.md") failures.push("manifest canonical instruction drift");
if (manifest.canonicalPipeline !== "research/generation-pipeline.md") failures.push("manifest canonical pipeline drift");
if (manifest.canonicalRunner !== "scripts/run-isolated-generation.ps1") failures.push("manifest canonical runner drift");
if (manifest.canonicalGenerationReporter !== "scripts/report-museum-generation.mjs") failures.push("manifest generation reporter drift");
if (manifest.canonicalReleaseVerifier !== "scripts/verify-release-candidate.mjs") failures.push("manifest release verifier drift");
if (manifest.canonicalPublisher !== "scripts/publish-museum-candidate.mjs") failures.push("manifest publisher drift");
if (manifest.canonicalAssembler !== "scripts/assemble-museum-candidate.mjs") failures.push("manifest assembler drift");
if (manifest.canonicalFinalizer !== "scripts/finalize-museum.mjs") failures.push("manifest finalizer drift");
if (manifest.canonicalContentVerifier !== "scripts/verify-content-pipeline.mjs") failures.push("manifest content verifier drift");
if (manifest.canonicalSignificanceVerifier !== "scripts/verify-significance-evidence.mjs") failures.push("manifest significance verifier drift");
if (manifest.canonicalFutureMuseumVerifier !== "scripts/verify-future-museum-contract.mjs") failures.push("manifest future museum verifier drift");
if (manifest.canonicalStageInputPreparer !== "scripts/prepare-museum-stage-inputs.mjs") failures.push("manifest stage input preparer drift");
if (manifest.canonicalBatchRunner !== "scripts/run-generation-batch.mjs") failures.push("manifest batch runner drift");
if (manifest.canonicalMuseumRatingProcessor !== "scripts/process-museum-rating.mjs") failures.push("manifest museum rating processor drift");
if (manifest.canonicalReleaseFreezer !== "scripts/freeze-pipeline-release.mjs") failures.push("manifest release freezer drift");
if (!manifest.pipelineVersion || !manifest.currentVersion || !manifest.currentRelease || !manifest.activePipelineChange) failures.push("manifest current state is incomplete");

const release = JSON.parse(await read(manifest.currentRelease));
if (release.version !== manifest.pipelineVersion || release.status !== manifest.releaseStatus) failures.push("current pipeline release drift");
if (release.sourceManifest !== "research/content-standard-manifest.json") failures.push("release source manifest drift");
if (JSON.stringify(release.stageInputContracts) !== JSON.stringify(manifest.stageInputContracts)) failures.push("release input contract drift");
for (const locked of release.canonicalFiles) {
  const actual = sha256(await fs.readFile(path.join(root, locked.path)));
  if (actual !== locked.sha256) failures.push(`pipeline release hash drift: ${locked.path}`);
}
const change = JSON.parse(await read(manifest.activePipelineChange));
if (change.status !== "owner_approved" || change.authorizedBy !== "owner" || !change.ownerInstruction?.trim()) failures.push("active pipeline change lacks owner authorization");
if (change.targetVersion !== manifest.pipelineVersion) failures.push("active pipeline change target version drift");
if (release.changeControl?.record !== manifest.activePipelineChange) failures.push("release change record drift");
else if (sha256(await fs.readFile(path.join(root, manifest.activePipelineChange))) !== release.changeControl.recordSha256) failures.push("release change record hash drift");
const acceptedResult = release.acceptedRegression;
if (acceptedResult) {
  const acceptedResultHash = sha256(await fs.readFile(path.join(root, acceptedResult.authorBundleResult)));
  if (acceptedResultHash !== acceptedResult.authorBundleResultSha256) failures.push("accepted regression bundle hash drift");
}

const activeFromManifest = new Set(Object.values(manifest.museums).map(item => item.contentFile));
const rootFiles = await fs.readdir(root, {withFileTypes: true});
const activeFromFrontend = new Set();
for (const entry of rootFiles) {
  if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
  const source = await read(entry.name);
  for (const match of source.matchAll(/["']?contentFile["']?\s*:\s*["']\.\/(research\/[^"']+)["']/g)) activeFromFrontend.add(match[1]);
}
for (const file of activeFromManifest) if (!activeFromFrontend.has(file)) failures.push(`manifest content is not referenced by frontend: ${file}`);
for (const file of activeFromFrontend) if (!activeFromManifest.has(file)) failures.push(`frontend content is not registered in manifest: ${file}`);

const retired = [
  "research/content-method-v2.md",
  "research/louvre-content-prototype.md",
  "research/louvre-content-test-v2.md",
  "research/louvre-content-v3.md",
  "research/louvre-new-content-v1.md",
  "research/vienna-content-v1.md",
  "research/egyptian-content-v1.md",
  "research/m22-pipeline-contract.md"
];
for (const file of retired) {
  const source = await read(file);
  if (!/(RETIRED|历史|Superseded|取代)/i.test(source.slice(0, 600))) failures.push(`retired file lacks a clear non-authoritative banner: ${file}`);
}

for (const failure of failures) console.error(`- ${failure}`);
if (failures.length) process.exitCode = 1;
else console.log(`project authority gate passed: ${activeFromManifest.size} active content files, pipeline ${manifest.pipelineVersion}, ${retired.length} retired sources marked`);
