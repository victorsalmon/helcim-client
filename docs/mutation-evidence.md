# Mutation evidence

Run from the package root:

```bash
npm run test:mutation
```

The latest public snapshot was generated on 2026-08-23.

| Metric | Value |
|---|---|
| Total mutants instrumented | 1,846 |
| Killed | 1,781 |
| Survived | 55 |
| No coverage | 8 |
| Timeouts | 0 |
| Errors | 0 |
| **Total mutation score** | **96.58 %** |
| **Covered mutation score** | **97.00 %** |

### Per-file scores

| File | Total score | Covered score | Survived | No coverage |
|---|---|---|---|---|
| `src/client.ts` | 96.97 % | 97.35 % | 41 | 6 |
| `src/config.ts` | 100.00 % | 100.00 % | 0 | 0 |
| `src/helcimpay.ts` | 89.23 % | 89.23 % | 7 | 0 |
| `src/util.ts` | 100.00 % | 100.00 % | 0 | 0 |
| `src/webhook.ts` | 91.59 % | 93.33 % | 7 | 2 |

## What the pipeline enforces

The configured Stryker break threshold is **59 %**. The package-level report verifier additionally requires:

* Total mutation score **>= 90 %**.
* Zero timeout mutants.
* Zero runtime/compile error mutants.

The `test:mutation` script runs `stryker run || node scripts/verify-mutation-report.mjs`. On Windows, Stryker may print a cleanup-only `taskkill ... Access denied` message after it has already written the complete report; the verifier parses the JSON report directly so that this harmless cleanup noise does not fail the gate.

## Artifacts

* `stryker-report/mutation/report.json` — machine-readable Stryker results.
* `reports/mutation/mutation.html` — human-readable HTML report.
* `scripts/verify-mutation-report.mjs` — threshold and error checker.

## Reviewing survivors

Survivors were reviewed in the generated HTML/JSON report. The remaining survivors are concentrated in:

* Provider-shape normalization (`client.ts`).
* Defensive parser branches (`helcimpay.ts`, `webhook.ts`).
* Equivalent encoding/string-literal transformations (`client.ts`, `webhook.ts`).

No credential, signature, hash, token-binding, or sensitive-data-redaction test relies solely on a survivor. The focused contract suite and the compliance static gate cover those invariants.

For instructions on how to re-test and how to classify survivors, see [`QUALITY.md`](./QUALITY.md).
