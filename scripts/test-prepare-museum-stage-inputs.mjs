import assert from "node:assert/strict";
import {parseResearchCard} from "./prepare-museum-stage-inputs.mjs";

const card = `
# Research card
- [R01] Stable identity from the official object page.
- [R02] The visible composition supports the structure summary.
<!-- meowseum-downstream-evidence/1.0
{
  "workId": "fixture-work",
  "researchComplexity": "standard",
  "riskFlags": [],
  "selectionEvidence": {
    "collectionIdentity": "Fixture collection identity.",
    "availability": "confirmed_on_view",
    "imageStrategy": "object_image",
    "importanceCandidate": "important work",
    "rareCandidate": false,
    "nearestComparators": "Fixture comparator.",
    "decisiveDifference": "Fixture difference.",
    "independentCollectionLine": "Fixture line.",
    "parentRelationship": null,
    "requiresFullCard": false,
    "sourceClaimIds": ["R01"]
  },
  "structureSummary": {
    "coreValue": "A concise supported value.",
    "mediumPeriod": "Fixture medium and period.",
    "sectionSignals": ["fixture"],
    "routeRole": "Fixture route role.",
    "sourceClaimIds": ["R02"]
  }
}
-->
`;
const parsed = parseResearchCard(card, "fixture.md");
assert.equal(parsed.researchComplexity, "standard");
assert.equal(parsed.workId, "fixture-work");
assert.throws(
  () => parseResearchCard(card.replace('"rareCandidate": false', '"rareCandidate": true'), "rare.md"),
  /rare candidate cannot use the standard research route/
);
assert.throws(
  () => parseResearchCard(card.replace('"R02"', '"R99"'), "missing.md"),
  /unresolved research claim R99/
);
console.log("museum stage input test passed: standard evidence accepted; unsafe routing and unresolved claims rejected");
