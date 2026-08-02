import fs from "node:fs/promises";

const scriptsUrl = new URL("./", import.meta.url);
const approvedNonProseWriters = new Set([
  "freeze-pipeline-release.mjs",
  "prepare-author-research-input.mjs",
  "process-author-bundle.mjs",
  "process-museum-rating.mjs",
  "report-museum-generation.mjs",
  "test-museum-generation-report.mjs",
  "test-author-input-regression.mjs",
  "publish-museum-candidate.mjs",
  "test-publish-museum-candidate.mjs",
  "test-future-museum-contract.mjs",
  "assemble-museum-candidate.mjs",
  "prepare-museum-assembly.mjs",
  "resolve-museum-image-evidence.mjs",
  "resolve-two-level-image-evidence.mjs",
  "retry-failed-image-evidence.mjs",
  "repair-invalid-page-captures.mjs",
  "report-two-level-image-resolution.mjs",
  "create-generation-run.mjs",
  "migrate-filesystem-contract-v1.mjs",
  "test-image-disambiguation-contract.mjs",
  "prepare-museum-stage-inputs.mjs",
  "finalize-museum.mjs",
  "run-one-shot-work.mjs",
  "verify-one-shot-work.mjs",
  "adapt-one-shot-work.mjs",
  "promote-image-repair.mjs",
  "promote-image-retry-to-parent.mjs",
  "repair-candidate-localization.mjs",
  "promote-warning-works.mjs",
  "prepare-one-shot-work-patch.mjs",
  "verify-blind-run-protection.mjs",
  "freeze-blind-run.mjs"
]);
const failures = [];

for (const entry of await fs.readdir(scriptsUrl, {withFileTypes:true})) {
  if (!entry.isFile() || !entry.name.endsWith(".mjs")) continue;
  const source = await fs.readFile(new URL(entry.name, scriptsUrl), "utf8");
  const writesFile = /\b(?:writeFile|writeFileSync)\s*\(/.test(source);
  if (writesFile && !approvedNonProseWriters.has(entry.name) && !entry.name.startsWith("test-")) {
    failures.push(`${entry.name}: unapproved script writes files; museum prose must already exist before build`);
  }
}

const renderer = await fs.readFile(new URL("../museum-app.js", import.meta.url), "utf8");
const page = await fs.readFile(new URL("../museum.html", import.meta.url), "utf8");
for (const marker of ["legacyBody", 'id="look"', 'id="story"', 'id="again"']) {
  if (renderer.includes(marker) || page.includes(marker)) failures.push(`renderer: legacy prose fallback remains (${marker})`);
}
for (const marker of ['id="verdict"', 'id="tradeoff"']) {
  if (page.includes(marker)) failures.push(`renderer: museum main card must not contain ${marker}`);
}
for (const marker of ['$("#verdict")', '$("#tradeoff")']) {
  if (renderer.includes(marker)) failures.push(`renderer: museum main card must not bind ${marker}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  throw new Error(`content pipeline gate failed: ${failures.length} issue(s)`);
}

console.log("content pipeline gate passed: prose is authored before build; scripts only assemble approved source text");
