import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  fixtureRunId,
  writeFixtureManifest,
  writeFixtureRun,
} from "./lib/test-filesystem-fixture.mjs";

const repository = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const reporter = path.join(repository, "scripts", "report-museum-generation.mjs");
const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-report-"));
try {
  await writeFixtureManifest(fixture);
  const { runRoot } = await writeFixtureRun({ projectRoot: fixture });
  const writeResult = async (directory, name, data) => {
    const target = path.join(runRoot, ...directory.split("/"));
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, `${name}-result.json`), JSON.stringify(data), "utf8");
  };
  const base = {
    runId: fixtureRunId,
    museumId: "fixture",
    runnerStartedAt: "2026-07-24T00:00:00.000Z",
  };
  await writeResult("research/batches/a", "research", {
    ...base,
    stage: "research",
    modelStartedAt: "2026-07-24T00:00:00.000Z",
    modelCompletedAt: "2026-07-24T00:05:00.000Z",
    completedAt: "2026-07-24T00:05:00.000Z",
    tokenUsage: { total: 100 },
  });
  await writeResult("research/batches/b", "research", {
    ...base,
    stage: "research",
    modelStartedAt: "2026-07-24T00:00:00.000Z",
    modelCompletedAt: "2026-07-24T00:08:00.000Z",
    completedAt: "2026-07-24T00:08:00.000Z",
    tokenUsage: { total: 200 },
  });
  await writeResult("works/a/author", "author", {
    ...base,
    runnerStartedAt: "2026-07-24T00:08:00.000Z",
    stage: "author",
    modelStartedAt: "2026-07-24T00:08:00.000Z",
    modelCompletedAt: "2026-07-24T00:10:00.000Z",
    completedAt: "2026-07-24T00:10:00.000Z",
    tokenUsage: { total: 300 },
  });
  const oneShotRoot = path.join(runRoot, "works", "one", "one-shot");
  await fs.mkdir(oneShotRoot, {recursive:true});
  await fs.writeFile(path.join(oneShotRoot, "result.json"), JSON.stringify({
    schemaVersion:2,status:"accepted",runId:fixtureRunId,museumId:"fixture",workId:"one",stage:"single_work",
    model:"gpt-5.6-luna",reasoningEffort:"high",startedAt:"2026-07-24T00:10:00.000Z",
    completedAt:"2026-07-24T00:11:00.000Z",inputTokens:40,cachedInputTokens:25,
    reasoningTokens:4,outputTokens:10,totalTokens:50,agentRunCount:1,modelRoundCount:2,
    webSearchCount:3,webOpenCount:1,attempt:1,
  }));
  const identity = [
    `--project-root=${fixture}`,
    "--kind=production",
    "--museum=fixture",
    `--run-id=${fixtureRunId}`,
  ];
  let run = spawnSync(
    process.execPath,
    [reporter, ...identity, "--completed-at=2026-07-24T00:12:00.000Z"],
    { encoding: "utf8" },
  );
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  const report = JSON.parse(await fs.readFile(path.join(runRoot, "reports", "generation-report.json"), "utf8"));
  if (report.totalTokens !== 650 || report.totalWallSeconds !== 720 || report.postGenerationSeconds !== 60) {
    throw new Error("report total calculation failed");
  }
  if (report.tokenUsage.input !== 40 || report.tokenUsage.cachedInput !== 25 || report.webSearchCount !== 3) {
    throw new Error("report did not include one-shot raw/cached/search usage");
  }
  if (report.runRoot.includes(":\\") || path.isAbsolute(report.runRoot)) throw new Error("report leaked an absolute runRoot");
  if (report.stages.research.wallSeconds !== 480 || report.stages.author.wallSeconds !== 120) {
    throw new Error("parallel stage calculation failed");
  }

  await writeResult("works/b/author", "author", {
    ...base,
    stage: "author",
    modelStartedAt: "2026-07-24T00:10:00.000Z",
    modelCompletedAt: "2026-07-24T00:11:00.000Z",
    completedAt: "2026-07-24T00:11:00.000Z",
  });
  run = spawnSync(process.execPath, [reporter, ...identity], { encoding: "utf8" });
  if (run.status === 0 || !run.stderr.includes("missing metrics")) {
    throw new Error("reporter accepted missing token metrics");
  }
  run = spawnSync(process.execPath, [reporter, ...identity, `--out-dir=${fixture}`], { encoding: "utf8" });
  if (run.status === 0 || !run.stderr.includes("--out-dir must exactly equal")) {
    throw new Error("reporter accepted an arbitrary --out-dir");
  }
  process.stdout.write("museum generation report self-test passed\n");
} finally {
  await fs.rm(fixture, { recursive: true, force: true });
}
