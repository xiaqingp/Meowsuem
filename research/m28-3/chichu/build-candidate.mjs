import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const project = path.resolve("../../..");
const runRoot = path.resolve(".");
const candidateRoot = path.join(runRoot, "candidate");
fs.mkdirSync(candidateRoot, { recursive: true });

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(project, "ratings.js"), "utf8"), context);
vm.runInContext("globalThis.museumData={};globalThis.ratings=museumRatings", context);
vm.runInContext(fs.readFileSync(path.join(project, "chichu.js"), "utf8"), context);
vm.runInContext("globalThis.oldMuseum=museumData.chichu", context);
const oldMuseum = context.oldMuseum;

const plan = JSON.parse(fs.readFileSync(path.join(runRoot, "integration-v2/museum-plan.json"), "utf8"));
const order = plan.chapters.flatMap(chapter => chapter.workIds);
if (order.length !== 20 || new Set(order).size !== 20) throw new Error("museum plan must contain 20 unique works");

const imageOverrides = {
  "water-lily-pond-1915": {
    image: "https://upload.wikimedia.org/wikipedia/commons/7/77/Monet_Waterlilypond_1926.jpg",
    imageSource: "https://commons.wikimedia.org/wiki/File:Monet_Waterlilypond_1926.jpg"
  },
  "cluster-grass": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Monet-Water-lilies-cluster-of-grass-Chichu-museum.tif/lossy-page1-1920px-Monet-Water-lilies-cluster-of-grass-Chichu-museum.tif.jpg",
    imageSource: "https://commons.wikimedia.org/wiki/File:Monet-Water-lilies-cluster-of-grass-Chichu-museum.tif"
  },
  "water-lilies-1914": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Monet-Water-lilies-Chichu-museum.tif/lossy-page1-1280px-Monet-Water-lilies-Chichu-museum.tif.jpg",
    imageSource: "https://commons.wikimedia.org/wiki/File:Monet-Water-lilies-Chichu-museum.tif"
  },
  "water-lily-pond-1917": {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/17/The_Water_Lily_Pond_%281917-1919%29_Claude_Monet_-_Chichu_Art_Museum_%28W1896%29.jpg",
    imageSource: "https://commons.wikimedia.org/wiki/File:The_Water_Lily_Pond_(1917-1919)_Claude_Monet_-_Chichu_Art_Museum_(W1896).jpg"
  },
  "willow-reflections": {
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Nympheas%2C_reflets_de_saule_-_Water-Lilies%2C_Reflections_of_Weeping_Willows_%281916-19%29_Claude_Monet_-_Chichu_Museum_of_Art_%28W_1857%29.jpg",
    imageSource: "https://commons.wikimedia.org/wiki/File:Nympheas,_reflets_de_saule_-_Water-Lilies,_Reflections_of_Weeping_Willows_(1916-19)_Claude_Monet_-_Chichu_Museum_of_Art_(W_1857).jpg"
  }
};
const significanceValues = ["稀世珍品", "重要藏品", "特色看点", "体验补充"];
const priorityValues = ["绝对不可错过", "强烈推荐", "时间充裕再看"];
const chapterByWork = Object.fromEntries(plan.chapters.flatMap(chapter => chapter.workIds.map(id => [id, chapter.id])));
const oldById = Object.fromEntries(oldMuseum.works.map(work => [work.id, work]));
const markdownSections = [];

const works = order.map((id, index) => {
  const root = path.join(runRoot, "works", id);
  const draft = fs.readFileSync(path.join(root, "draft.md"), "utf8").trim();
  const card = fs.readFileSync(path.join(root, "card.txt"), "utf8").trim();
  const authorPlan = JSON.parse(fs.readFileSync(path.join(root, "writing-plan.json"), "utf8"));
  const title = draft.match(/^##\s+(.+?)\s*\/\s*(.+)$/m);
  if (!title) throw new Error(`missing bilingual draft heading: ${id}`);
  const body = draft
    .slice(title.index + title[0].length)
    .replace(/^\*\*再看这些容易错过的细节\*\*\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!body.startsWith("### 30 秒先懂")) throw new Error(`draft structure invalid: ${id}`);
  markdownSections.push(`## ${index + 1}. ${title[1]} / ${title[2]}\n\n${body}`);

  const metadata = authorPlan.displayMetadata;
  const significance = significanceValues.find(value => metadata.significance.startsWith(value));
  const tag = priorityValues.find(value => metadata.priority.startsWith(value));
  if (!significance || !tag) throw new Error(`metadata enum invalid: ${id}`);
  const researchCard = fs.readFileSync(authorPlan.claimLedger ? path.join(root, "run-header.json") : path.join(root, "run-header.json"), "utf8");
  const header = JSON.parse(researchCard);
  const cardPath = path.join(project, header.allowedInputs.at(-1).path);
  const sourceUrl = fs.readFileSync(cardPath, "utf8").match(/https?:\/\/[^\s)]+/)?.[0];
  const old = oldById[id];
  if (!old || !sourceUrl) throw new Error(`integration source missing: ${id}`);
  const image = imageOverrides[id] || { image: old.image, imageSource: old.imageSource };
  return {
    id,
    ch: chapterByWork[id],
    zh: title[1],
    en: title[2],
    by: metadata.by,
    date: metadata.date,
    place: metadata.place,
    tag,
    significance,
    time: metadata.stay.replace(/^建议停留\s*/, ""),
    image: image.image,
    imageSource: image.imageSource,
    imageCaption: old.imageCaption,
    source: sourceUrl,
    cardSummary: card,
    preciousWhy: card
  };
});

