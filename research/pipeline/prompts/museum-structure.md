# Museum Structure and Routes

Using the museum understanding plus the frozen selection and rating, create chapters, order, routes, stay, priority and the museum narrative. The understanding is required guidance rather than a frozen conclusion: deepen or revise its interpretation when the locked evidence supports that, but do not silently ignore it. Do not change the selected work list, significance, rare status or museum score. If the selection cannot form a coherent route, output structureConflict rather than replacing a work.

Write only `structure.json` with `schemaVersion`, `museumId`, `museum`,
`chapters`, `routes`, and `works`. Each work placement must contain `workId`,
`sectionId`, `stay` as a visitor-facing string such as `8—12分钟`, and
`routeRole` as an array of route-role IDs.

Use exactly three route IDs: `90`, `half`, and `all`. Every route contains
`title`, `note`, and `workIds`. Chapters contain `id`, `number`, `title`,
`intro`, and `workIds`. `museum` must contain `name` as non-empty `{zh, en}`,
`specialFocus` (why this museum is distinctive), and `actionConclusion` (the visitor-facing travel conclusion).
It may also contain `fit`, `limits`, and `timePlanning`, but not publication
paths, image guesses, article bodies, drafts, cards, Research Cards, or Writing
Plans. The deterministic publication plan stage, after verified image evidence
exists, owns the final assembly shell.
