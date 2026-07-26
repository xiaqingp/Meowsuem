# Museum Structure and Routes

Using the frozen selection and rating, create chapters, order, routes, stay, priority and the museum narrative. Do not change the selected work list, significance, rare status or museum score. If the selection cannot form a coherent route, output structureConflict rather than replacing a work.

Write only `structure.json` with `schemaVersion`, `museumId`, `museum`,
`chapters`, `routes`, and `works`. Each work placement must contain `workId`,
`sectionId`, `stay` as a visitor-facing string such as `8—12分钟`, and
`routeRole` as an array of route-role IDs.

Use exactly three route IDs: `90`, `half`, and `all`. Every route contains
`title`, `note`, and `workIds`. Chapters contain `id`, `number`, `title`,
`intro`, and `workIds`. `museum` may contain concise museum-level narrative,
but not publication paths, image guesses, article bodies, drafts, cards,
Research Cards, or Writing Plans. The deterministic publication plan stage,
after verified image evidence exists, owns the final assembly shell.
