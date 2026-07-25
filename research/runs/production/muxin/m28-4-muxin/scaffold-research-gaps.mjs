import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-4", "muxin");
const pool = JSON.parse(fs.readFileSync(path.join(runRoot, "candidate-pool", "candidate-pool.json"), "utf8"));
const byId = new Map(pool.candidates.map(item => [item.candidateId, item]));
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const blockedIds = [
  "muxin-c02", "muxin-c03", "muxin-c04", "muxin-c05", "muxin-c06",
  "muxin-c07", "muxin-c08", "muxin-c09", "muxin-c10", "muxin-c16",
  "muxin-c17", "muxin-c18", "muxin-c19"
];
const batches = [blockedIds.slice(0, 7), blockedIds.slice(7)];

for (let index = 0; index < batches.length; index += 1) {
  const ids = batches[index];
  const directory = path.join(runRoot, `research-gap-${String(index + 1).padStart(2, "0")}`);
  fs.mkdirSync(directory, {recursive: true});
  const cardPaths = ids.map(id => {
    const batch = Number(id.slice(-2)) <= 10 ? "research-batch-01" : "research-batch-02";
    return `research/m28-4/muxin/${batch}/${id}-research-card.md`;
  });
  const header = {
    runId: `m28-4-muxin-research-gap-${String(index + 1).padStart(2, "0")}-2026-07-23`,
    startedAt: new Date().toISOString(),
    stage: "research_gap",
    researchMode: "targeted_gap_only",
    museumId: "muxin",
    works: ids.map(id => {
      const candidate = byId.get(id);
      return {
        museumId: "muxin",
        workId: id,
        workIdentity: {
          artistOrCulture: candidate.creator,
          title: candidate.nameZh,
          titleEn: candidate.nameEn,
          museum: "Mu Xin Art Museum"
        },
        missingDimensions: [
          "object_identity_and_group_boundary",
          "permanent_collection_or_stable_display_status",
          "reliable_object_image_and_four_direct_observations",
          "object_level_metadata",
          "nearest_comparator_and_claim_boundary"
        ]
      };
    }),
    pipelineVersion: "2.4.3",
    instructionVersion: "2.0.1",
    executionProfile: {
      model: "gpt-5.6-sol",
      reasoningEffort: "medium",
      runner: "scripts/run-isolated-generation.ps1",
      runnerSha256: sha256(path.join(root, "scripts", "run-isolated-generation.ps1"))
    },
    allowedInputs: [
      "research/generation-pipeline.md",
      "research/meowseum-content-instruction.md",
      ...cardPaths
    ].map(relative => ({path: relative, sha256: sha256(path.join(root, relative))})),
    outputs: ids.map(id => `${id}-research-supplement.md`),
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "whole_museum_candidate_no_production_write"
  };
  fs.writeFileSync(path.join(directory, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
}

console.log("scaffolded two targeted research-gap batches for 13 blocked candidates");
