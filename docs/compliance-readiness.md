# Helcim client compliance readiness

`@clocklobster/helcim-client` is a transport and verification library. It is
not itself a certified payment-card, privacy, healthcare, SOC 2, or ISO 27001
system. The consuming product remains responsible for identity, tenant
authorization, data retention/deletion, processor contracts, logging, access
reviews, incident response, and deployment controls.

## Implemented library controls

- API credentials are supplied at runtime through configuration; no credential
  is bundled in the package.
- Production and test endpoints are explicit, with test as the safe default.
- Webhook signatures use HMAC-SHA256 and `timingSafeEqual`; callers must also
  enforce replay/idempotency and timestamp policy.
- HelcimPay response hashes are verified before callers trust identifiers.
- Request validation rejects invalid ids, non-positive amounts, unsupported
  currencies, missing required fields, and malformed provider responses.
- Mutating API operations carry idempotency keys where Helcim supports them.
- Decoders normalize provider casing/field aliases without logging provider
  payloads. Callers must redact raw payloads before audit logging.

## Framework readiness boundaries

| Framework | Library contribution | Product/operator work still required |
|---|---|---|
| SOC 2 | Authentication headers, signature verification, deterministic tests, idempotency contracts | IAM, change approvals, monitoring, incident response, vendor management, evidence retention |
| ISO 27001 | Secure defaults and cryptographic verification | ISMS scope, risk treatment, asset inventory, supplier controls, backup/continuity, audit |
| PIPEDA | Tokenization-compatible API and validation boundaries | Accountability, consent/purpose records, Canadian/processor assessment, retention, DSAR and breach procedures |
| GDPR | Data minimization-compatible contracts and webhook integrity | Lawful basis, DPA/SCC, DPIA, transfer assessment, DSAR/erasure, 72-hour breach process |
| HIPAA | No PHI-specific behavior; payment identifiers only | Formal PHI decision, BAA, risk analysis, workforce controls, audit and contingency safeguards |

## Required integration invariants

The consuming application must: keep raw PAN/CVV/full bank details out of its
own requests, logs, audit metadata, analytics, and exports; keep API and
webhook secrets in a managed secret store; use HTTPS; bind checkout completion
to the authenticated tenant and an expiring server-side credential; enforce
webhook timestamp/replay policy and durable idempotency; retain only masked
display values and processor references; and exercise deletion/retention and
incident runbooks.

