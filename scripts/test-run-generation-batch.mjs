import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {findStageRuns, runPool} from "./run-generation-batch.mjs";
import {inspectSingleWorkRetryGuard, summarizeSingleWorkBatch, writeWorkStatus} from "./lib/work-status.mjs";
import {fixtureRunId, writeFixtureManifest, writeFixtureRun} from "./lib/test-filesystem-fixture.mjs";

let active = 0;
let maximum = 0;
const values = await runPool([1, 2, 3, 4, 5, 6], 2, async value => {
  active += 1;
  maximum = Math.max(maximum, active);
  await new Promise(resolve => setTimeout(resolve, 10));
  active -= 1;
  return value * 2;
});
assert.deepEqual(values, [2, 4, 6, 8, 10, 12]);
assert.equal(maximum, 2);
await assert.rejects(() => runPool([1, 2, 3], 2, async value => {
  if (value === 2) throw new Error("fixture failure");
  return value;
}), /fixture failure/);

const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-batch-"));
try {
  await writeFixtureManifest(root);
  const {runRoot, descriptor} = await writeFixtureRun({projectRoot: root});
  const batch = path.join(runRoot, "research", "batches", "batch-01");
  await fs.mkdir(batch, {recursive: true});
  const header = {
    runId: fixtureRunId,
    museumId: "fixture",
    pipelineVersion: "2.9.0",
    stage: "research"
  };
  await fs.writeFile(path.join(batch, "run-header.json"), JSON.stringify(header));
  assert.deepEqual(await findStageRuns(runRoot, "research", descriptor), [batch]);
  await fs.writeFile(path.join(batch, "run-header.json"), JSON.stringify({...header, runId: "wrong"}));
  await assert.rejects(() => findStageRuns(runRoot, "research", descriptor), /identity drift/);

  for (const [workId, status] of [["accepted-work", "accepted"], ["warning-work", "warning_ready"], ["failed-work", "verification_failed"]]) {
    const oneShot = path.join(runRoot, "works", workId, "one-shot");
    await fs.mkdir(path.join(oneShot, "input"), {recursive: true});
    await fs.writeFile(path.join(oneShot, "input", "locked-metadata.json"), JSON.stringify({museumId: "fixture", workId}));
    await fs.writeFile(path.join(oneShot, "result.json"), JSON.stringify({
      status: status === "accepted" ? "accepted" : status === "warning_ready" ? "warning" : "failed",
      failureCode: status === "verification_failed" ? "VERIFICATION_FAILED" : undefined,
      warningCodes: status === "warning_ready" ? ["OFFICIAL_SOURCE_COVERAGE"] : undefined,
    }));
    await writeWorkStatus(runRoot, workId, {status, attempt: 1});
  }
  const summary = await summarizeSingleWorkBatch(runRoot, {runId: fixtureRunId, museumId: "fixture"});
  assert.deepEqual(summary.accepted, ["accepted-work", "warning-work"]);
  assert.deepEqual(summary.warning, ["warning-work"]);
  assert.deepEqual(summary.failed, ["failed-work"]);
  assert.equal(summary.runs, 3);
  assert.deepEqual(summary.failureCodes, {VERIFICATION_FAILED: 1});
  assert.deepEqual(summary.warningCodes, {OFFICIAL_SOURCE_COVERAGE: 1});

  const guarded = path.join(runRoot, "works", "failed-work", "one-shot", "attempts");
  for (const attempt of ["01", "02"]) {
    const attemptRoot = path.join(guarded, attempt);
    await fs.mkdir(attemptRoot, {recursive: true});
    await fs.writeFile(path.join(attemptRoot, "result.json"), JSON.stringify({status: "failed", failureCode: "VERIFICATION_FAILED", totalTokens: 100}));
    await fs.writeFile(path.join(attemptRoot, "verification.json"), JSON.stringify({errors: [{code: "OFFICIAL_SOURCE_COVERAGE"}]}));
  }
  assert.match((await inspectSingleWorkRetryGuard(path.dirname(guarded), {
    maxAttempts: 4, tokenBudget: 1000, repeatedFailureLimit: 2,
  })).reason, /same failure repeated/);
  assert.match((await inspectSingleWorkRetryGuard(path.dirname(guarded), {
    maxAttempts: 2, tokenBudget: 1000, repeatedFailureLimit: 0,
  })).reason, /max attempts reached/);
  assert.match((await inspectSingleWorkRetryGuard(path.dirname(guarded), {
    maxAttempts: 4, tokenBudget: 200, repeatedFailureLimit: 0,
  })).reason, /token budget reached/);

  const script = path.resolve(new URL("run-generation-batch.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const outside = spawnSync(process.execPath, [
    script,
    `--project-root=${root}`,
    "--kind=production",
    "--museum=fixture",
    `--run-id=${fixtureRunId}`,
    `--run-root=${root}`,
    "--stage=research",
    "--validate-only"
  ], {encoding: "utf8"});
  assert.notEqual(outside.status, 0);
  assert.match(outside.stderr, /must exactly equal/);
} finally {
  await fs.rm(root, {recursive: true, force: true});
}
console.log("generation batch test passed: contract discovery, cumulative reports, retry guards, bounded concurrency and failure propagation verified");
