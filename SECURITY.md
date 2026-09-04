# Security policy

## Supported versions

Security fixes are applied to the current `main` branch and the latest
published release. Older releases should be upgraded before requesting a
backport.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use the
repository host's private security-advisory channel or contact the maintainer
privately through the project profile. Include reproduction steps, affected
versions, impact, and any suggested mitigation. Do not include live
credentials, verifier tokens, secret tokens, or customer data.

You can expect an acknowledgement within five business days. The maintainer
will validate the report, coordinate a fix and disclosure timeline, and credit
the reporter unless anonymity is requested.

## Scope

Reports are especially useful for:

- signature-verification bypasses in webhook or HelcimPay hash validation;
- credential exposure in logs, errors, test fixtures, or Git history;
- request signing or transport behavior that leaks secrets to third parties.

The project does not accept real secrets in test cases or examples. Use
obviously synthetic values (e.g. `randomBytes`-generated tokens).
