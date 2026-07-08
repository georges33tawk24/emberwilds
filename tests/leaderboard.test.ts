/** The leaderboard Worker (backend/leaderboard/worker.mjs) — tested whole
 *  against a Map-backed KV mock. No Cloudflare needed. */
import { describe, expect, it, beforeEach } from 'vitest';
// @ts-expect-error — plain JS module worker, no types shipped
import { handle, sanitizeName } from '../backend/leaderboard/worker.mjs';

function mockKV() {
  const store = new Map<string, string>();
  return {
    store,
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string, _o?: unknown) => void store.set(k, v),
  };
}

let env: { SCORES: ReturnType<typeof mockKV>; ALLOWED_ORIGIN: string };
beforeEach(() => {
  env = { SCORES: mockKV(), ALLOWED_ORIGIN: 'https://emberwilds.fun' };
});

const submit = (body: unknown) =>
  handle(new Request('https://api.test/score', { method: 'POST', body: JSON.stringify(body) }), env);
const top = async (level: number) => {
  const res = await handle(new Request(`https://api.test/leaderboard?level=${level}`), env);
  return { status: res.status, body: await res.json() };
};
const UID = 'device-12345678';

describe('leaderboard worker', () => {
  it('accepts a valid score and serves it back, name sanitized', async () => {
    const res = await submit({ level: 3, timeMs: 61500, name: 'sorrel!', uid: UID });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, improved: true, rank: 1 });
    const { body } = await top(3);
    expect(body.scores).toEqual([{ name: 'SORREL', timeMs: 61500 }]);
  });

  it('keeps one entry per device — better time replaces, worse is ignored', async () => {
    await submit({ level: 0, timeMs: 50000, name: 'FOX A', uid: UID });
    env.SCORES.store.delete('rl:0:' + UID); // step past the rate limit
    await submit({ level: 0, timeMs: 40000, name: 'FOX A', uid: UID });
    env.SCORES.store.delete('rl:0:' + UID);
    const worse = await submit({ level: 0, timeMs: 45000, name: 'FOX B', uid: UID });
    expect((await worse.json()).improved).toBe(false);
    const { body } = await top(0);
    // the time kept the best run, but the rename still propagated
    expect(body.scores).toEqual([{ name: 'FOX B', timeMs: 40000 }]);
  });

  it('sorts ascending and trims to the top 20', async () => {
    for (let i = 0; i < 25; i++) {
      await submit({ level: 1, timeMs: 100000 - i * 1000, name: `P${i}`, uid: `uid-${String(i).padStart(8, '0')}` });
    }
    const { body } = await top(1);
    expect(body.scores).toHaveLength(20);
    expect(body.scores[0].timeMs).toBe(76000); // the fastest of the 25
    const times = body.scores.map((s: { timeMs: number }) => s.timeMs);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('rejects implausible times, bad levels, and bad uids', async () => {
    expect((await submit({ level: 0, timeMs: 500, name: 'X', uid: UID })).status).toBe(400);
    expect((await submit({ level: 0, timeMs: 99999999, name: 'X', uid: UID })).status).toBe(400);
    expect((await submit({ level: -1, timeMs: 50000, name: 'X', uid: UID })).status).toBe(400);
    expect((await submit({ level: 999, timeMs: 50000, name: 'X', uid: UID })).status).toBe(400);
    expect((await submit({ level: 0, timeMs: 50000, name: 'X', uid: 'x' })).status).toBe(400);
    expect((await submit({ level: 0, timeMs: 50000, name: 'X', uid: 'bad uid!!!!!!!' })).status).toBe(400);
  });

  it('enforces per-level physical minimum times (rejects impossible, accepts real)', async () => {
    // level 0 (Sunroot Hollow, 224 wide): floor ~5.7s. A 5s clear is physically
    // impossible; a 6s+ clear is a plausible speedrun.
    expect((await submit({ level: 0, timeMs: 5000, name: 'CHEAT', uid: 'uid-floor01' })).status).toBe(400);
    expect((await submit({ level: 0, timeMs: 6500, name: 'FAST', uid: 'uid-floor02' })).status).toBe(200);
    // a boss arena (level 7) is tiny -> keeps the 3s fallback floor
    expect((await submit({ level: 7, timeMs: 3500, name: 'BOSS', uid: 'uid-floor03' })).status).toBe(200);
    expect((await submit({ level: 7, timeMs: 2000, name: 'NOPE', uid: 'uid-floor04' })).status).toBe(400);
  });

  it('rate limits repeat submissions per uid+level but not across levels', async () => {
    await submit({ level: 5, timeMs: 50000, name: 'A', uid: UID });
    const again = await submit({ level: 5, timeMs: 45000, name: 'A', uid: UID });
    expect(again.status).toBe(429);
    const other = await submit({ level: 6, timeMs: 50000, name: 'A', uid: UID });
    expect(other.status).toBe(200);
  });

  it('isolates boards per level', async () => {
    await submit({ level: 10, timeMs: 30000, name: 'TEN', uid: 'uid-aaaaaaaa' });
    await submit({ level: 11, timeMs: 40000, name: 'ELEVEN', uid: 'uid-bbbbbbbb' });
    expect((await top(10)).body.scores).toEqual([{ name: 'TEN', timeMs: 30000 }]);
    expect((await top(11)).body.scores).toEqual([{ name: 'ELEVEN', timeMs: 40000 }]);
  });

  it('renames a device across only the boards it sits on', async () => {
    await submit({ level: 2, timeMs: 30000, name: 'FOX', uid: UID });
    await submit({ level: 3, timeMs: 40000, name: 'FOX', uid: UID });
    await submit({ level: 3, timeMs: 35000, name: 'RIVAL', uid: 'uid-rival-000' });
    const res = await handle(new Request('https://api.test/name', {
      method: 'POST',
      body: JSON.stringify({ uid: UID, name: 'georges!', levels: [2, 3, 4] }),
    }), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, name: 'GEORGES', updated: 2 });
    expect((await top(2)).body.scores[0].name).toBe('GEORGES');
    const l3 = (await top(3)).body.scores;
    expect(l3.find((e: { timeMs: number }) => e.timeMs === 40000)?.name).toBe('GEORGES');
    expect(l3.find((e: { timeMs: number }) => e.timeMs === 35000)?.name).toBe('RIVAL'); // untouched
    // and the rename sweep is rate limited
    const again = await handle(new Request('https://api.test/name', {
      method: 'POST', body: JSON.stringify({ uid: UID, name: 'ANOTHER', levels: [2] }),
    }), env);
    expect(again.status).toBe(429);
  });

  it('sends CORS headers from env and answers preflight', async () => {
    const pre = await handle(new Request('https://api.test/score', { method: 'OPTIONS' }), env);
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe('https://emberwilds.fun');
    const res = await handle(new Request('https://api.test/leaderboard?level=0'), env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://emberwilds.fun');
  });
});

describe('sanitizeName', () => {
  it('uppercases and strips to the allowlist', () => {
    expect(sanitizeName('xX_Sorrel_Xx!!')).toBe('XX_SORREL_XX');
    expect(sanitizeName('  fox  ')).toBe('FOX');
    expect(sanitizeName('a'.repeat(40))).toBe('A'.repeat(12));
  });
  it('falls back to FOX on empty or blocked names', () => {
    expect(sanitizeName('')).toBe('FOX');
    expect(sanitizeName('!!!')).toBe('FOX');
    expect(sanitizeName('sh-it')).toBe('FOX'); // blocklist checks letters only
    expect(sanitizeName(undefined)).toBe('FOX');
  });
});
