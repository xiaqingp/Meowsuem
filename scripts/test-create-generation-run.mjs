import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createGenerationRun } from "./create-generation-run.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-create-run-"));
const manifest = {
  pipelineVersion: "2.9.0",
  currentVersion: "2.2.0",
  filesystemContract: {
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
  },
};

try {
  await fs.mkdir(path.join(root, "research"), { recursive: true });
  await fs.writeFile(
    path.join(root, "research", "content-standard-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const now = "2026-07-25T15:15:00.000Z";
  const production = await createGenerationRun({
    projectRoot: root,
    kind: "production",
    museum: "seattle",
    milestone: "M29",
    now,
  });
  assert.equal(production.runId, "20260725T151500Z-p2.9.0");
  const productionRoot = path.join(root, ...production.runRoot.split("/"));
  const descriptor = JSON.parse(await fs.readFile(path.join(productionRoot, "run.json"), "utf8"));
  assert.equal(descriptor.layoutVersion, 1);
  for (const required of ["research/batches", "works", "candidate", "reports"]) {
    assert.equal((await fs.stat(path.join(productionRoot, ...required.split("/")))).isDirectory(), true);
  }
  await assert.rejects(
    () =>
      createGenerationRun({
        projectRoot: root,
        kind: "production",
        museum: "seattle",
        milestone: "M29",
        now,
      }),
    /already exists/,
  );
  const regression = await createGenerationRun({
    projectRoot: root,
    kind: "regression",
    caseId: "filesystem-contract-v1",
    now: "2026-07-25T15:15:01.000Z",
  });
  assert.match(regression.runRoot, /runs\/regression\/filesystem-contract-v1/);
  const experiment = await createGenerationRun({
    projectRoot: root,
    kind: "experiment",
    caseId: "narrative-test",
    now: "2026-07-25T15:15:02.000Z",
  });
  assert.match(experiment.runRoot, /runs\/experiment\/narrative-test/);
  process.stdout.write("create generation run tests passed\n");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
