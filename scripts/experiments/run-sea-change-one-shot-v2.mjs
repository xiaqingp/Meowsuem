import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  assertWritableRun,
  loadManifest,
  readAndValidateRunDescriptor,
  resolveRunRoot,
  transitionRunStatus,
} from "../lib/filesystem-contract.mjs";
import {
  assertCleanLockedMetadata,
  assertOneShotDescriptor,
  buildDisplayMetadata,
  experimentCaseId,
  experimentEffort,
  experimentModel,
  extractCard,
  snapshotProtectedPaths,
  verifyOneShotOutput,
} from "./verify-sea-change-one-shot-v2.mjs";

const projectRoot = path.resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const productionRoot = path.join(projectRoot, "research/runs/production/seattle/m28-12-seattle");
const productionWorkRoot = path.join(productionRoot, "works/sea-change");
const promptPath = path.join(projectRoot, "scripts/experiments/prompts/single-work-one-shot-v2.md");
const lunaV3 = {
  caseId: "sea-change-luna-one-shot-v3",
  model: "gpt-5.6-luna",
  reasoningEffort: "high",
};
const protectedPaths = [
  "research/content/seattle.md",
  "research/runs/production",
  "seattle.js",
  "museum-expansions.js",
  "routes.js",
  "museums.js",
  "index.html",
  "museum.html",
];
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function parseArgs(argv) {
  return Object.fromEntries(argv.map((arg) => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

async function atomicJson(file, value) {
  const temporary = `${file}.tmp-${process.pid}`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  await fs.rename(temporary, file);
}

function completedSearchCount(events) {
  return new Set(
    events
      .filter((event) =>
        event.type === "item.completed" &&
        (event.item?.type === "web_search" || event.item?.type === "web_search_call"))
      .map((event) => event.item?.id)
      .filter(Boolean),
  ).size;
}

async function runCodex({ runRoot, prompt, imagePath, schemaPath, logPath, model, reasoningEffort }) {
  const args = [
    "exec",
    "--model", model,
    "--config", `model_reasoning_effort="${reasoningEffort}"`,
    "--ignore-user-config",
    "--ignore-rules",
    "--ephemeral",
    "--sandbox", "workspace-write",
    "--disable", "apps",
    "--disable", "memories",
    "--disable", "plugins",
    "--disable", "plugin_sharing",
    "--disable", "remote_plugin",
    "--image", imagePath,
    "--output-schema", schemaPath,
    "--json",
    "--color", "never",
    "-",
  ];
  const started = new Date();
  const log = await fs.open(logPath, "wx");
  const child = spawn("codex.cmd", args, {
    cwd: runRoot,
    shell: process.platform === "win32",
    stdio: ["pipe", "pipe", "pipe"],
  });
  let raw = "";
  const record = async (chunk, stream) => {
    const text = chunk.toString("utf8");
    raw += text;
    await log.write(text);
    stream.write(text);
  };
  child.stdout.on("data", (chunk) => void record(chunk, process.stdout));
  child.stderr.on("data", (chunk) => void record(chunk, process.stderr));
  child.stdin.end(prompt);
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  await log.close();
  const completed = new Date();
  const events = raw.split(/\r?\n/).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
  const message = events
    .filter((event) => event.type === "item.completed" && event.item?.type === "agent_message")
    .at(-1)?.item?.text;
  let response = null;
  try { response = message ? JSON.parse(message) : null; } catch { response = null; }
  const usage = events.filter((event) => event.type === "turn.completed").at(-1)?.usage ?? {};
  const totalTokens = Number.isFinite(usage.input_tokens) && Number.isFinite(usage.output_tokens)
    ? usage.input_tokens + usage.output_tokens
    : "unavailable";
  return {
    exitCode,
    response,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs: completed - started,
    inputTokens: usage.input_tokens ?? "unavailable",
    cachedInputTokens: usage.cached_input_tokens ?? "unavailable",
    reasoningTokens: usage.reasoning_output_tokens ?? "unavailable",
    outputTokens: usage.output_tokens ?? "unavailable",
    totalTokens,
    searchCount: completedSearchCount(events),
  };
}

export function oldPipelineMetrics(researchResult, authorResult, sizes) {
  const workCount = researchResult.outputs.length;
  const researchTokens = researchResult.tokenUsage.total;
  const amortizedResearchTokens = Math.round(researchTokens / workCount);
  return {
    model: "gpt-5.6-sol",
    reasoningEffort: "medium",
    callsTouchingWork: 2,
    amortizedCalls: Number((1 + (1 / workCount)).toFixed(1)),
    researchBatch: {
      workCount,
      tokens: researchTokens,
      amortizedTokens: amortizedResearchTokens,
      durationMs: researchResult.modelDurationMs,
      amortizedDurationMs: Math.round(researchResult.modelDurationMs / workCount),
    },
    author: {
      tokens: authorResult.tokenUsage.total,
      durationMs: authorResult.modelDurationMs,
    },
    comparableAmortizedTokens: amortizedResearchTokens + authorResult.tokenUsage.total,
    comparableAmortizedDurationMs:
      Math.round(researchResult.modelDurationMs / workCount) + authorResult.modelDurationMs,
    fullCallsTouchingWorkTokens: researchTokens + authorResult.tokenUsage.total,
    ...sizes,
  };
}

function formatMetric(value) {
  return typeof value === "number" ? value.toLocaleString("en-US") : value;
}

export function experimentMetrics(result) {
  return Object.fromEntries([
    "model", "reasoningEffort", "callCount", "inputTokens", "cachedInputTokens",
    "reasoningTokens", "outputTokens", "totalTokens", "promptBytes", "searchCount",
    "sourceCount", "durationMs", "articleBytes", "sourcesBytes", "cardBytes",
    "infrastructureRetry", "mechanicalGate",
  ].map((key) => [key, result[key] ?? "unavailable"]));
}

function comparisonMarkdown(comparison) {
  const old = comparison.oldPipeline;
  const fresh = comparison.oneShot;
  return `# 《海变》One-shot Search & Write v2 成本对照

| 指标 | 旧流程 | One-shot v2 |
| --- | ---: | ---: |
| 模型 | Sol Medium | Sol Medium |
| 触及本作的调用 | ${old.callsTouchingWork}（Research 与 9 件共享） | ${fresh.callCount} |
| Research token | ${formatMetric(old.researchBatch.tokens)} / ${old.researchBatch.workCount} 件；均摊 ${formatMetric(old.researchBatch.amortizedTokens)} | 不适用 |
| Author token | ${formatMetric(old.author.tokens)} | 不适用 |
| 可比总 token | ${formatMetric(old.comparableAmortizedTokens)} | ${formatMetric(fresh.totalTokens)} |
| Research Card bytes | ${old.researchCardBytes} | 0 |
| Writing Plan bytes | ${old.writingPlanBytes} | 0 |
| Card bytes | ${old.cardBytes} | ${fresh.cardBytes}（adapter） |
| Article / Draft bytes | ${old.draftBytes} | ${fresh.articleBytes} |
| Sources bytes | unavailable | ${fresh.sourcesBytes} |
| 搜索次数 | unavailable | ${fresh.searchCount} |
| 来源数量 | unavailable | ${fresh.sourceCount} |
| 可比模型耗时 | ${(old.comparableAmortizedDurationMs / 1000).toFixed(1)} 秒 | ${(fresh.durationMs / 1000).toFixed(1)} 秒 |
| 机械验证 | production accepted | ${fresh.mechanicalGate} |

旧 Research 是覆盖 ${old.researchBatch.workCount} 件作品的共享调用；公平单件口径采用 Research token 和时间的十分之一，再加本件独立 Author。完整共享 Research 调用仍保留在 comparison.json，不把它全部算给《海变》。

本实验只比较流程差异，没有更换模型、reasoning effort 或作品。新稿质量留给人工对照，不由 Codex 自动宣布优劣。
`;
}

export function extractOldQuick(oldDraft) {
  return oldDraft.match(/^### 30 秒先懂\s*([\s\S]*?)(?=^### |\n\*\*[^*]+\*\*)/m)?.[1]?.trim()
    ?? "旧稿未能机械提取对应快层，请直接阅读下方旧完整正文。";
}

export function sourceSummaryFromResearchCard(researchCard) {
  return [...new Set([...researchCard.matchAll(/https?:\/\/[^\s)>]+/g)].map((match) => match[0].replace(/[，。；;,]+$/, "")))];
}

function humanReviewMarkdown({ oldDraft, newArticle, oldQuick, newQuick, oldSources, sources, comparison, gate }) {
  return `# 《海变》One-shot v2 人工对照

## 旧版“一分钟看懂”对应内容

${oldQuick}

## 新版“一分钟看懂”

${newQuick}

## 旧完整正文

${oldDraft.trim()}

## 新完整正文

${newArticle.trim()}

## 旧新来源摘要

旧研究卡共提取 ${oldSources.length} 个 URL：

${oldSources.map((url) => `- ${url}`).join("\n") || "- unavailable"}

新稿共使用 ${sources.sources.length} 个结构化来源：

${sources.sources.map((source) => `- ${source.publisher}：《${source.title}》— ${source.url}`).join("\n")}

## 成本对比

${comparisonMarkdown(comparison)}

## 机械验证

- 状态：${gate.status}
- 中间小标题：${gate.middleHeadings.join("；")}
- 来源数量：${gate.sourceCount}
- Production 未变化：${gate.checks.productionUnchanged}

## 人工评价

事实准确性：

视觉分析：

艺术史解释：

故事性：

中文自然度：

幽默是否合适：

是否真正说明作品价值：

是否有无关背景：

是否有遗漏的关键维度：

更喜欢旧版还是新版：

是否接受取消 Research Card：

是否接受取消 Writing Plan：

是否接受新 prompt：
`;
}

async function latestAcceptedExperiment(caseId) {
  const caseRoot = path.join(projectRoot, "research/runs/experiment", caseId);
  const runIds = (await fs.readdir(caseRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const runId of runIds) {
    try {
      const runRoot = path.join(caseRoot, runId);
      const result = JSON.parse(await fs.readFile(path.join(runRoot, "result.json"), "utf8"));
      if (result.status === "accepted") return { runRoot, result };
    } catch {
      // Ignore incomplete experiment runs.
    }
  }
  throw new Error(`no accepted experiment found for ${caseId}`);
}

export function comparisonV3Markdown(comparison) {
  const old = comparison.oldPipeline;
  const sol = comparison.solV2;
  const luna = comparison.lunaV3;
  return `# 《海变》One-shot v3 三组成本对照

| 指标 | 旧 production 流程 | Sol Medium One-shot v2 | Luna High One-shot v3 |
| --- | ---: | ---: | ---: |
| 模型 | ${old.model} | ${sol.model} | ${luna.model} |
| reasoning effort | ${old.reasoningEffort} | ${sol.reasoningEffort} | ${luna.reasoningEffort} |
| 调用次数 | ${old.callsTouchingWork}（Research 与 ${old.researchBatch.workCount} 件共享） | ${sol.callCount} | ${luna.callCount} |
| input tokens | unavailable | ${formatMetric(sol.inputTokens)} | ${formatMetric(luna.inputTokens)} |
| cached input tokens | unavailable | ${formatMetric(sol.cachedInputTokens)} | ${formatMetric(luna.cachedInputTokens)} |
| reasoning tokens | unavailable | ${formatMetric(sol.reasoningTokens)} | ${formatMetric(luna.reasoningTokens)} |
| output tokens | unavailable | ${formatMetric(sol.outputTokens)} | ${formatMetric(luna.outputTokens)} |
| total tokens | ${formatMetric(old.comparableAmortizedTokens)}（单件均摊） | ${formatMetric(sol.totalTokens)} | ${formatMetric(luna.totalTokens)} |
| 搜索次数 | unavailable | ${formatMetric(sol.searchCount)} | ${formatMetric(luna.searchCount)} |
| 来源数量 | unavailable | ${formatMetric(sol.sourceCount)} | ${formatMetric(luna.sourceCount)} |
| 运行时间 | ${(old.comparableAmortizedDurationMs / 1000).toFixed(1)} 秒（单件均摊） | ${(sol.durationMs / 1000).toFixed(1)} 秒 | ${(luna.durationMs / 1000).toFixed(1)} 秒 |
| article bytes | ${formatMetric(old.draftBytes)} | ${formatMetric(sol.articleBytes)} | ${formatMetric(luna.articleBytes)} |
| 机械验证 | production accepted | ${sol.mechanicalGate} | ${luna.mechanicalGate} |

口径说明：

- 旧 Research 是覆盖 ${old.researchBatch.workCount} 件作品的共享调用；旧流程 total tokens 使用 Research 均摊加本件 Author，无法还原 input / cached / reasoning / output 明细。
- One-shot 的 input tokens 是一次 Codex turn 内全部工具循环的累计输入，不是首次静态 prompt 的大小。
- cached input tokens 是 input tokens 的子集，没有再次加进 total tokens。
- 表中只记录内容实验自身的 Codex exec usage，不包含外层 Codex 编写、运行或检查实验代码的成本。
`;
}

function sourceList(sources) {
  return sources.sources
    .map((source) => `- ${source.publisher}：《${source.title}》— ${source.url}`)
    .join("\n") || "- unavailable";
}

export function humanReviewV3Markdown({
  oldDraft,
  solArticle,
  lunaArticle,
  oldSources,
  solSources,
  lunaSources,
  comparison,
  solResult,
  lunaGate,
}) {
  return `# 《海变》One-shot v3 人工对照

## 三版“一分钟看懂”

### 旧版

${extractOldQuick(oldDraft)}

### Sol Medium One-shot v2

${extractCard(solArticle).trim()}

### Luna High One-shot v3

${extractCard(lunaArticle).trim()}

## 三版完整正文

### 旧 production 流程

${oldDraft.trim()}

### Sol Medium One-shot v2

${solArticle.trim()}

### Luna High One-shot v3

${lunaArticle.trim()}

## 三版来源摘要

### 旧 production 流程

旧研究卡共提取 ${oldSources.length} 个 URL：

${oldSources.map((url) => `- ${url}`).join("\n") || "- unavailable"}

### Sol Medium One-shot v2

${sourceList(solSources)}

### Luna High One-shot v3

${sourceList(lunaSources)}

## 三版成本

${comparisonV3Markdown(comparison)}

## 三版机械验证

- 旧 production 流程：accepted
- Sol v2：${solResult.mechanicalGate}；Production 未变化：${solResult.verification?.checks?.productionUnchanged ?? "unavailable"}
- Luna v3：${lunaGate.status}；Production 未变化：${lunaGate.checks.productionUnchanged}

## 人工评价

事实准确性：

视觉分析：

艺术史解释：

故事性：

中文自然度：

幽默是否合适：

是否真正说明作品价值：

是否有无关背景：

是否有遗漏：

更喜欢哪一版：

Luna 是否达到 Sol v2 的质量：

Luna 是否值得作为默认单件模型：
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args["run-id"]) throw new Error("--run-id is required");
  const variant = args.variant ?? "sol-v2";
  if (!["sol-v2", "luna-v3"].includes(variant)) throw new Error(`unsupported experiment variant: ${variant}`);
  const config = variant === "luna-v3"
    ? lunaV3
    : { caseId: experimentCaseId, model: experimentModel, reasoningEffort: experimentEffort };
  const manifest = await loadManifest(projectRoot);
  const configured = manifest.modelRouting?.author;
  if (variant === "sol-v2" &&
      (configured?.model !== experimentModel || configured?.reasoningEffort !== experimentEffort)) {
    throw new Error("manifest author routing no longer matches Sol Medium");
  }
  if (variant === "luna-v3" && manifest.modelRouting?.image_disambiguation?.model !== config.model) {
    throw new Error("manifest no longer identifies the configured Luna model");
  }
  const runRoot = resolveRunRoot({
    projectRoot,
    manifest,
    runKind: "experiment",
    caseId: config.caseId,
    runId: args["run-id"],
  });
  const descriptor = await readAndValidateRunDescriptor(runRoot, manifest, projectRoot);
  assertWritableRun(descriptor, manifest);
  assertOneShotDescriptor(descriptor, config.caseId);
  if (descriptor.status !== "created") throw new Error(`experiment must start at created, received ${descriptor.status}`);

  const imageEvidence = JSON.parse(await fs.readFile(path.join(productionRoot, "verified-image-evidence.json"), "utf8"));
  const image = imageEvidence.works.find((work) => work.workId === "sea-change");
  if (!image || image.status !== "accepted") throw new Error("canonical Sea Change image evidence is unavailable");
  const imagePath = path.join(productionRoot, "image-evidence/assets/sea-change.jpg");
  if (sha256(await fs.readFile(imagePath)) !== image.selected.sha256) throw new Error("verified image hash drift");
  const workContext = JSON.parse(await fs.readFile(path.join(productionWorkRoot, "work-context.json"), "utf8"));
  const oldPlan = JSON.parse(await fs.readFile(path.join(productionWorkRoot, "writing-plan.json"), "utf8"));

  const productionLocked = {
    schemaVersion: 1,
    museumId: "seattle",
    workId: "sea-change",
    objectType: "painting",
    titleZh: "海变",
    titleEn: "Sea Change",
    artistZh: "杰克逊·波洛克",
    artistEn: "Jackson Pollock",
    displayDate: oldPlan.displayMetadata.date,
    medium: oldPlan.displayMetadata.material,
    accessionNumber: workContext.identity.identityAnchor,
    museumName: "Seattle Art Museum",
    officialObjectUrl: image.identity.identitySourceUrl,
    verifiedImage: image.selected.url,
    verifiedImageLocalPath: path.relative(projectRoot, imagePath).replaceAll("\\", "/"),
    verifiedImageSha256: image.selected.sha256,
    significance: workContext.selection.significance,
    priority: workContext.selection.priority,
    sectionId: workContext.selection.sectionId,
    stay: workContext.selection.stay,
    availability: workContext.selection.availability,
    imagePolicy: workContext.selection.imagePolicy,
  };
  const v2Baseline = variant === "luna-v3"
    ? await latestAcceptedExperiment("sea-change-sol-one-shot-writing-v2")
    : null;
  const locked = assertCleanLockedMetadata(v2Baseline
    ? JSON.parse(await fs.readFile(path.join(v2Baseline.runRoot, "input/locked-metadata.json"), "utf8"))
    : productionLocked);
  if (locked.verifiedImageSha256 !== sha256(await fs.readFile(imagePath))) {
    throw new Error("v2 locked metadata image hash drift");
  }

  const inputRoot = path.join(runRoot, "input");
  const outputRoot = path.join(runRoot, "output");
  const integrationRoot = path.join(runRoot, "integration");
  await fs.mkdir(inputRoot);
  await fs.mkdir(outputRoot);
  await fs.mkdir(integrationRoot);
  await atomicJson(path.join(inputRoot, "locked-metadata.json"), locked);
  const protectedSnapshot = await snapshotProtectedPaths(projectRoot, protectedPaths);
  await atomicJson(path.join(inputRoot, "production-snapshot.json"), {
    paths: protectedPaths,
    snapshot: protectedSnapshot,
  });
  const responseSchema = {
    type: "object",
    additionalProperties: false,
    required: ["article", "sourcesJson"],
    properties: {
      article: { type: "string" },
      sourcesJson: { type: "string" },
    },
  };
  await atomicJson(path.join(inputRoot, "response-schema.json"), responseSchema);

  const experimentalPrompt = await fs.readFile(promptPath, "utf8");
  const prompt = `${experimentalPrompt}

## 本次锁定 metadata

\`\`\`json
${JSON.stringify(locked, null, 2)}
\`\`\`

你已经获得同一作品的已验证图片附件。只返回符合 response schema 的 JSON 对象：

- \`article\`：完整 Markdown 文章；
- \`sourcesJson\`：有效 JSON 字符串，内容严格遵循 prompt 的 sources.json 结构。

不要调用文件工具，不要读取本地文件。`;
  const promptBytes = Buffer.byteLength(prompt);
  await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "running" });

  let execution;
  try {
    execution = await runCodex({
      runRoot,
      prompt,
      imagePath,
      schemaPath: path.join(inputRoot, "response-schema.json"),
      logPath: path.join(runRoot, "runner.log"),
      model: config.model,
      reasoningEffort: config.reasoningEffort,
    });
    if (execution.exitCode !== 0) throw new Error(`codex exited with ${execution.exitCode}`);
    if (!execution.response?.article || !execution.response?.sourcesJson) {
      throw new Error("model response did not match one-shot response schema");
    }
    let sources;
    try { sources = JSON.parse(execution.response.sourcesJson); } catch {
      throw new Error("model sourcesJson is not valid JSON");
    }
    await fs.writeFile(path.join(outputRoot, "article.md"), execution.response.article, { flag: "wx" });
    await atomicJson(path.join(outputRoot, "sources.json"), sources);

    const gate = await verifyOneShotOutput({
      projectRoot,
      runRoot,
      expectedMetadata: locked,
      protectedPaths,
      protectedSnapshot,
      model: config.model,
      reasoningEffort: config.reasoningEffort,
      allowedModel: config.model,
      allowedReasoningEffort: config.reasoningEffort,
    });
    if (gate.status !== "passed") throw new Error(`mechanical gate failed: ${gate.failures.join("; ")}`);

    const article = await fs.readFile(path.join(outputRoot, "article.md"), "utf8");
    const card = extractCard(article);
    await fs.writeFile(path.join(integrationRoot, "card.txt"), card, { flag: "wx" });
    await fs.writeFile(path.join(integrationRoot, "draft.md"), article, { flag: "wx" });
    await atomicJson(path.join(integrationRoot, "display-metadata.json"), buildDisplayMetadata(locked));
    await atomicJson(path.join(integrationRoot, "sources.json"), sources);
    await atomicJson(path.join(integrationRoot, "adapter-result.json"), {
      schemaVersion: 1,
      modelCalls: 0,
      cardRule: "first non-empty paragraph under ## 一分钟看懂; no rewriting or model call",
      draftRule: "byte-for-byte copy of output/article.md",
      displayMetadataRule: "deterministic mapping from input/locked-metadata.json",
      sourcesRule: "validated structural copy of output/sources.json",
      outputHashes: {
        card: sha256(await fs.readFile(path.join(integrationRoot, "card.txt"))),
        draft: sha256(await fs.readFile(path.join(integrationRoot, "draft.md"))),
        displayMetadata: sha256(await fs.readFile(path.join(integrationRoot, "display-metadata.json"))),
        sources: sha256(await fs.readFile(path.join(integrationRoot, "sources.json"))),
      },
    });

    const oldDraft = await fs.readFile(path.join(productionWorkRoot, "draft.md"), "utf8");
    const oldCard = await fs.readFile(path.join(productionWorkRoot, "card.txt"), "utf8");
    const researchCardPath = path.join(productionRoot, "research-batch-01/sea-change-research-card.md");
    const oldResearchCard = await fs.readFile(researchCardPath, "utf8");
    const oldPlanText = await fs.readFile(path.join(productionWorkRoot, "writing-plan.json"), "utf8");
    const oldResearchResult = JSON.parse(await fs.readFile(path.join(productionRoot, "research-batch-01/research-result.json"), "utf8"));
    const oldAuthorResult = JSON.parse(await fs.readFile(path.join(productionWorkRoot, "author-result.json"), "utf8"));
    const oldPipeline = oldPipelineMetrics(oldResearchResult, oldAuthorResult, {
      researchCardBytes: Buffer.byteLength(oldResearchCard),
      writingPlanBytes: Buffer.byteLength(oldPlanText),
      cardBytes: Buffer.byteLength(oldCard),
      draftBytes: Buffer.byteLength(oldDraft),
    });
    const oneShot = {
      model: config.model,
      reasoningEffort: config.reasoningEffort,
      callCount: 1,
      inputTokens: execution.inputTokens,
      cachedInputTokens: execution.cachedInputTokens,
      reasoningTokens: execution.reasoningTokens,
      outputTokens: execution.outputTokens,
      totalTokens: execution.totalTokens,
      promptBytes,
      searchCount: execution.searchCount,
      sourceCount: gate.sourceCount,
      durationMs: execution.durationMs,
      articleBytes: gate.articleBytes,
      sourcesBytes: gate.sourcesBytes,
      cardBytes: Buffer.byteLength(card),
      infrastructureRetry: false,
      mechanicalGate: "passed",
    };
    const savings = typeof execution.totalTokens === "number"
      ? {
          tokensSaved: oldPipeline.comparableAmortizedTokens - execution.totalTokens,
          percentSaved: Number((((oldPipeline.comparableAmortizedTokens - execution.totalTokens)
            / oldPipeline.comparableAmortizedTokens) * 100).toFixed(1)),
        }
      : { tokensSaved: "unavailable", percentSaved: "unavailable" };
    let comparison;
    let comparisonText;
    let humanReview;
    if (variant === "luna-v3") {
      const solBaseline = v2Baseline;
      const solArticle = await fs.readFile(path.join(solBaseline.runRoot, "output/article.md"), "utf8");
      const solSources = JSON.parse(await fs.readFile(path.join(solBaseline.runRoot, "output/sources.json"), "utf8"));
      comparison = {
        schemaVersion: 2,
        tokenAccounting:
          "One-shot inputTokens is cumulative across the Codex turn tool loop; cachedInputTokens is a subset and is not added again.",
        oldPipeline,
        solV2: experimentMetrics(solBaseline.result),
        lunaV3: oneShot,
      };
      comparisonText = comparisonV3Markdown(comparison);
      humanReview = humanReviewV3Markdown({
        oldDraft,
        solArticle,
        lunaArticle: article,
        oldSources: sourceSummaryFromResearchCard(oldResearchCard),
        solSources,
        lunaSources: sources,
        comparison,
        solResult: solBaseline.result,
        lunaGate: gate,
      });
    } else {
      comparison = { schemaVersion: 1, oldPipeline, oneShot, savings };
      comparisonText = comparisonMarkdown(comparison);
      humanReview = humanReviewMarkdown({
        oldDraft,
        newArticle: article,
        oldQuick: extractOldQuick(oldDraft),
        newQuick: extractCard(article).trim(),
        oldSources: sourceSummaryFromResearchCard(oldResearchCard),
        sources,
        comparison,
        gate,
      });
    }
    await atomicJson(path.join(runRoot, "comparison.json"), comparison);
    await fs.writeFile(path.join(runRoot, "comparison.md"), comparisonText, { flag: "wx" });
    await fs.writeFile(path.join(runRoot, "comparison-for-human-review.md"), humanReview, { flag: "wx" });
    const result = {
      schemaVersion: 1,
      runId: descriptor.runId,
      runKind: "experiment",
      caseId: config.caseId,
      museumId: "seattle",
      workId: "sea-change",
      model: config.model,
      reasoningEffort: config.reasoningEffort,
      callCount: 1,
      ...execution,
      promptBytes,
      sourceCount: gate.sourceCount,
      articleBytes: gate.articleBytes,
      sourcesBytes: gate.sourcesBytes,
      infrastructureRetry: false,
      adapterModelCalls: 0,
      mechanicalGate: "passed",
      status: "accepted",
      outputs: [
        "output/article.md",
        "output/sources.json",
        "integration/card.txt",
        "integration/draft.md",
        "integration/display-metadata.json",
        "integration/sources.json",
      ],
      verification: gate,
    };
    delete result.response;
    delete result.exitCode;
    await atomicJson(path.join(runRoot, "result.json"), result);
    await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "verified" });
    await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "accepted" });
    process.stdout.write(`${JSON.stringify({
      runRoot: path.relative(projectRoot, runRoot).replaceAll("\\", "/"),
      result,
      savings,
    }, null, 2)}\n`);
  } catch (error) {
    const current = await readAndValidateRunDescriptor(runRoot, manifest, projectRoot);
    if (current.status === "running") {
      await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "failed" });
    }
    try {
      await atomicJson(path.join(runRoot, "result.json"), {
        schemaVersion: 1,
        runId: descriptor.runId,
        runKind: "experiment",
        caseId: config.caseId,
        museumId: "seattle",
        workId: "sea-change",
        model: config.model,
        reasoningEffort: config.reasoningEffort,
        callCount: 1,
        inputTokens: execution?.inputTokens ?? "unavailable",
        cachedInputTokens: execution?.cachedInputTokens ?? "unavailable",
        reasoningTokens: execution?.reasoningTokens ?? "unavailable",
        outputTokens: execution?.outputTokens ?? "unavailable",
        totalTokens: execution?.totalTokens ?? "unavailable",
        searchCount: execution?.searchCount ?? "unavailable",
        durationMs: execution?.durationMs ?? "unavailable",
        promptBytes,
        infrastructureRetry: false,
        status: "failed",
        failure: error.message,
      });
    } catch {
      // Preserve the first result if the failure occurred after it was written.
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
