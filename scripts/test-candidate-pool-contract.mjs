import assert from "node:assert/strict";
import fs from "node:fs";
import {validateCandidatePool} from "./lib/candidate-pool-contract.mjs";
import {validateLocalization} from "./repair-candidate-localization.mjs";

const discoveryPrompt = fs.readFileSync(new URL("../research/pipeline/prompts/museum-discovery.md", import.meta.url), "utf8");
assert.match(discoveryPrompt, /numeric `schemaVersion: 1`/);
assert.match(discoveryPrompt, /Do not use the pipeline version string/);

const candidate = {
  workId: "example-work",
  identity: {
    objectType: "painting",
    title: {zh: "示例作品", en: "Example Work"},
    artistZh: "示例作者",
    artistEn: "Example Artist",
    displayDate: "1900",
    medium: "Oil on canvas",
    identityAnchor: "X1",
    officialObjectUrl: "https://example.org/object/X1",
  },
  identitySourceUrl: "https://example.org/object/X1",
};
assert.equal(validateCandidatePool({schemaVersion: 1, candidates: [candidate]}).candidates.length, 1);
assert.throws(() => validateCandidatePool({schemaVersion: "2.13.33", candidates: [candidate]}), /schemaVersion 1/);
assert.throws(() => validateCandidatePool({schemaVersion: 1, candidates: [{
  ...candidate,
  identity: {...candidate.identity, title: {en: "Example Work", sv: "Exempelverk"}, artist: "Example Artist"},
}]}), /title\.zh/);
assert.equal(validateLocalization(
  [{workId: "example-work", titleEn: "Example Work", artistEn: "Example Artist"}],
  [{workId: "example-work", titleZh: "示例作品", titleEn: "Example Work", artistZh: "示例作者", artistEn: "Example Artist"}],
).length, 1);
assert.throws(() => validateLocalization(
  [{workId: "example-work", titleEn: "Example Work", artistEn: "Example Artist"}],
  [{workId: "example-work", titleZh: "示例作品", titleEn: "Changed", artistZh: "示例作者", artistEn: "Example Artist"}],
), /English title changed/);
console.log("candidate pool and localization contract tests passed");
