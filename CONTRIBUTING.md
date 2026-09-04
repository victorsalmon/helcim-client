# Contributing to helcim-client

Thanks for helping improve this client. Changes should keep the library
product-neutral, type-safe, and offline-testable.

## Setup

- Use the Node.js version in `.nvmrc`.
- Install dependencies: `npm ci`.
- Build the output used by examples and publishing: `npm run build`.

## Tests

- Run the full suite: `npm test` (`vitest run`).
- Typecheck: `npm run typecheck`.
- Contract/compliance subset: `npm run test:compliance`.
- Keep tests offline and credential-free — use synthetic tokens and fixtures,
  never live Helcim credentials.

## Pull-request conventions

- Keep a PR to one concern. Bug fixes, new endpoints, and refactors should be
  separate PRs.
- Add or extend tests for behavior changes. New API surface needs decoder and
  contract coverage where applicable.
- Do not log or persist secrets (API tokens, verifier tokens, card data).
- Add a `CHANGELOG.md` entry under `[Unreleased]`.
- By contributing, you agree your contributions will be licensed under the
  [MIT license](./LICENSE).
