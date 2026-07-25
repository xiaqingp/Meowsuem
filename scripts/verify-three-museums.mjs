import fs from "node:fs/promises";
import vm from "node:vm";

const appFile = name => new URL(`../${name}`, import.meta.url);
const dataFiles = ["ratings.js", "muxin.js", "museums.js", "louvre.js", "museum-expansions.js", "vienna.js", "enoura.js", "british.js", "anchorage.js", "getty.js", "chichu.js", "egyptian.js", "alhambra.js", "smk.js", "frye.js", "routes.js"];
const sources = Object.fromEntries(await Promise.all(dataFiles.map(async name => [name, await fs.readFile(appFile(name), "utf8")])));
const context = {};
vm.createContext(context);
for (const name of dataFiles) vm.runInContext(sources[name], context, {filename:name});
vm.runInContext("globalThis.__museumData=museumData;globalThis.__museumRatings=museumRatings", context);
const museums = context.__museumData;
const ratings = context.__museumRatings;
const expectedMuseums = ["alhambra", "anchorage", "british", "chichu", "egyptian", "enoura", "frye", "getty", "glyptotek", "louvre", "met", "muxin", "seattle", "smk", "vienna"];
// The current daily M21 queue migrates in place. Completed museums and every future museum use the split contract now.
const legacyCardCopyMuseums = new Set(["anchorage", "british", "enoura", "getty", "glyptotek", "louvre", "met", "muxin", "seattle"]);
const expectedScores = {alhambra:95, anchorage:74, british:98, chichu:79, egyptian:97, enoura:78, frye:72, getty:89, glyptotek:88, louvre:98, met:98, muxin:81, seattle:75, smk:88, vienna:96};
let failed = false;

if (JSON.stringify(Object.keys(museums).sort()) !== JSON.stringify(expectedMuseums)) {
  console.error(`museum set mismatch: ${Object.keys(museums).sort().join(", ")}`);
  failed = true;
}

