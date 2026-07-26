import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {
  assertPathInside,
  assertSafeIdentifier,
  loadManifest,
  readAndValidateRunDescriptor,
  resolveRunRoot,
} from "./lib/filesystem-contract.mjs";
import {atomicJson, readWorkStatus, writeWorkStatus} from "./lib/work-status.mjs";
import {
  canonicalOneShotEffort,
  canonicalOneShotModel,
  snapshotProtectedPaths,
  verifyOneShotWork,
} from "./verify-one-shot-work.mjs";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["article", "sourcesJson"],
  properties: {article: {type: "string"}, sourcesJson: {type: "string"}},
};
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const parseArgs = argv => Object.fromEntries(argv.map(arg => {
  if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
  const [key, ...rest] = arg.slice(2).split("=");
  return [key, rest.join("=")];
}));
const imageMime = bytes => {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (/^GIF8[79]a$/.test(bytes.subarray(0, 6).toString("ascii"))) return "image/gif";
  return null;
};
const copyTree = async (source, destination) => {
  await fs.mkdir(destination, {recursive: true});
  for (const entry of await fs.readdir(source, {withFileTypes: true})) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    else await fs.copyFile(from, to);
  }
};

async function runCodex({cwd, prompt, image, schema, log}) {
  const args = [
    "exec", "--model", canonicalOneShotModel,
    "--config", `model_reasoning_effort="${canonicalOneShotEffort}"`,
    "--ignore-user-config", "--ignore-rules", "--ephemeral",
    "--sandbox", "workspace-write", "--disable", "apps", "--disable", "memories",
    "--disable", "plugins", "--disable", "plugin_sharing", "--disable", "remote_plugin",
    "--output-schema", schema, "--json", "--color", "never", "-",
  ];
  if (image) args.splice(args.indexOf("--output-schema"), 0, "--image", image);
  const startedAt = new Date();
  const logHandle = await fs.open(log, "wx");
  const child = spawn("codex.cmd", args, {cwd, shell: process.platform === "win32", stdio: ["pipe", "pipe", "pipe"]});
  let raw = "";
  const record = chunk => { const text = chunk.toString("utf8"); raw += text; void logHandle.write(text); };
  child.stdout.on("data", record);
  child.stderr.on("data", record);
  child.stdin.end(prompt);
  const exitCode = await new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
  await logHandle.close();
  const events = raw.split(/\r?\n/).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
  const message = events.filter(event => event.type === "item.completed" && event.item?.type === "agent_message").at(-1)?.item?.text;
  const usage = events.filter(event => event.type === "turn.completed").at(-1)?.usage ?? {};
  const completedAt = new Date();
  return {
    exitCode,
    response: message ? JSON.parse(message) : null,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt - startedAt,
    inputTokens: usage.input_tokens ?? "unavailable",
    cachedInputTokens: usage.cached_input_tokens ?? "unavailable",
    reasoningTokens: usage.reasoning_output_tokens ?? "unavailable",
    outputTokens: usage.output_tokens ?? "unavailable",
    totalTokens: Number.isFinite(usage.input_tokens) && Number.isFinite(usage.output_tokens)
      ? usage.input_tokens + usage.output_tokens : "unavailable",
    agentRunCount: 1,
    modelRoundCount: events.filter(event => event.type === "turn.completed").length || "unavailable",
    webSearchCount: new Set(events.filter(event => event.type === "item.completed"
      && ["web_search", "web_search_call"].includes(event.item?.type)).map(event => event.item?.id).filter(Boolean)).size,
    webOpenCount: new Set(events.filter(event => event.type === "item.completed"
      && ["web_open", "web_open_call", "open_page"].includes(event.item?.type)).map(event => event.item?.id).filter(Boolean)).size,
  };
}

