import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const [runRootArg, mode] = process.argv.slice(2);
if (!runRootArg) throw new Error("usage: node research/m28-4/muxin/scaffold-author-runs.mjs <run-root> [--museum-structure]");

const projectRoot = process.cwd();
const runRoot = path.resolve(runRootArg);
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "research/content-standard-manifest.json"), "utf8"));
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relative = file => path.relative(projectRoot, file).replaceAll("\\", "/");
const pipelinePath = path.join(projectRoot, manifest.canonicalPipeline);
const instructionPath = path.join(projectRoot, manifest.canonicalInstruction);
const runnerPath = path.join(projectRoot, manifest.canonicalRunner);
const selectionRoot = path.join(runRoot, "museum-selection-v3");
const evidencePath = path.join(selectionRoot, "museum-evidence.json");
const ratingPath = path.join(selectionRoot, "museum-rating.json");
const ratingResultPath = path.join(selectionRoot, "museum-rating-result.json");
const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
const ratingResult = JSON.parse(fs.readFileSync(ratingResultPath, "utf8"));
if (!ratingResult.ok || evidence.works.length !== 20) throw new Error("museum rating gate has not passed for 20 works");

const cardById = new Map();
const supplementById = new Map();
for (const directoryName of ["research-batch-01", "research-batch-02", "replacement-research"]) {
  const directory = path.join(runRoot, directoryName);
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith("-research-card.md")).sort()) {
    const workId = name.replace("-research-card.md", "");
    cardById.set(workId, path.join(directory, name));
  }
}
for (const directoryName of ["research-gap-01", "research-gap-02"]) {
  const directory = path.join(runRoot, directoryName);
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith("-research-supplement.md")).sort()) {
    const workId = name.replace("-research-supplement.md", "");
    supplementById.set(workId, path.join(directory, name));
  }
}
const selectedIds = evidence.works.map(work => work.workId);
for (const workId of selectedIds) {
  if (!cardById.has(workId)) throw new Error(`missing selected research card: ${workId}`);
}

const canonicalInputs = [
  { path: manifest.canonicalPipeline, sha256: sha256(pipelinePath) },
  { path: manifest.canonicalInstruction, sha256: sha256(instructionPath) }
];
const selectedCardInputs = selectedIds.map(workId => {
  const file = cardById.get(workId);
  return { path: relative(file), sha256: sha256(file) };
});
const selectedSupplementInputs = selectedIds
  .filter(workId => supplementById.has(workId))
  .map(workId => {
    const file = supplementById.get(workId);
    return { path: relative(file), sha256: sha256(file) };
  });

if (mode === "--museum-structure") {
  const integrationRoot = path.join(runRoot, "integration");
  fs.mkdirSync(integrationRoot, { recursive: true });
  const headerPath = path.join(integrationRoot, "run-header.json");
  if (fs.existsSync(headerPath)) throw new Error(`museum structure header already exists: ${relative(headerPath)}`);
  const header = {
    runId: "m28-4-muxin-museum-structure-2026-07-23",
    startedAt: new Date().toISOString(),
    stage: "museum_structure",
    researchMode: "fresh_locked_research_cards_after_verified_selection",
    museumId: "muxin",
    museumIdentity: { zh: "木心美术馆", en: "Mu Xin Art Museum", location: "Wuzhen, Zhejiang, China" },
    workIds: selectedIds,
    pipelineVersion: manifest.pipelineVersion,
    instructionVersion: manifest.currentVersion,
    executionProfile: {
      model: manifest.executionProfile.model,
      reasoningEffort: manifest.executionProfile.reasoningEffort,
      runner: manifest.canonicalRunner,
      runnerSha256: sha256(runnerPath)
    },
    allowedInputs: [
      ...canonicalInputs,
      { path: relative(evidencePath), sha256: sha256(evidencePath) },
      { path: relative(ratingPath), sha256: sha256(ratingPath) },
      ...selectedCardInputs,
      ...selectedSupplementInputs
    ],
    outputs: ["museum-plan.json", "museum-copy.md"],
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "whole_museum_candidate_no_production_write"
  };
  fs.writeFileSync(headerPath, `${JSON.stringify(header, null, 2)}\n`, "utf8");
  console.log(`scaffolded museum structure run with ${selectedIds.length} selected research cards`);
  process.exit(0);
}

