import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [runRootArg, mode] = process.argv.slice(2);
if (!runRootArg) throw new Error("usage: node scripts/scaffold-museum-author-runs.mjs <run-root>");

const projectRoot = process.cwd();
const runRoot = path.resolve(runRootArg);
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "research/content-standard-manifest.json"), "utf8"));
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relative = file => path.relative(projectRoot, file).replaceAll("\\", "/");

const pipelinePath = path.join(projectRoot, manifest.canonicalPipeline);
const instructionPath = path.join(projectRoot, manifest.canonicalInstruction);
const runnerPath = path.join(projectRoot, manifest.canonicalRunner);
const worksRoot = path.join(runRoot, "works");
fs.mkdirSync(worksRoot, { recursive: true });

if (mode === "--museum-structure") {
  const cards = [];
  const workIds = [];
  for (const batchName of fs.readdirSync(runRoot).filter(name => name.startsWith("research-batch-")).sort()) {
    const batchRoot = path.join(runRoot, batchName);
    const researchHeader = JSON.parse(fs.readFileSync(path.join(batchRoot, "run-header.json"), "utf8"));
    const researchResult = JSON.parse(fs.readFileSync(path.join(batchRoot, "research-result.json"), "utf8"));
    for (const work of researchHeader.works) {
      const cardName = `${work.workId}-research-card.md`;
      const cardResult = researchResult.outputs.find(output => output.path === cardName);
      const cardPath = path.join(batchRoot, cardName);
      if (!cardResult || sha256(cardPath) !== cardResult.sha256) throw new Error(`invalid research card: ${cardName}`);
      cards.push({ path: relative(cardPath), sha256: cardResult.sha256 });
      workIds.push(work.workId);
    }
  }
  const integrationRoot = path.join(runRoot, "integration");
  const comparisonPath = path.join(integrationRoot, "comparison-ratings.json");
  const headerPath = path.join(integrationRoot, "run-header.json");
  if (!fs.existsSync(comparisonPath)) throw new Error(`missing comparison ratings: ${relative(comparisonPath)}`);
  if (fs.existsSync(headerPath)) throw new Error(`museum structure header already exists: ${relative(headerPath)}`);
  const projectInputs = ["coho_museum/PRD.md", "coho_museum/TechDesign.md", "coho_museum/Milestones.md", "coho_museum/Lessons.md", "coho_museum/knowledge.md"];
  const header = {
    runId: "m28-3-chichu-museum-structure-2026-07-23",
    startedAt: new Date().toISOString(),
    stage: "museum_structure",
    researchMode: "fresh_locked_research_cards",
    museumId: "chichu",
    museumIdentity: { zh: "地中美术馆", en: "Chichu Art Museum", location: "Naoshima, Japan" },
    workIds,
    pipelineVersion: manifest.pipelineVersion,
    instructionVersion: manifest.currentVersion,
    executionProfile: {
      model: manifest.executionProfile.model,
      reasoningEffort: manifest.executionProfile.reasoningEffort,
      runner: manifest.canonicalRunner,
      runnerSha256: sha256(runnerPath)
    },
    allowedInputs: [
      { path: manifest.canonicalPipeline, sha256: sha256(pipelinePath) },
      { path: manifest.canonicalInstruction, sha256: sha256(instructionPath) },
      ...projectInputs.map(input => ({ path: input, sha256: sha256(path.join(projectRoot, input)) })),
      { path: relative(comparisonPath), sha256: sha256(comparisonPath) },
      ...cards
    ],
    outputs: ["museum-plan.json", "museum-copy.md"],
    reviewer: "disabled",
    retry: "disabled",
    publicationBoundary: "whole_museum_candidate_no_production_write"
  };
  fs.writeFileSync(headerPath, `${JSON.stringify(header, null, 2)}\n`);
  console.log(`scaffolded museum structure run with ${cards.length} research cards`);
  process.exit(0);
}

let count = 0;
for (const batchName of fs.readdirSync(runRoot).filter(name => name.startsWith("research-batch-")).sort()) {
  const batchRoot = path.join(runRoot, batchName);
  const researchHeader = JSON.parse(fs.readFileSync(path.join(batchRoot, "run-header.json"), "utf8"));
  const researchResult = JSON.parse(fs.readFileSync(path.join(batchRoot, "research-result.json"), "utf8"));

  for (const work of researchHeader.works) {
    const cardName = `${work.workId}-research-card.md`;
    const cardResult = researchResult.outputs.find(output => output.path === cardName);
    if (!cardResult) throw new Error(`missing recorded research card: ${cardName}`);
    const cardPath = path.join(batchRoot, cardName);
    if (sha256(cardPath) !== cardResult.sha256) throw new Error(`research hash mismatch: ${cardName}`);

    const workRoot = path.join(worksRoot, work.workId);
    fs.mkdirSync(workRoot, { recursive: true });
    const headerPath = path.join(workRoot, "run-header.json");
    if (fs.existsSync(headerPath)) throw new Error(`author header already exists: ${relative(headerPath)}`);

    const header = {
      runId: `m28-3-chichu-author-${work.workId}-2026-07-23`,
      startedAt: new Date().toISOString(),
      stage: "author",
      researchMode: "fresh_locked_research_card",
      museumId: work.museumId,
      workId: work.workId,
      workIdentity: work.workIdentity,
      pipelineVersion: manifest.pipelineVersion,
      instructionVersion: manifest.currentVersion,
      executionProfile: {
        model: manifest.executionProfile.model,
        reasoningEffort: manifest.executionProfile.reasoningEffort,
        runner: manifest.canonicalRunner,
        runnerSha256: sha256(runnerPath)
      },
      allowedInputs: [
        { path: manifest.canonicalPipeline, sha256: sha256(pipelinePath) },
        { path: manifest.canonicalInstruction, sha256: sha256(instructionPath) },
        { path: relative(cardPath), sha256: cardResult.sha256 }
      ],
      outputs: manifest.executionProfile.authorBundleOutputs,
      reviewer: "disabled",
      retry: "disabled",
      publicationBoundary: "whole_museum_candidate_no_production_write"
    };
    fs.writeFileSync(headerPath, `${JSON.stringify(header, null, 2)}\n`);
    count += 1;
  }
}

if (count === 0) throw new Error("no author runs scaffolded");
console.log(`scaffolded ${count} author runs`);
