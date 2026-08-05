import assert from "node:assert/strict";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildDisplayMetadata,
  extractCard,
  normalizeUrl,
  snapshotProtectedPaths,
  verifyOneShotWork,
} from "./verify-one-shot-work.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-one-shot-"));
const artifactRoot = path.join(root, "artifact");
const protectedPaths = ["production.md"];
const locked = {
  schemaVersion: 1,
  museumId: "example-museum",
  workId: "example-work",
  objectType: "painting",
  titleZh: "测试作品",
  titleEn: "Example Work",
  artistZh: "测试作者",
  artistEn: "Example Artist",
  displayDate: "1950年",
  medium: "布面油画",
  accessionNumber: "A.1",
  museumName: "Example Museum",
  officialObjectUrl: "https://EXAMPLE.org/object/1/?utm_source=test#top",
  verifiedImage: "https://example.org/image.jpg",
  significance: "重要藏品",
  priority: "强烈推荐",
  sectionId: "example",
  stay: "5—8 分钟",
  availability: "display_status_unknown",
  imagePolicy: "object_image"
};
const baseArticle = body => `# 《测试作品》 / Example Work

## 一分钟看懂

这件作品把材料与动作留在同一个表面，值得近看它们怎样互相覆盖。

## 为什么这些痕迹仍然清楚

${body}

## 最后再看一眼

沿着一条线看它怎样越过底色，再回到整幅画。
`;
const baseSources = {
  schemaVersion: 2,
  museumId: locked.museumId,
  workId: locked.workId,
  sources: [{
    id: "S1",
    title: "Example Work",
    publisher: "Example Museum",
    url: "https://example.org/object/1",
    sourceType: "museum",
    usedFor: ["identity", "date", "material"]
  }],
  directQuotes: [],
  highRiskClaims: [],
  uncertainties: []
};

