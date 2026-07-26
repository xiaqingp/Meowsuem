import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPathInside,
  loadManifest,
  projectRelative,
  resolveCanonicalRun,
} from "./lib/filesystem-contract.mjs";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const equal = arg.indexOf("=");
    if (equal >= 0) values[arg.slice(2, equal)] = arg.slice(equal + 1);
    else values[arg.slice(2)] = argv[++index];
  }
  return values;
}

async function walk(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith("-result.json")
      || (entry.name === "result.json" && (
        path.basename(path.dirname(full)) === "one-shot"
        || path.basename(path.dirname(path.dirname(full))) === "attempts"
      ))) files.push(full);
  }
  return files;
}

const ms = (value) => new Date(value).valueOf();
const numeric = value => Number.isFinite(value) ? value : 0;
const retryCount = items => {
  const attempts = new Map();
  for (const item of items) {
    if (!item.workId) continue;
    attempts.set(item.workId, Math.max(attempts.get(item.workId) ?? 0, numeric(item.attempt)));
  }
  return [...attempts.values()].reduce((sum,attempt)=>sum+Math.max(0,attempt-1),0);
};
const normalizeResult = (result, file) => {
  if (result.stage === "single_work" || path.basename(file) === "result.json") {
    const startedAt = result.startedAt;
    const completedAt = result.completedAt;
    return {
      ...result,
      runnerStartedAt: startedAt,
      modelStartedAt: startedAt,
      modelCompletedAt: completedAt,
      completedAt,
      tokenUsage: {
        input: numeric(result.inputTokens),
        cachedInput: numeric(result.cachedInputTokens),
        reasoning: numeric(result.reasoningTokens),
        output: numeric(result.outputTokens),
        total: numeric(result.totalTokens),
      },
    };
  }
  return result;
};
const summarize = (items) => {
  const firstRunner = Math.min(...items.map((item) => ms(item.runnerStartedAt)));
  const lastCompleted = Math.max(...items.map((item) => ms(item.completedAt)));
  return {
    runs: items.length,
    wallSeconds: Math.round((lastCompleted - firstRunner) / 1000),
    modelSecondsSum: Math.round(
      items.reduce((sum, item) => sum + ms(item.modelCompletedAt) - ms(item.modelStartedAt), 0) / 1000,
    ),
    tokenUsage: items.reduce((sum, item) => ({
      input: sum.input + numeric(item.tokenUsage.input ?? item.tokenUsage.inputTokens),
      cachedInput: sum.cachedInput + numeric(item.tokenUsage.cachedInput ?? item.tokenUsage.cachedInputTokens),
      reasoning: sum.reasoning + numeric(item.tokenUsage.reasoning ?? item.tokenUsage.reasoningTokens),
      output: sum.output + numeric(item.tokenUsage.output ?? item.tokenUsage.outputTokens),
      total: sum.total + numeric(item.tokenUsage.total),
    }), {input:0,cachedInput:0,reasoning:0,output:0,total:0}),
    searches: items.reduce((sum,item)=>sum+numeric(item.webSearchCount),0),
    retries: retryCount(items),
  };
};

