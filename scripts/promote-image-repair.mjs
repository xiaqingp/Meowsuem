import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const args = Object.fromEntries(process.argv.slice(2).map(value => { const index = value.indexOf("="); if (!value.startsWith("--") || index < 0) throw new Error(`Expected --key=value, received ${value}`); return [value.slice(2, index), value.slice(index + 1)]; }));
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

export function updateWorkImageFields(source, workId, values) {
  const marker = `"id": ${JSON.stringify(workId)}`;
  const idIndex = source.indexOf(marker); if (idIndex < 0) throw new Error(`published work missing: ${workId}`);
  const start = source.lastIndexOf("    {", idIndex); const next = source.indexOf("\n    },\n    {", idIndex); const end = next < 0 ? source.indexOf("\n    }\n  ]", idIndex) : next + 7;
  if (start < 0 || end < 0) throw new Error(`published work boundary missing: ${workId}`);
  let block = source.slice(start, end);
  for (const [field, value] of Object.entries(values)) { const pattern = new RegExp(`"${field}":\\s*"[^"]*"`); if (!pattern.test(block)) throw new Error(`${workId}: missing ${field}`); block = block.replace(pattern, `"${field}": ${JSON.stringify(value)}`); }
  return source.slice(0, start) + block + source.slice(end);
}

async function main() {
  const projectRoot = path.resolve(args["project-root"] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const runRoot = path.resolve(projectRoot, args["run-root"] || ""); const museumId = args.museum;
  if (!args["run-root"] || !museumId) throw new Error("--run-root and --museum are required");
  const evidence = JSON.parse(await fs.readFile(path.join(runRoot, "image-evidence", "verified-image-evidence.json"), "utf8"));
  if (evidence.museumId !== museumId || evidence.works?.length < 1) throw new Error("image evidence identity is incomplete");
  const hashes = new Set(); let data = await fs.readFile(path.join(projectRoot, `${museumId}.js`), "utf8");
  for (const work of evidence.works) {
    if (!work.selected || work.imagePolicy !== "object_image" || !["accepted", "object_image_accepted"].includes(work.status)) throw new Error(`${work.workId}: image is not accepted object evidence`);
    if (hashes.has(work.selected.sha256)) throw new Error(`${work.workId}: duplicate accepted image hash`); hashes.add(work.selected.sha256);
    const source = path.resolve(projectRoot, work.selected.localPath); const bytes = await fs.readFile(source); if (sha256(bytes) !== work.selected.sha256) throw new Error(`${work.workId}: source hash drift`);
    const extension = path.extname(source).toLowerCase(); const destination = path.join(projectRoot, "assets", museumId, `${work.workId}${extension}`);
    await fs.copyFile(source, destination); if (sha256(await fs.readFile(destination)) !== work.selected.sha256) throw new Error(`${work.workId}: published hash drift`);
    data = updateWorkImageFields(data, work.workId, {image:`./assets/${museumId}/${work.workId}${extension}`, imageSource:work.selected.url || work.selected.sourcePageUrl, imageKind:"object"});
  }
  const output = path.join(projectRoot, `${museumId}.js`); const temporary = `${output}.image-repair.tmp`; await fs.writeFile(temporary, data, "utf8"); await fs.rename(temporary, output);
  console.log(`${museumId}: promoted ${evidence.works.length} verified object images`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
