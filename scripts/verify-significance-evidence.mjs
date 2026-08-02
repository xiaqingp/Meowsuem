import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import vm from "node:vm";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {museumDataFiles} from "./lib/museum-data-files.mjs";

const root = new URL("../", import.meta.url);
const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const baseDataFiles = await museumDataFiles(projectRoot);
let candidateRoot = null;
if (argument("--kind")) {
  const contractManifest = await loadManifest(projectRoot);
  const resolved = await resolveCanonicalRun({
    projectRoot,
    manifest: contractManifest,
    runKind: argument("--kind"),
    museumId: argument("--museum"),
    caseId: argument("--case"),
    runId: argument("--run-id"),
    suppliedRunRoot: argument("--run-root"),
    writable: true
  });
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
  return fs.readFile(new URL(name, root), "utf8");
};
const context = {};
vm.createContext(context);
for (const file of dataFiles) vm.runInContext(await readData(file), context, {filename:file});
vm.runInContext("globalThis.__museumData=museumData", context);

const museums = context.__museumData;
const audit = JSON.parse(await fs.readFile(new URL("research/significance-evidence-v1.6.0.json", root), "utf8"));
const records = new Map();
const failures = [];
const required = ["comparisonClass", "closestComparator", "decisiveDifference", "irreplaceability", "evidenceBoundary"];
const museumArg = process.argv.find(arg => arg.startsWith("--museum="))?.split("=")[1];
const workArg = process.argv.find(arg => arg.startsWith("--work="))?.split("=")[1];
if (museumArg && !museums[museumArg]) throw new Error(`unknown museum: ${museumArg}`);
if (workArg && !/^[^/]+\/[^/]+$/.test(workArg)) throw new Error("work must be museumId/workId");
const inScope = key => (!museumArg || key.startsWith(`${museumArg}/`)) && (!workArg || key === workArg);

for (const record of audit.records || []) {
  const key = `${record.museumId}/${record.workId}`;
  if (records.has(key)) failures.push(`${key}: duplicate audit record`);
  records.set(key, record);
  if (!inScope(key)) continue;
  const work = museums[record.museumId]?.works.find(item => item.id === record.workId);
  if (!work) { failures.push(`${key}: unknown work`); continue; }
  if (!["pending", "retain", "downgrade"].includes(record.decision)) failures.push(`${key}: invalid decision`);
  if (record.decision === "retain") for (const field of required) if (!record[field]?.trim()) failures.push(`${key}: missing ${field}`);
  if (record.decision === "downgrade" && !record.reason?.trim()) failures.push(`${key}: missing downgrade reason`);
  if (record.decision !== "pending" && (!record.sources?.length || record.sources.some(url => !/^https?:\/\//.test(url)))) failures.push(`${key}: missing valid sources`);
  if (record.decision === "retain" && work.significance !== "稀世珍品") failures.push(`${key}: retain decision does not match current label`);
  if (record.decision === "downgrade" && work.significance === "稀世珍品") failures.push(`${key}: downgrade decision still labelled rare`);
  if (record.decision === "downgrade" && museums[record.museumId].rareAssets.includes(record.workId)) failures.push(`${key}: downgraded work remains in rareAssets`);
}

let rareCount = 0;
for (const [museumId, museum] of Object.entries(museums).filter(([id]) => !museumArg || id === museumArg)) {
  for (const work of museum.works.filter(item => item.significance === "稀世珍品" && inScope(`${museumId}/${item.id}`))) {
    rareCount += 1;
    const record = records.get(`${museumId}/${work.id}`);
    if (!record) failures.push(`${museumId}/${work.id}: current rare work has no audit record`);
  }
  for (const workId of museum.rareAssets.filter(workId => inScope(`${museumId}/${workId}`))) {
    const record = records.get(`${museumId}/${workId}`);
    if (!record) failures.push(`${museumId}/${workId}: rating asset has no audit record`);
    else if (record.decision === "downgrade") failures.push(`${museumId}/${workId}: downgraded work remains a rating asset`);
  }
}

const scopedRecords = [...records.values()].filter(record => inScope(`${record.museumId}/${record.workId}`));
for (const record of scopedRecords.filter(item => item.decision === "pending")) {
  const museum = museums[record.museumId];
  const work = museum?.works.find(item => item.id === record.workId);
  if (work?.significance === "稀世珍品" || museum?.rareAssets.includes(record.workId)) {
    failures.push(`${record.museumId}/${record.workId}: significance audit pending`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`significance gate failed: ${rareCount} current rare works, ${scopedRecords.length} audit records, ${failures.length} failures`);
  process.exit(1);
}
console.log(`significance gate passed: ${rareCount} rare works retained, ${scopedRecords.filter(record => record.decision === "downgrade").length} downgraded, ${scopedRecords.length} audited`);
