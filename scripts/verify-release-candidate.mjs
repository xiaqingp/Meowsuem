import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import vm from "node:vm";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import "./verify-content-pipeline.mjs";

const root = new URL("../", import.meta.url);
const appFile = name => new URL(name, root);
const baseDataFiles = ["ratings.js", "muxin.js", "museums.js", "louvre.js", "museum-expansions.js", "seattle.js", "vienna.js", "enoura.js", "british.js", "anchorage.js", "getty.js", "chichu.js", "egyptian.js", "alhambra.js", "smk.js", "frye.js", "routes.js"];
const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const runKind = argument("--kind");
if (!runKind || runKind === "production") {
  await import("./verify-significance-evidence.mjs");
} else {
  console.log(`production significance gate not applied to non-publish ${runKind} candidate; rating and run causality remain required`);
}
let candidateRoot = null;
let runMuseumId = null;
if (runKind) {
  const contractManifest = await loadManifest(projectRoot);
  const resolved = await resolveCanonicalRun({
    projectRoot,
    manifest: contractManifest,
    runKind,
    museumId: argument("--museum"),
    caseId: argument("--case"),
    runId: argument("--run-id"),
    suppliedRunRoot: argument("--run-root"),
    writable: true
  });
  runMuseumId = resolved.descriptor.museumId ?? resolved.descriptor.targetMuseumId;
  candidateRoot = pathToFileURL(`${path.join(resolved.runRoot, "candidate")}${path.sep}`);
} else if (argument("--candidate")) {
  throw new Error("Filesystem contract violation: --candidate requires canonical run identity");
}
const candidatePublication = candidateRoot
  ? await fs.readFile(new URL("publication.json", candidateRoot), "utf8").then(JSON.parse).catch(error => {
      if (error.code === "ENOENT") return null;
      throw error;
    })
  : null;
const candidateDataFiles = (candidatePublication?.files || [])
  .map(file => file.destination)
  .filter(file => file.endsWith(".js") && !baseDataFiles.includes(file));
const dataFiles = [...baseDataFiles];
dataFiles.splice(dataFiles.indexOf("routes.js"), 0, ...candidateDataFiles);
const readData = async name => {
  if (candidateRoot) {
    try { return await fs.readFile(new URL(name, candidateRoot), "utf8"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return fs.readFile(appFile(name), "utf8");
};
const context = {};
vm.createContext(context);
for (const name of dataFiles) {
  vm.runInContext(await readData(name), context, {filename:name});
}
vm.runInContext("globalThis.__museumData=museumData", context);

const museums = context.__museumData;
const failures = [];
const quiet = process.argv.includes("--quiet");
const museumArg = process.argv.find(argument => argument.startsWith("--museum="))?.slice(9) ?? runMuseumId;
const concurrencyArg = Number(process.argv.find(argument => argument.startsWith("--concurrency="))?.slice(14) || 8);
const pageUrls = new Set(["index.html"]);
const imageUrls = new Map();
const sourceUrls = new Map();
const manifest = JSON.parse(await fs.readFile(appFile("research/content-standard-manifest.json"), "utf8"));
if (museumArg && !museums[museumArg]) throw new Error(`unknown museum: ${museumArg}`);
if (!Number.isInteger(concurrencyArg) || concurrencyArg < 1 || concurrencyArg > 20) throw new Error("concurrency must be an integer from 1 to 20");

for (const [museumId, audit] of Object.entries(manifest.museums)) {
  if (museumArg && museumId !== museumArg) continue;
  if (audit.status === "pending_full_audit" || /^(?:pending|failed)/.test(audit.contentGate || "") || /^(?:pending|failed)/.test(audit.voiceVarietyGate || "")) {
    failures.push(`${museumId}: content is not releasable (${audit.status}; ${audit.contentGate || "no content gate"})`);
  }
}

function addUrl(map, url, owner) {
  if (!url) return;
  if (!map.has(url)) map.set(url, []);
  map.get(url).push(owner);
}

for (const museum of Object.values(museums)) {
  const liveInScope = !museumArg || museum.id === museumArg;
  pageUrls.add(`museum.html?id=${museum.id}`);
  for (const chapter of museum.chapters) pageUrls.add(`museum.html?id=${museum.id}#${chapter.id}`);
  for (const work of museum.works) {
    pageUrls.add(`museum.html?id=${museum.id}&work=${work.id}`);
    if (liveInScope) {
      addUrl(imageUrls, work.image, `${museum.id}/${work.id}`);
      addUrl(sourceUrls, work.source, `${museum.id}/${work.id}`);
      addUrl(sourceUrls, work.imageSource, `${museum.id}/${work.id} image`);
      for (const source of work.sources ?? []) addUrl(sourceUrls, source.url, `${museum.id}/${work.id} reference`);
    }
  }
  if (liveInScope) {
    addUrl(imageUrls, museum.hero, `${museum.id}/hero`);
    addUrl(sourceUrls, museum.official, `${museum.id}/official`);
    addUrl(sourceUrls, museum.visit, `${museum.id}/visit`);
  }
}

const candidateMuseumIds = [];
for (const name of candidateDataFiles) {
  const source = await readData(name);
  const match = source.match(/\bmuseumData\.([a-z][a-z0-9-]*)\s*=/);
  if (match) candidateMuseumIds.push(match[1]);
}
const expectedMuseumCount = Object.keys(manifest.museums).length
  + candidateMuseumIds.filter(id => !manifest.museums[id]).length;
if (Object.keys(museums).length !== expectedMuseumCount) failures.push(`expected ${expectedMuseumCount} museums, found ${Object.keys(museums).length}`);
const expectedWorks = Object.values(museums).reduce((sum, museum) => sum + museum.editorialCapacity, 0);
const actualWorks = Object.values(museums).flatMap(museum => museum.works).length;
const expectedPageUrls = 1 + Object.keys(museums).length + Object.values(museums).reduce((sum, museum) => sum + museum.chapters.length, 0) + expectedWorks;
if (actualWorks !== expectedWorks) failures.push(`expected ${expectedWorks} works, found ${actualWorks}`);
if (pageUrls.size !== expectedPageUrls) failures.push(`expected ${expectedPageUrls} unique page URLs, found ${pageUrls.size}`);

function isImage(bytes) {
  return (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
    (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") ||
    String.fromCharCode(...bytes.slice(0, 6)).startsWith("GIF8");
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function check(url, kind) {
  if (!/^https?:\/\//i.test(url)) {
    try {
      const bytes = new Uint8Array(await fs.readFile(new URL(url, candidateRoot || root)));
      if (kind === "image" && !isImage(bytes)) return "local file is not an image";
      return null;
    } catch (error) {
      return `local file ${error.code || error.message}`;
    }
  }
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 MeowseumReleaseVerifier/1.0",
          ...(kind === "image" ? {Range:"bytes=0-2047"} : {})
        },
        signal: AbortSignal.timeout(15000)
      });
      if (response.status === 429 || response.status >= 500) {
        lastError = `${response.status}`;
        await pause(800 * (attempt + 1));
        continue;
      }
      if (!response.ok) return `${response.status}`;
      if (kind === "image") {
        const type = response.headers.get("content-type") || "";
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!type.startsWith("image/") && !isImage(bytes)) return `not an image (${type || "no content-type"})`;
      }
      return null;
    } catch (error) {
      lastError = error.message;
      await pause(500 * (attempt + 1));
    }
  }
  return lastError || "request failed";
}

