import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  authorizePipelineContinuation,
  assertPathInside,
  assertResearchRootHygiene,
  assertWritableRun,
  isRunPipelineVersionAllowed,
  loadManifest,
  readAndValidateRunDescriptor,
  resolveRunRoot,
  transitionRunStatus,
} from "./lib/filesystem-contract.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-contract-"));
const manifest = {
  pipelineVersion: "2.9.0",
  currentVersion: "2.2.0",
  filesystemContract: {
    version: 1,
    activeContentRoot: "research/content",
    evidenceRoot: "research/evidence",
    productionRunRoot: "research/runs/production",
    regressionRunRoot: "research/runs/regression",
    experimentRunRoot: "research/runs/experiment",
    pipelineRoot: "research/pipeline",
    archiveRoot: "research/archive",
    migrationRoot: "research/migrations",
    allowedRunKinds: ["production", "regression", "experiment"],
    runIdPattern: "^[0-9]{8}T[0-9]{6}Z-p[0-9]+\\.[0-9]+\\.[0-9]+$",
    activeContentPattern: "^research/content/[a-z][a-z0-9-]*\\.md$",
    generatedFilesForbiddenInResearchRoot: true,
    runDescriptor: "run.json",
    currentLayoutVersion: 1,
    immutableStatuses: ["accepted", "published", "superseded"],
  },
};

try {
  await fs.mkdir(path.join(root, "research", "runs", "production", "seattle"), { recursive: true });
  await fs.writeFile(
    path.join(root, "research", "content-standard-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const loaded = await loadManifest(root);
  const runId = "20260725T151500Z-p2.9.0";
  const runRoot = resolveRunRoot({
    projectRoot: root,
    manifest: loaded,
    runKind: "production",
    museumId: "seattle",
    runId,
  });
  await fs.mkdir(runRoot, { recursive: true });
  const descriptor = {
    schemaVersion: 1,
    filesystemContractVersion: 1,
    runKind: "production",
    runId,
    museumId: "seattle",
    pipelineVersion: "2.9.0",
    instructionVersion: "2.2.0",
    status: "running",
    layoutVersion: 1,
    immutable: false,
  };
  await fs.writeFile(path.join(runRoot, "run.json"), `${JSON.stringify(descriptor, null, 2)}\n`);
  assert.equal((await readAndValidateRunDescriptor(runRoot, loaded, root)).museumId, "seattle");
  assert.equal(assertWritableRun(descriptor, loaded).status, "running");
  assert.throws(() => assertWritableRun({ ...descriptor, status: "accepted" }, loaded), /immutable/);
  const patchedManifest = {...loaded, pipelineVersion: "2.9.1"};
  await assert.rejects(() => readAndValidateRunDescriptor(runRoot, patchedManifest, root), /does not match/);
  const continued = await authorizePipelineContinuation({
    projectRoot: root,
    manifest: patchedManifest,
    runKind: "production",
    museumId: "seattle",
    runId,
    fromStage: "image_evidence",
    timestamp: new Date("2026-07-25T15:20:30.000Z"),
  });
  assert.equal(continued.descriptor.pipelineContinuation.fromVersion, "2.9.0");
  assert.equal(continued.descriptor.pipelineContinuation.toVersion, "2.9.1");
  assert.equal(
    (await readAndValidateRunDescriptor(runRoot, patchedManifest, root)).pipelineContinuation.fromStage,
    "image_evidence",
  );
  assert.equal(isRunPipelineVersionAllowed("2.9.1", continued.descriptor), true);
  assert.equal(isRunPipelineVersionAllowed("9.9.9", continued.descriptor), false);
  const repatched = await authorizePipelineContinuation({
    projectRoot: root,
    manifest: {...patchedManifest, pipelineVersion: "2.9.2"},
    runKind: "production",
    museumId: "seattle",
    runId,
    fromStage: "image_evidence",
  });
  assert.deepEqual(repatched.descriptor.pipelineContinuation.priorTargets, ["2.9.1"]);
  await fs.writeFile(path.join(runRoot, "run.json"), `${JSON.stringify({...repatched.descriptor, status: "failed"}, null, 2)}\n`);
  const resumedFailure = await authorizePipelineContinuation({
    projectRoot: root,
    manifest: {...patchedManifest, pipelineVersion: "2.9.2"},
    runKind: "production",
    museumId: "seattle",
    runId,
    fromStage: "image_evidence",
  });
  assert.equal(resumedFailure.descriptor.status, "running");
  const verified = await transitionRunStatus({
    projectRoot: root,
    runRoot,
    manifest: loaded,
    nextStatus: "verified",
    timestamp: new Date("2026-07-25T15:20:00.000Z"),
  });
  assert.equal(verified.status, "verified");
  assert.equal(verified.immutable, false);
  const published = await transitionRunStatus({
    projectRoot: root,
    runRoot,
    manifest: loaded,
    nextStatus: "published",
    timestamp: new Date("2026-07-25T15:21:00.000Z"),
  });
  assert.equal(published.status, "published");
  assert.equal(published.immutable, true);
  assert.throws(() => assertWritableRun(published, loaded), /immutable/);
  assert.throws(
    () =>
      resolveRunRoot({
        projectRoot: root,
        manifest: loaded,
        runKind: "production",
        museumId: "../escape",
        runId,
      }),
    /museumId/,
  );
  await assert.rejects(() => assertPathInside(runRoot, path.join(root, "outside")), /outside/);

  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-outside-"));
  const junction = path.join(runRoot, "junction");
  try {
    await fs.symlink(outside, junction, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(() => assertPathInside(runRoot, path.join(junction, "escaped.json")), /outside/);
  } finally {
    await fs.rm(junction, { force: true, recursive: true });
    await fs.rm(outside, { force: true, recursive: true });
  }

  for (const name of [
    "README.md",
    "generation-pipeline.md",
    "meowseum-content-instruction.md",
    "significance-evidence-v1.6.0.json",
    "user-taste-profile.md",
  ]) {
    await fs.writeFile(path.join(root, "research", name), "");
  }
  for (const name of ["content", "evidence", "pipeline", "migrations", "archive"]) {
    await fs.mkdir(path.join(root, "research", name), { recursive: true });
  }
  await assertResearchRootHygiene(root, loaded);
  await fs.mkdir(path.join(root, "research", "m29"));
  await assert.rejects(() => assertResearchRootHygiene(root, loaded), /m29/);
  await fs.rm(path.join(root, "research", "m29"), { recursive: true });
  await fs.writeFile(path.join(root, "research", "seattle-content-v4.md"), "");
  await assert.rejects(() => assertResearchRootHygiene(root, loaded), /seattle-content-v4/);
  process.stdout.write("filesystem contract tests passed\n");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
