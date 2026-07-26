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
  "blocked_needs_upstream_review",
];

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
