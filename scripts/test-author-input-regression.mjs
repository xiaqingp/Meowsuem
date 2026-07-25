import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const cases = [
  ["historical_object", "egyptian/narmer-palette", "research/pipeline-tests/v2.3.2-narmer-canonical-significance/research/narmer-palette-research-card.md"],
  ["modern_painting", "met/autumn-rhythm-number-30", "research/pipeline-tests/v2.2.2-three-work-production-patch-2026-07-22/research/autumn-rhythm-number-30-research-card.md"],
  ["old_master_painting", "vienna/hunters-in-the-snow", "research/m28-6/vienna/research-batch-01/vienna-pg-02-hunters-in-the-snow-research-card.md"],
  ["decorative_art", "vienna/saliera", "research/m28-6/vienna/research-batch-02/vienna-kk-01-saliera-research-card.md"],
  ["architecture", "chichu/concrete-ramp", "research/m28-3/chichu/research-batch-01/concrete-ramp-research-card.md"],
  ["coin", "vienna/sigismund-guldiner", "research/m28-6/vienna/research-batch-04/vienna-coin-01-sigismund-guldiner-research-card.md"]
];
const digest = text => crypto.createHash("sha256").update(text).digest("hex");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "meowseum-author-regression-"));

try {
  await fs.mkdir(path.join(tempRoot, "research", "cards"), {recursive: true});
  await fs.mkdir(path.join(tempRoot, "runs"), {recursive: true});
  for (const relative of ["research/content-standard-manifest.json", "research/meowseum-content-instruction.md"]) {
    const destination = path.join(tempRoot, relative);
    await fs.mkdir(path.dirname(destination), {recursive: true});
    await fs.copyFile(path.join(projectRoot, relative), destination);
  }
  const instruction = await fs.readFile(path.join(tempRoot, "research/meowseum-content-instruction.md"), "utf8");

  for (const [type, workId, sourceRelative] of cases) {
    const safe = type.replaceAll("_", "-");
    const card = await fs.readFile(path.join(projectRoot, sourceRelative), "utf8");
    const cardRelative = `research/cards/${safe}.md`;
    const contextRelative = `research/cards/${safe}-context.json`;
    const context = `${JSON.stringify({workId, regressionType: type, publicationBoundary: "test_only"}, null, 2)}\n`;
    await fs.writeFile(path.join(tempRoot, cardRelative), card, "utf8");
    await fs.writeFile(path.join(tempRoot, contextRelative), context, "utf8");

    const runDirectory = path.join(tempRoot, "runs", safe);
    await fs.mkdir(runDirectory, {recursive: true});
    const header = {
      runId: `m28-11-author-input-${safe}`,
      stage: "author",
      museumId: workId.split("/")[0],
      workId,
      inputContractVersion: 2,
      pipelineVersion: "2.7.0",
      instructionVersion: "2.1.0",
      executionProfile: {model: "gpt-5.6-sol", reasoningEffort: "medium"},
      allowedInputs: [
        {path: "research/meowseum-content-instruction.md", role: "content_instruction", sha256: digest(instruction)},
        {path: cardRelative, role: "research_card", sha256: digest(card)},
        {path: contextRelative, role: "work_context", sha256: digest(context)}
      ],
      outputs: ["writing-plan.json", "card.txt", "draft.md"]
    };
    await fs.writeFile(path.join(runDirectory, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");
    const result = spawnSync("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
      "-File", path.join(projectRoot, "scripts/run-isolated-generation.ps1"),
      "-ProjectRoot", tempRoot,
      "-RunDirectory", runDirectory,
      "-ValidateOnly"
    ], {encoding: "utf8"});
    if (result.status !== 0) throw new Error(`${type} failed: ${result.stderr || result.stdout}`);
  }
  console.log(`author input regression passed: ${cases.length} isolated work types`);
} finally {
  const resolvedTemp = path.resolve(tempRoot);
  if (!resolvedTemp.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolvedTemp).startsWith("meowseum-author-regression-")) {
    throw new Error(`refusing to clean unexpected temp path: ${resolvedTemp}`);
  }
  await fs.rm(resolvedTemp, {recursive: true, force: true});
}
