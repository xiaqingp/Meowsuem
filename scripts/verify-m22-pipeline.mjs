import fs from "node:fs/promises";

const museum = process.argv.find(argument => argument.startsWith("--museum="))?.slice(9) || "vienna";
const packetUrl = new URL(`../research/m22/${museum}-research-packets.json`, import.meta.url);
const taskUrl = new URL(`../research/m22/${museum}-writing-tasks.jsonl`, import.meta.url);
const reviewUrl = new URL(`../research/m22/${museum}-narrative-reviews.jsonl`, import.meta.url);
const packets = JSON.parse(await fs.readFile(packetUrl, "utf8"));
const manifest = JSON.parse(await fs.readFile(new URL("../research/content-standard-manifest.json", import.meta.url), "utf8"));
const expectedVersion = manifest.museums?.[museum]?.targetVersion || manifest.currentVersion;
const taskLines = (await fs.readFile(taskUrl, "utf8")).split(/\r?\n/).filter(Boolean);
const tasks = taskLines.map((line, index) => {
  try { return JSON.parse(line); }
  catch { throw new Error(`${museum}: invalid task JSON on line ${index + 1}`); }
});

const failures = [];
const packetIds = new Set();
const workIds = new Set();
if (packets.instructionVersion !== expectedVersion) failures.push(`research packets must target instruction ${expectedVersion}`);
if (JSON.stringify(packets.deliverables) !== JSON.stringify(["cardSummary", "detailMarkdown"])) failures.push("writing contract must deliver independent cardSummary and detailMarkdown");
if (!Array.isArray(packets.batches) || !packets.batches.length) failures.push("research packets need batches");
for (const batch of packets.batches || []) {
  if (!batch.id || packetIds.has(batch.id)) failures.push(`invalid or duplicate batch id ${batch.id || "(missing)"}`);
  packetIds.add(batch.id);
  if (!Array.isArray(batch.items) || batch.items.length < 1 || batch.items.length > 10) failures.push(`${batch.id}: batch must contain 1-10 items`);
  for (const item of batch.items || []) {
    if (!item.workId || workIds.has(item.workId)) failures.push(`${batch.id}: missing or duplicate work id ${item.workId || "(missing)"}`);
    workIds.add(item.workId);
    if (!item.identity || !Array.isArray(item.facts) || item.facts.length < 2 || !item.comparison || !item.source) failures.push(`${item.workId}: incomplete research card`);
    if (/^(?:quick|deep|final|prose|article|cardSummary)$/i.test(Object.keys(item).find(key => /^(?:quick|deep|final|prose|article|cardSummary)$/i.test(key)) || "")) failures.push(`${item.workId}: research card contains publishable prose field`);
  }
}

