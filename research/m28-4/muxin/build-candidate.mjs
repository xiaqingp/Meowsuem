import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const runRoot = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const project = path.resolve(runRoot, "../../..");
const candidateRoot = path.join(runRoot, "candidate");
const previewRoot = path.join(candidateRoot, "preview-site");
fs.mkdirSync(path.join(previewRoot, "research"), { recursive: true });

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(project, "ratings.js"), "utf8"), context);
vm.runInContext("globalThis.museumData={};globalThis.ratings=museumRatings", context);
vm.runInContext(fs.readFileSync(path.join(project, "muxin.js"), "utf8"), context);
vm.runInContext("globalThis.oldMuseum=muxinMuseum", context);
const oldMuseum = context.oldMuseum;

const plan = JSON.parse(fs.readFileSync(path.join(runRoot, "integration/museum-plan.json"), "utf8"));
const rating = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-selection-v3/museum-rating.json"), "utf8"));
const evidence = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-selection-v3/museum-evidence.json"), "utf8"));
const order = plan.chapters.flatMap(chapter => chapter.workIds);
if (order.length !== 20 || new Set(order).size !== 20) throw new Error("museum plan must contain 20 unique works");
const evidenceById = Object.fromEntries(evidence.works.map(work => [work.workId, work]));
const placementById = Object.fromEntries(plan.workPlacement.map(work => [work.workId, work]));
const chapterById = Object.fromEntries(plan.chapters.flatMap(chapter => chapter.workIds.map(workId => [workId, chapter.chapterId])));

const articleSource = "https://www.xbiao.com/20151028/34431.html";
const hallSource = "https://www.theartjournal.cn/institutions/10399";
const images = {
  "muxin-c11": ["https://t-atl.xbiao.com/2015/1028/80331e2679b84036a20c5f8d69d9ba7c.jpg", articleSource, "《晴风》，纸本彩墨，1999年。"],
  "muxin-c12": ["https://t-atl.xbiao.com/2015/1028/a98fa8fe5b22c2043e0d6a088ca6a634.jpg", articleSource, "《生与死》，纸本彩墨，2001年。"],
  "muxin-c13": ["https://www.theartjournal.cn/wp-content/uploads/2015/11/%E3%80%8A%E5%BA%9F%E8%B0%B7%E3%80%8B%E7%BA%B8%E6%9C%AC%E5%BD%A9%E5%A2%A815.7%C3%9742.9cm2004.jpg", hallSource, "《废谷》，纸本彩墨，2004年。"],
  "muxin-c14": ["https://img.artcm.cn/5659358afa59313651810a10.jpg", "https://www.artcm.cn/customer/exhibition_detail/?exhibition_id=67", "《渔村》，纸本彩墨，20世纪70年代。"],
  "muxin-c20": [oldMuseum.hero, oldMuseum.official, "木心美术馆建筑与跨水空间。"],
  "muxin-r02": ["https://t-atl.xbiao.com/2015/1028/5cbe555236f0f8181121b4ac94930bfb.jpg", articleSource, "《四块水晶石》，纸本彩墨，1991年。"],
  "muxin-r03": ["https://t-atl.xbiao.com/2015/1028/1e5537af9183e924514078c8ec1940e6.jpg", articleSource, "《早晨》，纸本彩墨，2000年。"],
  "muxin-r04": ["https://t-atl.xbiao.com/2015/1028/9e8f4e42f71f2c2ae45036a86cead2f1.jpg", articleSource, "《战争前夜》，纸本彩墨，2001年。"],
  "muxin-r05": ["https://img.artcm.cn/565933d1fa593136539fb621.jpg", "https://artcm.cn/customer/exhibit_detail/?exhibit_id=372", "木心为自己未来画册设计的封面，纸本。"],
  "muxin-r06": ["https://www.theartjournal.cn/wp-content/uploads/2015/11/%E9%A2%98%E6%9C%AA%E5%AE%9A%EF%BC%8C%E7%BA%B8%E6%9C%AC%E5%BD%A9%E5%A2%A8%EF%BC%8C-31.4X40.5cm-70%E5%B9%B4%E4%BB%A3.jpg", hallSource, "题未定，纸本彩墨，31.4 × 40.5厘米，20世纪70年代。"]
};
const availabilityLabels = {
  collection_rotation: "馆藏轮换",
  previously_exhibited_current_unknown: "曾展出 · 当前待核验",
  display_status_unknown: "展出状态待核验",
  confirmed_on_view: ""
};
const markdownSections = [];

