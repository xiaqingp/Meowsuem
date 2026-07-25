# Vienna M28.6 isolated regeneration release

Date: 2026-07-24  
Pipeline: 2.4.8  
Instruction: 2.0.2  
Model: `gpt-5.6-sol`, medium  
Run root: `research/m28-6/vienna`

## Scope and isolation

- Scope is limited to the Kunsthistorisches Museum main building at Maria-Theresien-Platz.
- Generation began with fresh museum scope and a fresh 40-item candidate pool.
- Chat, memory, old research cards, and old prose were not model inputs.
- Old production was read only after the new candidate was sealed, for image fallback and assembly regression.
- Research ran in four batches of ten. Each work was authored independently.
- Reviewer and automatic retry remained disabled.

## Results

- Museum rating: 96, within the 90–100 dedicated-trip band.
- Rare assets: 9 works across 8 independent rarity lines.
- Author bundles: 40/40 completed on the first author run.
- Mechanical processing: 40/40 passed with 0 blockers.
- Structure: 40 unique work IDs, 6 chapters, 3 routes.
- Images: 40/40 reachable, 0 host-blocked, 0 broken.
- Significance audit: 9/9 current rare works passed.
- Browser: 40 cards, 40 unique deep links, 3 routes, homepage ranking, metadata, details, sources, and representative images passed on port 8094 with no console errors.

## Publication

- Published files: `vienna.js`, `research/vienna-content-v2.md`, `ratings.js`, and `routes.js`.
- Cache keys were updated in `index.html` and `museum.html`.
- Production score is 96 and the homepage lists Vienna in the 90–100 band.

## Usage

- Pre-author generation: 980,032 tokens.
- Forty author runs: 1,483,152 tokens.
- Total isolated generation: 2,463,184 tokens.
