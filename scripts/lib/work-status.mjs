import fs from "node:fs/promises";
import path from "node:path";

export const workStatuses = [
  "identity_ready",
  "planning_evidence_ready",
  "selected",
  "locked_input_ready",
  "generating",
  "generated",
  "verification_failed",
  "integration_ready",
  "accepted",
  "warning_ready",
  "blocked_needs_upstream_review",
  "blocked_cost_limit",
];

const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));

export async function listSingleWorkResults(runRoot) {
  const worksRoot = path.join(runRoot, "works");
  const entries = await fs.readdir(worksRoot, {withFileTypes: true}).catch(error => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const works = [];
  for (const entry of entries.filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const oneShotRoot = path.join(worksRoot, entry.name, "one-shot");
    if (!await fs.access(path.join(oneShotRoot, "input", "locked-metadata.json")).then(() => true).catch(() => false)) continue;
    const status = await readWorkStatus(runRoot, entry.name);
    const result = await readJson(path.join(oneShotRoot, "result.json")).catch(error => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    works.push({workId: entry.name, oneShotRoot, status, result});
  }
  return works;
}

export async function summarizeSingleWorkBatch(runRoot, metadata = {}) {
  const works = await listSingleWorkResults(runRoot);
  const accepted = [];
  const warning = [];
  const failed = [];
  const blocked = [];
  const pending = [];
  const failureCodes = {};
  const warningCodes = {};
  for (const work of works) {
    const status = work.status?.status;
    if (work.result?.status === "warning" || status === "warning_ready") {
      accepted.push(work.workId);
      warning.push(work.workId);
    } else if (work.result?.status === "accepted" || status === "accepted") {
      accepted.push(work.workId);
    } else if (["blocked_needs_upstream_review", "blocked_cost_limit"].includes(status)) {
      blocked.push(work.workId);
    } else if (work.result?.status === "failed" || status === "verification_failed") {
      failed.push(work.workId);
    } else {
      pending.push(work.workId);
    }
    if (work.result?.status === "failed" && work.result.failureCode) {
      failureCodes[work.result.failureCode] = (failureCodes[work.result.failureCode] ?? 0) + 1;
    }
    for (const code of work.result?.warningCodes ?? []) warningCodes[code] = (warningCodes[code] ?? 0) + 1;
  }
  return {
    schemaVersion: 1,
    stage: "single_work",
    ...metadata,
    runs: works.length,
    accepted,
    warning,
    failed,
    blocked,
    pending,
    failureCodes,
    warningCodes,
  };
}

const failureSignature = async (attemptRoot, result) => {
  const verification = await readJson(path.join(attemptRoot, "verification.json")).catch(() => null);
  const codes = [...new Set((verification?.errors ?? []).map(issue => issue.code).filter(Boolean))].sort();
  return [result.failureCode, ...codes].filter(Boolean).join(":");
};

export async function inspectSingleWorkRetryGuard(oneShotRoot, limits = {}) {
  const attemptsRoot = path.join(oneShotRoot, "attempts");
  const entries = await fs.readdir(attemptsRoot, {withFileTypes: true}).catch(error => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const attempts = [];
  for (const entry of entries.filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const attemptRoot = path.join(attemptsRoot, entry.name);
    const result = await readJson(path.join(attemptRoot, "result.json")).catch(() => null);
    if (result) attempts.push({result, signature: await failureSignature(attemptRoot, result)});
  }
  const totalTokens = attempts.reduce((sum, item) => sum + (Number.isFinite(item.result.totalTokens) ? item.result.totalTokens : 0), 0);
  const maxAttempts = Number(limits.maxAttempts ?? 4);
  const tokenBudget = Number(limits.tokenBudget ?? 400000);
  const repeatedFailureLimit = Number(limits.repeatedFailureLimit ?? 2);
  let reason = null;
  if (attempts.length >= maxAttempts) reason = `max attempts reached (${attempts.length}/${maxAttempts})`;
  else if (totalTokens >= tokenBudget) reason = `work token budget reached (${totalTokens}/${tokenBudget})`;
  else if (repeatedFailureLimit > 0 && attempts.length >= repeatedFailureLimit) {
    const recent = attempts.slice(-repeatedFailureLimit);
    if (recent[0].signature && recent.every(item => item.signature === recent[0].signature)) {
      reason = `same failure repeated ${repeatedFailureLimit} times (${recent[0].signature})`;
    }
  }
  return {blocked: Boolean(reason), reason, attempts: attempts.length, totalTokens};
}

export async function atomicJson(file, value) {
  const temporary = `${file}.tmp-${process.pid}`;
  await fs.mkdir(path.dirname(file), {recursive: true});
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {flag: "wx"});
  await fs.rename(temporary, file);
}

export async function readWorkStatus(runRoot, workId) {
  const file = path.join(runRoot, "works", workId, "status.json");
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return null;
  }
}

export async function writeWorkStatus(runRoot, workId, patch) {
  const file = path.join(runRoot, "works", workId, "status.json");
  const current = await readWorkStatus(runRoot, workId);
  const next = {
    schemaVersion: 1,
    workId,
    status: "identity_ready",
    attempt: 0,
    lastStage: "identity",
    model: null,
    verification: null,
    ...(current ?? {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (!workStatuses.includes(next.status)) throw new Error(`invalid work status: ${next.status}`);
  await atomicJson(file, next);
  return next;
}