const works = order.map((workId, index) => {
  const workRoot = path.join(runRoot, "works", workId);
  const draft = fs.readFileSync(path.join(workRoot, "draft.md"), "utf8").trim();
  const card = fs.readFileSync(path.join(workRoot, "card.txt"), "utf8").trim();
  const authorPlan = JSON.parse(fs.readFileSync(path.join(workRoot, "writing-plan.json"), "utf8"));
  const heading = draft.match(/^##\s+(?:\d+\.\s*)?(.+?)\s+\/\s+(.+)$/m);
  if (!heading) throw new Error(`missing bilingual heading: ${workId}`);
  const body = draft.slice(heading.index + heading[0].length).trim();
  if (!body.startsWith("### 30 秒先懂")) throw new Error(`invalid draft body: ${workId}`);
  markdownSections.push(`## ${index + 1}. ${heading[1]} / ${heading[2]}\n\n${body}`);

  const metadata = authorPlan.displayMetadata;
  const selected = evidenceById[workId];
  const placement = placementById[workId];
  if (!selected || !placement) throw new Error(`missing selected metadata: ${workId}`);
  if (metadata.availability !== selected.availability || metadata.imagePolicy !== selected.imagePolicy) {
    throw new Error(`author metadata drift: ${workId}`);
  }
  const image = images[workId];
  if (selected.imagePolicy === "object_image" && !image) throw new Error(`missing required object image: ${workId}`);
  if (selected.imagePolicy === "museum_hero_placeholder" && image) throw new Error(`placeholder work has object image override: ${workId}`);
  const source = draft.match(/\]\((https?:\/\/[^)]+)\)/)?.[1] || oldMuseum.official;
  return {
    id: workId,
    ch: chapterById[workId],
    zh: heading[1],
    en: heading[2],
    by: metadata.by,
    date: metadata.date,
    place: metadata.place,
    tag: placement.priority,
    significance: placement.significance,
    availabilityTag: availabilityLabels[selected.availability],
    time: metadata.stay.replace(/^建议停留\s*/, ""),
    image: image?.[0] || null,
    imageSource: image?.[1] || oldMuseum.official,
    imageCaption: image?.[2] || "馆舍占位图，不是本作品图。",
    imageKind: image ? "work" : "museum-placeholder",
    source,
    cardSummary: card,
    preciousWhy: card
  };
});

const contentName = "muxin-content-v2.md";
fs.writeFileSync(path.join(candidateRoot, contentName), `# 木心美术馆\n\n${markdownSections.join("\n\n")}\n`, "utf8");
const museum = {
  id: "muxin",
  editorialCapacity: 20,
  city: "乌镇 · 中国",
  zh: "木心美术馆",
  en: "Mu Xin Art Museum",
  verdict: "",
  hero: oldMuseum.hero,
  contentFile: `./research/${contentName}`,
  official: oldMuseum.official,
  visit: oldMuseum.visit,
  cardCopyContract: "independent-v1",
  contentUpdatedAt: "2026-07-23",
  intro: [plan.museumMainline],
  chapters: plan.chapters.map((chapter, index) => ({
    id: chapter.chapterId,
    number: String(index + 1).padStart(2, "0"),
    title: chapter.title,
    intro: chapter.keyTakeaway
  })),
  works
};
const museumJs = `// Mu Xin Art Museum — regenerated under Meowseum pipeline 2.4.7.\n` +
  `const muxinMuseum = {\n  ...museumRatings.muxin,\n  ...${JSON.stringify(museum, null, 2)}\n};\n`;
