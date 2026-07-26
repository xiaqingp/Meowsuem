import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPathInside,
  loadManifest,
  resolveRunRoot,
} from "../lib/filesystem-contract.mjs";

export const experimentCaseId = "sea-change-sol-one-shot-writing-v2";
export const experimentModel = "gpt-5.6-sol";
export const experimentEffort = "medium";

const forbiddenArtifact = /(?:research[-_ ]?card|writing[-_ ]?plan|claim[-_ ]?ledger|story[-_ ]?beats|reviewer[-_ ]?output)/i;
const forbiddenInput = /(?:research[-_ ]?card|writing[-_ ]?plan|old[-_ ]?(?:card|draft)|claim[-_ ]?ledger|story[-_ ]?beats|valueType|mustNotAssume)/i;
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

export function assertOneShotDescriptor(descriptor, expectedCaseId = experimentCaseId) {
  if (descriptor.runKind !== "experiment" || descriptor.caseId !== expectedCaseId) {
    throw new Error("one-shot v2 requires the canonical non-publishable experiment run");
  }
  return descriptor;
}

export async function assertExperimentOutputPath(runRoot, target) {
  await assertPathInside(runRoot, target);
  return target;
}

export function assertCleanLockedMetadata(metadata) {
  const serialized = JSON.stringify(metadata);
  if (forbiddenInput.test(serialized)) {
    throw new Error("locked metadata contains a forbidden old authoring artifact");
  }
  const required = [
    "museumId", "workId", "objectType", "titleZh", "titleEn", "artistZh", "artistEn",
    "displayDate", "medium", "accessionNumber", "museumName", "officialObjectUrl",
    "verifiedImage", "significance", "priority", "sectionId", "stay",
  ];
  for (const field of required) {
    if (!metadata[field]) throw new Error(`locked metadata missing ${field}`);
  }
  if (metadata.museumId !== "seattle" || metadata.workId !== "sea-change") {
    throw new Error("locked metadata identity drift");
  }
  return metadata;
}

export async function snapshotProtectedPaths(projectRoot, protectedPaths) {
  const snapshot = {};
  for (const relative of protectedPaths) {
    const target = path.resolve(projectRoot, relative);
    await assertPathInside(projectRoot, target);
    const stat = await fs.stat(target);
    const files = stat.isDirectory() ? await walk(target) : [target];
    for (const file of files.sort()) {
      snapshot[path.relative(projectRoot, file).replaceAll("\\", "/")] = sha256(await fs.readFile(file));
    }
  }
  return snapshot;
}

