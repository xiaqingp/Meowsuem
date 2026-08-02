import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPathInside,
  assertWritableRun,
  findRunRoot,
  isRunPipelineVersionAllowed,
  loadManifest,
  projectRelative,
  readAndValidateRunDescriptor,
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

export async function validateRunDirectory({ projectRoot, runDirectory, mode = "read-only", logPath }) {
  if (!["read-only", "read-write"].includes(mode)) {
    throw new Error(`Invalid --mode ${mode}; expected read-only or read-write`);
  }
  const root = path.resolve(projectRoot);
  const directory = path.resolve(runDirectory);
  const manifest = await loadManifest(root);
  const runRoot = await findRunRoot(directory, root, manifest);
  const descriptor = await readAndValidateRunDescriptor(runRoot, manifest, root);
  await assertPathInside(runRoot, directory);
  if (mode === "read-write") assertWritableRun(descriptor, manifest);
  let header = null;
  try {
    header = JSON.parse(await fs.readFile(path.join(directory, "run-header.json"), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (header) {
    const descriptorIdentity = descriptor.museumId ?? descriptor.caseId;
    const headerIdentity = header.museumId ?? header.caseId;
    if (
      header.runId !== descriptor.runId ||
      headerIdentity !== descriptorIdentity ||
      !isRunPipelineVersionAllowed(header.pipelineVersion, descriptor)
    ) {
      throw new Error("Filesystem contract violation: run-header identity does not match run.json");
    }
    if (typeof header.stage !== "string" || !/^[a-z][a-z0-9_-]*$/.test(header.stage)) {
      throw new Error("Filesystem contract violation: run-header stage is invalid");
    }
    if (!Array.isArray(header.outputs)) {
      throw new Error("Filesystem contract violation: run-header outputs must be an array");
    }
    for (const output of header.outputs) {
      await assertPathInside(directory, path.resolve(directory, output), { allowEqual: false });
    }
    for (const input of header.allowedInputs ?? []) {
      await assertPathInside(root, path.resolve(root, input.path), { allowEqual: false });
    }
  }
  const resolvedLog = path.resolve(logPath ?? path.join(directory, "runner.log"));
  await assertPathInside(directory, resolvedLog, { allowEqual: false });
  return {
    projectRoot: root,
    runRoot,
    runRootRelative: projectRelative(root, runRoot),
    runDirectory: directory,
    runDirectoryRelative: projectRelative(root, directory),
    runId: descriptor.runId,
    runKind: descriptor.runKind,
    museumId: descriptor.museumId ?? null,
    caseId: descriptor.caseId ?? null,
    pipelineVersion: descriptor.pipelineVersion,
    layoutVersion: descriptor.layoutVersion,
    status: descriptor.status,
    writable: mode === "read-write",
    stage: header?.stage ?? null,
    logPath: resolvedLog,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args["run-directory"]) throw new Error("--run-directory is required");
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await validateRunDirectory({
    projectRoot,
    runDirectory: args["run-directory"],
    mode: args.mode ?? "read-only",
    logPath: args["log-path"],
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
