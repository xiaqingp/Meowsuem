import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  assertResearchRootHygiene,
  assertRunRootMatchesContract,
  loadManifest,
  projectRelative,
  resolveContractRoots,
} from "./lib/filesystem-contract.mjs";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const exists = async (target) =>
  fs
    .access(target)
    .then(() => true)
    .catch(() => false);

async function walk(directory) {
  const files = [];
  if (!(await exists(directory))) return files;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }
  return files;
}

async function verifyRuns(projectRoot, manifest, failures) {
  const roots = resolveContractRoots(projectRoot, manifest);
  const kinds = [
    ["production", roots.productionRunRoot],
    ["regression", roots.regressionRunRoot],
    ["experiment", roots.experimentRunRoot],
  ];
  for (const [runKind, kindRoot] of kinds) {
    if (!(await exists(kindRoot))) continue;
    for (const identityEntry of await fs.readdir(kindRoot, { withFileTypes: true })) {
      if (!identityEntry.isDirectory()) {
        failures.push(`run kind root contains a file: ${projectRelative(projectRoot, path.join(kindRoot, identityEntry.name))}`);
        continue;
      }
      const identityRoot = path.join(kindRoot, identityEntry.name);
      for (const runEntry of await fs.readdir(identityRoot, { withFileTypes: true })) {
        if (!runEntry.isDirectory()) {
          failures.push(`run identity root contains a file: ${projectRelative(projectRoot, path.join(identityRoot, runEntry.name))}`);
          continue;
        }
        const runRoot = path.join(identityRoot, runEntry.name);
        const descriptorPath = path.join(runRoot, manifest.filesystemContract.runDescriptor);
        if (!(await exists(descriptorPath))) {
          failures.push(`run descriptor missing: ${projectRelative(projectRoot, runRoot)}`);
          continue;
        }
        try {
          const descriptor = JSON.parse(await fs.readFile(descriptorPath, "utf8"));
          if (descriptor.runKind !== runKind) failures.push(`run kind drift: ${projectRelative(projectRoot, runRoot)}`);
          await assertRunRootMatchesContract({ projectRoot, manifest, runRoot, runDescriptor: descriptor });
          if (descriptor.layoutVersion === manifest.filesystemContract.currentLayoutVersion) {
            for (const fixed of ["candidate", "reports"]) {
              if (!(await exists(path.join(runRoot, fixed)))) {
                failures.push(`layout v1 run is missing ${fixed}: ${projectRelative(projectRoot, runRoot)}`);
              }
            }
          } else if (!(descriptor.layoutVersion === 0 && descriptor.legacyLayout === true)) {
            failures.push(`run has unsupported layout: ${projectRelative(projectRoot, runRoot)}`);
          }
          if (descriptor.immutable || manifest.filesystemContract.immutableStatuses.includes(descriptor.status)) {
            const temporary = (await walk(runRoot)).filter((file) =>
              /\.(?:tmp-\d+|meowseum-next)$/.test(path.basename(file)),
            );
            if (temporary.length) failures.push(`immutable run contains temporary files: ${projectRelative(projectRoot, runRoot)}`);
          }
        } catch (error) {
          failures.push(error.message);
        }
      }
    }
  }
}

