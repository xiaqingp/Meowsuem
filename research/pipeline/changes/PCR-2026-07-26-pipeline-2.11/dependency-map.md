# Pipeline 2.10 dependency map before 2.11

| Stage | Inputs | Outputs | Model / network | Resume | Legacy dependency | Reported |
|---|---|---|---|---|---|---|
| Create run | Manifest, filesystem contract | `run.json`, empty stage roots | Code / no | No | None | No |
| Discovery | Instruction, scope | Candidate pool | Sol Medium / yes | Stage-level | None | Yes |
| Planning research | Candidate pool | Full Research Cards | Terra or Sol Medium / yes | Batch-level | None | Yes |
| Selection | Candidate pool, Research Cards | Selection and rating evidence | Sol Medium / no | Stage-level | Research Card | Yes |
| Rating | Caller-selected files | Caller-selected result | Code / no | No | None | Yes |
| Structure | Selection, rating, research | Structure, routes, assembly input | Sol Medium / no | Stage-level | Research Card | Yes |
| Image evidence | Official pages | Evidence and assets | Code plus Luna Medium ambiguity / yes | No | None | Partial |
| Locked metadata | Several upstream artifacts | Per-work input | Code / no | No canonical implementation | Work context | No |
| Single work | Locked metadata, image, prompt | Article and sources | Luna High / yes | No attempt model | None | No |
| Integration | Article, sources, metadata | Card, draft, display metadata, sources | Code / no | Limited | None | No |
| Assembly | Assembly input, integration or legacy Author | Candidate | Code / no | Yes | Silent Author/Writing Plan fallback | No |
| Causality | Synthetic fixture | Gate result | Code / no | N/A | None | No real-run coverage |
| Release/publish | Candidate | Reports and atomic replacement | Code / optional live checks | Yes | None | Yes |

The first 2.11 implementation priority is closing the missing deterministic links. Model routing is changed only after a new run can travel from creation to publish dry-run without hand-authored headers.
