import fs from "node:fs/promises";
import path from "node:path";

export const fixtureRunId = "20260725T151500Z-p2.9.0";

export function fixtureManifest(overrides = {}) {
  return {
    pipelineVersion: "2.9.0",
    currentVersion: "2.2.0",
    canonicalRunner: "scripts/run-isolated-generation.ps1",
    canonicalInstruction: "research/meowseum-content-instruction.md",
    executionProfile: { researchBatchConcurrency: 2, authorConcurrency: 2 },
    modelRouting: {
      author: { model: "gpt-5.6-sol", reasoningEffort: "medium" },
      museum_scope: { model: "gpt-5.6-sol", reasoningEffort: "medium" },
      research: {
        standard: { model: "gpt-5.6-terra", reasoningEffort: "medium" },
        complex: { model: "gpt-5.6-sol", reasoningEffort: "medium" },
      },
    },
    stageInstructionViews: {
      author: ["0", "1"],
      museum_scope: ["0", "2"],
      research: ["0", "1"],
    },
    stageInputContracts: {
      research: {
        complexityValues: ["standard", "complex"],
        maxWorksPerContext: 10,
        riskFlags: ["rare_candidate"],
      },
      author: {
        version: 2,
        requiredRoles: ["content_instruction", "research_card", "work_context"],
        optionalRoles: ["research_supplement"],
        maxInputsByRole: {
          content_instruction: 1,
          research_card: 1,
          work_context: 1,
          research_supplement: 1,
        },
        maxTotalBytes: 4096,
      },
    },
    futureMuseumContract: {
      legacyMuseumIds: ["fixture"],
      museumSpecificBuilderAllowed: false,
    },
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
    museums: { fixture: { contentFile: "research/content/fixture.md" } },
    ...overrides,
  };
}

export async function writeFixtureManifest(projectRoot, overrides = {}) {
  const manifest = fixtureManifest(overrides);
  await fs.mkdir(path.join(projectRoot, "research"), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, "research", "content-standard-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

export async function writeFixtureRun({
  projectRoot,
  kind = "production",
  identity = "fixture",
  runId = fixtureRunId,
  status = "running",
}) {
  const kindRoot = kind === "production" ? "production" : kind;
  const runRoot = path.join(projectRoot, "research", "runs", kindRoot, identity, runId);
  for (const directory of [
    "scope",
    "candidate-pool",
    "image-evidence",
    "research/batches",
    "selection",
    "rating",
    "structure",
    "works",
    "candidate",
    "reports",
  ]) {
    await fs.mkdir(path.join(runRoot, ...directory.split("/")), { recursive: true });
  }
  const descriptor = {
    schemaVersion: 1,
    filesystemContractVersion: 1,
    runKind: kind,
    runId,
    ...(kind === "production" ? { museumId: identity } : { caseId: identity }),
    milestone: "M29",
    pipelineVersion: "2.9.0",
    instructionVersion: "2.2.0",
    status,
    createdAt: "2026-07-25T15:15:00.000Z",
    createdBy: "fixture",
    layoutVersion: 1,
    immutable: ["accepted", "published", "superseded"].includes(status),
  };
  await fs.writeFile(path.join(runRoot, "run.json"), `${JSON.stringify(descriptor, null, 2)}\n`);
  return { runRoot, descriptor };
}
