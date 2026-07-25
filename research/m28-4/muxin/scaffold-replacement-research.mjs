import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-4", "muxin");
const directory = path.join(runRoot, "replacement-research");
fs.mkdirSync(directory, {recursive: true});
const replacementPath = path.join(runRoot, "candidate-replacement", "replacement-candidates.json");
const replacement = JSON.parse(fs.readFileSync(replacementPath, "utf8"));
const works = replacement.replacementCandidates;
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relativeReplacement = path.relative(root, replacementPath).replaceAll("\\", "/");
const header = {
  runId: "m28-4-muxin-replacement-fresh-research-2026-07-23",
  startedAt: new Date().toISOString(),
  stage: "research",
  researchMode: "fresh",
  museumId: "muxin",
  works: works.map(item => ({
    museumId: "muxin",
    workId: item.candidateId,
    replacesWorkId: item.replacesWorkId,
    workIdentity: {
      artistOrCulture: item.creator,
      title: item.nameZh,
      titleEn: item.nameEn,
      museum: "Mu Xin Art Museum"
    }
  })),
  pipelineVersion: "2.4.6",
  instructionVersion: "2.0.2",
  executionProfile: {
    model: "gpt-5.6-sol",
    reasoningEffort: "medium",
    runner: "scripts/run-isolated-generation.ps1",
    runnerSha256: sha256(path.join(root, "scripts", "run-isolated-generation.ps1"))
  },
  allowedInputs: [
    "research/generation-pipeline.md",
    "research/meowseum-content-instruction.md",
    relativeReplacement
  ].map(relative => ({path: relative, sha256: sha256(path.join(root, relative))})),
  outputs: works.map(item => `${item.candidateId}-research-card.md`),
  reviewer: "disabled",
  retry: "disabled",
  publicationBoundary: "whole_museum_candidate_no_production_write"
};
fs.writeFileSync(path.join(directory, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
console.log("scaffolded fresh research for seven replacement candidates");