const duration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}分${rest}秒` : `${rest}秒`;
};

export async function reportMuseumGeneration(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const manifest = await loadManifest(projectRoot);
  if (!args.kind || !args["run-id"]) throw new Error("--kind and --run-id are required");
  if (args["run-root"]) {
    process.stderr.write("DEPRECATION: --run-root is accepted only when it exactly matches the contract path.\n");
  }
  const { runRoot, descriptor } = await resolveCanonicalRun({
    projectRoot,
    manifest,
    runKind: args.kind,
    museumId: args.museum,
    caseId: args.case,
    runId: args["run-id"],
    suppliedRunRoot: args["run-root"],
    writable: true,
  });
  const reportsRoot = path.join(runRoot, "reports");
  if (args["out-dir"]) {
    const supplied = path.resolve(projectRoot, args["out-dir"]);
    if (supplied !== reportsRoot) {
      throw new Error(`Filesystem contract violation: --out-dir must exactly equal ${projectRelative(projectRoot, reportsRoot)}`);
    }
    process.stderr.write("DEPRECATION: --out-dir is fixed by the filesystem contract.\n");
  }
  await assertPathInside(runRoot, reportsRoot);
  const completedAt = new Date(args["completed-at"] ?? Date.now());
  if (Number.isNaN(completedAt.valueOf())) throw new Error("--completed-at is invalid");

  const results = [];
  const missingMetrics = [];
  for (const file of await walk(runRoot)) {
    if (path.basename(path.dirname(file)) === "one-shot"
      && await fs.access(path.join(path.dirname(file),"attempts")).then(()=>true).catch(()=>false)) {
      continue;
    }
    const parsed = JSON.parse(await fs.readFile(file, "utf8"));
    const result = normalizeResult(parsed, file);
    if (!result.modelStartedAt) continue;
    const relative = path.relative(runRoot, file).replaceAll("\\", "/");
    const missing = ["runnerStartedAt", "modelStartedAt", "modelCompletedAt", "completedAt"].filter(
      (field) => !result[field],
    );
    if (!Number.isInteger(result.tokenUsage?.total) || result.tokenUsage.total <= 0) missing.push("tokenUsage.total");
    if (result.runId !== descriptor.runId) missing.push(`runId(${result.runId})`);
    const identityMatches = descriptor.museumId
      ? result.museumId === descriptor.museumId
      : result.caseId === descriptor.caseId;
    if (!identityMatches) missing.push("run identity");
    if (missing.length) missingMetrics.push({ file: relative, missing });
    results.push({ ...result, file: relative });
  }
  if (!results.length) throw new Error("no model generation results found");
  if (missingMetrics.length) {
    throw new Error(`generation report blocked by missing metrics: ${JSON.stringify(missingMetrics)}`);
  }

  const stageMap = new Map();
  for (const result of results) {
    const stage = result.stage || "unknown";
    if (!stageMap.has(stage)) stageMap.set(stage, []);
    stageMap.get(stage).push(result);
  }
  const stages = Object.fromEntries([...stageMap].map(([stage, items]) => [stage, summarize(items)]));
  const firstRunnerStartedAt = new Date(Math.min(...results.map((item) => ms(item.runnerStartedAt))));
  const lastModelCompletedAt = new Date(Math.max(...results.map((item) => ms(item.modelCompletedAt))));
  const tokenUsage = results.reduce((sum,item)=>({
    input:sum.input+numeric(item.tokenUsage.input ?? item.tokenUsage.inputTokens),
    cachedInput:sum.cachedInput+numeric(item.tokenUsage.cachedInput ?? item.tokenUsage.cachedInputTokens),
    reasoning:sum.reasoning+numeric(item.tokenUsage.reasoning ?? item.tokenUsage.reasoningTokens),
    output:sum.output+numeric(item.tokenUsage.output ?? item.tokenUsage.outputTokens),
    total:sum.total+numeric(item.tokenUsage.total),
  }),{input:0,cachedInput:0,reasoning:0,output:0,total:0});
  const rateCard = manifest.executionProfile?.generationCostRateCard ?? {status:"unavailable",models:{}};
  let weightedCreditEstimate = 0;
  let rateComplete = true;
  for (const item of results) {
    const rate = rateCard.models?.[item.model];
    if (!rate) { rateComplete = false; continue; }
    weightedCreditEstimate += numeric(item.tokenUsage.input) / 1_000_000 * numeric(rate.inputPerMillion)
      + numeric(item.tokenUsage.output) / 1_000_000 * numeric(rate.outputPerMillion);
  }
  const report = {
    museumId: descriptor.museumId ?? null,
    caseId: descriptor.caseId ?? null,
    runId: descriptor.runId,
    runRoot: projectRelative(projectRoot, runRoot),
    reportCompletedAt: completedAt.toISOString(),
    firstRunnerStartedAt: firstRunnerStartedAt.toISOString(),
    lastModelCompletedAt: lastModelCompletedAt.toISOString(),
    totalWallSeconds: Math.round((completedAt - firstRunnerStartedAt) / 1000),
    postGenerationSeconds: Math.max(0, Math.round((completedAt - lastModelCompletedAt) / 1000)),
    modelRuns: results.length,
    totalTokens: tokenUsage.total,
    tokenUsage,
    webSearchCount: results.reduce((sum,item)=>sum+numeric(item.webSearchCount),0),
    retryCount: retryCount(results),
    weightedCreditEstimate: rateComplete ? weightedCreditEstimate : "unavailable",
    weightedCreditEstimateStatus: rateCard.status ?? "unavailable",
    perModel: Object.fromEntries([...new Set(results.map(item=>item.model))].map(model=>[
      model,
      {runs:results.filter(item=>item.model===model).length,
       tokens:results.filter(item=>item.model===model).reduce((sum,item)=>sum+numeric(item.tokenUsage.total),0)}
    ])),
    perWorkAverage: {
      runs: results.filter(item=>item.workId).length,
      tokens: results.filter(item=>item.workId).length
        ? Math.round(results.filter(item=>item.workId).reduce((sum,item)=>sum+numeric(item.tokenUsage.total),0)/results.filter(item=>item.workId).length)
        : 0,
    },
    stages,
    missingMetrics: [],
  };
  const rows = Object.entries(stages).map(
    ([stage, item]) =>
      `| ${stage} | ${item.runs} | ${duration(item.wallSeconds)} | ${duration(item.modelSecondsSum)} | ${item.tokenUsage.total.toLocaleString("en-US")} |`,
  );
  const markdown = `# ${descriptor.museumId ?? descriptor.caseId} 生成报告

- 整馆实际用时：${duration(report.totalWallSeconds)}
- 模型调用：${report.modelRuns} 次
- 总 token：${report.totalTokens.toLocaleString("en-US")}
- 模型结束后的校验、发布与报告：${duration(report.postGenerationSeconds)}

| 阶段 | 调用数 | 墙钟用时 | 模型累计用时 | token |
| --- | ---: | ---: | ---: | ---: |
${rows.join("\n")}
`;
  await fs.mkdir(reportsRoot, { recursive: true });
  await fs.writeFile(path.join(reportsRoot, "generation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(reportsRoot, "generation-report.md"), markdown, "utf8");
  process.stdout.write(
    `museum generation report: ${descriptor.museumId ?? descriptor.caseId}, ${duration(report.totalWallSeconds)}, ${report.totalTokens.toLocaleString("en-US")} tokens\n`,
  );
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  reportMuseumGeneration().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