const planPath = path.join(runRoot, "integration", "museum-plan.json");
if (!fs.existsSync(planPath)) throw new Error("museum structure must complete before author runs");
const worksRoot = path.join(runRoot, "works");
fs.mkdirSync(worksRoot, { recursive: true });
let count = 0;
for (const work of evidence.works) {
  const workId = work.workId;
  const workRoot = path.join(worksRoot, workId);
  fs.mkdirSync(workRoot, { recursive: true });
  const headerPath = path.join(workRoot, "run-header.json");
  if (fs.existsSync(headerPath)) throw new Error(`author header already exists: ${relative(headerPath)}`);
  const selectionPath = path.join(workRoot, "work-selection.json");
  fs.writeFileSync(selectionPath, `${JSON.stringify({
    museumId: evidence.museumId,
    museumScore: JSON.parse(fs.readFileSync(ratingPath, "utf8")).score,
    ...work
  }, null, 2)}\n`, "utf8");
  const cardPath = cardById.get(workId);
  const authorCardPath = path.join(workRoot, "author-input-research.md");
  const authorCardRecordPath = path.join(workRoot, "author-input-research-record.json");
  execFileSync(process.execPath, [
    path.join(projectRoot, "scripts/prepare-author-research-input.mjs"),
    "--source", relative(cardPath),
    "--selection", relative(selectionPath),
    "--out", relative(authorCardPath),
    "--record", relative(authorCardRecordPath)
  ], { cwd: projectRoot, stdio: "inherit" });
  const inputs = [
    ...canonicalInputs,
    { path: relative(authorCardPath), sha256: sha256(authorCardPath) },
    { path: relative(authorCardRecordPath), sha256: sha256(authorCardRecordPath) }
  ];
  if (supplementById.has(workId)) {
    const supplementPath = supplementById.get(workId);
    const authorSupplementPath = path.join(workRoot, "author-input-supplement.md");
    const authorSupplementRecordPath = path.join(workRoot, "author-input-supplement-record.json");
    execFileSync(process.execPath, [
      path.join(projectRoot, "scripts/prepare-author-research-input.mjs"),
      "--source", relative(supplementPath),
      "--selection", relative(selectionPath),
      "--out", relative(authorSupplementPath),
      "--record", relative(authorSupplementRecordPath)
    ], { cwd: projectRoot, stdio: "inherit" });
    inputs.push(
      { path: relative(authorSupplementPath), sha256: sha256(authorSupplementPath) },
      { path: relative(authorSupplementRecordPath), sha256: sha256(authorSupplementRecordPath) }
    );
  }
  inputs.push(
    { path: relative(selectionPath), sha256: sha256(selectionPath) },
    { path: relative(planPath), sha256: sha256(planPath) }
  );
  const header = {
    runId: `m28-4-muxin-author-${workId}-2026-07-23`,
    startedAt: new Date().toISOString(),
    stage: "author",
    researchMode: "fresh_locked_research_card_after_verified_selection",
    museumId: "muxin",
    workId,
    workIdentity: work.identityNote,
    pipelineVersion: manifest.pipelineVersion,
    instructionVersion: manifest.currentVersion,
    executionProfile: {
      model: manifest.executionProfile.model,
      reasoningEffort: manifest.executionProfile.reasoningEffort,
      runner: manifest.canonicalRunner,
      runnerSha256: sha256(runnerPath)
    },
    allowedInputs: inputs,
    outputs: manifest.executionProfile.authorBundleOutputs,
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "whole_museum_candidate_no_production_write"
  };
  fs.writeFileSync(headerPath, `${JSON.stringify(header, null, 2)}\n`, "utf8");
  count += 1;
}
console.log(`scaffolded ${count} author runs`);
