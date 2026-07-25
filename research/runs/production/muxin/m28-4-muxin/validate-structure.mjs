import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync(new URL("./integration/museum-plan.json", import.meta.url)));
const evidence = JSON.parse(fs.readFileSync(new URL("./museum-selection-v3/museum-evidence.json", import.meta.url)));
const selected = evidence.works.map(work => work.workId);
const placed = plan.chapters.flatMap(chapter => chapter.workIds);
const duplicates = placed.filter((workId, index) => placed.indexOf(workId) !== index);
const missing = selected.filter(workId => !placed.includes(workId));
const extra = placed.filter(workId => !selected.includes(workId));
if (placed.length !== 20 || duplicates.length || missing.length || extra.length) {
  throw new Error(JSON.stringify({ count: placed.length, duplicates, missing, extra }));
}
console.log("museum structure passed: 20 unique chapter placements");
