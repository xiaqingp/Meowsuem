import fs from "node:fs/promises";
import path from "node:path";
import {
  assertPathInside,
  assertSafeIdentifier,
  loadManifest,
  projectRelative,
  resolveCanonicalRun,
} from "./lib/filesystem-contract.mjs";

const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const manifest = await loadManifest(projectRoot);
const runKind = argument("--kind");
const runId = argument("--run-id");
if (!runKind || !runId) throw new Error("--kind and --run-id are required");
if (argument("--run-root")) {
  process.stderr.write("DEPRECATION: --run-root is accepted only when it exactly matches the contract path.\n");
}
const {runRoot, descriptor} = await resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind,
  museumId: argument("--museum"),
  caseId: argument("--case"),
  runId,
  suppliedRunRoot: argument("--run-root"),
  writable: true
});
if (runKind !== "production" && !(runKind === "regression" && process.argv.includes("--dry-run"))) {
  throw new Error("Filesystem contract violation: assembly requires production or regression --dry-run");
}
const candidateRoot = path.join(runRoot, "candidate");
if (argument("--candidate")) {
  const suppliedCandidate = path.resolve(projectRoot, argument("--candidate"));
  if (suppliedCandidate !== candidateRoot) {
    throw new Error(`Filesystem contract violation: --candidate must exactly equal ${projectRelative(projectRoot, candidateRoot)}`);
  }
  process.stderr.write("DEPRECATION: --candidate is fixed by the filesystem contract.\n");
}
await assertPathInside(runRoot, candidateRoot);

const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
const input = await readJson(path.join(runRoot, "structure", "assembly-input.json"));
assertSafeIdentifier(input.museum?.id, "museum id");
if (descriptor.museumId && input.museum.id !== descriptor.museumId) {
  throw new Error("Filesystem contract violation: assembly museum identity does not match run.json");
}
const expectedContentFile = `research/content/${input.museum.id}.md`;
if (input.museum.contentFile !== expectedContentFile) {
  throw new Error(`Filesystem contract violation: active content must be ${expectedContentFile}`);
}
const isFutureMuseum = !manifest.futureMuseumContract.legacyMuseumIds.includes(input.museum?.id);
if (input.schemaVersion !== 1) throw new Error("assembly input schemaVersion must be 1");
if (!/^[a-z][a-z0-9-]*$/.test(input.museum?.id || "")) throw new Error("invalid museum id");
if (isFutureMuseum && !/^[a-z][a-z0-9]*$/.test(input.museum.id)) {
  throw new Error("future museum id must be a lowercase JavaScript identifier");
}
if (!Array.isArray(input.chapters) || !Array.isArray(input.works) || !input.works.length) throw new Error("assembly input is incomplete");
if (input.museum.editorialCapacity !== input.works.length) throw new Error("editorial capacity does not match work records");
if (JSON.stringify(input).includes('"binding"')) throw new Error("binding configuration is forbidden");
if (isFutureMuseum && (!Array.isArray(input.integration?.coordinates) || input.integration.coordinates.length !== 2)) {
  throw new Error("future museum requires map coordinates");
}

const priorities = ["绝对不可错过", "强烈推荐", "时间充裕再看"];
const significances = ["稀世珍品", "重要藏品", "特色看点", "体验补充"];
const chapterIds = new Set(input.chapters.map(chapter => chapter.id));
const usesAvailabilityTags = input.works.some(work => "availabilityTag" in work);
const seen = new Set();
const markdown = [];
const works = [];
const localAssets = [];

