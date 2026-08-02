import fs from "node:fs/promises";
import path from "node:path";

export async function museumDataFiles(projectRoot) {
  const html = await fs.readFile(path.join(projectRoot, "museum.html"), "utf8");
  const files = [...html.matchAll(/<script\s+src=["']\.\/([^"'?]+\.js)(?:\?[^"']*)?["']/g)]
    .map(match => match[1])
    .filter(name => name !== "museum-app.js");
  if (!files.includes("ratings.js") || !files.includes("routes.js")) {
    throw new Error("museum.html is missing canonical data scripts");
  }
  if (new Set(files).size !== files.length) throw new Error("museum.html contains duplicate data scripts");
  return files;
}
