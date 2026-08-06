import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {atomicJson, listSingleWorkResults, summarizeSingleWorkBatch, writeWorkStatus} from "./lib/work-status.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...value] = arg.replace(/^--/, "").split("=");
  return [key, value.join("=")];
}));
const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const manifest = await loadManifest(projectRoot);
const {runRoot, descriptor} = await resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind: args.kind,
  museumId: args.museum,
  caseId: args.case,
  runId: args["run-id"],
  writable: true
});
const reportFile = path.join(runRoot, "reports", "single-work-batch.json");
const warnings = [];

for (const work of await listSingleWorkResults(runRoot)) {
  if (
    work.result?.status !== "failed" ||
    !["verification_failed", "blocked_needs_upstream_review", "blocked_cost_limit"].includes(work.status?.status)
  ) continue;
  const {workId, oneShotRoot} = work;
  const failedResult = work.result;
  const attempt = String(failedResult.attempt).padStart(2, "0");
  const attemptRoot = path.join(oneShotRoot, "attempts", attempt);
  const verification = JSON.parse(await fs.readFile(path.join(attemptRoot, "verification.json"), "utf8"));
  const {result: adapterResult} = await adaptOneShotWork({
    artifactRoot: attemptRoot,
    verification,
    previousFailure: failedResult.failureCode ?? "VERIFICATION_FAILED",
    replace: true,
    allowWarnings: true
  });
  await fs.rm(path.join(oneShotRoot, "output"), {recursive: true, force: true});
  await fs.rm(path.join(oneShotRoot, "integration"), {recursive: true, force: true});
  await fs.cp(path.join(attemptRoot, "output"), path.join(oneShotRoot, "output"), {recursive: true});
  await fs.cp(path.join(attemptRoot, "integration"), path.join(oneShotRoot, "integration"), {recursive: true});
  const warningResult = {
    ...failedResult,
    status: "warning",
    publicationMode: "warning",
    warningCodes: adapterResult.publicationWarnings.map(issue => issue.code)
  };
  delete warningResult.failureStage;
  await fs.writeFile(path.join(oneShotRoot, "result.json"), `${JSON.stringify(warningResult, null, 2)}\n`);
  await writeWorkStatus(runRoot, workId, {status: "warning_ready", attempt: failedResult.attempt, lastStage: "warning_promotion", verification: "warning"});
  warnings.push(workId);
}

const updatedReport = await summarizeSingleWorkBatch(runRoot, {
  runId: descriptor.runId,
  museumId: descriptor.museumId ?? descriptor.targetMuseumId ?? null,
  caseId: descriptor.caseId ?? null,
});
await atomicJson(reportFile, updatedReport);
process.stdout.write(`${JSON.stringify({runId: descriptor.runId, warning: warnings, accepted: updatedReport.accepted.length}, null, 2)}\n`);
