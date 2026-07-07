/**
 * THE CINDERPEAKS (World 4) — ash-grey volcanic highlands under the foundry
 * smoke, the last wild country before the Baron's own ground. The world's
 * identity is VERTICALITY + the Rust's machinery, escalating level by level:
 *   4-1 THE ASHFALL ROAD  — VENTS.  Setpiece: THE VENTFIELD.
 *   4-2 (next)            — CLIMB switchbacks
 *   4-3 (next)            — FOUNDRY LOCKS (keys/gates as machinery)
 *   4-4 (next)            — THE BARONS ROAD gauntlet
 * Movement law honored: jump 4 up / 6 across; pits ≤5 wide; springs lift 8;
 * carve pits AFTER ground fills. Run: node scripts/buildCinder.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 4-1 THE ASHFALL ROAD — learn the mountain. Ember vents (springs) throw you
// up ledges a jump can't reach; ash falls, kites circle, the road climbs.
// ---------------------------------------------------------------------------
function ashfallRoad() {
  const W = 244, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: a mountain road that only ever climbs -----------------------
  c.ground(1, 36, FLOOR);           // trailhead
  c.ground(37, 60, 33);             // first rise
  c.ground(61, 100, FLOOR);         // THE VENTFIELD flats (pits punched below)
  c.ground(101, 130, 32);           // bench above the field
  c.ground(131, 162, 28);           // the shoulder
  c.ground(163, 200, 32);           // saddle down
  c.ground(201, 242, 30);           // beacon rise

  // ---- trailhead teach: one vent, one ledge you cannot jump to --------------
  c.onFloor(24, 'S');               // first vent
  c.oneway(21, 29, 7);              // ledge 7 above the floor — vent-only
  c.gems(22, 27, 4, 2);             // reward for riding it
  c.gems(10, 35, 4, 2);             // walk-in gem line
  c.set(44, 32, 'B');

  // ---- THE VENTFIELD: three vents chain across three pits -------------------
  c.carve(66, FLOOR, 70, H - 1);    // pit I  (5 wide)
  c.carve(78, FLOOR, 82, H - 1);    // pit II
  c.carve(90, FLOOR, 94, H - 1);    // pit III
  c.onFloor(63, 'S');
  c.onFloor(75, 'S');
  c.onFloor(87, 'S');
  c.gemArc(68, 29, 5);
  c.gemArc(80, 29, 5);
  c.gemArc(92, 29, 5);
  c.set(80, 28, 'M');               // the flight token, riding arc two
  // high rafter over the field — vent up, walk the sky road
  c.oneway(72, 26, 4);
  c.oneway(84, 26, 4);
  c.gems(73, 24, 2, 2);
  c.gems(85, 24, 2, 2);

  // ---- bench: rest + the ash cellar under a cracked plate --------------------
  c.onFloor(112, 'K');              // checkpoint
  c.set(116, 31, 'B');
  c.run(120, 32, 2, 'C');           // cracked slag plate
  c.carve(120, 33, 121, 33);
  c.carve(117, 34, 124, 37);        // the cellar pocket
  c.set(122, 36, 'M');              // cellar token
  c.gems(118, 36, 2, 2);
  c.set(123, 37, 'S');              // vent back out

  // ---- the shoulder: switchback ledges, imps hold the steps ------------------
  c.oneway(134, 24, 3);
  c.oneway(140, 20, 3);
  c.oneway(146, 16, 3);
  c.set(147, 15, 'M');              // top of the switchbacks
  c.gems(135, 22, 2, 2);
  c.gems(141, 18, 2, 2);
  c.gems(150, 26, 3, 2);            // shoulder road line

  // ---- saddle: kites own the open air ----------------------------------------
  c.gems(170, 30, 3, 2);
  c.set(178, 31, 'B');
  c.gemArc(188, 30, 5);

  // ---- beacon rise: the leaning slag chimney (landmark + skill token) --------
  c.rect(214, 22, 216, 29, 'X');    // the chimney stack
  c.oneway(213, 21, 5);             // its cap
  c.set(215, 20, 'M');              // no vent here — wall-kick or glide
  c.gems(206, 28, 3, 2);
  c.onFloor(232, 'F');

  // ---- cast --------------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(16, 'E');               // slag crawler on the walk-in
  c.onFloor(50, 'E');
  c.onFloor(98, 'E');               // crawler guards the field's far lip
  c.onFloor(108, 'T');              // soot imps on the bench
  c.onFloor(138, 'T');
  c.onFloor(152, 'T');              // imp holds the shoulder road
  c.set(168, 24, 'O');              // ash kites ride the saddle updraft
  c.set(184, 22, 'O');
  c.onFloor(210, 'A');              // a clinker burr rolls the beacon rise
  c.onFloor(224, 'E');

  return {
    name: 'The Ashfall Road', theme: 'cinder', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-1: "The Ashfall Road" (244×42, day)
CONCEPT  VENTS. Ember geysers throw you up ledges no jump can reach — the
         mountain teaches you to ride its breath.
SETPIECE THE VENTFIELD — three vents chain across three pits; gem arcs mark
         each flight, a token rides the middle one, and a one-way sky road
         waits above for anyone who vents higher than they must.
ROUTES   floor road with vent hops / the rafter sky road over the field /
         the ash cellar under a cracked plate on the bench.
TOKENS   arc two in flight (x80) / ash cellar (x122) / switchback top (x147)
         / slag chimney cap (x215, skill).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['cinder1.ts', ashfallRoad()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
