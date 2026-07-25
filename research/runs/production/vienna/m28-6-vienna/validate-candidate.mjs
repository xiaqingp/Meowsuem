import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-6", "vienna");
const candidateRoot = path.join(runRoot, "candidate");
const production = process.argv.includes("--production");
const dataRoot = production ? root : candidateRoot;
const plan = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-structure", "museum-plan.json"), "utf8"));
const rating = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-selection", "museum-rating.json"), "utf8"));
const expectedIds = plan.chapters.flatMap(chapter => chapter.workIds);

const context = { museumData: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(dataRoot, "ratings.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(dataRoot, "vienna.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(dataRoot, "routes.js"), "utf8"), context);
vm.runInContext("globalThis.__routePlans = routePlans", context);

const museum = context.museumData.vienna;
const failures = [];
const ids = museum.works.map(work => work.id);
if (museum.score !== rating.score || museum.score !== 96) failures.push(`score mismatch: ${museum.score}`);
if (museum.editorialCapacity !== 40 || museum.works.length !== 40) failures.push(`work count mismatch: ${museum.works.length}`);
if (new Set(ids).size !== 40) failures.push("work IDs are not unique");
if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) failures.push("work order differs from sealed museum plan");
if (museum.chapters.length !== plan.chapters.length) failures.push("chapter count mismatch");
for (const id of expectedIds) {
  const work = museum.works.find(item => item.id === id);
  if (!work) {
    failures.push(`missing work: ${id}`);
    continue;
  }
  for (const field of ["zh", "en", "by", "date", "material", "place", "tag", "significance", "time", "image", "imageSource", "source", "cardSummary"]) {
    if (!String(work[field] || "").trim()) failures.push(`${id}: missing ${field}`);
  }
}

const markdown = fs.readFileSync(production
  ? path.join(root, "research", "vienna-content-v2.md")
  : path.join(candidateRoot, "vienna-content-v2.md"), "utf8");
const headings = [...markdown.matchAll(/^##\s+\d+\.\s+(.+?)\s+\/\s+(.+)$/gm)];
if (headings.length !== 40) failures.push(`markdown heading count mismatch: ${headings.length}`);
const quickReads = [...markdown.matchAll(/^### 30 秒先懂$/gm)].length;
if (quickReads !== 40) failures.push(`30-second section count mismatch: ${quickReads}`);
const details = [...markdown.matchAll(/^### 多停几分钟，你会看到什么$/gm)].length;
if (details !== 40) failures.push(`detail section count mismatch: ${details}`);

for (const [key, route] of Object.entries(context.__routePlans.vienna)) {
  const routeIds = route.workIds || [];
  if (!routeIds.length) failures.push(`empty route: ${key}`);
  for (const id of routeIds) if (!ids.includes(id)) failures.push(`${key}: unknown work ${id}`);
}

const forbidden = [
  /这版内容刻意改了什么/,
  /(?:pipeline|prompt|reviewer|研究卡|生成指令)/i,
  /\*\*二、国家怎样把当代事件变成历史\*\*/
];
for (const pattern of forbidden) if (pattern.test(markdown)) failures.push(`internal/editorial text leaked: ${pattern}`);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Vienna ${production ? "production" : "candidate"} gate passed: ${museum.works.length} works, ${museum.chapters.length} chapters, ${Object.keys(context.__routePlans.vienna).length} routes, score ${museum.score}`);
}
