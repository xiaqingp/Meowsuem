import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-6", "vienna");
const selectionDir = path.join(runRoot, "museum-selection");
fs.mkdirSync(selectionDir, { recursive: true });
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relative = file => path.relative(root, file).replaceAll("\\", "/");

const ratingContext = {};
const ratingsSource = fs.readFileSync(path.join(root, "ratings.js"), "utf8");
vm.runInNewContext(`${ratingsSource}\n;globalThis.__ratings = museumRatings;`, ratingContext);
const comparisonRatings = Object.fromEntries(
  Object.entries(ratingContext.__ratings)
    .filter(([id]) => id !== "vienna")
    .map(([id, rating]) => [id, {
      score: rating.score,
      scoreBand: rating.scoreBand,
      scoreReason: rating.scoreReason,
      withinBandReason: rating.withinBandReason,
      rareAssets: rating.rareAssets,
      dedicatedTrip: rating.dedicatedTrip
    }])
);
const comparisonPath = path.join(selectionDir, "comparison-ratings.json");
fs.writeFileSync(comparisonPath, `${JSON.stringify(comparisonRatings, null, 2)}\n`, "utf8");

const researchCards = [];
for (let batch = 1; batch <= 4; batch += 1) {
  const directory = path.join(runRoot, `research-batch-${String(batch).padStart(2, "0")}`);
  const result = JSON.parse(fs.readFileSync(path.join(directory, "research-result.json"), "utf8"));
  for (const output of result.outputs) {
    const cardPath = path.join(directory, output.path);
    if (!output.path.endsWith("-research-card.md") || sha256(cardPath) !== output.sha256) {
      throw new Error(`invalid research output: ${output.path}`);
    }
    researchCards.push(relative(cardPath));
  }
}
if (researchCards.length !== 40) throw new Error(`expected 40 research cards, found ${researchCards.length}`);

const inputPaths = [
  "research/generation-pipeline.md",
  "research/meowseum-content-instruction.md",
  "scripts/process-museum-rating.mjs",
  relative(comparisonPath),
  ...researchCards
];
const header = {
  runId: "m28-6-vienna-museum-selection-2026-07-24",
  startedAt: new Date().toISOString(),
  stage: "museum_selection",
  researchMode: "fresh_locked_research_cards",
  museumId: "vienna",
  museumIdentity: {
    zh: "维也纳艺术史博物馆",
    en: "Kunsthistorisches Museum Vienna",
    location: "Maria-Theresien-Platz, Vienna, Austria"
  },
  candidateWorkIds: researchCards.map(file => path.basename(file, "-research-card.md")),
  capacityCandidate: 40,
  pipelineVersion: "2.4.8",
  instructionVersion: "2.0.2",
  executionProfile: {
    model: "gpt-5.6-sol",
    reasoningEffort: "medium",
    runner: "scripts/run-isolated-generation.ps1",
    runnerSha256: sha256(path.join(root, "scripts", "run-isolated-generation.ps1"))
  },
  allowedInputs: inputPaths.map(file => ({ path: file, sha256: sha256(path.join(root, file)) })),
  outputs: ["museum-evidence.json", "museum-rating.json"],
  reviewer: "disabled",
  retry: "disabled",
  publicationBoundary: "whole_museum_candidate_no_production_write"
};
fs.writeFileSync(path.join(selectionDir, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
console.log(`scaffolded museum selection with ${researchCards.length} locked research cards`);
