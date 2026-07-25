import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-6", "vienna");
const candidateRoot = path.join(runRoot, "candidate");
fs.mkdirSync(candidateRoot, { recursive: true });

const plan = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-structure", "museum-plan.json"), "utf8"));
const evidence = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-selection", "museum-evidence.json"), "utf8"));
const rating = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-selection", "museum-rating.json"), "utf8"));
const evidenceById = new Map(evidence.works.map(work => [work.workId, work]));
const chapterById = Object.fromEntries(plan.chapters.flatMap(chapter => chapter.workIds.map(id => [id, chapter.chapterId])));
const order = plan.chapters.flatMap(chapter => chapter.workIds);
if (order.length !== 40 || new Set(order).size !== 40) throw new Error("museum plan must contain 40 unique works");

const context = { museumData: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "ratings.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "vienna.js"), "utf8"), context);
const oldMuseum = context.museumData.vienna;
const oldByEnglishTitle = new Map(oldMuseum.works.map(work => [work.en.toLowerCase(), work]));

const availabilityLabels = {
  confirmed_on_view: "",
  collection_rotation: "馆藏轮换",
  previously_exhibited_current_unknown: "曾展出 · 当前待核验",
  display_status_unknown: "展出状态待核验"
};
const priorityValues = ["绝对不可错过", "强烈推荐", "时间充裕再看"];
const significanceValues = ["稀世珍品", "重要藏品", "特色看点", "体验补充"];
const officialBase = "https://www.khm.at";
const buildingSource = "https://www.khm.at/en/exhibitions/the-kunsthistorisches-museum-gesamtkunstwerk";
const sourceOverrides = {
  "vienna-space-02-grand-staircase-ensemble": "https://www.khm.at/kunstwerke/theseusgruppe-theseus-besiegt-den-kentauren-1132785",
  "vienna-egy-03-babylon-lion": "https://www.khm.at/kunstwerke/wandstueck-mit-dem-relief-eines-schreitenden-loewen-376850",
  "vienna-pg-13-cardinal-albergati": "https://www.khm.at/kunstwerke/kardinal-niccol-albergati-1375-1443-680"
};
const imageOverrides = {
  "vienna-space-01-museum-building": {
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Vienna%20-%20View%20of%20Maria%20Theresien-Platz%20and%20the%20Kunsthistorisches%20Museum%20-%206291.jpg",
    imageSource: "https://commons.wikimedia.org/wiki/File:Vienna_-_View_of_Maria_Theresien-Platz_and_the_Kunsthistorisches_Museum_-_6291.jpg"
  },
  "vienna-space-02-grand-staircase-ensemble": {
    image: `${officialBase}/fileadmin/img_KHM/gebaeude/innen/KHM_Stiegenhaus_052023-3559.jpg`,
    imageSource: buildingSource
  },
  "vienna-space-03-cupola-hall": {
    image: `${officialBase}/fileadmin/img_KHM/gebaeude/innen/KHM_Kuppelhalle_AU_04.jpg`,
    imageSource: buildingSource
  },
  "vienna-egy-03-babylon-lion": {
    image: `${officialBase}/pics/376850/AEOS_SEM_951_ret_web1.jpg`,
    imageSource: sourceOverrides["vienna-egy-03-babylon-lion"]
  },
  "vienna-pg-13-cardinal-albergati": {
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jan%20van%20Eyck%2C%20%2C%20Kunsthistorisches%20Museum%20Wien%2C%20Gem%C3%A4ldegalerie%20-%20Kardinal%20Niccol%C3%B2%20Albergati%20%5E%20%281375-1443%29%20-%20GG%20975%20-%20Kunsthistorisches%20Museum.jpg",
    imageSource: "https://commons.wikimedia.org/wiki/File:Jan_van_Eyck,_,_Kunsthistorisches_Museum_Wien,_Gem%C3%A4ldegalerie_-_Kardinal_Niccol%C3%B2_Albergati_%5E_(1375-1443)_-_GG_975_-_Kunsthistorisches_Museum.jpg"
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const fetchText = async url => {
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 Meowseum/2.4.8" },
        signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      await sleep(Math.min(attempt * 750, 3000));
    }
  }
  throw lastError;
};
const ogImage = async url => {
  const html = await fetchText(url);
  const propertyFirst = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i);
  const contentFirst = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
  const value = propertyFirst?.[1] || contentFirst?.[1];
  if (!value) throw new Error(`missing OG image: ${url}`);
  return new URL(value.replaceAll("&amp;", "&"), url).href;
};
const sourceUrls = text => [...text.matchAll(/https?:\/\/[^\s)>\]]+/g)].map(match => match[0].replace(/[；;，,。]+$/, ""));
const pickOfficialSource = urls => urls.find(url => /khm\.at\/(?:en\/)?(?:artworks|object|objectdb|kunstwerke)\//i.test(url))
  || urls.find(url => /khm\.at/i.test(url))
  || null;

const workRecords = [];
for (const id of order) {
  const workRoot = path.join(runRoot, "works", id);
  const draft = fs.readFileSync(path.join(workRoot, "draft.md"), "utf8").trim();
  const card = fs.readFileSync(path.join(workRoot, "card.txt"), "utf8").trim();
  const authorPlan = JSON.parse(fs.readFileSync(path.join(workRoot, "writing-plan.json"), "utf8"));
  const header = JSON.parse(fs.readFileSync(path.join(workRoot, "run-header.json"), "utf8"));
  const researchInput = header.allowedInputs.find(input => input.role === "research_card");
  const researchCard = fs.readFileSync(path.join(root, researchInput.path), "utf8");
  const heading = draft.match(/^##\s+(?:\d+\.\s*)?(.+?)\s+\/\s+(.+)$/m);
  if (!heading) throw new Error(`missing bilingual heading: ${id}`);
  const body = draft.slice(heading.index + heading[0].length).trim();
  if (!body.startsWith("### 30 秒先懂")) throw new Error(`invalid draft body: ${id}`);

  const selected = evidenceById.get(id);
  const metadata = authorPlan.displayMetadata;
  if (metadata.availability !== selected.availability || metadata.imagePolicy !== selected.imagePolicy) {
    throw new Error(`author metadata drift: ${id}`);
  }
  const tag = priorityValues.find(value => metadata.priority.startsWith(value));
  const significance = significanceValues.find(value => metadata.significance.startsWith(value));
  if (!tag || !significance || significance !== selected.significance) throw new Error(`metadata enum drift: ${id}`);

  const source = sourceOverrides[id] || pickOfficialSource(sourceUrls(researchCard));
  if (!source) throw new Error(`missing official source: ${id}`);
  workRecords.push({
    id,
    heading,
    body,
    card,
    metadata,
    selected,
    source,
    imageInfo: imageOverrides[id]
  });
}

let imageCursor = 0;
await Promise.all(Array.from({length: 8}, async () => {
  while (imageCursor < workRecords.length) {
    const record = workRecords[imageCursor++];
    if (record.imageInfo) continue;
    try {
      record.imageInfo = {image: await ogImage(record.source), imageSource: record.source};
    } catch {
      const old = oldByEnglishTitle.get(record.heading[2].toLowerCase());
      if (!old?.image) throw new Error(`missing verified object image: ${record.id}`);
      record.imageInfo = {image: old.image, imageSource: old.imageSource};
    }
  }
}));

const markdownSections = workRecords.map((record, index) =>
  `## ${index + 1}. ${record.heading[1]} / ${record.heading[2]}\n\n${record.body}`
);
fs.writeFileSync(
  path.join(candidateRoot, "vienna-content-v2.md"),
  `# 维也纳艺术史博物馆\n\n${markdownSections.join("\n\n---\n\n")}\n`,
  "utf8"
);

const works = workRecords.map(record => ({
  id: record.id,
  ch: chapterById[record.id],
  zh: record.heading[1],
  en: record.heading[2],
  by: record.metadata.by,
  date: record.metadata.date,
  material: record.metadata.material,
  place: record.metadata.place,
  tag: priorityValues.find(value => record.metadata.priority.startsWith(value)),
  significance: record.selected.significance,
  availabilityTag: availabilityLabels[record.selected.availability],
  time: record.metadata.stay.replace(/^建议停留\s*/, ""),
  image: record.imageInfo.image,
  imageSource: record.imageInfo.imageSource,
  imageCaption: `${record.heading[1]}，${record.metadata.by}，${record.metadata.date}。`,
  imageKind: "work",
  source: record.source,
  cardSummary: record.card,
  preciousWhy: record.card
}));
const museum = {
  id: "vienna",
  editorialCapacity: 40,
  city: "维也纳 · 奥地利",
  zh: "维也纳艺术史博物馆",
  en: "Kunsthistorisches Museum Vienna",
  verdict: "",
  hero: oldMuseum.hero,
  contentFile: "./research/vienna-content-v2.md",
  official: "https://www.khm.at/en",
  visit: "https://www.khm.at/en/visit",
  cardCopyContract: "independent-v1",
  contentUpdatedAt: "2026-07-24",
  intro: [
    plan.museumNarrative.mainline,
    plan.museumNarrative.scoreLogic
  ],
  chapters: plan.chapters.map(chapter => ({
    id: chapter.chapterId,
    number: String(chapter.order).padStart(2, "0"),
    title: chapter.title,
    intro: chapter.chapterRole
  })),
  works
};
const museumJs = `// Kunsthistorisches Museum Vienna — regenerated under Meowseum pipeline 2.4.8.\n` +
  `museumData.vienna = {\n  ...museumRatings.vienna,\n  ...${JSON.stringify(museum, null, 2)}\n};\n`;
fs.writeFileSync(path.join(candidateRoot, "vienna.js"), museumJs, "utf8");

const route90 = plan.routes.find(route => route.routeId === "vienna-route-90");
const routeHalf = plan.routes.find(route => route.routeId === "vienna-route-half-day");
const routeComplete = plan.routes.find(route => route.routeId === "vienna-route-complete");
const routeMap = {
  "90": { title: route90.name.replace("｜", " · "), note: route90.strategy, workIds: route90.workIds },
  half: { title: routeHalf.name.replace("｜", " · "), note: routeHalf.strategy, workIds: routeHalf.workIds },
  all: {
    title: routeComplete.name.replace("｜", " · "),
    note: routeComplete.strategy,
    workIds: routeComplete.visits.flatMap(visit => visit.workIds)
  }
};
fs.writeFileSync(path.join(candidateRoot, "routes-fragment.json"), `${JSON.stringify(routeMap, null, 2)}\n`, "utf8");

const ratingFragment = {
  score: rating.score,
  scoreBand: rating.scoreBand,
  shortAction: "值得专程旅行",
  travelAction: plan.museum.travelAction,
  scoreReason: rating.scoreReason,
  withinBandReason: rating.withinBandReason,
  limitations: plan.museumNarrative.limitations.join(" "),
  dedicatedTrip: rating.dedicatedTrip,
  rareAssets: rating.rareAssets,
  sources: ["https://www.khm.at/en", "https://www.khm.at/en/artworks"]
};
fs.writeFileSync(path.join(candidateRoot, "rating-fragment.json"), `${JSON.stringify(ratingFragment, null, 2)}\n`, "utf8");

const replaceObject = (source, key, value) => {
  const start = source.indexOf(`  ${key}: {`);
  if (start < 0) throw new Error(`missing object block: ${key}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  let end = -1;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`unterminated object block: ${key}`);
  const formatted = JSON.stringify(value, null, 2).replace(/^/gm, "  ").trimStart();
  return `${source.slice(0, start)}  ${key}: ${formatted}${source.slice(end)}`;
};
const nextRating = replaceObject(fs.readFileSync(path.join(root, "ratings.js"), "utf8"), "vienna", {
  ...ratingFragment,
  calibratedAgainst: [],
  calibratedAt: "2026-07-24"
});
fs.writeFileSync(path.join(candidateRoot, "ratings.js"), nextRating, "utf8");
let nextRoutes = replaceObject(fs.readFileSync(path.join(root, "routes.js"), "utf8"), "vienna", routeMap);
nextRoutes = nextRoutes.replace(/vienna:"\d{4}-\d{2}-\d{2}"/, 'vienna:"2026-07-24"');
fs.writeFileSync(path.join(candidateRoot, "routes.js"), nextRoutes, "utf8");
fs.writeFileSync(
  path.join(candidateRoot, "image-manifest.json"),
  `${JSON.stringify(Object.fromEntries(workRecords.map(record => [record.id, {
    image: record.imageInfo.image,
    imageSource: record.imageInfo.imageSource,
    source: record.source
  }])), null, 2)}\n`,
  "utf8"
);

fs.writeFileSync(path.join(candidateRoot, "publication.json"), `${JSON.stringify({
  museumId: "vienna",
  cacheKey: "20260724-m28-8-vienna",
  files: [
    {source: "vienna.js", destination: "vienna.js"},
    {source: "vienna-content-v2.md", destination: "research/vienna-content-v2.md"},
    {source: "ratings.js", destination: "ratings.js"},
    {source: "routes.js", destination: "routes.js"}
  ],
  cachePages: ["index.html", "museum.html"]
}, null, 2)}\n`, "utf8");

console.log("built Vienna candidate with 40 works");