export async function runOneShotWork(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.kind || !args["run-id"] || !args["work-id"]) throw new Error("--kind, --run-id and --work-id are required");
  assertSafeIdentifier(args["work-id"], "work id");
  const projectRoot = path.resolve(args["project-root"] || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const manifest = await loadManifest(projectRoot);
  const runRoot = resolveRunRoot({
    projectRoot, manifest, runKind: args.kind, museumId: args.museum, caseId: args.case, runId: args["run-id"],
  });
  const descriptor = await readAndValidateRunDescriptor(runRoot, manifest, projectRoot);
  if (descriptor.pipelineVersion !== manifest.pipelineVersion) throw new Error("run pipeline version does not match current manifest");
  if (descriptor.immutable || manifest.filesystemContract.immutableStatuses.includes(descriptor.status)) throw new Error("run is immutable");
  if (descriptor.contentContract !== "one_shot_v1" && !args["allow-legacy-run"]) throw new Error("single-work generation requires contentContract=one_shot_v1");

  const workId = args["work-id"];
  const artifactRoot = path.join(runRoot, "works", workId, "one-shot");
  const lockedPath = path.join(artifactRoot, "input", "locked-metadata.json");
  const locked = JSON.parse(await fs.readFile(lockedPath, "utf8"));
  const targetMuseumId = descriptor.museumId ?? descriptor.targetMuseumId;
  if (locked.workId !== workId || (targetMuseumId && locked.museumId !== targetMuseumId)) throw new Error("locked metadata identity drift");
  const previous = await readWorkStatus(runRoot, workId);
  const attempt = (previous?.attempt ?? 0) + 1;
  const attemptRoot = path.join(artifactRoot, "attempts", String(attempt).padStart(2, "0"));
  await fs.mkdir(path.join(attemptRoot, "input"), {recursive: true});
  await fs.copyFile(lockedPath, path.join(attemptRoot, "input", "locked-metadata.json"));

  let imagePath;
  let imageBytes;
  let promptTemplate;
  try {
    imagePath = path.resolve(projectRoot, locked.verifiedImageLocalPath);
    await assertPathInside(runRoot, imagePath);
    imageBytes = await fs.readFile(imagePath);
    if (!imageBytes.length || !imageMime(imageBytes)) throw new Error("verified image is empty or has an unsupported MIME");
    if (sha256(imageBytes) !== locked.verifiedImageSha256) throw new Error("verified image SHA-256 mismatch");
    promptTemplate = await fs.readFile(path.join(projectRoot, manifest.canonicalOneShotPrompt), "utf8");
  } catch (error) {
    const result = {
      schemaVersion: 2, status: "failed", runId: descriptor.runId, museumId: locked.museumId,
      ...(descriptor.caseId ? {caseId:descriptor.caseId} : {}),
      workId, stage: "single_work", attempt, model: canonicalOneShotModel,
      reasoningEffort: canonicalOneShotEffort, agentRunCount: 0, modelRoundCount: 0,
      webSearchCount: 0, webOpenCount: 0, inputTokens: 0, cachedInputTokens: 0,
      reasoningTokens: 0, outputTokens: 0, totalTokens: 0,
      failureStage: "preflight", failureCode: "INPUT_CONTRACT_FAILURE", failureMessage: error.message,
    };
    await atomicJson(path.join(attemptRoot, "result.json"), result);
    await fs.writeFile(path.join(attemptRoot, "runner.log"), `${error.stack ?? error.message}\n`);
    await fs.writeFile(path.join(artifactRoot, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
    await fs.copyFile(path.join(attemptRoot, "runner.log"), path.join(artifactRoot, "runner.log"));
    await writeWorkStatus(runRoot, workId, {status: "verification_failed", attempt, lastStage: "preflight", verification: "failed"});
    throw error;
  }
  const imageNotice = locked.imagePolicy === "object_image"
    ? "你同时收到了一张已验证的作品图片。"
    : "本次没有可靠作品图；不得把馆舍占位图当作作品进行视觉分析。";
  const prompt = `${promptTemplate}\n\n${imageNotice}\n\n## 本次锁定 metadata\n\n\`\`\`json\n${JSON.stringify(locked, null, 2)}\n\`\`\`\n`;
  const schemaPath = path.join(attemptRoot, "input", "response-schema.json");
  await atomicJson(schemaPath, responseSchema);
  const protectedCandidates = [
    `research/content/${locked.museumId}.md`, "index.html", "museum.html",
    "museum-app.js", "museums.js", "routes.js", "ratings.js",
  ];
  const protectedPaths = [];
  for (const relative of protectedCandidates) {
    if (await fs.access(path.join(projectRoot, relative)).then(() => true).catch(() => false)) protectedPaths.push(relative);
  }
  const protectedSnapshot = await snapshotProtectedPaths(projectRoot, protectedPaths);
  await atomicJson(path.join(attemptRoot, "input", "production-snapshot.json"), {paths: protectedPaths, snapshot: protectedSnapshot});
  await writeWorkStatus(runRoot, workId, {status: "generating", attempt, lastStage: "single_work", model: canonicalOneShotModel});

  let execution = {agentRunCount: 0, modelRoundCount: 0, webSearchCount: 0, webOpenCount: 0};
  let result;
  let failure;
  try {
    execution = await runCodex({
      cwd: attemptRoot, prompt, image: locked.imagePolicy === "object_image" ? imagePath : null,
      schema: schemaPath, log: path.join(attemptRoot, "runner.log"),
    });
    if (execution.exitCode !== 0 || !execution.response?.article || !execution.response?.sourcesJson) {
      failure = {stage: "model_call", code: "MODEL_OR_FORMAT_FAILURE", message: `Luna one-shot exited ${execution.exitCode}`};
      throw new Error(failure.message);
    }
    const outputRoot = path.join(attemptRoot, "output");
    await fs.mkdir(outputRoot);
    await fs.writeFile(path.join(outputRoot, "article.md"), execution.response.article, {flag: "wx"});
    await fs.writeFile(path.join(outputRoot, "sources.json"), `${JSON.stringify(JSON.parse(execution.response.sourcesJson), null, 2)}\n`, {flag: "wx"});
    await writeWorkStatus(runRoot, workId, {status: "generated", attempt, lastStage: "single_work", verification: null});
    const verification = await verifyOneShotWork({
      projectRoot, artifactRoot: attemptRoot, expectedMetadata: locked, protectedPaths, protectedSnapshot,
      model: canonicalOneShotModel, reasoningEffort: canonicalOneShotEffort, runKind: args.kind,
    });
    await atomicJson(path.join(attemptRoot, "verification.json"), verification);
    if (verification.status !== "passed") {
      const conflict = verification.errors?.some(item => item.code === "BLOCKING_UPSTREAM_CONFLICT");
      failure = {stage: "verification", code: conflict ? "UPSTREAM_CONFLICT" : "VERIFICATION_FAILED", message: "one-shot verifier failed"};
      await writeWorkStatus(runRoot, workId, {
        status: conflict ? "blocked_needs_upstream_review" : "verification_failed",
        attempt, lastStage: "verification", verification: "failed",
      });
      throw new Error(failure.message);
    }
    await adaptOneShotWork({artifactRoot: attemptRoot, verification});
    await writeWorkStatus(runRoot, workId, {status: "integration_ready", attempt, lastStage: "integration", verification: "passed"});
    for (const directory of ["output", "integration"]) await copyTree(path.join(attemptRoot, directory), path.join(artifactRoot, directory));
    await fs.copyFile(path.join(attemptRoot, "verification.json"), path.join(artifactRoot, "verification.json"));
    result = {
      schemaVersion: 2, status: "accepted", runId: descriptor.runId, museumId: locked.museumId,
      ...(descriptor.caseId ? {caseId:descriptor.caseId} : {}),
      workId, stage: "single_work", attempt, model: canonicalOneShotModel,
      reasoningEffort: canonicalOneShotEffort, ...execution
    };
    delete result.response;
    delete result.exitCode;
    await writeWorkStatus(runRoot, workId, {status: "accepted", attempt, lastStage: "integration", verification: "passed"});
  } catch (error) {
    failure ??= {stage: "infrastructure", code: "UNHANDLED_FAILURE", message: error.message};
    result = {
      schemaVersion: 2, status: "failed", runId: descriptor.runId, museumId: locked.museumId,
      ...(descriptor.caseId ? {caseId:descriptor.caseId} : {}),
      workId, stage: "single_work", attempt, model: canonicalOneShotModel,
      reasoningEffort: canonicalOneShotEffort, ...execution,
      failureStage: failure.stage, failureCode: failure.code, failureMessage: failure.message,
    };
    delete result.response;
    const status = (await readWorkStatus(runRoot, workId))?.status;
    if (!["verification_failed", "blocked_needs_upstream_review"].includes(status)) {
      await writeWorkStatus(runRoot, workId, {status: "verification_failed", attempt, lastStage: failure.stage, verification: "failed"});
    }
  } finally {
    await atomicJson(path.join(attemptRoot, "result.json"), result);
    await fs.writeFile(path.join(artifactRoot, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
    try { await fs.copyFile(path.join(attemptRoot, "runner.log"), path.join(artifactRoot, "runner.log")); } catch {}
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "accepted") throw new Error(`${result.failureCode}: ${result.failureMessage}`);
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runOneShotWork().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
