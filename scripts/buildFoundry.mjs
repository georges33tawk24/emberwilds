/**
 * COGLAR FOUNDRY (World 6) rebuilt to the Phase-3 bar: FULL-HEIGHT three-lane
 * anatomy (ground belt road / one-way gantry mid lane / sky return-line), the
 * HARDEST world — the belts drag you TOWARD lethal drops, so every gap is a
 * true commitment and the return line is the only road that runs your way.
 * The world's identity is BELTS: conveyor tiles '<' '>' that replace the
 * surface row and drag you west/east. Opposite-direction belts stack
 * vertically; the sky lane is the return line.
 *   6-1 THE GATEYARDS  — BELTS, taught pure.  Setpiece: THE INTAKE LINE.
 *   6-2 THE ASSEMBLY   — WORKS, belts develop. Setpiece: THE DISPATCH CHUTE.
 *   6-3 THE TRIALS     — REMIX, five worlds in iron. Setpiece: THE GAUNTLET.
 *   6-4 THE LAST MARCH — GAUNTLET, belts+ICE.  Setpiece: THE BARONS DOOR.
 * Movement law: jump 4 up / 6 across (3 across when climbing >2); pits <=5
 * wide; springs & water lift 8; carve pits AFTER ground fills; below the map
 * is OPEN VOID (a pit carved to H-1 is bottomless and lethal); water must keep
 * a solid floor beneath (carve to H-2, never H-1).
 * Run: node scripts/buildFoundry.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 6-1 THE GATEYARDS — learn the belts, taught safe then true: ride one east
// for free speed, fight one west for every step, then trust one to throw you
// over the intake pits. Ground belt road, a gantry mid lane over it, and the
// return line (a west-dragging sky belt) over THAT.
// ---------------------------------------------------------------------------
function gateyards() {
  const W = 240, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD: intake belts over lethal pits ---------------------------
  c.ground(1, 200, FLOOR);
  c.ground(201, 206, 33);            // ramp step up to the shelf
  c.ground(207, 238, 30);            // the works shelf (beacon terrace)

  // beat 1, INTRO (x1-44): ride the belt east, then fight one west, safe floor
  c.gems(8, 34, 5, 2);              // the walk-in gem line
  c.run(20, FLOOR, 14, '>');       // teach I: ride it east — free speed
  c.gems(23, 34, 3, 1);
  c.set(38, 34, 'B');              // a berry right after — kindness early
  c.run(46, FLOOR, 12, '<');       // teach II: the same road, fighting you
  c.gems(49, 34, 3, 1);

  // beat 3, THE INTAKE LINE (x64-136): a long east feed belt over three
  // punched-out LETHAL pits — the belt drags you toward each drop
  c.run(64, FLOOR, 70, '>');
  c.carve(78, FLOOR, 81, H - 1);    // pit I (4)
  c.carve(92, FLOOR, 96, H - 1);    // pit II (5)
  c.carve(108, FLOOR, 111, H - 1);  // pit III (4)
  c.gemArc(77, 32, 5);
  c.gemArc(91, 32, 5);
  c.gemArc(109, 32, 5);
  c.run(120, 35, 3, '^');           // spikes pinch a landing near the line's end
  c.gemArc(119, 32, 5);

  // ---- MID LANE: the gantry road (y28-30 one-ways) over the intake ----------
  c.onFloor(60, 'S');               // the gantry on-ramp: a spring off the flats
  c.gemArc(57, 26, 5);              // its flight line
  c.oneway(63, 28, 6);              // catch pad
  c.oneway(73, 29, 6);
  c.oneway(85, 28, 6);
  c.oneway(97, 29, 6);
  c.oneway(109, 28, 6);
  c.oneway(121, 29, 6);             // the gantry's landing porch past the pits
  c.gems(66, 26, 3, 1);
  c.gems(88, 26, 3, 1);
  c.gems(112, 26, 3, 1);
  c.set(101, 27, 'M');              // TOKEN — nerve (the gantry over pit II)
  c.set(99, 27, '*');
  c.set(103, 27, '*');

  // ---- SKY LANE: THE RETURN LINE (y20 west belt) over the gantry ------------
  c.set(75, 27, 'S');               // a gantry spring throws you to the return line
  c.run(70, 20, 40, '<');           // the return belt: drags you the wrong way
  c.gems(74, 18, 3, 1);
  c.gems(96, 18, 3, 1);
  c.set(72, 19, 'M');               // TOKEN — mastery (walk the belt to its WEST end)
  c.set(106, 19, 'O');              // a bolt drone rides the return line

  // ---- checkpoint past the intake -------------------------------------------
  c.onFloor(140, 'K');
  c.set(143, 34, 'B');

  // ---- beat 4, TWIST (x146-200): belt + pit + the cellar --------------------
  c.run(146, FLOOR, 30, '<');       // a west belt drags you back over a pit
  c.carve(158, FLOOR, 161, H - 1);  // lethal pit under the backward drag
  c.gemArc(157, 33, 5);
  c.gems(150, 34, 3, 1);
  // the maintenance cellar — the pound lesson pays out (keeper's lantern here)
  c.run(168, FLOOR, 2, 'C');        // cracked lid in the belt floor
  c.carve(168, 37, 169, 37);        // the throat
  c.carve(165, 38, 172, 40);        // the cellar room
  c.set(170, 39, 'M');              // TOKEN — the pound secret
  c.set(166, 38, 'L');              // the keeper's lantern in the machine dark
  c.gems(167, 39, 2, 1);
  c.set(171, 38, 'B');
  c.set(171, 40, 'S');              // spring back out through the lid
  c.gemArc(186, 34, 5);

  // ---- beat 5, PAYOFF (x201-238): the works shelf + the beacon --------------
  c.set(196, 34, '*');              // celebration line up onto the shelf
  c.set(199, 33, '*');
  c.set(203, 31, '*');
  c.rect(214, 24, 215, 28, 'X');    // chimney stub
  c.oneway(211, 24, 4);             // its stepping ledge
  c.set(214, 23, 'M');              // TOKEN — the chimney perch (skill)
  c.gems(220, 28, 3, 2);
  c.onFloor(224, 'F');              // the Warmth Beacon on the shelf

  // ---- cast: gearlice, jacks, drones, grindwheels ---------------------------
  c.onFloor(6, 'P');
  c.onFloor(16, 'E');               // the first gearlouse, alone in the open
  c.onFloor(52, 'T');               // a piston jack on the fighting belt
  c.onFloor(88, 'E');               // gearlice ride the intake line
  c.onFloor(104, 'E');
  c.set(90, 24, 'O');               // bolt drones watch the intake
  c.set(112, 22, 'O');
  c.set(87, 27, 'T');               // a jack holds the gantry (on the x85 pad)
  c.onFloor(152, 'A');              // a grindwheel on the backward belt
  c.onFloor(180, 'T');
  c.onFloor(196, 'A');
  c.set(222, 25, 'O');              // a drone over the shelf

  return {
    name: 'The Gateyards', theme: 'foundry', daypart: 'dawn', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Coglar Foundry 6-1: "The Gateyards" (240×42, Phase-3 rebuild)
CONCEPT  BELTS, taught pure. Ride one east for free speed, fight one west for
         every step, then trust one to throw you over the intake pits — three
         stacked lanes, the top one running the WRONG way.
SETPIECE THE INTAKE LINE (x64-136): a long east feed belt over three lethal
         punched-out pits, gem arcs marking each flight, gearlice riding the
         line and bolt drones watching it.
PACING   ride-belt teach -> fight-belt teach -> the intake line + gantry ->
         checkpoint -> backward-belt twist + cellar -> works-shelf beacon.
ROUTES   low: the intake belt road (lethal pits). mid: the gantry one-ways.
         high: the return line (a west belt dragging you back). secret: pound
         the cracked lid at x168 into the maintenance cellar (lantern within).
TOKENS   gantry over pit II (x101, nerve) / return line west end (x72, mastery)
         / cellar (x170, pound) / chimney perch (x214, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 6-2 THE ASSEMBLY — the vertical works: belted gallery floors that drag you
// toward or away from the climb, a master switch, and the dispatch chute.
// Belts develop — now they're the stairs, and they fight the vertical line.
// ---------------------------------------------------------------------------
function assembly() {
  const W = 228, H = 50, FLOOR = 44;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD: approach + dispatch yard, lethal gaps -------------------
  c.ground(1, 226, FLOOR);
  c.carve(24, FLOOR, 27, H - 1); c.gemArc(23, 42, 5);   // approach gap
  c.carve(190, FLOOR, 193, H - 1); c.gemArc(189, 42, 5); // yard gap

  // ---- approach -------------------------------------------------------------
  c.onFloor(6, 'P');
  c.gems(10, 43, 4, 2);
  c.onFloor(16, 'E');
  c.run(30, FLOOR, 10, '>');        // a feed belt eases you to the tower
  c.gems(32, 43, 3, 1);
  c.set(42, 43, 'B');
  // undercut before the tower — a hidden pocket
  c.run(46, FLOOR, 2, 'C');
  c.carve(46, 45, 47, 45);
  c.carve(43, 46, 50, 47);
  c.set(48, 46, 'M');               // TOKEN — undercut pocket (pound)
  c.gems(44, 46, 2, 1);
  c.set(49, 47, 'S');
  c.onFloor(52, 'K');

  // ---- THE ASSEMBLY TOWER (x56..x126): belted gallery floors ----------------
  c.rect(56, 7, 57, 43, 'X');            // west wall
  c.rect(56, 6, 126, 6, 'X');            // roof
  c.rect(125, 7, 126, 43, 'X');          // east wall
  c.carve(56, 40, 57, 43);               // the door in, at grade
  // belted gallery floors: top rows ARE belts, alternating directions
  c.rect(64, 38, 117, 39, 'X');
  c.rect(64, 38, 117, 38, '>');          // floor A drags you east
  c.rect(64, 32, 117, 33, 'X');
  c.rect(64, 32, 117, 32, '<');          // floor B drags you west
  c.rect(64, 26, 117, 27, 'X');
  c.rect(64, 26, 117, 26, '>');          // floor C east again
  c.rect(64, 20, 117, 21, 'X');
  c.rect(64, 20, 117, 20, '<');          // floor D — the switch deck
  // MID LANE: stairwell rungs, west side (x58..63) — oneways pass from below
  c.oneway(58, 41, 3);
  c.oneway(61, 38, 3);
  c.oneway(58, 35, 3);
  c.oneway(61, 32, 3);
  c.oneway(58, 29, 3);
  c.oneway(61, 26, 3);
  c.oneway(58, 23, 3);
  c.oneway(61, 20, 3);
  c.set(59, 43, 'S');               // grade vent up the well
  c.set(60, 11, 'O');               // a drone rides the well
  // gallery dressing: fight the drag for the prizes
  c.gems(70, 37, 3, 1);
  c.set(114, 37, 'j');              // KEY, far east on the east-dragging floor A
  c.gems(100, 31, 3, 1);
  c.set(66, 31, 'M');               // TOKEN — floor B's west end, against the drag
  c.set(84, 31, 'T');
  c.gems(80, 25, 3, 1);
  c.set(114, 25, 'B');
  c.set(96, 25, 'T');
  c.rect(90, 16, 90, 19, 'D');      // the door on the switch deck
  c.gems(96, 19, 3, 1);
  c.set(110, 19, 'M');              // TOKEN — switch-deck, behind the door
  c.set(116, 19, 'n');              // THE MASTER SWITCH

  // ---- SKY LANE: the loft return belt over the switch deck ------------------
  c.set(70, 19, 'S');               // a floor-D spring throws you to the loft
  c.run(66, 13, 46, '<');           // the loft return belt — drags you west
  c.gems(72, 11, 3, 1);
  c.gems(96, 11, 3, 1);
  c.set(68, 12, 'M');               // TOKEN — the loft belt's WEST end (mastery)
  c.set(104, 11, 'O');              // a drone rides the loft

  // ---- THE DISPATCH CHUTE (x118..x123): gates sealed until the switch -------
  c.rect(118, 24, 123, 24, 'H');
  c.rect(118, 32, 123, 32, 'H');
  c.rect(118, 40, 123, 40, 'H');
  c.gems(119, 22, 4, 1);
  c.gems(119, 28, 4, 2);
  c.gems(119, 36, 4, 2);
  c.carve(125, 40, 126, 43);             // the east exit, at grade

  // ---- the dispatch yard ----------------------------------------------------
  c.gems(132, 43, 3, 2);
  c.onFloor(140, 'A');
  c.run(148, FLOOR, 14, '>');       // out-feed belt
  c.gemArc(154, 42, 5);
  c.onFloor(166, 'T');
  c.onFloor(176, 'E');
  c.set(184, 43, 'B');
  c.gemArc(196, 42, 5);
  c.onFloor(204, 'A');
  c.onFloor(216, 'F');

  return {
    name: 'The Assembly', theme: 'foundry', daypart: 'dawn', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Coglar Foundry 6-2: "The Assembly" (228×50, Phase-3 rebuild)
CONCEPT  THE WORKS, belts develop. Four belted gallery floors — each drags you
         toward or away from the stairwell — a key on the far end of a drag, a
         locked switch deck, a loft return belt overhead, and the sealed chute.
SETPIECE THE DISPATCH CHUTE (x118-123): three gates down the tower's east
         shaft; the master switch clears the column and drops you through gem
         lines to the yard.
PACING   approach + undercut pocket -> the belted tower climb -> switch deck +
         loft return belt -> the dispatch chute fall -> the out-feed yard.
ROUTES   low: the belted gallery floors (fight the drag). mid: the west
         stairwell rungs (a grade vent skips three). high: the loft return
         belt. secret: pound the undercut lid at x46.
TOKENS   undercut pocket (x48, pound) / floor B west end against the drag (x66)
         / switch deck behind the door (x110) / loft belt west end (x68).`,
  };
}

// ---------------------------------------------------------------------------
// 6-3 THE TRIALS — the Rust keeps trophies: five worlds quoted in iron, one
// gauntlet, each trial carrying its own lane and prize. What the wilds taught,
// the machine now tests — with belts threaded through every trial.
// ---------------------------------------------------------------------------
function trials() {
  const W = 248, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 246, FLOOR);
  c.carve(20, FLOOR, 23, H - 1); c.gemArc(19, 38, 5);   // a lethal gap at the gate

  c.onFloor(6, 'P');
  c.gems(10, 39, 4, 2);
  c.onFloor(16, 'E');

  // ---- TRIAL OF THE WOOD (x26-52): a caged grove — oneway boughs (mid lane),
  // a spring, an owl, and a SKY bough over it -------------------------------
  c.oneway(26, 35, 4);
  c.oneway(33, 31, 4);
  c.oneway(40, 27, 4);
  c.set(42, 26, 'M');               // TOKEN — the high bough (route mastery)
  c.gems(27, 33, 2, 1);
  c.gems(34, 29, 2, 1);
  c.onFloor(30, 'S');
  c.oneway(36, 21, 4);              // the sky bough
  c.gems(37, 19, 2, 1);
  c.set(38, 22, 'O');
  c.onFloor(48, 'T');

  // ---- TRIAL OF SAND (x54-80): the belt sprint — pits at momentum ----------
  c.run(54, FLOOR, 26, '>');        // a fast east belt over the sprint pits
  c.carve(60, FLOOR, 64, H - 1);
  c.carve(72, FLOOR, 76, H - 1);
  c.gemArc(59, 34, 5);
  c.gemArc(71, 34, 5);
  c.onFloor(68, 'A');
  c.oneway(66, 30, 5);              // a mid ledge to bail the belt
  c.gems(67, 28, 2, 1);
  c.onFloor(84, 'K');               // checkpoint after the sprint

  // ---- TRIAL OF THE DEEP (x88-124): the coolant duct — swim under the works
  c.carve(88, 41, 122, 42);         // carve to H-2: solid floor row stays at 43
  c.addWater(88, 41, 122, 42);
  c.run(90, FLOOR, 14, 'C');        // grated crust over the west half
  c.set(94, 42, 'M');               // TOKEN — duct token, under the grate (nerve)
  c.gems(100, 42, 3, 1);
  c.gems(112, 42, 3, 1);
  c.set(106, 39, 'B');
  c.onFloor(126, 'E');

  // ---- TRIAL OF ASH (x132-156): the vent chain over the melt ---------------
  c.carve(134, FLOOR, 138, H - 1);
  c.carve(146, FLOOR, 150, H - 1);
  c.onFloor(131, 'S');
  c.onFloor(142, 'S');
  c.gemArc(136, 33, 5);
  c.gemArc(148, 33, 5);
  c.oneway(139, 30, 4);             // a mid catch over the melt
  c.set(148, 28, 'M');              // TOKEN — vent-flight (glide from the chain)
  c.set(140, 24, 'O');
  c.onFloor(156, 'T');

  // ---- TRIAL OF FROST (x162-192): a coolant-spill ice strip with one gap ----
  c.run(162, FLOOR, 30, 'I');
  c.carve(174, FLOOR, 178, H - 1);
  c.gems(166, 38, 3, 1);
  c.gems(182, 38, 3, 1);
  c.set(176, 36, 'M');              // TOKEN — the slide-gap (nerve at speed)
  c.oneway(170, 33, 4);            // a mid ledge over the ice gap
  c.onFloor(188, 'A');

  // ---- SKY LANE: the trophy gantry — a return belt over the whole gauntlet --
  c.run(30, 15, 130, '<');          // a long west return belt, x30..159
  c.gems(40, 13, 4, 3);
  c.gems(90, 13, 4, 3);
  c.gems(140, 13, 4, 3);
  c.set(150, 14, 'O');              // a drone patrols the trophy gantry
  c.set(100, 14, 'O');

  // ---- the wardens key + the last door --------------------------------------
  c.oneway(198, 35, 3);
  c.set(199, 34, 'j');              // the key on a high rung
  c.gems(196, 38, 2, 1);
  c.onFloor(204, 'T');
  c.rect(212, 36, 212, 39, 'D');    // the trial door
  c.gems(218, 38, 3, 2);
  c.onFloor(224, 'E');
  c.set(228, 39, 'B');
  c.onFloor(234, 'F');
  c.set(220, 30, 'O');

  return {
    name: 'The Trials', theme: 'foundry', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Coglar Foundry 6-3: "The Trials" (248×46, Phase-3 rebuild)
CONCEPT  REMIX. The Rust keeps trophies — five worlds quoted in iron: a caged
         grove, a belt sprint, a coolant duct to swim, a vent chain over the
         melt, a frozen coolant spill — with a trophy-gantry return belt over
         the whole gauntlet as the sky lane.
SETPIECE THE GAUNTLET — every mechanic the wilds taught, tested in sequence
         under one roof, each trial with its own lane and side prize.
PACING   gate gap -> grove -> belt sprint -> checkpoint -> coolant duct ->
         vent chain -> ice slide -> wardens key + the last door.
ROUTES   low: the trial floors (belts, pits, ice, water). mid: bough/ledge
         one-ways bailing each trial. high: the trophy-gantry return belt.
         secret: swim UNDER the grated crust of the coolant duct.
TOKENS   grove high bough (x42, route mastery) / coolant duct (x94, nerve) /
         vent flight (x148, glide) / frost gap (x176, nerve at speed).`,
  };
}

// ---------------------------------------------------------------------------
// 6-4 THE LAST MARCH — everything, against you: the belts run backward, frozen
// slag ices the deck, the machines are out in force, and the Barons door waits.
// The combine-with is ICE ('I') over belts — the final non-boss ascent.
// ---------------------------------------------------------------------------
function lastMarch() {
  const W = 252, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 212, FLOOR);
  c.ground(213, 218, 35);           // ramp step up to the terrace
  c.ground(219, 250, 32);           // the door terrace

  // ---- GROUND ROAD: the against-belt march over frozen slag -----------------
  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.run(16, FLOOR, 20, '<');        // the road itself fights you (west belt)
  c.run(36, FLOOR, 14, 'I');        // frozen slag: ice picks up where the belt ends
  c.onFloor(24, 'E');
  c.gems(30, 37, 3, 1);
  c.set(44, 37, 'B');
  // a lethal pit gnaws the backward-belt road (carved AFTER the belt so it
  // truly opens) — clear it rightward while the belt drags you back west
  c.carve(28, FLOOR, 31, H - 1); c.gemArc(27, 35, 5);

  // ---- MID LANE: the grate channel — spikes under, one gap in the deck ------
  c.rect(62, 34, 77, 34, 'X');
  c.rect(80, 34, 95, 34, 'X');
  c.run(62, 37, 16, '^');           // spikes under the west deck (x62-77)
  c.run(80, 37, 16, '^');           // spikes under the east deck (x80-95)
  // the gap in the deck (x78-79): a clean vent slot with a safe token pad
  c.set(78, 37, 'S');               // the vent back up the gap (floor at y38)
  c.oneway(78, 33, 2);              // the safe slot pad, spanning the gap
  c.set(79, 32, 'M');               // TOKEN — channel token in the safe slot (nerve)
  c.set(78, 32, '*');
  c.set(79, 30, '*');
  c.onFloor(68, 'T');               // jacks hold the deck
  c.onFloor(88, 'T');
  c.gems(70, 32, 3, 1);
  c.gems(84, 32, 3, 1);
  c.onFloor(100, 'K');              // checkpoint

  // ---- the drone gallery: a backward belt sprint under diving drones --------
  c.run(106, FLOOR, 40, '<');       // the sprint belt drags you back into the drones
  c.carve(116, FLOOR, 120, H - 1);
  c.carve(130, FLOOR, 134, H - 1);
  c.gemArc(118, 34, 5);
  c.gemArc(132, 34, 5);
  c.set(112, 25, 'O');
  c.set(126, 23, 'O');
  c.set(140, 25, 'O');
  c.onFloor(150, 'A');
  c.set(154, 37, 'B');

  // ---- SKY LANE: THE RETURN GANTRY — an east belt over the whole march ------
  c.onFloor(104, 'S');              // a checkpoint spring feeds the gantry
  c.run(60, 22, 100, '>');          // the return gantry: an EAST belt, x60..159
  c.gems(70, 20, 4, 3);
  c.gems(110, 20, 4, 3);
  c.set(132, 21, 'M');              // TOKEN — the gantry over the drone pits (glide)
  c.set(150, 20, 'O');             // a drone patrols the gantry
  c.set(90, 20, 'O');

  // ---- the piston stair: an ambush climb ------------------------------------
  c.oneway(160, 33, 3);
  c.oneway(166, 29, 3);
  c.oneway(172, 25, 3);
  c.set(167, 28, 'T');
  c.set(173, 24, 'T');
  c.gems(161, 31, 2, 2);
  c.gems(173, 23, 2, 2);

  // ---- the key vault: under a fragile grate, the last key -------------------
  c.run(184, FLOOR, 2, 'C');
  c.carve(184, 39, 185, 39);
  c.carve(181, 40, 188, 41);
  c.set(183, 40, 'j');              // THE BARONS KEY
  c.set(186, 40, 'M');              // TOKEN — vault (pound)
  c.gems(182, 40, 2, 1);
  c.set(187, 41, 'S');
  c.gemArc(196, 36, 5);
  c.onFloor(202, 'A');
  c.onFloor(210, 'E');

  // ---- THE BARONS DOOR ------------------------------------------------------
  c.rect(219, 22, 222, 29, 'X');    // the arch
  c.rect(220, 28, 220, 31, 'D');    // the locked door
  c.oneway(217, 21, 6);             // the parapet
  c.set(221, 20, 'M');              // TOKEN — the door parapet (skill)
  c.gems(226, 30, 3, 2);
  c.onFloor(232, 'T');
  c.set(238, 31, 'B');
  c.onFloor(242, 'F');
  c.set(228, 25, 'O');

  // ---- cast -----------------------------------------------------------------
  c.onFloor(38, 'E');               // a gearlouse on the ice
  c.onFloor(180, 'E');

  return {
    name: 'The Last March', theme: 'foundry', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Coglar Foundry 6-4: "The Last March" (252×44, Phase-3 rebuild)
CONCEPT  GAUNTLET + combine-with ICE. Everything, against you: the road is a
         belt running backward over frozen slag, drones dive the sprint, jacks
         hold the grate channel, an east return gantry runs overhead, and the
         last key hides in a vault under your feet.
SETPIECE THE BARONS DOOR — the final arch. Beyond it, the Foundry Heart.
PACING   backward belt + ice march -> grate channel -> drone sprint + return
         gantry -> piston stair -> key vault -> the Barons Door.
ROUTES   low: the backward belt / ice deck with lethal pits. mid: the grate
         channel over spikes; the piston stair. high: the east return gantry.
         secret: pound the grate into the key vault at x184.
TOKENS   grate channel safe slot (x79, nerve) / return gantry over the drone
         pits (x132, glide) / key vault (x186, pound) / door parapet (x221).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['foundry1.ts', gateyards()],
  ['foundry2.ts', assembly()],
  ['foundry3.ts', trials()],
  ['foundry4.ts', lastMarch()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
