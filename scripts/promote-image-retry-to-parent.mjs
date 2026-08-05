import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  authorizePipelineContinuation,
  loadManifest,
  projectRelative,
  resolveCanonicalRun,
} from "./lib/filesystem-contract.mjs";
import {assertVerifiedImageEvidence} from "./lib/verified-image-evidence-contract.mjs";

const parseArgs = argv => Object.fromEntries(argv.map(value => {
  const index = value.indexOf("=");
  if (!value.startsWith("--") || index < 0) throw new Error(`Expected --key=value, received ${value}`);
  return [value.slice(2, index), value.slice(index + 1)];
}));
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
export const isPromotableImageWork = work => Boolean(work?.selected && [
  "accepted",
  "object_image_accepted",
  "context_image_accepted",
].includes(work.status));

export function compactPromotedImageEvidence(evidence, works) {
  const {parentEvidencePath, parentEvidenceSha256, ...root} = evidence;
  return {
    ...root,
    works: works.map(work => {
      const {reusedFromParent, parentEvidencePath: workParentPath, parentEvidenceSha256: workParentSha256, ...clean} = work;
      return clean;
    }),
  };
}

export async function promoteImageRetryToParent(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const manifest = await loadManifest(projectRoot);
  if (args["continue-patched-run"] === "true") {
    await authorizePipelineContinuation({
      projectRoot, manifest, runKind: "experiment", caseId: args["source-case"],
      runId: args["source-run-id"], fromStage: "image_evidence",
    });
    await authorizePipelineContinuation({
      projectRoot, manifest, runKind: "production", museumId: args.museum,
      runId: args["target-run-id"], fromStage: "image_evidence",
    });
  }
  const source = await resolveCanonicalRun({
    projectRoot, manifest, runKind: "experiment", caseId: args["source-case"], runId: args["source-run-id"],
  });
  const target = await resolveCanonicalRun({
    projectRoot, manifest, runKind: "production", museumId: args.museum,
    runId: args["target-run-id"], writable: true,
  });
  const sourceEvidencePath = path.join(source.runRoot, "image-evidence", "verified-image-evidence.json");
  const targetEvidencePath = path.join(target.runRoot, "image-evidence", "verified-image-evidence.json");
  const sourceEvidence = await readJson(sourceEvidencePath);
  assertVerifiedImageEvidence(sourceEvidence);
  assertVerifiedImageEvidence(await readJson(targetEvidencePath));
  const targetRelative = projectRelative(projectRoot, targetEvidencePath);
  let cursorPath = sourceEvidencePath;
  let cursor = await readJson(cursorPath);
  let targetFound = false;
  const visitedEvidence = new Set([projectRelative(projectRoot, cursorPath)]);
  while (cursor.parentEvidencePath) {
    const parentPath = path.resolve(projectRoot, cursor.parentEvidencePath);
    const parentRelative = projectRelative(projectRoot, parentPath);
    if (visitedEvidence.has(parentRelative)) throw new Error("image evidence parent cycle detected");
    visitedEvidence.add(parentRelative);
    const bytes = await fs.readFile(parentPath);
    if (hash(bytes) !== cursor.parentEvidenceSha256) throw new Error("image evidence parent hash mismatch");
    if (parentRelative === targetRelative) targetFound = true;
    cursorPath = parentPath;
    cursor = JSON.parse(bytes);
    assertVerifiedImageEvidence(cursor);
  }
  if (!targetFound) throw new Error("source image evidence does not descend from target evidence");
  if (sourceEvidence.museumId !== args.museum) throw new Error("source image evidence museum mismatch");
  const hashes = new Set();
  const promotedWorks = [];
  const assetsRoot = path.join(target.runRoot, "image-evidence", "assets");
  await fs.mkdir(assetsRoot, {recursive: true});
  for (const work of sourceEvidence.works ?? []) {
    if (!isPromotableImageWork(work)) {
      promotedWorks.push(work);
      continue;
    }
    if (hashes.has(work.selected.sha256)) throw new Error(`${work.workId}: duplicate accepted image hash`);
    hashes.add(work.selected.sha256);
    const sourceAsset = path.resolve(projectRoot, work.selected.localPath);
    const bytes = await fs.readFile(sourceAsset);
    if (hash(bytes) !== work.selected.sha256) throw new Error(`${work.workId}: source image hash mismatch`);
    const destination = path.join(assetsRoot, `${work.workId}${path.extname(sourceAsset).toLowerCase()}`);
    if (path.resolve(sourceAsset) !== path.resolve(destination)) {
      const temporary = `${destination}.tmp-${process.pid}`;
      await fs.writeFile(temporary, bytes, {flag: "wx"});
      await fs.rename(temporary, destination);
    }
    promotedWorks.push({...work, selected: {...work.selected, localPath: projectRelative(projectRoot, destination)}});
  }
  const promoted = {
    ...compactPromotedImageEvidence(sourceEvidence, promotedWorks),
    pipelineVersion: manifest.pipelineVersion,
    promotedAt: new Date().toISOString(),
    promotedFromRunId: source.descriptor.runId,
    promotedToRunId: target.descriptor.runId,
  };
  assertVerifiedImageEvidence(promoted);
  const previousPath = path.join(target.runRoot, "image-evidence", `verified-image-evidence.before-${source.descriptor.runId}.json`);
  await fs.copyFile(targetEvidencePath, previousPath);
  const temporaryEvidence = `${targetEvidencePath}.tmp-${process.pid}`;
  await fs.writeFile(temporaryEvidence, `${JSON.stringify(promoted, null, 2)}\n`, {flag: "wx"});
  await fs.rename(temporaryEvidence, targetEvidencePath);
  return {works: promotedWorks.length, sourceRunId: source.descriptor.runId, targetRunId: target.descriptor.runId};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  promoteImageRetryToParent().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
