import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertDirectWriteRunDescriptor,
  directWriteEffort,
  directWriteModel,
  normalizeDirectWriteEvidence,
  snapshotProtectedPaths,
  verifyDirectWriteOutput,
} from "./experiments/verify-direct-write-output.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "sea-change-direct-write-"));
const runRoot = path.join(root, "research/runs/experiment/sea-change/run");
const protectedPaths = ["research/content/seattle.md", "research/runs/production/seattle", "seattle.js"];
const expectedInput = {
  museumId: "seattle",
  workId: "sea-change",
  title: "Sea Change",
  artist: "Jackson Pollock",
  date: "1947",
  medium: "artist and commercial oil paint, with gravel, on canvas",
  accessionNumber: "58.55",
  officialObjectUrl: "https://art.seattleartmuseum.org/objects/2742/sea-change",
  verifiedImage: "https://example.org/sea-change.jpg",
  currentDisplayStatus: "unknown",
};
const validEvidence = {
  schemaVersion: 1,
  museumId: "seattle",
  workId: "sea-change",
  model: directWriteModel,
  reasoningEffort: directWriteEffort,
  sources: [{
    id: "S1",
    url: expectedInput.officialObjectUrl,
    sourceType: "museum",
    supports: ["identity", "date", "medium", "accessionNumber", "collectionRelation"],
  }],
  claims: [
    { id: "C1", summary: "identity", sourceIds: ["S1"], usedIn: ["draft"] },
    { id: "C2", summary: "visible lines", evidenceType: "verified_image_observation", usedIn: ["draft"] },
  ],
  uncertainties: ["当前展出状态无法确认"],
  highRiskClaims: [],
};
const validDraft = `# Sea Change

## 短摘要

这件作品把材料变化留在画面上。

## 30 秒先懂

它值得看，因为画布同时保留刷画、滴洒和砂砾形成的不同表面。

## 多停几分钟

黑线穿过彩色底层，颗粒让颜料表面不再完全平整。当前展出状态无法确认，参观前请向馆方核验。

## 最后再看一眼

看看黑线覆盖与底色露出的关系。
`;

const writeFixture = async ({ evidence = validEvidence, draft = validDraft, forbidden, input = expectedInput } = {}) => {
  await fs.rm(runRoot, { recursive: true, force: true });
  await fs.mkdir(path.join(runRoot, "input"), { recursive: true });
  await fs.mkdir(path.join(runRoot, "output"), { recursive: true });
  await fs.writeFile(path.join(runRoot, "input/work-input.json"), `${JSON.stringify(input, null, 2)}\n`);
  if (draft !== null) await fs.writeFile(path.join(runRoot, "output/draft.md"), draft);
  if (evidence !== null) await fs.writeFile(path.join(runRoot, "output/evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  if (forbidden) await fs.writeFile(path.join(runRoot, forbidden), "{}\n");
};

try {
  await fs.mkdir(path.join(root, "research/content"), { recursive: true });
  await fs.mkdir(path.join(root, "research/runs/production/seattle/works/sea-change"), { recursive: true });
  await fs.writeFile(path.join(root, "research/content/seattle.md"), "production content\n");
  await fs.writeFile(path.join(root, "research/runs/production/seattle/works/sea-change/draft.md"), "old unrelated draft\n");
  await fs.writeFile(path.join(root, "seattle.js"), "production frontend\n");
  const snapshot = await snapshotProtectedPaths(root, protectedPaths);
  const verify = () => verifyDirectWriteOutput({
    projectRoot: root,
    runRoot,
    expectedInput,
    protectedSnapshot: snapshot,
    protectedPaths,
    oldDraftPath: path.join(root, "research/runs/production/seattle/works/sea-change/draft.md"),
  });

  await writeFixture();
  assert.equal((await verify()).status, "passed");
  const normalized = normalizeDirectWriteEvidence({
    ...validEvidence,
    sources: validEvidence.sources.map(({ id, sourceType, ...source }) => ({ ...source, sourceId: id, type: sourceType })),
    claims: validEvidence.claims.map(({ id, summary, ...claim }) => ({ ...claim, claimId: id, text: summary })),
  });
  assert.equal(normalized.sources[0].id, "S1");
  assert.equal(normalized.claims[0].id, "C1");
  assert.throws(
    () => assertDirectWriteRunDescriptor({ runKind: "production", museumId: "seattle" }),
    /non-publishable experiment/,
    "production/publishable run must be rejected",
  );

  for (const [label, mutation] of [
    ["only Sol", { evidence: { ...validEvidence, model: "gpt-5.6-terra" } }],
    ["medium effort", { evidence: { ...validEvidence, reasoningEffort: "high" } }],
    ["missing draft", { draft: null }],
    ["missing evidence", { evidence: null }],
    ["research card forbidden", { forbidden: "research-card.json" }],
    ["writing plan forbidden", { forbidden: "writing-plan.json" }],
    ["research card input forbidden", { input: { ...expectedInput, priorArtifact: "old-research-card.md" } }],
    ["writing plan input forbidden", { input: { ...expectedInput, priorArtifact: "old-writing-plan.json" } }],
    ["museum drift", { evidence: { ...validEvidence, museumId: "met" } }],
    ["work drift", { evidence: { ...validEvidence, workId: "other" } }],
    ["missing source ref", { evidence: { ...validEvidence, claims: [{ id: "C1", sourceIds: ["S9"] }, validEvidence.claims[1]] } }],
    ["ungrounded high risk", { draft: validDraft.replace("它值得看", "它是最早的作品，值得看") }],
  ]) {
    await writeFixture(mutation);
    assert.equal((await verify()).status, "failed", label);
  }

  await writeFixture();
  await fs.writeFile(path.join(root, "research/content/seattle.md"), "changed production content\n");
  assert.equal((await verify()).status, "failed", "production mutation");
  process.stdout.write("Sea Change direct-write fixtures passed: routing, forbidden inputs/outputs, evidence, identity and production protection\n");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
