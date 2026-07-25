import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const runDirectory = path.resolve(process.argv[2] || "");
const reprocess = process.argv.includes("--reprocess");
const read = (name) => fs.readFileSync(path.join(runDirectory, name), "utf8");
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const normalizeText = (text, name) => {
  let normalized = text.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n*$/, "\n");
  if (name === "draft.md") {
    normalized = normalized
      .replace(/^### 30秒先懂$/gm, "### 30 秒先懂")
      .replace(
        /^(##[^\n]+\n+)(?:(?:\*\*)?(?:作者或文化|作者|年代|材质|地点\s*\/\s*状态|参观优先级|重要性|建议停留)(?:\*\*)?[：:][^\n]*\n)+\s*(?=### 30 秒先懂)/,
        "$1"
      );
  }
  return normalized;
};
const bodyStartsWithQuickLayer = (text) => /^##[^\n]+\n+### 30 秒先懂(?:\n|$)/.test(text);
const availabilityValues = new Set(["confirmed_on_view", "collection_rotation", "previously_exhibited_current_unknown", "display_status_unknown"]);
const imagePolicies = new Set(["object_image", "museum_hero_placeholder"]);
const compactClaimReferenceBlockers = (claimLedger, researchText) => {
  const failures = [];
  const researchClaims = new Set([...researchText.matchAll(/\[(R\d{2,})\]/g)].map((match) => match[1]));
  for (const [index, entry] of claimLedger.entries()) {
    const researchRefs = Array.isArray(entry.researchRefs) ? entry.researchRefs : [];
    const contextRefs = Array.isArray(entry.workContextRefs) ? entry.workContextRefs : [];
    if (!researchRefs.length && !contextRefs.length) failures.push(`claim_${index + 1}_missing_compact_reference`);
    for (const ref of researchRefs) {
      if (!researchClaims.has(ref)) failures.push(`claim_${index + 1}_unresolved_research_reference_${ref}`);
    }
  }
  return failures;
};

if (process.argv.includes("--self-test")) {
  const legacy = [
    "## 测试作品 / Test Work",
    "",
    "**作者或文化**：测试文化",
    "**年代**：测试年代",
    "**材质**：测试材质",
    "**地点 / 状态**：测试地点",
    "**参观优先级**：重点推荐",
    "**重要性**：重要藏品",
    "**建议停留**：5 分钟",
    "",
    "### 30秒先懂",
    "",
    "正文。"
  ].join("\n");
  const processed = normalizeText(legacy, "draft.md");
  if (!bodyStartsWithQuickLayer(processed) || /作者或文化|建议停留/.test(processed)) {
    throw new Error("self-test failed: structured metadata was not separated from reader body");
  }
  if (!availabilityValues.has("display_status_unknown") || !imagePolicies.has("museum_hero_placeholder")) {
    throw new Error("self-test failed: uncertain display or placeholder image policy is missing");
  }
  const resolvedRefs = compactClaimReferenceBlockers(
    [{ researchRefs: ["R01"] }, { workContextRefs: ["displayMetadata.date"] }],
    "[R01] Source-backed claim."
  );
  const rejectedRefs = compactClaimReferenceBlockers(
    [{ researchRefs: ["R99"] }, {}],
    "[R01] Source-backed claim."
  );
  if (resolvedRefs.length || !rejectedRefs.includes("claim_1_unresolved_research_reference_R99") || !rejectedRefs.includes("claim_2_missing_compact_reference")) {
    throw new Error("self-test failed: compact claim references were not resolved or rejected correctly");
  }
  console.log("mechanical processor self-test passed: metadata, fallback policies and compact claim references verified");
  process.exit(0);
}

if (!process.argv[2] || !fs.statSync(runDirectory, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error("usage: node scripts/process-author-bundle.mjs <run-directory>");
}

const visible = (text) => text.replace(/\s/g, "");
const requiredOutputs = ["writing-plan.json", "card.txt", "draft.md"];
const existingResultPath = path.join(runDirectory, "mechanical-result.json");
const previousResult = fs.existsSync(existingResultPath)
  ? JSON.parse(fs.readFileSync(existingResultPath, "utf8"))
  : null;
const blockers = [];
const advisories = [];
const fixes = [];
const modifiedOutputs = new Set();

let authorResult;
let researchInput;
try {
  authorResult = JSON.parse(read("author-result.json"));
} catch {
  blockers.push("missing_or_unparseable_author-result.json");
}

let runHeader;
try {
  runHeader = JSON.parse(read("run-header.json"));
} catch {
  blockers.push("missing_or_unparseable_run-header.json");
}

const sourceTexts = {};
for (const name of requiredOutputs) {
  try {
    sourceTexts[name] = read(name);
    if (!visible(sourceTexts[name])) blockers.push(`empty_${name}`);
  } catch {
    blockers.push(`missing_${name}`);
  }
}

if (authorResult) {
  const recorded = new Map((authorResult.outputs || []).map((item) => [item.path, item.sha256]));
  const previouslyProcessed = new Map((previousResult?.outputs || []).map((item) => [item.path, item.sha256]));
  for (const name of requiredOutputs) {
    const actualHash = sourceTexts[name] === undefined ? null : sha256(sourceTexts[name]);
    if (
      actualHash &&
      recorded.get(name) !== actualHash &&
      previouslyProcessed.get(name) !== actualHash &&
      !(
        reprocess &&
        name === "draft.md" &&
        previousResult?.deterministicFixes?.includes("derived_english_title_from_locked_research") &&
        !/^##[^\n]+\s\/\s[^\n]+$/m.test(sourceTexts[name])
      )
    ) {
      blockers.push(`author_output_hash_mismatch_${name}`);
    }
  }
  researchInput = (authorResult.inputs || []).find((item) =>
    /(?:research-card|author-input-research)\.md$/i.test(item.path)
  );
  if (!researchInput?.path || !researchInput?.sha256) blockers.push("missing_research_card_provenance");
}

let plan;
if (sourceTexts["writing-plan.json"] !== undefined) {
  try {
    plan = JSON.parse(sourceTexts["writing-plan.json"]);
    let lockedWorkContext = null;
    const contextInput = (authorResult?.inputs || []).find((item) => item.role === "work_context");
    try {
      lockedWorkContext = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), contextInput.path), "utf8"));
    } catch {
      // The regular metadata checks below will retain any resulting blocker.
    }
    if (!plan.workId && runHeader?.workId) {
      plan.workId = runHeader.workId;
      sourceTexts["writing-plan.json"] = `${JSON.stringify(plan, null, 2)}\n`;
      fixes.push("derived_workId_from_run_header");
    }
    if (!plan.workId) blockers.push("missing_workId");
    if (runHeader?.pipelineVersion === "2.7.0" && plan.displayMetadata) {
      const aliases = {artistOrCulture: "by", medium: "material", location: "place"};
      for (const [legacy, canonical] of Object.entries(aliases)) {
        if (!visible(String(plan.displayMetadata[canonical] ?? "")) && visible(String(plan.displayMetadata[legacy] ?? ""))) {
          plan.displayMetadata[canonical] = plan.displayMetadata[legacy];
          delete plan.displayMetadata[legacy];
          fixes.push(`mapped_displayMetadata_${legacy}_to_${canonical}`);
          modifiedOutputs.add("writing-plan.json");
        }
      }
      if (modifiedOutputs.has("writing-plan.json")) {
        sourceTexts["writing-plan.json"] = `${JSON.stringify(plan, null, 2)}\n`;
      }
    }
    if (plan.displayMetadata && lockedWorkContext?.selection) {
      for (const [field, allowed] of [
        ["availability", availabilityValues],
        ["imagePolicy", imagePolicies],
      ]) {
        const lockedValue = lockedWorkContext.selection[field];
        if (allowed.has(lockedValue) && plan.displayMetadata[field] !== lockedValue) {
          plan.displayMetadata[field] = lockedValue;
          fixes.push(`derived_${field}_from_locked_work_context`);
          modifiedOutputs.add("writing-plan.json");
        }
      }
      if (modifiedOutputs.has("writing-plan.json")) {
        sourceTexts["writing-plan.json"] = `${JSON.stringify(plan, null, 2)}\n`;
      }
    }
    const valueTypes = new Set([
      "historical_transition",
      "civilization_system",
      "narrative_subject",
      "artistic_breakthrough",
      "artist_landmark",
      "formal_achievement",
      "ritual_or_original_context",
      "material_or_technical_innovation",
      "social_document",
      "conceptual_question",
      "architecture_and_space",
    ]);
    if (!valueTypes.has(plan.narrativeMainline?.valueType)) blockers.push("missing_or_invalid_valueType");
    const requiredMetadata = ["by", "date", "material", "place", "priority", "significance", "stay", "availability", "imagePolicy"];
    if (!plan.displayMetadata || requiredMetadata.some((key) => !visible(String(plan.displayMetadata[key] ?? "")))) {
      blockers.push("missing_displayMetadata");
    }
    if (!availabilityValues.has(plan.displayMetadata?.availability)) blockers.push("invalid_availability");
    if (!imagePolicies.has(plan.displayMetadata?.imagePolicy)) blockers.push("invalid_imagePolicy");
    if (!Array.isArray(plan.claimLedger) || plan.claimLedger.length === 0) blockers.push("missing_claimLedger");
    if (runHeader?.pipelineVersion === "2.7.0" && Array.isArray(plan.claimLedger)) {
      let researchText = "";
      try {
        researchText = fs.readFileSync(path.resolve(process.cwd(), researchInput.path), "utf8");
      } catch {
        blockers.push("unreadable_research_claim_references");
      }
      blockers.push(...compactClaimReferenceBlockers(plan.claimLedger, researchText));
      for (const [index, entry] of plan.claimLedger.entries()) {
        if (!visible(String(entry.id ?? "")) || !visible(String(entry.claim ?? ""))) blockers.push(`claim_${index + 1}_missing_id_or_claim`);
        if (entry.researchCardRef !== undefined) blockers.push(`claim_${index + 1}_uses_legacy_reference_field`);
      }
    }
    if (!visible(String(plan.narrativeMainline?.mainline ?? ""))) blockers.push("missing_narrativeMainline");
    const storyBeats = plan.storyBeats ?? plan.narrativeMainline?.storyBeats;
    if (!Array.isArray(storyBeats) || storyBeats.length < 2) {
      blockers.push("missing_storyBeats");
    }
    if (!Array.isArray(plan.mustNotAssume) && !Array.isArray(plan.narrativeMainline?.mustNotAssume)) {
      blockers.push("missing_mustNotAssume");
    }
  } catch {
    blockers.push("unparseable_writing-plan.json");
  }
}

