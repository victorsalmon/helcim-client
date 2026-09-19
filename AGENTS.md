# AGENTS.md — helcim-client

Orientation for agents and contributors working in this repository. Read this
first, then `CONTRIBUTING.md` for setup and PR conventions.

## What this is

`@clocklobster/helcim-client` is a product-neutral, type-safe Helcim API client
for Node.js (ESM, TypeScript). It wraps the Payment API, Recurring API,
customer/card vault, HelcimPay.js checkout, webhook HMAC verification, and
HelcimPay response-hash verification. It is a payments library: treat security
and correctness on credential, signature, hash, idempotency, and money-moving
paths as high priority.

## Commands

- `npm ci` — install from `package-lock.json` (npm is canonical; the ignored
  `pnpm-lock.yaml` is a leftover, not the source of truth).
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` / `npm run format:check` — ESLint + Prettier (CI gates).
- `npm test` — Vitest unit, property (`@fast-check/vitest`), and contract tests.
- `npm run test:compliance` — the compliance contract subset.
- `npm run test:mutation` — Stryker; refreshes `stryker-report/mutation/` and
  `reports/mutation/`. Slow; run it when `src/**` changes, then update the
  mutation figures in `README.md`, `docs/QUALITY.md`, and
  `docs/mutation-evidence.md` with the real numbers.
- `npm run build` — `tsc -p tsconfig.build.json` into `dist/`.

## Layout

- `src/` — `config.ts` (env → config, HTTPS guard), `transport.ts` (HTTP,
  per-attempt timeout, retry policy), `decode.ts` (defensive decoders),
  `types.ts`, `util.ts`, `webhook.ts`, `helcimpay.ts`, `client.ts`,
  `resources/*` (endpoint groups over `{ request }`), `index.ts` (public API),
  `sandbox.ts`.
- `test/` — `*.test.ts`; `helpers.ts` holds fetch mocks and request assertions.
- `docs/` — `ARCHITECTURE.md`, `QUALITY.md`, `COMPLIANCE.md`, `PRICING.md`,
  `mutation-evidence.md`. `examples/` has a runnable webhook example.

## Rules

- Never log, persist, or commit secrets, tokens, PAN/CVV, or real credentials.
  Tests and examples use synthetic values only.
- Keep the library product-neutral: no product state (tenants, ledgers,
  gating) and no consumer-specific logic.
- Keep the public API surface intentional; new exports belong in `src/index.ts`
  with tests.
- Security-sensitive behavior (signature/hash verification, credential
  handling, transport, idempotency) needs focused tests, including negative
  cases, and must stay mutation-covered.
- Preserve the existing style: 2-space indent, single quotes, Prettier-clean,
  no comments that narrate code. Match tests to the behavior change.
- Add a `CHANGELOG.md` entry under `[Unreleased]` for user-visible changes.
- Do not force-push or rewrite published history.
