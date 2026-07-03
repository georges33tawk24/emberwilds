# TUNING.md — the design numbers and why

Single source of truth: [`src/data/tuning.ts`](src/data/tuning.ts). All units
px / px·s⁻¹ / px·s⁻² / ms at the internal 480×270 resolution, 16px tiles.
Everything below is a *starting value tuned to feel* — change the number, not
the architecture.

## Simulation

| Value | Setting | Why |
|---|---|---|
| 120 Hz | fixed timestep | 2 sim steps per 60 Hz frame; deterministic at any display rate; render interpolates |

## Run

| Value | Setting | Why |
|---|---|---|
| accel 1800 | ground acceleration | reaches walk cap in ~0.08s — instant but not twitchy |
| friction 2400 | deceleration | stops from walk in ~3.5 tiles/s of travel; turn-around adds accel+friction for snap |
| walkCap 140 | comfortable speed | ~8.75 tiles/s, readable for precision platforming |
| dashCap 260 | held top speed | built into via reduced accel (420) above walk cap — momentum is a reward |
| airControl 0.82 | air accel multiplier | near-full air control (Jazz verve), slightly under ground for weight |

## Jump

| Value | Setting | Why |
|---|---|---|
| v₀ −560 | jump velocity | ~4.1 tiles of height with hold under rise gravity + apex hang |
| rise 2000 / fall 2600 | asymmetric gravity | light up, heavy down = snappy, weighty arc |
| cutVy −180 | release clamp | variable height: early release tops out ~1.5 tiles |
| coyote 90ms | late-jump grace | ~11 steps — misses feel like your fault, not the ledge's |
| buffer 120ms | early-press grace | press just before landing always jumps |
| apex ×0.6 under \|vy\|<60 | apex hang | a beat of air control at the peak for re-aiming |
| corner correction 4px | head-clip nudge | head grazes slide around corners instead of stopping dead |

## Verbs

| Value | Setting | Why |
|---|---|---|
| glide fall cap 70 | scarf glide | ~4.4 tiles/s descent, full drift — crosses ~10 tiles per 4 tiles of height |
| wall slide cap 90, jump (±220, −520) | wall kit | kick-off clears a 4-tile chimney per jump; 110ms input lock prevents re-stick |
| stomp −360 / held −460 | bounce | held bounce chains onto head-height ledges |
| pound: 110ms windup, 700 fall, stun 0.5s, r24 | ground-pound | Jazz buttstomp: hop-telegraph, fast drop, shockwave stuns + breaks cracked blocks |
| roll 350ms @300, 150ms i-frames | slide | carries momentum under low gaps |
| spring −720 | launch | ~8 tiles of lift (energy: v²/2g_rise ≈ 130px) |

## Combat & health

| Value | Setting | Why |
|---|---|---|
| pellet 340 px/s, 180ms cd | slingblast | rapid single shots; tap-fire cadence |
| charge 420 px/s, 3 dmg, pierce, 500ms hold | alt-fire | commit-to-charge tradeoff |
| hearts 5 | health | Jazz-style, not one-hit; berries heal |
| i-frames 1000ms, knockback (160, −240) | damage response | readable, fair, resets the encounter |

## Enemies

Beetle walks 30 (stomp it). Toad rests 900ms, hops (±120, −320) inside 96px.
Owl bobs ±12px, dives at 230 when you're under it within 130px. Burr rolls 46
with 3 hp and spikes — the "don't stomp me" teacher.

## Feel

Hitstop: stomp 60ms · hurt 90ms · enemy death 40ms · pound 70ms. Screen shake
is trauma-based (shake = trauma² × 3px, decay 1.6/s) with a settings toggle.
Camera: 28px look-ahead toward facing, 24px vertical dead zone, exponential
damping (12%/frame @60), always clamped to level bounds, positions rounded to
whole pixels.
