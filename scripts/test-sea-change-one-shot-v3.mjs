import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertOneShotDescriptor,
  snapshotProtectedPaths,
  verifyOneShotOutput,
} from "./experiments/verify-sea-change-one-shot-v2.mjs";

const model = "gpt-5.6-luna";
const reasoningEffort = "high";
const caseId = "sea-change-luna-one-shot-v3";
const root = await fs.mkdtemp(path.join(os.tmpdir(), "sea-change-one-shot-v3-"));
const runRoot = path.join(root, "research/runs/experiment/sea-change/run");
const protectedPaths = ["research/content/seattle.md"];
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
const article = `# 《海变》 / Sea Change

## 一分钟看懂

画面把波洛克改变作画方法的过程留在同一个表面上。

## 两种工作方式

彩色底层、滴线和砂砾互相覆盖。目前是否展出尚未确认。

## 最后再看一眼

沿一条黑线看它怎样压过彩色底层。
`;
const sources = {
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

try {
  await fs.mkdir(path.join(root, "research/content"), { recursive: true });
  await fs.mkdir(path.join(runRoot, "input"), { recursive: true });
  await fs.mkdir(path.join(runRoot, "output"), { recursive: true });
  await fs.writeFile(path.join(root, "research/content/seattle.md"), "production\n");
  await fs.writeFile(path.join(runRoot, "input/locked-metadata.json"), `${JSON.stringify(locked, null, 2)}\n`);
  await fs.writeFile(path.join(runRoot, "output/article.md"), article);
  await fs.writeFile(path.join(runRoot, "output/sources.json"), `${JSON.stringify(sources, null, 2)}\n`);
  const protectedSnapshot = await snapshotProtectedPaths(root, protectedPaths);
  const verify = (overrides = {}) => verifyOneShotOutput({
    projectRoot: root,
    runRoot,
    expectedMetadata: locked,
    protectedPaths,
    protectedSnapshot,
    model,
    reasoningEffort,
    allowedModel: model,
    allowedReasoningEffort: reasoningEffort,
    ...overrides,
  });

  assert.doesNotThrow(() => assertOneShotDescriptor({ runKind: "experiment", caseId }, caseId));
  assert.throws(
    () => assertOneShotDescriptor({ runKind: "experiment", caseId: "sea-change-sol-one-shot-writing-v2" }, caseId),
    /non-publishable experiment/,
  );
  assert.equal((await verify()).status, "passed");
  assert.equal((await verify({ model: "gpt-5.6-sol" })).status, "failed");
  assert.equal((await verify({ reasoningEffort: "medium" })).status, "failed");
  process.stdout.write("Sea Change one-shot v3 fixtures passed: Luna High only and v2 mechanical gate preserved\n");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
