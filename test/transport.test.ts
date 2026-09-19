import { describe, expect, it, vi } from 'vitest';
import { createTransport } from '../src/transport.js';

const config = {
  baseUrl: 'https://api.helcim.test/v2',
  apiToken: 'token-1',
};

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createTransport timeout', () => {
  it('surfaces an explicit timeout error when the call exceeds timeoutMs', async () => {
    const hangingFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }))
          );
        })
    );
    const transport = createTransport({ ...config, timeoutMs: 25 }, hangingFetch as typeof fetch);
    await expect(transport.request('GET', '/customers')).rejects.toThrow(/timed out after 25ms/);
  });

  it('gives each retry a fresh timeout signal instead of a pre-aborted one', async () => {
    const signals: (AbortSignal | null | undefined)[] = [];
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      const signal = init?.signal;
      signals.push(signal);
      // Real fetch rejects immediately when handed an already-aborted signal.
      if (signal?.aborted) {
        return Promise.reject(
          Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
        );
      }
      // First attempt hangs until its own timeout aborts it; the retry succeeds.
      if (signals.length === 1) {
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }))
          );
        });
      }
      return Promise.resolve(jsonResponse(200, { id: 7 }));
    });
    const transport = createTransport(
      { ...config, timeoutMs: 25, maxRetries: 1 },
      fetchMock as typeof fetch
    );
    await expect(transport.request('GET', '/customers/7')).resolves.toMatchObject({ id: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(signals[0]).not.toBe(signals[1]);
    expect(signals[1]?.aborted).toBe(false);
  });
});

describe('createTransport base URL guard', () => {
  it('refuses a non-loopback http base URL before the api token can be sent', () => {
    expect(() => createTransport({ baseUrl: 'http://api.helcim.com/v2', apiToken: 't' })).toThrow(
      /https/
    );
  });

  it('accepts a loopback http base URL for local test doubles', () => {
    expect(() =>
      createTransport({ baseUrl: 'http://localhost:8080/v2', apiToken: 't' })
    ).not.toThrow();
  });
});

describe('createTransport retry policy', () => {
  it('retries a GET that fails with 5xx and succeeds on a later attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(200, { id: 7 }));
    const transport = createTransport({ ...config, maxRetries: 2 }, fetchMock as typeof fetch);
    await expect(transport.request('GET', '/customers/7')).resolves.toMatchObject({ id: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries an idempotency-keyed write that fails with 429', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }));
    const transport = createTransport({ ...config, maxRetries: 2 }, fetchMock as typeof fetch);
    await expect(
      transport.request('POST', '/purchase', { idempotencyKey: 'key-1', body: {} })
    ).resolves.toMatchObject({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries a write without an idempotency key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(500));
    const transport = createTransport({ ...config, maxRetries: 3 }, fetchMock as typeof fetch);
    await expect(transport.request('POST', '/purchase', { body: {} })).rejects.toThrow(/HTTP 500/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry by default (maxRetries defaults to 0)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(503));
    const transport = createTransport(config, fetchMock as typeof fetch);
    await expect(transport.request('GET', '/customers')).rejects.toThrow(/HTTP 503/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxRetries and surfaces the provider status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500));
    const transport = createTransport({ ...config, maxRetries: 1 }, fetchMock as typeof fetch);
    await expect(transport.request('GET', '/customers')).rejects.toThrow(/HTTP 500/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries a write without an idempotency key (network error)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('socket hang up'));
    const transport = createTransport({ ...config, maxRetries: 3 }, fetchMock as typeof fetch);
    await expect(transport.request('POST', '/purchase', { body: {} })).rejects.toThrow(
      /socket hang up/
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-retryable statuses like 404 even for GETs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404));
    const transport = createTransport({ ...config, maxRetries: 2 }, fetchMock as typeof fetch);
    await expect(transport.request('GET', '/customers/999')).rejects.toThrow(/HTTP 404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
