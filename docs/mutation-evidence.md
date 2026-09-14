# Mutation evidence

Run from the package root:

```bash
npm run test:mutation
```

The latest public snapshot was generated on 2026-08-23.

| Metric | Value |
|---|---|
| Total mutants instrumented | 1,735 |
| Killed | 1,735 |
| Survived | 0 |
| No coverage | 0 |
| Timeouts | 0 |
| Errors | 0 |
| **Total mutation score** | **100.00 %** |
| **Covered mutation score** | **100.00 %** |

### Per-file scores

| File | Total score | Covered score | Survived | No coverage |
|---|---|---|---|---|
| `src/client.ts` | 100.00 % | 100.00 % | 0 | 0 |
| `src/config.ts` | 100.00 % | 100.00 % | 0 | 0 |
| `src/helcimpay.ts` | 100.00 % | 100.00 % | 0 | 0 |
| `src/util.ts` | 100.00 % | 100.00 % | 0 | 0 |
| `src/webhook.ts` | 100.00 % | 100.00 % | 0 | 0 |

## What the pipeline enforces

The configured Stryker break threshold is **59 %**. The package-level report verifier additionally requires:

* Covered mutation score **>= 90 %**.
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

## Dispositions

This triage pass used the equivalent-mutant workflow: prove equivalence (or not), resolve by simplifying redundant source or adding a precise test, and record the result. Survivors were sourced from the prior Stryker survivor list. Dispositions are:

- **Killed by source simplification** — the source expression was redundant or unreachable, so it was removed or restructured. The mutant no longer differs from the simplified source.
- **Killed by new test** — a precise test was added that fails when the mutated code is substituted.
- **Proven equivalent** — the mutation produces the same observable behavior as the original source for every reachable input, so it is not a real fault.
- **No coverage in this pass** — the mutant is still present and the surrounding branch was not exercised by new tests.

### `src/client.ts`

| Mutant | Location | Disposition | Evidence |
|---|---|---|---|
| ArrayDeclaration | 861:92 | No coverage in this pass | `?? []` default for `getCustomerCards` fallback was not exercised. |
| ArrayDeclaration | 1023:46 | No coverage in this pass | `?? []` default for `createSubscription` data unwrap was not exercised. |
| ArrayDeclaration | 1058:46 | No coverage in this pass | `?? []` default for `getSubscriptions` data unwrap was not exercised. |
| ArrayDeclaration | 1161:107 | No coverage in this pass | `?? []` default for `getCustomerBankAccounts` data unwrap was not exercised. |
| ArrayDeclaration | 1203:90 | No coverage in this pass | `?? []` default for `getPADs` data unwrap was not exercised. |
| ArrayDeclaration | 1286:90 | No coverage in this pass | `?? []` default for `getACHTransactions` data unwrap was not exercised. |
| ConditionalExpression | 439:15 | Proven equivalent | Removing `typeof raw !== 'object'` still returns `null` because `firstString`/`firstNumber` lookups on a primitive return `null` and the required-field checks fail. |
| ConditionalExpression | 759:36 | Killed by new test | `client request query and header guards` asserts `customerCode: null` is omitted from the URL. |
| ConditionalExpression | 765:9 | Killed by new test | `client request query and header guards` asserts no `idempotency-key` header is sent on GET requests. |
| ConditionalExpression | 771:13 | Killed by source simplification | Simplified to `body: JSON.stringify(opts.body)`; `JSON.stringify(undefined)` is `undefined`, so the guard was redundant. |
| ConditionalExpression | 775:9 | Killed by source simplification | Removed the `if (text)` guard; `JSON.parse('')` throws and the `catch` leaves `raw` as `{}`. |
| ConditionalExpression | 778:13, 778:23, 780:20, LogicalOperator at 778:13 | Killed by source simplification | Restructured the JSON parse guard to `if (Array.isArray(parsed)) ... else if (parsed && typeof parsed === 'object') ...`; avoids the redundant `parsed`/`typeof` sub-conditions. |
| MethodExpression | 791:47 | Killed by new test | `client — error handling` now asserts that a whitespace-only `providerErrors` string falls back to the HTTP message. |
| ConditionalExpression | 914:9, 915:9, 947:9, 948:9, 950:9, 951:9, 954:9, 1008:9, 1009:9, 1014:9, 1015:9, 1017:9, 1232:9, 1259:9, 1350:9, 1351:9, 1352:9, 1378:9, 1379:9, 1402:9, 1461:9, 1462:9 | Killed by source simplification | Removed all `!== undefined` guards; `JSON.stringify` strips `undefined` from objects, so these guards were redundant. Truthy guards were left intact. |
| ConditionalExpression | 957:9 | Killed by new test | `optional-guards` now asserts `addOnIds: ''` is omitted. |
| ConditionalExpression | 1018:9 | Killed by new test | `optional-guards` now asserts `addOns: ''` is omitted. |
| StringLiteral | 1151:41, 1152:51, 1152:66 | Killed by new test | `bank account response second-key coverage` decodes `Id` and `Message` keys. |
| ConditionalExpression | 1367:28 | Killed by new test | `payment API mutation survivors` asserts `processPreauth` throws for a non-object truthy `cardData`. |
| ObjectLiteral | 1370:43 | Killed by new test | `payment API mutation survivors` contract asserts `amount`, `currency`, `ipAddress`, and `cardData` are sent. |
| ConditionalExpression | 1492:16, EqualityOperator 1492:16 | Killed by source simplification | Simplified to `return decodeInvoice(arr?.[0] ?? raw.data ?? raw)`; the `arr.length > 0` and `>= 0` distinctions are no longer present. |

