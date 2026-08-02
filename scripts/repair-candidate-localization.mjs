import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {loadManifest, projectRelative, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {readModelJson} from "./lib/model-json.mjs";
import {atomicJson} from "./lib/work-status.mjs";

const parseArgs = argv => Object.fromEntries(argv.map(value => {
  const index = value.indexOf("=");
  if (!value.startsWith("--") || index < 0) throw new Error(`Expected --key=value, received ${value}`);
  return [value.slice(2, index), value.slice(index + 1)];
}));
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
const run = (command, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {cwd, stdio: "inherit", shell: false});
  child.on("error", reject);
  child.on("exit", code => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited ${code}`)));
});

export function validateLocalization(sourceWorks, localizedWorks) {
  if (!Array.isArray(localizedWorks) || localizedWorks.length !== sourceWorks.length) {
    throw new Error("localization must return exactly one result per source work");
  }
  for (let index = 0; index < sourceWorks.length; index += 1) {
    const source = sourceWorks[index];
    const localized = localizedWorks[index];
    if (localized.workId !== source.workId) throw new Error("localization work order or identity changed");
    if (localized.titleEn !== source.titleEn) throw new Error(`${source.workId}: English title changed`);
    if (localized.artistEn !== source.artistEn) throw new Error(`${source.workId}: English artist changed`);
    if (![localized.titleZh, localized.artistZh].every(value => typeof value === "string" && value.trim())) {
      throw new Error(`${source.workId}: Chinese localization is missing`);
    }
  }
  return localizedWorks;
}

export async function repairCandidateLocalization(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot, manifest, runKind: args.kind ?? "production", museumId: args.museum,
    caseId: args.case, runId: args["run-id"], writable: true,
  });
  const poolPath = path.join(runRoot, "candidate-pool", "candidate-pool.json");
  const selectionPath = path.join(runRoot, "selection", "selection.json");
  const [poolBytes, selectionBytes] = await Promise.all([fs.readFile(poolPath), fs.readFile(selectionPath)]);
  const pool = JSON.parse(poolBytes);
  const selection = JSON.parse(selectionBytes);
  const candidates = new Map((pool.candidates ?? []).map(item => [item.workId, item]));
  const selectedIds = (selection.selectedWorks ?? selection.works ?? []).map(item => item.workId);
  const sourceWorks = selectedIds.map(workId => {
    const candidate = candidates.get(workId);
    const identity = candidate?.identity;
    const titleEn = identity?.title?.en ?? identity?.titleEn;
    const artistEn = identity?.artist ?? identity?.artistOrCulture ?? identity?.artistEn ?? identity?.cultureEn;
    if (!candidate || !titleEn || !artistEn) throw new Error(`${workId}: source identity cannot be localized`);
    return {workId, titleEn, titleSv: identity.title?.sv ?? null, artistEn};
  });
  const root = path.join(runRoot, "identity-localization");
  const promptPath = path.join(projectRoot, "research", "pipeline", "prompts", "identity-localization.md");
  const localized = [];
  for (let offset = 0; offset < sourceWorks.length; offset += 10) {
    const batch = sourceWorks.slice(offset, offset + 10);
    const batchId = String(offset / 10 + 1).padStart(2, "0");
    const directory = path.join(root, "batches", batchId);
    await fs.mkdir(directory, {recursive: true});
    const packetPath = path.join(directory, "localization-input.json");
    const outputPath = path.join(directory, "localization-output.json");
    await atomicJson(packetPath, {schemaVersion: 1, museumId: descriptor.museumId ?? descriptor.targetMuseumId, works: batch});
    await atomicJson(path.join(directory, "run-header.json"), {
      runId: descriptor.runId,
      startedAt: new Date().toISOString(),
      stage: "identity_localization",
      ...(descriptor.runKind === "production" ? {museumId: descriptor.museumId} : {caseId: descriptor.caseId}),
      pipelineVersion: manifest.pipelineVersion,
      instructionVersion: manifest.currentVersion,
      executionProfile: manifest.modelRouting.identity_localization,
      allowedInputs: [
        {path: projectRelative(projectRoot, promptPath), role: "stage_prompt", sha256: sha256(await fs.readFile(promptPath))},
        {path: projectRelative(projectRoot, packetPath), role: "localization_input", sha256: sha256(await fs.readFile(packetPath))},
      ],
      outputs: ["localization-output.json"],
      reviewer: "disabled",
      retry: "explicit_only",
      publicationBoundary: "run_only",
    });
    const resultPath = path.join(directory, "identity_localization-result.json");
    let output = await readModelJson(outputPath).catch(() => null);
    if (!output || !await fs.access(resultPath).then(() => true).catch(() => false)) {
      await run("powershell.exe", [
        "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File",
        path.join(projectRoot, manifest.canonicalRunner), "-ProjectRoot", projectRoot, "-RunDirectory", directory,
      ], projectRoot);
      output = await readModelJson(outputPath);
    }
    if (output.schemaVersion !== 1) throw new Error("localization output schemaVersion must be 1");
    localized.push(...validateLocalization(batch, output.works));
  }
  const result = {
    schemaVersion: 1,
    stage: "identity_localization",
    museumId: descriptor.museumId ?? descriptor.targetMuseumId,
    runId: descriptor.runId,
    pipelineVersion: manifest.pipelineVersion,
    candidatePoolSha256: sha256(poolBytes),
    selectionSha256: sha256(selectionBytes),
    generatedAt: new Date().toISOString(),
    works: localized,
  };
  await atomicJson(path.join(root, "identity-localization.json"), result);
  return {works: localized.length, batches: Math.ceil(localized.length / 10)};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  repairCandidateLocalization().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
