import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const SIGNIFICANCE = new Set(["稀世珍品", "重要藏品", "特色看点", "体验补充"]);
const RATING_ROLES = new Set(["independent_object", "collection_member", "whole_site", "supporting_node"]);
const AVAILABILITY = new Set(["confirmed_on_view", "collection_rotation", "previously_exhibited_current_unknown", "display_status_unknown"]);
const IMAGE_POLICIES = new Set(["object_image", "museum_hero_placeholder"]);

const bandFor = score =>
  score >= 90 ? "90–100 · 值得专程旅行" :
  score >= 80 ? "80–89 · 应主动列入行程" :
  score >= 70 ? "70–79 · 可去可不去" :
  score >= 60 ? "60–69 · 兴趣匹配再去" :
  "60 以下 · 可以略过";

const anchorFor = score =>
  score >= 100 ? "100" :
  score >= 98 ? "98–99" :
  score >= 96 ? "96–97" :
  score >= 93 ? "93–95" :
  score >= 90 ? "90–92" :
  score >= 88 ? "88–89" :
  score >= 86 ? "86–87" :
  score >= 83 ? "83–85" :
  score >= 80 ? "80–82" :
  score >= 78 ? "78–79" :
  score >= 76 ? "76–77" :
  score >= 73 ? "73–75" :
  score >= 70 ? "70–72" :
  score >= 60 ? "60–69" :
  "60 以下";

const normalizedId = value => String(value || "").split("/").pop();
const nonEmpty = value => typeof value === "string" && value.trim().length > 0;

