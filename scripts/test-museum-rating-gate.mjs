import { validateMuseumRating } from "./process-museum-rating.mjs";

const work = (workId, significance = "重要藏品", independenceKey = null, parentOrWholeWorkId = null) => ({
  workId,
  significance,
  rareGatePassed: significance === "稀世珍品",
  nearestComparator: significance === "稀世珍品" ? `comparator-${workId}` : null,
  independenceKey,
  parentOrWholeWorkId,
  ratingRole: parentOrWholeWorkId ? "collection_member" : "independent_object",
  identityStable: true,
  availability: "display_status_unknown",
  imagePolicy: "museum_hero_placeholder",
  sourcePointers: [`source-${workId}`]
});
const evidence = works => ({ museumId: "fixture", works });
const peak = (id, type = "work", workIds = [id]) => ({id, type, label: `peak-${id}`, workIds, sourcePointers: [`source-peak-${id}`]});
const rating = (score, rareAssets = [], independentRareLines = [], peakLines = [], extra = {}) => ({
  museumId: "fixture",
  score,
  scoreBand:
    score >= 90 ? "90–100 · 值得专程旅行" :
    score >= 80 ? "80–89 · 应主动列入行程" :
    score >= 70 ? "70–79 · 可去可不去" :
    score >= 60 ? "60–69 · 兴趣匹配再去" :
    "60 以下 · 可以略过",
  withinBandAnchor:
    score >= 90 ? "90–92" :
    score >= 88 ? "88–89" :
    score >= 86 ? "86–87" :
    score >= 83 ? "83–85" :
    score >= 80 ? "80–82" :
    score >= 78 ? "78–79" :
    score >= 76 ? "76–77" :
    score >= 73 ? "73–75" :
    score >= 70 ? "70–72" :
    score >= 60 ? "60–69" : "60 以下",
  scoreReason: "fixture score reason",
  withinBandReason: "fixture within-band reason",
  rareAssets,
  independentRareLines,
  peakLines,
  independentPeakLines: peakLines.map(item => item.id),
  dedicatedTrip: score >= 90,
  worldDominantConcentration: false,
  worldDominantConcentrationEvidence: [],
  ...extra
});

const cases = [
  ["zero peak at 79 passes", evidence([work("a")]), rating(79), true],
  ["zero peak at 80 fails", evidence([work("a")]), rating(80), false],
  ["collection peak without rare work passes at 80", evidence([work("a")]), rating(80, [], [], [peak("collection-a", "collection", ["a"])]), true],
  ["one rare at 80 passes", evidence([work("a", "稀世珍品", "line-a")]), rating(80, ["a"], ["line-a"], [peak("line-a", "work", ["a"])]), true],
  ["evidenced peak below 80 fails", evidence([work("a")]), rating(79, [], [], [peak("site-a", "site", ["a"])]), false],
  ["two peak lines at 90 fail", evidence([work("a"), work("b")]), rating(90, [], [], [peak("line-a", "collection", ["a"]), peak("line-b", "site", ["b"])]), false],
  ["three peak lines at 90 pass", evidence([work("a"), work("b"), work("c")]), rating(90, [], [], [peak("line-a", "work", ["a"]), peak("line-b", "collection", ["b"]), peak("line-c", "site", ["c"])]), true],
  ["world-dominant concentration plus another line passes", evidence([work("a"), work("b")]), rating(90, [], [], [peak("line-a", "collection", ["a"]), peak("line-b", "site", ["b"])], { worldDominantConcentration: true, worldDominantConcentrationEvidence: ["source-dominance"] }), true],
  ["world-dominant concentration without evidence fails", evidence([work("a"), work("b")]), rating(90, [], [], [peak("line-a", "collection", ["a"]), peak("line-b", "site", ["b"])], { worldDominantConcentration: true }), false],
  ["non-rare asset declaration fails", evidence([work("a")]), rating(79, ["a"], []), false],
  ["parent and child double count fails", evidence([work("a", "稀世珍品", "line-a"), work("b", "稀世珍品", "line-b", "a")]), rating(90, ["a", "b"], ["line-a", "line-b"], [peak("line-a", "work", ["a"]), peak("line-b", "work", ["b"]), peak("line-c", "site", ["a"])]), false],
  ["wrong within-band anchor fails", evidence([work("a")]), rating(79, [], [], [], { withinBandAnchor: "76–77" }), false],
  ["unstable identity fails", evidence([{...work("a"), identityStable:false}]), rating(79), false],
  ["uncertain display with placeholder passes", evidence([work("a")]), rating(79), true],
  ["invalid image policy fails", evidence([{...work("a"), imagePolicy:"missing"}]), rating(79), false],
  ["peak references missing work fails", evidence([work("a")]), rating(80, [], [], [peak("line-a", "collection", ["missing"])]), false],
  ["independent peak declaration drift fails", evidence([work("a")]), rating(80, [], [], [peak("line-a", "collection", ["a"])], {independentPeakLines: []}), false]
];

let failed = 0;
for (const [name, evidenceFixture, ratingFixture, expected] of cases) {
  const result = validateMuseumRating(evidenceFixture, ratingFixture);
  if (result.ok !== expected) {
    failed += 1;
    console.error(`- ${name}: expected ${expected ? "pass" : "fail"}, got ${result.ok ? "pass" : "fail"} (${result.failures.join("; ")})`);
  }
}
if (failed) process.exitCode = 1;
else console.log(`museum rating gate self-test passed: ${cases.length}/${cases.length} fixtures`);
