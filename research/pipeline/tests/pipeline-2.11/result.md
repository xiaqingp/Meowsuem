# Pipeline 2.11 verification

Status: `passed`.

- The three-work mock museum completed discovery through publish dry-run.
- Four real Seattle works completed the routing benchmark; all four one-shot outputs were accepted.
- One Selection attempt failed the exact rating-band gate and was retained. The prompt was corrected, the retry passed, and its 35,360 tokens remain counted.
- Two one-shot outputs were deterministically reverified after fixing false positives for ordinal panels and negated “unique answer/interpretation” language. No second model call was made.
- Significance evidence remains the owner-approved pre-existing baseline: 145 `significance_audit_pending` failures and zero filesystem-related failures.
- The real authority command passed after the 2.11 release was frozen: 15 active content files, pipeline 2.11.0.

Human quality review:

`research/runs/experiment/pipeline-2-11-real-benchmark/20260726T074634Z-p2.11.0/reports/comparison-for-human-review.md`
