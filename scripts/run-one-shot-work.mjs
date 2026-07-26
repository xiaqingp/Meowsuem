import fs from "node:fs/promises";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {
  assertSafeIdentifier,
  loadManifest,
  readAndValidateRunDescriptor,
  resolveRunRoot
} from "./lib/filesystem-contract.mjs";
import {
  canonicalOneShotEffort,
  canonicalOneShotModel,
  snapshotProtectedPaths,
  verifyOneShotWork
} from "./verify-one-shot-work.mjs";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["article", "sourcesJson"],
  properties: {
    article: {type: "string"},
    sourcesJson: {type: "string"}
  }
};

function parseArgs(argv) {
  return Object.fromEntries(argv.map(arg => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

async function atomicJson(file, value) {
  const temporary = `${file}.tmp-${process.pid}`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {flag: "wx"});
  await fs.rename(temporary, file);
}

async function runCodex({cwd, prompt, image, schema, log}) {
  const args = [
    "exec",
    "--model", canonicalOneShotModel,
    "--config", `model_reasoning_effort="${canonicalOneShotEffort}"`,
    "--ignore-user-config",
    "--ignore-rules",
    "--ephemeral",
    "--sandbox", "workspace-write",
    "--disable", "apps",
    "--disable", "memories",
    "--disable", "plugins",
    "--disable", "plugin_sharing",
    "--disable", "remote_plugin",
    "--image", image,
    "--output-schema", schema,
    "--json",
    "--color", "never",
    "-"
  ];
  const startedAt = new Date();
  const logHandle = await fs.open(log, "wx");
  const child = spawn("codex.cmd", args, {
    cwd,
    shell: process.platform === "win32",
    stdio: ["pipe", "pipe", "pipe"]
  });
  let raw = "";
  const record = chunk => {
    const text = chunk.toString("utf8");
    raw += text;
    void logHandle.write(text);
  };
  child.stdout.on("data", record);
  child.stderr.on("data", record);
  child.stdin.end(prompt);
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  await logHandle.close();
  const events = raw.split(/\r?\n/).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
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
      ? usage.input_tokens + usage.output_tokens
      : "unavailable",
    searchCount: new Set(events.filter(event => event.type === "item.completed"
      && ["web_search", "web_search_call"].includes(event.item?.type)).map(event => event.item?.id).filter(Boolean)).size
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.kind || !args["run-id"] || !args["work-id"]) throw new Error("--kind, --run-id and --work-id are required");
  assertSafeIdentifier(args["work-id"], "work id");
  const projectRoot = path.resolve(args["project-root"] || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const manifest = await loadManifest(projectRoot);
  const runRoot = resolveRunRoot({
    projectRoot,
    manifest,
    runKind: args.kind,
    museumId: args.museum,
    caseId: args.case,
    runId: args["run-id"]
  });
  const descriptor = await readAndValidateRunDescriptor(runRoot, manifest, projectRoot);
  if (descriptor.pipelineVersion !== manifest.pipelineVersion) throw new Error("run pipeline version does not match current manifest");
  if (descriptor.immutable || manifest.filesystemContract.immutableStatuses.includes(descriptor.status)) throw new Error("run is immutable");
  const artifactRoot = path.join(runRoot, "works", args["work-id"], "one-shot");
  const inputRoot = path.join(artifactRoot, "input");
  const outputRoot = path.join(artifactRoot, "output");
  await fs.mkdir(outputRoot, {recursive: false});
  const lockedPath = path.join(inputRoot, "locked-metadata.json");
  const locked = JSON.parse(await fs.readFile(lockedPath, "utf8"));
  if (locked.workId !== args["work-id"] || locked.museumId !== descriptor.museumId) throw new Error("locked metadata identity drift");
  const imagePath = path.resolve(projectRoot, locked.verifiedImageLocalPath);
  const promptTemplate = await fs.readFile(path.join(projectRoot, manifest.canonicalOneShotPrompt), "utf8");
  const prompt = `${promptTemplate}\n\n## 本次锁定 metadata\n\n\`\`\`json\n${JSON.stringify(locked, null, 2)}\n\`\`\`\n`;
  const schemaPath = path.join(inputRoot, "response-schema.json");
  await atomicJson(schemaPath, responseSchema);
  const protectedPaths = [
    `research/content/${locked.museumId}.md`,
    "index.html", "museum.html", "museum-app.js", "museums.js", "routes.js", "ratings.js"
  ];
  const protectedSnapshot = await snapshotProtectedPaths(projectRoot, protectedPaths);
  await atomicJson(path.join(inputRoot, "production-snapshot.json"), {paths: protectedPaths, snapshot: protectedSnapshot});
  const execution = await runCodex({
    cwd: artifactRoot,
    prompt,
    image: imagePath,
    schema: schemaPath,
    log: path.join(artifactRoot, "runner.log")
  });
  if (execution.exitCode !== 0 || !execution.response?.article || !execution.response?.sourcesJson) {
    await atomicJson(path.join(artifactRoot, "result.json"), {
      schemaVersion: 1,
      status: "failed",
      model: canonicalOneShotModel,
      reasoningEffort: canonicalOneShotEffort,
      ...execution,
      response: undefined
    });
    throw new Error(`Luna one-shot failed with exit code ${execution.exitCode}; no fallback was attempted`);
  }
  await fs.writeFile(path.join(outputRoot, "article.md"), execution.response.article, {flag: "wx"});
  await fs.writeFile(path.join(outputRoot, "sources.json"), `${JSON.stringify(JSON.parse(execution.response.sourcesJson), null, 2)}\n`, {flag: "wx"});
  const verification = await verifyOneShotWork({
    projectRoot,
    artifactRoot,
    expectedMetadata: locked,
    protectedPaths,
    protectedSnapshot,
    model: canonicalOneShotModel,
    reasoningEffort: canonicalOneShotEffort,
    runKind: args.kind
  });
  await atomicJson(path.join(artifactRoot, "verification.json"), verification);
  if (verification.status !== "passed") throw new Error("one-shot verifier failed; no fallback was attempted");
  await adaptOneShotWork({artifactRoot, verification});
  const result = {
    schemaVersion: 1,
    status: "accepted",
    model: canonicalOneShotModel,
    reasoningEffort: canonicalOneShotEffort,
    callCount: 1,
    ...execution
  };
  delete result.response;
  delete result.exitCode;
  await atomicJson(path.join(artifactRoot, "result.json"), result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