let chapterCount = 0;
const globalWorkUrls = new Set();
for (const [id, museum] of Object.entries(museums)) {
  const ids = new Set(museum.works.map(work => work.id));
  const required = museum.works.filter(work => !work.zh || !work.en || !work.by || !work.date || !work.place || !work.image || !work.imageSource || !work.source || !work.cardSummary || !work.significance);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(museum.contentUpdatedAt || "")) { console.error(`${id}: missing contentUpdatedAt`); failed = true; }
  const contentPath = new URL(`../${museum.contentFile.replace(/^\.\//, "")}`, import.meta.url);
  const contentMarkdown = await fs.readFile(contentPath, "utf8");
  const sectionMatches = [...contentMarkdown.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
  const quickLayers = sectionMatches.map((match, index) => {
    const body = contentMarkdown.slice(match.index + match[0].length, sectionMatches[index + 1]?.index ?? contentMarkdown.length);
    return body.match(/^###\s+30 秒先懂[^\n]*\n([\s\S]*?)(?=^###\s+)/m)?.[1]?.trim() || "";
  });
  const requiresSplitCardCopy = !legacyCardCopyMuseums.has(id);
  if (requiresSplitCardCopy && museum.cardCopyContract !== "independent-v1") { console.error(`${id}: missing independent card-copy contract`); failed = true; }
  const reusedCardCopy = requiresSplitCardCopy ? museum.works.filter((work, index) => {
    const card = (work.cardSummary || "").replace(/\s/g, "");
    const quick = (quickLayers[index] || "").replace(/\s/g, "");
    return card && quick && (card === quick || card.includes(quick) || quick.includes(card));
  }) : [];
  const commandTemplateCards = requiresSplitCardCopy ? museum.works.filter(work => /^(?:先看|再看|先找|先用|先确认|先别|首先)/.test(work.cardSummary?.trim() || "")) : [];
  const unexplainedImportant = museum.works.filter(work => ["稀世珍品", "重要藏品"].includes(work.significance) && !work.preciousWhy);
  const rareIds = new Set(museum.works.filter(work => work.significance === "稀世珍品").map(work => work.id));
  const badRareReferences = museum.rareAssets.filter(workId => !rareIds.has(workId));
  const routeIds = Object.keys(museum.routes || {}).sort();
  const availableIds = museum.works.filter(work => !work.unavailable).map(work => work.id);
  chapterCount += museum.chapters.length;
  console.log(`${id}: ${museum.works.length} works, ${museum.chapters.length} chapters, routes ${routeIds.join("/")}`);

  if (![20, 30, 40, 60].includes(museum.editorialCapacity)) { console.error(`${id}: invalid editorial capacity`); failed = true; }
  if (museum.works.length !== museum.editorialCapacity || ids.size !== museum.editorialCapacity || required.length || unexplainedImportant.length || badRareReferences.length || reusedCardCopy.length || commandTemplateCards.length) {
    console.error(`${id}: work contract failed (count ${museum.works.length}/${museum.editorialCapacity}, ids ${ids.size}, required ${required.length}, unexplained ${unexplainedImportant.length}, rare refs ${badRareReferences.length}, reused cards ${reusedCardCopy.length}, command cards ${commandTemplateCards.length})`);
    failed = true;
  }
  if (reusedCardCopy.length) console.error(`${id}: card summary reuses the published quick layer in ${reusedCardCopy.map(work => work.id).join(", ")}`);
  if (commandTemplateCards.length) console.error(`${id}: command-template card summaries remain in ${commandTemplateCards.map(work => work.id).join(", ")}`);
  if (museum.chapters.length < 5 || museum.chapters.length > 8) { console.error(`${id}: chapter count outside 5-8`); failed = true; }
  if (!museum.scoreBand || !museum.travelAction || !museum.scoreReason || !museum.withinBandReason || !museum.limitations || !Array.isArray(museum.rareAssets)) { console.error(`${id}: rating fields incomplete`); failed = true; }
  if (JSON.stringify(routeIds) !== JSON.stringify(["90", "all", "half"])) { console.error(`${id}: route set incomplete`); failed = true; }
  for (const [routeId, route] of Object.entries(museum.routes || {})) {
    const routeSet = new Set(route.workIds);
    if (!route.title || !route.note || routeSet.size !== route.workIds.length || route.workIds.some(workId => !ids.has(workId))) { console.error(`${id}/${routeId}: invalid route contract`); failed = true; }
    if (route.workIds.some(workId => museum.works.find(work => work.id === workId)?.unavailable)) { console.error(`${id}/${routeId}: unavailable work leaked into visit route`); failed = true; }
  }
  if (museum.routes["90"].workIds.some(workId => !museum.routes.half.workIds.includes(workId))) { console.error(`${id}: 90-minute route is not preserved in the half-day route`); failed = true; }
  if (museum.editorialCapacity === 60) {
    if (museum.routes.all.workIds.length > 30) { console.error(`${id}: 60-work museum single-day route exceeds 30 works`); failed = true; }
  } else if (JSON.stringify([...museum.routes.all.workIds]) !== JSON.stringify(availableIds)) { console.error(`${id}: complete route does not preserve all available works in content order`); failed = true; }
  if (museum.score >= 80 && museum.rareAssets.length === 0) { console.error(`${id}: ${museum.score} requires an evidenced rare asset`); failed = true; }
  if (museum.score >= 90 && (!museum.dedicatedTrip || museum.rareAssets.length < 2)) { console.error(`${id}: ${museum.score} requires dedicatedTrip and multiple rare assets`); failed = true; }
  if (museum.score < 90 && museum.dedicatedTrip) { console.error(`${id}: dedicatedTrip conflicts with score ${museum.score}`); failed = true; }
  for (const work of museum.works) globalWorkUrls.add(`museum.html?id=${id}&work=${work.id}`);
}

const expectedWorkUrls = Object.values(museums).reduce((sum, museum) => sum + museum.editorialCapacity, 0);
if (globalWorkUrls.size !== expectedWorkUrls) {
  console.error(`addressable content mismatch: ${chapterCount} chapters, ${globalWorkUrls.size} work URLs`);
  failed = true;
}

for (const [id, rating] of Object.entries(ratings)) {
  const compared = [...rating.calibratedAgainst].sort();
  if (JSON.stringify(compared) !== JSON.stringify(expectedMuseums) || rating.calibratedAt !== "2026-07-23") { console.error(`${id}: calibration set/date is incomplete`); failed = true; }
  if (!rating.scoreReason || !rating.withinBandReason || !rating.limitations || !rating.sources?.length) { console.error(`${id}: rating evidence incomplete`); failed = true; }
  if (rating.score !== expectedScores[id]) { console.error(`${id}: expected calibrated score ${expectedScores[id]}, found ${rating.score}`); failed = true; }
}

if (/三处场馆|奥林匹克雕塑公园/.test(ratings.seattle.scoreReason + ratings.seattle.withinBandReason + ratings.seattle.limitations)) { console.error("seattle: excluded SAM venues leaked into rating rationale"); failed = true; }

const visibleFiles = [appFile("index.html"), appFile("museum.html"), new URL("../research/louvre-content-v4.md", import.meta.url), new URL("../research/muxin-content-v1.md", import.meta.url)];
const forbidden = ["测试稿", "UI 原型", "这版内容刻意改了什么", "正式产品中应", "内容版本与核验", "当前方案", "即将开放"];
for (const file of visibleFiles) {
  const text = await fs.readFile(file, "utf8");
  for (const phrase of forbidden) if (text.includes(phrase)) { console.error(`forbidden visitor-facing phrase: ${phrase} in ${file.pathname}`); failed = true; }
}

const indexText = await fs.readFile(appFile("index.html"), "utf8");
const museumText = await fs.readFile(appFile("museum.html"), "utf8");
const appText = await fs.readFile(appFile("museum-app.js"), "utf8");
for (const [name, text] of [["index", indexText], ["museum", museumText]]) {
  for (const script of [...text.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1])) new Function(script);
  if (!text.includes("Meowseum") || /Museum —|>MUSEUM<|Museum Atlas/.test(text)) { console.error(`${name}: stale product branding remains`); failed = true; }
}

