import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-6", "vienna");
const structureDir = path.join(runRoot, "museum-structure");
fs.mkdirSync(structureDir, { recursive: true });
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relative = file => path.relative(root, file).replaceAll("\\", "/");

const researchCards = [];
for (let batch = 1; batch <= 4; batch += 1) {
  const directory = path.join(runRoot, `research-batch-${String(batch).padStart(2, "0")}`);
  const result = JSON.parse(fs.readFileSync(path.join(directory, "research-result.json"), "utf8"));
  for (const output of result.outputs) {
    const file = path.join(directory, output.path);
    if (sha256(file) !== output.sha256) throw new Error(`research hash mismatch: ${output.path}`);
    researchCards.push(relative(file));
  }
}

const inputPaths = [
  "research/generation-pipeline.md",
  "research/meowseum-content-instruction.md",
  "coho_museum/PRD.md",
  "coho_museum/TechDesign.md",
  "research/m28-6/vienna/scope/museum-scope.json",
  "research/m28-6/vienna/museum-selection/museum-evidence.json",
  "research/m28-6/vienna/museum-selection/museum-rating.json",
  ...researchCards
];
const header = {
  runId: "m28-6-vienna-museum-structure-2026-07-24",
  startedAt: new Date().toISOString(),
  stage: "museum_structure",
  researchMode: "fresh_locked_research_cards",
  museumId: "vienna",
  museumIdentity: {
    zh: "维也纳艺术史博物馆",
    en: "Kunsthistorisches Museum Vienna",
    location: "Maria-Theresien-Platz, Vienna, Austria"
  },
  workIds: researchCards.map(file => path.basename(file, "-research-card.md")),
  pipelineVersion: "2.4.8",
  instructionVersion: "2.0.2",
  executionProfile: {
    model: "gpt-5.6-sol",
    reasoningEffort: "medium",
    runner: "scripts/run-isolated-generation.ps1",
    runnerSha256: sha256(path.join(root, "scripts", "run-isolated-generation.ps1"))
  },
  allowedInputs: inputPaths.map(file => ({ path: file, sha256: sha256(path.join(root, file)) })),
  outputs: ["museum-plan.json", "museum-copy.md"],
  reviewer: "disabled",
  retry: "disabled",
  publicationBoundary: "whole_museum_candidate_no_production_write"
};
fs.writeFileSync(path.join(structureDir, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
console.log(`scaffolded museum structure with ${researchCards.length} locked research cards`);
