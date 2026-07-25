import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const cases = [
  {id: "vienna", run: "research/m28-6/vienna", candidate: "research/m28-6/vienna/candidate-m28-9", count: 40},
  {id: "chichu", run: "research/m28-3/chichu", candidate: "research/m28-3/chichu/candidate-m28-9", count: 20}
];
const execute = args => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, {cwd: root, stdio: "inherit"});
  child.on("error", reject);
  child.on("exit", code => code === 0 ? resolve() : reject(new Error(`assembler exited ${code}`)));
});
const firstDiff = (left, right, trail = "") => {
  if (JSON.stringify(left) === JSON.stringify(right)) return "";
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return `${trail}: ${JSON.stringify(left)} != ${JSON.stringify(right)}`;
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const found = firstDiff(left[key], right[key], `${trail}.${key}`);
    if (found) return found;
  }
  return trail;
};

for (const test of cases) {
  await execute([
    "scripts/assemble-museum-candidate.mjs",
    `--run-root=${test.run}`,
    `--candidate=${test.candidate}`
  ]);
  const loadMuseum = async candidate => {
    const context = {};
    vm.createContext(context);
    vm.runInContext(await fs.readFile(path.join(root, candidate || "", "ratings.js"), "utf8"), context);
    vm.runInContext("globalThis.museumData={}", context);
    vm.runInContext(await fs.readFile(path.join(root, candidate || "", `${test.id}.js`), "utf8"), context);
    vm.runInContext(await fs.readFile(path.join(root, candidate || "", "routes.js"), "utf8"), context);
    vm.runInContext(`globalThis.__museum=museumData.${test.id}`, context);
    return JSON.parse(JSON.stringify(context.__museum));
  };
  const [museum, production] = await Promise.all([loadMuseum(test.candidate), loadMuseum("")]);
  if (museum.works.length !== test.count) throw new Error(`${test.id}: wrong work count`);
  if (new Set(museum.works.map(work => work.id)).size !== test.count) throw new Error(`${test.id}: duplicate work ids`);
  try { assert.deepStrictEqual(museum, production); }
  catch { throw new Error(`${test.id}: candidate is not semantically equal to production (${firstDiff(museum, production)})`); }
  const reportText = await fs.readFile(path.join(root, test.candidate, path.basename(museum.contentFile)), "utf8");
  if ((reportText.match(/^##\s+\d+\./gm) || []).length !== test.count) throw new Error(`${test.id}: wrong content count`);
  const productionText = await fs.readFile(path.join(root, museum.contentFile.replace(/^\.\//, "")), "utf8");
  const normalize = text => text.replace(/\n+---\n+/g, "\n\n").replace(/\r\n/g, "\n").trim();
  if (normalize(reportText) !== normalize(productionText)) throw new Error(`${test.id}: candidate prose changed`);
}
console.log("generic assembler test passed: Vienna 40 and Chichu 20");
