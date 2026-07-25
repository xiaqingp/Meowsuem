import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";
import vm from "node:vm";
import {validateFutureMuseumContract} from "./verify-future-museum-contract.mjs";

const baseInput = {
  schemaVersion: 1,
  integration: {coordinates: [1, 2]},
  museum: {id: "futuretest"},
  publication: {dataFile: "futuretest.js"}
};
const basePublication = {
  files: [
    {destination: "futuretest.js"},
    {destination: "index.html"},
    {destination: "museum.html"}
  ],
  cachePages: []
};
const valid = {
  input: baseInput,
  dataSource: "museumData.futuretest = {works: []};",
  indexHtml: '<script src="./museums.js"></script><script src="./futuretest.js"></script><script>const museumLocations={futuretest:[1,2]};const order=["futuretest"];</script>',
  museumHtml: '<script src="./museums.js"></script><script src="./futuretest.js"></script><script src="./routes.js"></script>',
  publication: basePublication,
  runFiles: [],
  legacyMuseumIds: []
};
assert.deepEqual(validateFutureMuseumContract(valid), []);
for (const [name, fixture, expected] of [
  ["binding", {...valid, input: {...baseInput, binding: "const"}}, "binding configuration is forbidden"],
  ["order", {...valid, museumHtml: '<script src="./futuretest.js"></script><script src="./museums.js"></script><script src="./routes.js"></script>'}, "must load after museums.js"],
  ["map", {...valid, indexHtml: '<script src="./museums.js"></script><script src="./futuretest.js"></script><script>const museumLocations={};const order=["futuretest"];</script>'}, "map coordinates missing"],
  ["builder", {...valid, runFiles: ["build-candidate.mjs"]}, "museum-specific builder is forbidden"]
]) {
  const failures = validateFutureMuseumContract(fixture);
  assert(failures.some(failure => failure.includes(expected)), `${name} fixture was not rejected`);
}

const repositoryRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-future-contract-"));
const runRoot = path.join(fixtureRoot, "run");
const candidateRoot = path.join(runRoot, "candidate");
const sourceRun = path.join(repositoryRoot, "research/m28-6/vienna");
const sourceInput = JSON.parse(await fs.readFile(path.join(sourceRun, "assembly-input.json"), "utf8"));
const sourceWork = sourceInput.works[0];
const sourceWorkRoot = path.join(sourceRun, "works", sourceWork.id);
const futureInput = {
  ...sourceInput,
  integration: {coordinates: [47.6, -122.3]},
  museum: {
    ...sourceInput.museum,
    id: "futuretest",
    editorialCapacity: 1,
    zh: "未来测试馆",
    en: "Future Test Museum",
    contentFile: "./research/futuretest-content.md",
    routes: undefined
  },
  chapters: [sourceInput.chapters[0]],
  routes: Object.fromEntries(Object.entries(sourceInput.routes).map(([key, route]) => [key, {...route, workIds: [sourceWork.id]}])),
  rating: {...sourceInput.rating, rareAssets: [], score: 70, calibratedAgainst: ["legacy"]},
  works: [sourceWork],
  publication: {dataFile: "futuretest.js", cacheKey: "future-contract-test", cachePages: []}
};
delete futureInput.museum.routes;

const execute = args => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, {cwd: repositoryRoot, stdio: "inherit"});
  child.on("error", reject);
  child.on("exit", code => code === 0 ? resolve() : reject(new Error(`assembler exited ${code}`)));
});

try {
  await fs.mkdir(path.join(fixtureRoot, "research"), {recursive: true});
  await fs.mkdir(path.join(runRoot, "works", sourceWork.id), {recursive: true});
  await Promise.all([
    fs.writeFile(path.join(fixtureRoot, "research/content-standard-manifest.json"), JSON.stringify({futureMuseumContract: {legacyMuseumIds: []}})),
    fs.writeFile(path.join(fixtureRoot, "ratings.js"), 'const museumRatings = {\n  legacy: {"score":70}\n};\nfor (const rating of Object.values(museumRatings)) {\n  rating.calibratedAgainst = ["legacy"];\n}\n'),
    fs.writeFile(path.join(fixtureRoot, "routes.js"), 'const routePlans = {\n  legacy: {"90":{"workIds":[]}}\n};\nconst contentUpdatedAtByMuseum = {\n  legacy:"2026-01-01"\n};\n'),
    fs.writeFile(path.join(fixtureRoot, "index.html"), '<script src="./museums.js?v=1"></script>\n<script>const museumLocations={legacy:[0,0]};const order=["legacy"].sort(()=>0);</script>'),
    fs.writeFile(path.join(fixtureRoot, "museum.html"), '<script src="./museums.js?v=1"></script>\n<script src="./routes.js?v=1"></script>'),
    fs.writeFile(path.join(runRoot, "assembly-input.json"), JSON.stringify(futureInput)),
    ...["draft.md", "card.txt", "writing-plan.json", "mechanical-result.json"].map(file =>
      fs.copyFile(path.join(sourceWorkRoot, file), path.join(runRoot, "works", sourceWork.id, file)))
  ]);
  await execute([
    "scripts/assemble-museum-candidate.mjs",
    `--project-root=${fixtureRoot}`,
    `--run-root=${runRoot}`,
    `--candidate=${candidateRoot}`
  ]);
  const [dataSource, indexHtml, museumHtml, publication, runFiles] = await Promise.all([
    fs.readFile(path.join(candidateRoot, "futuretest.js"), "utf8"),
    fs.readFile(path.join(candidateRoot, "index.html"), "utf8"),
    fs.readFile(path.join(candidateRoot, "museum.html"), "utf8"),
    fs.readFile(path.join(candidateRoot, "publication.json"), "utf8").then(JSON.parse),
    fs.readdir(runRoot)
  ]);
  assert.deepEqual(validateFutureMuseumContract({
    input: futureInput,
    dataSource,
    indexHtml,
    museumHtml,
    publication,
    runFiles,
    legacyMuseumIds: []
  }), []);
  const runtime = {};
  vm.createContext(runtime);
  vm.runInContext(await fs.readFile(path.join(candidateRoot, "ratings.js"), "utf8"), runtime);
  vm.runInContext("globalThis.museumData={}", runtime);
  vm.runInContext(dataSource, runtime);
  vm.runInContext(await fs.readFile(path.join(candidateRoot, "routes.js"), "utf8"), runtime);
  assert.equal(runtime.museumData.futuretest.works.length, 1);
} finally {
  await fs.rm(fixtureRoot, {recursive: true, force: true});
}

console.log("future museum contract test passed: generic assembly accepted; binding, order, map and builder violations rejected");
