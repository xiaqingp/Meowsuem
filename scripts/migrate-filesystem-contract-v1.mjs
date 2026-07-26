import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  assertResearchRootHygiene,
  loadManifest,
  projectRelative,
} from "./lib/filesystem-contract.mjs";

const ACTIVE_DESTINATIONS = {
  "research/alhambra-content-v1.md": "research/content/alhambra.md",
  "research/anchorage-content-v1.md": "research/content/anchorage.md",
  "research/british-content-v1.md": "research/content/british.md",
  "research/chichu-content-v2.md": "research/content/chichu.md",
  "research/egyptian-content-v2.md": "research/content/egyptian.md",
  "research/enoura-content-v1.md": "research/content/enoura.md",
  "research/frye-content-v1.md": "research/content/frye.md",
  "research/getty-content-v1.md": "research/content/getty.md",
  "research/glyptotek-content-v2.md": "research/content/glyptotek.md",
  "research/louvre-content-v4.md": "research/content/louvre.md",
  "research/met-content-v2.md": "research/content/met.md",
  "research/muxin-content-v2.md": "research/content/muxin.md",
  "research/seattle-content-v3.md": "research/content/seattle.md",
  "research/smk-content-v1.md": "research/content/smk.md",
  "research/vienna-content-v2.md": "research/content/vienna.md",
};
const ARCHIVED_CONTENT = new Set([
  "research/chichu-content-v1.md",
  "research/egyptian-content-v1.md",
  "research/louvre-content-prototype.md",
  "research/louvre-content-test-v2.md",
  "research/louvre-content-v3.md",
  "research/louvre-new-content-v1.md",
  "research/muxin-content-v1.md",
  "research/seattle-content-v2.md",
  "research/vienna-content-v1.md",
]);
const LEGACY_SCRIPTS = [
  "build-alhambra-content.mjs",
  "build-egyptian-content.mjs",
  "build-louvre-v4.mjs",
  "build-m11-content.mjs",
  "build-vienna-content.mjs",
  "run-frye-pilot-author.ps1",
  "run-frye-pilot-reviewer.ps1",
];
const MIGRATION_ROOT = "research/migrations/filesystem-contract-v1";
const INVENTORY_PATH = `${MIGRATION_ROOT}/inventory-before.json`;
const PLAN_PATH = `${MIGRATION_ROOT}/migration-plan.json`;
const PLAN_MD_PATH = `${MIGRATION_ROOT}/migration-plan.md`;
const RESULT_PATH = `${MIGRATION_ROOT}/migration-result.json`;

function parseArgs(argv) {
  const mode = ["--plan", "--apply", "--verify"].find((value) => argv.includes(value));
  const projectArg = argv.find((value) => value.startsWith("--project-root="));
  if (!mode) throw new Error("Choose exactly one of --plan, --apply or --verify");
  return {
    mode,
    projectRoot: path.resolve(
      projectArg?.slice("--project-root=".length) ??
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    ),
  };
}

const slash = (value) => value.split(path.sep).join("/");
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const exists = async (target) =>
  fs
    .access(target)
    .then(() => true)
    .catch(() => false);

