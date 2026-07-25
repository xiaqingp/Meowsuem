import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-4", "muxin");
const selectionDir = path.join(runRoot, "museum-selection-v2");
fs.mkdirSync(selectionDir, {recursive: true});
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

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

const researchCards = [];
for (let batch = 1; batch <= 2; batch += 1) {
  const directory = path.join(runRoot, `research-batch-${String(batch).padStart(2, "0")}`);
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith("-research-card.md")).sort()) {
    researchCards.push(path.relative(root, path.join(directory, name)).replaceAll("\\", "/"));
  }
}
if (researchCards.length !== 20) throw new Error(`expected 20 research cards, found ${researchCards.length}`);
const researchSupplements = [];
for (let batch = 1; batch <= 2; batch += 1) {
  const directory = path.join(runRoot, `research-gap-${String(batch).padStart(2, "0")}`);
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith("-research-supplement.md")).sort()) {
    researchSupplements.push(path.relative(root, path.join(directory, name)).replaceAll("\\", "/"));
  }
}
if (researchSupplements.length !== 13) throw new Error(`expected 13 research supplements, found ${researchSupplements.length}`);

const inputPaths = [
  "research/generation-pipeline.md",
  "research/meowseum-content-instruction.md",
  "scripts/process-museum-rating.mjs",
  path.relative(root, comparisonPath).replaceAll("\\", "/"),
  ...researchCards,
  ...researchSupplements
];
const header = {
  runId: "m28-4-muxin-museum-selection-v2-2026-07-23",
  startedAt: new Date().toISOString(),
  stage: "museum_selection",
  researchMode: "fresh_locked_research_cards",
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
  allowedInputs: inputPaths.map(relative => ({path: relative, sha256: sha256(path.join(root, relative))})),
  outputs: ["museum-evidence.json", "museum-rating.json"],
  reviewer: "disabled",
  retry: "disabled",
  publicationBoundary: "whole_museum_candidate_no_production_write"
};
fs.writeFileSync(path.join(selectionDir, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
console.log("scaffolded museum-selection-v2 with 20 research cards, 13 supplements, and 14 comparison museums");
