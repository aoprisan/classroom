import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiError } from '../api-client';

// Mock localStorage for auth token
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
  configurable: true,
});

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    storage.clear();
    client = new ApiClient('https://api.example.com');
    vi.restoreAllMocks();
  });

  it('sends GET requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });
    globalThis.fetch = mockFetch;

    const result = await client.get<{ data: string }>('/test');
    expect(result.data).toBe('test');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends POST requests with body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: '123' }),
    });
    globalThis.fetch = mockFetch;

    const result = await client.post<{ id: string }>('/items', { name: 'test' });
    expect(result.id).toBe('123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    );
  });

  it('includes auth token in headers when present', async () => {
    storage.set('classroom-auth-token', 'my-jwt-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = mockFetch;

    await client.get('/protected');
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('does not include auth header when no token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = mockFetch;

    await client.get('/public');
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('throws ApiError on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'not found' }),
    });
    globalThis.fetch = mockFetch;

    await expect(client.get('/missing')).rejects.toThrow(ApiError);
    await expect(client.get('/missing')).rejects.toThrow('not found');
  });

  it('returns undefined for 204 responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });
    globalThis.fetch = mockFetch;

    const result = await client.delete('/item/123');
    expect(result).toBeUndefined();
  });

  it('strips trailing slash from base URL', async () => {
    const clientWithSlash = new ApiClient('https://api.example.com/');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = mockFetch;

    await clientWithSlash.get('/test');
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.example.com/test');
  });

  it('handles non-JSON error responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('not json')),
    });
    globalThis.fetch = mockFetch;

    await expect(client.get('/broken')).rejects.toThrow('Internal Server Error');
  });
});