for (const [index, record] of input.works.entries()) {
  if (!record.id || seen.has(record.id)) throw new Error(`duplicate or missing work id: ${record.id || index}`);
  if (!chapterIds.has(record.ch)) throw new Error(`unknown chapter for ${record.id}: ${record.ch}`);
  seen.add(record.id);
  const workRoot = path.join(runRoot, "works", record.id);
  const [draft, card, writingPlan, mechanical] = await Promise.all([
    fs.readFile(path.join(workRoot, "author", "draft.md"), "utf8"),
    fs.readFile(path.join(workRoot, "author", "card.txt"), "utf8"),
    readJson(path.join(workRoot, "author", "writing-plan.json")),
    readJson(path.join(workRoot, "mechanical", "mechanical-result.json"))
  ]);
  if (mechanical.status !== "passed" && mechanical.result !== "passed" && mechanical.blockers?.length) {
    throw new Error(`mechanical gate did not pass: ${record.id}`);
  }
  const heading = draft.match(/^##\s+(?:\d+\.\s*)?(.+?)\s+\/\s+(.+)$/m);
  if (!heading) throw new Error(`missing bilingual heading: ${record.id}`);
  let body = draft.slice(heading.index + heading[0].length);
  if (input.proseTransforms?.removeLegacyDetailHeading) {
    body = body.replace(/^\*\*再看这些容易错过的细节\*\*\s*$/gm, "");
  }
  body = body.replace(/\n{3,}/g, "\n\n").trim();
  if (!body.startsWith("### 30 秒先懂")) throw new Error(`invalid draft body: ${record.id}`);
  const metadata = writingPlan.displayMetadata;
  const tag = priorities.find(value => metadata.priority?.startsWith(value));
  const significance = significances.find(value => metadata.significance?.startsWith(value));
  if (!tag || !significance || significance !== record.significance) throw new Error(`metadata drift: ${record.id}`);
  for (const field of ["image", "imageSource", "source"]) {
    if (!record[field]) throw new Error(`missing ${field}: ${record.id}`);
  }
  if (record.localAssetSource) {
    const source = path.resolve(projectRoot, record.localAssetSource);
    await assertPathInside(runRoot, source, {allowEqual: false});
    const destinationRelative = record.image.replace(/^\.\//, "");
    const destination = path.resolve(candidateRoot, destinationRelative);
    await assertPathInside(candidateRoot, destination, {allowEqual: false});
    localAssets.push({source, destination, relative: destinationRelative});
  }
  markdown.push(`## ${index + 1}. ${heading[1]} / ${heading[2]}\n\n${body}`);
  works.push({
    id: record.id,
    ch: record.ch,
    zh: heading[1],
    en: heading[2],
    by: metadata.by,
    date: metadata.date,
    ...(input.metadataFields?.includeMaterial !== false && metadata.material ? {material: metadata.material} : {}),
    place: metadata.place,
    tag,
    significance,
    ...(usesAvailabilityTags ? {availabilityTag: record.availabilityTag || ""} : {}),
    time: metadata.stay.replace(/^建议停留\s*/, ""),
    image: record.image,
    imageSource: record.imageSource,
    imageCaption: record.imageCaption,
    ...(record.imageKind ? {imageKind: record.imageKind} : {}),
    source: record.source,
    cardSummary: card.trim(),
    preciousWhy: card.trim()
  });
}

await fs.mkdir(candidateRoot, {recursive: true});
for (const asset of localAssets) {
  await fs.mkdir(path.dirname(asset.destination), {recursive: true});
  await fs.copyFile(asset.source, asset.destination);
}
const contentName = path.basename(input.museum.contentFile);
await fs.writeFile(path.join(candidateRoot, contentName), `# ${input.museum.zh}\n\n${markdown.join("\n\n---\n\n")}\n`, "utf8");

const museum = {
  ...input.museum,
  cardCopyContract: input.museum.cardCopyContract || "independent-v1",
  chapters: input.chapters,
  works
};
const dataName = input.publication.dataFile;
await fs.writeFile(
  path.join(candidateRoot, dataName),
  `// ${input.museum.en} — assembled by the deterministic Meowseum pipeline.\n` +
    `museumData.${input.museum.id} = {\n  ...museumRatings.${input.museum.id},\n  ...${JSON.stringify(museum, null, 2)}\n};\n`,
  "utf8"
);

const replaceObject = (source, key, value) => {
  const start = source.indexOf(`  ${key}: {`);
  if (start < 0) throw new Error(`missing object block: ${key}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = brace; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
    } else if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      const formatted = JSON.stringify(value, null, 2).replace(/^/gm, "  ").trimStart();
      return `${source.slice(0, start)}  ${key}: ${formatted}${source.slice(index + 1)}`;
    }
  }
  throw new Error(`unterminated object block: ${key}`);
};
const insertObject = (source, container, key, value) => {
  const marker = `const ${container} = {`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`missing object container: ${container}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = brace; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
    } else if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      const prefix = source.slice(0, index).trimEnd();
      const formatted = JSON.stringify(value, null, 2).replace(/^/gm, "  ").trimStart();
      return `${prefix},\n  ${key}: ${formatted}\n${source.slice(index)}`;
    }
  }
  throw new Error(`unterminated object container: ${container}`);
};
const upsertObject = (source, container, key, value) =>
  source.includes(`  ${key}: {`) ? replaceObject(source, key, value) : insertObject(source, container, key, value);

const ratingsSource = await fs.readFile(path.join(projectRoot, "ratings.js"), "utf8");
let nextRatings = upsertObject(ratingsSource, "museumRatings", input.museum.id, input.rating);
if (isFutureMuseum) {
  nextRatings = nextRatings.replace(/rating\.calibratedAgainst = (\[[^\]]*\]);/, (_, json) => {
    const ids = JSON.parse(json);
    if (!ids.includes(input.museum.id)) ids.push(input.museum.id);
    return `rating.calibratedAgainst = ${JSON.stringify(ids)};`;
  });
}
await fs.writeFile(path.join(candidateRoot, "ratings.js"), nextRatings, "utf8");
let routesSource = await fs.readFile(path.join(projectRoot, "routes.js"), "utf8");
routesSource = upsertObject(routesSource, "routePlans", input.museum.id, input.routes);
if (new RegExp(`${input.museum.id}:"\\d{4}-\\d{2}-\\d{2}"`).test(routesSource)) {
  routesSource = routesSource.replace(
    new RegExp(`${input.museum.id}:"\\d{4}-\\d{2}-\\d{2}"`),
    `${input.museum.id}:"${input.museum.contentUpdatedAt}"`
  );
} else {
  routesSource = routesSource.replace(
    /(const contentUpdatedAtByMuseum = \{[\s\S]*?)(\n\};)/,
    `$1,\n  ${input.museum.id}:"${input.museum.contentUpdatedAt}"$2`
  );
}
await fs.writeFile(path.join(candidateRoot, "routes.js"), routesSource, "utf8");
await fs.writeFile(path.join(candidateRoot, "rating-fragment.json"), `${JSON.stringify(input.rating, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(candidateRoot, "routes-fragment.json"), `${JSON.stringify(input.routes, null, 2)}\n`, "utf8");
await fs.writeFile(
  path.join(candidateRoot, "image-manifest.json"),
  `${JSON.stringify(Object.fromEntries(input.works.map(work => [work.id, {
    image: work.image,
    imageSource: work.imageSource,
    source: work.source
  }])), null, 2)}\n`,
  "utf8"
);
const publicationFiles = [
  {source: dataName, destination: dataName},
  {source: contentName, destination: input.museum.contentFile.replace(/^\.\//, "")},
  {source: "ratings.js", destination: "ratings.js"},
  {source: "routes.js", destination: "routes.js"},
  ...localAssets.map(asset => ({source: asset.relative, destination: asset.relative}))
];
if (isFutureMuseum) {
  const insertScript = html => {
    if (new RegExp(`src=["']\\./${dataName}(?:\\?[^"']*)?["']`).test(html)) return html;
    return html.replace(
      /(^\s*<script src=["']\.\/museums\.js[^>]*><\/script>)/m,
      `$1\n  <script src="./${dataName}?v=${input.publication.cacheKey}"></script>`
    );
  };
  let indexHtml = insertScript(await fs.readFile(path.join(projectRoot, "index.html"), "utf8"));
  const [latitude, longitude] = input.integration.coordinates;
  indexHtml = indexHtml.replace(
    /(const museumLocations=\{)([^}]*)(\};)/,
    (_, open, entries, close) => `${open}${entries}${entries.trim() ? "," : ""}${input.museum.id}:[${latitude},${longitude}]${close}`
  );
  indexHtml = indexHtml.replace(
    /(const order=\[)([^\]]*)(\]\.sort)/,
    (_, open, entries, close) => `${open}${entries}${entries.trim() ? "," : ""}"${input.museum.id}"${close}`
  );
  const museumHtml = insertScript(await fs.readFile(path.join(projectRoot, "museum.html"), "utf8"));
  await fs.writeFile(path.join(candidateRoot, "index.html"), indexHtml, "utf8");
  await fs.writeFile(path.join(candidateRoot, "museum.html"), museumHtml, "utf8");
  publicationFiles.push(
    {source: "index.html", destination: "index.html"},
    {source: "museum.html", destination: "museum.html"}
  );
} else {
  const insertLegacyScript = html => {
    if (new RegExp(`src=["']\\./${dataName}(?:\\?[^"']*)?["']`).test(html)) return html;
    const beforeRoutes = html.replace(
      /(^\s*<script src=["']\.\/routes\.js[^>]*><\/script>)/m,
      `  <script src="./${dataName}?v=${input.publication.cacheKey}"></script>\n$1`
    );
    if (beforeRoutes !== html) return beforeRoutes;
    return html.replace(
      /(^\s*<script>\s*\n\s*const museumLocations=)/m,
      `  <script src="./${dataName}?v=${input.publication.cacheKey}"></script>\n$1`
    );
  };
  const indexSource = await fs.readFile(path.join(projectRoot, "index.html"), "utf8");
  const museumSource = await fs.readFile(path.join(projectRoot, "museum.html"), "utf8");
  const indexHtml = insertLegacyScript(indexSource);
  const museumHtml = insertLegacyScript(museumSource);
  if (indexHtml !== indexSource || museumHtml !== museumSource) {
    if (indexHtml === indexSource || museumHtml === museumSource) throw new Error("legacy data script binding drift between pages");
    await fs.writeFile(path.join(candidateRoot, "index.html"), indexHtml, "utf8");
    await fs.writeFile(path.join(candidateRoot, "museum.html"), museumHtml, "utf8");
    publicationFiles.push(
      {source: "index.html", destination: "index.html"},
      {source: "museum.html", destination: "museum.html"}
    );
  }
}
await fs.writeFile(
  path.join(candidateRoot, "publication.json"),
  `${JSON.stringify({
    museumId: input.museum.id,
    cacheKey: input.publication.cacheKey,
    files: publicationFiles,
    cachePages: publicationFiles.some(file => file.destination === "index.html" || file.destination === "museum.html")
      ? []
      : input.publication.cachePages || ["index.html", "museum.html"]
  }, null, 2)}\n`,
  "utf8"
);
console.log(`assembled ${input.museum.id}: ${works.length} works`);
