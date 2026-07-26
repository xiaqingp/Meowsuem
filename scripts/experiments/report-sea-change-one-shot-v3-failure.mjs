import fs from "node:fs/promises";
import path from "node:path";
import {
  comparisonV3Markdown,
  experimentMetrics,
  humanReviewV3Markdown,
  oldPipelineMetrics,
  sourceSummaryFromResearchCard,
} from "./run-sea-change-one-shot-v2.mjs";
import { verifyOneShotOutput } from "./verify-sea-change-one-shot-v2.mjs";

const projectRoot = path.resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const productionRoot = path.join(projectRoot, "research/runs/production/seattle/m28-12-seattle");
const productionWorkRoot = path.join(productionRoot, "works/sea-change");
const solRoot = path.join(
  projectRoot,
  "research/runs/experiment/sea-change-sol-one-shot-writing-v2/20260726T002425Z-p2.9.3",
);

function parseArgs(argv) {
  return Object.fromEntries(argv.map((arg) => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

async function writeNew(file, value) {
  await fs.writeFile(file, value, { flag: "wx" });
}

const args = parseArgs(process.argv.slice(2));
if (!args["run-id"]) throw new Error("--run-id is required");
const runRoot = path.join(
  projectRoot,
  "research/runs/experiment/sea-change-luna-one-shot-v3",
  args["run-id"],
);
const resultPath = path.join(runRoot, "result.json");
const result = JSON.parse(await fs.readFile(resultPath, "utf8"));
if (result.status !== "failed" || result.model !== "gpt-5.6-luna" || result.reasoningEffort !== "high") {
  throw new Error("failure reporter only accepts the failed Luna High v3 run");
}

const locked = JSON.parse(await fs.readFile(path.join(runRoot, "input/locked-metadata.json"), "utf8"));
const protection = JSON.parse(await fs.readFile(path.join(runRoot, "input/production-snapshot.json"), "utf8"));
const gate = await verifyOneShotOutput({
  projectRoot,
  runRoot,
  expectedMetadata: locked,
  protectedPaths: protection.paths,
  protectedSnapshot: protection.snapshot,
  model: "gpt-5.6-luna",
  reasoningEffort: "high",
  allowedModel: "gpt-5.6-luna",
  allowedReasoningEffort: "high",
});
if (gate.status !== "failed") throw new Error("expected the recorded Luna v3 mechanical failure");

const oldDraft = await fs.readFile(path.join(productionWorkRoot, "draft.md"), "utf8");
const oldCard = await fs.readFile(path.join(productionWorkRoot, "card.txt"), "utf8");
const oldResearchCard = await fs.readFile(
  path.join(productionRoot, "research-batch-01/sea-change-research-card.md"),
  "utf8",
);
const oldPlan = await fs.readFile(path.join(productionWorkRoot, "writing-plan.json"), "utf8");
const oldResearchResult = JSON.parse(await fs.readFile(
  path.join(productionRoot, "research-batch-01/research-result.json"),
  "utf8",
));
const oldAuthorResult = JSON.parse(await fs.readFile(path.join(productionWorkRoot, "author-result.json"), "utf8"));
const oldPipeline = oldPipelineMetrics(oldResearchResult, oldAuthorResult, {
  researchCardBytes: Buffer.byteLength(oldResearchCard),
  writingPlanBytes: Buffer.byteLength(oldPlan),
  cardBytes: Buffer.byteLength(oldCard),
  draftBytes: Buffer.byteLength(oldDraft),
});

const solResult = JSON.parse(await fs.readFile(path.join(solRoot, "result.json"), "utf8"));
const solArticle = await fs.readFile(path.join(solRoot, "output/article.md"), "utf8");
const solSources = JSON.parse(await fs.readFile(path.join(solRoot, "output/sources.json"), "utf8"));
const lunaArticle = await fs.readFile(path.join(runRoot, "output/article.md"), "utf8");
const lunaSources = JSON.parse(await fs.readFile(path.join(runRoot, "output/sources.json"), "utf8"));
const augmentedResult = {
  ...result,
  sourceCount: gate.sourceCount,
  articleBytes: gate.articleBytes,
  sourcesBytes: gate.sourcesBytes,
  mechanicalGate: "failed",
  verification: gate,
};
const comparison = {
  schemaVersion: 2,
  tokenAccounting:
    "One-shot inputTokens is cumulative across the Codex turn tool loop; cachedInputTokens is a subset and is not added again.",
  oldPipeline,
  solV2: experimentMetrics(solResult),
  lunaV3: experimentMetrics(augmentedResult),
};
await writeNew(path.join(runRoot, "comparison.json"), `${JSON.stringify(comparison, null, 2)}\n`);
await writeNew(path.join(runRoot, "comparison.md"), comparisonV3Markdown(comparison));
await writeNew(path.join(runRoot, "comparison-for-human-review.md"), humanReviewV3Markdown({
  oldDraft,
  solArticle,
  lunaArticle,
  oldSources: sourceSummaryFromResearchCard(oldResearchCard),
  solSources,
  lunaSources,
  comparison,
  solResult,
  lunaGate: gate,
}));
const temporary = `${resultPath}.tmp-${process.pid}`;
await fs.writeFile(temporary, `${JSON.stringify(augmentedResult, null, 2)}\n`, { flag: "wx" });
await fs.rename(temporary, resultPath);
process.stdout.write("Sea Change Luna v3 failed-run comparison material written without a model call\n");
