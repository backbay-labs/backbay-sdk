/**
 * @backbay/npctv - Relay Client Tests
 *
 * Verifies NpcTvRelayClient sends correct HTTP requests.
 */

import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { NpcTvRelayClient } from '../src/relay/client.js';
import type { StreamEvent } from '../src/types.js';

/** Captured fetch calls for assertions. */
interface FetchCall {
  url: string;
  init: RequestInit;
}

let fetchCalls: FetchCall[] = [];
let originalFetch: typeof globalThis.fetch;

/** Mock successful JSON response. */
function mockFetch(responseBody: unknown = {}, status = 200) {
  return mock((url: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init: init ?? {} });
    return Promise.resolve(
      new Response(JSON.stringify(responseBody), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  fetchCalls = [];
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('NpcTvRelayClient', () => {
  test('registerChannel sends POST /npctv/channels', async () => {
    const channelData = {
      channelId: 'ch-1',
      name: 'Test Channel',
      category: 'coding',
      agentId: 'agent-123',
      status: 'live',
    };
    globalThis.fetch = mockFetch(channelData);

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    const result = await client.registerChannel({
      name: 'Test Channel',
      category: 'coding',
      agentId: 'agent-123',
    });

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels');
    expect(fetchCalls[0].init.method).toBe('POST');
    expect(result.channelId).toBe('ch-1');

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.name).toBe('Test Channel');
    expect(body.category).toBe('coding');
  });

  test('deregisterChannel sends DELETE /npctv/channels/:id', async () => {
    globalThis.fetch = mockFetch({}, 204);

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    await client.deregisterChannel('ch-1');

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels/ch-1');
    expect(fetchCalls[0].init.method).toBe('DELETE');
  });

  test('pushEvents sends POST /npctv/channels/:id/events with event batch', async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    const events: StreamEvent[] = [
      {
        id: 'evt-1',
        timestamp: '2026-02-10T12:00:00Z',
        type: 'command',
        content: '[bash] ls -la',
      },
      {
        id: 'evt-2',
        timestamp: '2026-02-10T12:00:01Z',
        type: 'success',
        content: 'Command completed',
      },
    ];

    await client.pushEvents('ch-1', events);

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels/ch-1/events');
    expect(fetchCalls[0].init.method).toBe('POST');

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.events).toHaveLength(2);
    expect(body.events[0].id).toBe('evt-1');
  });

  test('heartbeat sends POST /npctv/channels/:id/heartbeat', async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    await client.heartbeat('ch-1');

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels/ch-1/heartbeat');
    expect(fetchCalls[0].init.method).toBe('POST');
  });

  test('getChat sends GET /npctv/channels/:id/chat', async () => {
    const messages = {
      messages: [
        { id: 'm-1', author: 'viewer1', content: 'Hello!', timestamp: '2026-02-10T12:00:00Z', isAgent: false },
      ],
    };
    globalThis.fetch = mockFetch(messages);

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    const result = await client.getChat('ch-1');

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels/ch-1/chat');
    expect(fetchCalls[0].init.method).toBe('GET');
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe('viewer1');
  });

  test('getChat passes "since" query parameter', async () => {
    globalThis.fetch = mockFetch({ messages: [] });

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    await client.getChat('ch-1', '2026-02-10T11:00:00Z');

    expect(fetchCalls[0].url).toContain('since=2026-02-10T11%3A00%3A00Z');
  });

  test('sendReaction sends POST /npctv/channels/:id/reactions', async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    await client.sendReaction('ch-1', 'fire');

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels/ch-1/reactions');

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.type).toBe('fire');
  });

  test('sendEmote sends POST /npctv/channels/:id/emotes', async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    await client.sendEmote('ch-1', 'celebration', 'WE DID IT!');

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels/ch-1/emotes');

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.type).toBe('celebration');
    expect(body.message).toBe('WE DID IT!');
  });

  test('includes Authorization header when apiKey is set', async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({
      url: 'http://localhost:3000/api/v1/npctv',
      apiKey: 'my-secret-key',
    });
    await client.heartbeat('ch-1');

    const headers = fetchCalls[0].init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-secret-key');
  });

  test('does not include Authorization header when apiKey is absent', async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });
    await client.heartbeat('ch-1');

    const headers = fetchCalls[0].init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  test('throws on non-2xx responses', async () => {
    globalThis.fetch = mockFetch({ error: 'Not Found' }, 404);

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv' });

    await expect(client.heartbeat('ch-missing')).rejects.toThrow('failed (404)');
  });

  test('strips trailing slashes from base URL', async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: 'http://localhost:3000/api/v1/npctv///' });
    await client.heartbeat('ch-1');

    expect(fetchCalls[0].url).toBe('http://localhost:3000/api/v1/npctv/npctv/channels/ch-1/heartbeat');
  });
});
