# Vienna M28.8 post-generation performance

Date: 2026-07-24  
Pipeline: 2.5.0  
Model calls: 0

## What changed

- Candidate assembly resolves object-page images with bounded concurrency instead of waiting one work at a time.
- Whole-site deterministic structure checks remain global; live images, source pages, significance audit and releasability are scoped to the museum being published.
- `publication.json` declares the candidate file map and cache key. The shared publisher stages every changed file, restores the previous set on failure, and treats a repeated identical publication as a no-op.
- Mechanical URL coverage remains complete. Real-browser coverage uses the shared-renderer boundary: museum first screen, all three routes, and three representative work pages.

## Vienna measurements

| Step | Before | After |
| --- | ---: | ---: |
| Candidate assembly | 18.71 s | 2.37 s |
| Candidate structural gate | not separately recorded | 0.09 s |
| 40-image gate | not separately recorded | 1.49 s |
| Scoped live release gate: 41 images + 43 sources | old gate mixed all museums | 13.02 s |
| Publication and cache update | manual | 0.12 s |
| Representative browser regression | manual all-page pass | about 3 s |

The repeatable optimized path is about 20 seconds under this run's network conditions. The historical “about 17 minutes” included manual assembly, global live checks, manual publication and all-page browser work, so it is not a strict machine benchmark.

## Results

- Candidate: 40 works, 6 chapters, 3 routes, score 96.
- Live resources: 41 images checked, 0 broken; 43 sources checked, 0 broken.
- Three KHM object URLs that had moved were updated to their current official destinations; visitor prose was unchanged.
- Publication changed the candidate data/cache set once; the immediate second run changed 0 files.
- Production browser: score 96, 40 cards, routes 10 / 23 / 40 stops, first / special-status / last work pages rendered, images decoded, current source links present, and no console errors.
