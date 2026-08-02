import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";

export function validateFutureMuseumContract({input, dataSource, indexHtml, museumHtml, publication, runFiles, legacyMuseumIds}) {
  const failures = [];
  const id = input?.museum?.id;
  if (!id || legacyMuseumIds.includes(id)) return failures;
  if (!/^[a-z][a-z0-9-]*$/.test(id)) failures.push("future museum id must be a lowercase slug");
  const allowedTopLevel = new Set(["schemaVersion", "proseTransforms", "metadataFields", "integration", "museum", "chapters", "routes", "rating", "works", "publication"]);
  for (const key of Object.keys(input)) if (!allowedTopLevel.has(key)) failures.push(`unexpected assembly field: ${key}`);
  if (JSON.stringify(input).includes('"binding"')) failures.push("binding configuration is forbidden");
  if (input.schemaVersion !== 1) failures.push("assembly schemaVersion must be 1");
  if (input.publication?.dataFile !== `${id}.js`) failures.push("future data file must be <museumId>.js");
  if (!Array.isArray(input.integration?.coordinates) || input.integration.coordinates.length !== 2 ||
      input.integration.coordinates.some(value => !Number.isFinite(value))) failures.push("future museum requires two numeric map coordinates");
  const assignment = dataSource.includes(`museumData.${id} = {`) || dataSource.includes(`museumData[${JSON.stringify(id)}] = {`);
  if (!assignment || /\bconst\s+\w*Museum\s*=/.test(dataSource)) {
    failures.push("future data must use museumData.<id> assignment");
  }

  const scripts = html => [...html.matchAll(/<script[^>]+src=["']\.\/([^"'?]+)(?:\?[^"']*)?["']/g)].map(match => match[1]);
  const indexScripts = scripts(indexHtml);
  const museumScripts = scripts(museumHtml);
  for (const [page, list] of [["index.html", indexScripts], ["museum.html", museumScripts]]) {
    const dataIndex = list.indexOf(`${id}.js`);
    const initIndex = list.indexOf("museums.js");
    if (dataIndex < 0) failures.push(`${page}: future data script missing`);
    else if (initIndex < 0 || dataIndex < initIndex) failures.push(`${page}: future data script must load after museums.js`);
    if (list.filter(file => file === `${id}.js`).length > 1) failures.push(`${page}: future data script duplicated`);
  }
  const routesIndex = museumScripts.indexOf("routes.js");
  const dataIndex = museumScripts.indexOf(`${id}.js`);
  if (dataIndex >= 0 && routesIndex >= 0 && dataIndex > routesIndex) failures.push("museum.html: future data script must load before routes.js");
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`(?:^|[,{\\s])(?:["']${escapedId}["']|${escapedId}):\\s*\\[`).test(indexHtml)) failures.push("index.html: map coordinates missing");
  const order = indexHtml.match(/const order=\[([^\]]*)\]/)?.[1] || "";
  if (!order.includes(`"${id}"`)) failures.push("index.html: ranking order registration missing");
  const destinations = new Set((publication?.files || []).map(file => file.destination));
  for (const required of [`${id}.js`, "index.html", "museum.html"]) {
    if (!destinations.has(required)) failures.push(`publication missing ${required}`);
  }
  if ((publication?.cachePages || []).length) failures.push("future publication must publish prepared HTML instead of cachePages mutation");
  if (runFiles.includes("build-candidate.mjs")) failures.push("future museum-specific builder is forbidden");
  return failures;
}

async function main() {
  const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
  const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot,
    manifest,
    runKind: argument("--kind"),
    museumId: argument("--museum"),
    caseId: argument("--case"),
    runId: argument("--run-id"),
    suppliedRunRoot: argument("--run-root"),
    writable: true
  });
  const candidateRoot = path.join(runRoot, "candidate");
  const publicationPlan = descriptor.contentContract === "one_shot_v1"
    ? JSON.parse(await fs.readFile(path.join(runRoot, "assembly", "publication-plan.json"), "utf8"))
    : null;
  const assemblyInputPath = descriptor.contentContract === "one_shot_v1"
    ? path.join(runRoot, publicationPlan.assemblyInput)
    : path.join(runRoot, "structure", "assembly-input.json");
  const [input, publication, indexHtml, museumHtml, entries] = await Promise.all([
    fs.readFile(assemblyInputPath, "utf8")
      .catch(() => fs.readFile(path.join(runRoot, "assembly-input.json"), "utf8"))
      .then(JSON.parse),
    fs.readFile(path.join(candidateRoot, "publication.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(candidateRoot, "index.html"), "utf8").catch(() => fs.readFile(path.join(projectRoot, "index.html"), "utf8")),
    fs.readFile(path.join(candidateRoot, "museum.html"), "utf8").catch(() => fs.readFile(path.join(projectRoot, "museum.html"), "utf8")),
    fs.readdir(runRoot)
  ]);
  if (descriptor.museumId && input.museum.id !== descriptor.museumId) {
    throw new Error("Filesystem contract violation: future contract museum identity drift");
  }
  const actualDataSource = await fs.readFile(path.join(candidateRoot, input.publication.dataFile), "utf8");
  const failures = validateFutureMuseumContract({
    input,
    dataSource: actualDataSource,
    indexHtml,
    museumHtml,
    publication,
    runFiles: entries,
    legacyMuseumIds: manifest.futureMuseumContract.legacyMuseumIds
  });
  if (failures.length) {
    for (const failure of failures) console.error(`- ${failure}`);
    throw new Error(`future museum contract failed: ${failures.length} issue(s)`);
  }
  console.log(`${input.museum.id}: future museum contract passed${manifest.futureMuseumContract.legacyMuseumIds.includes(input.museum.id) ? " (legacy baseline exempt)" : ""}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
