# Museum Structure and Routes

Using the frozen selection and rating, create chapters, order, routes, stay, priority and the museum narrative. Do not change the selected work list, significance, rare status or museum score. If the selection cannot form a coherent route, output structureConflict rather than replacing a work.

Write `structure.json` with `schemaVersion`, `museumId`, `chapters`, `routes`, and `works`. Each work placement must contain `workId`, `sectionId`, `stay` as a visitor-facing string such as `8—12分钟`, and `routeRole` as an array of route-role IDs.

Write `assembly-input.json` as the deterministic publication shell. It must contain `museum`, `chapters`, `routes`, `rating`, `works`, `integration`, and `publication`. Its work order and IDs must exactly match `structure.json`; it must not contain article, draft, card, Research Card, or Writing Plan prose. Use the selected work identity, image-evidence pointer fields, and frozen rating without changing them.
