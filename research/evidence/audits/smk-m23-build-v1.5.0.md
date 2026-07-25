# M23 丹麦国立美术馆构建审计

Date: 2026-07-21  
Instruction: `research/meowseum-content-instruction.md` v1.5.0  
Pipeline: M22 batch research / single-work writing

## Scope and editorial decision

- Only SMK at Sølvgade is included; SMK Thy and other sites do not add to the score.
- Capacity is 30. Works 1–20 establish royal collection, Danish Golden Age, Skagen and Hammershøi; 21–30 add the French-modern and postwar-Danish lines. A 40-work list did not add another line of equal explanatory value.
- Score is 88. SMK and Ny Carlsberg Glyptotek share an upper-80 result for different reasons; neither passes the ordinary-visitor dedicated-city-trip test required for 90.

## Evidence and content gates

- Official sources: SMK collection overview, Open SMK object pages, and the official SMK API.
- At the 2026-07-21 API check, all 30 selected records returned `on_display: true`; room, title, artist, date, image and object URL were captured from the official record.
- M22 contract: 3 research batches, 30 research cards, 30 single-work writing tasks, 0 failures.
- Targeted v1.5.0 quality gate: 30/30 sections, 0 failures. Each section has an independent quick layer, deep layer, at least four observable details, author/style evidence, comparison boundary, source and final look.
- Cards use `cardCopyContract: independent-v1`; none repeats or contains the published quick layer, and none opens with the command-template prefixes checked by the production verifier.

## Product and browser gates

- Shared `museum-app.js` remains the only museum renderer.
- 5 chapters, 3 visit routes, 30 unique work IDs and canonical `museum.html?id=smk&work=<id>` links are integrated.
- Homepage shows 14 ranking rows and 14 map markers; SMK appears at 88.
- Real-browser check found 30 cards, 5 chapters, 3 route controls, 30/30 loaded card images and 0 broken images.
- The `green-line` deep link displayed title, 30-second layer, deep comparison/rarity explanation, final look, official source and the correct official image.

## Status

Implementation and automated/browser checks passed. Owner content acceptance remains open; M23 is not closed automatically.
