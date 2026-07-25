import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const reporter = path.join(root, "scripts/report-museum-generation.mjs");
const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-report-"));
const writeResult = async (directory, name, data) => {
  const target = path.join(fixture, directory);
  await fs.mkdir(target, {recursive: true});
  await fs.writeFile(path.join(target, `${name}-result.json`), JSON.stringify(data), "utf8");
};
const base = {
  museumId: "fixture",
  runnerStartedAt: "2026-07-24T00:00:00.000Z"
};
try {
  await writeResult("research/a", "research", {...base, stage: "research", modelStartedAt: "2026-07-24T00:00:00.000Z", modelCompletedAt: "2026-07-24T00:05:00.000Z", completedAt: "2026-07-24T00:05:00.000Z", tokenUsage: {total: 100}});
  await writeResult("research/b", "research", {...base, stage: "research", modelStartedAt: "2026-07-24T00:00:00.000Z", modelCompletedAt: "2026-07-24T00:08:00.000Z", completedAt: "2026-07-24T00:08:00.000Z", tokenUsage: {total: 200}});
  await writeResult("author/a", "author", {...base, runnerStartedAt: "2026-07-24T00:08:00.000Z", stage: "author", modelStartedAt: "2026-07-24T00:08:00.000Z", modelCompletedAt: "2026-07-24T00:10:00.000Z", completedAt: "2026-07-24T00:10:00.000Z", tokenUsage: {total: 300}});
  let run = spawnSync(process.execPath, [reporter, "--museum", "fixture", "--run-root", fixture, "--completed-at", "2026-07-24T00:12:00.000Z"], {encoding: "utf8"});
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  const report = JSON.parse(await fs.readFile(path.join(fixture, "generation-report.json"), "utf8"));
  if (report.totalTokens !== 600 || report.totalWallSeconds !== 720 || report.postGenerationSeconds !== 120) throw new Error("report total calculation failed");
  if (report.stages.research.wallSeconds !== 480 || report.stages.author.wallSeconds !== 120) throw new Error("parallel stage calculation failed");

  await writeResult("broken", "author", {...base, stage: "author", modelStartedAt: "2026-07-24T00:10:00.000Z", modelCompletedAt: "2026-07-24T00:11:00.000Z", completedAt: "2026-07-24T00:11:00.000Z"});
  run = spawnSync(process.execPath, [reporter, "--museum", "fixture", "--run-root", fixture], {encoding: "utf8"});
  if (run.status === 0 || !run.stderr.includes("missing metrics")) throw new Error("reporter accepted missing token metrics");
  console.log("museum generation report self-test passed");
} finally {
  await fs.rm(fixture, {recursive: true, force: true});
}