const taskWorkIds = new Set();
for (const task of tasks) {
  if (!task.taskId || !task.workId || !task.batchId) failures.push("writing task missing taskId, workId, or batchId");
  if (Array.isArray(task.workId) || task.workIds) failures.push(`${task.taskId}: writing task must contain exactly one work`);
  if (taskWorkIds.has(task.workId)) failures.push(`${task.taskId}: duplicate writing task for ${task.workId}`);
  taskWorkIds.add(task.workId);
  if (!packetIds.has(task.batchId)) failures.push(`${task.taskId}: unknown batch ${task.batchId}`);
  if (task.instructionVersion !== expectedVersion) failures.push(`${task.taskId}: wrong instruction version`);
  if (["1.6.1", "1.6.2", "1.6.3", "1.6.4", "1.6.5", "1.6.6", "1.6.7"].includes(expectedVersion)) {
    if (!task.readerStartingPoint || !task.narrativeQuestion || !Array.isArray(task.logicSequence) || task.logicSequence.length < 3 || task.logicSequence.length > 6 || !Array.isArray(task.falsePremisesToAvoid) || !("humorBasis" in task)) failures.push(`${task.taskId}: missing v1.6.1 narrative plan`);
  }
  if (["1.6.2", "1.6.3", "1.6.4", "1.6.5", "1.6.6", "1.6.7"].includes(expectedVersion)) {
    if (!Array.isArray(task.claimBoundaryPlan) || task.claimBoundaryPlan.length < 3 || task.claimBoundaryPlan.length > 6 || task.claimBoundaryPlan.some(item => !item.claim || !item.evidenceType || !item.allowedWording || !item.forbiddenUpgrade)) failures.push(`${task.taskId}: missing v1.6.2 claim boundary plan`);
  }
  if (["1.6.4", "1.6.5", "1.6.6", "1.6.7"].includes(expectedVersion)) {
    if (!task.quickLayerPlan?.visibleTension || !task.quickLayerPlan?.provisionalAnswer || !task.quickLayerPlan?.viewingRoute) failures.push(`${task.taskId}: missing v1.6.4 quick layer plan`);
    if (!Array.isArray(task.logicSequence) || task.logicSequence.some(step => !step.discovery || !step.changesUnderstanding || !step.thereforeNext)) failures.push(`${task.taskId}: v1.6.4 logic steps must prove cognitive transitions`);
  }
  if (expectedVersion === "1.6.7") {
    if (typeof task.historicalContextRequired !== "boolean") failures.push(`${task.taskId}: missing historicalContextRequired decision`);
    if (task.historicalContextRequired && (!task.historicalContextPlan?.beforeState || !task.historicalContextPlan?.changeOrConflict || !task.historicalContextPlan?.objectRole || !task.historicalContextPlan?.consequence || !task.historicalContextPlan?.uncertainty || !task.historicalContextPlan?.placement)) failures.push(`${task.taskId}: incomplete v1.6.7 historical context plan`);
  }
}
for (const workId of workIds) if (!taskWorkIds.has(workId)) failures.push(`${workId}: missing single-work writing task`);
for (const workId of taskWorkIds) if (!workIds.has(workId)) failures.push(`${workId}: writing task has no research card`);

if (["1.6.4", "1.6.5", "1.6.6", "1.6.7"].includes(expectedVersion)) {
  let reviews = [];
  try {
    reviews = (await fs.readFile(reviewUrl, "utf8")).split(/\r?\n/).filter(Boolean).map((line, index) => {
      try { return JSON.parse(line); }
      catch { throw new Error(`${museum}: invalid narrative review JSON on line ${index + 1}`); }
    });
  } catch (error) {
    if (error?.code === "ENOENT") failures.push(`${museum}: missing v1.6.4 narrative reviews`);
    else throw error;
  }
  const reviewedIds = new Set();
  for (const review of reviews) {
    reviewedIds.add(review.workId);
    if (review.instructionVersion !== expectedVersion || review.verdict !== "passed" || !review.coreQuestion || !Array.isArray(review.paragraphDependencies) || review.paragraphDependencies.length < 3 || review.paragraphDependencies.some(item => !item.paragraph || !item.dependsOn || !item.newUnderstanding || !item.breaksIfMovedEarlier) || review.quickLayerIndependent !== true || review.deepLayerIndependent !== true || review.finalReturnsToQuestion !== true) failures.push(`${review.workId || "(missing)"}: incomplete or failed narrative review`);
    if (["1.6.5", "1.6.6", "1.6.7"].includes(expectedVersion) && (!Array.isArray(review.highRiskClaimReview) || review.highRiskClaimReview.length < 3 || review.highRiskClaimReview.some(item => !item.sentence || !item.evidenceType || !item.sourceOrBasis || item.verdict !== "passed" || (["1.6.6", "1.6.7"].includes(expectedVersion) && !item.confidence)) || !Array.isArray(review.unplannedHighRiskClaims) || review.unplannedHighRiskClaims.length)) failures.push(`${review.workId || "(missing)"}: incomplete claim closure`);
    if (expectedVersion === "1.6.7" && (!review.nativeChineseReview?.oneBreathParaphrase || !Array.isArray(review.nativeChineseReview?.translationeseFindings) || review.nativeChineseReview.translationeseFindings.length || review.nativeChineseReview?.readAloudVerdict !== "passed")) failures.push(`${review.workId || "(missing)"}: incomplete or failed native Chinese review`);
  }
  for (const workId of workIds) if (!reviewedIds.has(workId)) failures.push(`${workId}: missing narrative review`);
}

console.log(`M22 ${museum}: ${packets.batches?.length || 0} research batches, ${workIds.size} research cards, ${tasks.length} single-work tasks, ${failures.length} failures`);
for (const failure of failures) console.error(`- ${failure}`);
if (failures.length) process.exitCode = 1;
