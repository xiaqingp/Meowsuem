import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPathInside,
  loadManifest,
  resolveRunRoot,
} from "../lib/filesystem-contract.mjs";

export const experimentCaseId = "sea-change-sol-direct-write";
export const directWriteModel = "gpt-5.6-sol";
export const directWriteEffort = "medium";

export function assertDirectWriteRunDescriptor(descriptor) {
  if (descriptor.runKind !== "experiment" || descriptor.caseId !== experimentCaseId) {
    throw new Error("direct-write runner requires the canonical non-publishable experiment run");
  }
  return descriptor;
}

export function normalizeDirectWriteEvidence(evidence) {
  const sources = (evidence.sources ?? []).map((source) => ({
    ...source,
    id: source.id ?? source.sourceId,
    sourceType: source.sourceType ?? (source.type === "official_museum_object_page" ? "museum" : source.type),
  }));
  const officialId = sources.find((source) => source.sourceType === "museum")?.id;
  const claims = (evidence.claims ?? []).map((claim) => ({
    ...claim,
    id: claim.id ?? claim.claimId,
    summary: claim.summary ?? claim.text,
  }));
  const highRiskClaims = (evidence.highRiskClaims ?? []).map((claim) => ({
    ...claim,
    ...(claim.assessment === "contradicted_by_official_label" && !claim.sourceIds?.length && officialId
      ? { sourceIds: [officialId] }
      : {}),
  }));
  return { ...evidence, sources, claims, highRiskClaims };
}

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const exists = (target) => fs.access(target).then(() => true).catch(() => false);

