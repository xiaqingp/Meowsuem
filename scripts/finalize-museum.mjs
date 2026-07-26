import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import {
  loadManifest,
  resolveCanonicalRun,
  transitionRunStatus,
} from "./lib/filesystem-contract.mjs";

const argument = (name) => process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(
  argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
);
const manifest = await loadManifest(projectRoot);
const runKind = argument("--kind");
const runId = argument("--run-id");
if (!runKind || !runId) throw new Error("--kind and --run-id are required");
if (argument("--run-root")) {
  process.stderr.write("DEPRECATION: --run-root is accepted only when it exactly matches the contract path.\n");
}
const { runRoot, descriptor } = await resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind,
  museumId: argument("--museum"),
  caseId: argument("--case"),
  runId,
  suppliedRunRoot: argument("--run-root"),
  writable: true,
});
if (!["running", "verified"].includes(descriptor.status)) {
  throw new Error(`Filesystem contract violation: finalization requires running or verified status, received ${descriptor.status}`);
}
const publish = process.argv.includes("--publish");
if (publish && runKind !== "production") {
  throw new Error("Filesystem contract violation: real publish requires a production run");
}
if (publish && descriptor.status !== "verified") {
  throw new Error("Filesystem contract violation: real publish requires verified status");
}
const publicationPlan = descriptor.contentContract === "one_shot_v1"
  ? JSON.parse(await fs.readFile(path.join(runRoot, "assembly", "publication-plan.json"), "utf8"))
  : null;
const input = JSON.parse(await fs.readFile(
  descriptor.contentContract === "one_shot_v1"
    ? path.join(runRoot, publicationPlan.assemblyInput)
    : path.join(runRoot, "structure", "assembly-input.json"),
  "utf8",
));
const concurrency = argument("--concurrency");
const identityArgs = [
  `--kind=${runKind}`,
  ...(runKind === "production" ? [`--museum=${descriptor.museumId}`] : [`--case=${descriptor.caseId}`]),
  `--run-id=${runId}`,
  `--project-root=${projectRoot}`,
];
const stages = [];

const run = async (name, script, args = []) => {
  const started = performance.now();
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...identityArgs, ...args], {
      cwd: projectRoot,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${name} exited ${code}`))));
  });
  stages.push({ name, seconds: Number(((performance.now() - started) / 1000).toFixed(3)) });
};

const totalStarted = performance.now();
await run("assembly", "scripts/assemble-museum-candidate.mjs", runKind === "production" ? [] : ["--dry-run"]);
if (descriptor.contentContract === "one_shot_v1") {
  await run("causality-prepublish", "scripts/verify-run-causality.mjs");
}
await run("future-contract", "scripts/verify-future-museum-contract.mjs");
await run("verification", "scripts/verify-release-candidate.mjs", [
  ...(concurrency ? [`--concurrency=${concurrency}`] : []),
  ...(process.argv.includes("--live") ? ["--live"] : []),
]);
await run(publish ? "publication" : "publication-dry-run", "scripts/publish-museum-candidate.mjs", [
  ...(publish ? ["--publish"] : []),
]);
if (descriptor.contentContract === "one_shot_v1") {
  await run("causality-postpublish", "scripts/verify-run-causality.mjs");
}

const completedAt = new Date();
const report = {
  museumId: input.museum.id,
  runId,
  runKind,
  completedAt: completedAt.toISOString(),
  stages,
  totalSeconds: Number(((performance.now() - totalStarted) / 1000).toFixed(3)),
  modelCalls: 0,
  modelTokens: 0,
  liveVerification: process.argv.includes("--live"),
  publicationMode: publish ? "publish" : "dry-run",
};
const reportsRoot = path.join(runRoot, "reports");
await fs.mkdir(reportsRoot, { recursive: true });
await fs.writeFile(path.join(reportsRoot, "finalization-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
if (publish || descriptor.status !== "verified") {
  await transitionRunStatus({
    projectRoot,
    runRoot,
    manifest,
    nextStatus: publish ? "published" : "verified",
    timestamp: completedAt,
  });
}
process.stdout.write(`${JSON.stringify(report)}\n`);
