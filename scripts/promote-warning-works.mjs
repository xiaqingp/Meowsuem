import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";

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
const report = JSON.parse(await fs.readFile(reportFile, "utf8"));
const warnings = [];

for (const workId of report.failed ?? []) {
  const oneShotRoot = path.join(runRoot, "works", workId, "one-shot");
  const failedResult = JSON.parse(await fs.readFile(path.join(oneShotRoot, "result.json"), "utf8"));
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
  await fs.writeFile(path.join(oneShotRoot, "status.json"), `${JSON.stringify({status: "warning_ready", attempt: failedResult.attempt}, null, 2)}\n`);
  warnings.push(workId);
}

const updatedReport = {
  ...report,
  accepted: [...new Set([...(report.accepted ?? []), ...warnings])],
  warning: warnings,
  failed: [],
  blocked: []
};
await fs.writeFile(reportFile, `${JSON.stringify(updatedReport, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({runId: descriptor.runId, warning: warnings, accepted: updatedReport.accepted.length}, null, 2)}\n`);
