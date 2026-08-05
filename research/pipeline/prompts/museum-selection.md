# Museum Selection

Select the final works from the locked candidate identities and planning evidence, guided by the museum understanding. The understanding is not frozen: narrow or revise it when work-level evidence requires that, but do not silently ignore it. Preserve evidence boundaries. Assign significance, priority, availability, image policy, rare-candidate status and rating role. If evidence is insufficient, output an explicit research gap instead of guessing.

Write `selection.json` with `schemaVersion`, `museumId`, `museumName`, and `selectedWorks`. Every selected work must include:

`workId`, `significance`, `priority`, `availability`, `imagePolicy`, `rareGatePassed`, `nearestComparator`, `independenceKey`, `parentOrWholeWorkId`, `ratingRole`, `identityStable`, and `sourcePointers`.

Write `rating-input.json` with:

```json
{"evidence":{"museumId":"...","works":[]},"rating":{"museumId":"...","score":0,"scoreBand":"...","withinBandAnchor":"...","scoreReason":"...","withinBandReason":"...","rareAssets":[],"independentRareLines":[],"peakLines":[],"independentPeakLines":[],"dedicatedTrip":false,"worldDominantConcentration":false,"worldDominantConcentrationEvidence":[]}}
```

The evidence works must be the selected works. `scoreBand` must be exactly one of:

- `90–100 · 值得专程旅行`
- `80–89 · 应主动列入行程`
- `70–79 · 可去可不去`
- `60–69 · 兴趣匹配再去`
- `60 以下 · 可以略过`

`withinBandAnchor` must be exactly one of the anchors defined in the locked instruction, using the same en dash. A rare work requires a supported nearest comparator and independence key. A museum may enter 80+ without a rare work only through evidenced `peakLines`; each peak must be one indivisible work, collection group, or site whole, and its member works cannot be split into additional lines. If evidence is insufficient, write a `researchGaps` array and do not invent a passing rating.