fs.writeFileSync(path.join(candidateRoot, "muxin.js"), museumJs, "utf8");

const routes = {
  "90": {
    title: plan.routes.ninetyMinutes.title,
    note: plan.routes.ninetyMinutes.strategy,
    workIds: plan.routes.ninetyMinutes.orderedStops.map(stop => stop.workId)
  },
  half: {
    title: plan.routes.halfDay.title,
    note: plan.routes.halfDay.strategy,
    workIds: plan.routes.halfDay.orderedWorkIds
  },
  all: {
    title: plan.routes.complete.title,
    note: plan.routes.complete.strategy,
    workIds: plan.routes.complete.sessions.flatMap(session => session.orderedWorkIds)
  }
};
const ratingFragment = {
  score: rating.score,
  scoreBand: rating.scoreBand,
  shortAction: "乌镇行程中按兴趣安排",
  travelAction: "已经来到乌镇、又愿意理解木心的文学、绘画与保存史时值得安排；不建议只为本馆专程前往乌镇。",
  scoreReason: rating.scoreReason,
  withinBandReason: rating.withinBandReason,
  limitations: "除馆舍外，多数对象采取轮换或仅有既往展出记录；当天可见状态以馆方为准。",
  dedicatedTrip: false,
  rareAssets: [],
  sources: [oldMuseum.official, articleSource, hallSource]
};
fs.writeFileSync(path.join(candidateRoot, "rating-fragment.json"), `${JSON.stringify(ratingFragment, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(candidateRoot, "routes-fragment.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

const replaceBlock = (source, name, nextName, value) => {
  const pattern = new RegExp(`  ${name}: \\{[\\s\\S]*?\\r?\\n  \\},\\r?\\n  ${nextName}:`);
  const replacement = `  ${name}: ${JSON.stringify(value, null, 2).replace(/^/gm, "  ").trimStart()},\n  ${nextName}:`;
  if (!pattern.test(source)) throw new Error(`failed to find ${name} block`);
  return source.replace(pattern, replacement);
};
const ratingsSource = fs.readFileSync(path.join(project, "ratings.js"), "utf8");
fs.writeFileSync(path.join(candidateRoot, "ratings.js"), replaceBlock(ratingsSource, "muxin", "louvre", {
  ...ratingFragment,
  calibratedAgainst: [],
  calibratedAt: "2026-07-23"
}), "utf8");
const routesSource = fs.readFileSync(path.join(project, "routes.js"), "utf8");
let candidateRoutes = replaceBlock(routesSource, "muxin", "louvre", routes);
candidateRoutes = candidateRoutes.replace('muxin:"2026-07-21"', 'muxin:"2026-07-23"');
fs.writeFileSync(path.join(candidateRoot, "routes.js"), candidateRoutes, "utf8");

const siteFiles = [
  "index.html", "museum.html", "museum-app.js", "museum-expansions.js", "museums.js",
  "alhambra.js", "anchorage.js", "british.js", "chichu.js", "egyptian.js", "enoura.js",
  "frye.js", "getty.js", "glyptotek.js", "louvre.js", "met.js", "seattle.js", "smk.js", "vienna.js"
];
for (const name of siteFiles) {
  const source = path.join(project, name);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(previewRoot, name));
}
fs.copyFileSync(path.join(candidateRoot, "muxin.js"), path.join(previewRoot, "muxin.js"));
fs.copyFileSync(path.join(candidateRoot, "ratings.js"), path.join(previewRoot, "ratings.js"));
fs.copyFileSync(path.join(candidateRoot, "routes.js"), path.join(previewRoot, "routes.js"));
fs.copyFileSync(path.join(candidateRoot, contentName), path.join(previewRoot, "research", contentName));
console.log("built Mu Xin candidate preview");
