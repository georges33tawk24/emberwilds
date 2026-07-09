/**
 * THE CINDERPEAKS (World 4) rebuilt to the Phase-3 bar: FULL-HEIGHT three-lane
 * anatomy (ground road / one-way rafter mid lane / ashen sky road) across the
 * whole midsection of every level. The world's identity is VENTS — ember
 * geysers (springs, 8 lift) are the vertical arteries that throw you between
 * the lanes and up ledges no jump can reach. Pits below the map are OPEN VOID
 * now, so every carved gap is LETHAL: a real hazard on the ground road.
 *
 * Gimmick escalation 1->4:
 *   4-1 THE ASHFALL ROAD  — VENTS taught pure.  Setpiece: THE VENTFIELD.
 *   4-2 THE CLINKER STEPS — the vertical CLIMB.  Setpiece: THE STAIR OF EMBERS.
 *   4-3 THE SMELTWORKS    — FOUNDRY LOCKS.       Setpiece: THE GREAT CHUTE.
 *   4-4 THE BARONS ROAD   — GAUNTLET, combines VENTS+SWIM+the Rust key/gate.
 *                            Setpiece: THE IRON GATE.
 *
 * Movement law (validate() enforces): walk +-1; jump 4 up / 6 across (only 3
 * across when climbing >2 rows); fall any depth with +-3 drift; springs AND
 * water grant 8 lift; pits <=5 wide are jumpable; doors 'D'/gates 'H' openable.
 * A spring launches from the cell STOOD IN — a caught ledge must be <=8 rows
 * above it. Carve pits AFTER ground fills. Water must keep a solid floor row
 * (carve to <=H-2, never H-1) and never overlap a lethal pit.
 * Run: node scripts/buildCinder.mjs   (validates, then writes the .ts files)
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 4-1 THE ASHFALL ROAD — VENTS taught pure. Ground road with lethal ash pits,
// a broken rafter road over it fed by the vents, and an ashen sky road over
// THAT. THE VENTFIELD is the setpiece: a vent chain across three killing pits.
// ---------------------------------------------------------------------------
function ashfallRoad() {
  const W = 244, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD: a mountain trail with lethal ash pits -------------------
  c.ground(1, 60, FLOOR);            // trailhead flats
  c.ground(61, 104, FLOOR);          // THE VENTFIELD floor (pits punched below)
  c.ground(105, 138, 34);            // the ash bench (checkpoint + cellar)
  c.ground(139, 200, FLOOR);         // the long shoulder
  c.ground(201, 242, 33);            // beacon rise

  // ---- beat 1, TEACH (x1-60): one vent, one ledge no jump reaches -----------
  c.gems(9, 35, 4, 2);              // walk-in gem line
  c.carve(30, FLOOR, 33, H - 1);    // first lethal pit — 4 wide, forgiving
  c.gemArc(29, 34, 6);              // the arc shows the jump
  c.onFloor(46, 'S');              // the first vent
  c.oneway(43, 28, 5);             // a rafter ledge 8 above — vent-only
  c.gems(44, 26, 3, 2);            // reward for riding the vent
  c.set(54, 34, 'B');

  // ---- beat 2, THE VENTFIELD (x61-104): vent chain across three pits --------
  // GROUND: three lethal pits, a vent standing before each throws you across
  c.carve(66, FLOOR, 70, H - 1);   // pit I  (5 wide)
  c.carve(80, FLOOR, 84, H - 1);   // pit II
  c.carve(94, FLOOR, 98, H - 1);   // pit III
  c.onFloor(63, 'S');
  c.onFloor(77, 'S');
  c.onFloor(91, 'S');
  c.gemArc(67, 33, 5);
  c.gemArc(81, 33, 5);
  c.gemArc(95, 33, 5);
  // MID: the rafter road — one-ways the vents feed, over the pits (y27)
  c.oneway(62, 27, 6);
  c.oneway(74, 27, 6);
  c.oneway(86, 27, 6);
  c.oneway(98, 27, 6);
  c.gems(64, 25, 2, 2);
  c.gems(88, 25, 2, 2);
  c.set(76, 26, 'M');              // TOKEN — the rafter road (route mastery)
  // SKY: an ashen road of pads over the field, entered by a rafter vent (y19)
  c.set(75, 26, 'S');              // rafter vent -> the sky road
  c.oneway(72, 19, 3);
  c.oneway(80, 19, 3);
  c.oneway(88, 19, 3);
  c.oneway(96, 19, 5);             // the sky road's landing porch
  for (let i = 0; i < 5; i++) c.set(73 + i * 6, 17, '*'); // the high line
  c.set(98, 18, 'M');              // TOKEN — the sky road's end (nerve, high)

  // ---- beat 3, THE BENCH (x105-138): rest + the ash cellar ------------------
  c.onFloor(112, 'K');             // checkpoint
  c.set(116, 33, 'B');
  c.run(120, 34, 2, 'C');          // cracked slag lid — pound in
  c.carve(120, 35, 121, 35);       // the throat
  c.carve(117, 36, 124, 39);       // the cellar room
  c.gems(118, 38, 2, 2);
  c.set(122, 38, 'M');             // TOKEN — ash cellar (pound)
  c.set(119, 38, 'L');             // the keeper's lantern in the slag dark
  c.set(123, 39, 'S');             // vent back out through the lid

  // ---- beat 4, THE SHOULDER (x139-200): twist — vent-fed switchbacks --------
  c.carve(150, FLOOR, 154, H - 1); // lethal pit on the shoulder
  c.gemArc(149, 34, 6);
  c.onFloor(160, 'S');             // vent onto the switchback stack
  c.oneway(157, 30, 3);
  c.oneway(163, 26, 3);
  c.oneway(169, 22, 3);            // climbing switchbacks (>2 rise = 3 across ok)
  c.gems(158, 28, 2, 2);
  c.gems(170, 20, 3, 2);           // switchback-top reward line
  c.set(180, 34, 'B');
  c.gems(186, 34, 3, 2);

  // ---- beat 5, PAYOFF (x201-242): the leaning slag chimney + beacon ---------
  c.rect(214, 24, 216, 32, 'X');   // the chimney stack landmark
  c.onFloor(210, 'S');             // a vent at its foot
  c.oneway(212, 22, 4);            // its cap, vent-only
  c.gems(213, 20, 3, 1);
  c.set(214, 20, 'M');             // TOKEN — slag chimney cap (route mastery)
  c.gems(206, 31, 3, 2);
  c.onFloor(232, 'F');             // the Warmth Beacon

  // ---- cast: enemies as tempo on all three lanes ----------------------------
  c.onFloor(6, 'P');
  c.onFloor(18, 'E');              // slag-crawler on the walk-in
  c.onFloor(54, 'E');
  c.set(64, 26, 'T');             // soot-imp holds the rafter road
  c.set(90, 26, 'T');
  c.set(84, 18, 'O');             // ash-kite over the sky road
  c.onFloor(102, 'E');            // crawler guards the field's far lip
  c.onFloor(130, 'T');            // imp on the bench
  c.onFloor(144, 'A');           // clinker-burr rolls the shoulder
  c.onFloor(190, 'A');
  c.set(168, 24, 'O');           // kite by the switchbacks
  c.onFloor(224, 'E');

  return {
    name: 'The Ashfall Road', theme: 'cinder', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-1: "The Ashfall Road" (244×42, Phase-3 rebuild)
CONCEPT  VENTS taught pure. Ember geysers throw you up ledges no jump can reach
         and between three stacked lanes — ground trail, broken rafter road,
         ashen sky road.
SETPIECE THE VENTFIELD (x61-104): three vents chain across three LETHAL ash
         pits; the rafter road runs over them, and a rafter vent lifts to a sky
         road of pads over the whole field.
PACING   trailhead vent lesson -> the ventfield weave -> bench checkpoint +
         cellar -> vent-fed switchbacks (twist) -> slag-chimney beacon rise.
ROUTES   low: the ground trail, its lethal pits. mid: the vent-fed rafter road.
         high: the ashen sky road. secret: pound the slag lid (x120) into the
         ash cellar with the keeper's lantern.
TOKENS   rafter road (x76, route mastery) / sky road end (x98, nerve) / ash
         cellar (x122, pound) / slag chimney cap (x214, route mastery).`,
  };
}

// ---------------------------------------------------------------------------
// 4-2 THE CLINKER STEPS — the CLIMB. The mountain goes vertical two screens
// deep. A patient pillar stair OR a vent that skips half of it; a plateau sky
// road over an undercut gallery. THE STAIR OF EMBERS is the setpiece.
// ---------------------------------------------------------------------------
function clinkerSteps() {
  const W = 232, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: valley -> stair court -> high plateau -> ridge -> beacon ----
  c.ground(1, 40, FLOOR);           // valley floor
  c.ground(41, 70, 37);             // bench I
  c.ground(71, 104, 34);            // the stair court (base of the wall)
  c.ground(105, 162, 22);           // the high plateau (two screens up)
  c.ground(163, 194, 28);           // descent ridge
  c.ground(195, 230, 33);           // beacon spur

  // ---- beat 1, TEACH (x1-40): valley walk-in, a lethal gap, a vent ----------
  c.gems(8, 39, 4, 2);
  c.carve(24, FLOOR, 27, H - 1);   // lethal valley gap
  c.gemArc(23, 38, 6);
  c.onFloor(34, 'S');              // a vent lifts onto bench I's lip
  c.gemArc(35, 34, 4);
  c.set(30, 39, 'B');

  // valley wall pocket — the whisper secret: a hole drops in, a vent breathes out
  c.carve(14, 41, 18, 42);
  c.carve(16, 40, 16, 40);          // the entry hole in the floor
  c.gems(15, 42, 2, 1);
  c.set(17, 42, 'M');              // TOKEN — valley pocket (nerve, drop blind)
  c.set(16, 42, 'S');              // the vent directly under the hole, breathes out

  // ---- beat 2, bench I: the burr on a narrow shelf --------------------------
  c.gems(48, 36, 3, 2);
  c.set(66, 36, 'B');

  // ---- beat 3, THE STAIR OF EMBERS (x71-104): the setpiece ------------------
  // freestanding pillar steps up the great wall; a vent at the base skips the
  // first half for anyone who trusts the mountain's breath
  const step = (x, capY) => {
    c.rect(x, capY + 1, x + 1, 33, 'X');
    c.oneway(x - 1, capY, 4);
  };
  step(80, 30);
  step(86, 27);
  step(92, 24);
  step(98, 21);
  c.onFloor(74, 'S');              // the base vent -> onto the mid stair
  c.gemArc(75, 30, 5);            // its flight arc
  c.gems(81, 28, 2, 2);
  c.gems(93, 22, 2, 2);
  // stair-top spur onto the plateau, with a token on a high cap
  c.rect(102, 18, 103, 21, 'X');
  c.oneway(100, 17, 4);
  c.gems(101, 16, 2, 1);
  c.set(102, 16, 'M');            // TOKEN — stair-top spur (route mastery)
  c.onFloor(108, 'K');           // checkpoint on arrival at the plateau

  // ---- beat 4, THE PLATEAU (x105-162): sky road over an undercut gallery ----
  // MID/SKY here fuse into the plateau's two levels: the plateau surface is the
  // sky lane; a slung gallery beneath its lip is the mid lane.
  c.gems(114, 20, 3, 2);          // plateau running line
  c.gems(146, 20, 3, 2);
  c.set(126, 21, 'B');
  // the undercut gallery below the plateau lip — a cracked lid drops you in
  c.run(122, 22, 2, 'C');         // the cracked lip
  c.carve(122, 23, 123, 23);
  c.carve(118, 24, 134, 27);      // the gallery
  c.gems(120, 26, 3, 2);
  c.set(132, 26, 'M');            // TOKEN — plateau gallery (pound to enter)
  c.set(120, 27, 'S');           // vent back up to the plateau surface
  // a SKY line of pads OVER the plateau — a vent throws you above the surface
  c.onFloor(140, 'S');
  c.oneway(138, 14, 3);
  c.oneway(146, 14, 3);
  c.oneway(154, 14, 5);
  for (let i = 0; i < 4; i++) c.set(139 + i * 6, 12, '*');
  c.set(156, 13, 'M');           // TOKEN — plateau sky line (nerve)

  // ---- beat 5, descent ridge: burr convoy ----------------------------------
  c.carve(178, 28, 181, H - 1);  // lethal ridge gap
  c.gemArc(177, 26, 6);
  c.gems(168, 27, 3, 2);
  c.set(188, 27, 'B');

  // ---- beat 6, PAYOFF: one last vent to a sky shelf, then the beacon --------
  c.onFloor(200, 'S');           // the beacon-spur vent
  c.oneway(197, 25, 4);          // the sky shelf, vent-only (celebration)
  c.gems(198, 23, 3, 1);
  c.gems(208, 31, 3, 2);
  c.onFloor(222, 'F');

  // dressing lines
  c.gems(104, 20, 2, 2);
  c.gems(216, 31, 2, 2);

  // ---- cast -----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(14, 'E');
  c.onFloor(56, 'A');            // burr on bench I
  c.set(88, 25, 'T');           // imp on the stair
  c.set(120, 21, 'O');          // kite over the plateau
  c.set(148, 21, 'T');          // imp on the plateau
  c.set(150, 12, 'O');          // kite on the sky line
  c.onFloor(172, 'A');          // burr convoy on the ridge
  c.onFloor(186, 'A');
  c.onFloor(206, 'T');
  c.onFloor(214, 'E');

  return {
    name: 'The Clinker Steps', theme: 'cinder', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-2: "The Clinker Steps" (232×46, Phase-3 rebuild)
CONCEPT  CLIMB. The mountain goes vertical two screens deep — a patient pillar
         stair or one vent that skips half of it. Height is the whole language.
SETPIECE THE STAIR OF EMBERS (x71-104): four freestanding pillar steps up the
         great wall, a vent flight arc that skips the lower half, a stair-top
         spur onto the high plateau.
PACING   valley walk-in (lethal gap + wall pocket) -> bench -> the stair (or
         vent) up the wall -> plateau checkpoint -> gallery + sky line ->
         descent ridge -> beacon-spur vent.
ROUTES   low: valley + descent ridge (lethal gaps). mid: the stair pillars /
         the undercut gallery beneath the plateau lip. high: the plateau
         surface + a sky line of pads over it.
TOKENS   valley pocket (x17, nerve/blind drop) / stair-top spur (x102, route
         mastery) / plateau gallery (x132, pound) / plateau sky line (x156,
         nerve) — beacon shelf token folded in.`,
  };
}

// ---------------------------------------------------------------------------
// 4-3 THE SMELTWORKS — FOUNDRY LOCKS. Climb the smelter tower's stairwell
// rungs (a grade vent skips three), take two keys through two doors, throw the
// master switch, then PLUNGE the opened chute. THE GREAT CHUTE is the setpiece.
// ---------------------------------------------------------------------------
function smeltworks() {
  const W = 224, H = 52, FLOOR = 46;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 222, FLOOR);
  // lethal gaps on the approach road and in the far yard
  c.carve(24, FLOOR, 27, H - 1); c.gemArc(23, 44, 6);
  c.carve(146, FLOOR, 149, H - 1); c.gemArc(145, 44, 6);

  // ---- beat 1, approach road (x1-52) ----------------------------------------
  c.onFloor(6, 'P');
  c.gems(12, 45, 4, 2);
  c.onFloor(18, 'E');
  c.onFloor(30, 'A');
  c.set(38, 45, 'B');
  // a mid rafter over the approach, fed by a vent
  c.onFloor(34, 'S');
  c.oneway(36, 38, 5);
  c.gems(37, 36, 2, 2);
  // maintenance undercut before the tower — the approach secret
  c.run(44, 45, 2, 'C');
  c.carve(44, 46, 45, 46);
  c.carve(42, 47, 48, 49);
  c.gems(43, 48, 2, 1);
  c.set(46, 48, 'M');             // TOKEN — approach undercut (pound)
  c.onFloor(52, 'K');            // checkpoint at the tower door

  // ---- beat 2, THE SMELTER TOWER (x56-128) ----------------------------------
  // west wall, roof, east wall; five gallery floors; a stairwell of one-way
  // rungs up the west side; the sealed chute down the east side.
  c.rect(56, 7, 57, 45, 'X');            // west wall
  c.rect(56, 7, 128, 7, 'X');            // roof line
  c.rect(127, 8, 128, 45, 'X');          // east wall
  c.carve(56, 42, 57, 45);               // the tower door (west, at grade)
  c.rect(66, 40, 119, 41, 'X');          // floor A (ground gallery)
  c.rect(66, 34, 119, 35, 'X');          // floor B
  c.rect(66, 28, 119, 29, 'X');          // floor C
  c.rect(66, 22, 119, 23, 'X');          // floor D
  c.rect(66, 16, 119, 17, 'X');          // floor E — the switch deck

  // the stairwell (x58-65): one-way rungs zigzag from grade to the top
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
  c.set(59, 45, 'S');            // the grade vent — breath up the well, skips 3
  c.set(61, 12, 'O');            // a kite rides the stairwell heat

  // ground gallery: crawlers on the slag floor under floor A
  c.set(74, 45, 'E');
  c.gems(70, 44, 3, 2);
  c.set(96, 45, 'E');
  c.gems(100, 44, 3, 2);
  c.set(118, 45, 'B');
  c.rect(118, 42, 119, 45, 'X');         // divider seals the gallery off the chute

  // galleries: keys eastward, doors between — the Rust locks its own core
  c.gems(80, 38, 3, 2);
  c.set(116, 39, 'j');           // KEY I, far end of floor A
  c.set(84, 33, 'T');
  c.rect(94, 30, 94, 33, 'D');   // DOOR I gates floor B's east half
  c.gems(104, 32, 3, 2);
  c.set(116, 33, 'j');           // KEY II, behind door I
  c.set(76, 27, 'T');
  c.gems(84, 26, 3, 2);
  c.set(70, 27, 'B');
  c.set(100, 21, 'T');
  c.gems(96, 20, 3, 2);
  c.rect(94, 12, 94, 15, 'D');   // DOOR II gates the switch chamber
  c.gems(108, 15, 2, 2);
  c.set(110, 15, 'M');           // TOKEN — switch chamber (route mastery)
  c.set(116, 15, 'n');           // THE MASTER SWITCH — every gate at once

  // ---- THE GREAT CHUTE (x120-125): sealed core, thrown open all at once -----
  c.rect(120, 24, 125, 24, 'H');         // gate I
  c.rect(120, 32, 125, 32, 'H');         // gate II
  c.rect(120, 40, 125, 40, 'H');         // gate III
  c.gems(121, 19, 4, 1);                 // gem lines caught in the fall
  c.gems(121, 27, 4, 1);
  c.gems(121, 35, 4, 1);
  c.set(122, 43, 'M');           // TOKEN — the chute fall (nerve)
  c.carve(127, 42, 128, 45);             // the east exit, at grade

  // ---- beat 3, the yard: on to the beacon -----------------------------------
  c.gems(134, 44, 3, 2);
  c.onFloor(140, 'A');
  c.gemArc(152, 44, 6);
  c.onFloor(160, 'E');
  c.set(168, 45, 'B');
  c.onFloor(176, 'T');
  // slag stack landmark with the skill token, fed by a vent
  c.rect(192, 32, 194, 41, 'X');
  c.onFloor(188, 'S');
  c.oneway(190, 30, 4);
  c.gems(191, 28, 3, 1);
  c.set(192, 28, 'M');           // TOKEN — slag stack cap (glide off)
  c.onFloor(202, 'E');
  c.onFloor(214, 'F');

  return {
    name: 'The Smeltworks', theme: 'cinder', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-3: "The Smeltworks" (224×52, Phase-3 rebuild)
CONCEPT  FOUNDRY LOCKS. The Rust built this tower and locked its own core —
         ride the stairwell rungs up five galleries, take two keys through two
         doors, throw the master switch, then PLUNGE the opened chute.
SETPIECE THE GREAT CHUTE (x120-125): three gates seal the tower's drop shaft;
         one switch clears the whole column and you fall through three gem lines
         to the only door out.
PACING   approach road (rafter + undercut) -> tower-door checkpoint -> the
         stairwell/gallery lock climb -> master switch -> the chute plunge ->
         yard + slag-stack beacon.
ROUTES   low: the ground gallery + yard (lethal gaps). mid: the gallery floors
         east, keys and doors. high: the stairwell rungs (a grade vent skips
         three). secret: the approach undercut (x46, pound).
TOKENS   approach undercut (x46, pound) / switch chamber (x110, route mastery)
         / the chute fall (x122, nerve) / slag stack cap (x192, glide).`,
  };
}

// ---------------------------------------------------------------------------
// 4-4 THE BARONS ROAD — GAUNTLET. Everything the world taught at pressure, and
// the combine-with: VENTS + SWIM (cooled coolant pools) + the Rust key/gate.
// THE IRON GATE is the setpiece and the wall before the Shrike.
// ---------------------------------------------------------------------------
function baronsRoad() {
  const W = 240, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 208, FLOOR);
  c.ground(209, 238, 33);           // the gate rampart
  // lethal gaps between the setpieces
  c.carve(32, FLOOR, 35, H - 1); c.gemArc(31, 36, 6);

  // ---- beat 1, opening march: burr convoy on the flats ----------------------
  c.onFloor(6, 'P');
  c.gems(12, 37, 4, 2);
  c.onFloor(20, 'A');
  c.onFloor(28, 'A');
  c.set(38, 37, 'B');
  // a mid rafter over the march, vent-fed
  c.onFloor(42, 'S');
  c.oneway(44, 30, 5);
  c.gems(45, 28, 2, 2);

  // ---- beat 2, vent-pit chain under kite patrol (4-1's lesson at pressure) --
  c.carve(52, FLOOR, 56, H - 1);
  c.carve(64, FLOOR, 68, H - 1);
  c.onFloor(49, 'S');
  c.onFloor(61, 'S');
  c.gemArc(54, 31, 5);
  c.gemArc(66, 31, 5);
  // high line between the arcs, under the kites (the mid lane here)
  c.oneway(57, 27, 4);
  c.gems(58, 25, 2, 2);
  c.set(58, 26, 'M');             // TOKEN — kite high line (nerve)
  c.gems(74, 36, 3, 2);

  // ---- beat 3, THE COOLANT POOL (combine VENTS + SWIM) ----------------------
  // a cooled coolant pool: water lifts 8 like a vent. A drowned floor lane, a
  // charred deck over it, and the water stitches them.
  c.rect(84, 34, 118, 34, 'X');          // the charred deck (mid lane, a 4-rise)
  c.carve(86, 35, 116, FLOOR - 1);       // the pool basin — carved to H-2 only, so
                                         // row FLOOR (H-1) stays SOLID: no void below
  c.addWater(88, 35, 114, FLOOR - 1);    // the coolant — lifts 8 like a vent, safe
  c.gems(90, 33, 3, 2);                  // deck running line
  c.gems(108, 33, 3, 2);
  c.set(100, 33, 'M');                   // TOKEN — coolant deck (route mastery)
  c.gems(96, 37, 3, 2);                  // sunken gems in the pool
  c.onFloor(124, 'K');                   // checkpoint after the pool

  // ---- beat 4, imp benches: a stepped ambush --------------------------------
  c.oneway(132, 33, 3);
  c.oneway(138, 29, 3);
  c.oneway(144, 25, 3);
  c.set(139, 28, 'T');
  c.set(145, 24, 'T');
  c.gems(133, 31, 2, 2);
  c.gems(145, 23, 2, 2);
  c.set(150, 37, 'B');
  c.carve(154, FLOOR, 157, H - 1); c.gemArc(153, 36, 6); // lethal gap after the ambush

  // ---- beat 5, THE KEY SHAFT: dive past a kite for the gate key -------------
  c.rect(160, 26, 176, 26, 'X');         // shaft roof
  c.carve(164, 27, 171, 36);             // the shaft
  c.set(167, 35, 'j');                   // THE GATE KEY
  c.set(169, 30, 'O');                   // the kite in the shaft
  c.gems(165, 32, 2, 2);
  c.set(172, 35, 'M');                   // TOKEN — key shaft (nerve, dive)
  c.set(166, 37, 'S');                   // vent back out, standing on the road
  c.gemArc(184, 36, 5);
  c.onFloor(190, 'A');
  c.onFloor(198, 'E');

  // ---- beat 6, THE IRON GATE ------------------------------------------------
  c.rect(209, 21, 212, 28, 'X');         // the arch — rises off the rampart
  c.rect(210, 29, 210, 32, 'D');         // the door in its mouth, key-locked
  c.onFloor(206, 'S');                   // a vent at the wall's foot -> parapet
  c.oneway(207, 19, 6);                  // the parapet
  c.gems(216, 31, 3, 2);
  c.set(208, 18, 'M');                   // TOKEN — gate parapet (route mastery)
  c.onFloor(222, 'E');
  c.set(226, 32, 'B');
  c.onFloor(232, 'F');                   // the beacon inside the Baron's line

  c.set(216, 25, 'O');                   // kites over the rampart
  c.onFloor(204, 'T');

  return {
    name: 'The Barons Road', theme: 'cinder', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — The Cinderpeaks 4-4: "The Barons Road" (240×44, Phase-3 rebuild)
CONCEPT  GAUNTLET + combine-with. Everything the world taught at pressure, now
         fused with SWIM (a cooled coolant pool that lifts like a vent) and the
         Rust key/gate machinery.
SETPIECE THE IRON GATE (x209-238): the Rust's rampart wall; its locked door
         needs the key from the kite-guarded shaft, and a vent lifts the brave
         to the parapet over it.
PACING   burr march -> vent-pit chain under kites -> the coolant pool (combine)
         -> checkpoint -> imp-bench ambush -> key-shaft dive -> the Iron Gate.
ROUTES   low: the flats, lethal pits, the drowned pool basin. mid: rafters, the
         charred coolant deck, imp benches. high: the vent-fed kite line and the
         gate parapet. water lifts 8 — the pool is a vent you swim.
TOKENS   kite high line (x58, nerve) / coolant deck (x100, route mastery) / key
         shaft (x172, dive) / gate parapet (x208, route mastery).`,
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
