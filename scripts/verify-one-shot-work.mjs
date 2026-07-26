import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {assertPathInside, loadManifest, resolveRunRoot} from "./lib/filesystem-contract.mjs";

export const canonicalOneShotModel = "gpt-5.6-luna";
export const canonicalOneShotEffort = "high";

const schemaRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "schemas");
const forbiddenArtifact = /(?:research[-_ ]?card|writing[-_ ]?plan|claim[-_ ]?ledger|story[-_ ]?beats|reviewer[-_ ]?output)/i;
const forbiddenInput = /(?:research[-_ ]?card|writing[-_ ]?plan|old[-_ ]?(?:card|draft|article)|claim[-_ ]?ledger|story[-_ ]?beats|valueType|mustNotAssume|reviewer[-_ ]?output)/i;
const allowedSourceTypes = new Set(["museum", "academic", "foundation", "publication", "media", "other"]);
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const exists = target => fs.access(target).then(() => true).catch(() => false);

const issue = (code, message, matches = [], severity = "error") => ({code, message, matches, severity});

async function walk(directory) {
  const files = [];
  if (!(await exists(directory))) return files;
  for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

function validateValue(value, schema, location = "$") {
  const errors = [];
  const type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  const typeMatches = schema.type === "integer" ? Number.isInteger(value) : !schema.type || type === schema.type;
  if (!typeMatches) return [`${location} must be ${schema.type}`];
  if (schema.enum && !schema.enum.some(item => Object.is(item, value))) errors.push(`${location} is not an allowed value`);
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location} is too short`);
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) errors.push(`${location} does not match ${schema.pattern}`);
    if (schema.format === "uri") {
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        errors.push(`${location} must be an HTTP(S) URL`);
      }
    }
  }
  if (type === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${location} has too few items`);
    if (schema.items) value.forEach((item, index) => errors.push(...validateValue(item, schema.items, `${location}[${index}]`)));
  }
  if (type === "object") {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${location}.${key} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) errors.push(`${location}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) errors.push(...validateValue(value[key], child, `${location}.${key}`));
    }
  }
  return errors;
}

async function validateSchema(name, value) {
  const schema = JSON.parse(await fs.readFile(path.join(schemaRoot, name), "utf8"));
  return validateValue(value, schema);
}

export async function validateVerifierResult(result) {
  return validateSchema("one-shot-verifier-result.schema.json", result);
}

export function normalizeUrl(value) {
  const url = new URL(value);
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(?:utm_|fbclid$|gclid$|mc_)/i.test(key)) url.searchParams.delete(key);
  }
  url.pathname = decodeURI(url.pathname).replace(/\/+$/, "") || "/";
  const query = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  url.search = "";
  for (const [key, item] of query) url.searchParams.append(key, item);
  return url.href.replace(/\/$/, "");
}

function sectionBody(article, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return article.match(new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |$)`, "m"))?.[1]?.trim() ?? "";
}

