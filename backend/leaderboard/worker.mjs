/**
 * EMBERWILDS leaderboard — ONE Cloudflare Worker (GROWTH_ROADMAP Phase 2).
 *
 *   POST /score        {level, timeMs, name, uid, ghost?}  -> submit a clear time
 *   POST /name         {uid, name, levels[]}       -> rename across boards
 *   GET  /leaderboard?level=N                      -> top 20 for a level
 *   GET  /wrghost?level=N                          -> the world #1 run's ghost
 *
 * Design (per the roadmap): KV top-N per level, one entry per device uid
 * (best time wins), sanity caps on times, a KV-TTL rate limit per uid+level,
 * display names sanitized against a conservative allowlist + blocklist.
 * Zero dependencies; the handler takes its storage via `env` so the whole
 * thing unit-tests against a Map-backed mock (see tests/leaderboard.test.ts).
 *
 * Deploy: see DEPLOY.md next to this file. Replay validation (re-simulating
 * input recordings server-side) is the roadmap's next step once this is live.
 */

const TOP_N = 20;
const MIN_TIME_MS = 3_000; // fallback floor (scratch / unlisted levels)
const MAX_TIME_MS = 1_800_000; // 30 minutes
const MAX_LEVEL = 63; // generous headroom over the current 28
const RATE_TTL_S = 60; // one submission per uid+level per minute (KV TTL floor)

// Per-level PHYSICAL minimum clear times (ms). Derived from each level's width
// and the hard horizontal speed cap (dash 260 + max belt drag 55 = 315 px/s):
// a run cannot average faster than that over the start->goal distance, so the
// true minimum is width*16/315. These floors are HALF of that — comfortably
// below any real run (zero false-negative risk) but they reject the physically
// impossible fakes a raw-API cheater would POST. Boss arenas are tiny -> 3s.
// Regenerate with scripts/genMinTimes.mjs if levels change.
const MIN_TIMES = [
  5790, 5790, 5892, 6095, 5994, 6298, 6095, 3000, 6197, 6298,
  6400, 6502, 3000, 6197, 5892, 5689, 6095, 3000, 6095, 5790,
  5994, 6095, 3000, 6095, 5790, 6298, 6400, 3000,
];

function minTimeFor(level) {
  return MIN_TIMES[level] ?? MIN_TIME_MS;
}

// WR replay ghost: a recorded path (not inputs) so anyone can race the world #1
const MAX_GHOST_SAMPLES = 20000; // ~13 min at 25 Hz — far past any real run

/** A ghost is { dt, xs[], ys[], fs[] } of equal length, all finite. Reject
 *  anything malformed or oversized before it ever touches KV. */
function validGhost(g) {
  if (!g || typeof g !== 'object') return false;
  if (typeof g.dt !== 'number' || g.dt < 10 || g.dt > 200) return false;
  const { xs, ys, fs } = g;
  if (!Array.isArray(xs) || !Array.isArray(ys) || !Array.isArray(fs)) return false;
  const n = xs.length;
  if (n < 2 || n > MAX_GHOST_SAMPLES || ys.length !== n || fs.length !== n) return false;
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(xs[i]) || !Number.isFinite(ys[i]) || !Number.isFinite(fs[i])) return false;
  }
  return true;
}

// conservative and short — anything that trips it just plays as FOX
const NAME_BLOCKLIST = ['FUCK', 'SHIT', 'CUNT', 'NIGG', 'FAG', 'RAPE', 'NAZI', 'HITLER', 'PISS', 'DICK', 'COCK', 'ASS'];

/** Uppercase, strip to [A-Z0-9 _-], cap at 12, fall back to FOX. */
export function sanitizeName(raw) {
  const cleaned = String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9 _-]/g, '')
    .trim()
    .slice(0, 12);
  if (!cleaned) return 'FOX';
  const squashed = cleaned.replace(/[^A-Z]/g, '');
  for (const bad of NAME_BLOCKLIST) {
    if (squashed.includes(bad)) return 'FOX';
  }
  return cleaned;
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(env, status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env), ...extra },
  });
}