async function walk(directory) {
  const files = [];
  if (!(await exists(directory))) return files;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function referenceType(source) {
  if (source.endsWith("content-standard-manifest.json")) return "manifest";
  if (/^(?:index|museum)\.html$|^[a-z][a-z0-9-]*\.js$/.test(source)) return "frontend";
  if (source.includes("/pipeline/releases/") || source.includes("/pipeline-releases/")) return "release";
  if (source.includes("/pipeline/changes/") || source.includes("/pipeline-changes/")) return "change_record";
  if (source.startsWith("scripts/")) return "script";
  return "documentation";
}

function destinationFor(relative) {
  if (ACTIVE_DESTINATIONS[relative]) {
    return { kind: "active_content", proposedDestination: ACTIVE_DESTINATIONS[relative], action: "move" };
  }
  if (ARCHIVED_CONTENT.has(relative)) {
    return {
      kind: "historical",
      proposedDestination: `research/archive/content/${path.posix.basename(relative)}`,
      action: "archive",
    };
  }
  if (relative === "research/content-method-v2.md" || relative === "research/m22-pipeline-contract.md") {
    return {
      kind: "historical",
      proposedDestination: `research/archive/contracts/${path.posix.basename(relative)}`,
      action: "archive",
    };
  }
  if (relative === "research/louvre-image-sources.md") {
    return { kind: "evidence", proposedDestination: "research/evidence/museums/louvre/image-sources.md", action: "move" };
  }
  if (relative === "research/louvre-selection-60-v1.md") {
    return { kind: "evidence", proposedDestination: "research/evidence/museums/louvre/selection-60.md", action: "move" };
  }
  const prefixRules = [
    ["research/audits/", "research/evidence/audits/", "evidence", "move"],
    ["research/style-study/", "research/evidence/style-study/", "evidence", "move"],
    ["research/pipeline-changes/", "research/pipeline/changes/", "canonical", "move"],
    ["research/pipeline-releases/", "research/pipeline/releases/", "canonical", "move"],
    ["research/pipeline-tests/", "research/pipeline/tests/", "regression", "move"],
    ["research/generation-tests/", "research/archive/experiments/generation-tests/", "experiment", "archive"],
    ["research/m22/", "research/archive/experiments/m22/", "experiment", "archive"],
    ["research/m26/louvre/", "research/runs/production/louvre/m26-2026-07-22-01/", "production_run", "move"],
    ["research/m28-3/chichu/", "research/runs/production/chichu/m28-3-chichu/", "production_run", "move"],
    ["research/m28-4/muxin/", "research/runs/production/muxin/m28-4-muxin/", "production_run", "move"],
    ["research/m28-6/vienna/", "research/runs/production/vienna/m28-6-vienna/", "production_run", "move"],
    [
      "research/m28-12/seattle-selection-schema-superseded/",
      "research/archive/runs/m28-12/seattle-selection-schema-superseded/",
      "historical",
      "archive",
    ],
    [
      "research/m28-12/seattle-standard-route-superseded/",
      "research/archive/runs/m28-12/seattle-standard-route-superseded/",
      "historical",
      "archive",
    ],
    ["research/m28-12/seattle/", "research/runs/production/seattle/m28-12-seattle/", "production_run", "move"],
  ];
  for (const [source, destination, kind, action] of prefixRules) {
    if (relative.startsWith(source)) {
      return { kind, proposedDestination: `${destination}${relative.slice(source.length)}`, action };
    }
  }
  const oldArchive = {
    "research/archive/content-standard-manifest-before-M28.1.json":
      "research/archive/contracts/content-standard-manifest-before-M28.1.json",
    "research/archive/generation-pipeline-history-through-M28.1.md":
      "research/archive/contracts/generation-pipeline-history-through-M28.1.md",
    "research/archive/meowseum-content-instruction-history-through-M28.1.md":
      "research/archive/contracts/meowseum-content-instruction-history-through-M28.1.md",
  };
  if (oldArchive[relative]) {
    return { kind: "historical", proposedDestination: oldArchive[relative], action: "move" };
  }
  if (
    [
      "research/README.md",
      "research/generation-pipeline.md",
      "research/meowseum-content-instruction.md",
      "research/content-standard-manifest.json",
      "research/significance-evidence-v1.6.0.json",
      "research/user-taste-profile.md",
    ].includes(relative) ||
    relative.startsWith("research/pipeline/") ||
    relative.startsWith("research/migrations/") ||
    relative.startsWith("research/content/") ||
    relative.startsWith("research/evidence/") ||
    relative.startsWith("research/runs/") ||
    relative.startsWith("research/archive/")
  ) {
    return { kind: "canonical", proposedDestination: relative, action: "keep" };
  }
  return { kind: "unknown", proposedDestination: null, action: "investigate" };
}

async function trackedFiles(projectRoot) {
  const run = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(run.stderr || "git ls-files failed");
  return run.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(slash);
}

async function buildInventory(projectRoot) {
  const allTracked = await trackedFiles(projectRoot);
  const referencesByPath = new Map();
  for (const source of allTracked) {
    const absolute = path.join(projectRoot, ...source.split("/"));
    let text;
    try {
      const bytes = await fs.readFile(absolute);
      if (bytes.includes(0)) continue;
      text = bytes.toString("utf8");
    } catch {
      continue;
    }
    for (const match of text.matchAll(/research\/[A-Za-z0-9._/-]+/g)) {
      const referenced = match[0].replace(/[),.;:'"`]+$/, "");
      if (referenced === source) continue;
      if (!referencesByPath.has(referenced)) referencesByPath.set(referenced, []);
      const record = { source, type: referenceType(source) };
      if (!referencesByPath.get(referenced).some((item) => item.source === source)) {
        referencesByPath.get(referenced).push(record);
      }
    }
  }
  const files = [];
  for (const absolute of await walk(path.join(projectRoot, "research"))) {
    const relative = projectRelative(projectRoot, absolute);
    if ([INVENTORY_PATH, PLAN_PATH, PLAN_MD_PATH, RESULT_PATH].includes(relative)) continue;
    const bytes = await fs.readFile(absolute);
    const classified = destinationFor(relative);
    files.push({
      path: relative,
      sha256: sha256(bytes),
      size: bytes.length,
      kind: classified.kind,
      references: referencesByPath.get(relative) ?? [],
      proposedDestination: classified.proposedDestination,
      action: classified.action,
    });
  }
  return { generatedAt: new Date().toISOString(), files: files.sort((a, b) => a.path.localeCompare(b.path)) };
}

function migrationOperations(inventory) {
  const operations = [
    ["research/audits", "research/evidence/audits"],
    ["research/style-study", "research/evidence/style-study"],
    ...inventory.files
      .filter((file) => file.path.startsWith("research/pipeline-changes/"))
      .map((file) => [
        file.path,
        `research/pipeline/changes/${file.path.slice("research/pipeline-changes/".length)}`,
      ]),
    ["research/pipeline-releases", "research/pipeline/releases"],
    ["research/pipeline-tests", "research/pipeline/tests"],
    ["research/generation-tests", "research/archive/experiments/generation-tests"],
    ["research/m22", "research/archive/experiments/m22"],
    ["research/m26/louvre", "research/runs/production/louvre/m26-2026-07-22-01"],
    ["research/m28-3/chichu", "research/runs/production/chichu/m28-3-chichu"],
    ["research/m28-4/muxin", "research/runs/production/muxin/m28-4-muxin"],
    ["research/m28-6/vienna", "research/runs/production/vienna/m28-6-vienna"],
    [
      "research/m28-12/seattle-selection-schema-superseded",
      "research/archive/runs/m28-12/seattle-selection-schema-superseded",
    ],
    [
      "research/m28-12/seattle-standard-route-superseded",
      "research/archive/runs/m28-12/seattle-standard-route-superseded",
    ],
    ["research/m28-12/seattle", "research/runs/production/seattle/m28-12-seattle"],
    ...Object.entries(ACTIVE_DESTINATIONS),
    ...[...ARCHIVED_CONTENT].map((source) => [source, `research/archive/content/${path.posix.basename(source)}`]),
    ["research/content-method-v2.md", "research/archive/contracts/content-method-v2.md"],
    ["research/m22-pipeline-contract.md", "research/archive/contracts/m22-pipeline-contract.md"],
    ["research/louvre-image-sources.md", "research/evidence/museums/louvre/image-sources.md"],
    ["research/louvre-selection-60-v1.md", "research/evidence/museums/louvre/selection-60.md"],
    [
      "research/archive/content-standard-manifest-before-M28.1.json",
      "research/archive/contracts/content-standard-manifest-before-M28.1.json",
    ],
    [
      "research/archive/generation-pipeline-history-through-M28.1.md",
      "research/archive/contracts/generation-pipeline-history-through-M28.1.md",
    ],
    [
      "research/archive/meowseum-content-instruction-history-through-M28.1.md",
      "research/archive/contracts/meowseum-content-instruction-history-through-M28.1.md",
    ],
    ...LEGACY_SCRIPTS.map((name) => [`scripts/${name}`, `scripts/legacy/${name}`]),
  ];
  return operations.map(([oldPath, newPath]) => ({ oldPath, newPath }));
}

async function writePlan(projectRoot) {
  const inventory = await buildInventory(projectRoot);
  const unknown = inventory.files.filter((file) => file.kind === "unknown");
  const operations = [];
  for (const operation of migrationOperations(inventory)) {
    if (
      inventory.files.some(
        (file) => file.path === operation.oldPath || file.path.startsWith(`${operation.oldPath}/`),
      ) ||
      (await exists(path.join(projectRoot, ...operation.oldPath.split("/"))))
    ) {
      operations.push(operation);
    }
  }
  const collisions = [];
  for (const operation of operations) {
    if (await exists(path.join(projectRoot, ...operation.newPath.split("/")))) collisions.push(operation);
  }
  const plan = {
    generatedAt: new Date().toISOString(),
    filesystemContractVersion: 1,
    targetPipelineVersion: "2.9.0",
    summary: {
      files: inventory.files.length,
      moves: inventory.files.filter((file) => ["move", "archive"].includes(file.action)).length,
      archives: inventory.files.filter((file) => file.action === "archive").length,
      unknown: unknown.length,
      collisions: collisions.length,
    },
    unknown: unknown.map((file) => file.path),
    collisions,
    operations,
  };
  const migrationRoot = path.join(projectRoot, ...MIGRATION_ROOT.split("/"));
  await fs.mkdir(migrationRoot, { recursive: true });
  await fs.writeFile(path.join(projectRoot, ...INVENTORY_PATH.split("/")), `${JSON.stringify(inventory, null, 2)}\n`);
  await fs.writeFile(path.join(projectRoot, ...PLAN_PATH.split("/")), `${JSON.stringify(plan, null, 2)}\n`);
  const markdown = `# Filesystem Contract v1 Migration Plan

- Generated: ${plan.generatedAt}
- Inventory files: ${plan.summary.files}
- Files to move or archive: ${plan.summary.moves}
- Files to archive: ${plan.summary.archives}
- Unknown: ${plan.summary.unknown}
- Destination collisions: ${plan.summary.collisions}

## Operations

${operations.map((item) => `- \`${item.oldPath}\` → \`${item.newPath}\``).join("\n")}

## Investigate

${unknown.length ? unknown.map((item) => `- \`${item.path}\``).join("\n") : "- None"}
`;
  await fs.writeFile(path.join(projectRoot, ...PLAN_MD_PATH.split("/")), markdown);
  if (unknown.length || collisions.length) {
    throw new Error(`migration plan blocked: ${unknown.length} unknown, ${collisions.length} collisions`);
  }
  return plan;
}

function treeHash(files) {
  return sha256(
    Buffer.from(
      files
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((file) => `${file.path}\0${file.sha256}\n`)
        .join(""),
    ),
  );
}

async function treeSnapshot(projectRoot, relative) {
  const absolute = path.join(projectRoot, ...relative.split("/"));
  const stat = await fs.stat(absolute);
  const targets = stat.isDirectory() ? await walk(absolute) : [absolute];
  const files = [];
  for (const file of targets) {
    const bytes = await fs.readFile(file);
    files.push({ path: slash(path.relative(absolute, file)) || ".", sha256: sha256(bytes) });
  }
  return { files, hash: treeHash(files) };
}

function gitMove(projectRoot, oldPath, newPath) {
  const targetParent = path.dirname(path.join(projectRoot, ...newPath.split("/")));
  return fs.mkdir(targetParent, { recursive: true }).then(() => {
    const run = spawnSync("git", ["mv", "--", oldPath, newPath], { cwd: projectRoot, encoding: "utf8" });
    if (run.status !== 0) throw new Error(run.stderr || `git mv failed: ${oldPath}`);
  });
}

async function addArchiveBanner(file, originalPath, activeReplacement, originalSha) {
  const text = await fs.readFile(file, "utf8");
  if (text.includes("Status: Archived / Non-authoritative")) return;
  const banner = `<!--
Status: Archived / Non-authoritative
Original path: ${originalPath}
Archived on: 2026-07-25
Original SHA-256: ${originalSha}
${activeReplacement ? `Superseded by: ${activeReplacement}` : "No active replacement."}
-->

`;
  await fs.writeFile(file, `${banner}${text}`);
}

async function addLegacyBanner(file, originalPath) {
  const text = await fs.readFile(file, "utf8");
  if (text.includes("NON-CANONICAL LEGACY SCRIPT")) return;
  const prefix = path.extname(file).toLowerCase() === ".ps1" ? "# " : "// ";
  await fs.writeFile(
    file,
    `${prefix}NON-CANONICAL LEGACY SCRIPT. Preserved from ${originalPath}; not imported or spawned by the canonical pipeline.\n${text}`,
  );
}

async function writeLegacyRunDescriptors(projectRoot) {
  const records = [
    ["louvre", "m26-2026-07-22-01", "blocked", "2.6.2", false, "M26"],
    ["chichu", "m28-3-chichu", "published", "2.7.2", true, "M28.3"],
    ["muxin", "m28-4-muxin", "published", "2.7.2", true, "M28.4"],
    ["vienna", "m28-6-vienna", "published", "2.7.2", true, "M28.6"],
    ["seattle", "m28-12-seattle", "published", "2.7.2", true, "M28.12"],
  ];
  for (const [museumId, runId, status, pipelineVersion, immutable, milestone] of records) {
    const runRoot = path.join(projectRoot, "research", "runs", "production", museumId, runId);
    if (!(await exists(runRoot))) continue;
    const descriptor = {
      schemaVersion: 1,
      filesystemContractVersion: 1,
      runKind: "production",
      runId,
      museumId,
      milestone,
      pipelineVersion,
      instructionVersion: "legacy",
      status,
      createdAt: "2026-07-25T00:00:00.000Z",
      createdBy: "scripts/migrate-filesystem-contract-v1.mjs",
      layoutVersion: 0,
      legacyLayout: true,
      immutable,
      ...(status === "published" ? { publishedAt: "2026-07-25T00:00:00.000Z" } : {}),
    };
    await fs.writeFile(path.join(runRoot, "run.json"), `${JSON.stringify(descriptor, null, 2)}\n`, { flag: "wx" });
  }
}

async function removeEmptyLegacyRoots(projectRoot) {
  for (const relative of [
    "research/m26",
    "research/m28-3",
    "research/m28-4",
    "research/m28-6",
    "research/m28-12",
    "research/pipeline-changes",
  ]) {
    const target = path.join(projectRoot, ...relative.split("/"));
    if (!(await exists(target))) continue;
    const entries = await fs.readdir(target);
    if (entries.length) throw new Error(`refusing to remove non-empty legacy root: ${relative}`);
    await fs.rmdir(target);
  }
}

async function updateCurrentReferences(projectRoot, plan) {
  const replacements = plan.operations
    .filter(
      ({ oldPath }) =>
        oldPath.startsWith("research/") &&
        !oldPath.startsWith("research/generation-tests") &&
        !oldPath.startsWith("research/m22/") &&
        !oldPath.includes("superseded"),
    )
    .sort((a, b) => b.oldPath.length - a.oldPath.length);
  const targets = [
    "research/content-standard-manifest.json",
    "research/README.md",
    "research/generation-pipeline.md",
    "coho_museum/PRD.md",
    "coho_museum/TechDesign.md",
    "coho_museum/Milestones.md",
  ];
  for (const entry of await fs.readdir(projectRoot, { withFileTypes: true })) {
    if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".html"))) targets.push(entry.name);
  }
  const scriptsRoot = path.join(projectRoot, "scripts");
  if (await exists(scriptsRoot)) {
    for (const entry of await fs.readdir(scriptsRoot, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        /\.(?:mjs|ps1)$/.test(entry.name) &&
        entry.name !== "migrate-filesystem-contract-v1.mjs"
      ) {
        targets.push(`scripts/${entry.name}`);
      }
    }
  }
  for (const relative of targets) {
    const target = path.join(projectRoot, ...relative.split("/"));
    if (!(await exists(target))) continue;
    let text = await fs.readFile(target, "utf8");
    const before = text;
    for (const { oldPath, newPath } of replacements) {
      text = text.replaceAll(oldPath, newPath);
      text = text.replaceAll(oldPath.replaceAll("/", "\\"), newPath.replaceAll("/", "\\"));
    }
    if (text !== before) await fs.writeFile(target, text);
  }
}

async function applyPlan(projectRoot) {
  const resultFile = path.join(projectRoot, ...RESULT_PATH.split("/"));
  if (await exists(resultFile)) {
    await removeEmptyLegacyRoots(projectRoot);
    await verifyMigration(projectRoot);
    return JSON.parse(await fs.readFile(resultFile, "utf8"));
  }
  const plan = JSON.parse(await fs.readFile(path.join(projectRoot, ...PLAN_PATH.split("/")), "utf8"));
  if (plan.unknown.length || plan.collisions.length) throw new Error("migration plan is not safe to apply");
  const results = [];
  for (const operation of plan.operations) {
    const source = path.join(projectRoot, ...operation.oldPath.split("/"));
    const destination = path.join(projectRoot, ...operation.newPath.split("/"));
    if (!(await exists(source))) {
      if (await exists(destination)) continue;
      throw new Error(`migration source is missing: ${operation.oldPath}`);
    }
    if (await exists(destination)) throw new Error(`migration destination collision: ${operation.newPath}`);
    const before = await treeSnapshot(projectRoot, operation.oldPath);
    await gitMove(projectRoot, operation.oldPath, operation.newPath);
    const afterMove = await treeSnapshot(projectRoot, operation.newPath);
    if (before.hash !== afterMove.hash) {
      throw new Error(`migration hash mismatch: ${operation.oldPath} -> ${operation.newPath}`);
    }
    results.push({
      oldPath: operation.oldPath,
      newPath: operation.newPath,
      hashBefore: before.hash,
      hashAfter: afterMove.hash,
      files: before.files.length,
    });
  }
  await updateCurrentReferences(projectRoot, plan);
  const inventory = JSON.parse(await fs.readFile(path.join(projectRoot, ...INVENTORY_PATH.split("/")), "utf8"));
  for (const originalPath of ARCHIVED_CONTENT) {
    const record = inventory.files.find((file) => file.path === originalPath);
    if (!record) continue;
    const destination = ACTIVE_DESTINATIONS[originalPath]
      ? ACTIVE_DESTINATIONS[originalPath]
      : `research/archive/content/${path.posix.basename(originalPath)}`;
    const museumId = path.posix.basename(originalPath).split("-content")[0];
    await addArchiveBanner(
      path.join(projectRoot, ...destination.split("/")),
      originalPath,
      `research/content/${museumId}.md`,
      record.sha256,
    );
  }
  for (const name of LEGACY_SCRIPTS) {
    const target = path.join(projectRoot, "scripts", "legacy", name);
    if (await exists(target)) await addLegacyBanner(target, `scripts/${name}`);
  }
  await writeLegacyRunDescriptors(projectRoot);
  await removeEmptyLegacyRoots(projectRoot);
  for (const result of results) {
    result.finalHash = (await treeSnapshot(projectRoot, result.newPath)).hash;
  }
  const migrationResult = {
    generatedAt: new Date().toISOString(),
    filesystemContractVersion: 1,
    status: "moved",
    moves: results,
  };
  await fs.writeFile(resultFile, `${JSON.stringify(migrationResult, null, 2)}\n`);
  return migrationResult;
}

async function verifyMigration(projectRoot) {
  const manifest = await loadManifest(projectRoot);
  const result = JSON.parse(await fs.readFile(path.join(projectRoot, ...RESULT_PATH.split("/")), "utf8"));
  const inventory = JSON.parse(await fs.readFile(path.join(projectRoot, ...INVENTORY_PATH.split("/")), "utf8"));
  const failures = [];
  const isMutableDestination = (relativePath) =>
    relativePath.startsWith(`${manifest.filesystemContract.activeContentRoot}/`) ||
    relativePath.startsWith(`${manifest.filesystemContract.pipelineRoot}/tests/`);
  for (const move of result.moves) {
    if (await exists(path.join(projectRoot, ...move.oldPath.split("/")))) failures.push(`old path remains: ${move.oldPath}`);
    const destination = path.join(projectRoot, ...move.newPath.split("/"));
    if (!(await exists(destination))) failures.push(`destination missing: ${move.newPath}`);
    const originalFiles = inventory.files.filter(
      (file) => file.path === move.oldPath || file.path.startsWith(`${move.oldPath}/`),
    );
    for (const original of originalFiles) {
      const suffix = original.path === move.oldPath ? "" : original.path.slice(move.oldPath.length + 1);
      const targetRelative = suffix ? `${move.newPath}/${suffix}` : move.newPath;
      const target = path.join(projectRoot, ...targetRelative.split("/"));
      if (!(await exists(target))) {
        failures.push(`migrated file missing: ${targetRelative}`);
        continue;
      }
      const bytes = await fs.readFile(target);
      if (move.newPath.startsWith("research/archive/content/")) {
        const text = bytes.toString("utf8");
        if (
          !text.includes("Status: Archived / Non-authoritative") ||
          !text.includes(`Original SHA-256: ${original.sha256}`)
        ) {
          failures.push(`archive provenance drift: ${targetRelative}`);
        }
      } else if (!isMutableDestination(targetRelative) && sha256(bytes) !== original.sha256) {
        failures.push(`hash drift: ${targetRelative}`);
      }
    }
    if (!originalFiles.length && move.oldPath.startsWith("scripts/") && move.finalHash) {
      const snapshot = await treeSnapshot(projectRoot, move.newPath);
      if (snapshot.hash !== move.finalHash) failures.push(`final hash drift: ${move.newPath}`);
    }
  }
  try {
    await assertResearchRootHygiene(projectRoot, manifest);
  } catch (error) {
    failures.push(error.message);
  }
  for (const [museumId, record] of Object.entries(manifest.museums ?? {})) {
    const expected = `research/content/${museumId}.md`;
    if (record.contentFile !== expected) failures.push(`${museumId}: manifest contentFile is not canonical`);
    if (!(await exists(path.join(projectRoot, ...expected.split("/"))))) failures.push(`${museumId}: active content missing`);
  }
  if (failures.length) throw new Error(`filesystem migration verification failed:\n${failures.join("\n")}`);
  return { status: "passed", moves: result.moves.length };
}

const { mode, projectRoot } = parseArgs(process.argv.slice(2));
try {
  const result =
    mode === "--plan"
      ? await writePlan(projectRoot)
      : mode === "--apply"
        ? await applyPlan(projectRoot)
        : await verifyMigration(projectRoot);
  process.stdout.write(`${JSON.stringify(result.summary ?? result)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