async function walk(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

export async function snapshotProtectedPaths(projectRoot, protectedPaths) {
  const snapshot = {};
  for (const relative of protectedPaths) {
    const target = path.resolve(projectRoot, relative);
    await assertPathInside(projectRoot, target);
    const stat = await fs.stat(target);
    const files = stat.isDirectory() ? await walk(target) : [target];
    for (const file of files.sort()) {
      const key = path.relative(projectRoot, file).replaceAll("\\", "/");
      snapshot[key] = sha256(await fs.readFile(file));
    }
  }
  return snapshot;
}

function characterNgrams(text, size = 12) {
  const normalized = text.replace(/\s+/g, "");
  const grams = new Set();
  for (let index = 0; index <= normalized.length - size; index += 1) {
    grams.add(normalized.slice(index, index + size));
  }
  return grams;
}

function similarity(left, right) {
  const a = characterNgrams(left);
  const b = characterNgrams(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const gram of a) if (b.has(gram)) overlap += 1;
  return overlap / Math.min(a.size, b.size);
}

export async function verifyDirectWriteOutput({
  projectRoot,
  runRoot,
  expectedInput,
  protectedSnapshot,
  protectedPaths,
  oldDraftPath,
}) {
  const failures = [];
  const inputPath = path.join(runRoot, "input", "work-input.json");
  const draftPath = path.join(runRoot, "output", "draft.md");
  const evidencePath = path.join(runRoot, "output", "evidence.json");
  for (const target of [inputPath, draftPath, evidencePath]) {
    await assertPathInside(runRoot, target);
    if (!(await exists(target))) failures.push(`missing required file: ${path.relative(runRoot, target)}`);
  }
  const forbidden = (await walk(runRoot)).filter((file) =>
    /(?:research[-_]?card|writing[-_]?plan|story[-_]?beats|author[-_]?bundle)/i.test(path.basename(file)),
  );
  if (forbidden.length) failures.push(`forbidden artifacts generated: ${forbidden.map((file) => path.relative(runRoot, file)).join(", ")}`);
  if (failures.length) return { status: "failed", failures };

  const input = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8"));
  const draft = await fs.readFile(draftPath, "utf8");
  if (/(?:research[-_ ]?card|writing[-_ ]?plan)/i.test(JSON.stringify(input))) {
    failures.push("locked model input contains an old Research Card or Writing Plan reference");
  }
  for (const field of ["museumId", "workId", "title", "artist", "date", "medium", "accessionNumber", "officialObjectUrl", "verifiedImage"]) {
    if (input[field] !== expectedInput[field]) failures.push(`locked input drift: ${field}`);
  }
  if (evidence.museumId !== expectedInput.museumId) failures.push("evidence museumId drift");
  if (evidence.workId !== expectedInput.workId) failures.push("evidence workId drift");
  if (evidence.model !== directWriteModel) failures.push("only gpt-5.6-sol is allowed");
  if (evidence.reasoningEffort !== directWriteEffort) failures.push("reasoning effort must be medium");
  for (const heading of ["# Sea Change", "## 短摘要", "## 30 秒先懂", "## 多停几分钟", "## 最后再看一眼"]) {
    if (!draft.includes(heading)) failures.push(`draft missing heading: ${heading}`);
  }
  if (/\b(?:S|C)\d+\b/.test(draft)) failures.push("draft leaks internal source or claim IDs");
  if (/(?:TODO|TBD|待补|占位符|placeholder)/i.test(draft)) failures.push("draft contains an internal placeholder");

  const sources = Array.isArray(evidence.sources) ? evidence.sources : [];
  const claims = Array.isArray(evidence.claims) ? evidence.claims : [];
  const sourceIds = sources.map((source) => source.id);
  const claimIds = claims.map((claim) => claim.id);
  if (new Set(sourceIds).size !== sourceIds.length) failures.push("source IDs are not unique");
  if (new Set(claimIds).size !== claimIds.length) failures.push("claim IDs are not unique");
  for (const claim of claims) {
    for (const sourceId of claim.sourceIds ?? []) {
      if (!sourceIds.includes(sourceId)) failures.push(`claim ${claim.id} references missing source ${sourceId}`);
    }
  }
  const officialSupports = new Set(
    sources
      .filter((source) => source.sourceType === "museum" && source.url === expectedInput.officialObjectUrl)
      .flatMap((source) => source.supports ?? []),
  );
  for (const field of ["identity", "date", "medium", "accessionNumber", "collectionRelation"]) {
    if (!officialSupports.has(field)) failures.push(`official source does not support ${field}`);
  }
  if (!claims.some((claim) => claim.evidenceType === "verified_image_observation")) {
    failures.push("no claim is labeled verified_image_observation");
  }
  if (
    expectedInput.currentDisplayStatus === "unknown" &&
    !/(?:当前|现时|目前).{0,8}是否.{0,8}(?:展出|展陈|在展)|(?:当前|现时|目前).{0,24}(?:无法确认|不能确认|未明确|不确定|需.{0,4}核验)|(?:参观前|到访前).{0,24}(?:核验|查询|查|确认)/s.test(draft)
  ) {
    failures.push("unknown display status is not expressed conservatively");
  }
  const riskyTerms = [...draft.matchAll(/首次|唯一|最早|奠基/g)].map((match) => match[0]);
  const highRiskClaims = Array.isArray(evidence.highRiskClaims) ? evidence.highRiskClaims : [];
  if (riskyTerms.length && highRiskClaims.length === 0) failures.push("draft contains a high-risk assertion without highRiskClaims evidence");
  for (const claim of highRiskClaims) {
    if (
      claim.assessment !== "not_supported" &&
      (!(claim.sourceIds?.length) || claim.sourceIds.some((id) => !sourceIds.includes(id)))
    ) {
      failures.push("high-risk claim lacks valid source evidence");
    }
  }

  const oldDraft = await fs.readFile(oldDraftPath, "utf8");
  const copySimilarity = similarity(oldDraft, draft);
  if (oldDraft.replace(/\s+/g, "") === draft.replace(/\s+/g, "") || copySimilarity >= 0.65) {
    failures.push(`new draft is too similar to old draft (${copySimilarity.toFixed(3)})`);
  }
  const protectedAfter = await snapshotProtectedPaths(projectRoot, protectedPaths);
  const beforeKeys = Object.keys(protectedSnapshot).sort();
  const afterKeys = Object.keys(protectedAfter).sort();
  if (JSON.stringify(beforeKeys) !== JSON.stringify(afterKeys)) failures.push("protected production file set changed");
  for (const key of beforeKeys) {
    if (protectedSnapshot[key] !== protectedAfter[key]) failures.push(`protected production file changed: ${key}`);
  }

  return {
    status: failures.length ? "failed" : "passed",
    failures,
    checks: {
      identityLocked: !failures.some((item) => item.includes("drift")),
      requiredOutputs: true,
      forbiddenArtifactsAbsent: forbidden.length === 0,
      sourceIdsUnique: new Set(sourceIds).size === sourceIds.length,
      claimIdsUnique: new Set(claimIds).size === claimIds.length,
      claimReferencesResolved: !failures.some((item) => item.includes("references missing source")),
      officialIdentityEvidence: !failures.some((item) => item.startsWith("official source")),
      verifiedImageObservation: claims.some((claim) => claim.evidenceType === "verified_image_observation"),
      displayStatusConservative: !failures.some((item) => item.includes("display status")),
      highRiskClaimsGrounded: !failures.some((item) => item.includes("high-risk")),
      noInternalPlaceholders: !failures.some((item) => item.includes("placeholder")),
      notDirectCopy: copySimilarity < 0.65,
      protectedProductionUnchanged: !failures.some((item) => item.includes("protected production")),
      oldDraftSimilarity: Number(copySimilarity.toFixed(3)),
    },
    draftBytes: Buffer.byteLength(draft),
    evidenceBytes: Buffer.byteLength(JSON.stringify(evidence, null, 2) + "\n"),
    sourceCount: sources.length,
  };
}

function parseArgs(argv) {
  return Object.fromEntries(argv.map((arg) => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args["run-id"]) throw new Error("--run-id is required");
  const projectRoot = path.resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const manifest = await loadManifest(projectRoot);
  const runRoot = resolveRunRoot({
    projectRoot,
    manifest,
    runKind: "experiment",
    caseId: experimentCaseId,
    runId: args["run-id"],
  });
  const expectedInput = JSON.parse(await fs.readFile(path.join(runRoot, "input/work-input.json"), "utf8"));
  const protection = JSON.parse(await fs.readFile(path.join(runRoot, "input/production-snapshot.json"), "utf8"));
  const result = await verifyDirectWriteOutput({
    projectRoot,
    runRoot,
    expectedInput,
    protectedSnapshot: protection.snapshot,
    protectedPaths: protection.paths,
    oldDraftPath: path.join(projectRoot, "research/runs/production/seattle/m28-12-seattle/works/sea-change/draft.md"),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "passed") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