async function writeFixture(article, sources = baseSources, metadata = locked) {
  await fs.rm(artifactRoot, {recursive: true, force: true});
  await fs.mkdir(path.join(artifactRoot, "input"), {recursive: true});
  await fs.mkdir(path.join(artifactRoot, "output"), {recursive: true});
  await fs.writeFile(path.join(artifactRoot, "input/locked-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  await fs.writeFile(path.join(artifactRoot, "output/article.md"), article);
  await fs.writeFile(path.join(artifactRoot, "output/sources.json"), `${JSON.stringify(sources, null, 2)}\n`);
}

try {
  await fs.writeFile(path.join(root, "production.md"), "protected\n");
  const protectedSnapshot = await snapshotProtectedPaths(root, protectedPaths);
  const verify = (expectedMetadata = locked) => verifyOneShotWork({
    projectRoot: root,
    artifactRoot,
    expectedMetadata,
    protectedPaths,
    protectedSnapshot,
    model: "gpt-5.6-luna",
    reasoningEffort: "high",
    runKind: "experiment"
  });

  for (const safe of [
    "“画海的画”并不需要人物原话来成立。",
    "颜料形成近似“全覆盖”的表面。",
    "这里的“随机”只是观看感受。",
    "“行动绘画”是常见术语。",
    "它没有说“柳树”，而说“柳树倒影”。",
    "这不是唯一答案。",
    "不能称为第一张滴画。",
    "没有证据证明它是最早的。",
    "她没有让剑成为唯一主角。",
    "通常英语会说“figure it out”。"
  ]) {
    await writeFixture(baseArticle(safe));
    const result = await verify();
    assert.equal(result.status, "passed", `${safe}\n${JSON.stringify(result.errors)}`);
    assert.equal(result.errors.length, 0);
  }

  for (const safe of [
    "\u535a\u7269\u9986\u8d2d\u5165\u7b2c\u4e00\u9762\u677f\u540e\uff0c\u53c8\u59d4\u6258\u827a\u672f\u5bb6\u5236\u4f5c\u7b2c\u4e8c\u9762\u677f\u3002",
    "\u5b83\u4e0d\u5fc5\u88ab\u7406\u89e3\u6210\u53ea\u6709\u552f\u4e00\u7b54\u6848\u7684\u8c1c\u8bed\u3002",
    "\u5bf9\u6bcf\u4e2a\u5c40\u90e8\u90fd\u4f5c\u552f\u4e00\u89e3\u91ca\u5e76\u4e0d\u7a33\u59a5\u3002",
  ]) {
    await writeFixture(baseArticle(safe));
    const result = await verify();
    assert.equal(result.status, "passed", `${safe}\n${JSON.stringify(result.errors)}`);
  }

  for (const risky of [
    "这是波洛克第一张滴画。",
    "这是全球唯一的过渡作品。",
    "这是他最早的滴画。",
    "波洛克说：“绘画有它自己的生命。”",
    "波洛克的明确意图是表现海洋。"
  ]) {
    await writeFixture(baseArticle(risky));
    assert.equal((await verify()).status, "failed", risky);
  }

  const supported = {
    ...baseSources,
    directQuotes: [{quote: "绘画有它自己的生命。", speaker: "波洛克", sourceIds: ["S1"]}],
    highRiskClaims: [
      {claim: "这是波洛克第一张滴画", type: "first_or_earliest", sourceIds: ["S1"]},
      {claim: "波洛克的明确意图是表现海洋", type: "artist_intent", sourceIds: ["S1"]}
    ]
  };
  await writeFixture(baseArticle("这是波洛克第一张滴画。波洛克说：“绘画有它自己的生命。”波洛克的明确意图是表现海洋。"), supported);
  assert.equal((await verify()).status, "passed");

  await writeFixture(baseArticle("馆方介绍，博物馆在1926年使用这盏灯，成为丹麦第一座采用电气照明的博物馆。"), {
    ...baseSources,
    highRiskClaims: [{
      claim: "Designmuseum Danmark介绍称，该馆在1926年使用这盏灯，成为丹麦第一座采用电气照明的博物馆。",
      type: "first_or_earliest",
      sourceIds: ["S1"],
    }],
  });
  assert.equal((await verify()).status, "passed");

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [
      {...baseSources.sources[0], usedFor: ["identity", "date"]},
      {
        id: "S2",
        title: "Published catalogue",
        publisher: "Example Publisher",
        url: "https://publisher.example/catalogue",
        sourceType: "publication",
        usedFor: ["medium"]
      }
    ]
  });
  assert.equal((await verify()).status, "passed");

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [
      {...baseSources.sources[0], usedFor: ["identity", "material"]},
      {
        id: "S2",
        title: "Other museum object record",
        publisher: "Other Museum",
        url: "https://other.example/object/dated",
        sourceType: "museum",
        usedFor: ["date"]
      }
    ]
  });
  assert.equal((await verify()).status, "passed");

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [
      {...baseSources.sources[0], usedFor: ["identity", "material"]},
      {
        id: "S2",
        title: "Unverified date note",
        publisher: "Unknown",
        url: "https://other.example/date",
        sourceType: "other",
        usedFor: ["date"]
      }
    ]
  });
  assert.equal((await verify()).status, "failed");

  await writeFixture(baseArticle("有人称它“经典之作”，而它可能具有开创性。"));
  const warnings = await verify();
  assert.equal(warnings.status, "passed");
  assert.ok(warnings.warnings.length >= 1);

  for (const figurative of [
    "画面在说“这是我们的国家”。",
    "像是在说“我代表一种理想”。",
    "题名在说“大溪地”。",
    "资料只称“公主”。",
    "德加最大胆的动作，也许不是塑造少女，而是给雕塑穿上衣服。"
  ]) {
    await writeFixture(baseArticle(figurative));
    assert.equal((await verify()).status, "passed", figurative);
  }

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    highRiskClaims: [{claim: "", type: "other", sourceIds: ["S1"]}],
  });
  assert.equal((await verify()).status, "failed");

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [
      {...baseSources.sources[0], usedFor: ["identity", "date"]},
      {
        id: "S2",
        title: "Unverified material note",
        publisher: "Unknown",
        url: "https://other.example/material",
        sourceType: "other",
        usedFor: ["material"]
      }
    ]
  });
  assert.equal((await verify()).status, "failed");

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [
      {...baseSources.sources[0], usedFor: ["identity", "date"]},
      {
        id: "S2",
        title: "Example Museum technical sheet",
        publisher: "Example Museum",
        url: "https://www.example.org/media/technical-sheet.pdf",
        sourceType: "museum",
        usedFor: ["material"]
      }
    ]
  });
  assert.equal((await verify()).status, "passed");

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [
      {...baseSources.sources[0], usedFor: ["identity", "date"]},
      {
        id: "S2",
        title: "Third-party technical sheet",
        publisher: "Other Museum",
        url: "https://other.example/material",
        sourceType: "museum",
        usedFor: ["material"]
      }
    ]
  });
  assert.equal((await verify()).status, "passed");

  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [{...baseSources.sources[0], url: "https://guide.example.org/object/1"}]
  });
  assert.equal((await verify()).status, "passed");

  const genericLocked = {...locked, medium: "绘画"};
  await writeFixture(baseArticle("普通说明。"), {
    ...baseSources,
    sources: [{...baseSources.sources[0], usedFor: ["identity", "date"]}]
  }, genericLocked);
  assert.equal((await verify(genericLocked)).status, "passed");

  await writeFixture(baseArticle("这是波洛克第一张滴画。"), {
    ...baseSources,
    highRiskClaims: [{claim: "这是波洛克第一张滴画", type: "first_or_earliest", sourceIds: ["UNKNOWN"]}],
  });
  assert.equal((await verify()).status, "failed");

  await writeFixture(baseArticle("这件作品目前正在馆内展出。"));
  assert.equal((await verify()).status, "failed");
  await writeFixture(baseArticle("目前，这件灯具不在展。"));
  assert.equal((await verify()).status, "failed");
  const confirmedOffView = {...locked, availability: "collection_rotation", stay: "3分钟（当前不在展）"};
  await writeFixture(baseArticle("目前，这件灯具不在展。"), baseSources, confirmedOffView);
  assert.equal((await verify(confirmedOffView)).status, "passed");

  for (const conservativeStatus of [
    "目前是否仍在展厅展出，公开页面没有给出确定信息。",
    "网页没有提供当前状态，因此不宜把它说成正在展出。"
  ]) {
    await writeFixture(baseArticle(conservativeStatus));
    assert.equal((await verify()).status, "passed");
  }

  await writeFixture(baseArticle("普通说明。"), baseSources, {...locked, workId: "drift"});
  assert.equal((await verify()).status, "failed");

  await writeFixture(baseArticle("普通说明。"));
  await fs.writeFile(path.join(root, "production.md"), "changed\n");
  assert.equal((await verify()).status, "failed");

  assert.equal(normalizeUrl(locked.officialObjectUrl), "https://example.org/object/1");
  assert.match(extractCard(baseArticle("普通说明。")), /^这件作品/);
  assert.equal(buildDisplayMetadata(locked).availability, "display_status_unknown");
  process.stdout.write("one-shot work fixtures passed: generic identity, schemas, risk classes, warnings, URL normalization and production protection\n");
} finally {
  await fs.rm(root, {recursive: true, force: true});
}
const oneShotPrompt = fsSync.readFileSync("research/pipeline/prompts/single-work-one-shot.md", "utf8");
assert.match(oneShotPrompt, /"lockedValue"/);
assert.match(oneShotPrompt, /"observedValue"/);
assert.match(oneShotPrompt, /不得用 `statement`、`sourceValue`/);
