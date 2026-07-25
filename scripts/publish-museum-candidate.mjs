import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const candidateRoot = path.resolve(projectRoot, argument("--candidate") || "");
const publish = process.argv.includes("--publish");
if (!argument("--candidate")) throw new Error("--candidate=<directory> is required");
if (!candidateRoot.startsWith(`${projectRoot}${path.sep}`)) throw new Error("candidate directory escaped project root");

const publication = JSON.parse(await fs.readFile(path.join(candidateRoot, "publication.json"), "utf8"));
if (!/^[a-z][a-z0-9-]*$/.test(publication.museumId || "")) throw new Error("invalid museumId");
if (!/^[a-zA-Z0-9._-]+$/.test(publication.cacheKey || "")) throw new Error("invalid cacheKey");
if (!Array.isArray(publication.files) || !publication.files.length) throw new Error("publication files are required");

const inside = (base, relative) => {
  const target = path.resolve(base, relative);
  if (!target.startsWith(`${base}${path.sep}`)) throw new Error(`path escaped root: ${relative}`);
  return target;
};
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const writes = [];
for (const item of publication.files) {
  const source = inside(candidateRoot, item.source);
  const destination = inside(projectRoot, item.destination);
  const bytes = await fs.readFile(source);
  let oldBytes;
  try { oldBytes = await fs.readFile(destination); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  writes.push({destination, bytes, changed: !oldBytes || hash(bytes) !== hash(oldBytes)});
}
for (const relative of publication.cachePages || []) {
  const destination = inside(projectRoot, relative);
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
console.log(`${publication.museumId} publication ${publish ? "applied" : "dry-run"}: ${changed.length}/${writes.length} files changed`);
