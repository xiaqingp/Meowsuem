import fs from "node:fs/promises";
import crypto from "node:crypto";

const hash = value => crypto.createHash("sha256").update(value, "utf8").digest("hex");
const manifest = JSON.parse(await fs.readFile(new URL("../research/content-standard-manifest.json", import.meta.url), "utf8"));
const verify = run => {
  const failures = [];
  const expected = manifest.causalityStages;
  const version = run.pipelineVersion === "$CURRENT" ? manifest.pipelineVersion : run.pipelineVersion;
  if (version !== manifest.pipelineVersion) failures.push("wrong pipeline version");
  if (run.stages?.map(stage => stage.name).join(",") !== expected.join(",")) failures.push("stage order is incomplete or wrong");
  for (let index = 0; index < (run.stages || []).length; index += 1) {
    const stage = run.stages[index];
    const previous = run.stages[index - 1];
    if (!stage.artifact || !stage.payload || !stage.createdAt) failures.push(`${stage.name}: incomplete artifact record`);
    if (previous) {
      if (stage.inputSha256 !== hash(previous.payload)) failures.push(`${stage.name}: upstream hash mismatch`);
      if (Date.parse(stage.createdAt) < Date.parse(previous.createdAt)) failures.push(`${stage.name}: created before its upstream artifact`);
    } else if (stage.inputSha256 !== null) failures.push("locked_identity_and_metadata: must not claim a generated upstream artifact");
  }
  return failures;
};

const fixture = JSON.parse(await fs.readFile(new URL("../research/pipeline/tests/causality-fixtures.json", import.meta.url), "utf8"));
const validFailures = verify(fixture.valid);
const backfillFailures = verify(fixture.backfill);
if (validFailures.length || !backfillFailures.length) {
  for (const failure of validFailures) console.error(`- valid fixture rejected: ${failure}`);
  if (!backfillFailures.length) console.error("- backfill fixture was incorrectly accepted");
  process.exitCode = 1;
} else {
  console.log(`pipeline causality gate passed: valid run accepted; backfill rejected (${backfillFailures.join("; ")})`);
}
