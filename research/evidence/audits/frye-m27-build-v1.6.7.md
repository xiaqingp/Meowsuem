# Frye Art Museum M27 build audit

Date: 2026-07-22  
Instruction: `research/meowseum-content-instruction.md` v1.6.7  
Scope: Frye Art Museum, 704 Terry Avenue; 20 stable collection works; temporary loans excluded from rating.

## Rating calibration

- Score: 72, `70–79 · 可去可不去`.
- Above the 60 band because the 232-work Founding Collection has a coherent German/Munich concentration, a clear collector-history story, and a productive contemporary counterline.
- Below Anchorage Museum 74 because Frye has narrower regional authority and lower cross-domain explanatory weight; below downtown Seattle Art Museum 75 because it lacks comparable masterwork and cross-cultural density.
- No work is promoted to `稀世珍品`; free admission affects convenience, not score.

## Content and pipeline evidence

- Capacity: 20 works, 5 chapters, routes of 8 / 15 / 20.
- `node scripts/verify-m22-pipeline.mjs --museum=frye`: 2 batches, 20 research cards, 20 single-work tasks, 0 failures.
- `node scripts/verify-content-quality.mjs --museum=frye --strict`: 20/20 inspected, 0 failures.
- All 20 official object URLs returned HTTP 200.
- Hero plus 20 object images returned HTTP 200 and valid JPEG signatures; no placeholder image remains.

## Browser evidence

- Museum URL renders name, score 72, five chapters, three routes, and `2026-07-22` update date.
- 20 unique card links are present.
- `sin` detail renders all three reading layers, five observable details, author/country/date/place metadata, and the correct 810 × 1350 official image.
- `free-me` long-title detail has no horizontal overflow and loads the correct 1477 × 1500 official image.
- Homepage contains 15 ranking rows and 15 map markers; separate visible positions are provided for Seattle Art Museum 75 and Frye 72.
- Browser console: 0 errors or warnings.

## Status

Implementation and internal gates passed. Owner content acceptance remains pending.
