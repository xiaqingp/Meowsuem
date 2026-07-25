import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fixtureManifest } from "./lib/test-filesystem-fixture.mjs";
import { verifyProjectAuthority } from "./verify-project-authority.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-authority-"));
const write = async (relative, text = "") => {
  const target = path.join(root, ...relative.split("/"));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, text);
};
try {
  const canonical = {
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
    canonicalFilesystemContract: "scripts/lib/filesystem-contract.mjs",
    canonicalRunCreator: "scripts/create-generation-run.mjs",
    canonicalRunValidator: "scripts/validate-run-directory.mjs",
    canonicalFilesystemMigration: "scripts/migrate-filesystem-contract-v1.mjs",
  };
  const manifest = fixtureManifest({
    ...canonical,
    currentRelease: "research/pipeline/releases/v2.9.0.json",
    activePipelineChange: "research/pipeline/changes/PCR-test.json",
    releaseStatus: "active",
  });
  await write("research/content-standard-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  for (const file of [
    "research/README.md",
    "research/generation-pipeline.md",
    "research/meowseum-content-instruction.md",
    "research/significance-evidence-v1.6.0.json",
    "research/user-taste-profile.md",
    "research/content/fixture.md",
    "coho_museum/PRD.md",
    "coho_museum/TechDesign.md",
  ]) {
    await write(file);
  }
  await write(
    "research/pipeline/changes/PCR-test.json",
    '{"status":"owner_approved","authorizedBy":"owner","ownerInstruction":"fixture","targetVersion":"2.9.0"}',
  );
  await write("fixture.js", 'museumData.fixture={contentFile:"./research/content/fixture.md"};');
  for (const file of new Set([...Object.values(canonical), "scripts/migrate-filesystem-contract-v1.mjs"])) {
    await write(file, "// canonical fixture\n");
  }
  await write("scripts/legacy/old.mjs", "// NON-CANONICAL LEGACY SCRIPT\n");

  let result = await verifyProjectAuthority({ projectRoot: root, checkRelease: false });
  assert.deepEqual(result.failures, []);

  await write("fixture.js", 'museumData.fixture={contentFile:"./research/archive/content/fixture.md"};');
  result = await verifyProjectAuthority({ projectRoot: root, checkRelease: false });
  assert(result.failures.some((failure) => failure.includes("archived content")));
  await write("fixture.js", 'museumData.fixture={contentFile:"./research/content/fixture.md"};');

  await write("scripts/assemble-museum-candidate.mjs", 'import "./legacy/old.mjs";\n');
  result = await verifyProjectAuthority({ projectRoot: root, checkRelease: false });
  assert(result.failures.some((failure) => failure.includes("imports legacy")));
  process.stdout.write("project authority contract tests passed\n");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
