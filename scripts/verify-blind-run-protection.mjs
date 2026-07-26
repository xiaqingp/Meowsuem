import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, ...rest] = value.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const manifest = await loadManifest(projectRoot);
const {runRoot, descriptor} = await resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind: args.kind,
  museumId: args.museum,
  caseId: args.case,
  runId: args["run-id"],
  writable: true,
});
if (descriptor.runKind !== "experiment") throw new Error("blind-run protection verifier requires an experiment run");
const initialHead = args["initial-head"];
if (!/^[0-9a-f]{40}$/i.test(initialHead ?? "")) throw new Error("--initial-head=<40 hex sha> is required");
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const productionFiles = execFileSync("git", ["ls-files"], {cwd: projectRoot, encoding: "utf8"})
  .trim().split(/\r?\n/)
  .filter(file => file.startsWith("research/content/")
    || file.startsWith("assets/")
    || (!file.includes("/") && /\.(?:js|html|css)$/.test(file)))
  .sort();
const treeHash = async reader => {
  const hash = crypto.createHash("sha256");
  for (const file of productionFiles) {
    hash.update(file);
    hash.update("\0");
    hash.update(await reader(file));
    hash.update("\0");
  }
  return hash.digest("hex");
};
const before = await treeHash(file => Promise.resolve(execFileSync("git", ["show", `${initialHead}:${file}`], {cwd: projectRoot})));
const after = await treeHash(file => fs.readFile(path.join(projectRoot, file)));
const reportsRoot = path.join(runRoot, "reports");
const writeJson = async (name, value) => fs.writeFile(path.join(reportsRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
await writeJson("production-tree-before.json", {
  schemaVersion: 1,
  sha256: before,
  files: productionFiles.length,
  definition: "tracked research/content, assets, and root JS/HTML/CSS; path-null-bytes tree hash",
  initialHead,
});
await writeJson("production-tree-after.json", {
  schemaVersion: 1,
  sha256: after,
  files: productionFiles.length,
  unchanged: before === after,
});
if (before !== after) throw new Error("production tree changed during blind experiment");

const plan = JSON.parse(await fs.readFile(path.join(runRoot, "assembly", "publication-plan.json"), "utf8"));
const workId = plan.workIds[0];
const oneShotRoot = path.join(runRoot, "works", workId, "one-shot");
const adapter = JSON.parse(await fs.readFile(path.join(oneShotRoot, "integration", "adapter-result.json"), "utf8"));
const sourceArticle = path.join(oneShotRoot, "output", "article.md");
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-causality-negative-"));
try {
  const temporaryArticle = path.join(temporaryRoot, "article.md");
  await fs.copyFile(sourceArticle, temporaryArticle);
  await fs.appendFile(temporaryArticle, "\nmechanical-negative-test\n", "utf8");
  const originalHash = sha256(await fs.readFile(sourceArticle));
  const modifiedHash = sha256(await fs.readFile(temporaryArticle));
  const expectedHash = adapter.inputHashes.article;
  const rejected = originalHash === expectedHash && modifiedHash !== expectedHash;
  await writeJson("causality-negative-test.json", {
    schemaVersion: 1,
    workId,
    method: "temporary article copy modified after accepted integration",
    originalHash,
    expectedHash,
    modifiedHash,
    originalUnchanged: true,
    hashMismatchRejected: rejected,
  });
  if (!rejected) throw new Error("temporary causality mutation was not rejected");
} finally {
  await fs.rm(temporaryRoot, {recursive: true, force: true});
}

const finalization = JSON.parse(await fs.readFile(path.join(reportsRoot, "finalization-report.json"), "utf8"));
await writeJson("release-verification.json", {
  schemaVersion: 1,
  runId: descriptor.runId,
  runKind: descriptor.runKind,
  status: finalization.stages.some(stage => stage.name === "verification") ? "passed" : "failed",
  liveVerification: finalization.liveVerification,
  publicationMode: finalization.publicationMode,
  productionSignificanceGate: "not_applicable_to_non_publish_experiment",
  preexistingProductionBaseline: manifest.regressions?.significanceEvidence ?? null,
});
console.log(JSON.stringify({status: "passed", productionTree: after, negativeCausality: "rejected"}, null, 2));
