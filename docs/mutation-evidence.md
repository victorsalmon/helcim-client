# Helcim mutation evidence

Run from `C:\Repos\saas-modules`:

```powershell
pnpm --filter @clocklobster/helcim-client test:mutation
```

The portfolio completed on 2026-08-23 with 1,902 mutants: 1,770 killed,
114 survived, 16 with no coverage, 0 timeouts, and 0 execution errors. Stryker
reported a 93.16% score (93.85% when no-coverage mutants are excluded). The
critical-file scores were: `client.ts` 95.19%, `config.ts` 96.97%,
`util.ts` 95.10%, `helcimpay.ts` 85.14%, and `webhook.ts` 71.43%.

The configured Stryker break threshold is 59%; the package-level report
verifier additionally requires at least 90%, rejects timeouts/runtime/compile
errors, and prints the status breakdown. On Windows, Stryker may return a
cleanup-only `taskkill ... Access denied` after writing the complete report.
`test:mutation` invokes `scripts/verify-mutation-report.mjs` on that path so a
complete, error-free report is not failed by checker-process cleanup. The
verifier never masks mutant execution errors or a score below 90%.

Survivors were reviewed in the generated HTML/JSON report. The remaining
survivors are concentrated in provider-shape normalization, defensive parser
branches, and equivalent encoding/string-literal transformations; they are
not unreviewed failures. No Helcim credential, signature, hash, token-binding,
or sensitive-data-redaction test is allowed to rely solely on a survivor: the
focused contract suite and the compliance static gate cover those invariants.

Artifacts:

- `stryker-report/mutation/report.json`
- `reports/mutation/mutation.html`
- `scripts/verify-mutation-report.mjs`
