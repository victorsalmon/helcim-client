import { vi } from 'vitest';
import type { HelcimConfig } from '../src/index.js';

export const TEST_CONFIG: HelcimConfig = {
  baseUrl: 'https://api.helcim.test/v2',
  apiToken: 'test-token-abc',
};

export const BASE = 'https://api.helcim.test/v2';

export type FetchCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
};

export function mockFetch(response: {
  status?: number;
  body?: unknown;
  text?: string;
}): { fetchImpl: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fetchImpl = vi.fn(async (url: string, init: any) => {
    calls.push({
      url,
      method: init?.method ?? 'GET',
      headers: init?.headers ?? {},
      body: init?.body,
    });
    const status = response.status ?? 200;
    const text =
      response.text ??
      (response.body !== undefined ? JSON.stringify(response.body) : '');
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => text,
    } as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

/** Parse the request body as JSON. */
export function bodyOf(call: FetchCall): Record<string, any> {
  return JSON.parse(call.body!) as Record<string, any>;
}

/** Assert the call used the given HTTP method. */
export function assertMethod(call: FetchCall, method: string): void {
  if (call.method !== method) {
    throw new Error(`Expected method ${method}, got ${call.method}`);
  }
}

/** Assert the call hit the given path (relative to base URL). */
export function assertPath(call: FetchCall, path: string): void {
  const expected = `${BASE}${path}`;
  // Strip query string for comparison
  const actualUrl = call.url.split('?')[0];
  if (actualUrl !== expected) {
    throw new Error(`Expected URL ${expected}, got ${actualUrl}`);
  }
}

/** Assert a query parameter is present with the expected value. */
export function assertQuery(call: FetchCall, key: string, value: string): void {
  const url = new URL(call.url);
  const actual = url.searchParams.get(key);
  if (actual !== value) {
    throw new Error(`Expected query ${key}=${value}, got ${actual}`);
  }
}

/** Assert a query parameter is absent. */
export function assertQueryAbsent(call: FetchCall, key: string): void {
  const url = new URL(call.url);
  if (url.searchParams.has(key)) {
    throw new Error(`Expected query ${key} to be absent, got ${url.searchParams.get(key)}`);
  }
}

/** Assert a header is present with the expected value. */
export function assertHeader(call: FetchCall, key: string, value: string): void {
  if (call.headers[key] !== value) {
    throw new Error(`Expected header ${key}=${value}, got ${call.headers[key]}`);
  }
}

/** Assert a header is absent. */
export function assertHeaderAbsent(call: FetchCall, key: string): void {
  if (key in call.headers) {
    throw new Error(`Expected header ${key} to be absent, got ${call.headers[key]}`);
  }
}

/** Assert a body field equals the expected value. */
export function assertBodyField(call: FetchCall, key: string, value: any): void {
  const b = bodyOf(call);
  if (b[key] !== value) {
    throw new Error(`Expected body.${key}=${JSON.stringify(value)}, got ${JSON.stringify(b[key])}`);
  }
}

/** Assert a body field is undefined (omitted). */
export function assertBodyFieldAbsent(call: FetchCall, key: string): void {
  const b = bodyOf(call);
  if (key in b) {
    throw new Error(`Expected body.${key} to be absent, got ${JSON.stringify(b[key])}`);
  }
}

/** Assert a nested body field equals the expected value (deep equality for arrays/objects). */
export function assertBodyPath(call: FetchCall, path: string, value: any): void {
  const b = bodyOf(call);
  const parts = path.split('.');
  let cur: any = b;
  for (const p of parts) {
    cur = cur?.[p];
  }
  if (JSON.stringify(cur) !== JSON.stringify(value)) {
    throw new Error(`Expected body.${path}=${JSON.stringify(value)}, got ${JSON.stringify(cur)}`);
  }
}

/** Assert a nested body field is undefined (omitted). */
export function assertBodyPathAbsent(call: FetchCall, path: string): void {
  const b = bodyOf(call);
  const parts = path.split('.');
  let cur: any = b;
  for (const p of parts) {
    cur = cur?.[p];
    if (cur === undefined) return; // already absent
  }
  if (cur !== undefined) {
    throw new Error(`Expected body.${path} to be absent, got ${JSON.stringify(cur)}`);
  }
}
