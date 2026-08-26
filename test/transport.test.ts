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
    await expect(transport.request('GET', '/customers')).rejects.toThrow(
      /timed out after 25ms/
    );
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
    await expect(transport.request('POST', '/purchase', { body: {} })).rejects.toThrow(
      /HTTP 500/
    );
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

  it('does not retry non-retryable statuses like 404 even for GETs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404));
    const transport = createTransport({ ...config, maxRetries: 2 }, fetchMock as typeof fetch);
    await expect(transport.request('GET', '/customers/999')).rejects.toThrow(/HTTP 404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
