// Historical compatibility wrapper. Canonical verification lives in ../verify-one-shot-work.mjs.
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {assertPathInside, loadManifest, resolveRunRoot} from "../lib/filesystem-contract.mjs";
import {
  assertCleanLockedMetadata,
  buildDisplayMetadata,
  extractCard,
  snapshotProtectedPaths,
  verifyOneShotWork
} from "../verify-one-shot-work.mjs";

export const experimentCaseId = "sea-change-sol-one-shot-writing-v2";
export const experimentModel = "gpt-5.6-sol";
export const experimentEffort = "medium";
export {assertCleanLockedMetadata, buildDisplayMetadata, extractCard, snapshotProtectedPaths};

export function assertOneShotDescriptor(descriptor, expectedCaseId = experimentCaseId) {
  if (descriptor.runKind !== "experiment" || descriptor.caseId !== expectedCaseId) {
    throw new Error("one-shot v2 requires the canonical non-publishable experiment run");
  }
  return descriptor;
}

export async function assertExperimentOutputPath(runRoot, target) {
  await assertPathInside(runRoot, target);
  return target;
}

export async function verifyOneShotOutput(options) {
  const result = await verifyOneShotWork({
    ...options,
    artifactRoot: options.runRoot,
    model: options.model ?? experimentModel,
    reasoningEffort: options.reasoningEffort ?? experimentEffort,
    allowedModel: options.allowedModel ?? experimentModel,
    allowedReasoningEffort: options.allowedReasoningEffort ?? experimentEffort,
    runKind: "experiment"
  });
  return {
    ...result,
    failures: result.errors.map(error => error.message)
  };
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
  if (!args["run-id"]) throw new Error("--run-id is required");
  const projectRoot = path.resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const manifest = await loadManifest(projectRoot);
  const runRoot = resolveRunRoot({
    projectRoot,
    manifest,
    runKind: "experiment",
    caseId: experimentCaseId,
    runId: args["run-id"]
  });
  const locked = JSON.parse(await fs.readFile(path.join(runRoot, "input/locked-metadata.json"), "utf8"));
  const protection = JSON.parse(await fs.readFile(path.join(runRoot, "input/production-snapshot.json"), "utf8"));
  const result = await verifyOneShotOutput({
    projectRoot,
    runRoot,
    expectedMetadata: locked,
    protectedPaths: protection.paths,
    protectedSnapshot: protection.snapshot,
    model: experimentModel,
    reasoningEffort: experimentEffort,
    allowedModel: experimentModel,
    allowedReasoningEffort: experimentEffort
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "passed") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
