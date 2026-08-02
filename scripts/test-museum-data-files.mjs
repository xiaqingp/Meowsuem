import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {museumDataFiles} from "./lib/museum-data-files.mjs";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const files = await museumDataFiles(projectRoot);
assert(files.includes("nationalmuseum.js"));
assert(files.includes("designmuseum-danmark.js"));
assert(files.includes("routes.js"));
assert(!files.includes("museum-app.js"));

const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "museum-data-files-"));
try {
  await fs.writeFile(path.join(fixture, "museum.html"), '<script src="./ratings.js"></script><script src="./ratings.js"></script><script src="./routes.js"></script>');
  await assert.rejects(() => museumDataFiles(fixture), /duplicate/);
} finally {
  await fs.rm(fixture, {recursive: true, force: true});
}
process.stdout.write("museum data file discovery tests passed\n");
