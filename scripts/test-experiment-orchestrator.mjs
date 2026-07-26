import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createGenerationRun} from "./create-generation-run.mjs";
import {runMuseumPipeline, shouldReuseCompletedStage} from "./run-museum-pipeline.mjs";

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
assert.equal(shouldReuseCompletedStage({
  stage: "single_work", doneExists: true, mock: false, retryFailed: true,
}), false);
assert.equal(shouldReuseCompletedStage({
  stage: "single_work", doneExists: true, mock: false, retryFailed: false,
}), true);

try {
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
  await fs.rm(path.dirname(runRoot), {recursive: false, force: true}).catch(() => {});
}
