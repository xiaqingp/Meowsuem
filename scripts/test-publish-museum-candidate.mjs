import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";

const script = path.resolve(new URL("publish-museum-candidate.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-publish-"));
const candidate = path.join(root, "candidate");
try {
  await fs.mkdir(candidate);
  await fs.writeFile(path.join(root, "museum.html"), '<script src="./fixture.js?v=old"></script>');
  await fs.writeFile(path.join(root, "fixture.js"), "old");
  await fs.writeFile(path.join(candidate, "fixture.js"), "new");
  await fs.writeFile(path.join(candidate, "publication.json"), JSON.stringify({
    museumId: "fixture",
    cacheKey: "new-key",
    files: [{source: "fixture.js", destination: "fixture.js"}],
    cachePages: ["museum.html"]
  }));
  const call = extra => spawnSync(process.execPath, [script, `--project-root=${root}`, "--candidate=candidate", ...extra], {encoding: "utf8"});
  let result = call([]);
  if (result.status !== 0 || !result.stdout.includes("2/2 files changed")) throw new Error(result.stderr || result.stdout);
  if (await fs.readFile(path.join(root, "fixture.js"), "utf8") !== "old") throw new Error("dry-run changed production");
  result = call(["--publish"]);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  if (await fs.readFile(path.join(root, "fixture.js"), "utf8") !== "new") throw new Error("publish did not copy candidate");
  if (!(await fs.readFile(path.join(root, "museum.html"), "utf8")).includes("?v=new-key")) throw new Error("publish did not update cache key");
  result = call(["--publish"]);
  if (result.status !== 0 || !result.stdout.includes("0/2 files changed")) throw new Error("identical publication was not a no-op");
  console.log("museum candidate publisher self-test passed");
} finally {
  await fs.rm(root, {recursive: true, force: true});
}
