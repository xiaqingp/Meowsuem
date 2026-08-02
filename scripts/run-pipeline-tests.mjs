import fs from "node:fs/promises";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptsRoot = path.join(projectRoot, "scripts");
const tests = (await fs.readdir(scriptsRoot))
  .filter(name => /^test-.*\.mjs$/.test(name))
  .sort();
const failures = [];
for (const test of tests) {
  const result = spawnSync(process.execPath, [path.join(scriptsRoot, test)], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status === 0) process.stdout.write(`PASS ${test}\n`);
  else failures.push({test, output: `${result.stdout || ""}${result.stderr || ""}`.trim()});
}
for (const failure of failures) {
  process.stderr.write(`FAIL ${failure.test}\n${failure.output}\n`);
}
process.stdout.write(`pipeline tests: ${tests.length - failures.length}/${tests.length} passed\n`);
if (failures.length) process.exitCode = 1;
