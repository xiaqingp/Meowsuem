import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]*$/;
const RUN_STATUSES = new Set([
  "created",
  "running",
  "blocked",
  "verified",
  "accepted",
  "published",
  "failed",
  "superseded",
]);
const STATUS_TRANSITIONS = {
  created: new Set(["running", "blocked", "failed", "superseded"]),
  running: new Set(["blocked", "verified", "failed", "superseded"]),
  blocked: new Set(["running", "failed", "superseded"]),
  verified: new Set(["accepted", "published", "failed", "superseded"]),
  accepted: new Set(),
  published: new Set(),
  failed: new Set(["superseded"]),
  superseded: new Set(),
};
const ROOT_ALLOWLIST = new Set([
  "README.md",
  "generation-pipeline.md",
  "meowseum-content-instruction.md",
  "content-standard-manifest.json",
  "significance-evidence-v1.6.0.json",
  "user-taste-profile.md",
  "content",
  "evidence",
  "runs",
  "pipeline",
  "migrations",
  "archive",
]);

function violation(message) {
  return new Error(`Filesystem contract violation: ${message}`);
}

function comparable(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isInside(parent, child, allowEqual = true) {
  const relative = path.relative(comparable(parent), comparable(child));
  if (relative === "") return allowEqual;
  return !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

async function projectedRealPath(target) {
  let cursor = path.resolve(target);
  const missing = [];
  while (true) {
    try {
      const real = await fs.realpath(cursor);
      return path.resolve(real, ...missing.reverse());
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw violation(`cannot resolve an existing ancestor for ${target}`);
      missing.push(path.basename(cursor));
      cursor = parent;
    }
  }
}

function requireContract(manifest) {
  const contract = manifest?.filesystemContract;
  if (!contract || contract.version !== 1) {
    throw violation("manifest filesystemContract.version must be 1");
  }
  return contract;
}

export async function loadManifest(projectRoot) {
  const root = path.resolve(projectRoot);
  const manifestPath = path.join(root, "research", "content-standard-manifest.json");
  const parsed = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  requireContract(parsed);
  return parsed;
}

export function assertSafeIdentifier(value, label = "identifier") {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw violation(`${label} must match ${IDENTIFIER_PATTERN}; received ${JSON.stringify(value)}`);
  }
  return value;
}

export function resolveContractRoots(projectRoot, manifest) {
  const root = path.resolve(projectRoot);
  const contract = requireContract(manifest);
  const resolveRoot = (field) => {
    const value = contract[field];
    if (typeof value !== "string" || path.isAbsolute(value)) {
      throw violation(`filesystemContract.${field} must be a project-relative path`);
    }
    const resolved = path.resolve(root, value);
    if (!isInside(root, resolved)) {
      throw violation(`filesystemContract.${field} escapes the project root`);
    }
    return resolved;
  };
  return {
    projectRoot: root,
    researchRoot: path.join(root, "research"),
    activeContentRoot: resolveRoot("activeContentRoot"),
    evidenceRoot: resolveRoot("evidenceRoot"),
    productionRunRoot: resolveRoot("productionRunRoot"),
    regressionRunRoot: resolveRoot("regressionRunRoot"),
    experimentRunRoot: resolveRoot("experimentRunRoot"),
    pipelineRoot: resolveRoot("pipelineRoot"),
    archiveRoot: resolveRoot("archiveRoot"),
    migrationRoot: resolveRoot("migrationRoot"),
  };
}

export function resolveRunRoot({
  projectRoot,
  manifest,
  runKind,
  museumId,
  caseId,
  runId,
}) {
  const contract = requireContract(manifest);
  if (!contract.allowedRunKinds.includes(runKind)) {
    throw violation(`runKind must be one of ${contract.allowedRunKinds.join(", ")}`);
  }
  const roots = resolveContractRoots(projectRoot, manifest);
  const identity =
    runKind === "production"
      ? assertSafeIdentifier(museumId, "museumId")
      : assertSafeIdentifier(caseId ?? museumId, runKind === "regression" ? "caseId" : "museumIdOrCaseId");
  if (typeof runId !== "string" || !new RegExp(contract.runIdPattern).test(runId)) {
    throw violation(`runId must match ${contract.runIdPattern}; received ${JSON.stringify(runId)}`);
  }
  const parent =
    runKind === "production"
      ? roots.productionRunRoot
      : runKind === "regression"
        ? roots.regressionRunRoot
        : roots.experimentRunRoot;
  return path.join(parent, identity, runId);
}

export async function assertPathInside(parent, child, options = {}) {
  const allowEqual = options.allowEqual ?? true;
  const [realParent, projectedChild] = await Promise.all([
    projectedRealPath(parent),
    projectedRealPath(child),
  ]);
  if (!isInside(realParent, projectedChild, allowEqual)) {
    throw violation(`${path.resolve(child)} is outside ${path.resolve(parent)}`);
  }
  return projectedChild;
}

export async function assertRunRootMatchesContract({
  projectRoot,
  manifest,
  runRoot,
  runDescriptor,
}) {
  const descriptor =
    runDescriptor ??
    JSON.parse(
      await fs.readFile(path.join(path.resolve(runRoot), requireContract(manifest).runDescriptor), "utf8"),
    );
  const contract = requireContract(manifest);
  if (!contract.allowedRunKinds.includes(descriptor.runKind)) {
    throw violation(`run descriptor has invalid runKind ${JSON.stringify(descriptor.runKind)}`);
  }
  const roots = resolveContractRoots(projectRoot, manifest);
  const parent =
    descriptor.runKind === "production"
      ? roots.productionRunRoot
      : descriptor.runKind === "regression"
        ? roots.regressionRunRoot
        : roots.experimentRunRoot;
  const identity =
    descriptor.runKind === "production"
      ? assertSafeIdentifier(descriptor.museumId, "museumId")
      : assertSafeIdentifier(
          descriptor.caseId ?? descriptor.museumId,
          descriptor.runKind === "regression" ? "caseId" : "museumIdOrCaseId",
        );
  const layoutVersion = Number(descriptor.layoutVersion);
  if (layoutVersion === contract.currentLayoutVersion) {
    if (!new RegExp(contract.runIdPattern).test(descriptor.runId ?? "")) {
      throw violation(`run descriptor runId must match ${contract.runIdPattern}`);
    }
  } else if (!(layoutVersion === 0 && descriptor.legacyLayout === true)) {
    throw violation(`unsupported layoutVersion ${JSON.stringify(descriptor.layoutVersion)}`);
  }
  const expected = path.join(parent, identity, descriptor.runId);
  await assertPathInside(parent, runRoot);
  if (comparable(expected) !== comparable(runRoot)) {
    throw violation(`run root identity mismatch; expected ${expected}, received ${path.resolve(runRoot)}`);
  }
  return { descriptor, runRoot: path.resolve(runRoot), identity, parent };
}

export async function readAndValidateRunDescriptor(runRoot, manifest, projectRoot) {
  const descriptorPath = path.join(path.resolve(runRoot), requireContract(manifest).runDescriptor);
  let descriptor;
  try {
    descriptor = JSON.parse(await fs.readFile(descriptorPath, "utf8"));
  } catch (error) {
    throw violation(`cannot read ${descriptorPath}: ${error.message}`);
  }
  if (descriptor.schemaVersion !== 1 || descriptor.filesystemContractVersion !== 1) {
    throw violation("run.json must declare schemaVersion 1 and filesystemContractVersion 1");
  }
  if (!RUN_STATUSES.has(descriptor.status)) {
    throw violation(`run.json has invalid status ${JSON.stringify(descriptor.status)}`);
  }
  if (descriptor.pipelineVersion !== manifest.pipelineVersion) {
    if (!(descriptor.layoutVersion === 0 && descriptor.legacyLayout === true)) {
      throw violation(
        `run pipelineVersion ${JSON.stringify(descriptor.pipelineVersion)} does not match manifest ${manifest.pipelineVersion}`,
      );
    }
  }
  await assertRunRootMatchesContract({
    projectRoot: projectRoot ?? path.resolve(runRoot, "..", "..", "..", ".."),
    manifest,
    runRoot,
    runDescriptor: descriptor,
  });
  return descriptor;
}

export function assertWritableRun(runDescriptor, manifest) {
  const immutableStatuses = new Set(requireContract(manifest).immutableStatuses);
  if (runDescriptor.immutable === true || immutableStatuses.has(runDescriptor.status)) {
    throw violation(`run ${runDescriptor.runId} is immutable at status ${runDescriptor.status}`);
  }
  return runDescriptor;
}

export async function transitionRunStatus({ projectRoot, runRoot, manifest, nextStatus, timestamp = new Date() }) {
  const descriptor = await readAndValidateRunDescriptor(runRoot, manifest, projectRoot);
  const allowed = STATUS_TRANSITIONS[descriptor.status];
  if (!allowed?.has(nextStatus)) {
    throw violation(`status cannot advance from ${descriptor.status} to ${nextStatus}`);
  }
  const iso = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const next = {
    ...descriptor,
    status: nextStatus,
    updatedAt: iso,
    ...(nextStatus === "published" ? { publishedAt: iso } : {}),
    ...(["accepted", "published", "superseded"].includes(nextStatus) ? { immutable: true } : {}),
  };
  const descriptorPath = path.join(runRoot, requireContract(manifest).runDescriptor);
  const temporary = `${descriptorPath}.tmp-${process.pid}`;
  await fs.writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx" });
  try {
    await fs.rename(temporary, descriptorPath);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
  return next;
}

export async function findRunRoot(stageDirectory, projectRoot, manifest) {
  const roots = resolveContractRoots(projectRoot, manifest);
  let cursor = path.resolve(stageDirectory);
  await assertPathInside(roots.researchRoot, cursor);
  while (isInside(roots.researchRoot, cursor)) {
    try {
      await fs.access(path.join(cursor, requireContract(manifest).runDescriptor));
      return cursor;
    } catch {
      const parent = path.dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }
  throw violation(`no ${requireContract(manifest).runDescriptor} found above ${stageDirectory}`);
}

export async function assertResearchRootHygiene(projectRoot, manifest) {
  const { researchRoot } = resolveContractRoots(projectRoot, manifest);
  const entries = await fs.readdir(researchRoot, { withFileTypes: true });
  const violations = entries
    .map((entry) => entry.name)
    .filter((name) => !ROOT_ALLOWLIST.has(name));
  if (violations.length > 0) {
    throw violation(`research root contains forbidden entries: ${violations.sort().join(", ")}`);
  }
  return { researchRoot, entries: entries.length };
}

export async function resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind,
  museumId,
  caseId,
  runId,
  suppliedRunRoot,
  writable = false,
}) {
  const expected = resolveRunRoot({
    projectRoot,
    manifest,
    runKind,
    museumId,
    caseId,
    runId,
  });
  if (suppliedRunRoot && comparable(path.resolve(projectRoot, suppliedRunRoot)) !== comparable(expected)) {
    throw violation(`deprecated --run-root must exactly equal ${projectRelative(projectRoot, expected)}`);
  }
  const descriptor = await readAndValidateRunDescriptor(expected, manifest, projectRoot);
  if (
    descriptor.runKind !== runKind ||
    descriptor.runId !== runId ||
    (runKind === "production" && descriptor.museumId !== museumId) ||
    (runKind !== "production" && descriptor.caseId !== (caseId ?? museumId))
  ) {
    throw violation("CLI run identity does not match run.json");
  }
  if (writable) assertWritableRun(descriptor, manifest);
  return { runRoot: expected, descriptor };
}

export function projectRelative(projectRoot, target) {
  return path.relative(path.resolve(projectRoot), path.resolve(target)).split(path.sep).join("/");
}

export function contractViolation(message) {
  return violation(message);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.stderr.write("This module is a library and is not a standalone command.\n");
  process.exitCode = 2;
}
