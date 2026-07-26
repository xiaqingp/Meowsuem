import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun, transitionRunStatus} from "./lib/filesystem-contract.mjs";

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
if (descriptor.runKind !== "experiment" || descriptor.status !== "verified") {
  throw new Error("blind-run freeze requires a verified experiment run");
}
const exists = file => fs.access(file).then(() => true).catch(() => false);
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const collect = async (relativeRoot, predicate = () => true) => {
  const root = path.join(runRoot, relativeRoot);
  if (!(await exists(root))) return [];
  const output = [];
  const walk = async directory => {
    for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(target);
      else {
        const relative = path.relative(runRoot, target).replaceAll("\\", "/");
        if (predicate(relative)) output.push({path: relative, sha256: sha256(await fs.readFile(target))});
      }
    }
  };
  await walk(root);
  return output.sort((a, b) => a.path.localeCompare(b.path));
};
const categories = {
  scope: await collect("scope"),
  candidatePool: await collect("candidate-pool"),
  planningEvidence: await collect("research"),
  selection: await collect("selection"),
  rating: await collect("rating"),
  structure: await collect("structure"),
  imageEvidence: await collect("image-evidence"),
  lockedMetadata: await collect("works", file => file.endsWith("/one-shot/input/locked-metadata.json")),
  acceptedAttempts: await collect("works", file => /\/one-shot\/attempts\/\d+\//.test(file)),
  verification: await collect("works", file => file.endsWith("/one-shot/verification.json") || file.endsWith("/integration/verification.json")),
  integration: await collect("works", file => file.includes("/one-shot/integration/")),
  publicationPlan: await collect("assembly"),
  candidate: await collect("candidate"),
  causality: await collect("reports", file => /causality|finalization-report/.test(file)),
  releaseVerification: await collect("reports", file => file.endsWith("/release-verification.json")),
  publishDryRun: await collect("reports", file => file.endsWith("/publication-dry-run.json")),
  generationReport: await collect("reports", file => /generation-report\.(?:json|md)$/.test(file)),
  productionProtection: await collect("reports", file => /production-tree-(?:before|after)\.json$/.test(file)),
};
const freeze = {
  schemaVersion: 1,
  status: "frozen",
  runId: descriptor.runId,
  runKind: descriptor.runKind,
  museumId: descriptor.targetMuseumId,
  pipelineVersion: descriptor.pipelineVersion,
  frozenAt: new Date().toISOString(),
  contentAuditStatus: "not_performed",
  categories,
};
await fs.writeFile(path.join(runRoot, "reports", "blind-run-freeze.json"), `${JSON.stringify(freeze, null, 2)}\n`, "utf8");
const next = await transitionRunStatus({projectRoot, runRoot, manifest, nextStatus: "accepted"});
console.log(JSON.stringify({status: next.status, immutable: next.immutable, artifacts: Object.values(categories).reduce((sum, items) => sum + items.length, 0)}, null, 2));
