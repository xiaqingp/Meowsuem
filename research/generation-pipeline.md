# Meowseum Generation Pipeline

> Status: Canonical  
> Pipeline: 2.13.80
> Filesystem contract: 1  
> Content contract for new production runs: `one_shot_v1`

This document is the executable order of the pipeline. When an older run or
historical release differs, its frozen artifacts remain evidence of that older
version; they are not instructions for a new run.

## 0. Filesystem contract and run lifecycle

All new runs are created by:

```text
node scripts/create-generation-run.mjs --kind=production --museum=<museumId> --milestone=<metadata>
```

Milestones are metadata, never directory names. The legal roots are:

```text
research/runs/production/<museumId>/<runId>/
research/runs/regression/<caseId>/<runId>/
research/runs/experiment/<museumId-or-caseId>/<runId>/
```

The shared implementation is `scripts/lib/filesystem-contract.mjs`. A caller
cannot choose arbitrary run, candidate, report or output roots. Deprecated
path arguments pass only when they equal the canonical path exactly.

`accepted`, `published` and `superseded` runs are immutable. Changes require a
new run. A current canonical run declares:

```json
{
  "contentContract": "one_shot_v1",
  "allowLegacyAuthorBundles": false,
  "legacyWorkIds": [],
  "legacyImageResolutionAllowed": false
}
```

## 1. Canonical end-to-end order

```text
Create Museum Run
  -> Museum Scope
  -> Museum Understanding
  -> Museum Discovery
  -> Planning Research
  -> Museum Selection
  -> Rating Gate
  -> Museum Structure and Routes
  -> Verified Image Evidence
  -> Locked Metadata Preparation
  -> Luna One-shot Batch
  -> Per-work Verification and Integration
  -> Publication Plan
  -> Candidate Assembly
  -> Real-run Causality Verification
  -> Release Verification
  -> Atomic Publish
  -> Generation Cost Report
```

The canonical orchestrator is:

```text
node scripts/run-museum-pipeline.mjs --museum=<museumId> --run-id=<runId>
```

It supports `--until`, `--dry-run`, `--only-work`, `--retry-failed`,
`--reuse-prior-work` and `--continue-from`. Unknown options are rejected. `--dry-run` is read-only and
does not change run status or write an orchestrator result. It writes stage
headers itself. It does not make editorial decisions, lower gates, switch
models or silently fall back.

Before a live run, the orchestrator automatically executes the same environment
checks exposed by `node scripts/check-pipeline-readiness.mjs --mode=live`.
Node.js 20+, Windows PowerShell, `codex.cmd`, Playwright and a usable Chrome,
Edge or Playwright browser must be available before the run status can change.
All model-free regression tests run through `node scripts/run-pipeline-tests.mjs`.

For a patch that changes only a downstream stage, use
`--continue-from=<stage>` on the existing writable run. The runner records the
source and target pipeline versions, requires the content instruction version
to remain unchanged, and only re-executes the named stage and later incomplete
stages. Every earlier stage output must already exist; if one is missing, the
runner stops and requires owner approval instead of silently regenerating it.

Run states are `created`, `running`, `blocked`, `verified`, `accepted`,
`published`, `failed` and `superseded`. Each work has a separate
`works/<workId>/status.json`; a failed work can be retried without rerunning
accepted siblings.

For an explicitly reuse-aware regeneration, `--reuse-prior-work` looks for the
same work in earlier accepted or published runs of the same museum. Reuse is
matched by stable work identity rather than mutable `workId` slugs. Verified
image evidence is imported first when its bytes, SHA-256, dimensions and
identity still match; the resolver runs only for new, unresolved or invalid
images. Prior articles and sources are then checked by the current verifier
against new locked metadata. Compatible works are reintegrated with current
route/display metadata and consume zero new model tokens; missing or rejected
candidates proceed through normal one-shot generation.

## 2. Model routing

| Stage | Model | Effort | Network |
| --- | --- | --- | --- |
| Museum scope | Luna | high | yes |
| Museum understanding | Sol | medium | yes |
| Museum discovery and candidate pool | Sol | medium | yes |
| Ordinary planning research | Luna | high | yes |
| Deep research dossier | Sol | medium | yes |
| Museum selection | Sol | medium | no, except an explicit research-gap loop |
| Rating gate | code | — | no |
| Museum structure and routes | Sol | medium | no |
| Single-work search and writing | Luna | high | yes |
| Image ambiguity decision | Luna | medium | only when deterministic signals remain ambiguous |
| Metadata, verification, assembly, causality, reporting, publish | code | — | no |

