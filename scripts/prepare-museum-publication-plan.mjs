import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {atomicJson} from "./lib/work-status.mjs";

const parseArgs = argv => Object.fromEntries(argv.map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

export async function prepareMuseumPublicationPlan({projectRoot, kind, museum, caseId, runId}) {
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot, manifest, runKind: kind, museumId: museum, caseId, runId, writable: true,
  });
  const inputs = [
    "scope/scope.json",
    "candidate-pool/candidate-pool.json",
    "selection/selection.json",
    "rating/rating-result.json",
    "structure/structure.json",
    "structure/assembly-input.json",
    "image-evidence/verified-image-evidence.json",
    "reports/locked-metadata-report.json",
  ];
  const hashes = {};
  for (const relative of inputs) {
    const bytes = await fs.readFile(path.join(runRoot, relative));
    hashes[relative] = sha256(bytes);
  }
  const assemblyInput = JSON.parse(await fs.readFile(path.join(runRoot, "structure", "assembly-input.json"), "utf8"));
  const lockedReport = JSON.parse(await fs.readFile(path.join(runRoot, "reports", "locked-metadata-report.json"), "utf8"));
  if (assemblyInput.museum.id !== descriptor.museumId || lockedReport.museumId !== descriptor.museumId) {
    throw new Error("publication plan identity drift");
  }
  const workIds = assemblyInput.works.map(work => work.id);
  if (JSON.stringify(workIds) !== JSON.stringify(lockedReport.works.map(work => work.workId))) {
    throw new Error("publication plan work order does not match locked metadata report");
  }
  const plan = {
    schemaVersion: 1, runId, museumId: descriptor.museumId,
    contentContract: descriptor.contentContract,
    workIds, inputHashes: hashes,
    assemblyInput: "structure/assembly-input.json",
    candidateRoot: "candidate",
    proseInputsRead: false,
    networkCalls: 0,
  };
  await atomicJson(path.join(runRoot, "assembly", "publication-plan.json"), plan);
  return plan;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await prepareMuseumPublicationPlan({
    projectRoot, kind: args.kind, museum: args.museum, caseId: args.case, runId: args["run-id"],
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
