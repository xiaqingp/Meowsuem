import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createGenerationRun} from "./create-generation-run.mjs";
import {continuationReuseStatus, runMuseumPipeline, shouldReuseCompletedStage} from "./run-museum-pipeline.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const caseId = `experiment-orchestrator-fixture-${process.pid}`;
const museumId = "blindfixture";
const created = await createGenerationRun({
  projectRoot,
  kind: "experiment",
  museum: museumId,
  caseId,
  now: new Date(Date.now() + 3_000).toISOString(),
});
const runRoot = path.join(projectRoot, created.runRoot);
const dryCaseId = `${caseId}-dry`;
const dryCreated = await createGenerationRun({
  projectRoot,
  kind: "experiment",
  museum: museumId,
  caseId: dryCaseId,
  now: new Date(Date.now() + 4_000).toISOString(),
});
const dryRunRoot = path.join(projectRoot, dryCreated.runRoot);
assert.equal(shouldReuseCompletedStage({
  stage: "single_work", doneExists: true, mock: false, retryFailed: true,
}), false);
assert.equal(shouldReuseCompletedStage({
  stage: "single_work", doneExists: true, mock: false, retryFailed: false,
}), true);
assert.equal(continuationReuseStatus({
  stage: "museum_structure", continueFrom: "image_evidence", doneExists: true,
}), "reused_before_continuation");
assert.equal(continuationReuseStatus({
  stage: "image_evidence", continueFrom: "image_evidence", doneExists: true,
}), null);
assert.throws(() => continuationReuseStatus({
  stage: "museum_structure", continueFrom: "image_evidence", doneExists: false,
}), /owner approval/);

try {
  await assert.rejects(
    () => runMuseumPipeline(["--unknown-option", "--kind=experiment", `--case=${caseId}`, `--run-id=${created.runId}`]),
    /unknown option/,
  );
  const dryResult = await runMuseumPipeline([
    "--kind=experiment", `--case=${dryCaseId}`, `--run-id=${dryCreated.runId}`, "--dry-run",
  ]);
  assert.ok(dryResult.results.every(item => item.status === "would_run"));
  const dryDescriptor = JSON.parse(await fs.readFile(path.join(dryRunRoot, "run.json"), "utf8"));
  assert.equal(dryDescriptor.status, "created");
  await assert.rejects(() => fs.access(path.join(dryRunRoot, "reports", "orchestrator-result.json")));
  const scope = {
    schemaVersion: 1,
    museumId,
    museumName: "Blind Fixture Museum",
    city: "Fixture City",
    country: "Fixture Country",
    officialCollectionUrl: "https://example.org/",
    editorialCapacity: 3,
    collectionBoundaries: [],
    exclusions: [],
    riskFlags: [],
    sourcePointers: ["https://example.org/"],
  };
  await fs.writeFile(path.join(runRoot, "scope", "scope.json"), `${JSON.stringify(scope, null, 2)}\n`);
  const result = await runMuseumPipeline([
    "--kind=experiment",
    `--case=${caseId}`,
    `--run-id=${created.runId}`,
    "--museum-name=Blind Fixture Museum",
    "--city=Fixture City",
    "--country=Fixture Country",
    "--until=museum_scope",
    "--mock",
  ]);
  assert.equal(result.runKind, "experiment");
  assert.equal(result.museumId, museumId);
  assert.equal(result.caseId, caseId);
  const request = JSON.parse(await fs.readFile(path.join(runRoot, "scope", "request.json"), "utf8"));
  assert.equal(request.museumId, museumId);
  assert.ok(!Object.hasOwn(request, "officialCollectionUrl"));
  assert.ok(!Object.hasOwn(request, "editorialCapacity"));
  const header = JSON.parse(await fs.readFile(path.join(runRoot, "scope", "run-header.json"), "utf8"));
  assert.equal(header.caseId, caseId);
  assert.ok(!Object.hasOwn(header, "museumId"));
  assert.equal(header.executionProfile.model, "gpt-5.6-luna");
  assert.equal(header.executionProfile.reasoningEffort, "high");
  console.log("experiment orchestrator test passed");
} finally {
  await fs.rm(runRoot, {recursive: true, force: true});
  await fs.rmdir(path.dirname(runRoot)).catch(() => {});
  await fs.rm(dryRunRoot, {recursive: true, force: true});
  await fs.rmdir(path.dirname(dryRunRoot)).catch(() => {});
}
