import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const worksRoot = path.join(root, "research", "m28-6", "vienna", "works");
const concurrency = 4;
const queue = fs.readdirSync(worksRoot)
  .filter(name => fs.existsSync(path.join(worksRoot, name, "run-header.json")))
  .filter(name => !fs.existsSync(path.join(worksRoot, name, "author-result.json")))
  .sort();

let active = 0;
let completed = 0;
let failed = false;

await new Promise((resolve, reject) => {
  const launch = () => {
    if (failed) return;
    if (queue.length === 0 && active === 0) return resolve();
    while (active < concurrency && queue.length > 0) {
      const workId = queue.shift();
      const workRoot = path.join(worksRoot, workId);
      const log = fs.openSync(path.join(workRoot, "runner.log"), "a");
      const relativeRun = path.relative(root, workRoot);
      const child = spawn("powershell.exe", [
        "-ExecutionPolicy", "Bypass",
        "-File", path.join(root, "scripts", "run-isolated-generation.ps1"),
        "-ProjectRoot", root,
        "-RunDirectory", relativeRun
      ], { cwd: root, stdio: ["ignore", log, log], windowsHide: true });
      active += 1;
      console.log(`started ${workId}`);
      child.on("error", error => {
        fs.closeSync(log);
        failed = true;
        reject(error);
      });
      child.on("close", code => {
        fs.closeSync(log);
        active -= 1;
        if (code !== 0) {
          failed = true;
          reject(new Error(`${workId} exited with ${code}`));
          return;
        }
        completed += 1;
        console.log(`completed ${completed}/40 ${workId}`);
        launch();
      });
    }
  };
  launch();
});

console.log(`all author runs completed: ${completed}`);
