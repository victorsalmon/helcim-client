# Architecture

`helcim-client` is an ESM TypeScript package that wraps the Helcim REST API. It is organized into small, single-responsibility modules.

---

## Module map

```mermaid
flowchart TD
    subgraph Entry
        A[index.ts]
        S[sandbox.ts]
    end

    subgraph Core
        B[config.ts]
        C[client.ts]
        T[transport.ts]
        R[resources/*.ts]
        D[decode.ts]
        U[types.ts]
        V[util.ts]
    end

    subgraph Verification
        E[webhook.ts]
        F[helcimpay.ts]
    end

    A --> B
    A --> C
    A --> D
    A --> U
    A --> E
    A --> F
    S --> B
    S --> C
    C --> T
    C --> R
    R --> T
    R --> D
    R --> V
    D --> V
```

| File | Responsibility |
|---|---|
| `src/index.ts` | Public exports for the main package. |
| `src/sandbox.ts` | Convenience factory for test-mode clients. |
| `src/config.ts` | Parse environment / explicit config; resolve base URL and API token. |
| `src/client.ts` | Composition root: wires the transport and resource factories into the public client and re-exports shared types/decoders. |
| `src/transport.ts` | Single HTTP entry point: headers, per-request timeout, bounded retry policy, and the `Idempotency-Key` header. |
| `src/resources/*.ts` | Endpoint groups (customers, cards, bank/ACH, plans, subscriptions, invoices, transactions, refunds, HelcimPay), each a factory over `{ request }`. |
| `src/decode.ts` | Response decoders plus validation/unwrapping helpers. |
| `src/types.ts` | Shared entity and input types. |
| `src/util.ts` | Provider-shape helpers (`firstString`, `firstNumber`, `firstArray`), `sha256`, `isProviderErrorStatus`, and idempotency-key generation. |
| `src/webhook.ts` | `verifyHelcimWebhook` — HMAC-SHA256 signature verification with constant-time comparison. |
| `src/helcimpay.ts` | `validateHelcimPayHash` and `parseHelcimPayEventMessage` for HelcimPay.js checkout responses. |

---

## Request lifecycle

```mermaid
sequenceDiagram
    participant App as Your app
    participant C as createHelcimClient
    participant R as request()
    participant H as Helcim API

    App->>C: createHelcimClient(config, fetch)
    C->>C: validate input, build headers
    App->>C: createCustomer({...})
    C->>R: POST /customers with idempotency key
    R->>H: HTTPS JSON request
    H-->>R: JSON response
    R->>R: normalize casing / array wrapping
    R-->>C: decoded HelcimCustomer
    C-->>App: HelcimCustomer
```

Write calls that support replay protection include an **idempotency key** (`Idempotency-Key`). The default key is random per call, so pass an explicit `idempotencyKey` when a retry must be replay-safe.

---

## Response normalization

Helcim returns inconsistent object shapes and key casing across endpoints. The client handles three common patterns:

```mermaid
flowchart LR
    A[Helcim JSON response] --> B{Shape}
    B -->|Object with data array| C[decode first array item]
    B -->|Object with direct fields| D[decode object directly]
    B -->|Array wrapper| E[decode first element]
    C & D & E --> F[Canonical TypeScript model]
```

For example, some invoice endpoints return `{ data: [invoice] }`, others return the invoice object. The client uses `firstArray(raw, ['data'])` and falls back to the raw object so callers always receive a normalized `HelcimInvoice`.

---

## Webhook verification

```mermaid
sequenceDiagram
    participant H as Helcim
    participant S as your server
    participant V as verifyHelcimWebhook

    H->>S: POST /webhook with headers
    Note over H,S: webhook-id, webhook-timestamp, webhook-signature
    S->>V: id, timestamp, rawBody, signatures, verifierToken
    V->>V: base64 decode verifier
    V->>V: HMAC-SHA256 of "id.timestamp.body"
    V->>V: split signatures on whitespace
    loop each vN,sig
        V->>V: compare sig with expected
    end
    V-->>S: true / false
```

The comparison is **constant-time** via `crypto.timingSafeEqual` to prevent timing attacks. Multiple signatures are supported; any match is accepted.

---

## HelcimPay verification

```mermaid
sequenceDiagram
    participant HP as HelcimPay.js
    participant App as Your app
    participant V as validateHelcimPayHash

    HP->>App: checkout complete<br/>{ data, hash }
    App->>V: data, hash, secretToken
    V->>V: compact JSON of data + secretToken
    V->>V: SHA-256, base64, lowercase
    V->>V: compare with hash
    V-->>App: true / false
```

The hash is computed on the **compact, escaped JSON** of `data` plus the `secretToken`, exactly matching Helcim's PHP `json_encode` behavior for special Unicode characters. The comparison is case-insensitive and trims surrounding whitespace.

---

## Decoder design

Decoders are defensive. They accept `unknown` input and return a typed object or `null`. The `first*` helpers search multiple key variants:

```mermaid
flowchart LR
    A[record: unknown] --> B[firstString]
    A --> C[firstNumber]
    A --> D[firstArray]
    B --> E[camelCase 'name']
    B --> F[PascalCase 'Name']
    B --> G[snake_case 'name']
    C --> H[camelCase 'id']
    C --> I[PascalCase 'Id']
    D --> J[camelCase 'lineItems']
    D --> K[PascalCase 'LineItems']
    D --> L[snake_case 'line_items']
```

This lets the client absorb Helcim's inconsistent casing without requiring upstream callers to transform payloads.

---

## Configuration

`createHelcimConfigFromEnv` (from `src/config.ts` and re-exported by `src/index.ts`) resolves the base URL and API token from environment variables or explicit values:

```mermaid
flowchart TD
    A[Input] --> B{HELCIM_BASE_URL?}
    B -->|Yes| C[Trim and strip trailing slashes]
    B -->|No| D{HELCIM_ENV?}
    D -->|production / prod| E[api.helcim.com/v2]
    D -->|anything else| F[api.helcim.test/v2]
    A --> G{HELCIM_API_TOKEN?}
    G -->|non-empty| H[trim token]
    G -->|empty| I[null config]
```

The default is the **test endpoint**, so a missing `HELCIM_ENV` cannot accidentally send requests to production.

---

## Idempotency

Mutating write calls that support replay protection generate a random idempotency key using `crypto.randomUUID` and send it as the `Idempotency-Key` header. Callers can pass their own key for cross-request replay safety.