async function checkAll(map, kind) {
  const entries = [...map.entries()];
  const problems = [];
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrencyArg, entries.length)}, async () => {
    while (cursor < entries.length) {
      const [url, owners] = entries[cursor++];
      const error = await check(url, kind);
      if (error) problems.push({url, owners, error});
      await pause(150);
    }
  });
  await Promise.all(workers);
  return problems;
}

function isAccessBlocked(problem) {
  return problem.error === "403" || problem.error === "429";
}

console.log(`release inventory: ${Object.keys(museums).length} museums, ${Object.values(museums).flatMap(museum => museum.works).length} works, ${pageUrls.size} unique page URLs`);
console.log(`external inventory${museumArg ? ` (${museumArg})` : ""}: ${imageUrls.size} unique images, ${sourceUrls.size} unique source pages`);

if (process.argv.includes("--live")) {
  const imageProblems = await checkAll(imageUrls, "image");
  const sourceProblems = await checkAll(sourceUrls, "source");
  const blockedImages = imageProblems.filter(isAccessBlocked);
  const blockedSources = sourceProblems.filter(isAccessBlocked);
  const brokenImages = imageProblems.filter(problem => !isAccessBlocked(problem));
  const brokenSources = sourceProblems.filter(problem => !isAccessBlocked(problem));
  if (!quiet) {
    for (const problem of blockedImages) console.warn(`image access blocked ${problem.error}: ${problem.owners.join(", ")} -> ${problem.url}`);
    for (const problem of blockedSources) console.warn(`source access blocked ${problem.error}: ${problem.owners.join(", ")} -> ${problem.url}`);
  }
  for (const problem of brokenImages) console.error(`image broken ${problem.error}: ${problem.owners.join(", ")} -> ${problem.url}`);
  for (const problem of brokenSources) console.error(`source broken ${problem.error}: ${problem.owners.join(", ")} -> ${problem.url}`);
  console.log(`live images: ${imageUrls.size - imageProblems.length}/${imageUrls.size} reachable, ${blockedImages.length} host-blocked, ${brokenImages.length} broken`);
  console.log(`live sources: ${sourceUrls.size - sourceProblems.length}/${sourceUrls.size} reachable, ${blockedSources.length} host-blocked, ${brokenSources.length} broken`);
  failures.push(...brokenImages.map(problem => `image ${problem.error}: ${problem.url}`));
  failures.push(...brokenSources.map(problem => `source ${problem.error}: ${problem.url}`));
} else {
  console.log("live checks skipped; pass --live to verify external images and sources");
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`release candidate gate failed: ${failures.length} issue(s)`);
  process.exitCode = 1;
} else {
  console.log("release candidate gate passed");
}