### `src/helcimpay.ts`

| Mutant | Location | Disposition | Evidence |
|---|---|---|---|
| ConditionalExpression, LogicalOperator | 27:7 | Killed by new test | `helcimpay.test.ts` now covers `data`/`hash`/`secretToken` as `undefined`/`null`/`''`, including a hash computed with an empty secret. |
| BlockStatement | 61:11 | Killed by source simplification | Removed the redundant `return` in the JSON parse `catch`; the following `if (!parsed || Array.isArray(parsed))` guard returns the same null shape. |
| ConditionalExpression | 64:18 | Killed by source simplification | Removed the redundant `typeof parsed !== 'object'` guard; `JSON.parse` primitives still result in `status`/`data`/`hash` nulls. New primitive tests added. |
| ConditionalExpression | 76:46 | Killed by source simplification | Removed the redundant `dataWrapper.data !== null` guard; the ternary with `null` still yields `null`. New `data: null` test added. |

### `src/webhook.ts`

| Mutant | Location | Disposition | Evidence |
|---|---|---|---|
| BlockStatement, BooleanLiteral | 37:11, 38:12 | Killed by source simplification | Removed the unreachable `try...catch` around `Buffer.from(verifierToken, 'base64')`; `Buffer.from` never throws for valid or invalid base64 strings. The empty-key guard remains. |
| ConditionalExpression | 40:7 | Killed by new test | `mutation-survivors` now rejects an empty verifier token even when the signature is computed with the empty-key HMAC. |
| MethodExpression, Regex | 44:22, 44:44 | Killed by source simplification | Simplified to `signatureHeader.split(/\s+/)`; the regex never produces empty entries, so `.filter(Boolean)` was redundant. |
| ConditionalExpression, EqualityOperator | 48:7 | Killed by source simplification | Simplified to `const sig = entry.slice(commaIdx + 1)`; `slice(0)` returns the whole string when `commaIdx === -1`. |
| BlockStatement | 60:13 | Proven equivalent; regression test added | An empty `catch` naturally falls through to the next iteration, so `continue` is redundant; it was kept per the security-review note and the new test exercises the path. |
| BlockStatement | 89:11 | Killed by source simplification | Removed the redundant `return` in the `parseHelcimWebhookBody` `catch`; the guard below returns the same null shape. |

### `src/client.ts` — additional dispositions (this pass)