function sectionBody(article, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return article.match(new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |$)`, "m"))?.[1]?.trim() ?? "";
}

function middleSections(article) {
  return [...article.matchAll(/^## (.+)$/gm)]
    .map((match) => match[1].trim())
    .filter((heading) => heading !== "一分钟看懂" && heading !== "最后再看一眼");
}

export function extractCard(article) {
  const quick = sectionBody(article, "一分钟看懂");
  if (!quick) throw new Error("article has no 一分钟看懂 section");
  const firstParagraph = quick.split(/\n\s*\n/).map((part) => part.trim()).find(Boolean);
  if (!firstParagraph) throw new Error("一分钟看懂 has no paragraph");
  return `${firstParagraph}\n`;
}

export function buildDisplayMetadata(locked) {
  return {
    by: `${locked.artistZh}（${locked.artistEn}）`,
    date: locked.displayDate,
    material: locked.medium,
    place: `${locked.museumName}，馆藏号${locked.accessionNumber}`,
    priority: locked.priority,
    significance: locked.significance,
    stay: locked.stay,
    availability: locked.availability,
    imagePolicy: locked.imagePolicy,
    officialObjectUrl: locked.officialObjectUrl,
    verifiedImage: locked.verifiedImage,
    sectionId: locked.sectionId,
  };
}

export async function verifyOneShotOutput({
  projectRoot,
  runRoot,
  expectedMetadata,
  protectedPaths,
  protectedSnapshot,
  model = experimentModel,
  reasoningEffort = experimentEffort,
  allowedModel = experimentModel,
  allowedReasoningEffort = experimentEffort,
}) {
  const failures = [];
  const lockedPath = path.join(runRoot, "input/locked-metadata.json");
  const articlePath = path.join(runRoot, "output/article.md");
  const sourcesPath = path.join(runRoot, "output/sources.json");
  for (const target of [lockedPath, articlePath, sourcesPath]) {
    await assertExperimentOutputPath(runRoot, target);
    if (!(await exists(target))) failures.push(`missing required file: ${path.relative(runRoot, target)}`);
  }

  const forbidden = (await walk(runRoot)).filter((file) => forbiddenArtifact.test(path.basename(file)));
  if (forbidden.length) {
    failures.push(`forbidden artifacts generated: ${forbidden.map((file) => path.relative(runRoot, file)).join(", ")}`);
  }
  if (failures.length) return { status: "failed", failures };

  const locked = JSON.parse(await fs.readFile(lockedPath, "utf8"));
  const sources = JSON.parse(await fs.readFile(sourcesPath, "utf8"));
  const article = await fs.readFile(articlePath, "utf8");
  try { assertCleanLockedMetadata(locked); } catch (error) { failures.push(error.message); }

  for (const field of Object.keys(expectedMetadata)) {
    if (JSON.stringify(locked[field]) !== JSON.stringify(expectedMetadata[field])) {
      failures.push(`locked metadata drift: ${field}`);
    }
  }
  if (model !== allowedModel) failures.push(`only ${allowedModel} is allowed`);
  if (reasoningEffort !== allowedReasoningEffort) {
    failures.push(`reasoning effort must be ${allowedReasoningEffort}`);
  }
  if (sources.museumId !== "seattle" || sources.workId !== "sea-change") {
    failures.push("sources identity drift");
  }
  if (!/^# 《海变》 \/ Sea Change\s*$/m.test(article)) failures.push("article title drift");
  if (!sectionBody(article, "一分钟看懂")) failures.push("article missing 一分钟看懂");
  if (!sectionBody(article, "最后再看一眼")) failures.push("article missing 最后再看一眼");
  if (middleSections(article).length < 1) failures.push("article has no free-form middle section");
  if (/(?:TODO|TBD|placeholder|占位符|内部 prompt|系统提示|chain of thought)/i.test(article)) {
    failures.push("article leaks an internal prompt or placeholder");
  }
  if (/\[(?:R|S|C)\d+\]/.test(article)) failures.push("article leaks internal reference IDs");

  const sourceRecords = Array.isArray(sources.sources) ? sources.sources : [];
  if (!sourceRecords.length) failures.push("sources are empty");
  const allowedTypes = new Set(["museum", "academic", "foundation", "publication", "media", "other"]);
  for (const [index, source] of sourceRecords.entries()) {
    try { new URL(source.url); } catch { failures.push(`source ${index + 1} has invalid URL`); }
    if (!source.title || !source.publisher) failures.push(`source ${index + 1} lacks title or publisher`);
    if (!allowedTypes.has(source.sourceType)) failures.push(`source ${index + 1} has invalid sourceType`);
    if (!Array.isArray(source.usedFor) || !source.usedFor.length) failures.push(`source ${index + 1} has empty usedFor`);
  }
  const official = sourceRecords.find((source) => source.url === locked.officialObjectUrl && source.sourceType === "museum");
  if (!official) failures.push("official object source is missing");
  const officialUses = new Set(official?.usedFor ?? []);
  for (const use of ["identity", "date", "material"]) {
    if (!officialUses.has(use)) failures.push(`official object source does not cover ${use}`);
  }

  const certaintyClaim = /(?:目前|当前|现正|正在).{0,20}(?:SAM|西雅图艺术博物馆).{0,12}(?:展出|在展)/s.test(article);
  const uncertaintyLanguage = /(?:无法确认|不能确认|尚未确认|未明确|是否在展|参观前.{0,12}(?:查询|核验|确认))/s.test(article);
  if (locked.availability !== "confirmed_on_view" && certaintyClaim && !uncertaintyLanguage) {
    failures.push("unknown display status is stated as certain");
  }

  const highRiskTerms = /(?:第一|唯一|最早|最大|奠基|明确意图|[“"][^”"]{4,}[”"])/.test(article);
  if (highRiskTerms && !(Array.isArray(sources.highRiskClaims) && sources.highRiskClaims.length)) {
    failures.push("article has a quotation or superlative without a high-risk record");
  }

  const after = await snapshotProtectedPaths(projectRoot, protectedPaths);
  const beforeKeys = Object.keys(protectedSnapshot).sort();
  const afterKeys = Object.keys(after).sort();
  if (JSON.stringify(beforeKeys) !== JSON.stringify(afterKeys)) failures.push("protected production file set changed");
  for (const key of beforeKeys) {
    if (protectedSnapshot[key] !== after[key]) failures.push(`protected production file changed: ${key}`);
  }

  return {
    status: failures.length ? "failed" : "passed",
    failures,
    checks: {
      experimentOnly: true,
      identityLocked: !failures.some((failure) => failure.includes("drift")),
      modelAndEffortLocked: model === allowedModel && reasoningEffort === allowedReasoningEffort,
      requiredOutputs: !failures.some((failure) => failure.startsWith("missing required")),
      forbiddenArtifactsAbsent: forbidden.length === 0,
      requiredArticleSections: !failures.some((failure) => failure.startsWith("article missing") || failure.includes("middle section")),
      sourcesStructured: !failures.some((failure) => failure.startsWith("source") || failure.startsWith("sources")),
      officialSourcePresent: Boolean(official),
      displayStatusConservative: !failures.some((failure) => failure.includes("display status")),
      highRiskRecorded: !failures.some((failure) => failure.includes("high-risk")),
      productionUnchanged: !failures.some((failure) => failure.includes("protected production")),
    },
    middleHeadings: middleSections(article),
    sourceCount: sourceRecords.length,
    articleBytes: Buffer.byteLength(article),
    sourcesBytes: Buffer.byteLength(`${JSON.stringify(sources, null, 2)}\n`),
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
  const locked = JSON.parse(await fs.readFile(path.join(runRoot, "input/locked-metadata.json"), "utf8"));
  const protection = JSON.parse(await fs.readFile(path.join(runRoot, "input/production-snapshot.json"), "utf8"));
  const result = await verifyOneShotOutput({
    projectRoot,
    runRoot,
    expectedMetadata: locked,
    protectedPaths: protection.paths,
    protectedSnapshot: protection.snapshot,
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