export async function verifyProjectAuthority({ projectRoot, checkRelease = true }) {
  const root = path.resolve(projectRoot);
  const failures = [];
  const required = [
    "coho_museum/PRD.md",
    "coho_museum/TechDesign.md",
    "research/README.md",
    "research/meowseum-content-instruction.md",
    "research/generation-pipeline.md",
    "research/content-standard-manifest.json",
    "scripts/lib/filesystem-contract.mjs",
    "scripts/create-generation-run.mjs",
    "scripts/validate-run-directory.mjs",
    "scripts/migrate-filesystem-contract-v1.mjs",
    "scripts/run-isolated-generation.ps1",
    "scripts/run-generation-batch.mjs",
    "scripts/report-museum-generation.mjs",
    "scripts/assemble-museum-candidate.mjs",
    "scripts/finalize-museum.mjs",
    "scripts/publish-museum-candidate.mjs",
  ];
  for (const file of required) if (!(await exists(path.join(root, file)))) failures.push(`missing authority file: ${file}`);

  let manifest;
  try {
    manifest = await loadManifest(root);
  } catch (error) {
    return { failures: [error.message], activeContentFiles: 0 };
  }
  const canonicalExpectations = {
    canonicalInstruction: "research/meowseum-content-instruction.md",
    canonicalPipeline: "research/generation-pipeline.md",
    canonicalRunner: "scripts/run-isolated-generation.ps1",
    canonicalGenerationReporter: "scripts/report-museum-generation.mjs",
    canonicalReleaseVerifier: "scripts/verify-release-candidate.mjs",
    canonicalPublisher: "scripts/publish-museum-candidate.mjs",
    canonicalAssembler: "scripts/assemble-museum-candidate.mjs",
    canonicalFinalizer: "scripts/finalize-museum.mjs",
    canonicalStageInputPreparer: "scripts/prepare-museum-stage-inputs.mjs",
    canonicalBatchRunner: "scripts/run-generation-batch.mjs",
    canonicalReleaseFreezer: "scripts/freeze-pipeline-release.mjs",
    canonicalAuthorityVerifier: "scripts/verify-project-authority.mjs",
    canonicalFilesystemContract: "scripts/lib/filesystem-contract.mjs",
    canonicalRunCreator: "scripts/create-generation-run.mjs",
    canonicalRunValidator: "scripts/validate-run-directory.mjs",
    canonicalFilesystemMigration: "scripts/migrate-filesystem-contract-v1.mjs",
  };
  for (const [field, expected] of Object.entries(canonicalExpectations)) {
    if (manifest[field] !== expected) failures.push(`manifest ${field} drift`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.pipelineVersion)) failures.push("manifest pipelineVersion is invalid");
  resolveContractRoots(root, manifest);
  const expectedRelease = `research/pipeline/releases/v${manifest.pipelineVersion}.json`;
  if (manifest.currentRelease !== expectedRelease) failures.push(`current release must be ${expectedRelease}`);
  if (!manifest.activePipelineChange.startsWith("research/pipeline/changes/")) failures.push("active change root drift");

  try {
    await assertResearchRootHygiene(root, manifest);
  } catch (error) {
    failures.push(error.message);
  }

  const frontendFiles = (await fs.readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name);
  const activeFromFrontend = new Map();
  for (const source of frontendFiles) {
    const text = await fs.readFile(path.join(root, source), "utf8");
    for (const match of text.matchAll(/["']?contentFile["']?\s*:\s*["']\.\/(research\/[^"']+)["']/g)) {
      if (!activeFromFrontend.has(match[1])) activeFromFrontend.set(match[1], []);
      activeFromFrontend.get(match[1]).push(source);
    }
  }
  const activeFromManifest = new Map();
  const activePattern = new RegExp(manifest.filesystemContract.activeContentPattern);
  for (const [museumId, record] of Object.entries(manifest.museums ?? {})) {
    const expected = `research/content/${museumId}.md`;
    if (record.contentFile !== expected) failures.push(`${museumId}: contentFile must be ${expected}`);
    if (!activePattern.test(record.contentFile)) failures.push(`${museumId}: active content path violates pattern`);
    if (activeFromManifest.has(record.contentFile)) failures.push(`duplicate active content path: ${record.contentFile}`);
    activeFromManifest.set(record.contentFile, museumId);
    if (!(await exists(path.join(root, ...record.contentFile.split("/"))))) failures.push(`active content missing: ${record.contentFile}`);
    const frontendRefs = activeFromFrontend.get(record.contentFile) ?? [];
    if (frontendRefs.length < 1) {
      failures.push(`${museumId}: frontend contentFile reference is missing`);
    }
  }
  for (const file of activeFromFrontend.keys()) {
    if (!activeFromManifest.has(file)) failures.push(`frontend content is not registered in manifest: ${file}`);
    if (file.startsWith("research/archive/")) failures.push(`frontend references archived content: ${file}`);
  }

  const canonicalScriptPaths = Object.entries(manifest)
    .filter(([key, value]) => key.startsWith("canonical") && typeof value === "string" && value.startsWith("scripts/"))
    .map(([, value]) => value);
  for (const script of canonicalScriptPaths) {
    const source = await fs.readFile(path.join(root, script), "utf8");
    if (script !== manifest.canonicalFilesystemMigration) {
      if (/(?:from\s+["']|import\s*(?:\(\s*)?["'])[^"']*(?:scripts[\\/]legacy|\.\/legacy[\\/])/.test(source)) {
        failures.push(`canonical script imports legacy code: ${script}`);
      }
      if (/research[\\/]archive[\\/]content/.test(source)) failures.push(`canonical script reads archive content: ${script}`);
    }
  }
  const scriptRootEntries = await fs.readdir(path.join(root, "scripts"), { withFileTypes: true });
  for (const entry of scriptRootEntries) {
    if (entry.isFile() && /^build-[a-z][a-z0-9-]*-.*\.mjs$/.test(entry.name)) {
      failures.push(`museum-specific builder remains canonical: scripts/${entry.name}`);
    }
  }
  if (manifest.futureMuseumContract?.museumSpecificBuilderAllowed !== false) {
    failures.push("futureMuseumContract.museumSpecificBuilderAllowed must remain false");
  }
  for (const name of await fs.readdir(path.join(root, "scripts", "legacy")).catch(() => [])) {
    const source = await fs.readFile(path.join(root, "scripts", "legacy", name), "utf8");
    if (!source.startsWith("// NON-CANONICAL LEGACY SCRIPT") && !source.startsWith("# NON-CANONICAL LEGACY SCRIPT")) {
      failures.push(`legacy script lacks non-canonical banner: scripts/legacy/${name}`);
    }
  }

  await verifyRuns(root, manifest, failures);

  const changePath = path.join(root, ...manifest.activePipelineChange.split("/"));
  if (!(await exists(changePath))) failures.push("active pipeline change is missing");
  else {
    const change = JSON.parse(await fs.readFile(changePath, "utf8"));
    if (change.status !== "owner_approved" || change.authorizedBy !== "owner" || !change.ownerInstruction?.trim()) {
      failures.push("active pipeline change lacks owner authorization");
    }
    if (change.targetVersion !== manifest.pipelineVersion) failures.push("active pipeline change target version drift");
  }

  if (checkRelease) {
    const releasePath = path.join(root, ...manifest.currentRelease.split("/"));
    if (!(await exists(releasePath))) failures.push(`current release is missing: ${manifest.currentRelease}`);
    else {
      const release = JSON.parse(await fs.readFile(releasePath, "utf8"));
      if (release.version !== manifest.pipelineVersion || release.status !== manifest.releaseStatus) {
        failures.push("current pipeline release drift");
      }
      if (release.changeControl?.record !== manifest.activePipelineChange) failures.push("release change record drift");
      for (const locked of release.canonicalFiles ?? []) {
        const target = path.join(root, ...locked.path.split("/"));
        if (!(await exists(target))) failures.push(`release canonical file missing: ${locked.path}`);
        else if (sha256(await fs.readFile(target)) !== locked.sha256) failures.push(`pipeline release hash drift: ${locked.path}`);
      }
      for (const frozen of release.historicalReleaseHashes ?? []) {
        const target = path.join(root, ...frozen.path.split("/"));
        if (!(await exists(target)) || sha256(await fs.readFile(target)) !== frozen.sha256) {
          failures.push(`frozen historical release drift: ${frozen.path}`);
        }
      }
    }
  }
  return { failures, activeContentFiles: activeFromManifest.size, pipelineVersion: manifest.pipelineVersion };
}

async function main() {
  const projectRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const result = await verifyProjectAuthority({ projectRoot, checkRelease: true });
  for (const failure of result.failures) process.stderr.write(`- ${failure}\n`);
  if (result.failures.length) process.exitCode = 1;
  else {
    process.stdout.write(
      `project authority gate passed: ${result.activeContentFiles} active content files, pipeline ${result.pipelineVersion}\n`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
