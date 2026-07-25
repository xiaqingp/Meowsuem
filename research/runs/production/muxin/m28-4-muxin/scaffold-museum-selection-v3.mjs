import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-4", "muxin");
const selectionDir = path.join(runRoot, "museum-selection-v3");
fs.mkdirSync(selectionDir, { recursive: true });
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relative = file => path.relative(root, file).replaceAll("\\", "/");

const ratingContext = {};
const ratingsSource = fs.readFileSync(path.join(root, "ratings.js"), "utf8");
vm.runInNewContext(`${ratingsSource}\n;globalThis.__ratings = museumRatings;`, ratingContext);
const comparisonRatings = Object.fromEntries(
  Object.entries(ratingContext.__ratings)
    .filter(([id]) => id !== "muxin")
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

const retainedIds = new Set([
  "muxin-c01", "muxin-c02", "muxin-c03", "muxin-c04", "muxin-c05",
  "muxin-c09", "muxin-c10", "muxin-c11", "muxin-c12", "muxin-c13",
  "muxin-c14", "muxin-c15", "muxin-c20"
]);
const originalCards = [];
for (let batch = 1; batch <= 2; batch += 1) {
  const directory = path.join(runRoot, `research-batch-${String(batch).padStart(2, "0")}`);
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith("-research-card.md")).sort()) {
    const workId = name.replace("-research-card.md", "");
    if (retainedIds.has(workId)) originalCards.push(relative(path.join(directory, name)));
  }
}
const replacementDirectory = path.join(runRoot, "replacement-research");
const replacementCards = fs.readdirSync(replacementDirectory)
  .filter(name => name.endsWith("-research-card.md"))
  .sort()
  .map(name => relative(path.join(replacementDirectory, name)));
const researchCards = [...originalCards, ...replacementCards];
if (originalCards.length !== 13 || replacementCards.length !== 7 || researchCards.length !== 20) {
  throw new Error(`expected 13 retained + 7 replacement cards, found ${originalCards.length} + ${replacementCards.length}`);
}

const researchSupplements = [];
for (let batch = 1; batch <= 2; batch += 1) {
  const directory = path.join(runRoot, `research-gap-${String(batch).padStart(2, "0")}`);
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith("-research-supplement.md")).sort()) {
    const workId = name.replace("-research-supplement.md", "");
    if (retainedIds.has(workId)) researchSupplements.push(relative(path.join(directory, name)));
  }
}

const inputPaths = [
  "research/generation-pipeline.md",
  "research/meowseum-content-instruction.md",
  "scripts/process-museum-rating.mjs",
  relative(comparisonPath),
  ...researchCards,
  ...researchSupplements
];
const header = {
  runId: "m28-4-muxin-museum-selection-v3-2026-07-23",
  startedAt: new Date().toISOString(),
  stage: "museum_selection",
  researchMode: "fresh_locked_research_cards_with_targeted_replacements",
  museumId: "muxin",
  museumIdentity: {
    zh: "木心美术馆",
    en: "Mu Xin Art Museum",
    location: "Wuzhen, Zhejiang, China"
  },
  candidateWorkIds: researchCards.map(file => path.basename(file, "-research-card.md")),
  capacityCandidate: 20,
  pipelineVersion: "2.4.6",
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
console.log(`scaffolded museum-selection-v3 with ${originalCards.length} retained cards, ${replacementCards.length} replacements, and ${researchSupplements.length} retained supplements`);
