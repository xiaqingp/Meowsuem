import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import {createGenerationRun} from "../create-generation-run.mjs";
import {loadManifest, resolveCanonicalRun} from "../lib/filesystem-contract.mjs";
import {prepareOneShotWorkInputs} from "../prepare-one-shot-work-inputs.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const caseId = "pipeline-2-11-real-benchmark";
const museumId = "seattle";
const workIds = [
  "sea-change",
  "double-elvis",
  "folio-from-the-dispersed-blue-quran",
  "belt-mask-of-iyoba-idia",
];
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const rel = file => path.relative(projectRoot, file).replaceAll("\\", "/");
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), {recursive: true});
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...value] = arg.replace(/^--/, "").split("=");
  return [key, value.join("=")];
}));

async function loadSeattleWorks() {
  const context = {museumData: {}, museumRatings: {seattle: {}}};
  vm.createContext(context);
  vm.runInContext(await fs.readFile(path.join(projectRoot, "seattle.js"), "utf8"), context);
  return workIds.map(id => context.museumData.seattle.works.find(work => work.id === id));
}

async function header(runRoot, descriptor, directory, stage, route, inputs, outputs) {
  const allowedInputs = [];
  for (const input of inputs) {
    const bytes = await fs.readFile(input.path);
    allowedInputs.push({path: rel(input.path), role: input.role, sha256: sha(bytes)});
  }
  await writeJson(path.join(directory, "run-header.json"), {
    runId: descriptor.runId,
    caseId: descriptor.caseId,
    startedAt: new Date().toISOString(),
    stage,
    pipelineVersion: descriptor.pipelineVersion,
    instructionVersion: descriptor.instructionVersion,
    executionProfile: route,
    allowedInputs,
    outputs,
    reviewer: "disabled",
    retry: "explicit_only",
    publicationBoundary: "experiment_only",
  });
}

async function resolve(runId) {
  const manifest = await loadManifest(projectRoot);
  const resolved = await resolveCanonicalRun({
    projectRoot, manifest, runKind: "experiment", caseId, runId, writable: true,
  });
  return {...resolved, manifest};
}

