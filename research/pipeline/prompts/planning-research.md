# Planning Research

Research only what selection, rating, structure, routes, availability, and risk handling require. Query several works together, but keep one independent record per work. This evidence must never become an input to single-work prose generation.

For `compact_planning_research`, write `compact-planning-evidence.json`:

```json
{"schemaVersion":1,"museumId":"...","works":[{"workId":"...","identityStatus":"stable","availability":"display_status_unknown","importanceCandidate":"重要藏品","rareCandidate":false,"coreValue":"...","selectionSignals":[],"sectionSignals":[],"routeSignals":[],"riskFlags":[],"sourcePointers":["https://..."]}]}
```

For `deep_planning_research`, write `deep-research-dossier.json` with the same identity and source fields plus the exact comparison, attribution, superlative, or score evidence needed to resolve every risk flag. Do not write visitor prose.
