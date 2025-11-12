# CI/CD Testing Workflow (Biome)

## Goals
- Keep frontend builds fast and unblocked on pushes.
- Surface clear, actionable Biome diagnostics.
- Maintain quality via staged linting and thresholds.

## Staged Approach
- Push events:
  - Run Biome on changed files only.
  - Cap diagnostics with `--max-diagnostics=200`.
  - Build passes unless error count exceeds threshold.
- Pull requests and scheduled builds:
  - Run full repo Biome analysis.
  - Cap diagnostics with `--max-diagnostics=500`.
  - Apply stricter error thresholds to gate merges.

## Error Thresholds
- Push: threshold = 30 errors (configurable via `BIOME_ERROR_THRESHOLD`).
- PR/Scheduled: threshold = 30 (can be reduced as the repo stabilizes).
- Warnings do not fail builds; focus remains on critical errors.

## Local Development
- Lint only changed files since `origin/main`:
  - `npm run biome:changed`
- Full analysis for pre-PR checks:
  - `npm run biome:pr`

## Configuration Notes
- Workflows use `dorny/paths-filter` to identify changed files.
- Threshold enforcement parses Biome’s JSON report via `scripts/biomeThreshold.cjs`.
- Adjust thresholds in workflow `env` to tune sensitivity.