There is no automatic model fallback. Museum Understanding, Discovery,
Selection and Structure use Sol Medium.

## 3. Museum understanding, discovery and planning research

After scope, Sol Medium produces `understanding/museum-understanding.md` as an
open-ended, source-grounded understanding of the museum as a whole. The
pipeline deliberately imposes no content schema or required headings. It is
guidance rather than a frozen conclusion: Discovery, Selection and Structure
must read it, may broaden, narrow or revise it when evidence warrants, and may
not silently ignore it.

Discovery produces a lightweight candidate pool. It locks identity anchors,
official object URLs, accession numbers, collection groups, a short selection
rationale, risk flags and image availability. It does not write full art
history, visitor prose or final rarity conclusions.

For a target of 20 works, discovery normally proposes 25–30 candidates. An
equal-sized pool must record why expansion was impossible.

Planning research is batched at no more than ten works:

- ordinary works produce `compact-planning-evidence.json` with stable identity,
  availability, core value, selection/section/route signals, risk flags and
  source pointers;
- rare candidates, disputed identities, global comparisons, superlatives,
  rating-critical objects, source conflicts, architecture/sites and complex
  groups produce `deep-research-dossier.json`.

Discovery uses Sol Medium. Compact evidence uses Luna High. Deep dossiers use
Sol Medium. Neither planning output is an input to single-work writing.

Selection consumes the museum understanding, candidate pool and the actual
compact/deep evidence files, not merely an index. If evidence is insufficient
it emits a research gap, the responsible research output is repaired, and
Selection reruns.

## 4. Rating and structure

Museum Selection freezes the work list, importance, rare candidates and rating
roles. `scripts/process-museum-rating.mjs` then applies the code-only rating
gate using canonical run identity and records the selection input hash.

Only after selection and rating are frozen does Sol Medium use the museum
understanding and locked evidence to produce chapters, order, routes, stay and
priority. Structure cannot change the selected works, importance, rare status
or museum score. It emits `structureConflict` when the frozen selection cannot
form a coherent route.

## 5. Verified images

Images must be resolved before locked metadata and assembly:

```text
official object identity
  -> provider adapters
  -> candidate identity signals
  -> deterministic choice
  -> Luna Medium only for unresolved ambiguity
  -> downloaded bytes and SHA-256
```

Providers live in `scripts/image-providers/`: IIIF, eMuseum, collection API,
generic HTML, browser fallback and Wikidata/Commons. The registry declares
official hosts, collection platform and provider order without museum-specific
builders.

The resolver uses `MEOWSEUM_CHROME` when explicitly configured, then checks the
Playwright browser and installed Chrome/Edge executables. A missing Playwright
browser download therefore does not block a machine that already has a usable
browser. One browser is reused for a museum with bounded page concurrency.

Accepted evidence records identity, URL, local path, hash, dimensions, MIME,
method, provider and identity signals. Generic logos and hero images receive a
strong penalty. Assembly never searches the web. Missing accepted evidence or
a changed image hash is a hard failure.

`museum_hero_placeholder` is allowed when no reliable work image exists. It is
not sent to Luna as a work image and cannot support visual analysis.

When a provider returns an HTML source page instead of an image, the
failed-image retry is isolated to `scripts/retry-failed-image-evidence.mjs`.
After each retry, `scripts/promote-image-retry-to-parent.mjs` verifies the
parent evidence hash, asset hashes and duplicate-image gate, then merges the
accepted results into the writable production evidence while preserving
unresolved records. The production evidence is compacted back to a root, so
the next retry starts from production instead of extending an experiment
chain. Historical deep chains remain verifiable with cycle detection. The
promotion preserves the previous evidence file and never invokes a model.
It reuses the parent run's locked upstream artifacts and retries only failed
image records. Playwright enumerates concrete image resources and uniquely
identified page image elements; Luna Medium selects a `candidateId` and an
`imageRole`. Code then reopens the exact page, validates that candidate, and
downloads the resource or calls the shared
`scripts/lib/page-image-capture.mjs` helper. Element capture always clips the
nearest visible image container, hides overlapping page controls, records
`captureType=clipped_image_container` plus its bounding box, and never uses a
full-page or raw-element screenshot. A source-page URL can never be accepted
as an image URL. On file-description pages, the explicitly marked current-file
image outranks creator portraits, related files and interface images. Accepted
parent images are referenced by hash and are not
rerun; the retry never runs museum research, selection, structure, writing,
assembly or publishing stages. Any capture without this evidence is rejected
before locked metadata.

