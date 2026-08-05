# Museum Discovery

Confirm the museum scope, read the museum understanding, then discover a lightweight candidate pool. Treat the understanding as required guidance, not a frozen conclusion: follow its strongest museum-specific leads, broaden them when discovery finds important omissions, and do not silently ignore them. Use official collection identities first. Output only structured identity, official object URL, accession number, collection group, a short selection rationale, risk flags, and image availability. Do not write articles, complete art-historical dossiers, or final rarity judgments.

Write `candidate-pool.json` with numeric `schemaVersion: 1`, `museumId`,
`museumName`, and `candidates`. Do not use the pipeline version string as the
schema version. Discover the reasonable candidate scale from the official scope;
do not assume a fixed candidate or final-selection count.

Each candidate must have:

- `workId`: a stable filename-safe slug;
- `identity`: `objectType`; `title.zh` and `title.en`; either `artistZh` plus
  `artistEn`, or `cultureZh` plus `cultureEn`; `displayDate`, `medium`, optional
  `accessionNumber`, `identityAnchor`, and `officialObjectUrl`. Do not substitute
  a local-language title such as `title.sv` for `title.zh`, and do not emit an
  unscoped `artist` field;
- top-level `identityAnchor` and `identitySourceUrl`, repeating the two
  authoritative identity fields used by downstream mechanical validation;
- `officialObjectUrl`, optional `accessionNumber`, `collectionGroup`,
  `selectionRationale`, `riskFlags`, and `imageAvailability`.

When no accession number exists, leave it absent and use a nonempty stable
identity anchor derived from the official identity, never an invented accession
number. Distinguish a single work, a series, a room-scale installation, an
architectural viewing node and museum-level context in `objectType` and
`collectionGroup`.