if (/id="museumView"|class="art-card"|const works\s*=|workImageCaption/.test(indexText)) {
  console.error("index: a second museum/artwork renderer remains on the map page");
  failed = true;
}
if (!indexText.includes('target.searchParams.set("id", "louvre")') || !indexText.includes("./museum.html?id=${encodeURIComponent(id)}")) {
  console.error("index: unified museum links or Louvre legacy redirect are missing");
  failed = true;
}
for (const script of ["muxin.js", "louvre.js", "museum-expansions.js", "vienna.js", "enoura.js", "british.js", "anchorage.js", "getty.js", "chichu.js", "egyptian.js", "alhambra.js", "smk.js", "frye.js", "routes.js", "museum-app.js"]) if (!museumText.includes(`src="./${script}`)) { console.error(`museum: ${script} is not loaded`); failed = true; }
if (!appText.includes("museum.html?id=${encodeURIComponent(museum.id)}&work=") || !appText.includes("museum.html?id=${encodeURIComponent(museum.id)}#")) {
  console.error("museum app: canonical chapter or artwork URL contract is missing");
  failed = true;
}
if (!appText.includes("card-summary") || !appText.includes("作品资料") || !appText.includes("imageCaption") || !museumText.includes('id="caption"')) {
  console.error("museum app: shared card or artwork caption contract is missing");
  failed = true;
}
if (!appText.includes("data-route") || !museumText.includes('id="routeButtons"') || !museumText.includes('id="routeStops"')) {
  console.error("museum app: shared route renderer is missing");
  failed = true;
}
for (const [name, text] of [["index", indexText], ["museum", museumText], ["app", appText]]) if (text.includes("它珍贵在哪里？") || text.includes('id="preciousSection"')) { console.error(`${name}: research-only preciousness field leaked into visitor UI`); failed = true; }
for (const token of ["louvre:[48.8606,2.3376]", "met:[40.7794,-73.9632]", "seattle:[47.6073,-122.3381]", "frye:[47.6071,-122.3241]", "glyptotek:[55.6726,12.5724]", "smk:[55.6889,12.5783]", "muxin:[30.7527069,120.4835269]", "vienna:[48.2038,16.3618]", "enoura:[35.203,139.141]", "british:[51.5194,-0.127]", "anchorage:[61.2165,-149.8842]", "getty:[34.078,-118.4741]", "chichu:[34.4497583,133.9858028]", "egyptian:[30.0478,31.2336]", "alhambra:[37.1761,-3.5881]"]) {
  if (!indexText.includes(token)) { console.error(`map location is missing or stale: ${token}`); failed = true; }
}
for (const band of ["90–100", "80–89", "70–79", "60–69", "60 以下"]) {
  if (!indexText.includes(band)) { console.error(`homepage rating band is missing: ${band}`); failed = true; }
}
if (/4 座城市|80 件精选藏品|class="selected-action"|class="method"/.test(indexText)) {
  console.error("homepage contains retired fixed counts or side-panel content");
  failed = true;
}

if (process.argv.includes("--images")) {
  const images = Object.values(museums).flatMap(museum => [
    {museum:museum.id, work:"hero", url:museum.hero},
    ...museum.works.map(work => ({museum:museum.id, work:work.id, url:work.image}))
  ]);
  let imageFailures = 0;
  for (const item of images) {
    try {
      const response = await fetch(item.url, {redirect:"follow", headers:{Range:"bytes=0-1023", "User-Agent":"MeowseumVerifier/1.0"}});
      const type = response.headers.get("content-type") || "";
      if (!response.ok || !type.startsWith("image/")) throw new Error(`${response.status} ${type}`);
    } catch (error) { imageFailures += 1; console.error(`image failed ${item.museum}/${item.work}: ${error.message}`); }
  }
  console.log(`images: ${images.length - imageFailures}/${images.length} load as images`);
  if (imageFailures) failed = true;
} else console.log("images: live check skipped; pass --images to run it (browser QA is preferred for lazy-loaded images)");

if (failed) process.exitCode = 1;
