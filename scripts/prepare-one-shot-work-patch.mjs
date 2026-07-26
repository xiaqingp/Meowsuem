import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadManifest, readAndValidateRunDescriptor, resolveRunRoot, transitionRunStatus} from "./lib/filesystem-contract.mjs";
import {
  canonicalOneShotEffort,
  canonicalOneShotModel,
  snapshotProtectedPaths,
  verifyOneShotWork
} from "./verify-one-shot-work.mjs";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const exists = target => fs.access(target).then(() => true).catch(() => false);

function parseArgs(argv) {
  return Object.fromEntries(argv.map(arg => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

async function copyFile(source, destination) {
  await fs.mkdir(path.dirname(destination), {recursive: true});
  await fs.copyFile(source, destination, fs.constants.COPYFILE_EXCL);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const key of ["museum", "run-id", "source-run-id", "experiment-case", "experiment-run-id", "work-id"]) {
    if (!args[key]) throw new Error(`--${key} is required`);
  }
  const projectRoot = path.resolve(args["project-root"] || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const manifest = await loadManifest(projectRoot);
  const resume = args.resume === "true";
  const targetRoot = resolveRunRoot({
    projectRoot, manifest, runKind: "production", museumId: args.museum, runId: args["run-id"]
  });
  const sourceRoot = path.join(
    projectRoot,
    manifest.filesystemContract.productionRunRoot,
    args.museum,
    args["source-run-id"]
  );
  const experimentRoot = resolveRunRoot({
    projectRoot, manifest, runKind: "experiment", caseId: args["experiment-case"], runId: args["experiment-run-id"]
  });
  const [targetDescriptor, sourceDescriptor] = await Promise.all([
    readAndValidateRunDescriptor(targetRoot, manifest, projectRoot),
    readAndValidateRunDescriptor(sourceRoot, manifest, projectRoot)
  ]);
  if (targetDescriptor.status !== "created" || targetDescriptor.immutable) throw new Error("target production run must be new and writable");
  if (sourceDescriptor.status !== "published") throw new Error("source production run must be published");
  const sourceAssemblyPath = await exists(path.join(sourceRoot, "structure", "assembly-input.json"))
    ? path.join(sourceRoot, "structure", "assembly-input.json")
    : path.join(sourceRoot, "assembly-input.json");
  const assembly = JSON.parse(await fs.readFile(sourceAssemblyPath, "utf8"));
  assembly.museum.contentFile = `research/content/${args.museum}.md`;
  assembly.museum.contentUpdatedAt = new Date().toISOString().slice(0, 10);
  assembly.publication.cacheKey = `${assembly.museum.contentUpdatedAt.replaceAll("-", "")}-p${manifest.pipelineVersion}-${args.museum}`;
  for (const record of assembly.works) {
    if (record.localAssetSource) {
      record.localAssetSource = `research/runs/production/${args.museum}/${args["run-id"]}/image-evidence/assets/${path.basename(record.localAssetSource)}`;
    }
  }
  await fs.mkdir(path.join(targetRoot, "structure"), {recursive: true});
  if (!resume) await fs.writeFile(path.join(targetRoot, "structure", "assembly-input.json"), `${JSON.stringify(assembly, null, 2)}\n`, {flag: "wx"});

  const sourceAssets = path.join(sourceRoot, "image-evidence", "assets");
  if (!resume && await exists(sourceAssets)) await fs.cp(sourceAssets, path.join(targetRoot, "image-evidence", "assets"), {recursive: true, errorOnExist: true});

  for (const work of resume ? [] : assembly.works) {
    if (work.id === args["work-id"]) continue;
    const sourceWork = path.join(sourceRoot, "works", work.id);
    const authorRoot = path.join(targetRoot, "works", work.id, "author");
    const mechanicalRoot = path.join(targetRoot, "works", work.id, "mechanical");
    for (const file of ["draft.md", "card.txt", "writing-plan.json", "author-result.json", "run-header.json"]) {
      if (await exists(path.join(sourceWork, file))) await copyFile(path.join(sourceWork, file), path.join(authorRoot, file));
      else if (await exists(path.join(sourceWork, "author", file))) await copyFile(path.join(sourceWork, "author", file), path.join(authorRoot, file));
    }
    const mechanicalSource = await exists(path.join(sourceWork, "mechanical-result.json"))
      ? path.join(sourceWork, "mechanical-result.json")
      : path.join(sourceWork, "mechanical", "mechanical-result.json");
    await copyFile(mechanicalSource, path.join(mechanicalRoot, "mechanical-result.json"));
  }

  const oneShotRoot = path.join(targetRoot, "works", args["work-id"], "one-shot");
  for (const directory of resume ? [] : ["input", "output"]) {
    await fs.cp(path.join(experimentRoot, directory), path.join(oneShotRoot, directory), {recursive: true, errorOnExist: true});
  }
  const sourceWorkRoot = path.join(sourceRoot, "works", args["work-id"]);
  const sourcePlanPath = await exists(path.join(sourceWorkRoot, "writing-plan.json"))
    ? path.join(sourceWorkRoot, "writing-plan.json")
    : path.join(sourceWorkRoot, "author", "writing-plan.json");
  const sourcePlan = JSON.parse(await fs.readFile(sourcePlanPath, "utf8"));
  const sourceDraftPath = await exists(path.join(sourceWorkRoot, "draft.md"))
    ? path.join(sourceWorkRoot, "draft.md")
    : path.join(sourceWorkRoot, "author", "draft.md");
  const sourceDraft = await fs.readFile(sourceDraftPath, "utf8");
  const sourceHeading = sourceDraft.match(/^##\s+(?:\d+\.\s*)?(.+?)\s+\/\s+(.+)$/m);
  if (!sourceHeading) throw new Error("source work has no bilingual heading");
  const targetLockedPath = path.join(oneShotRoot, "input", "locked-metadata.json");
  const targetLocked = JSON.parse(await fs.readFile(targetLockedPath, "utf8"));
  targetLocked.displayBy = sourcePlan.displayMetadata.by;
  targetLocked.displayTitleZh = sourceHeading[1];
  targetLocked.displayTitleEn = sourceHeading[2];
  targetLocked.stay = sourcePlan.displayMetadata.stay;
  await fs.writeFile(targetLockedPath, `${JSON.stringify(targetLocked, null, 2)}\n`);
  const protectedPaths = [
    `research/content/${args.museum}.md`,
    "index.html", "museum.html", "museum-app.js", "museums.js", "routes.js", "ratings.js"
  ];
  const protectedSnapshot = await snapshotProtectedPaths(projectRoot, protectedPaths);
  await fs.writeFile(
    path.join(oneShotRoot, "input", "production-snapshot.json"),
    `${JSON.stringify({paths: protectedPaths, snapshot: protectedSnapshot}, null, 2)}\n`
  );
  const verification = await verifyOneShotWork({
    projectRoot,
    artifactRoot: oneShotRoot,
    expectedMetadata: targetLocked,
    protectedPaths,
    protectedSnapshot,
    model: canonicalOneShotModel,
    reasoningEffort: canonicalOneShotEffort,
    runKind: "production"
  });
  if (verification.status !== "passed") throw new Error(`target one-shot verification failed: ${JSON.stringify(verification.errors)}`);
  await adaptOneShotWork({
    artifactRoot: oneShotRoot,
    verification,
    previousFailure: "verifier false positive",
    replace: resume
  });
  const originalHashes = {};
  for (const file of ["output/article.md", "output/sources.json", "result.json"]) {
    originalHashes[file] = sha256(await fs.readFile(path.join(experimentRoot, file)));
  }
  await fs.mkdir(path.join(targetRoot, "reports"), {recursive: true});
  await fs.writeFile(path.join(targetRoot, "reports", "one-shot-patch-provenance.json"), `${JSON.stringify({
    schemaVersion: 1,
    museumId: args.museum,
    workId: args["work-id"],
    sourceProductionRun: path.relative(projectRoot, sourceRoot).replaceAll("\\", "/"),
    sourceExperimentRun: path.relative(projectRoot, experimentRoot).replaceAll("\\", "/"),
    originalExperimentHashes: originalHashes,
    modelCalls: 0,
    otherWorksCopiedWithoutContentChanges: assembly.works.filter(work => work.id !== args["work-id"]).map(work => work.id)
  }, null, 2)}\n`, resume ? undefined : {flag: "wx"});
  if (targetDescriptor.status === "created") {
    await transitionRunStatus({projectRoot, runRoot: targetRoot, manifest, nextStatus: "running"});
  }
  process.stdout.write(`${JSON.stringify({
    targetRun: path.relative(projectRoot, targetRoot).replaceAll("\\", "/"),
    workId: args["work-id"],
    otherWorksCopied: assembly.works.length - 1,
    modelCalls: 0
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
