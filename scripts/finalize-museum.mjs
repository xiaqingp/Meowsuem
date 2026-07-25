import fs from "node:fs/promises";
import path from "node:path";
import {spawn} from "node:child_process";
import {performance} from "node:perf_hooks";

const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const runRoot = path.resolve(projectRoot, argument("--run-root") || "");
const candidateRoot = path.resolve(projectRoot, argument("--candidate") || path.join(runRoot, "candidate"));
if (!argument("--run-root")) throw new Error("--run-root=<directory> is required");
const input = JSON.parse(await fs.readFile(path.join(runRoot, "assembly-input.json"), "utf8"));
const concurrency = argument("--concurrency");
const relative = target => path.relative(projectRoot, target).replaceAll("\\", "/");
const stages = [];

const run = async (name, args) => {
  const started = performance.now();
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {cwd: projectRoot, stdio: "inherit"});
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`${name} exited ${code}`)));
  });
  stages.push({name, seconds: Number(((performance.now() - started) / 1000).toFixed(3))});
};

const totalStarted = performance.now();
await run("assembly", [
  "scripts/assemble-museum-candidate.mjs",
  `--run-root=${relative(runRoot)}`,
  `--candidate=${relative(candidateRoot)}`
]);
await run("future-contract", [
  "scripts/verify-future-museum-contract.mjs",
  `--run-root=${relative(runRoot)}`,
  `--candidate=${relative(candidateRoot)}`
]);
await run("verification", [
  "scripts/verify-release-candidate.mjs",
  `--museum=${input.museum.id}`,
  `--candidate=${relative(candidateRoot)}`,
  ...(concurrency ? [`--concurrency=${concurrency}`] : []),
  ...(process.argv.includes("--live") ? ["--live"] : [])
]);
await run(process.argv.includes("--publish") ? "publication" : "publication-dry-run", [
  "scripts/publish-museum-candidate.mjs",
  `--candidate=${relative(candidateRoot)}`,
  ...(process.argv.includes("--publish") ? ["--publish"] : [])
]);

const report = {
  museumId: input.museum.id,
  completedAt: new Date().toISOString(),
  stages,
  totalSeconds: Number(((performance.now() - totalStarted) / 1000).toFixed(3)),
  modelCalls: 0,
  modelTokens: 0,
  liveVerification: process.argv.includes("--live"),
  publicationMode: process.argv.includes("--publish") ? "publish" : "dry-run"
};
await fs.writeFile(path.join(candidateRoot, "finalization-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report));
