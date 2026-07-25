import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";

const evidencePattern = /<!--\s*meowseum-downstream-evidence\/1\.0\s*\n([\s\S]*?)\n-->/;
const complexRiskFlags = new Set([
  "identity_conflict",
  "attribution_or_date_conflict",
  "rare_candidate",
  "superlative_claim",
  "composite_or_parent_child",
  "architecture_or_site",
  "insufficient_official_sources",
  "availability_ambiguity",
  "cross_source_synthesis"
]);

export function parseResearchCard(text, sourcePath) {
  const match = text.match(evidencePattern);
  if (!match) throw new Error(`${sourcePath}: missing meowseum-downstream-evidence/1.0 block`);
  const evidence = JSON.parse(match[1]);
  const required = ["workId", "riskFlags", "selectionEvidence", "structureSummary"];
  for (const field of required) if (evidence[field] === undefined) throw new Error(`${sourcePath}: missing ${field}`);
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(evidence.workId)) throw new Error(`${sourcePath}: invalid workId`);
  if (!Array.isArray(evidence.riskFlags) || evidence.riskFlags.some(flag => !complexRiskFlags.has(flag))) {
    throw new Error(`${sourcePath}: invalid riskFlags`);
  }
  const researchComplexity = evidence.riskFlags.length ? "complex" : "standard";
  if (evidence.researchComplexity && evidence.researchComplexity !== researchComplexity) {
    throw new Error(`${sourcePath}: researchComplexity does not match riskFlags`);
  }
  if (evidence.selectionEvidence.rareCandidate && !evidence.riskFlags.includes("rare_candidate")) {
    throw new Error(`${sourcePath}: rare candidate cannot use the standard research route`);
  }
  const selectionFields = [
    "collectionIdentity", "availability", "imageStrategy", "importanceCandidate", "rareCandidate",
    "nearestComparators", "decisiveDifference", "independentCollectionLine", "parentRelationship",
    "requiresFullCard", "sourceClaimIds"
  ];
  const structureFields = ["coreValue", "mediumPeriod", "sectionSignals", "routeRole", "sourceClaimIds"];
  for (const field of selectionFields) {
    if (!(field in evidence.selectionEvidence)) throw new Error(`${sourcePath}: selectionEvidence missing ${field}`);
  }
  for (const field of structureFields) {
    if (!(field in evidence.structureSummary)) throw new Error(`${sourcePath}: structureSummary missing ${field}`);
  }
  if (typeof evidence.selectionEvidence.rareCandidate !== "boolean") {
    throw new Error(`${sourcePath}: rareCandidate must be boolean`);
  }
  if (typeof evidence.selectionEvidence.requiresFullCard !== "boolean") {
    throw new Error(`${sourcePath}: requiresFullCard must be boolean`);
  }
  if (!Array.isArray(evidence.structureSummary.sectionSignals)) {
    throw new Error(`${sourcePath}: sectionSignals must be an array`);
  }
  for (const section of ["selectionEvidence", "structureSummary"]) {
    const refs = evidence[section].sourceClaimIds;
    if (!Array.isArray(refs) || !refs.length) throw new Error(`${sourcePath}: ${section} needs sourceClaimIds`);
    for (const ref of refs) {
      if (!new RegExp(`\\[${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`).test(text)) {
        throw new Error(`${sourcePath}: unresolved research claim ${ref}`);
      }
    }
  }
  return {
    workId: evidence.workId,
    researchComplexity,
    riskFlags: evidence.riskFlags,
    selectionEvidence: evidence.selectionEvidence,
    structureSummary: evidence.structureSummary
  };
}

async function findCards(root) {
  const cards = [];
  for (const entry of await fs.readdir(root, {withFileTypes: true})) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory() && !["candidate", "archive", "superseded"].includes(entry.name)) cards.push(...await findCards(target));
    else if (entry.isFile() && /-research-card\.md$/i.test(entry.name)) cards.push(target);
  }
  return cards;
}

export async function buildMuseumWorkIndex({projectRoot, runRoot}) {
  const cards = await findCards(runRoot);
  if (!cards.length) throw new Error("no research cards found");
  const works = [];
  const seen = new Set();
  for (const cardPath of cards.sort()) {
    const text = await fs.readFile(cardPath, "utf8");
    const parsed = parseResearchCard(text, path.relative(projectRoot, cardPath).replaceAll("\\", "/"));
    if (seen.has(parsed.workId)) throw new Error(`duplicate research workId: ${parsed.workId}`);
    seen.add(parsed.workId);
    works.push({
      ...parsed,
      researchCardPath: path.relative(projectRoot, cardPath).replaceAll("\\", "/"),
      researchCardSha256: crypto.createHash("sha256").update(text).digest("hex"),
      ...(parsed.selectionEvidence.requiresFullCard
        ? {fullCardFallback: path.relative(projectRoot, cardPath).replaceAll("\\", "/")}
        : {})
    });
  }
  return {schemaVersion: "museum-work-index/1.0", works};
}

async function main() {
  const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
  const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const runRoot = path.resolve(projectRoot, argument("--run-root") || "");
  const output = path.resolve(projectRoot, argument("--output") || path.join(runRoot, "museum-work-index.json"));
  if (!argument("--run-root")) throw new Error("--run-root=<directory> is required");
  if (!runRoot.startsWith(`${projectRoot}${path.sep}`) || !output.startsWith(`${projectRoot}${path.sep}`)) throw new Error("path escaped project root");
  const index = await buildMuseumWorkIndex({projectRoot, runRoot});
  await fs.writeFile(output, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(`prepared museum work index: ${index.works.length} works`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
