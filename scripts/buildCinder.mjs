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
// 4-2 THE CLINKER STEPS — the mountain goes vertical. A patient stair or a
// vent that skips it; the high plateau belongs to the kites.
// ---------------------------------------------------------------------------
function clinkerSteps() {
  const W = 232, H = 48, FLOOR = 42;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: valley, benches, the wall, plateau, descent ridge ----------
  c.ground(1, 40, FLOOR);           // valley floor
  c.ground(41, 70, 38);             // bench I
  c.ground(71, 100, 34);            // bench II (stair court)
  c.ground(101, 160, 24);           // the high plateau
  c.ground(161, 190, 29);           // descent ridge
  c.ground(191, 230, 34);           // beacon spur

  // valley walk-in
  c.gems(8, 41, 4, 2);
  c.onFloor(14, 'E');
  c.set(30, 41, 'B');
  c.onFloor(34, 'E');

  // bench I: teach the burr on a narrow shelf
  c.gems(48, 37, 3, 2);
  c.onFloor(56, 'A');
  c.set(66, 37, 'B');

  // ---- THE STAIR OF EMBERS: a freestanding stair tower up the wall ---------
  // pillars with one-way caps step up bench II; a vent at the base skips the
  // first half for anyone who trusts the mountain's breath
  const step = (x, capY) => {
    c.rect(x, capY + 1, x + 1, 33, 'X');
    c.oneway(x - 1, capY, 4);
  };
  step(78, 31);
  step(84, 28);
  step(90, 25);
  step(96, 22);
  c.onFloor(74, 'S');               // the vent — 8 of lift, onto the mid-stair
  c.gems(78, 29, 2, 2);
  c.gems(90, 23, 2, 2);
  c.gemArc(75, 30, 5);              // the vent's flight arc
  c.onFloor(88, 'T');               // an imp holds the stair court
  // stair-top spur: a token on a high cap just past the last step
  c.rect(100, 19, 101, 21, 'X');
  c.oneway(99, 18, 4);
  c.set(100, 17, 'M');              // stair-top token

  // checkpoint on arrival
  c.onFloor(106, 'K');

  // ---- the high plateau: kites own the open sky -----------------------------
  c.gems(112, 22, 3, 2);
  c.set(120, 16, 'O');
  c.gemArc(126, 18, 5);
  c.set(134, 14, 'O');
  c.gems(140, 22, 3, 2);
  c.onFloor(146, 'T');
  c.set(150, 23, 'B');
  // the undercut gallery below the plateau lip — risk the drop for the prize
  c.carve(116, 28, 130, 31);
  c.set(123, 30, 'M');              // gallery token
  c.gems(118, 30, 2, 2);
  c.set(129, 31, 'S');              // vent back out to the plateau
  c.run(122, 24, 2, 'C');           // the cracked lip that drops you in

  // ---- descent ridge: burr convoy rolls the slope ---------------------------
  c.onFloor(166, 'A');
  c.onFloor(174, 'A');
  c.gems(170, 27, 3, 2);
  c.set(182, 28, 'B');

  // ---- beacon spur: one last vent to a sky shelf -----------------------------
  c.onFloor(198, 'S');
  c.oneway(195, 27, 7);             // the sky shelf, vent-only
  c.set(198, 26, 'M');              // shelf token
  c.gems(196, 25, 2, 1);
  c.gemArc(210, 32, 5);
  c.onFloor(206, 'T');
  c.onFloor(216, 'E');
  c.onFloor(224, 'F');

  // the whisper: a pocket under the valley floor — a hole drops you in, a
  // vent under the hole breathes you back out
  c.carve(36, 43, 40, 44);
  c.carve(38, 42, 38, 42);          // the entry hole in the floor
  c.set(38, 44, 'S');               // the vent, directly under the hole
  c.set(37, 44, 'M');               // valley pocket token
  c.gems(39, 44, 2, 1);

  c.onFloor(6, 'P');
  c.set(108, 18, 'O');              // a kite greets the plateau
  c.gems(104, 22, 3, 2);            // plateau greeting line
  c.gems(220, 32, 2, 2);            // beacon-side sparkle

  return {
    name: 'The Clinker Steps', theme: 'cinder', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-2: "The Clinker Steps" (232×48, day)
CONCEPT  CLIMB. The mountain goes vertical — a patient pillar stair or one
         vent that skips half of it. Height is the level's whole language.
SETPIECE THE STAIR OF EMBERS — four freestanding pillar steps up the great
         wall, a vent flight arc beside them, kites circling the plateau
         above; the stair-top spur holds a token.
ROUTES   stair vs vent up the wall; plateau sky road vs the undercut gallery
         beneath its lip (cracked entry, vent exit); a valley wall pocket.
TOKENS   stair-top spur (x100) / plateau gallery (x123) / beacon sky shelf
         (x198) / valley pocket (x38, whisper).`,
  };
}

// ---------------------------------------------------------------------------
// 4-3 THE SMELTWORKS — the Rust's machinery in full: climb the smelter tower
// (keys and doors), throw the master switch, then PLUNGE the opened chute.
// ---------------------------------------------------------------------------
function smeltworks() {
  const W = 224, H = 52, FLOOR = 46;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 222, FLOOR);

  // ---- approach road ---------------------------------------------------------
  c.onFloor(6, 'P');
  c.gems(12, 45, 4, 2);
  c.onFloor(18, 'E');
  c.onFloor(30, 'A');
  c.set(38, 45, 'B');
  // maintenance undercut before the tower
  c.run(44, 43, 2, 'C');
  c.carve(44, 44, 45, 44);
  c.carve(42, 45, 48, 48);
  c.set(46, 47, 'M');               // undercut token
  c.gems(43, 47, 2, 1);
  c.onFloor(52, 'K');               // checkpoint at the tower door

  // ---- THE SMELTER TOWER (x56..x128) ------------------------------------------
  // west wall, roof, east wall; five gallery floors; an open stairwell of
  // one-way rungs up the west side; the sealed chute down the east side
  c.rect(56, 7, 57, 45, 'X');            // west wall
  c.rect(56, 7, 128, 7, 'X');            // roof line
  c.rect(127, 8, 128, 45, 'X');          // east wall
  c.carve(56, 42, 57, 45);               // the tower door (west, at grade)
  c.rect(66, 40, 119, 41, 'X');          // floor A
  c.rect(66, 34, 119, 35, 'X');          // floor B
  c.rect(66, 28, 119, 29, 'X');          // floor C
  c.rect(66, 22, 119, 23, 'X');          // floor D
  c.rect(66, 16, 119, 17, 'X');          // floor E — the switch deck

  // the stairwell (x58..65): one-way rungs zigzag from grade to the top;
  // rungs pass from below, so the whole column stays climbable
  c.oneway(58, 43, 3);
  c.oneway(62, 40, 3);
  c.oneway(58, 37, 3);
  c.oneway(62, 34, 3);
  c.oneway(58, 31, 3);
  c.oneway(62, 28, 3);
  c.oneway(58, 25, 3);
  c.oneway(62, 22, 3);
  c.oneway(58, 19, 3);
  c.oneway(62, 16, 3);
  c.set(59, 45, 'S');               // the grade vent — breath up the well
  c.set(61, 12, 'O');               // a kite rides the stairwell heat

  // ground gallery: under floor A, crawlers on the slag floor
  c.set(74, 45, 'E');
  c.gems(70, 44, 3, 2);
  c.set(96, 45, 'E');
  c.gems(100, 44, 3, 2);
  c.set(118, 45, 'B');
  c.rect(118, 42, 119, 45, 'X');         // divider: gallery sealed off the chute

  // galleries: keys eastward, doors between — the Rust locks its own core
  c.gems(80, 38, 3, 2);
  c.set(116, 39, 'j');              // KEY I, far end of floor A
  c.set(84, 33, 'T');
  c.rect(94, 30, 94, 33, 'D');      // DOOR I gates floor B's east half
  c.gems(104, 32, 3, 2);
  c.set(116, 33, 'j');              // KEY II, behind door I
  c.set(76, 27, 'T');
  c.gems(84, 26, 3, 2);
  c.set(70, 27, 'B');
  c.set(100, 21, 'T');
  c.gems(96, 20, 3, 2);
  c.rect(94, 12, 94, 15, 'D');      // DOOR II gates the switch chamber
  c.set(110, 15, 'M');              // switch-chamber token
  c.set(116, 15, 'n');              // THE MASTER SWITCH — every gate at once

  // ---- THE GREAT CHUTE (x120..125): sealed core, thrown open all at once ----
  c.rect(120, 24, 125, 24, 'H');         // gate I
  c.rect(120, 32, 125, 32, 'H');         // gate II
  c.rect(120, 40, 125, 40, 'H');         // gate III
  c.gems(121, 19, 4, 2);                 // gem lines caught in the fall
  c.gems(121, 27, 4, 2);
  c.gems(121, 35, 4, 2);
  c.set(122, 43, 'M');              // the chute token
  c.carve(127, 42, 128, 45);             // the east exit, at grade

  // ---- the yard: on to the beacon ---------------------------------------------
  c.gems(134, 44, 3, 2);
  c.onFloor(140, 'A');
  c.gemArc(152, 40, 5);
  c.onFloor(160, 'E');
  c.set(168, 45, 'B');
  c.onFloor(176, 'T');
  // slag stack landmark with the skill token
  c.rect(192, 32, 194, 39, 'X');
  c.oneway(191, 31, 5);
  c.set(193, 30, 'M');
  c.onFloor(202, 'E');
  c.onFloor(214, 'F');

  return {
    name: 'The Smeltworks', theme: 'cinder', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-3: "The Smeltworks" (224×52, dusk)
CONCEPT  FOUNDRY LOCKS. The Rust built this tower and locked its own core —
         ride the stairwell rungs up five galleries, take two keys through
         two doors, throw the master switch, then PLUNGE the opened chute.
SETPIECE THE GREAT CHUTE — three gates seal the tower's drop shaft; one
         switch clears the whole column and you fall through three gem lines
         to the only door out.
ROUTES   stairwell rungs (a grade vent skips the first three) / gallery
         floors east; the approach undercut; the yard's slag stack climb.
TOKENS   approach undercut (x46) / switch chamber (x110) / the chute fall
         (x122) / slag stack (x193, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 4-4 THE BARONS ROAD — the dusk gauntlet to the Iron Gate. Everything the
// world taught, at pressure, and the Shrike's eyrie waits beyond the wall.
// ---------------------------------------------------------------------------
function baronsRoad() {
  const W = 240, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 208, FLOOR);
  c.ground(209, 238, 34);           // the gate rampart

  // ---- opening march: burr convoy on the flats -------------------------------
  c.onFloor(6, 'P');
  c.gems(12, 37, 4, 2);
  c.onFloor(20, 'A');
  c.onFloor(28, 'A');
  c.set(36, 37, 'B');
  c.gems(44, 36, 3, 2);
  c.onFloor(42, 'E');

  // ---- vent-pit chain under kite patrol (4-1's lesson, at pressure) ----------
  c.carve(52, FLOOR, 56, H - 1);
  c.carve(64, FLOOR, 68, H - 1);
  c.onFloor(49, 'S');
  c.onFloor(61, 'S');
  c.gemArc(54, 31, 5);
  c.gemArc(66, 31, 5);
  c.set(58, 24, 'O');
  c.set(70, 22, 'O');
  c.oneway(58, 28, 4);              // the high line between the arcs
  c.set(60, 27, 'M');               // token on the high line, under the kites
  c.gems(74, 36, 3, 2);

  // ---- the slag channel: spikes below, a charred deck above, one gap in it --
  c.rect(84, 34, 99, 34, 'X');           // the span deck, west half (a 4-rise)
  c.rect(102, 34, 118, 34, 'X');         // east half — the gap is the way in
  c.run(84, 37, 16, '^');                // slag barbs west of the safe slot
  c.run(103, 37, 16, '^');               // and east of it
  c.set(101, 36, 'M');                   // channel token, in the safe slot
  c.set(100, 37, 'S');                   // the vent breathes you back up the gap
  c.gems(100, 35, 2, 1);
  c.onFloor(92, 'T');                    // imps hold the deck
  c.onFloor(108, 'T');
  c.gems(94, 31, 3, 2);
  c.gems(110, 31, 3, 2);
  c.onFloor(124, 'K');                   // checkpoint after the channel

  // ---- imp benches: a stepped ambush ------------------------------------------
  c.oneway(132, 33, 3);
  c.oneway(138, 29, 3);
  c.oneway(144, 25, 3);
  c.set(139, 28, 'T');
  c.set(145, 24, 'T');
  c.gems(133, 31, 2, 2);
  c.gems(145, 23, 2, 2);
  c.set(150, 37, 'B');

  // ---- the key shaft: dive past a kite for the gate key -----------------------
  c.rect(160, 26, 176, 26, 'X');         // shaft roof
  c.carve(164, 27, 171, 36);             // the shaft
  c.set(167, 35, 'j');                   // THE GATE KEY
  c.set(169, 30, 'O');                   // the kite in the shaft
  c.gems(165, 32, 2, 2);
  c.set(172, 35, 'M');                   // shaft token beside the key
  c.set(166, 37, 'S');                   // vent back out, standing on the road
  c.gemArc(184, 34, 5);
  c.onFloor(190, 'A');
  c.onFloor(198, 'E');

  // ---- THE IRON GATE -----------------------------------------------------------
  c.rect(209, 22, 212, 29, 'X');         // the arch — rises off the rampart
  c.rect(210, 30, 210, 33, 'D');         // the door in its mouth, key-locked
  c.oneway(208, 21, 6);                  // the parapet
  c.set(211, 20, 'M');                   // parapet token (wall-kick, skill)
  c.gems(216, 32, 3, 2);
  c.onFloor(222, 'E');
  c.set(226, 33, 'B');
  c.onFloor(232, 'F');                   // the beacon inside the Baron's line

  c.set(216, 26, 'O');                   // kites over the rampart
  c.onFloor(204, 'T');

  return {
    name: 'The Barons Road', theme: 'cinder', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-4: "The Barons Road" (240×44, dusk)
CONCEPT  GAUNTLET. Everything the world taught, at pressure: burr convoy,
         vent-pit chain under kite patrol, the spiked slag channel, an imp
         ambush stair, and a dive for the gate key.
SETPIECE THE IRON GATE — the Rust's rampart wall; its locked door needs the
         key from the kite-guarded shaft, and the parapet holds a skill
         token for anyone who climbs the wall itself.
ROUTES   span deck vs the spiked channel beneath it; the key shaft dive;
         the parapet line over the gate.
TOKENS   kite high line (x60) / slag channel (x100) / key shaft (x172) /
         gate parapet (x211, skill).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['cinder1.ts', ashfallRoad()],
  ['cinder2.ts', clinkerSteps()],
  ['cinder3.ts', smeltworks()],
  ['cinder4.ts', baronsRoad()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
