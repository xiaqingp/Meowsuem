import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-6", "vienna");
const worksRoot = path.join(runRoot, "works");
fs.mkdirSync(worksRoot, { recursive: true });
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relative = file => path.relative(root, file).replaceAll("\\", "/");

const evidence = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-selection", "museum-evidence.json"), "utf8"));
const evidenceById = new Map(evidence.works.map(work => [work.workId, work]));
const researchById = new Map();
const identityById = new Map();
for (let batch = 1; batch <= 4; batch += 1) {
  const directory = path.join(runRoot, `research-batch-${String(batch).padStart(2, "0")}`);
  const header = JSON.parse(fs.readFileSync(path.join(directory, "run-header.json"), "utf8"));
  const result = JSON.parse(fs.readFileSync(path.join(directory, "research-result.json"), "utf8"));
  for (const work of header.works) {
    const output = result.outputs.find(item => item.path === `${work.workId}-research-card.md`);
    const file = path.join(directory, output.path);
    if (!output || sha256(file) !== output.sha256) throw new Error(`invalid research card: ${work.workId}`);
    researchById.set(work.workId, { file, sha256: output.sha256 });
    identityById.set(work.workId, work.workIdentity);
  }
}

const instructionPath = path.join(root, "research", "meowseum-content-instruction.md");
const runnerPath = path.join(root, "scripts", "run-isolated-generation.ps1");
for (const [workId, research] of researchById) {
  const selection = evidenceById.get(workId);
  if (!selection?.identityStable) throw new Error(`selection not stable: ${workId}`);
  const workRoot = path.join(worksRoot, workId);
  fs.mkdirSync(workRoot, { recursive: true });
  const context = {
    schemaVersion: "work-context/1.0",
    museumId: "vienna",
    workId,
    workIdentity: identityById.get(workId),
    identityStable: selection.identityStable,
    availability: selection.availability,
    imagePolicy: selection.imagePolicy,
    significance: selection.significance,
    rareGatePassed: selection.rareGatePassed,
    nearestComparator: selection.nearestComparator,
    ratingRole: selection.ratingRole,
    parentOrWholeWorkId: selection.parentOrWholeWorkId
  };
  const contextPath = path.join(workRoot, "work-context.json");
  fs.writeFileSync(contextPath, `${JSON.stringify(context, null, 2)}\n`, "utf8");
  const header = {
    runId: `m28-6-vienna-author-${workId}-2026-07-24`,
    startedAt: new Date().toISOString(),
    stage: "author",
    researchMode: "fresh_locked_research_card",
    museumId: "vienna",
    workId,
    workIdentity: identityById.get(workId),
    pipelineVersion: "2.4.8",
    instructionVersion: "2.0.2",
    inputContractVersion: 1,
    executionProfile: {
      model: "gpt-5.6-sol",
      reasoningEffort: "medium",
      runner: "scripts/run-isolated-generation.ps1",
      runnerSha256: sha256(runnerPath)
    },
    allowedInputs: [
      { path: relative(instructionPath), role: "content_instruction", sha256: sha256(instructionPath) },
      { path: relative(research.file), role: "research_card", sha256: research.sha256 },
      { path: relative(contextPath), role: "work_context", sha256: sha256(contextPath) }
    ],
    outputs: ["writing-plan.json", "card.txt", "draft.md"],
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "whole_museum_candidate_no_production_write"
  };
  fs.writeFileSync(path.join(workRoot, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
}

console.log(`scaffolded ${researchById.size} isolated author runs`);
