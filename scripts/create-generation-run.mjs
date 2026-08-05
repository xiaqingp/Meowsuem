import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadManifest,
  projectRelative,
  resolveRunRoot,
} from "./lib/filesystem-contract.mjs";

function parseArgs(argv) {
  return Object.fromEntries(
    argv.map((arg) => {
      if (!arg.startsWith("--") || !arg.includes("=")) {
        throw new Error(`Expected --key=value, received ${arg}`);
      }
      const [key, ...value] = arg.slice(2).split("=");
      return [key, value.join("=")];
    }),
  );
}

function utcRunId(date, pipelineVersion) {
  const timestamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${timestamp}-p${pipelineVersion}`;
}

export async function createGenerationRun({
  projectRoot,
  kind,
  museum,
  caseId,
  milestone,
  now,
  museumRequest,
}) {
  const root = path.resolve(projectRoot);
  const manifest = await loadManifest(root);
  const createdAt = now ? new Date(now) : new Date();
  if (Number.isNaN(createdAt.valueOf())) throw new Error(`Invalid --now value: ${now}`);
  const runId = utcRunId(createdAt, manifest.pipelineVersion);
  const runRoot = resolveRunRoot({
    projectRoot: root,
    manifest,
    runKind: kind,
    museumId: museum,
    caseId,
    runId,
  });
  const descriptor = {
    schemaVersion: 1,
    filesystemContractVersion: 1,
    runKind: kind,
    runId,
    ...(kind === "production"
      ? {museumId: museum}
      : {caseId: caseId ?? museum, ...(museum && caseId ? {targetMuseumId: museum} : {})}),
    milestone: milestone ?? null,
    pipelineVersion: manifest.pipelineVersion,
    instructionVersion: manifest.currentVersion,
    status: "created",
    createdAt: createdAt.toISOString(),
    createdBy: "scripts/create-generation-run.mjs",
    layoutVersion: 1,
    immutable: false,
    contentContract: "one_shot_v1",
    allowLegacyAuthorBundles: false,
    legacyWorkIds: [],
    legacyImageResolutionAllowed: false,
  };
  await fs.mkdir(path.dirname(runRoot), { recursive: true });
  try {
    await fs.mkdir(runRoot);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(`Filesystem contract violation: run already exists: ${projectRelative(root, runRoot)}`);
    }
    throw error;
  }
  try {
    const directories = [
      "scope",
      "understanding",
      "candidate-pool",
      "image-evidence",
      "research/batches",
      "selection",
      "rating",
      "structure",
      "assembly",
      "works",
      "candidate",
      "reports",
    ];
    await Promise.all(directories.map((directory) => fs.mkdir(path.join(runRoot, directory), { recursive: true })));
    await fs.writeFile(path.join(runRoot, "run.json"), `${JSON.stringify(descriptor, null, 2)}\n`, {
      flag: "wx",
    });
    if (museumRequest) {
      for (const field of ["museumName", "city", "country"]) {
        if (typeof museumRequest[field] !== "string" || !museumRequest[field].trim()) {
          throw new Error(`museum request requires ${field}`);
        }
      }
      await fs.writeFile(path.join(runRoot, "scope", "request.json"), `${JSON.stringify({
        schemaVersion: 1,
        museumId: museum ?? museumRequest.museumId,
        museumName: museumRequest.museumName,
        city: museumRequest.city,
        country: museumRequest.country,
        ...(museumRequest.officialCollectionUrl ? {officialCollectionUrl: museumRequest.officialCollectionUrl} : {}),
      }, null, 2)}\n`, {flag: "wx"});
    }
  } catch (error) {
    await fs.rm(runRoot, { recursive: true, force: true });
    throw error;
  }
  return { runRoot: projectRelative(root, runRoot), runId, runKind: kind };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allowed = new Set(["project-root", "kind", "museum", "case", "milestone", "now", "museum-name", "city", "country", "official-collection-url"]);
  for (const key of Object.keys(args)) if (!allowed.has(key)) throw new Error(`unknown option: --${key}`);
  if ("run-root" in args) throw new Error("--run-root is not supported by the canonical run creator");
  if (!args.kind) throw new Error("--kind is required");
  if (args.kind === "production" && !args.museum) throw new Error("--museum is required for production runs");
  if (["experiment", "regression"].includes(args.kind) && !args.case) throw new Error(`--case is required for ${args.kind} runs`);
  const requestValues = [args["museum-name"], args.city, args.country];
  if (requestValues.some(Boolean) && !requestValues.every(Boolean)) throw new Error("--museum-name, --city and --country must be provided together");
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await createGenerationRun({
    projectRoot,
    kind: args.kind,
    museum: args.museum,
    caseId: args.case,
    milestone: args.milestone,
    now: args.now,
    museumRequest: args["museum-name"] ? {
      museumName: args["museum-name"],
      city: args.city,
      country: args.country,
      officialCollectionUrl: args["official-collection-url"],
    } : undefined,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