function middleSections(article) {
  return [...article.matchAll(/^## (.+)$/gm)]
    .map(match => match[1].trim())
    .filter(heading => heading !== "一分钟看懂" && heading !== "最后再看一眼");
}

export function extractCard(article) {
  const quick = sectionBody(article, "一分钟看懂");
  if (!quick) throw new Error("article has no 一分钟看懂 section");
  const firstParagraph = quick.split(/\n\s*\n/).map(part => part.trim()).find(Boolean);
  if (!firstParagraph) throw new Error("一分钟看懂 has no paragraph");
  return `${firstParagraph}\n`;
}

export function buildDisplayMetadata(locked) {
  return {
    by: locked.displayBy ?? `${locked.artistZh}（${locked.artistEn}）`,
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
    titleZh: locked.displayTitleZh ?? locked.titleZh,
    titleEn: locked.displayTitleEn ?? locked.titleEn
  };
}

export function assertCleanLockedMetadata(metadata) {
  if (forbiddenInput.test(JSON.stringify(metadata))) {
    throw new Error("locked metadata contains a forbidden old authoring artifact");
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

function sourceReferencesValid(record, sourceIds, sourceUrls) {
  const ids = record.sourceIds ?? (record.sourceId ? [record.sourceId] : []);
  const urls = record.sourceUrls ?? (record.sourceUrl ? [record.sourceUrl] : []);
  return (ids.length > 0 || urls.length > 0)
    && ids.every(id => sourceIds.has(id))
    && urls.every(url => sourceUrls.has(normalizeUrl(url)));
}

function collectDirectQuotes(article) {
  return [...article.matchAll(/([\p{L}·]{1,30})(?:说|写道|回忆|称|表示)[，,:：]?\s*[“"]([^”"\n]{2,})[”"]/gu)]
    .map(match => ({full: match[0], speaker: match[1], quote: match[2]}));
}

function collectStrongClaims(article) {
  return article
    .split(/[。！？\n]/)
    .map(text => text.trim())
    .filter(text => /(?:第一(?:件|张|幅|座|个)?|唯一|最早|最大|首次|开创了|奠定了)/.test(text))
    .filter(text => /(?:这是|是|成为|被视为|堪称|全球|世界|现存|他|她|该作|本作|作品|画)/.test(text))
    .filter(text => !/(?:不(?:是|等于|应|能|可)|不能|并非|没有证据(?:证明|表明)?|尚无证据|无法证明|未必|不可称为|不应理解为)[^。！？\n]{0,18}(?:第一|唯一|最早|最大|首次|开创|奠定)/.test(text));
}

function collectArtistIntent(article) {
  return [...article.matchAll(/(?:艺术家|作者|[\p{L}·]{2,20})(?:的)?(?:明确意图是|想要表达|旨在|意在)[^。！？\n]{2,60}/gu)]
    .map(match => match[0])
    .filter(text => !/(?:可以理解为|让人联想到|像是|或许|可能|一种可能的看法)/.test(text));
}

function matchingRiskRecord(records, match, type, sourceIds, sourceUrls) {
  return records.some(record => {
    if (record.type !== type) return false;
    const claim = String(record.claim ?? "");
    const normalizedMatch = match.replace(/[。！？\s]/g, "");
    const normalizedClaim = claim.replace(/[。！？\s]/g, "");
    return (normalizedMatch.includes(normalizedClaim) || normalizedClaim.includes(normalizedMatch))
      && sourceReferencesValid(record, sourceIds, sourceUrls);
  });
}

export async function verifyOneShotWork({
  projectRoot,
  artifactRoot,
  expectedMetadata,
  protectedPaths = [],
  protectedSnapshot = {},
  model = canonicalOneShotModel,
  reasoningEffort = canonicalOneShotEffort,
  allowedModel = canonicalOneShotModel,
  allowedReasoningEffort = canonicalOneShotEffort,
  runKind = "experiment"
}) {
  const errors = [];
  const warnings = [];
  const addError = (code, message, matches = []) => errors.push(issue(code, message, matches));
  const addWarning = (code, message, matches = []) => warnings.push(issue(code, message, matches, "warning"));
  const lockedPath = path.join(artifactRoot, "input", "locked-metadata.json");
  const articlePath = path.join(artifactRoot, "output", "article.md");
  const sourcesPath = path.join(artifactRoot, "output", "sources.json");

  for (const [label, target] of [["locked metadata", lockedPath], ["article", articlePath], ["sources", sourcesPath]]) {
    await assertPathInside(artifactRoot, target);
    if (!(await exists(target))) addError("MISSING_REQUIRED_FILE", `Missing ${label}`, [path.relative(artifactRoot, target)]);
  }
  const forbidden = (await walk(artifactRoot)).filter(file => forbiddenArtifact.test(path.basename(file)));
  if (forbidden.length) addError("FORBIDDEN_ARTIFACT", "Forbidden legacy authoring artifact generated", forbidden.map(file => path.relative(artifactRoot, file)));
  if (errors.length) return finalizeResult({errors, warnings, checks: {requiredFiles: false}});

  let locked;
  let sources;
  let article;
  try { locked = JSON.parse(await fs.readFile(lockedPath, "utf8")); } catch { addError("INVALID_LOCKED_METADATA_JSON", "locked-metadata.json is not valid JSON"); }
  try { sources = JSON.parse(await fs.readFile(sourcesPath, "utf8")); } catch { addError("INVALID_SOURCES_JSON", "sources.json is not valid JSON"); }
  article = await fs.readFile(articlePath, "utf8");
  if (!locked || !sources) return finalizeResult({errors, warnings, checks: {jsonParsed: false}});

  try { assertCleanLockedMetadata(locked); } catch (error) { addError("FORBIDDEN_METADATA_INPUT", error.message); }
  for (const message of await validateSchema("one-shot-locked-metadata.schema.json", locked)) addError("LOCKED_METADATA_SCHEMA", message);
  const normalizedSourcesForSchema = sources.schemaVersion === 1
    ? {directQuotes: [], ...sources}
    : sources;
  for (const message of await validateSchema("one-shot-sources.schema.json", normalizedSourcesForSchema)) addError("SOURCES_SCHEMA", message);

  for (const key of Object.keys(expectedMetadata ?? {})) {
    if (JSON.stringify(locked[key]) !== JSON.stringify(expectedMetadata[key])) addError("METADATA_DRIFT", `Locked metadata drift: ${key}`, [key]);
  }
  if (model !== allowedModel) addError("MODEL_DRIFT", `Single-work model must be ${allowedModel}`, [model]);
  if (reasoningEffort !== allowedReasoningEffort) addError("REASONING_EFFORT_DRIFT", `Single-work reasoning effort must be ${allowedReasoningEffort}`, [reasoningEffort]);
  if (sources.museumId !== locked.museumId || sources.workId !== locked.workId) addError("SOURCE_IDENTITY_DRIFT", "sources identity does not match locked metadata");
  const expectedTitle = `# 《${locked.titleZh}》 / ${locked.titleEn}`;
  if (!article.split(/\r?\n/).some(line => line.trim() === expectedTitle)) addError("ARTICLE_TITLE_DRIFT", "Article title does not match locked metadata", [expectedTitle]);
  if (!sectionBody(article, "一分钟看懂")) addError("MISSING_QUICK_SECTION", "Article is missing 一分钟看懂");
  if (!sectionBody(article, "最后再看一眼")) addError("MISSING_FINAL_SECTION", "Article is missing 最后再看一眼");
  if (!middleSections(article).length) addError("MISSING_MIDDLE_SECTION", "Article has no free-form middle section");
  if (/(?:TODO|TBD|placeholder|占位符|内部 prompt|系统提示|chain of thought)/i.test(article)) addError("INTERNAL_TEXT_LEAK", "Article leaks an internal prompt or placeholder");
  if (/\[(?:R|S|C)\d+\]/.test(article)) addError("REFERENCE_ID_LEAK", "Article leaks internal reference IDs");

  const sourceRecords = Array.isArray(sources.sources) ? sources.sources : [];
  if (!sourceRecords.length) addError("EMPTY_SOURCES", "sources list is empty");
  const sourceIds = new Set();
  const sourceUrls = new Set();
  for (const [index, source] of sourceRecords.entries()) {
    if (source.id) sourceIds.add(source.id);
    try { sourceUrls.add(normalizeUrl(source.url)); } catch { addError("INVALID_SOURCE_URL", `Source ${index + 1} has invalid URL`, [source.url]); }
    if (!allowedSourceTypes.has(source.sourceType)) addError("INVALID_SOURCE_TYPE", `Source ${index + 1} has invalid sourceType`, [source.sourceType]);
  }
  let official;
  try {
    const officialUrl = normalizeUrl(locked.officialObjectUrl);
    official = sourceRecords.find(source => {
      try { return source.sourceType === "museum" && normalizeUrl(source.url) === officialUrl; } catch { return false; }
    });
  } catch {
    official = null;
  }
  if (!official) addError("MISSING_OFFICIAL_OBJECT_SOURCE", "Official object source is missing");
  for (const use of ["identity", "date", "material"]) {
    if (!new Set(official?.usedFor ?? []).has(use)) addError("OFFICIAL_SOURCE_COVERAGE", `Official object source does not cover ${use}`, [use]);
  }
  if (sourceRecords.length < 2) addWarning("LOW_SOURCE_COUNT", "Only one source is recorded; this may be sufficient but deserves human attention");

  const directQuotes = collectDirectQuotes(article);
  const quoteRecords = Array.isArray(sources.directQuotes) ? sources.directQuotes : [];
  for (const quote of directQuotes) {
    const record = quoteRecords.find(item => item.quote === quote.quote
      && String(item.speaker ?? "").includes(quote.speaker)
      && sourceReferencesValid(item, sourceIds, sourceUrls));
    if (!record) addError("UNSUPPORTED_DIRECT_QUOTE", "Direct quotation lacks a valid source record", [quote.full]);
  }
  const vagueQuotes = [...article.matchAll(/[“"]([^”"\n]{4,})[”"]/g)]
    .map(match => match[0])
    .filter(text => !directQuotes.some(quote => quote.full.includes(text)));
  if (vagueQuotes.some(text => /(?:称|据说|经典|重要|开创)/.test(text))) {
    addWarning("AMBIGUOUS_QUOTATION", "Quoted wording may be emphasis or an unattributed quotation; human review may be useful", vagueQuotes);
  }

  const riskRecords = Array.isArray(sources.highRiskClaims) ? sources.highRiskClaims : [];
  const strongClaims = collectStrongClaims(article);
  for (const claim of strongClaims) {
    if (!matchingRiskRecord(riskRecords, claim, "strong_factual_claim", sourceIds, sourceUrls)) {
      addError("UNSUPPORTED_HIGH_RISK_CLAIM", "Strong factual claim lacks a valid source record", [claim]);
    }
  }
  const intents = collectArtistIntent(article);
  for (const claim of intents) {
    if (!matchingRiskRecord(riskRecords, claim, "artist_intent", sourceIds, sourceUrls)) {
      addError("UNSUPPORTED_ARTIST_INTENT", "Artist intent is stated as fact without a valid source record", [claim]);
    }
  }
  const broadEvaluations = [...article.matchAll(/(?:经典|重要|开创性)/g)].map(match => match[0]);
  if (broadEvaluations.length) addWarning("BROAD_EVALUATION", "Broad evaluative wording is not a hard failure", [...new Set(broadEvaluations)]);

  const certainty = /(?:目前|当前|现正|正在)[^。！？\n]{0,28}(?:展出|在展|馆内看到)/.test(article);
  const conservative = /(?:无法确认|不能确认|尚未确认|未明确|是否在展|参观前[^。！？\n]{0,12}(?:查询|核验|确认))/.test(article);
  if (locked.availability !== "confirmed_on_view" && certainty && !conservative) {
    addError("UNSUPPORTED_DISPLAY_STATUS", "Current display status is stated as certain although metadata is not confirmed");
  } else if (locked.availability !== "confirmed_on_view" && /(?:可能|似乎|大概)[^。！？\n]{0,12}(?:展出|在展)/.test(article)) {
    addWarning("AMBIGUOUS_DISPLAY_STATUS", "Display wording is ambiguous; metadata remains authoritative");
  }

  if (runKind === "experiment" && (await walk(artifactRoot)).some(file => /publication\.json$/i.test(file))) {
    addError("EXPERIMENT_PUBLISH_ATTEMPT", "Experiment artifacts cannot contain a publication plan");
  }
  if (protectedPaths.length) {
    const after = await snapshotProtectedPaths(projectRoot, protectedPaths);
    const beforeKeys = Object.keys(protectedSnapshot).sort();
    const afterKeys = Object.keys(after).sort();
    if (JSON.stringify(beforeKeys) !== JSON.stringify(afterKeys)) addError("PROTECTED_FILE_SET_CHANGED", "Protected production file set changed");
    for (const key of beforeKeys) {
      if (protectedSnapshot[key] !== after[key]) addError("PROTECTED_FILE_CHANGED", `Protected production file changed: ${key}`, [key]);
    }
  }

  return finalizeResult({
    errors,
    warnings,
    checks: {
      requiredFiles: true,
      schemasValid: !errors.some(item => item.code.endsWith("_SCHEMA") || item.code.includes("_JSON")),
      identityLocked: !errors.some(item => item.code.includes("DRIFT")),
      modelAndEffortLocked: !errors.some(item => item.code === "MODEL_DRIFT" || item.code === "REASONING_EFFORT_DRIFT"),
      requiredArticleSections: !errors.some(item => item.code.startsWith("MISSING_")),
      forbiddenArtifactsAbsent: !errors.some(item => item.code === "FORBIDDEN_ARTIFACT"),
      sourcesStructured: !errors.some(item => item.code.startsWith("INVALID_SOURCE") || item.code === "EMPTY_SOURCES"),
      officialSourcePresent: Boolean(official),
      directQuotesRecorded: !errors.some(item => item.code === "UNSUPPORTED_DIRECT_QUOTE"),
      strongClaimsRecorded: !errors.some(item => item.code === "UNSUPPORTED_HIGH_RISK_CLAIM"),
      artistIntentRecorded: !errors.some(item => item.code === "UNSUPPORTED_ARTIST_INTENT"),
      displayStatusConservative: !errors.some(item => item.code === "UNSUPPORTED_DISPLAY_STATUS"),
      productionUnchanged: !errors.some(item => item.code.startsWith("PROTECTED_")),
      factsMechanicallyVerified: false
    },
    middleHeadings: middleSections(article),
    sourceCount: sourceRecords.length,
    articleBytes: Buffer.byteLength(article),
    sourcesBytes: Buffer.byteLength(`${JSON.stringify(sources, null, 2)}\n`)
  });
}

function finalizeResult(value) {
  const result = {status: value.errors.length ? "failed" : "passed", ...value};
  return result;
}

function parseArgs(argv) {
  return Object.fromEntries(argv.map(arg => {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    return [key, rest.join("=")];
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.kind || !args["run-id"]) throw new Error("--kind and --run-id are required");
  const projectRoot = path.resolve(args["project-root"] || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const manifest = await loadManifest(projectRoot);
  const runRoot = resolveRunRoot({
    projectRoot,
    manifest,
    runKind: args.kind,
    museumId: args.museum,
    caseId: args.case,
    runId: args["run-id"]
  });
  const artifactRoot = args["artifact-layout"] === "run-root"
    ? runRoot
    : path.join(runRoot, "works", args["work-id"], "one-shot");
  await assertPathInside(runRoot, artifactRoot);
  const locked = JSON.parse(await fs.readFile(path.join(artifactRoot, "input", "locked-metadata.json"), "utf8"));
  const protectionPath = path.join(artifactRoot, "input", "production-snapshot.json");
  const protection = await exists(protectionPath)
    ? JSON.parse(await fs.readFile(protectionPath, "utf8"))
    : {paths: [], snapshot: {}};
  const result = await verifyOneShotWork({
    projectRoot,
    artifactRoot,
    expectedMetadata: locked,
    protectedPaths: protection.paths,
    protectedSnapshot: protection.snapshot,
    model: args.model ?? canonicalOneShotModel,
    reasoningEffort: args.effort ?? canonicalOneShotEffort,
    runKind: args.kind
  });
  const resultSchemaErrors = await validateVerifierResult(result);
  if (resultSchemaErrors.length) throw new Error(`verifier result schema failure: ${resultSchemaErrors.join("; ")}`);
  if (args.record) {
    const recordPath = path.resolve(runRoot, args.record);
    await assertPathInside(runRoot, recordPath);
    await fs.mkdir(path.dirname(recordPath), {recursive: true});
    const record = {
      ...result,
      ...(args["previous-failure"] ? {previousFailure: args["previous-failure"]} : {})
    };
    await fs.writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, {flag: "wx"});
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "passed") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
