import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {assertPathInside, loadManifest, resolveRunRoot} from "./lib/filesystem-contract.mjs";
import {buildDisplayMetadata, extractCard} from "./verify-one-shot-work.mjs";

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

async function atomicWrite(file, content) {
  const temporary = `${file}.tmp-${process.pid}`;
  await fs.writeFile(temporary, content, {flag: "wx"});
  await fs.rename(temporary, file);
}

async function atomicJson(file, value) {
  await atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function adaptOneShotWork({artifactRoot, verification, previousFailure = null, replace = false}) {
  if (verification?.status !== "passed" || verification.errors?.length) {
    throw new Error("one-shot integration requires a passed verifier result");
  }
  const [lockedText, article, sourcesText] = await Promise.all([
    fs.readFile(path.join(artifactRoot, "input", "locked-metadata.json"), "utf8"),
    fs.readFile(path.join(artifactRoot, "output", "article.md"), "utf8"),
    fs.readFile(path.join(artifactRoot, "output", "sources.json"), "utf8")
  ]);
  const locked = JSON.parse(lockedText);
  JSON.parse(sourcesText);
  const integrationRoot = path.join(artifactRoot, "integration");
  await assertPathInside(artifactRoot, integrationRoot);
  await fs.mkdir(integrationRoot, {recursive: true});
  const outputs = {
    "card.txt": extractCard(article),
    "draft.md": article,
    "display-metadata.json": `${JSON.stringify(buildDisplayMetadata(locked), null, 2)}\n`,
    "sources.json": `${JSON.stringify(JSON.parse(sourcesText), null, 2)}\n`
  };
  for (const [name, content] of Object.entries(outputs)) {
    const target = path.join(integrationRoot, name);
    try {
      const existing = await fs.readFile(target, "utf8");
      if (existing !== content) {
        if (!replace) throw new Error(`integration output already exists with different content: ${name}`);
        await fs.writeFile(target, content);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await atomicWrite(target, content);
    }
  }
  const result = {
    schemaVersion: 1,
    status: "passed",
    modelCalls: 0,
    previousFailure,
    rules: {
      card: "first non-empty paragraph under ## 一分钟看懂",
      draft: "byte-for-byte copy of output/article.md",
      displayMetadata: "deterministic mapping from input/locked-metadata.json",
      sources: "validated structural copy of output/sources.json"
    },
    inputHashes: {
      lockedMetadata: sha256(lockedText),
      article: sha256(article),
      sources: sha256(sourcesText),
      verification: sha256(`${JSON.stringify(verification, null, 2)}\n`)
    },
    outputHashes: Object.fromEntries(Object.entries(outputs).map(([name, content]) => [name, sha256(content)]))
  };
  if (replace) {
    await fs.writeFile(path.join(integrationRoot, "adapter-result.json"), `${JSON.stringify(result, null, 2)}\n`);
    await fs.writeFile(path.join(integrationRoot, "verification.json"), `${JSON.stringify(verification, null, 2)}\n`);
  } else {
    await atomicJson(path.join(integrationRoot, "adapter-result.json"), result);
    await atomicJson(path.join(integrationRoot, "verification.json"), verification);
  }
  return {integrationRoot, result};
}

function parseArgs(argv) {
  return Object.fromEntries(argv.map(arg => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.kind || !args["run-id"] || !args.verification) {
    throw new Error("--kind, --run-id and --verification are required");
  }
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
  const artifactRoot = args["artifact-layout"] === "run-root"
    ? runRoot
    : path.join(runRoot, "works", args["work-id"], "one-shot");
  await assertPathInside(runRoot, artifactRoot);
  const verificationPath = path.resolve(projectRoot, args.verification);
  await assertPathInside(runRoot, verificationPath);
  const verification = JSON.parse(await fs.readFile(verificationPath, "utf8"));
  const result = await adaptOneShotWork({
    artifactRoot,
    verification,
    previousFailure: args["previous-failure"] ?? null
  });
  process.stdout.write(`${JSON.stringify({
    integrationRoot: path.relative(projectRoot, result.integrationRoot).replaceAll("\\", "/"),
    result: result.result
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
