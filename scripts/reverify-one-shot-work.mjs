import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {atomicJson, writeWorkStatus} from "./lib/work-status.mjs";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";
import {
  canonicalOneShotEffort,
  canonicalOneShotModel,
  snapshotProtectedPaths,
  verifyOneShotWork,
} from "./verify-one-shot-work.mjs";

const parseArgs = argv => Object.fromEntries(argv.map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const exists = file => fs.access(file).then(() => true).catch(() => false);

export async function reverifyOneShotWork({projectRoot, kind, museum, caseId, runId, workId}) {
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot, manifest, runKind: kind, museumId: museum, caseId, runId, writable: true,
  });
  const artifactRoot = path.join(runRoot, "works", workId, "one-shot");
  const previous = JSON.parse(await fs.readFile(path.join(artifactRoot, "result.json"), "utf8"));
  const attemptRoot = path.join(artifactRoot, "attempts", String(previous.attempt).padStart(2, "0"));
  const locked = JSON.parse(await fs.readFile(path.join(artifactRoot, "input", "locked-metadata.json"), "utf8"));
  const protectedPaths = [
    `research/content/${locked.museumId}.md`,
    "index.html", "museum.html", "museum-app.js", "museums.js", "routes.js", "ratings.js",
  ];
  const present = [];
  for (const item of protectedPaths) if (await exists(path.join(projectRoot, item))) present.push(item);
  const protectedSnapshot = await snapshotProtectedPaths(projectRoot, present);
  const verification = await verifyOneShotWork({
    projectRoot, artifactRoot: attemptRoot, expectedMetadata: locked, protectedPaths: present, protectedSnapshot,
    model: canonicalOneShotModel, reasoningEffort: canonicalOneShotEffort, runKind: kind,
  });
  await atomicJson(path.join(attemptRoot, "verification.json"), verification);
  if (verification.status !== "passed") {
    await atomicJson(path.join(artifactRoot, "result.json"), {
      ...previous, status: "failed", failureStage: "verification",
      failureCode: "VERIFICATION_FAILED", failureMessage: "one-shot verifier failed after deterministic reverify",
    });
    return verification;
  }
  await fs.mkdir(path.join(artifactRoot, "output"), {recursive: true});
  await Promise.all(["article.md", "sources.json"].map(name =>
    fs.copyFile(path.join(attemptRoot, "output", name), path.join(artifactRoot, "output", name))));
  await atomicJson(path.join(artifactRoot, "verification.json"), verification);
  const adapter = await adaptOneShotWork({artifactRoot, verification});
  const accepted = {...previous, status: "accepted", deterministicReverify: true, verification: "passed", adapter: adapter.status};
  delete accepted.failureStage;
  delete accepted.failureCode;
  delete accepted.failureMessage;
  await atomicJson(path.join(artifactRoot, "result.json"), accepted);
  await writeWorkStatus(runRoot, workId, {
    status: "accepted", attempt: previous.attempt, lastStage: "integration",
    model: canonicalOneShotModel, verification: "passed",
  });
  return {status: "accepted", runId: descriptor.runId, workId, deterministicReverify: true};
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await reverifyOneShotWork({
    projectRoot, kind: args.kind, museum: args.museum, caseId: args.case,
    runId: args["run-id"], workId: args["work-id"],
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "accepted") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