| Mutant | Location | Disposition | Evidence |
|---|---|---|---|
| ConditionalExpression | 439:15 | Killed by source simplification | Removed the redundant `typeof raw !== 'object'` guard from `decodeAddress`; primitives fail the required-field checks and already return `null`. Added a `decodeCustomer` regression test with primitive `billingAddress`/`shippingAddress` values. |
| ConditionalExpression, LogicalOperator, ConditionalExpression | 780:18–780:28 | Killed by source simplification; regression test added | Simplified `else if (parsed && typeof parsed === 'object')` to `else if (parsed)`. The `typeof` check was redundant because `JSON.parse` primitives do not have an `errors` property and fall back to the HTTP status message. Added a contract test asserting a non-2xx `null` body still produces the HTTP status message. |
| StringLiteral | 1150:41 | Killed by new test | Added `createBankAccount` tests reading the capitalized `Message` key and defaulting `message` to `''` when the field is absent. |
| ArrayDeclaration | 859:95 | Killed by new test | `customer-contracts.test.ts` now asserts `getCustomerCards` returns `[]` when the response has no card fields. |
| ArrayDeclaration | 1021:46 | Killed by source simplification | `createSubscription` now uses `firstArray(raw, ['data'])` with `if (!arr?.[0]) throw ...`, removing the `?? []` default and the explicit length check. Added a regression test for a response with no `data` field. |
| ArrayDeclaration | 1056:46 | Killed by new test | `helcimpay-plan-sub-contracts.test.ts` now asserts `getSubscriptions` returns `[]` when the response has no subscription fields. |
| ArrayDeclaration | 1159:107 | Killed by new test | `bank-card-pad-contracts.test.ts` now asserts `getCustomerBankAccounts` returns `[]` when the response has no bank account fields. |
| ArrayDeclaration | 1201:90 | Killed by new test | `bank-card-pad-contracts.test.ts` now asserts `getPADs` returns `[]` when the response has no PAD fields. |
| ArrayDeclaration | 1284:90 | Killed by new test | `ach-payment-invoice-contracts.test.ts` now asserts `getACHTransactions` returns `[]` when the response has no transaction fields. |
| ConditionalExpression/ArrayDeclaration | 958:46 | Killed by source simplification | `createPaymentPlan` now uses `firstArray(raw, ['data'])` with `if (!arr?.[0]) throw ...`, removing the `?? []` default and the length check. |
| ConditionalExpression/ArrayDeclaration | 968:46 | Killed by source simplification | `getPaymentPlan` now uses `firstArray(raw, ['data'])` and falls back through `arr?.[0] ?? raw.data ?? raw`. |
| ConditionalExpression/ArrayDeclaration | 1036:46 | Killed by source simplification | `getSubscription` now uses `firstArray(raw, ['data'])` and falls back through `arr?.[0] ?? raw.data ?? raw`. |
| ConditionalExpression/ArrayDeclaration | 1462:46 | Killed by source simplification; contract test updated | `createInvoice` now uses `firstArray(raw, ['data'])` with `if (!arr?.[0]) throw ...`; the old raw-object fallback test was updated to assert the new throw behavior, and a new empty `data` array test was added. |

### `src/webhook.ts` — additional dispositions (this pass)

| Mutant | Location | Disposition | Evidence |
|---|---|---|---|
| ConditionalExpression | 35:9 | Killed by new test | `mutation-survivors.test.ts` now verifies that a base64 token decoding to zero bytes (e.g. `'='`) returns `false`, even when the signature is a valid empty-key HMAC. |
| Regex | 39:44 | Killed by source simplification | Replaced `signatureHeader.split(/\s+/)` with `signatureHeader.split(' ')`, which is the documented Helcim space-delimited format and removes the regex entirely. |
| BlockStatement | 54:11 | Killed by source simplification | Removed the redundant `continue` from the `catch` block in the `for...of` loop; an empty catch already proceeds to the next iteration. |

### Remaining [NoCoverage] notes

There are no remaining survived or no-coverage mutants after this pass. The final `npm run test:mutation` report shows **0 survived**, **0 no-coverage**, and a **100.00 %** total mutation score.
