# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-23

### Added

- Helcim Payment API client: card transactions, refunds, and idempotency-key support.
- Recurring API client: payment plans and subscription lifecycle management.
- Customer and card/bank-account vault APIs with support for Canadian transit/institution and U.S. routing/account fields.
- ACH / EFT-PAD pre-authorized debit APIs.
- Invoice API: create, list, retrieve, and pay invoices.
- HelcimPay.js checkout session initialization and response-hash validation.
- Webhook HMAC-SHA256 verification, including multi-signature header parsing.
- Defensive decoders that normalize Helcim's inconsistent JSON casing (`camelCase`, `PascalCase`, `snake_case`, and provider-specific variants) into a single predictable TypeScript model.
- Property-based contract tests with Vitest and `@fast-check/vitest`.
- Mutation-tested source with Stryker; current score **96.58 %**.

[0.1.0]: https://github.com/victorsalmon/helcim-client/releases/tag/v0.1.0
