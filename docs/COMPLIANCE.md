# Compliance readiness

`helcim-client` is a **transport and verification library**, not a certified payment-card, privacy, SOC 2, or ISO 27001 system. The consuming application remains responsible for identity, tenant authorization, data retention, processor contracts, logging, access review, incident response, and deployment controls.

What the library _does_ provide is a secure baseline that makes downstream compliance easier.

---

## Library-level controls

| Control                | Implementation                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No bundled credentials | API tokens and webhook verifier tokens are supplied at runtime through `createHelcimConfigFromEnv`. Nothing in this package contains real credentials.                                        |
| Safe endpoint defaults | Test endpoint is the default. Production is selected explicitly via `env: 'production'` or `HELCIM_ENV=production`.                                                                           |
| HTTPS-only transport   | `createHelcimConfigFromEnv` and `createTransport` reject a base URL that is not HTTPS (loopback hosts excepted for local test servers), so the `api-token` header is never sent in plaintext. |
| Webhook integrity      | HMAC-SHA256 with constant-time `crypto.timingSafeEqual` comparison; supports multi-signature headers.                                                                                         |
| HelcimPay integrity    | SHA-256 hash verification of the response object with constant-time digest comparison, using Unicode-escape matching to Helcim's PHP behavior.                                                |
| Input validation       | Rejects non-positive ids, non-finite amounts, unsupported currencies, and malformed provider payloads.                                                                                        |
| Idempotency            | `Idempotency-Key` header is generated for every mutating call and can be overridden by the caller.                                                                                            |
| Payload redaction      | Decoders normalize casing and aliases **without logging**. Callers are expected to redact raw payloads before writing audit logs.                                                             |

---

## Framework readiness matrix

| Framework     | What the library contributes                                                                                                 | What the product/operator still must do                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **PCI-DSS**   | Keeps raw PAN/CVV off your network through Helcim's tokenized Card Vault and HelcimPay.js; uses TLS; does not log card data. | Complete PCI SAQ, network segmentation, access controls, vulnerability scanning, and evidence retention as required by your acquirer/processor. |
| **SOC 2**     | Authentication headers, signature verification, deterministic test contracts, idempotency.                                   | IAM, change approval, monitoring, incident response, vendor management, evidence retention.                                                     |
| **ISO 27001** | Secure defaults and cryptographic verification.                                                                              | ISMS scope, risk treatment, asset inventory, supplier controls, backup/continuity, audit program.                                               |
| **PIPEDA**    | Tokenization-compatible API, validation boundaries, no unnecessary PII logging.                                              | Accountability, consent/purpose records, Canadian/processor assessment, retention, DSAR and breach procedures.                                  |
| **GDPR**      | Data-minimization-compatible contracts and webhook integrity.                                                                | Lawful basis, DPA/SCC, DPIA, transfer assessment, DSAR/erasure, 72-hour breach process.                                                         |
| **HIPAA**     | No PHI-specific behavior; only payment identifiers are handled.                                                              | Formal PHI decision, BAA, risk analysis, workforce controls, audit and contingency safeguards.                                                  |

---

## Required integration invariants

The consuming application must:

1. Keep raw PAN/CVV/full bank details out of its own requests, logs, audit metadata, analytics, and exports.
2. Store API and webhook secrets in a managed secret store; never commit them.
3. Use HTTPS for all production traffic.
4. Bind HelcimPay checkout completion to an authenticated tenant and an expiring server-side credential.
5. Enforce webhook timestamp/replay policy and durable idempotency.
6. Retain only masked display values and processor references.
7. Exercise deletion/retention and incident runbooks.

---

## Security highlights

- **PCI Level 1 Service Provider** — Helcim is certified at the highest PCI-DSS level for service providers. See [Helcim Security](https://www.helcim.com/security/).
- **AES-256 encryption at rest** — sensitive cardholder data is encrypted.
- **TLS 1.2+ in transit** — all data between your systems, customers, and Helcim is encrypted.
- **Tokenization** — the Card Vault stores card data and issues tokens; your servers never hold PANs.

---

## Data residency

Helcim is a Canadian corporation with its contracting party and primary support in Canada. Personal data may be processed in Canada and the United States, with Standard Contractual Clauses (SCCs) as the transfer safeguard. See [Helcim's Canadian privacy policy](https://legal.helcim.com/ca/privacy-policy/) and [sub-processor list](https://legal.helcim.com/ca/privacy-policy/subprocessors/) for the authoritative, up-to-date list.

For a deeper comparison of data sovereignty and pricing, see [`PRICING.md`](./PRICING.md).
