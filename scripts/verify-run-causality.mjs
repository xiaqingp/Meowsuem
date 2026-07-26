import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";

const parseArgs = argv => Object.fromEntries(argv.map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const hashFile = async file => sha256(await fs.readFile(file));
const exists = file => fs.access(file).then(() => true).catch(() => false);

export async function verifyRunCausality({projectRoot, kind, museum, caseId, runId}) {
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot, manifest, runKind: kind, museumId: museum, caseId, runId, writable: false,
  });
  const failures = [];
  const ratingPath = path.join(runRoot, "rating", "rating-result.json");
  const ratingInputPath = path.join(runRoot, "selection", "rating-input.json");
  if (await exists(ratingPath)) {
    const rating = JSON.parse(await fs.readFile(ratingPath, "utf8"));
    if (rating.runId !== descriptor.runId || rating.museumId !== descriptor.museumId) {
      failures.push("rating run identity drift");
    }
    if (rating.inputSha256 !== await hashFile(ratingInputPath)) failures.push("selection to rating input drift");
  }
  const lockedReportPath = path.join(runRoot, "reports", "locked-metadata-report.json");
  if (await exists(lockedReportPath)) {
    const lockedReport = JSON.parse(await fs.readFile(lockedReportPath, "utf8"));
    for (const record of Object.values(lockedReport.upstreamHashes ?? {})) {
      if (await hashFile(path.resolve(projectRoot, record.path)) !== record.sha256) {
        failures.push(`locked metadata upstream drift: ${record.path}`);
      }
    }
  }
  const planPath = path.join(runRoot, "assembly", "publication-plan.json");
  const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
  for (const [relative, expected] of Object.entries(plan.inputHashes)) {
    if (await hashFile(path.join(runRoot, relative)) !== expected) failures.push(`publication plan input drift: ${relative}`);
  }
  for (const workId of plan.workIds) {
    const root = path.join(runRoot, "works", workId, "one-shot");
    const adapter = JSON.parse(await fs.readFile(path.join(root, "integration", "adapter-result.json"), "utf8"));
    const result = JSON.parse(await fs.readFile(path.join(root, "result.json"), "utf8"));
    if (result.status !== "accepted") failures.push(`${workId}: one-shot result is not accepted`);
    const pairs = {
      lockedMetadata: "input/locked-metadata.json",
      article: "output/article.md",
      sources: "output/sources.json",
      verification: "integration/verification.json",
    };
    for (const [name, relative] of Object.entries(pairs)) {
      if (await hashFile(path.join(root, relative)) !== adapter.inputHashes?.[name]) failures.push(`${workId}: ${name} causality drift`);
    }
    for (const [name, expected] of Object.entries(adapter.outputHashes ?? {})) {
      if (await hashFile(path.join(root, "integration", name)) !== expected) failures.push(`${workId}: integration ${name} drift`);
    }
  }
  const assemblyPath = path.join(runRoot, "candidate", "assembly-result.json");
  if (await exists(assemblyPath)) {
    const assembly = JSON.parse(await fs.readFile(assemblyPath, "utf8"));
    if (assembly.publicationPlanSha256 !== await hashFile(planPath)) failures.push("assembly publication plan drift");
    for (const [relative, expected] of Object.entries(assembly.files ?? {})) {
      if (await hashFile(path.join(runRoot, "candidate", relative)) !== expected) failures.push(`candidate drift: ${relative}`);
    }
    for (const reportName of ["publication-dry-run.json", "publication-publish.json"]) {
      const reportPath = path.join(runRoot, "reports", reportName);
      if (!(await exists(reportPath))) continue;
      const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
      if (report.candidateAssemblyResultSha256 !== await hashFile(assemblyPath)) failures.push(`${reportName}: candidate hash drift`);
      if (report.mode === "publish") {
        for (const [relative, record] of Object.entries(report.files)) {
          if (await hashFile(path.join(projectRoot, relative)) !== record.sha256) failures.push(`published destination drift: ${relative}`);
        }
      }
    }
  }
  return {status: failures.length ? "failed" : "passed", runId, museumId: descriptor.museumId, failures};
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await verifyRunCausality({
    projectRoot, kind: args.kind, museum: args.museum, caseId: args.case, runId: args["run-id"],
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "passed") process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