When an identity-verified page image URL returns 403 or 429, the retry may
capture that exact selected page element through the same clipped-container
contract. It must retain the selector, viewport, bounding box, source page and
download failure as fallback evidence.
Because page layout can change after navigation, capture rebinds the selected
element by its verified image URL before using recorded index or selector
fallbacks. A visible cookie consent layer is dismissed before capture so it
cannot obscure the selected image container.

## 6. Locked metadata and one-shot writing

`scripts/prepare-one-shot-work-inputs.mjs` creates:

```text
works/<workId>/one-shot/input/locked-metadata.json
```

Only candidate identity, Selection, Structure and verified image evidence may
supply fields. Research prose, Research Cards, Writing Plans, old drafts and
old articles cannot fill gaps. A missing field fails with the responsible
upstream stage.

The runner validates the local image path, MIME, byte size and SHA before any
model call. It then gives Luna High only:

- the canonical one-shot prompt;
- one locked metadata object;
- one verified object image when `imagePolicy=object_image`;
- autonomous web search.

It does not generate or read a Research Card, Writing Plan, claim ledger,
reviewer output or old prose. Every attempt is retained under `attempts/NN/`.
Even a failure writes `result.json`, `runner.log`, usage, failure stage and
failure code. `agentRunCount` is distinct from internal model rounds and web
operations.

`sources.json` can report upstream conflicts. Identity/date/medium returns to
discovery or planning; availability returns to selection/structure;
rare/significance returns to deep research, selection and rating. The normal
path fixes these conflicts before integration. When the owner authorizes
warning publication, the latest complete attempt is integrated with status
`warning`; the verifier errors remain attached to that work and are never
relabelled as passed.

## 7. Verification and deterministic integration

The verifier enforces identity, structure, source records, current-display
boundaries, protected production files and the high-risk schema. Empty claims,
unknown source IDs, unsupported direct quotes and unsupported positive
superlatives fail. Ordinary quotation marks, negated superlatives and writing
taste do not become hard gates.

The adapter:

- extracts the card from the first paragraph of `一分钟看懂`;
- copies the article unchanged to `draft.md`;
- builds display metadata only from locked metadata;
- copies public sources;
- records hashes for every input and output.

No model is used.

## 8. Publication plan and assembly

`scripts/prepare-museum-publication-plan.mjs` reads only scope, candidate pool,
selection, rating, structure, verified images and locked metadata. It cannot
read prose. It records every input hash.

For new runs, assembly uses one-shot integration only. Legacy author bundles
are accepted solely when both are true:

```json
{
  "allowLegacyAuthorBundles": true,
  "legacyWorkIds": ["explicit-work-id"]
}
```

Missing one-shot output for any other work is a hard failure. Before assembly,
all publication-plan hashes, one-shot status, verifier status, adapter status
and integration hashes are recomputed. An accepted work requires the passed
status chain. A warning work requires the failed-verification / warning-adapter /
warning-result chain and receives a public `contentWarning` with the exact
verifier issues. Assembly performs no network or model calls.

Public source records are copied to work data as `{title, publisher, url}`.
The work page renders them in a low-weight collapsed `参考来源` section.

## 9. Causality, release and publish

`scripts/verify-run-causality.mjs` validates the real run:

```text
selection/rating-input hash -> rating result
structure, selection and image hashes -> locked metadata report
locked metadata/article/sources hashes -> verification and adapter
adapter output hashes -> assembly
publication-plan hash -> candidate
candidate hash -> publication report
publication hashes -> production destinations
```

Changing a verified artifact invalidates downstream assembly or publication.
Fixture causality tests remain useful but cannot replace the real-run gate.

The finalizer runs assembly, future-museum contract, real causality, release
verification and publisher with the same run identity. Dry-run success moves a
run to `verified`. Real publish is atomic; success moves it to `published` and
immutable. A content verifier failure may therefore be published only through
the explicit warning chain above; infrastructure, identity, missing-output,
hash, assembly and causality failures remain publication blockers.

## 10. Generation report

`scripts/report-museum-generation.mjs` includes ordinary stage results and
single-work results. It reports raw input, cached input, reasoning, output and
total tokens; cached input is a subset of input and is never added twice. It
also reports calls, rounds, searches, retries, per-stage totals, per-model
totals and per-work averages.

