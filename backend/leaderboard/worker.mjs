/**
 * EMBERWILDS leaderboard — ONE Cloudflare Worker (GROWTH_ROADMAP Phase 2).
 *
 *   POST /score        {level, timeMs, name, uid}  -> submit a clear time
 *   GET  /leaderboard?level=N                      -> top 20 for a level
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
const MIN_TIME_MS = 3_000; // faster than any human clear -> reject
const MAX_TIME_MS = 1_800_000; // 30 minutes
const MAX_LEVEL = 63; // generous headroom over the current 28
const RATE_TTL_S = 60; // one submission per uid+level per minute (KV TTL floor)

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
    if (!Number.isInteger(timeMs) || timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS) {
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
    return json(env, 200, { ok: true, improved: true, rank: rank || null });
  }

  return json(env, 404, { error: 'not found' });
}

export default {
  fetch: (request, env) => handle(request, env),
};
