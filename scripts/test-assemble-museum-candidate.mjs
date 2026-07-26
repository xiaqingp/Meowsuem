import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  fixtureRunId,
  writeFixtureManifest,
  writeFixtureRun,
} from "./lib/test-filesystem-fixture.mjs";

const script = path.resolve(new URL("assemble-museum-candidate.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-assembly-"));
try {
  await writeFixtureManifest(root);
  const { runRoot } = await writeFixtureRun({ projectRoot: root });
  await fs.writeFile(
    path.join(root, "ratings.js"),
    "const museumRatings = {\n  fixture: {\n    score: 70\n  }\n};\n",
  );
  await fs.writeFile(
    path.join(root, "routes.js"),
    'const routePlans = {\n  fixture: {}\n};\nconst contentUpdatedAtByMuseum = {fixture:"2026-07-25"};\n',
  );
  const page = '<script src="./museums.js"></script>\n<script src="./fixture.js"></script>\n<script src="./routes.js"></script>';
  await fs.writeFile(path.join(root, "index.html"), page);
  await fs.writeFile(path.join(root, "museum.html"), page);

  const workRoot = path.join(runRoot, "works", "work-one");
  await fs.mkdir(path.join(workRoot, "author"), { recursive: true });
  await fs.mkdir(path.join(workRoot, "mechanical"), { recursive: true });
  const draft = "## 作品一 / Work One\n\n### 30 秒先懂\n\n这是一段测试正文。\n";
  await fs.writeFile(path.join(workRoot, "author", "draft.md"), draft);
  await fs.writeFile(path.join(workRoot, "author", "card.txt"), "一句卡片简介。");
  await fs.writeFile(
    path.join(workRoot, "author", "writing-plan.json"),
    JSON.stringify({
      displayMetadata: {
        by: "作者 · 国家",
        date: "1900",
        material: "布面油画",
        place: "测试馆",
        priority: "绝对不可错过",
        significance: "稀世珍品",
        stay: "建议停留 3 分钟",
      },
    }),
  );
  await fs.writeFile(path.join(workRoot, "mechanical", "mechanical-result.json"), '{"status":"passed"}');
  const input = {
    schemaVersion: 1,
    museum: {
      id: "fixture",
      editorialCapacity: 1,
      city: "测试城",
      zh: "测试馆",
      en: "Fixture Museum",
      verdict: "",
      hero: "https://example.test/hero.jpg",
      contentFile: "research/content/fixture.md",
      official: "https://example.test",
      visit: "https://example.test/visit",
      contentUpdatedAt: "2026-07-25",
      intro: ["测试馆介"],
      routes: {},
    },
    chapters: [{ id: "one", number: "01", title: "第一章", intro: "章节简介" }],
    routes: {
      "90": { title: "90 分钟", note: "", workIds: ["work-one"] },
      half: { title: "半天", note: "", workIds: ["work-one"] },
      all: { title: "完整", note: "", workIds: ["work-one"] },
    },
    rating: { score: 70 },
    works: [
      {
        id: "work-one",
        ch: "one",
        significance: "稀世珍品",
        image: "https://example.test/work.jpg",
        imageSource: "https://example.test/image",
        imageCaption: "作品一",
        source: "https://example.test/work",
      },
    ],
    publication: { dataFile: "fixture.js", cacheKey: "fixture-v1", cachePages: ["index.html", "museum.html"] },
  };
  await fs.writeFile(path.join(runRoot, "structure", "assembly-input.json"), `${JSON.stringify(input, null, 2)}\n`);
  const identity = [
    `--project-root=${root}`,
    "--kind=production",
    "--museum=fixture",
    `--run-id=${fixtureRunId}`,
  ];
  let result = spawnSync(process.execPath, [script, ...identity], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const candidate = path.join(runRoot, "candidate");
  const content = await fs.readFile(path.join(candidate, "fixture.md"), "utf8");
  assert.match(content, /### 30 秒先懂/);
  assert.equal((content.match(/^##\s+\d+\./gm) ?? []).length, 1);
  const publication = JSON.parse(await fs.readFile(path.join(candidate, "publication.json"), "utf8"));
  assert.equal(
    publication.files.find((item) => item.source === "fixture.md").destination,
    "research/content/fixture.md",
  );
  await fs.rm(candidate, {recursive: true, force: true});
  const descriptorPath = path.join(runRoot, "run.json");
  const legacyDescriptor = JSON.parse(await fs.readFile(descriptorPath, "utf8"));
  await fs.writeFile(descriptorPath, `${JSON.stringify({
    ...legacyDescriptor,
    contentContract: "one_shot_v1",
    allowLegacyAuthorBundles: false,
    legacyWorkIds: [],
  }, null, 2)}\n`);
  await fs.mkdir(path.join(runRoot, "assembly"), {recursive: true});
  const assemblyBytes = await fs.readFile(path.join(runRoot, "structure", "assembly-input.json"));
  await fs.writeFile(path.join(runRoot, "assembly", "publication-plan.json"), `${JSON.stringify({
    schemaVersion: 1,
    runId: fixtureRunId,
    museumId: "fixture",
    assemblyInput: "structure/assembly-input.json",
    inputHashes: {"structure/assembly-input.json": crypto.createHash("sha256").update(assemblyBytes).digest("hex")},
  }, null, 2)}\n`);
  result = spawnSync(process.execPath, [script, ...identity], {encoding: "utf8"});
  if (result.status === 0 || !result.stderr.includes("legacy fallback is forbidden")) {
    throw new Error("new one-shot run silently accepted a legacy author bundle");
  }
  await fs.writeFile(descriptorPath, `${JSON.stringify({
    ...legacyDescriptor,
    contentContract: "one_shot_v1",
    allowLegacyAuthorBundles: true,
    legacyWorkIds: ["work-one"],
  }, null, 2)}\n`);
  result = spawnSync(process.execPath, [script, ...identity], {encoding: "utf8"});
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  await fs.rm(candidate, {recursive: true, force: true});
  await fs.writeFile(descriptorPath, `${JSON.stringify(legacyDescriptor, null, 2)}\n`);
  const integrationRoot = path.join(workRoot, "one-shot", "integration");
  await fs.mkdir(integrationRoot, {recursive: true});
  await fs.writeFile(path.join(integrationRoot, "draft.md"), "# 《作品一》 / Work One\n\n## 一分钟看懂\n\nOne-shot 正文。\n\n## 中间\n\n解释。\n\n## 最后再看一眼\n\n再看。\n");
  await fs.writeFile(path.join(integrationRoot, "card.txt"), "One-shot 卡片。");
  await fs.writeFile(path.join(integrationRoot, "display-metadata.json"), JSON.stringify({
    titleZh: "《作品一》",
    titleEn: "Work One",
    by: "作者 · 国家",
    date: "1900",
    material: "布面油画",
    place: "测试馆",
    priority: "绝对不可错过",
    significance: "稀世珍品",
    stay: "建议停留 3 分钟"
  }));
  await fs.writeFile(path.join(integrationRoot, "verification.json"), '{"status":"passed","errors":[],"warnings":[],"checks":{}}');
  await fs.writeFile(path.join(integrationRoot, "adapter-result.json"), '{"status":"passed"}');
  result = spawnSync(process.execPath, [script, ...identity], {encoding: "utf8"});
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  assert.match(await fs.readFile(path.join(candidate, "fixture.md"), "utf8"), /## 一分钟看懂/);
  result = spawnSync(process.execPath, [script, ...identity, `--candidate=${root}`], { encoding: "utf8" });
  if (result.status === 0 || !result.stderr.includes("--candidate must exactly equal")) {
    throw new Error("assembler accepted candidate output outside the run");
  }
  process.stdout.write("generic assembler contract test passed\n");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
