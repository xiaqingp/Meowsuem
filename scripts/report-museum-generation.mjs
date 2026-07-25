import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const valueOf = name => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const museumId = valueOf("--museum");
const runRoot = path.resolve(valueOf("--run-root") ?? "");
const reportCompletedAt = new Date(valueOf("--completed-at") ?? Date.now());
const outDir = path.resolve(valueOf("--out-dir") ?? runRoot);
if (!museumId) throw new Error("--museum is required");
if (!valueOf("--run-root")) throw new Error("--run-root is required");
if (Number.isNaN(reportCompletedAt.valueOf())) throw new Error("--completed-at is invalid");

const walk = async directory => {
  const files = [];
  for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith("-result.json")) files.push(full);
  }
  return files;
};
const resultFiles = await walk(runRoot);
const results = [];
const missingMetrics = [];
for (const file of resultFiles) {
  const result = JSON.parse(await fs.readFile(file, "utf8"));
  if (!result.modelStartedAt) continue; // RecordOutputsOnly and other non-model records.
  const relative = path.relative(runRoot, file).replaceAll("\\", "/");
  const required = ["runnerStartedAt", "modelStartedAt", "modelCompletedAt", "completedAt"];
  const missing = required.filter(field => !result[field]);
  if (!Number.isInteger(result.tokenUsage?.total) || result.tokenUsage.total <= 0) missing.push("tokenUsage.total");
  if (result.museumId && result.museumId !== museumId) missing.push(`museumId(${result.museumId})`);
  if (missing.length) missingMetrics.push({file: relative, missing});
  results.push({...result, file: relative});
}
if (!results.length) throw new Error("no model generation results found");
if (missingMetrics.length) {
  throw new Error(`generation report blocked by missing metrics: ${JSON.stringify(missingMetrics)}`);
}

const ms = value => new Date(value).valueOf();
const summarize = items => {
  const firstRunner = Math.min(...items.map(item => ms(item.runnerStartedAt)));
  const lastCompleted = Math.max(...items.map(item => ms(item.completedAt)));
  return {
    runs: items.length,
    wallSeconds: Math.round((lastCompleted - firstRunner) / 1000),
    modelSecondsSum: Math.round(items.reduce((sum, item) =>
      sum + ms(item.modelCompletedAt) - ms(item.modelStartedAt), 0) / 1000),
    tokens: items.reduce((sum, item) => sum + item.tokenUsage.total, 0)
  };
};
const stageMap = new Map();
for (const result of results) {
  const stage = result.stage || "unknown";
  if (!stageMap.has(stage)) stageMap.set(stage, []);
  stageMap.get(stage).push(result);
}
const stages = Object.fromEntries([...stageMap].map(([stage, items]) => [stage, summarize(items)]));
const firstRunnerStartedAt = new Date(Math.min(...results.map(item => ms(item.runnerStartedAt))));
const lastModelCompletedAt = new Date(Math.max(...results.map(item => ms(item.modelCompletedAt))));
const report = {
  museumId,
  runRoot: runRoot.replaceAll("\\", "/"),
  reportCompletedAt: reportCompletedAt.toISOString(),
  firstRunnerStartedAt: firstRunnerStartedAt.toISOString(),
  lastModelCompletedAt: lastModelCompletedAt.toISOString(),
  totalWallSeconds: Math.round((reportCompletedAt - firstRunnerStartedAt) / 1000),
  postGenerationSeconds: Math.max(0, Math.round((reportCompletedAt - lastModelCompletedAt) / 1000)),
  modelRuns: results.length,
  totalTokens: results.reduce((sum, item) => sum + item.tokenUsage.total, 0),
  stages,
  missingMetrics: []
};
const duration = seconds => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}分${rest}秒` : `${rest}秒`;
};
const rows = Object.entries(stages).map(([stage, item]) =>
  `| ${stage} | ${item.runs} | ${duration(item.wallSeconds)} | ${duration(item.modelSecondsSum)} | ${item.tokens.toLocaleString("en-US")} |`
);
const markdown = `# ${museumId} 生成报告

- 整馆实际用时：${duration(report.totalWallSeconds)}
- 模型调用：${report.modelRuns} 次
- 总 token：${report.totalTokens.toLocaleString("en-US")}
- 模型结束后的校验、发布与报告：${duration(report.postGenerationSeconds)}

| 阶段 | 调用数 | 墙钟用时 | 模型累计用时 | token |
| --- | ---: | ---: | ---: | ---: |
${rows.join("\n")}
`;
await fs.mkdir(outDir, {recursive: true});
await fs.writeFile(path.join(outDir, "generation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(outDir, "generation-report.md"), markdown, "utf8");
console.log(`museum generation report: ${museumId}, ${duration(report.totalWallSeconds)}, ${report.totalTokens.toLocaleString("en-US")} tokens`);
