import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  assertPathInside,
  loadManifest,
  projectRelative,
  resolveCanonicalRun,
} from "./lib/filesystem-contract.mjs";

const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const publish = process.argv.includes("--publish");
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
if (publish && descriptor.runKind !== "production") {
  throw new Error("Filesystem contract violation: real publish requires a production run");
}
const candidateRoot = path.join(runRoot, "candidate");
if (argument("--candidate")) {
  const supplied = path.resolve(projectRoot, argument("--candidate"));
  if (supplied !== candidateRoot) {
    throw new Error(`Filesystem contract violation: --candidate must exactly equal ${projectRelative(projectRoot, candidateRoot)}`);
  }
  process.stderr.write("DEPRECATION: --candidate is fixed by the filesystem contract.\n");
}
await assertPathInside(runRoot, candidateRoot);

const publication = JSON.parse(await fs.readFile(path.join(candidateRoot, "publication.json"), "utf8"));
if (!/^[a-z][a-z0-9-]*$/.test(publication.museumId || "")) throw new Error("invalid museumId");
if (descriptor.museumId && publication.museumId !== descriptor.museumId) {
  throw new Error("Filesystem contract violation: publication museumId does not match run.json");
}
if (!/^[a-zA-Z0-9._-]+$/.test(publication.cacheKey || "")) throw new Error("invalid cacheKey");
if (!Array.isArray(publication.files) || !publication.files.length) throw new Error("publication files are required");

const inside = async (base, relative) => {
  const target = path.resolve(base, relative);
  await assertPathInside(base, target, {allowEqual: false});
  return target;
};
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const writes = [];
for (const item of publication.files) {
  const source = await inside(candidateRoot, item.source);
  const destination = await inside(projectRoot, item.destination);
  if (item.source.endsWith(".md")) {
    const required = `research/content/${publication.museumId}.md`;
    if (item.destination.replaceAll("\\", "/") !== required) {
      throw new Error(`Filesystem contract violation: active content destination must be ${required}`);
    }
  }
  const bytes = await fs.readFile(source);
  let oldBytes;
  try { oldBytes = await fs.readFile(destination); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  writes.push({destination, bytes, changed: !oldBytes || hash(bytes) !== hash(oldBytes)});
}
for (const relative of publication.cachePages || []) {
  const destination = await inside(projectRoot, relative);
  const oldBytes = await fs.readFile(destination);
  let html = oldBytes.toString("utf8");
  for (const item of publication.files.filter(file => file.destination.endsWith(".js"))) {
    const basename = path.basename(item.destination).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`(src=["']\\./${basename})(?:\\?v=[^"']*)?(["'])`, "g"), `$1?v=${publication.cacheKey}$2`);
  }
  const bytes = Buffer.from(html);
  writes.push({destination, bytes, changed: hash(bytes) !== hash(oldBytes)});
}

const changed = writes.filter(item => item.changed);
if (publish && changed.length) {
  const backups = new Map();
  try {
    for (const item of changed) {
      try { backups.set(item.destination, await fs.readFile(item.destination)); }
      catch (error) {
        if (error.code !== "ENOENT") throw error;
        backups.set(item.destination, null);
      }
      await fs.mkdir(path.dirname(item.destination), {recursive: true});
      await fs.writeFile(`${item.destination}.meowseum-next`, item.bytes);
    }
    for (const item of changed) await fs.rename(`${item.destination}.meowseum-next`, item.destination);
  } catch (error) {
    for (const [destination, bytes] of backups) {
      await fs.rm(`${destination}.meowseum-next`, {force: true});
      if (bytes) await fs.writeFile(destination, bytes);
      else await fs.rm(destination, {force: true});
    }
    throw error;
  }
}
const assemblyResultPath = path.join(candidateRoot, "assembly-result.json");
let candidateAssemblyResultSha256 = null;
try {
  candidateAssemblyResultSha256 = hash(await fs.readFile(assemblyResultPath));
} catch (error) {
  if (error.code !== "ENOENT" || descriptor.contentContract === "one_shot_v1") throw error;
}
const publicationReport = {
  schemaVersion: 1,
  runId: descriptor.runId,
  museumId: publication.museumId,
  mode: publish ? "publish" : "dry-run",
  candidateAssemblyResultSha256,
  files: Object.fromEntries(writes.map(item => [
    projectRelative(projectRoot, item.destination),
    {sha256: hash(item.bytes), changed: item.changed}
  ]))
};
await fs.mkdir(path.join(runRoot, "reports"), {recursive: true});
await fs.writeFile(
  path.join(runRoot, "reports", `publication-${publish ? "publish" : "dry-run"}.json`),
  `${JSON.stringify(publicationReport, null, 2)}\n`,
  "utf8"
);
console.log(`${publication.museumId} publication ${publish ? "applied" : "dry-run"}: ${changed.length}/${writes.length} files changed`);