fs.writeFileSync(
  path.join(candidateRoot, "chichu-content-v2.md"),
  `# 地中美术馆\n\n${markdownSections.join("\n\n")}\n`
);

const museum = {
  id: "chichu",
  editorialCapacity: 20,
  city: "直岛 · 日本",
  zh: "地中美术馆",
  en: "Chichu Art Museum",
  verdict: plan.score.travelAction,
  hero: oldMuseum.hero,
  contentFile: "./research/chichu-content-v2.md",
  official: oldMuseum.official,
  visit: oldMuseum.visit,
  cardCopyContract: "independent-v1",
  intro: [plan.museumMainline.answer, plan.score.scoreReason, plan.score.limitations],
  chapters: plan.chapters.map((chapter, index) => ({
    id: chapter.id,
    number: String(index + 1).padStart(2, "0"),
    title: chapter.title,
    intro: chapter.purpose
  })),
  works
};

const js = `// Chichu Art Museum — regenerated under the isolated Meowseum pipeline.\n` +
  `museumData.chichu = {\n  ...museumRatings.chichu,\n  ...${JSON.stringify(museum, null, 2)}\n};\n`;
fs.writeFileSync(path.join(candidateRoot, "chichu.js"), js);

const routeMap = Object.fromEntries(plan.routes.map(route => [
  route.id === "90-minutes" ? "90" : route.id === "half-day" ? "half" : "all",
  { title: route.title.replace("｜", " · "), note: route.note, workIds: route.workIds }
]));
fs.writeFileSync(path.join(candidateRoot, "routes-fragment.json"), `${JSON.stringify(routeMap, null, 2)}\n`);
const rating = {
  score: plan.score.value,
  scoreBand: plan.score.band,
  shortAction: "直岛行程中优先安排",
  travelAction: plan.score.travelAction,
  scoreReason: plan.score.scoreReason,
  withinBandReason: plan.score.withinBandReason,
  limitations: plan.score.limitations,
  dedicatedTrip: plan.score.dedicatedTrip,
  rareAssets: plan.score.rareAssets,
  sources: plan.sourceLinks.map(source => source.url)
};
fs.writeFileSync(path.join(candidateRoot, "rating-fragment.json"), `${JSON.stringify(rating, null, 2)}\n`);

const ratingSource = fs.readFileSync(path.join(project, "ratings.js"), "utf8");
const candidateRatings = ratingSource
  .replace(
    /  chichu: \{[\s\S]*?\n  \},\n  getty:/,
    `  chichu: ${JSON.stringify({...rating, calibratedAgainst: [], calibratedAt: "2026-07-23"}, null, 2).replace(/^/gm, "  ").trimStart()},\n  getty:`
  )
  .replace('rating.calibratedAt = "2026-07-22";', 'rating.calibratedAt = "2026-07-23";');
if (candidateRatings === ratingSource) throw new Error("failed to replace Chichu rating");
fs.writeFileSync(path.join(candidateRoot, "ratings.js"), candidateRatings);

const routesSource = fs.readFileSync(path.join(project, "routes.js"), "utf8");
const candidateRoutes = routesSource
  .replace(
    /  chichu: \{[\s\S]*?\n  \},\n  getty:/,
    `  chichu: ${JSON.stringify(routeMap, null, 2).replace(/^/gm, "  ").trimStart()},\n  getty:`
  )
  .replace('chichu:"2026-07-22"', 'chichu:"2026-07-23"');
if (candidateRoutes === routesSource) throw new Error("failed to replace Chichu routes");
fs.writeFileSync(path.join(candidateRoot, "routes.js"), candidateRoutes);
console.log("built Chichu candidate");