export async function handle(request, env) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(env) });
  }

  if (request.method === 'GET' && url.pathname === '/leaderboard') {
    const level = Number(url.searchParams.get('level'));
    if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) {
      return json(env, 400, { error: 'bad level' });
    }
    const board = JSON.parse((await env.SCORES.get(`board:${level}`)) ?? '[]');
    return json(env, 200, { level, scores: board.map(({ name, timeMs }) => ({ name, timeMs })) }, {
      'Cache-Control': 'public, max-age=30',
    });
  }

  if (request.method === 'GET' && url.pathname === '/wrghost') {
    const level = Number(url.searchParams.get('level'));
    if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) {
      return json(env, 400, { error: 'bad level' });
    }
    const raw = await env.SCORES.get(`wrghost:${level}`);
    return json(env, 200, raw ? JSON.parse(raw) : { ghost: null }, {
      'Cache-Control': 'public, max-age=60',
    });
  }

  if (request.method === 'POST' && url.pathname === '/name') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json(env, 400, { error: 'bad json' });
    }
    const uid = String(body.uid ?? '');
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(uid)) {
      return json(env, 400, { error: 'bad uid' });
    }
    const levels = Array.isArray(body.levels) ? body.levels.slice(0, MAX_LEVEL + 1) : [];
    if (!levels.every((l) => Number.isInteger(l) && l >= 0 && l <= MAX_LEVEL)) {
      return json(env, 400, { error: 'bad levels' });
    }
    const name = sanitizeName(body.name);
    // renames are cheap but still writes — one sweep per device per minute
    const rlKey = `rl:name:${uid}`;
    if (await env.SCORES.get(rlKey)) {
      return json(env, 429, { error: 'slow down' });
    }
    await env.SCORES.put(rlKey, '1', { expirationTtl: RATE_TTL_S });
    let updated = 0;
    for (const level of levels) {
      const key = `board:${level}`;
      const board = JSON.parse((await env.SCORES.get(key)) ?? '[]');
      const mine = board.find((e) => e.uid === uid);
      if (mine && mine.name !== name) {
        mine.name = name;
        await env.SCORES.put(key, JSON.stringify(board));
        updated++;
      }
    }
    return json(env, 200, { ok: true, name, updated });
  }

  if (request.method === 'POST' && url.pathname === '/score') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json(env, 400, { error: 'bad json' });
    }
    const level = Number(body.level);
    const timeMs = Number(body.timeMs);
    const uid = String(body.uid ?? '');
    if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) {
      return json(env, 400, { error: 'bad level' });
    }
    if (!Number.isInteger(timeMs) || timeMs < minTimeFor(level) || timeMs > MAX_TIME_MS) {
      return json(env, 400, { error: 'bad time' });
    }
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(uid)) {
      return json(env, 400, { error: 'bad uid' });
    }
    const name = sanitizeName(body.name);

    // rate limit: one submission per uid+level per RATE_TTL_S
    const rlKey = `rl:${level}:${uid}`;
    if (await env.SCORES.get(rlKey)) {
      return json(env, 429, { error: 'slow down' });
    }
    await env.SCORES.put(rlKey, '1', { expirationTtl: RATE_TTL_S });

    // merge into the board: one entry per uid, best time wins, top-N kept
    const key = `board:${level}`;
    const board = JSON.parse((await env.SCORES.get(key)) ?? '[]');
    const mine = board.find((e) => e.uid === uid);
    if (mine) {
      if (timeMs >= mine.timeMs) {
        // not an improvement, but keep the display name fresh (renames
        // propagate to old entries on the next submission)
        if (mine.name !== name) {
          mine.name = name;
          await env.SCORES.put(key, JSON.stringify(board));
        }
        return json(env, 200, { ok: true, improved: false, rank: board.indexOf(mine) + 1 });
      }
      mine.timeMs = timeMs;
      mine.name = name;
    } else {
      board.push({ uid, name, timeMs });
    }
    board.sort((a, b) => a.timeMs - b.timeMs);
    board.length = Math.min(board.length, TOP_N);
    await env.SCORES.put(key, JSON.stringify(board));
    const rank = board.findIndex((e) => e.uid === uid) + 1; // 0 = pushed off the board

    // a new world record (rank 1) with a valid recording becomes the ghost
    // everyone races on this level
    let wr = false;
    if (rank === 1 && validGhost(body.ghost)) {
      await env.SCORES.put(`wrghost:${level}`, JSON.stringify({ name, timeMs, ghost: body.ghost }));
      wr = true;
    }
    return json(env, 200, { ok: true, improved: true, rank: rank || null, wr });
  }

  return json(env, 404, { error: 'not found' });
}

export default {
  fetch: (request, env) => handle(request, env),
};
