import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  fixtureRunId,
  writeFixtureManifest,
  writeFixtureRun,
} from "./lib/test-filesystem-fixture.mjs";

const script = path.resolve(new URL("publish-museum-candidate.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-publish-"));
try {
  await writeFixtureManifest(root);
  const { runRoot } = await writeFixtureRun({ projectRoot: root });
  const candidate = path.join(runRoot, "candidate");
  await fs.mkdir(path.join(root, "research", "content"), { recursive: true });
  await fs.writeFile(path.join(root, "museum.html"), '<script src="./fixture.js?v=old"></script>');
  await fs.writeFile(path.join(root, "fixture.js"), "old");
  await fs.writeFile(path.join(root, "research", "content", "fixture.md"), "old content");
  await fs.writeFile(path.join(candidate, "fixture.js"), "new");
  await fs.writeFile(path.join(candidate, "fixture.md"), "new content");
  await fs.writeFile(
    path.join(candidate, "publication.json"),
    JSON.stringify({
      museumId: "fixture",
      cacheKey: "new-key",
      files: [
        { source: "fixture.js", destination: "fixture.js" },
        { source: "fixture.md", destination: "research/content/fixture.md" },
      ],
      cachePages: ["museum.html"],
    }),
  );
  const identity = [
    `--project-root=${root}`,
    "--kind=production",
    "--museum=fixture",
    `--run-id=${fixtureRunId}`,
  ];
  const call = (extra) => spawnSync(process.execPath, [script, ...identity, ...extra], { encoding: "utf8" });
  let result = call([]);
  if (result.status !== 0 || !result.stdout.includes("3/3 files changed")) throw new Error(result.stderr || result.stdout);
  if ((await fs.readFile(path.join(root, "fixture.js"), "utf8")) !== "old") throw new Error("dry-run changed production");
  result = call(["--publish"]);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  if ((await fs.readFile(path.join(root, "fixture.js"), "utf8")) !== "new") throw new Error("publish did not copy candidate");
  if (!(await fs.readFile(path.join(root, "museum.html"), "utf8")).includes("?v=new-key")) {
    throw new Error("publish did not update cache key");
  }
  result = call(["--publish"]);
  if (result.status !== 0 || !result.stdout.includes("0/3 files changed")) {
    throw new Error("identical publication was not a no-op");
  }
  const manifestPath = path.join(root, "research", "content-standard-manifest.json");
  const unregistered = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  unregistered.museums = {};
  await fs.writeFile(manifestPath, JSON.stringify(unregistered));
  result = call(["--publish"]);
  if (result.status === 0 || !result.stderr.includes("publication requires manifest registration")) {
    throw new Error("publisher accepted an unregistered museum");
  }
  result = spawnSync(
    process.execPath,
    [script, ...identity, `--candidate=${root}`],
    { encoding: "utf8" },
  );
  if (result.status === 0 || !result.stderr.includes("--candidate must exactly equal")) {
    throw new Error("publisher accepted a candidate outside the run");
  }

  const regressionId = "20260725T151501Z-p2.9.0";
  const regression = await writeFixtureRun({
    projectRoot: root,
    kind: "regression",
    identity: "publish-case",
    runId: regressionId,
  });
  await fs.writeFile(
    path.join(regression.runRoot, "candidate", "publication.json"),
    JSON.stringify({ museumId: "fixture", cacheKey: "x", files: [{ source: "x", destination: "x" }] }),
  );
  result = spawnSync(
    process.execPath,
    [
      script,
      `--project-root=${root}`,
      "--kind=regression",
      "--case=publish-case",
      `--run-id=${regressionId}`,
      "--publish",
    ],
    { encoding: "utf8" },
  );
  if (result.status === 0 || !result.stderr.includes("real publish requires a production run")) {
    throw new Error("publisher accepted real publish from regression");
  }
  process.stdout.write("museum candidate publisher self-test passed\n");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