Weighted credits are estimates. Rates come from manifest configuration and are
never hard-coded into the reporter.

## 11. Testing and change control

All model stages have mock fixtures. The micro-museum E2E fixture contains an
ordinary painting, a historical object and a high-risk candidate and runs
through publish dry-run without model cost.

Required negative coverage includes model-route drift, arbitrary paths,
silent legacy fallback, missing image evidence, image/hash drift, empty
high-risk records, unknown sources, integration tampering, candidate tampering
and real publish from a non-production run.

Pipeline or instruction changes require an owner-approved change record,
mechanical tests, real authority verification and a new frozen release. Frozen
historical releases are never rewritten.

## 12. Legacy Author — historical only

The old `research_card -> writing_plan -> author -> reviewer` path exists only
to explain frozen historical runs. Rules such as “Author only reads Research
Card”, Writing Plan, claim ledger, story beats and `mustNotAssume` are
legacy-only. They are not fallback instructions for the current pipeline.

## 13. History

- 2.10.0: Luna High one-shot became canonical for a single work.
- 2.11.0: added the museum orchestrator, compact/deep planning research,
  locked metadata preparation, batch recovery, deterministic publication plan,
  generalized image providers, strict legacy isolation, real-run causality,
  source publication and complete cost reporting.
Pipeline 2.13 resolves images through one manifest-selected production entrypoint. The ordered tiers are: official API/IIIF; Luna planning over a mechanically enumerated official page; Wikidata/Commons; then Luna open-web search. AI may choose only enumerated candidate IDs, while code owns URLs, downloads, dimensions, hashes and identity checks. Every retry is a new immutable attempt, unresolved works remain non-blocking, and a museum hero can never be accepted as an object image.

- 2.13.33: added strict CLI validation, read-only dry runs, pre-run environment
  readiness checks, automatic test discovery, runtime-derived release data files,
  and complete verified-image validation at orchestration, reporting and retry
  promotion boundaries.
- 2.13.34: made the discovery output contract explicitly require numeric
  `schemaVersion: 1`, preventing the pipeline release version from being emitted
  into the candidate-pool schema field.
- 2.13.35: extended shared model JSON recovery to remove conservative trailing
  noise between a completed array or object value and its container close, so a
  completed image result can be reused without another model call.
- 2.13.36: accepts an official object page's OG image when the normalized page
  title exactly contains the locked work title, including anonymous objects,
  while retaining generic museum hero rejection.
- 2.13.37: shares the exact official-page OG identity signal with failed-image
  retry ranking, so an anonymous work's OG image is not displaced by linked
  collection cards whose filenames happen to score higher.
- 2.13.38: aligns image-retry promotion with verified-image schema v2 by
  accepting both object and context accepted statuses, while unresolved records
  remain blocked.
- 2.13.39: makes the one-shot upstream-conflict shape explicit and maps an
  accepted architectural context image to the single-work `object_image` input
  policy while preserving its context status in image evidence.
- 2.13.40: freezes the published Rosenborg page and registers its visible
  warning-publication state.
- 2.13.41: rebuilds batch state from every locked work, makes warning promotion
  cumulative, requires manifest registration before real publication, and
  pauses repeated, over-attempt, or over-budget single-work retries.
- 2.13.42: synchronizes this canonical document with the frozen retry and
  publication safeguards introduced in 2.13.41.
- 2.13.43: separates current failure-code counts from accepted warning-code
  counts in cumulative single-work reports.
- 2.13.44: adds a free-form, source-grounded Museum Understanding stage and
  routes Understanding, Discovery and Structure through Sol Medium; Discovery,
  Selection and Structure all receive the same locked understanding artifact.
- 2.13.45: adds explicit `--reuse-prior-work` regeneration. Prior accepted work
  prose is reused only after identity compatibility and current deterministic
  verification; current display metadata is rebuilt and incompatible works are
  generated normally.
- 2.13.46: makes regeneration reuse identity-based rather than slug-based and
  imports valid same-museum verified image evidence before resolution. Only new,
  unresolved or invalid images reach the resolver; reused prose receives the
  current work ID and title wrapper before deterministic verification.
- 2.13.47: authorizes the canonical prior-work reuser as a non-authoring writer
  of run-local outputs; the content gate continues to require current identity
  checks and verification before reused prose is accepted.
- 2.13.48: image reruns reuse the verified union of same-museum published
  evidence and preserved attempts in the current writable run, so successful
  images from an earlier attempt are not resolved again.
