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
  assertDirectWriteRunDescriptor,
  directWriteEffort,
  directWriteModel,
  experimentCaseId,
  normalizeDirectWriteEvidence,
  snapshotProtectedPaths,
  verifyDirectWriteOutput,
} from "./verify-direct-write-output.mjs";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const projectRoot = path.resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const oldRoot = path.join(projectRoot, "research/runs/production/seattle/m28-12-seattle");
const oldWorkRoot = path.join(oldRoot, "works/sea-change");
const protectedPaths = [
  "research/content/seattle.md",
  "research/runs/production/seattle",
  "seattle.js",
  "museum-expansions.js",
  "routes.js",
  "museums.js",
  "index.html",
  "museum.html",
];

function parseArgs(argv) {
  return Object.fromEntries(argv.map((arg) => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

function selectInstructionSections(text, sectionIds) {
  const first = text.search(/^##\s+/m);
  if (first < 0) throw new Error("canonical instruction has no numbered sections");
  const parts = [text.slice(0, first).trimEnd()];
  for (const id of sectionIds) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`^##\\s+${escaped}\\.\\s.*?(?=^##\\s+|(?![\\s\\S]))`, "ms"));
    if (!match) throw new Error(`missing canonical instruction section ${id}`);
    parts.push(match[0].trimEnd());
  }
  return `${parts.join("\n\n")}\n`;
}

async function atomicJson(file, value) {
  const temporary = `${file}.tmp-${process.pid}`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  await fs.rename(temporary, file);
}

async function runCodex({ runRoot, prompt, imagePath, logPath, schemaPath }) {
  const args = [
    "exec",
    "--model", directWriteModel,
    "--config", 'model_reasoning_effort="medium"',
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
  let output = "";
  const record = async (chunk, stream) => {
    const text = chunk.toString("utf8");
    output += text;
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
  const events = output
    .split(/\r?\n/)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
  const message = events
    .filter((event) => event.type === "item.completed" && event.item?.type === "agent_message")
    .at(-1)?.item?.text;
  let response;
  try { response = message ? JSON.parse(message) : null; } catch { response = null; }
  const usage = events.filter((event) => event.type === "turn.completed").at(-1)?.usage ?? {};
  const totalTokens = Number.isFinite(usage.input_tokens) && Number.isFinite(usage.output_tokens)
    ? usage.input_tokens + usage.output_tokens
    : "unavailable";
  const searchCount = new Set(
    events
      .filter((event) =>
        event.type === "item.completed" &&
        (event.item?.type === "web_search" || event.item?.type === "web_search_call"))
      .map((event) => event.item?.id)
      .filter(Boolean),
  ).size;
  return {
    exitCode,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs: completed - started,
    totalTokens,
    inputTokens: usage.input_tokens ?? "unavailable",
    cachedInputTokens: usage.cached_input_tokens ?? "unavailable",
    outputTokens: usage.output_tokens ?? "unavailable",
    reasoningTokens: usage.reasoning_output_tokens ?? "unavailable",
    searchCount: searchCount || "unavailable",
    response,
  };
}

function metricsFromJsonLog(logText, descriptor) {
  const events = logText
    .split(/\r?\n/)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
  const usage = events.filter((event) => event.type === "turn.completed").at(-1)?.usage ?? {};
  return {
    exitCode: 0,
    startedAt: descriptor.createdAt,
    completedAt: descriptor.updatedAt,
    durationMs: new Date(descriptor.updatedAt) - new Date(descriptor.createdAt),
    totalTokens: Number.isFinite(usage.input_tokens) && Number.isFinite(usage.output_tokens)
      ? usage.input_tokens + usage.output_tokens
      : "unavailable",
    inputTokens: usage.input_tokens ?? "unavailable",
    cachedInputTokens: usage.cached_input_tokens ?? "unavailable",
    outputTokens: usage.output_tokens ?? "unavailable",
    reasoningTokens: usage.reasoning_output_tokens ?? "unavailable",
    searchCount: new Set(
      events
        .filter((event) =>
          event.type === "item.completed" &&
          (event.item?.type === "web_search" || event.item?.type === "web_search_call"))
        .map((event) => event.item?.id)
        .filter(Boolean),
    ).size || "unavailable",
  };
}

function oldPipelineMetrics(researchResult, authorResult, oldDraftBytes, oldEvidenceBytes) {
  const batchWorks = researchResult.outputs.length;
  const sharedResearchTokens = researchResult.tokenUsage.total;
  const amortizedResearchTokens = Math.round(sharedResearchTokens / batchWorks);
  return {
    model: "Sol Medium",
    callsTouchingWork: 2,
    amortizedCalls: 1 + (1 / batchWorks),
    sharedResearchBatch: {
      workCount: batchWorks,
      tokens: sharedResearchTokens,
      durationMs: researchResult.modelDurationMs,
    },
    author: {
      tokens: authorResult.tokenUsage.total,
      durationMs: authorResult.modelDurationMs,
    },
    comparableAmortizedTokens: amortizedResearchTokens + authorResult.tokenUsage.total,
    comparableAmortizedDurationMs: Math.round(researchResult.modelDurationMs / batchWorks) + authorResult.modelDurationMs,
    fullCallsTouchingWorkTokens: sharedResearchTokens + authorResult.tokenUsage.total,
    researchCard: true,
    writingPlan: true,
    draftBytes: oldDraftBytes,
    evidenceBytes: oldEvidenceBytes,
    searchCount: "unavailable",
  };
}

function comparisonMarkdown(comparison) {
  const old = comparison.oldPipeline;
  const fresh = comparison.directWrite;
  return `# 《海变》Sol Direct Write 成本对照

| 指标 | 旧流程 | Sol 直写 |
| --- | ---: | ---: |
| 模型 | Sol Medium | Sol Medium |
| 触及本作的模型调用 | ${old.callsTouchingWork}（其中 research 与 9 件共享） | ${fresh.callCount} |
| Research token | ${old.sharedResearchBatch.tokens.toLocaleString()} / 10 件；均摊 ${Math.round(old.sharedResearchBatch.tokens / old.sharedResearchBatch.workCount).toLocaleString()} | 不适用 |
| Author token | ${old.author.tokens.toLocaleString()} | 不适用 |
| 可比总 token | ${old.comparableAmortizedTokens.toLocaleString()}（研究均摊 + author） | ${typeof fresh.successfulAttemptTokens === "number" ? fresh.successfulAttemptTokens.toLocaleString() : fresh.successfulAttemptTokens}（成功调用） |
| Research Card | 有 | 无 |
| Writing Plan | 有 | 无 |
| Draft bytes | ${old.draftBytes} | ${fresh.draftBytes} |
| Evidence bytes | ${old.evidenceBytes} | ${fresh.evidenceBytes} |
| 搜索次数 | ${old.searchCount} | ${fresh.searchCount} |
| 可比运行时长 | ${(old.comparableAmortizedDurationMs / 1000).toFixed(1)} 秒 | ${(fresh.durationMs / 1000).toFixed(1)} 秒 |
| 机械验证 | passed | ${fresh.mechanicalGate} |

旧 research 是一次覆盖 10 件作品的真实调用；把 190,910 tokens 全部算给《海变》会夸大旧流程成本，因此节省率以 19,091 tokens 的均摊研究成本加 34,079 tokens 的独立 author 成本计算。完整批次数字仍原样保留。

本次实验第一次调用因 CLI 将 sandbox 降为 read-only 而无法落盘，属于基础设施输出失败；若发生过该失败，实际实验总成本另记为 ${typeof fresh.totalTokens === "number" ? fresh.totalTokens.toLocaleString() : fresh.totalTokens} tokens，不把它伪装成稳态 direct-write 成本。
`;
}

function humanReviewMarkdown({ oldCard, oldDraft, newDraft, comparison, evidence }) {
  return `# 《海变》人工对照

## 旧短摘要

${oldCard.trim()}

## 新短摘要

${newDraft.match(/## 短摘要\s*([\s\S]*?)(?=\n## )/)?.[1]?.trim() ?? "未提取"}

## 旧完整正文

${oldDraft.trim()}

## 新完整正文

${newDraft.trim()}

## 成本对照

${comparisonMarkdown(comparison)}

## 新 evidence 摘要

- 来源数：${evidence.sources.length}
- Claims：${evidence.claims.length}
- Uncertainties：${evidence.uncertainties.length}
- High-risk claims：${evidence.highRiskClaims.length}

## 机械 gate

${comparison.directWrite.mechanicalGate}

## 人工评估

事实准确性：

视觉分析：

艺术史解释：

中文自然度：

是否真正说明作品价值：

更喜欢旧版还是新版：

是否接受取消 Research Card：

是否接受取消 Writing Plan：
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args["run-id"]) throw new Error("--run-id is required");
  const manifest = await loadManifest(projectRoot);
  const runRoot = resolveRunRoot({
    projectRoot,
    manifest,
    runKind: "experiment",
    caseId: experimentCaseId,
    runId: args["run-id"],
  });
  const descriptor = await readAndValidateRunDescriptor(runRoot, manifest, projectRoot);
  assertWritableRun(descriptor, manifest);
  assertDirectWriteRunDescriptor(descriptor);
  if (descriptor.status !== "created") throw new Error(`experiment must start at created, received ${descriptor.status}`);
  let retry = null;
  if (args["retry-of"]) {
    const previousRoot = resolveRunRoot({
      projectRoot,
      manifest,
      runKind: "experiment",
      caseId: experimentCaseId,
      runId: args["retry-of"],
    });
    const previous = await readAndValidateRunDescriptor(previousRoot, manifest, projectRoot);
    if (previous.status !== "failed") throw new Error("--retry-of must identify a failed run");
    const previousLog = await fs.readFile(path.join(previousRoot, "runner.log"), "utf8");
    const tokenMatches = [...previousLog.matchAll(/tokens used\s*(?:\r?\n)+\s*([\d,]+)/gi)];
    retry = {
      runId: previous.runId,
      reason: "read_only_sandbox_blocked_required_output_files",
      tokens: tokenMatches.length ? Number(tokenMatches.at(-1)[1].replaceAll(",", "")) : "unavailable",
    };
  }
  if (args["transport-failure-of"]) {
    const transportRoot = resolveRunRoot({
      projectRoot,
      manifest,
      runKind: "experiment",
      caseId: experimentCaseId,
      runId: args["transport-failure-of"],
    });
    const transport = await readAndValidateRunDescriptor(transportRoot, manifest, projectRoot);
    if (transport.status !== "failed") throw new Error("--transport-failure-of must identify a failed run");
    retry = {
      ...retry,
      transportFailureRunId: transport.runId,
      transportFailure: "invalid_response_schema_rejected_before_model_execution",
      transportFailureTokens: 0,
    };
  }
  let recovery = null;
  if (args["recover-from"]) {
    const recoveryRoot = resolveRunRoot({
      projectRoot,
      manifest,
      runKind: "experiment",
      caseId: experimentCaseId,
      runId: args["recover-from"],
    });
    const recoveryDescriptor = await readAndValidateRunDescriptor(recoveryRoot, manifest, projectRoot);
    if (recoveryDescriptor.status !== "failed") throw new Error("--recover-from must identify a failed run");
    recovery = { runRoot: recoveryRoot, descriptor: recoveryDescriptor };
  }

  const imageEvidence = JSON.parse(await fs.readFile(path.join(oldRoot, "verified-image-evidence.json"), "utf8"));
  const image = imageEvidence.works.find((work) => work.workId === "sea-change");
  if (!image || image.status !== "accepted") throw new Error("canonical Sea Change image evidence is unavailable");
  const imagePath = path.join(oldRoot, "image-evidence/assets/sea-change.jpg");
  const imageHash = sha256(await fs.readFile(imagePath));
  if (imageHash !== image.selected.sha256) throw new Error("verified Sea Change image hash drift");

  const workInput = {
    schemaVersion: 1,
    museumId: "seattle",
    workId: "sea-change",
    title: "Sea Change",
    artist: "Jackson Pollock",
    date: "1947",
    medium: "artist and commercial oil paint, with gravel, on canvas",
    accessionNumber: "58.55",
    officialObjectUrl: "https://art.seattleartmuseum.org/objects/2742/sea-change",
    verifiedImage: image.selected.url,
    verifiedImageLocalPath: path.relative(projectRoot, imagePath).replaceAll("\\", "/"),
    verifiedImageSha256: imageHash,
    currentDisplayStatus: "unknown",
    identityEvidence: [
      image.identity.identitySourceUrl,
      "research/runs/production/seattle/m28-12-seattle/candidate-pool/candidate-pool.json",
    ],
    imageEvidence: [
      image.selected.evidenceId,
      image.selected.url,
      image.selected.sha256,
    ],
  };
  const inputRoot = path.join(runRoot, "input");
  const outputRoot = path.join(runRoot, "output");
  await fs.mkdir(inputRoot);
  await fs.mkdir(outputRoot);
  await atomicJson(path.join(inputRoot, "work-input.json"), workInput);
  const protectedSnapshot = await snapshotProtectedPaths(projectRoot, protectedPaths);
  await atomicJson(path.join(inputRoot, "production-snapshot.json"), { paths: protectedPaths, snapshot: protectedSnapshot });
  const responseSchema = {
    type: "object",
    additionalProperties: false,
    required: ["draft", "evidenceJson"],
    properties: {
      draft: { type: "string" },
      evidenceJson: { type: "string" },
    },
  };
  await atomicJson(path.join(inputRoot, "response-schema.json"), responseSchema);

  const canonicalInstruction = await fs.readFile(path.join(projectRoot, manifest.canonicalInstruction), "utf8");
  const instructionSections = manifest.stageInstructionViews.author;
  const instructionView = selectInstructionSections(canonicalInstruction, instructionSections);
  const prompt = `You are running one isolated Meowseum experiment for Jackson Pollock's Sea Change.

This is the only model call. Use model ${directWriteModel} at reasoning effort ${directWriteEffort}. Research and write in this same task.

Hard boundaries:
- Treat input/work-input.json and the attached verified image as locked identity and image evidence.
- Open the official object URL and, only when needed, search a small number of reliable sources.
- Do not read any other local file. In particular, do not read old research cards, writing plans, cards, drafts, production runs, conversation history, memory, or project instructions outside this prompt.
- Return one JSON object with keys draft and evidenceJson matching the supplied output schema. evidenceJson must itself be a valid JSON string containing the evidence object. The external runner will materialize exactly output/draft.md and output/evidence.json.
- Do not use file-writing tools. Do not create research-card.json, writing-plan.json, story-beats.json, author bundles, notes, or extra files.
- Do not expose reasoning or search process.

Output/draft.md must use exactly:
# Sea Change
## 短摘要
## 30 秒先懂
## 多停几分钟
## 最后再看一眼

Write natural Chinese for a zero-background museum visitor. State why the work matters, give concrete visual entry points, explain form and materials, and place it carefully within Pollock's changing practice. Do not copy existing prose. If current display status cannot be confirmed, say so conservatively.

Output/evidence.json must be concise JSON with schemaVersion, museumId, workId, model, reasoningEffort, sources, claims, uncertainties, and highRiskClaims. The official museum source must explicitly support identity, date, medium, accessionNumber, and collectionRelation. Mark direct observations from the attached verified image as verified_image_observation. Every claim sourceIds reference must exist. Record no long research summary, writing plan, or chain of thought.

Locked work input:
${JSON.stringify(workInput, null, 2)}

Current canonical content instruction view:
${instructionView}`;
  const promptBytes = Buffer.byteLength(prompt);
  await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "running" });
  let execution;
  try {
    let responseDraft;
    let responseEvidence;
    if (recovery) {
      const recoveryLog = await fs.readFile(path.join(recovery.runRoot, "runner.log"), "utf8");
      execution = metricsFromJsonLog(recoveryLog, recovery.descriptor);
      responseDraft = await fs.readFile(path.join(recovery.runRoot, "output/draft.md"), "utf8");
      responseEvidence = normalizeDirectWriteEvidence(
        JSON.parse(await fs.readFile(path.join(recovery.runRoot, "output/evidence.json"), "utf8")),
      );
      await fs.writeFile(
        path.join(runRoot, "runner.log"),
        `zero-model recovery from ${recovery.descriptor.runId}; normalized evidence aliases only\n`,
        { flag: "wx" },
      );
    } else {
      execution = await runCodex({
        runRoot,
        prompt,
        imagePath,
        logPath: path.join(runRoot, "runner.log"),
        schemaPath: path.join(inputRoot, "response-schema.json"),
      });
      if (execution.exitCode !== 0) throw new Error(`codex exited with ${execution.exitCode}`);
      if (!execution.response?.draft || !execution.response?.evidenceJson) {
        throw new Error("model response did not match the direct-write output schema");
      }
      responseDraft = execution.response.draft;
      try { responseEvidence = normalizeDirectWriteEvidence(JSON.parse(execution.response.evidenceJson)); } catch {
        throw new Error("model evidenceJson is not valid JSON");
      }
    }
    await fs.writeFile(path.join(outputRoot, "draft.md"), responseDraft, { flag: "wx" });
    await atomicJson(path.join(outputRoot, "evidence.json"), responseEvidence);
    const gate = await verifyDirectWriteOutput({
      projectRoot,
      runRoot,
      expectedInput: workInput,
      protectedSnapshot,
      protectedPaths,
      oldDraftPath: path.join(oldWorkRoot, "draft.md"),
    });
    if (gate.status !== "passed") throw new Error(`mechanical gate failed: ${gate.failures.join("; ")}`);

    const evidence = JSON.parse(await fs.readFile(path.join(outputRoot, "evidence.json"), "utf8"));
    const newDraft = await fs.readFile(path.join(outputRoot, "draft.md"), "utf8");
    const oldDraft = await fs.readFile(path.join(oldWorkRoot, "draft.md"), "utf8");
    const oldCard = await fs.readFile(path.join(oldWorkRoot, "card.txt"), "utf8");
    const researchResult = JSON.parse(await fs.readFile(path.join(oldRoot, "research-batch-01/research-result.json"), "utf8"));
    const authorResult = JSON.parse(await fs.readFile(path.join(oldWorkRoot, "author-result.json"), "utf8"));
    const oldEvidenceBytes = (await fs.stat(path.join(oldRoot, "research-batch-01/sea-change-research-card.md"))).size;
    const oldPipeline = oldPipelineMetrics(
      researchResult,
      authorResult,
      Buffer.byteLength(oldDraft),
      oldEvidenceBytes,
    );
    const aggregateTokens = typeof retry?.tokens === "number" && typeof execution.totalTokens === "number"
      ? retry.tokens + execution.totalTokens
      : execution.totalTokens;
    const directWrite = {
      model: directWriteModel,
      reasoningEffort: directWriteEffort,
      callCount: retry ? 2 : 1,
      successfulCallCount: 1,
      retryCount: retry ? 1 : 0,
      retry,
      recoveredFrom: recovery?.descriptor.runId ?? null,
      inputTokens: execution.inputTokens,
      cachedInputTokens: execution.cachedInputTokens,
      reasoningTokens: execution.reasoningTokens,
      outputTokens: execution.outputTokens,
      successfulAttemptTokens: execution.totalTokens,
      totalTokens: aggregateTokens,
      promptBytes,
      searchCount: execution.searchCount,
      sourceCount: gate.sourceCount,
      durationMs: execution.durationMs,
      mechanicalGate: "passed",
      status: "accepted",
      draftBytes: gate.draftBytes,
      evidenceBytes: gate.evidenceBytes,
      retried: Boolean(retry),
    };
    const comparable = typeof execution.totalTokens === "number"
      ? {
          steadyStateTokensSaved: oldPipeline.comparableAmortizedTokens - execution.totalTokens,
          steadyStatePercentSaved: Number(((oldPipeline.comparableAmortizedTokens - execution.totalTokens) / oldPipeline.comparableAmortizedTokens * 100).toFixed(1)),
          actualExperimentTokensSaved: typeof aggregateTokens === "number"
            ? oldPipeline.comparableAmortizedTokens - aggregateTokens
            : "unavailable",
          actualExperimentPercentSaved: typeof aggregateTokens === "number"
            ? Number(((oldPipeline.comparableAmortizedTokens - aggregateTokens) / oldPipeline.comparableAmortizedTokens * 100).toFixed(1))
            : "unavailable",
        }
      : {
          steadyStateTokensSaved: "unavailable",
          steadyStatePercentSaved: "unavailable",
          actualExperimentTokensSaved: "unavailable",
          actualExperimentPercentSaved: "unavailable",
        };
    const comparison = { schemaVersion: 1, oldPipeline, directWrite, comparable };
    await atomicJson(path.join(runRoot, "comparison.json"), comparison);
    await fs.writeFile(path.join(runRoot, "comparison.md"), comparisonMarkdown(comparison), { flag: "wx" });
    await fs.writeFile(
      path.join(runRoot, "comparison-for-human-review.md"),
      humanReviewMarkdown({ oldCard, oldDraft, newDraft, comparison, evidence }),
      { flag: "wx" },
    );
    const result = {
      schemaVersion: 1,
      runId: descriptor.runId,
      runKind: "experiment",
      caseId: experimentCaseId,
      museumId: "seattle",
      workId: "sea-change",
      model: directWriteModel,
      reasoningEffort: directWriteEffort,
      callCount: directWrite.callCount,
      successfulCallCount: 1,
      retryCount: directWrite.retryCount,
      retry,
      recoveredFrom: recovery?.descriptor.runId ?? null,
      inputTokens: execution.inputTokens,
      cachedInputTokens: execution.cachedInputTokens,
      reasoningTokens: execution.reasoningTokens,
      outputTokens: execution.outputTokens,
      successfulAttemptTokens: execution.totalTokens,
      totalTokens: aggregateTokens,
      promptBytes,
      searchCount: execution.searchCount,
      sourceCount: gate.sourceCount,
      durationMs: execution.durationMs,
      mechanicalGate: "passed",
      status: "accepted",
      retried: Boolean(retry),
      modelStartedAt: execution.startedAt,
      modelCompletedAt: execution.completedAt,
      outputs: ["output/draft.md", "output/evidence.json"],
      verification: gate,
    };
    await atomicJson(path.join(runRoot, "result.json"), result);
    await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "verified" });
    await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "accepted" });
    process.stdout.write(`${JSON.stringify({ runRoot: path.relative(projectRoot, runRoot).replaceAll("\\", "/"), result, comparison }, null, 2)}\n`);
  } catch (error) {
    const current = await readAndValidateRunDescriptor(runRoot, manifest, projectRoot);
    if (current.status === "running") await transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus: "failed" });
    throw error;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
