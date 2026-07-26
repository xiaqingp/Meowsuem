import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  assertPathInside,
  loadManifest,
  resolveCanonicalRun,
} from "./lib/filesystem-contract.mjs";
import {atomicJson} from "./lib/work-status.mjs";

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
  if (stage === "single_work") {
    const worksRoot = path.join(runRoot, "works");
    const entries = await fs.readdir(worksRoot, {withFileTypes: true}).catch(error => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const candidates = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const root = path.join(worksRoot, entry.name, "one-shot");
      try {
        const locked = JSON.parse(await fs.readFile(path.join(root, "input", "locked-metadata.json"), "utf8"));
        if (locked.workId !== entry.name
          || ((descriptor.museumId ?? descriptor.targetMuseumId)
            && locked.museumId !== (descriptor.museumId ?? descriptor.targetMuseumId))) {
          throw new Error(`Filesystem contract violation: locked metadata identity drift in ${root}`);
        }
        candidates.push(root);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    return candidates.sort();
  }
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
  if (!["research", "author", "single_work"].includes(stage)) throw new Error("--stage must be research, author or single_work");
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
  if (stage === "author" && descriptor.contentContract === "one_shot_v1" && !argv.includes("--allow-legacy")) {
    throw new Error("new one_shot_v1 production runs cannot execute legacy author stage");
  }
  const concurrency = Number(
    args.concurrency ??
      (stage === "research"
        ? manifest.executionProfile.researchBatchConcurrency
        : stage === "single_work"
          ? manifest.executionProfile.singleWorkConcurrency
          : manifest.executionProfile.authorConcurrency),
  );
  let runs = await findStageRuns(runRoot, stage, descriptor);
  if (args["only-work"]) runs = runs.filter(directory => path.basename(path.dirname(directory)) === args["only-work"]);
  const skippedAccepted = [];
  if (stage === "single_work") {
    const filtered = [];
    for (const directory of runs) {
      const statusPath = path.join(path.dirname(directory), "status.json");
      const status = JSON.parse(await fs.readFile(statusPath, "utf8"));
      const workId = path.basename(path.dirname(directory));
      if (status.status === "accepted") skippedAccepted.push(workId);
      else if (!argv.includes("--retry-failed")
        || ["verification_failed", "blocked_needs_upstream_review"].includes(status.status)) filtered.push(directory);
    }
    runs = filtered;
  }
  if (!runs.length && !skippedAccepted.length) throw new Error(`no ${stage} runs found`);
  const started = Date.now();
  let accepted = [...skippedAccepted];
  let failed = [];
  if (stage === "single_work") {
    const identity = descriptor.museumId ? `--museum=${descriptor.museumId}` : `--case=${descriptor.caseId}`;
    const cursor = {value: 0};
    const workers = Array.from({length: Math.min(concurrency, runs.length)}, async () => {
      while (cursor.value < runs.length) {
        const directory = runs[cursor.value++];
        const workId = path.basename(path.dirname(directory));
        const code = await new Promise((resolve, reject) => {
          const child = spawn(process.execPath, [
            manifest.canonicalOneShotRunner, `--kind=${descriptor.runKind}`, identity,
            `--run-id=${descriptor.runId}`, `--work-id=${workId}`, `--project-root=${projectRoot}`,
          ], {cwd: projectRoot, stdio: "inherit"});
          child.on("error", reject);
          child.on("exit", resolve);
        });
        (code === 0 ? accepted : failed).push(workId);
      }
    });
    await Promise.all(workers);
  } else {
    const runner = path.join(projectRoot, manifest.canonicalRunner);
    await runPool(runs, concurrency, (runDirectory) =>
      execute(runner, projectRoot, runDirectory, argv.includes("--validate-only")),
    );
    accepted = runs.map(directory => path.basename(directory));
  }
  const result = {
    schemaVersion: 1,
    runId: descriptor.runId,
    museumId: descriptor.museumId ?? descriptor.targetMuseumId ?? null,
    caseId: descriptor.caseId ?? null,
    stage,
    runs: runs.length,
    accepted,
    failed,
    blocked: failed,
    skippedAccepted,
    concurrency,
    seconds: Number(((Date.now() - started) / 1000).toFixed(2)),
  };
  if (stage === "single_work") {
    await atomicJson(path.join(runRoot, "reports", "single-work-batch.json"), result);
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (failed.length) process.exitCode = 1;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runGenerationBatch().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
