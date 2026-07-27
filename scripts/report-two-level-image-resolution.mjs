import fs from "node:fs/promises";
import path from "node:path";
import {loadManifest, resolveCanonicalRun, projectRelative} from "./lib/filesystem-contract.mjs";

const arg = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(arg("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const manifest = await loadManifest(projectRoot);
const {runRoot, descriptor} = await resolveCanonicalRun({projectRoot, manifest, runKind: arg("--kind"), museumId: arg("--museum"), caseId: arg("--case"), runId: arg("--run-id"), writable: true});
const evidence = JSON.parse(await fs.readFile(path.join(runRoot, "image-evidence", "verified-image-evidence.json"), "utf8"));
const report = {
  schemaVersion: 1,
  caseId: descriptor.caseId,
  parentRunId: descriptor.parentRunId || null,
  runId: descriptor.runId,
  museumId: evidence.museumId,
  pipelineVersion: evidence.pipelineVersion,
  testedWorks: evidence.summary.works,
  fastPathAccepted: evidence.summary.fastPathAccepted,
  aiResearchTriggered: evidence.summary.aiResearchTriggered,
  aiAccepted: evidence.summary.aiAccepted,
  contextImagesAccepted: evidence.summary.contextImagesAccepted,
  unresolved: evidence.summary.unresolved,
  duplicateObjectImageGroups: evidence.summary.duplicateObjectImageGroups,
  modelCalls: evidence.summary.modelCalls,
  modelTokens: evidence.summary.modelTokens,
  model: evidence.modelRun?.model || null,
  reasoningEffort: evidence.modelRun?.reasoningEffort || null,
  status: evidence.summary.unresolved ? "mechanical_image_stage_completed_with_unresolved_images" : "mechanical_image_stage_completed",
  perWork: evidence.works.map(work => ({
    workId: work.workId,
    fastPathStatus: work.fastPath?.status || "unknown",
    fastPathAccepted: work.selected?.method === "official_fast_path",
    aiResearchTriggered: Boolean(work.aiRequired),
    aiCandidate: work.aiResult?.selectedCandidate || null,
    finalImageUrl: work.selected?.url || null,
    sourcePageUrl: work.selected?.sourcePageUrl || work.aiResult?.selectedCandidate?.sourcePageUrl || null,
    identityEvidence: work.selected?.identityEvidence || work.aiResult?.selectedCandidate?.identityEvidence || [],
    finalStatus: work.status,
    imagePolicy: work.imagePolicy,
    sha256: work.selected?.sha256 || null,
    failureReason: work.warnings?.length ? work.warnings : [],
  })),
};
const reportPath = path.join(runRoot, "reports", "chichu-image-resolution-test.json");
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const lines = [
  "# Chichu image resolution test",
  "",
  `- Run: ${descriptor.runId}`,
  `- Parent: ${descriptor.parentRunId || "unavailable"}`,
  `- Status: ${report.status}`,
  `- Works: ${report.testedWorks}`,
  `- Fast path accepted: ${report.fastPathAccepted}`,
  `- AI research triggered: ${report.aiResearchTriggered} works / ${report.modelCalls} model call`,
  `- AI accepted: ${report.aiAccepted} (${report.contextImagesAccepted} context, ${report.aiAccepted - report.contextImagesAccepted} object)`,
  `- Unresolved: ${report.unresolved}`,
  `- Model: ${report.model || "unavailable"} / ${report.reasoningEffort || "unavailable"}`,
  `- Model tokens: ${report.modelTokens ?? "unavailable"}`,
  "",
  "## Per work",
  "",
  "| workId | fast path | AI | final status | image policy | SHA | warnings |",
  "|---|---|---|---|---|---|---|",
  ...report.perWork.map(work => `| ${work.workId} | ${work.fastPathAccepted ? "accepted" : work.fastPathStatus} | ${work.aiResearchTriggered ? "yes" : "no"} | ${work.finalStatus} | ${work.imagePolicy} | ${work.sha256 || "—"} | ${(work.failureReason || []).join(" ").replaceAll("|", "\\|") || "—"} |`),
  "",
  "Image URL identity and content correctness remain for owner audit; this report records execution and mechanical outcomes only.",
];
await fs.writeFile(path.join(runRoot, "reports", "chichu-image-resolution-test.md"), `${lines.join("\n")}\n`, "utf8");
console.log(projectRelative(projectRoot, reportPath));
