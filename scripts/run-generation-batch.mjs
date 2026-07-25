import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  assertPathInside,
  loadManifest,
  resolveCanonicalRun,
} from "./lib/filesystem-contract.mjs";

export async function runPool(items, concurrency, task) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("concurrency must be a positive integer");
  const results = new Array(items.length);
  let cursor = 0;
  let failure;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!failure && cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await task(items[index], index);
      } catch (error) {
        failure = error;
      }
    }
  });
  await Promise.all(workers);
  if (failure) throw failure;
  return results;
}

function parseArgs(argv) {
  const values = {};
  for (const arg of argv) {
    if (!arg.startsWith("--") || arg === "--validate-only") continue;
    const [key, ...rest] = arg.slice(2).split("=");
    values[key] = rest.join("=");
  }
  return values;
}

export async function findStageRuns(runRoot, stage, descriptor) {
  const stageRoot = stage === "research" ? path.join(runRoot, "research", "batches") : path.join(runRoot, "works");
  const candidates = [];
  let entries = [];
  try {
    entries = await fs.readdir(stageRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = stage === "research" ? path.join(stageRoot, entry.name) : path.join(stageRoot, entry.name, "author");
    let header;
    try {
      header = JSON.parse(await fs.readFile(path.join(directory, "run-header.json"), "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const expectedIdentity = descriptor.museumId ?? descriptor.caseId;
    const actualIdentity = header.museumId ?? header.caseId;
    if (
      header.stage !== stage ||
      header.runId !== descriptor.runId ||
      actualIdentity !== expectedIdentity ||
      header.pipelineVersion !== descriptor.pipelineVersion
    ) {
      throw new Error(`Filesystem contract violation: run-header identity drift in ${directory}`);
    }
    await assertPathInside(runRoot, directory);
    candidates.push(directory);
  }
  return candidates.sort();
}

const execute = (runner, projectRoot, runDirectory, validateOnly) =>
  new Promise((resolve, reject) => {
    const args = [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      runner,
      "-ProjectRoot",
      projectRoot,
      "-RunDirectory",
      runDirectory,
      ...(validateOnly ? ["-ValidateOnly"] : []),
    ];
    const child = spawn("powershell.exe", args, { cwd: projectRoot, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve(runDirectory) : reject(new Error(`${path.basename(runDirectory)} exited ${code}`)),
    );
  });

export async function runGenerationBatch(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const stage = args.stage;
  if (!["research", "author"].includes(stage)) throw new Error("--stage must be research or author");
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const manifest = await loadManifest(projectRoot);
  const kind = args.kind;
  const runId = args["run-id"];
  if (!kind || !runId) throw new Error("--kind and --run-id are required");
  if (args["run-root"]) {
    process.stderr.write("DEPRECATION: --run-root is accepted only when it exactly matches the contract path.\n");
  }
  const { runRoot, descriptor } = await resolveCanonicalRun({
    projectRoot,
    manifest,
    runKind: kind,
    museumId: args.museum,
    caseId: args.case,
    runId,
    suppliedRunRoot: args["run-root"],
    writable: true,
  });
  const concurrency = Number(
    args.concurrency ??
      (stage === "research"
        ? manifest.executionProfile.researchBatchConcurrency
        : manifest.executionProfile.authorConcurrency),
  );
  const runs = await findStageRuns(runRoot, stage, descriptor);
  if (!runs.length) throw new Error(`no ${stage} runs found`);
  const runner = path.join(projectRoot, manifest.canonicalRunner);
  const started = Date.now();
  await runPool(runs, concurrency, (runDirectory) =>
    execute(runner, projectRoot, runDirectory, argv.includes("--validate-only")),
  );
  const result = {
    stage,
    runs: runs.length,
    concurrency,
    seconds: Number(((Date.now() - started) / 1000).toFixed(2)),
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runGenerationBatch().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
