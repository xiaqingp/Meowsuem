import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const script = path.resolve(new URL("migrate-filesystem-contract-v1.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const contract = {
  version: 1,
  activeContentRoot: "research/content",
  evidenceRoot: "research/evidence",
  productionRunRoot: "research/runs/production",
  regressionRunRoot: "research/runs/regression",
  experimentRunRoot: "research/runs/experiment",
  pipelineRoot: "research/pipeline",
  archiveRoot: "research/archive",
  migrationRoot: "research/migrations",
  allowedRunKinds: ["production", "regression", "experiment"],
  runIdPattern: "^[0-9]{8}T[0-9]{6}Z-p[0-9]+\\.[0-9]+\\.[0-9]+$",
  activeContentPattern: "^research/content/[a-z][a-z0-9-]*\\.md$",
  generatedFilesForbiddenInResearchRoot: true,
  runDescriptor: "run.json",
  currentLayoutVersion: 1,
  immutableStatuses: ["accepted", "published", "superseded"],
};
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function run(root, mode) {
  return spawnSync(process.execPath, [script, mode, `--project-root=${root}`], {
    cwd: root,
    encoding: "utf8",
  });
}

async function fixture({ collision = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-migration-"));
  await fs.mkdir(path.join(root, "research"), { recursive: true });
  const manifest = {
    pipelineVersion: "2.9.0",
    currentVersion: "2.2.0",
    filesystemContract: contract,
    museums: { seattle: { contentFile: "research/content/seattle.md" } },
  };
  await fs.writeFile(path.join(root, "research", "content-standard-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const name of [
    "README.md",
    "generation-pipeline.md",
    "meowseum-content-instruction.md",
    "significance-evidence-v1.6.0.json",
    "user-taste-profile.md",
  ]) {
    await fs.writeFile(path.join(root, "research", name), "");
  }
  const content = Buffer.from("# Seattle fixture\n");
  await fs.writeFile(path.join(root, "research", "seattle-content-v3.md"), content);
  await fs.writeFile(path.join(root, "research", "louvre-content-prototype.md"), "# Historical fixture\n");
  await fs.writeFile(path.join(root, "seattle.js"), 'museumData.seattle={contentFile:"./research/content/seattle.md"};\n');
  if (collision) {
    await fs.mkdir(path.join(root, "research", "content"), { recursive: true });
    await fs.writeFile(path.join(root, "research", "content", "seattle.md"), "collision");
  }
  for (const args of [
    ["init"],
    ["config", "user.email", "fixture@example.com"],
    ["config", "user.name", "Fixture"],
    ["add", "."],
    ["commit", "-m", "fixture"],
  ]) {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  return { root, contentHash: hash(content) };
}

const positive = await fixture();
try {
  let result = run(positive.root, "--plan");
  assert.equal(result.status, 0, result.stderr);
  result = run(positive.root, "--apply");
  assert.equal(result.status, 0, result.stderr);
  result = run(positive.root, "--verify");
  assert.equal(result.status, 0, result.stderr);
  const destination = path.join(positive.root, "research", "content", "seattle.md");
  assert.equal(hash(await fs.readFile(destination)), positive.contentHash);
  const before = await fs.readFile(
    path.join(positive.root, "research", "migrations", "filesystem-contract-v1", "migration-result.json"),
  );
  result = run(positive.root, "--apply");
  assert.equal(result.status, 0, result.stderr);
  const after = await fs.readFile(
    path.join(positive.root, "research", "migrations", "filesystem-contract-v1", "migration-result.json"),
  );
  assert.deepEqual(after, before);
  await fs.writeFile(destination, "tampered");
  result = run(positive.root, "--verify");
  assert.equal(result.status, 0, result.stderr);
  const archived = path.join(positive.root, "research", "archive", "content", "louvre-content-prototype.md");
  await fs.writeFile(archived, "tampered");
  result = run(positive.root, "--verify");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /archive provenance drift/);
} finally {
  await fs.rm(positive.root, { recursive: true, force: true });
}

const collision = await fixture({ collision: true });
try {
  const result = run(collision.root, "--plan");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /collisions/);
  assert.equal(await fs.readFile(path.join(collision.root, "research", "seattle-content-v3.md"), "utf8"), "# Seattle fixture\n");
} finally {
  await fs.rm(collision.root, { recursive: true, force: true });
}

process.stdout.write("filesystem migration tests passed\n");
