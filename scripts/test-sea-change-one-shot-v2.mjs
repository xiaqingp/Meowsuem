import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertCleanLockedMetadata,
  assertExperimentOutputPath,
  assertOneShotDescriptor,
  buildDisplayMetadata,
  experimentEffort,
  experimentModel,
  extractCard,
  snapshotProtectedPaths,
  verifyOneShotOutput,
} from "./experiments/verify-sea-change-one-shot-v2.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "sea-change-one-shot-v2-"));
const runRoot = path.join(root, "research/runs/experiment/sea-change/run");
const protectedPaths = ["research/content/seattle.md", "research/runs/production/seattle", "seattle.js"];
const locked = {
  schemaVersion: 1,
  museumId: "seattle",
  workId: "sea-change",
  objectType: "painting",
  titleZh: "海变",
  titleEn: "Sea Change",
  artistZh: "杰克逊·波洛克",
  artistEn: "Jackson Pollock",
  displayDate: "1947年（创作横跨1946—1947年）",
  medium: "艺术家用油画颜料、商业油漆、砂砾、画布",
  accessionNumber: "58.55",
  museumName: "Seattle Art Museum",
  officialObjectUrl: "https://art.seattleartmuseum.org/objects/2742/sea-change",
  verifiedImage: "https://example.org/sea-change.jpg",
  significance: "重要藏品",
  priority: "绝对不可错过",
  sectionId: "making-visible",
  stay: "8—12分钟",
  availability: "previously_exhibited_current_unknown",
  imagePolicy: "object_image",
};
const validSources = {
  schemaVersion: 1,
  museumId: "seattle",
  workId: "sea-change",
  sources: [{
    title: "Sea Change",
    publisher: "Seattle Art Museum",
    url: locked.officialObjectUrl,
    sourceType: "museum",
    usedFor: ["identity", "date", "material"],
  }],
  directQuotes: [],
  uncertainties: ["当前是否展出尚未确认"],
  highRiskClaims: [],
};
const validArticle = `# 《海变》 / Sea Change

## 一分钟看懂

这张画把波洛克改变作画方法的过程留在同一个表面上。彩色底层、跨过画面的滴线和嵌进颜料的砂砾并存，值得观察的不是一条线画了什么，而是不同动作怎样层层覆盖又彼此露出。

## 一张画如何保留两种工作方式

较平整的颜色和后来滴洒的线迹没有完全融成一层。砂砾又让部分表面从颜色变成真实的颗粒，画布像经过多次施工，而不是一次手势的记录。目前是否展出尚未确认，参观前请查询馆方信息。

## 最后再看一眼

沿一条黑线走到它压过彩色底层的地方，再看旁边露出的颗粒；这时画面会从一团线变成一连串被保留和覆盖的选择。
`;

async function writeFixture({
  metadata = locked,
  article = validArticle,
  sources = validSources,
  forbidden,
} = {}) {
  await fs.rm(runRoot, { recursive: true, force: true });
  await fs.mkdir(path.join(runRoot, "input"), { recursive: true });
  await fs.mkdir(path.join(runRoot, "output"), { recursive: true });
  await fs.writeFile(path.join(runRoot, "input/locked-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  if (article !== null) await fs.writeFile(path.join(runRoot, "output/article.md"), article);
  if (sources !== null) await fs.writeFile(path.join(runRoot, "output/sources.json"), `${JSON.stringify(sources, null, 2)}\n`);
  if (forbidden) await fs.writeFile(path.join(runRoot, forbidden), "{}\n");
}

try {
  await fs.mkdir(path.join(root, "research/content"), { recursive: true });
  await fs.mkdir(path.join(root, "research/runs/production/seattle"), { recursive: true });
  await fs.writeFile(path.join(root, "research/content/seattle.md"), "production content\n");
  await fs.writeFile(path.join(root, "research/runs/production/seattle/run.json"), "{}\n");
  await fs.writeFile(path.join(root, "seattle.js"), "frontend content\n");
  const snapshot = await snapshotProtectedPaths(root, protectedPaths);
  const verify = (options = {}) => verifyOneShotOutput({
    projectRoot: root,
    runRoot,
    expectedMetadata: locked,
    protectedPaths,
    protectedSnapshot: snapshot,
    ...options,
  });

  await writeFixture();
  const initialVerification = await verify();
  assert.equal(initialVerification.status, "passed", JSON.stringify(initialVerification.errors));
  assert.equal(extractCard(validArticle).startsWith("这张画把波洛克"), true);
  assert.equal(buildDisplayMetadata(locked).accessionNumber, undefined);
  assert.equal(buildDisplayMetadata(locked).place.includes("58.55"), true);
  assert.doesNotThrow(() => assertCleanLockedMetadata(locked));

  assert.throws(
    () => assertOneShotDescriptor({ runKind: "production", museumId: "seattle" }),
    /non-publishable experiment/,
    "non-experiment run and experiment publish path must be rejected",
  );
  assert.throws(
    () => assertOneShotDescriptor({ runKind: "experiment", caseId: "another-case" }),
    /non-publishable experiment/,
    "wrong experiment case must be rejected",
  );
  await assert.rejects(
    assertExperimentOutputPath(runRoot, path.join(root, "research/content/seattle.md")),
    /outside|within|path/i,
    "production output path must be rejected",
  );
  assert.throws(
    () => assertCleanLockedMetadata({ ...locked, priorArtifact: "old-research-card.md" }),
    /forbidden old authoring artifact/,
    "old Research Card input must be rejected",
  );
  assert.throws(
    () => assertCleanLockedMetadata({ ...locked, priorArtifact: "old-writing-plan.json" }),
    /forbidden old authoring artifact/,
    "old Writing Plan input must be rejected",
  );

  for (const [label, fixture, options] of [
    ["non-Sol model", {}, { model: "gpt-5.6-terra" }],
    ["non-medium effort", {}, { reasoningEffort: "high" }],
    ["missing article", { article: null }, {}],
    ["missing sources", { sources: null }, {}],
    ["Research Card output", { forbidden: "research-card.json" }, {}],
    ["Writing Plan output", { forbidden: "writing-plan.json" }, {}],
    ["claim ledger output", { forbidden: "claim-ledger.json" }, {}],
    ["missing quick section", { article: validArticle.replace("## 一分钟看懂", "## 开场") }, {}],
    ["missing final section", { article: validArticle.replace("## 最后再看一眼", "## 收束") }, {}],
    ["metadata drift", { metadata: { ...locked, workId: "other" } }, {}],
  ]) {
    await writeFixture(fixture);
    assert.equal((await verify(options)).status, "failed", label);
  }

  await writeFixture();
  await fs.writeFile(path.join(root, "research/content/seattle.md"), "mutated production content\n");
  assert.equal((await verify()).status, "failed", "production hash mutation");
  process.stdout.write(
    "Sea Change one-shot v2 fixtures passed: experiment isolation, Sol medium, forbidden inputs/outputs, article structure, metadata and production protection\n",
  );
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
