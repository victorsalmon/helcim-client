// Minimal runnable example: sign a webhook payload the way Helcim does,
// then verify it with this package's built output.
//
// Run from the repo root (build first, no dependencies beyond the repo):
//   npm run build && node examples/verify-webhook.mjs
//
// Uses only node:crypto plus the package itself. The verifier token below is
// a random synthetic value — never use a live token in code or logs.

import { createHmac, randomBytes } from 'node:crypto';
import { verifyHelcimWebhook } from '../dist/index.js';

const verifierToken = randomBytes(32).toString('base64');
const webhookId = 'wh_example01';
const timestamp = String(Math.floor(Date.now() / 1000));
const rawBody = JSON.stringify({ event: 'cardTransaction.created', id: 123 });

const signature = createHmac('sha256', Buffer.from(verifierToken, 'base64'))
  .update(`${webhookId}.${timestamp}.${rawBody}`, 'utf8')
  .digest('base64');

const ok = verifyHelcimWebhook(webhookId, timestamp, rawBody, `v1,${signature}`, verifierToken);
console.log(ok ? 'webhook signature valid' : 'webhook signature INVALID');
if (!ok) process.exitCode = 1;