- 2.13.49: same-museum unique titles survive official-page URL drift during
  identity reuse; nonstandard `image/jpg` is normalized to JPEG, and unsupported
  page-image MIME responses may fall back to verified element capture.
- 2.13.50: failed-image retries may receive additional official source pages;
  those pages only expand the candidate set and still pass through model
  disambiguation, byte validation, dimension checks, and evidence hashing.
- 2.13.51: page-image candidates bind to their nearest image container before
  broad article text, preserving adjacent work captions for identity ranking.
- 2.13.52: one-shot evidence treats museum subdomains as one institution and
  requires separate material coverage only for specific constituent materials,
  not generic work categories such as painting, sculpture, or video.
- 2.13.53: corrects the subdomain regression fixture so it tests source-host
  equivalence without intentionally drifting locked metadata.
- 2.13.54: display-status questions and explicit non-display wording are
  conservative, while interpretive phrases such as "only protagonist" are not
  misclassified as high-risk uniqueness claims.
- 2.13.55: museum identity and date remain institution-locked, while specific
  material may be supported by museum, foundation, academic, or publication
  sources; generic language examples are not misread as attributed quotations.
- 2.13.56: structured source coverage treats `medium` as the schema-compatible
  alias of `material` when validating specific material evidence.
- 2.13.57: assembly replaces all prior quoted or unquoted registrations for the
  same museum, deduplicates homepage location/order entries, and refreshes the
  existing museum data-script cache key.
- 2.13.58: file-description pages mark their current-file image as an explicit
  record relation so creator portraits and related files cannot outrank it.
- 2.13.59: synchronizes this canonical document with the frozen 2.13.58 image
  retry fix after live readiness caught the stale header label.
- 2.13.60: recognizes the current Commons file-page DOM where the main artwork
  image itself carries `id="file"`.
- 2.13.61: explicit current-file and official-record relations bypass generic
  navigation-text penalties; unrelated images remain penalized.
- 2.13.62: selection receives the locked museum scope so its 20/30/40/60 work
  count matches the editorial capacity declared before discovery and research.
- 2.13.63: image disambiguation batches at most eight works after two separate
  ten-work Glyptotek attempts each omitted one required result.
- 2.13.64: the isolated runner reads the next standalone numeric token-count
  line even when Codex echoes a JSON final message between the marker and count.
- 2.13.65: image-retry promotion follows the complete hash-verified parent chain
  with cycle detection instead of rejecting valid chains deeper than 20 retries.
- 2.13.66: work dates may be covered by an authoritative museum, academic,
  foundation, or publication source while the official object page still locks identity.
- 2.13.67: figurative object-language and evaluative “most daring” prose no longer
  trigger direct-quote or superlative-fact failures; deterministic reverify can select a prior attempt.
- 2.13.68: publication attribution prefers the stable image source page over an
  expiring direct-download URL; the verified local image asset remains unchanged.
- 2.13.69: incomplete image-disambiguation batches retain valid returned works
  and call the model once only for missing IDs; retry promotion accepts partial
  improvements and compacts production evidence back to a hash-verified root.
- 2.13.72: freezes the post-publication SMK page cache-key hash after the
  rating-only release; ratings, work metadata, prose, images and selection are unchanged.
- 2.13.73: allows an explicitly named accepted image to re-enter the isolated
  image retry when downstream research proves an identity mismatch; broad
  accepted-image retries remain forbidden.
- 2.13.74: lets a single-work image retry enumerate one explicit image URL and
  its evidence page after a shared collection page misbinds adjacent records;
  model selection and all byte, hash, duplicate and identity gates still run.
- 2.13.75: targeted locked-metadata refreshes replace only the named work while
  preserving the complete frozen work order and upstream-hash report required
  by publication causality.
- 2.13.76: repeated-failure retry signatures include the locked-input hash, so
  a materially changed image-bound input gets a new attempt while maximum
  attempts and cumulative token budgets remain enforced.
- 2.13.77: the repeated-failure guard compares the current locked-input hash to
  the recent failed attempts before blocking, allowing a changed input to
  create its first new attempt.
- 2.13.78: high-risk claim matching normalizes equivalent museum attribution,
  and a negative display statement passes only when locked route metadata
  explicitly confirms the work is currently not on view.
- 2.13.79: candidate assembly preserves quoted JavaScript object keys when
  replacing an existing museum record, so IDs containing hyphens remain valid.
- 2.13.80: the canonical museum page registers the published Designmuseum
  Danmark bundle and its current cache-busting version.
