# Isolated author task

Create one unreviewed first draft for Jackson Pollock's *Autumn Rhythm (Number 30)*.

Follow the current canonical content instruction and generation pipeline. Use only the locked research card as the source of work-specific facts, observations, comparisons, and arguments.

Allowed local inputs are limited to:

- `run-header.json`
- `author-task.md`
- `research-card.md`
- `../../meowseum-content-instruction.md`
- `../../generation-pipeline.md`

Do not use the web. Do not read conversation history, Codex memory, skills, production pages, existing Met data, old Autumn Rhythm materials, old tests, old drafts, reviews, or any other local path.

Create exactly these three files via `apply_patch`:

1. `writing-plan.json`
2. `card.txt`
3. `draft.md`

Record the direct-upstream filename and SHA-256 in every downstream artifact as required by the pipeline. Write the card summary independently from the detail draft. Do not create an author review, independent review, retry, comparison report, or production change.