if (sourceTexts["card.txt"] !== undefined && sourceTexts["draft.md"] !== undefined) {
  if (runHeader?.pipelineVersion === "2.7.0" && sourceTexts["card.txt"].trim().split(/\n\s*\n/).length !== 1) {
    blockers.push("card_must_be_one_paragraph_without_metadata_blocks");
  }
  const heading = sourceTexts["draft.md"].match(/^##\s+([^\n]+)$/m);
  if (heading && !/\s\/\s/.test(heading[1])) {
    let englishTitle = "";
    try {
      const researchPath = path.resolve(process.cwd(), researchInput.path);
      const researchText = fs.readFileSync(researchPath, "utf8");
      englishTitle = researchText
        .match(/(?:\*\*)?英文名(?:\*\*)?[：:]\s*(.+)$/m)?.[1]
        ?.replace(/\*+/g, "")
        .trim();
    } catch {
      englishTitle = "";
    }
    if (englishTitle) {
      sourceTexts["draft.md"] = sourceTexts["draft.md"].replace(
        heading[0],
        `${heading[0]} / ${englishTitle}`
      );
      modifiedOutputs.add("draft.md");
      fixes.push("derived_english_title_from_locked_research");
    } else {
      blockers.push("missing_bilingual_heading");
    }
  }
  const normalizedDraft = normalizeText(sourceTexts["draft.md"], "draft.md");
  if (!bodyStartsWithQuickLayer(normalizedDraft)) {
    blockers.push("draft_body_does_not_start_with_quick_layer");
  }
  if (visible(sourceTexts["card.txt"]) === visible(sourceTexts["draft.md"])) {
    blockers.push("card_and_draft_identical");
  }
  const internalLanguage =
    /(prompt|reviewer|生成器|测试稿|发布前补核|母版迁移|pipeline migration|这版刻意|待发布|生产流程)/i;
  if (internalLanguage.test(sourceTexts["card.txt"]) || internalLanguage.test(sourceTexts["draft.md"])) {
    blockers.push("visitor_copy_contains_internal_production_language");
  }
  if (visible(sourceTexts["card.txt"]).length < 20) advisories.push("card_copy_unusually_short");
  if (visible(sourceTexts["draft.md"]).length < 320) advisories.push("draft_below_content_warning_floor");
}

if (blockers.length === 0) {
  for (const name of requiredOutputs) {
    const normalized = normalizeText(sourceTexts[name], name);
    if (normalized !== sourceTexts[name] || modifiedOutputs.has(name)) {
      fs.writeFileSync(path.join(runDirectory, name), normalized, "utf8");
      if (normalized !== sourceTexts[name]) fixes.push(`normalized_${name}`);
      sourceTexts[name] = normalized;
    }
  }
}

const result = {
  pipelineVersion: authorResult?.pipelineVersion ?? null,
  runId: authorResult?.runId ?? null,
  stage: "mechanical_processed",
  processedAt: new Date().toISOString(),
  status: blockers.length ? "blocked" : "passed",
  blockers,
  advisories,
  deterministicFixes: fixes,
  outputs: requiredOutputs
    .filter((name) => sourceTexts[name] !== undefined)
    .map((name) => ({
      path: name,
      sha256: sha256(sourceTexts[name]),
      bytes: Buffer.byteLength(sourceTexts[name]),
    })),
};

const resultPath = existingResultPath;
if (previousResult) {
  if (previousResult.status !== "blocked" && !reprocess) {
    throw new Error(`passed result already exists; use --reprocess after a processor change: ${resultPath}`);
  }
}
fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`${result.status}: ${blockers.length} blocker(s), ${advisories.length} advisory item(s)`);
if (blockers.length) process.exitCode = 1;
