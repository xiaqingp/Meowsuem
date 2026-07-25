import fs from "node:fs/promises";
import path from "node:path";
import {spawn} from "node:child_process";
import {pathToFileURL} from "node:url";

export async function runPool(items, concurrency, task) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("concurrency must be a positive integer");
  const results = new Array(items.length);
  let cursor = 0;
  let failure;
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (!failure && cursor < items.length) {
      const index = cursor++;
      try { results[index] = await task(items[index], index); }
      catch (error) { failure = error; }
    }
  });
  await Promise.all(workers);
  if (failure) throw failure;
  return results;
}

async function findRuns(root, stage) {
  const runs = [];
  for (const entry of await fs.readdir(root, {withFileTypes: true})) {
    const target = path.join(root, entry.name);
    if (!entry.isDirectory()) continue;
    try {
      const header = JSON.parse(await fs.readFile(path.join(target, "run-header.json"), "utf8"));
      if (header.stage === stage) runs.push(target);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      runs.push(...await findRuns(target, stage));
    }
  }
  return runs.sort();
}

const execute = (runner, projectRoot, runDirectory, validateOnly) => new Promise((resolve, reject) => {
  const args = [
    "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
    "-File", runner,
    "-ProjectRoot", projectRoot,
    "-RunDirectory", runDirectory,
    ...(validateOnly ? ["-ValidateOnly"] : [])
  ];
  const child = spawn("powershell.exe", args, {cwd: projectRoot, stdio: "inherit"});
  child.on("error", reject);
  child.on("exit", code => code === 0 ? resolve(runDirectory) : reject(new Error(`${path.basename(runDirectory)} exited ${code}`)));
});

async function main() {
  const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
  const stage = argument("--stage");
  if (!["research", "author"].includes(stage)) throw new Error("--stage must be research or author");
  const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const runRoot = path.resolve(projectRoot, argument("--run-root") || "");
  if (!argument("--run-root") || !runRoot.startsWith(`${projectRoot}${path.sep}`)) throw new Error("valid --run-root is required");
  const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, "research/content-standard-manifest.json"), "utf8"));
  const concurrency = Number(argument("--concurrency") || (stage === "research"
    ? manifest.executionProfile.researchBatchConcurrency
    : manifest.executionProfile.authorConcurrency));
  const runs = await findRuns(runRoot, stage);
  if (!runs.length) throw new Error(`no ${stage} runs found`);
  const runner = path.join(projectRoot, manifest.canonicalRunner);
  const started = Date.now();
  await runPool(runs, concurrency, runDirectory =>
    execute(runner, projectRoot, runDirectory, process.argv.includes("--validate-only")));
  console.log(`${stage} batch completed: ${runs.length} runs, concurrency ${concurrency}, ${((Date.now() - started) / 1000).toFixed(2)}s`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