export function validateMuseumRating(evidence, rating) {
  const failures = [];
  if (!evidence || !Array.isArray(evidence.works) || evidence.works.length === 0) failures.push("evidence: works must be a non-empty array");
  if (!rating || !Number.isInteger(rating.score) || rating.score < 0 || rating.score > 100) failures.push("rating: score must be an integer from 0 to 100");
  if (failures.length) return { ok: false, failures };
  if (evidence.museumId !== rating.museumId) failures.push("museumId mismatch");

  const works = evidence.works.map(work => ({ ...work, workId: normalizedId(work.workId), parentOrWholeWorkId: work.parentOrWholeWorkId ? normalizedId(work.parentOrWholeWorkId) : null }));
  const byId = new Map();
  for (const work of works) {
    if (!work.workId) failures.push("evidence: missing workId");
    else if (byId.has(work.workId)) failures.push(`evidence: duplicate workId ${work.workId}`);
    else byId.set(work.workId, work);
    if (!SIGNIFICANCE.has(work.significance)) failures.push(`${work.workId}: invalid significance`);
    if (!RATING_ROLES.has(work.ratingRole)) failures.push(`${work.workId}: invalid ratingRole`);
    if (work.identityStable !== true) failures.push(`${work.workId}: identityStable must be true`);
    if (!AVAILABILITY.has(work.availability)) failures.push(`${work.workId}: invalid availability`);
    if (!IMAGE_POLICIES.has(work.imagePolicy)) failures.push(`${work.workId}: invalid imagePolicy`);
    if (!Array.isArray(work.sourcePointers) || work.sourcePointers.length === 0 || work.sourcePointers.some(pointer => !nonEmpty(pointer))) failures.push(`${work.workId}: sourcePointers required`);
    const isRare = work.significance === "稀世珍品";
    if (work.rareGatePassed !== isRare) failures.push(`${work.workId}: rareGatePassed must match significance`);
    if (isRare && !nonEmpty(work.nearestComparator)) failures.push(`${work.workId}: rare work requires nearestComparator`);
    if (isRare && !nonEmpty(work.independenceKey)) failures.push(`${work.workId}: rare work requires independenceKey`);
    if (work.parentOrWholeWorkId === work.workId) failures.push(`${work.workId}: cannot parent itself`);
  }
  for (const work of works) {
    if (!work.parentOrWholeWorkId) continue;
    const parent = byId.get(work.parentOrWholeWorkId);
    if (!parent) failures.push(`${work.workId}: unknown parentOrWholeWorkId ${work.parentOrWholeWorkId}`);
    else if (work.significance === "稀世珍品" && parent.significance === "稀世珍品" && work.independenceKey !== parent.independenceKey) {
      failures.push(`${work.workId}: parent and child rare works cannot count as separate lines`);
    }
  }

  const rareWorks = works.filter(work => work.significance === "稀世珍品");
  const rareIds = [...new Set(rareWorks.map(work => work.workId))].sort();
  const rareLines = [...new Set(rareWorks.map(work => work.independenceKey))].sort();
  const declaredRareIds = [...new Set((rating.rareAssets || []).map(normalizedId))].sort();
  const declaredRareLines = [...new Set(rating.independentRareLines || [])].sort();
  if (JSON.stringify(declaredRareIds) !== JSON.stringify(rareIds)) failures.push("rating: rareAssets must exactly match evidenced rare works");
  if (JSON.stringify(declaredRareLines) !== JSON.stringify(rareLines)) failures.push("rating: independentRareLines must exactly match evidenced rare lines");
  if (rating.scoreBand !== bandFor(rating.score)) failures.push(`rating: scoreBand must be ${bandFor(rating.score)}`);
  if (rating.withinBandAnchor !== anchorFor(rating.score)) failures.push(`rating: withinBandAnchor must be ${anchorFor(rating.score)}`);
  if (!nonEmpty(rating.scoreReason) || !nonEmpty(rating.withinBandReason)) failures.push("rating: scoreReason and withinBandReason are required");
  if (rareIds.length === 0 && rating.score >= 80) failures.push("rating: zero rare works caps score at 79");
  if (rareIds.length > 0 && rating.score < 80) failures.push("rating: evidenced rare works require the 80+ band");
  if (rating.score >= 90) {
    if (rating.dedicatedTrip !== true) failures.push("rating: 90+ requires dedicatedTrip");
    const concentrationEvidence = Array.isArray(rating.worldDominantConcentrationEvidence) && rating.worldDominantConcentrationEvidence.length > 0 && rating.worldDominantConcentrationEvidence.every(nonEmpty);
    if (rating.worldDominantConcentration === true && !concentrationEvidence) failures.push("rating: world-dominant concentration requires evidence pointers");
    const concentratedException = rating.worldDominantConcentration === true && concentrationEvidence && rareIds.length >= 3 && rareLines.length >= 1;
    if (rareLines.length < 3 && !concentratedException) failures.push("rating: 90+ requires three independent rare lines or a world-dominant concentrated collection");
  } else if (rating.dedicatedTrip === true) failures.push("rating: dedicatedTrip conflicts with a score below 90");

  return {
    ok: failures.length === 0,
    failures,
    summary: {
      museumId: evidence.museumId,
      workCount: works.length,
      significanceCounts: Object.fromEntries([...SIGNIFICANCE].map(label => [label, works.filter(work => work.significance === label).length])),
      rareAssets: rareIds,
      independentRareLines: rareLines,
      score: rating.score,
      scoreBand: bandFor(rating.score),
      withinBandAnchor: anchorFor(rating.score)
    }
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      evidence: { type: "string" },
      rating: { type: "string" },
      out: { type: "string" }
    }
  });
  if (!values.evidence || !values.rating || !values.out) throw new Error("usage: node scripts/process-museum-rating.mjs --evidence <museum-evidence.json> --rating <museum-rating.json> --out <museum-rating-result.json>");
  const evidence = JSON.parse(await fs.readFile(values.evidence, "utf8"));
  const rating = JSON.parse(await fs.readFile(values.rating, "utf8"));
  const result = validateMuseumRating(evidence, rating);
  const outputPath = path.resolve(values.out);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  for (const failure of result.failures) console.error(`- ${failure}`);
  if (!result.ok) process.exitCode = 1;
  else console.log(`museum rating gate passed: ${result.summary.score} (${result.summary.withinBandAnchor}), ${result.summary.rareAssets.length} rare works, ${result.summary.independentRareLines.length} independent rare lines`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) await main();