async function setup() {
  const created = await createGenerationRun({
    projectRoot, kind: "experiment", museum: museumId, caseId, milestone: "M31",
  });
  const {runRoot, descriptor, manifest} = await resolve(created.runId);
  const works = await loadSeattleWorks();
  const candidates = works.map(work => {
    const accessionNumber = work.place.match(/(?:馆藏号|，)\s*([A-Za-z0-9.]+)/)?.[1] ?? "";
    const creator = work.by.replace(/（.*?）/g, "").trim();
    return {
      workId: work.id,
      identity: {
        workId: work.id,
        objectType: work.id.includes("folio") ? "manuscript" : work.id.includes("mask") ? "historical_object" : "painting",
        titleZh: work.zh.replace(/[《》]/g, ""),
        titleEn: work.en,
        artistZh: creator,
        artistEn: work.by.match(/（([^）]+)）/)?.[1] ?? creator,
        displayDate: work.date,
        medium: work.material,
        accessionNumber,
        officialObjectUrl: work.source,
      },
      officialObjectUrl: work.source,
      accessionNumber,
      collectionGroup: work.ch,
      selectionRationale: work.cardSummary,
      riskFlags: work.id === "belt-mask-of-iyoba-idia"
        ? ["rare_candidate", "comparative_claim", "colonial_provenance"]
        : [],
      imageAvailability: "verified_local_object_image",
      identityAnchor: `${work.en} | ${accessionNumber}`,
      identitySourceUrl: work.source,
    };
  });
  await writeJson(path.join(runRoot, "scope", "scope.json"), {
    schemaVersion: 1, museumId, museumName: "Seattle Art Museum benchmark",
    city: "Seattle", country: "United States", editorialCapacity: 4,
    benchmarkOnly: true, productionSelectionUnaffected: true,
  });
  await writeJson(path.join(runRoot, "candidate-pool", "candidate-pool.json"), {
    schemaVersion: 1, museumId, museumName: "Seattle Art Museum benchmark", candidates,
  });
  const evidenceWorks = [];
  for (const work of works) {
    const source = path.join(projectRoot, work.image.replace(/^\.\//, ""));
    const destination = path.join(runRoot, "image-evidence", "assets", `${work.id}.jpg`);
    await fs.mkdir(path.dirname(destination), {recursive: true});
    await fs.copyFile(source, destination);
    const bytes = await fs.readFile(destination);
    const candidate = candidates.find(item => item.workId === work.id);
    evidenceWorks.push({
      schemaVersion: 1, museumId, workId: work.id, identity: {
        title: work.en, creator: work.by, accessionNumber: candidate.accessionNumber,
        officialObjectUrl: work.source,
      },
      status: "accepted", imagePolicy: "object_image",
      selected: {
        url: work.imageSource, localPath: rel(destination), sha256: sha(bytes),
        width: 0, height: 0, contentType: "image/jpeg",
        method: "existing_verified_production_asset", provider: "benchmark_locked_asset",
        identitySignals: ["production_object_identity", "official_object_url"],
      },
      alternatives: [], warnings: ["benchmark reuses the currently verified production image without changing production"],
    });
  }
  await writeJson(path.join(runRoot, "image-evidence", "verified-image-evidence.json"), {
    schemaVersion: 1, museumId, works: evidenceWorks, summary: {works: 4, accepted: 4},
  });
  const instruction = path.join(projectRoot, manifest.canonicalInstruction);
  const planningPrompt = path.join(projectRoot, "research/pipeline/prompts/planning-research.md");
  for (const [kind, packetWorks] of [
    ["compact", candidates.filter(item => !item.riskFlags.length)],
    ["deep", candidates.filter(item => item.riskFlags.length)],
  ]) {
    const directory = path.join(runRoot, "research", "batches", `${kind}-01`);
    const packet = path.join(directory, "candidate-packet.json");
    await writeJson(packet, {schemaVersion: 1, museumId, works: packetWorks});
    const route = kind === "compact"
      ? manifest.modelRouting.planning_research.standard
      : manifest.modelRouting.planning_research.deep;
    await header(runRoot, descriptor, directory, `${kind}_planning_research`, route, [
      {path: instruction, role: "content_instruction"},
      {path: planningPrompt, role: "stage_prompt"},
      {path: packet, role: "candidate_packet"},
    ], [kind === "compact" ? "compact-planning-evidence.json" : "deep-research-dossier.json"]);
  }
  process.stdout.write(`${JSON.stringify(created, null, 2)}\n`);
}

async function selection(runId) {
  const {runRoot, descriptor, manifest} = await resolve(runId);
  const directory = path.join(runRoot, "selection");
  await header(runRoot, descriptor, directory, "museum_selection", manifest.modelRouting.museum_selection, [
    {path: path.join(projectRoot, manifest.canonicalInstruction), role: "content_instruction"},
    {path: path.join(projectRoot, "research/pipeline/prompts/museum-selection.md"), role: "stage_prompt"},
    {path: path.join(runRoot, "candidate-pool/candidate-pool.json"), role: "candidate_pool"},
    {path: path.join(runRoot, "research/batches/compact-01/compact-planning-evidence.json"), role: "compact_planning_evidence"},
    {path: path.join(runRoot, "research/batches/deep-01/deep-research-dossier.json"), role: "deep_research_dossier"},
  ], ["selection.json", "rating-input.json"]);
}

async function structure(runId) {
  const {runRoot, descriptor, manifest} = await resolve(runId);
  const directory = path.join(runRoot, "structure");
  await header(runRoot, descriptor, directory, "museum_structure", manifest.modelRouting.museum_structure, [
    {path: path.join(projectRoot, manifest.canonicalInstruction), role: "content_instruction"},
    {path: path.join(projectRoot, "research/pipeline/prompts/museum-structure.md"), role: "stage_prompt"},
    {path: path.join(runRoot, "selection/selection.json"), role: "museum_selection"},
    {path: path.join(runRoot, "rating/rating-result.json"), role: "museum_rating"},
    {path: path.join(runRoot, "candidate-pool/candidate-pool.json"), role: "candidate_identity"},
    {path: path.join(runRoot, "image-evidence/verified-image-evidence.json"), role: "verified_image_evidence"},
  ], ["structure.json", "assembly-input.json"]);
}

async function locked(runId) {
  const result = await prepareOneShotWorkInputs({
    projectRoot, kind: "experiment", caseId, runId,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function report(runId) {
  const {runRoot} = await resolve(runId);
  const stageFiles = [
    "research/batches/compact-01/compact_planning_research-result.json",
    "research/batches/deep-01/deep_planning_research-result.json",
    "selection/museum_selection-result.json",
    "structure/museum_structure-result.json",
  ];
  const stages = [];
  for (const item of stageFiles) {
    const value = await readJson(path.join(runRoot, item));
    stages.push({
      stage: value.stage, model: value.model, reasoningEffort: value.reasoningEffort,
      totalTokens: value.tokenUsage?.total ?? "unavailable",
      durationMs: value.modelDurationMs ?? value.runnerDurationMs,
    });
  }
  const failedStageAttempts = [];
  const failedSelectionPath = path.join(runRoot, "selection", "attempts", "01", "museum_selection-result.json");
  if (await fs.access(failedSelectionPath).then(() => true).catch(() => false)) {
    const value = await readJson(failedSelectionPath);
    failedStageAttempts.push({
      stage: value.stage, model: value.model, reasoningEffort: value.reasoningEffort,
      totalTokens: value.tokenUsage?.total ?? "unavailable",
      durationMs: value.modelDurationMs ?? value.runnerDurationMs,
      outcome: "rating_gate_failed", retryCause: "scoreBand enum was not exact",
    });
  }
  const works = [];
  for (const workId of workIds) {
    const result = await readJson(path.join(runRoot, "works", workId, "one-shot", "result.json"));
    works.push({
      workId, status: result.status, model: result.model, reasoningEffort: result.reasoningEffort,
      inputTokens: result.inputTokens, cachedInputTokens: result.cachedInputTokens,
      reasoningTokens: result.reasoningTokens, outputTokens: result.outputTokens,
      totalTokens: result.totalTokens, webSearchCount: result.webSearchCount,
      agentRunCount: result.agentRunCount, durationMs: result.durationMs,
    });
  }
  const benchmark = {
    schemaVersion: 1, runId, caseId, museumId, workIds,
    productionChanged: false,
    stages, failedStageAttempts, works,
    totals: {
      stageTokens: stages.reduce((sum, item) => sum + (Number(item.totalTokens) || 0), 0),
      oneShotInputTokens: works.reduce((sum, item) => sum + (Number(item.inputTokens) || 0), 0),
      oneShotCachedInputTokens: works.reduce((sum, item) => sum + (Number(item.cachedInputTokens) || 0), 0),
      oneShotReasoningTokens: works.reduce((sum, item) => sum + (Number(item.reasoningTokens) || 0), 0),
      oneShotOutputTokens: works.reduce((sum, item) => sum + (Number(item.outputTokens) || 0), 0),
      webSearchCount: works.reduce((sum, item) => sum + (Number(item.webSearchCount) || 0), 0),
      retryTokens: failedStageAttempts.reduce((sum, item) => sum + (Number(item.totalTokens) || 0), 0),
    },
    comparison: {
      scope: "Sea Change only; older per-work cost is unavailable for the other three works",
      oldProduction: {
        model: "gpt-5.6-sol", reasoningEffort: "medium", callsTouchingWork: 2,
        comparableAmortizedTokens: 53170, comparableAmortizedDurationMs: 142062,
        fullCallsTouchingWorkTokens: 224989,
      },
      solOneShotV2: {
        model: "gpt-5.6-sol", reasoningEffort: "medium", agentRunCount: 1,
        inputTokens: 149435, cachedInputTokens: 93440, reasoningTokens: 460,
        outputTokens: 2648, totalTokens: 152083, webSearchCount: 4, durationMs: 84832,
      },
      lunaOneShotV211: works.find(item => item.workId === "sea-change"),
    },
    weightedCreditEstimate: "unavailable: no current rate card is configured",
    qualityDecision: "reserved for owner human review",
  };
  await writeJson(path.join(runRoot, "reports", "benchmark.json"), benchmark);
  const articles = await Promise.all(workIds.map(async workId => ({
    workId, article: await fs.readFile(path.join(runRoot, "works", workId, "one-shot", "output", "article.md"), "utf8"),
  })));
  const review = [
    "# Pipeline 2.11 real micro benchmark — human review",
    "", `Run: \`${rel(runRoot)}\``, "",
    "This experiment does not modify production. Selection and route judgments below are experimental only.",
    "", "## Cost", "", "```json", JSON.stringify(benchmark, null, 2), "```",
    ...articles.flatMap(item => ["", `## ${item.workId}`, "", item.article]),
    "", "## Human evaluation", "",
    "事实准确性：", "视觉分析：", "艺术史解释：", "故事性：", "中文自然度：",
    "是否真正说明作品价值：", "selection 一致性：", "route 质量：", "是否接受本 benchmark：",
  ].join("\n");
  await fs.writeFile(path.join(runRoot, "reports", "comparison-for-human-review.md"), review, "utf8");
  process.stdout.write(`${JSON.stringify(benchmark, null, 2)}\n`);
}

if (args.phase === "setup") await setup();
else if (args.phase === "selection") await selection(args["run-id"]);
else if (args.phase === "structure") await structure(args["run-id"]);
else if (args.phase === "locked") await locked(args["run-id"]);
else if (args.phase === "report") await report(args["run-id"]);
else throw new Error("--phase=setup|selection|structure|locked|report is required");
