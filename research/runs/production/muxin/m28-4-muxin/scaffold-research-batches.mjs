import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-4", "muxin");
const poolPath = path.join(runRoot, "candidate-pool", "candidate-pool.json");
const pool = JSON.parse(fs.readFileSync(poolPath, "utf8"));
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const canonical = [
  "research/generation-pipeline.md",
  "research/meowseum-content-instruction.md"
].map(relative => ({path: relative, sha256: sha256(path.join(root, relative))}));
const runnerHash = sha256(path.join(root, "scripts", "run-isolated-generation.ps1"));

for (let index = 0; index < 2; index += 1) {
  const candidates = pool.candidates.slice(index * 10, index * 10 + 10);
  const sourceIds = new Set(candidates.flatMap(item => item.sourceRefs ?? []));
  const packet = {
    schemaVersion: "museum-research-packet/1.0",
    museum: pool.museum,
    poolPolicy: pool.poolPolicy,
    candidates,
    sources: pool.sources.filter(source => sourceIds.has(source.sourceId))
  };
  const directory = path.join(runRoot, `research-batch-${String(index + 1).padStart(2, "0")}`);
  fs.mkdirSync(directory, {recursive: true});
  const packetPath = path.join(directory, "candidate-packet.json");
  fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  const packetRelative = path.relative(root, packetPath).replaceAll("\\", "/");
  const header = {
    runId: `m28-4-muxin-fresh-research-batch-${String(index + 1).padStart(2, "0")}-2026-07-23`,
    startedAt: new Date().toISOString(),
    stage: "research",
    researchMode: "fresh",
    museumId: "muxin",
    works: candidates.map(item => ({
      museumId: "muxin",
      workId: item.candidateId,
      workIdentity: {
        artistOrCulture: item.creator,
        title: item.nameZh,
        titleEn: item.nameEn,
        museum: "Mu Xin Art Museum"
      }
    })),
    pipelineVersion: "2.4.3",
    instructionVersion: "2.0.1",
    executionProfile: {
      model: "gpt-5.6-sol",
      reasoningEffort: "medium",
      runner: "scripts/run-isolated-generation.ps1",
      runnerSha256: runnerHash
    },
    allowedInputs: [
      ...canonical,
      {path: packetRelative, sha256: sha256(packetPath)}
    ],
    outputs: candidates.map(item => `${item.candidateId}-research-card.md`),
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "whole_museum_candidate_no_production_write"
  };
  fs.writeFileSync(path.join(directory, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
}

console.log("scaffolded two fresh-research batches of ten candidates");
