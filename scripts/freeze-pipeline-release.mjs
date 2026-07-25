import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const outOfScope = (changed, allowed) => changed.filter(file => !new Set(allowed).has(file));
const releaseDrift = (existing, canonicalFiles, recordSha256) => {
  if (existing.changeControl?.recordSha256 !== recordSha256) return "change record";
  const existingHashes = new Map(existing.canonicalFiles.map(file => [file.path, file.sha256]));
  const drifted = canonicalFiles.find(file => existingHashes.get(file.path) !== file.sha256);
  return drifted?.path;
};
if (process.argv.includes("--self-test")) {
  const rejected = outOfScope(["pipeline.md", "runner.ps1"], ["pipeline.md"]);
  if (rejected.length !== 1 || rejected[0] !== "runner.ps1") throw new Error("change-control self-test failed");
  const sealed = {changeControl: {recordSha256: "record"}, canonicalFiles: [{path: "pipeline.md", sha256: "old"}]};
  if (releaseDrift(sealed, [{path: "pipeline.md", sha256: "new"}], "record") !== "pipeline.md") throw new Error("release immutability self-test failed");
  console.log("pipeline change-control self-test passed: out-of-scope change rejected; frozen release is immutable");
  process.exit(0);
}

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const manifestPath = path.join(root, "research/content-standard-manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const hashFile = async relative =>
  crypto.createHash("sha256").update(await fs.readFile(path.join(root, relative))).digest("hex");
if (!manifest.activePipelineChange) throw new Error("manifest is missing activePipelineChange");
const change = JSON.parse(await fs.readFile(path.join(root, manifest.activePipelineChange), "utf8"));
if (change.status !== "owner_approved" || change.authorizedBy !== "owner" || !change.ownerInstruction?.trim()) {
  throw new Error("pipeline change lacks explicit owner authorization");
}
if (change.targetVersion !== manifest.pipelineVersion) throw new Error("pipeline change target version mismatch");
const baseRelease = JSON.parse(await fs.readFile(path.join(root, change.baseRelease), "utf8"));

const canonicalFiles = [
  { path: manifest.canonicalPipeline },
  { path: manifest.canonicalInstruction, version: manifest.currentVersion },
  { path: manifest.canonicalRunner },
  { path: manifest.canonicalGenerationReporter },
  { path: manifest.canonicalReleaseVerifier },
  { path: manifest.canonicalPublisher },
  { path: manifest.canonicalAssembler },
  { path: manifest.canonicalImageEvidenceResolver },
  { path: manifest.canonicalAssemblyInputPreparer },
  { path: manifest.canonicalFinalizer },
  { path: manifest.canonicalContentVerifier },
  { path: manifest.canonicalSignificanceVerifier },
  { path: manifest.canonicalFutureMuseumVerifier },
  { path: manifest.canonicalStageInputPreparer },
  { path: manifest.canonicalBatchRunner },
  { path: manifest.canonicalAuthorInputPreprocessor },
  { path: manifest.canonicalMechanicalProcessor },
  { path: manifest.canonicalMuseumRatingProcessor },
  { path: manifest.canonicalReleaseFreezer }
];
for (const file of canonicalFiles) file.sha256 = await hashFile(file.path);
const baseHashes = new Map(baseRelease.canonicalFiles.map(file => [file.path, file.sha256]));
const changedCanonicalFiles = canonicalFiles
  .filter(file => baseHashes.get(file.path) !== file.sha256)
  .map(file => file.path);
const unauthorized = outOfScope(changedCanonicalFiles, change.allowedCanonicalFiles);
if (unauthorized.length) throw new Error(`pipeline change exceeds owner-approved scope: ${unauthorized.join(", ")}`);
const changeRecordSha256 = await hashFile(manifest.activePipelineChange);

const baseline = manifest.validation?.acceptedRegression;
const acceptedRegression = baseline?.authorBundleResult
  ? {
      authorBundleResult: baseline.authorBundleResult,
      authorBundleResultSha256: await hashFile(baseline.authorBundleResult),
      successfulRunTokens: baseline.successfulRunTokens,
      reviewerRun: false,
      productionWrite: false
    }
  : undefined;

const release = {
  name: "Meowseum Generation Pipeline",
  version: manifest.pipelineVersion,
  status: manifest.releaseStatus,
  frozenAt: manifest.updatedAt,
  sourceManifest: "research/content-standard-manifest.json",
  canonicalFiles,
  changeControl: {
    id: change.id,
    record: manifest.activePipelineChange,
    recordSha256: changeRecordSha256,
    baseRelease: change.baseRelease,
    changedCanonicalFiles
  },
  executionProfile: manifest.executionProfile,
  modelRouting: manifest.modelRouting,
  stageInstructionViews: manifest.stageInstructionViews,
  stageInputContracts: manifest.stageInputContracts,
  stateMachine: manifest.causalityStages,
  ...(acceptedRegression ? { acceptedRegression } : {})
};

const outputPath = path.resolve(root, manifest.currentRelease);
if (!outputPath.startsWith(`${root}${path.sep}`)) throw new Error("release path escaped project root");
try {
  const existing = JSON.parse(await fs.readFile(outputPath, "utf8"));
  const drift = releaseDrift(existing, canonicalFiles, changeRecordSha256);
  if (drift) throw new Error(`frozen release is immutable; create a new owner-approved version for: ${drift}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(release, null, 2)}\n`, "utf8");
console.log(`pipeline release frozen: ${path.relative(root, outputPath)} (${release.version})`);
