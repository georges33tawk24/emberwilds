/**
 * COGLAR FOUNDRY (World 6) — the Rust's heart and the campaign's last road.
 * The world's identity is THE MACHINE: conveyor belts ('<' '>') that drag
 * you, iron and brick, molten light. Levels:
 *   6-1 THE GATEYARDS  — BELTS.   Setpiece: THE INTAKE LINE.
 *   6-2 THE ASSEMBLY   — WORKS.   Setpiece: THE DISPATCH CHUTE.
 *   6-3 THE TRIALS     — REMIX.   Setpiece: five worlds, quoted in iron.
 *   6-4 THE LAST MARCH — GAUNTLET. Setpiece: THE BARONS DOOR.
 * Movement law: jump 4 up / 6 across; pits ≤5 unless bridged; springs lift
 * 8; belts/ice replace surface rows. Run: node scripts/buildFoundry.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 6-1 THE GATEYARDS — learn the belts: ride one, fight one, trust one over
// the pits. The Foundry teaches with its own machinery.
// ---------------------------------------------------------------------------
function gateyards() {
  const W = 240, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 206, FLOOR);
  c.ground(207, 238, 32);           // the works shelf

  // ---- walk-in + the two teaches: with the belt, then against it -------------
  c.onFloor(6, 'P');
  c.gems(10, 35, 4, 2);
  c.onFloor(16, 'E');
  c.run(24, FLOOR, 12, '>');        // teach I: ride it east — free speed
  c.gems(27, 35, 3, 1);
  c.set(40, 35, 'B');
  c.run(46, FLOOR, 12, '<');        // teach II: the same road, fighting you
  c.gems(49, 35, 3, 1);
  c.onFloor(62, 'T');               // a piston jack waits at the far end

  // ---- THE INTAKE LINE: a long feed belt over punched-out pits ---------------
  c.run(70, FLOOR, 50, '>');
  c.carve(80, FLOOR, 83, H - 1);    // pit I (4)
  c.carve(94, FLOOR, 98, H - 1);    // pit II (5)
  c.carve(108, FLOOR, 111, H - 1);  // pit III (4)
  c.gemArc(81, 30, 5);
  c.gemArc(96, 30, 5);
  c.set(96, 27, 'M');               // the flight token — the belt throws you far
  c.gemArc(109, 30, 5);
  c.onFloor(88, 'E');               // gearlice ride the line
  c.onFloor(104, 'E');
  c.set(90, 24, 'O');               // bolt drones watch the intake
  c.set(106, 22, 'O');
  c.onFloor(124, 'K');              // checkpoint past the line

  // ---- the return line: a high belt road running the wrong way ---------------
  c.rect(130, 29, 154, 29, '<');    // elevated belt, dragging you back west
  c.gems(134, 27, 3, 1);
  c.set(152, 27, 'M');              // token at the far end — walk against the drag
  c.gems(146, 27, 2, 1);
  c.onFloor(136, 'T');
  c.onFloor(148, 'A');              // a grindwheel patrols under the return line
  c.set(158, 35, 'B');

  // ---- the maintenance cellar: fragile grate over a pocket --------------------
  c.run(168, FLOOR, 2, 'C');
  c.carve(165, 37, 172, 40);
  c.set(170, 39, 'M');              // cellar token
  c.gems(166, 39, 2, 1);
  c.set(171, 40, 'S');
  c.onFloor(178, 'T');
  c.gemArc(188, 34, 5);
  c.onFloor(194, 'A');

  // ---- the works shelf: chimney perch + beacon --------------------------------
  c.rect(214, 25, 215, 28, 'X');    // chimney stub
  c.oneway(213, 24, 4);
  c.set(214, 23, 'M');              // perch token (skill)
  c.gems(220, 30, 3, 2);
  c.gems(200, 34, 2, 1);
  c.onFloor(226, 'E');
  c.onFloor(232, 'F');
  c.set(222, 24, 'O');

  return {
    name: 'The Gateyards', theme: 'foundry', daypart: 'dawn', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Coglar Foundry 6-1: "The Gateyards" (240×42, dawn)
CONCEPT  BELTS. Ride one for free speed, fight one for every step, then
         trust one to throw you over the pits.
SETPIECE THE INTAKE LINE — fifty tiles of feed belt over three punched-out
         pits, gem arcs marking each flight, gearlice riding the line and
         bolt drones watching it.
ROUTES   the intake line vs the elevated return line (dragging the wrong
         way); the maintenance cellar under a fragile grate.
TOKENS   intake flight (x96) / return line end (x152) / cellar (x170) /
         chimney perch (x214, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 6-2 THE ASSEMBLY — the vertical works: belted gallery floors that drag you
// toward or away from the climb, a master switch, and the dispatch chute.
// ---------------------------------------------------------------------------
function assembly() {
  const W = 228, H = 50, FLOOR = 44;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 226, FLOOR);

  // ---- approach ---------------------------------------------------------------
  c.onFloor(6, 'P');
  c.gems(10, 43, 4, 2);
  c.onFloor(18, 'E');
  c.onFloor(30, 'A');
  c.set(38, 43, 'B');
  // undercut before the tower
  c.run(42, FLOOR, 2, 'C');
  c.carve(39, 45, 46, 47);
  c.set(44, 46, 'M');               // undercut token
  c.gems(40, 46, 2, 1);
  c.onFloor(50, 'K');

  // ---- THE ASSEMBLY TOWER (x54..x126) ------------------------------------------
  c.rect(54, 7, 55, 43, 'X');            // west wall
  c.rect(54, 6, 126, 6, 'X');            // roof
  c.rect(125, 7, 126, 43, 'X');          // east wall
  c.carve(54, 40, 55, 43);               // the door in, at grade
  // belted gallery floors: top rows ARE belts, alternating directions
  c.rect(64, 38, 117, 39, 'X');
  c.rect(64, 38, 117, 38, '>');          // floor A drags you east
  c.rect(64, 32, 117, 33, 'X');
  c.rect(64, 32, 117, 32, '<');          // floor B drags you west
  c.rect(64, 26, 117, 27, 'X');
  c.rect(64, 26, 117, 26, '>');          // floor C east again
  c.rect(64, 20, 117, 21, 'X');
  c.rect(64, 20, 117, 20, '<');          // floor D — the switch deck
  // stairwell rungs, west side (x56..62) — oneways pass from below
  c.oneway(56, 41, 3);
  c.oneway(60, 38, 3);
  c.oneway(56, 35, 3);
  c.oneway(60, 32, 3);
  c.oneway(56, 29, 3);
  c.oneway(60, 26, 3);
  c.oneway(56, 23, 3);
  c.oneway(60, 20, 3);
  c.set(57, 43, 'S');               // grade vent up the well
  c.set(58, 11, 'O');               // a drone rides the well
  // gallery dressing: fight the drag for the prizes
  c.gems(70, 37, 3, 1);
  c.set(114, 37, 'j');              // KEY, far east on the east-dragging A
  c.gems(100, 31, 3, 1);
  c.set(66, 31, 'M');               // token at B's west end — the belt fights you
  c.set(84, 31, 'T');
  c.gems(80, 25, 3, 1);
  c.set(114, 25, 'B');
  c.set(96, 25, 'T');
  c.rect(90, 16, 90, 19, 'D');      // the door on the switch deck
  c.gems(96, 19, 3, 1);
  c.set(110, 19, 'M');              // switch-deck token, behind the door
  c.set(116, 19, 'n');              // THE MASTER SWITCH

  // ---- THE DISPATCH CHUTE (x118..x123): gates sealed until the switch ---------
  c.rect(118, 24, 123, 24, 'H');
  c.rect(118, 32, 123, 32, 'H');
  c.rect(118, 40, 123, 40, 'H');
  c.gems(119, 22, 4, 1);
  c.gems(119, 28, 4, 2);
  c.gems(119, 36, 4, 2);
  c.set(120, 42, 'M');              // the chute token
  c.carve(125, 40, 126, 43);             // the east exit, at grade

  // ---- the dispatch yard --------------------------------------------------------
  c.gems(132, 43, 3, 2);
  c.onFloor(140, 'A');
  c.run(148, FLOOR, 14, '>');       // out-feed belt
  c.gemArc(154, 38, 5);
  c.onFloor(166, 'T');
  c.onFloor(176, 'E');
  c.set(184, 43, 'B');
  c.gemArc(196, 38, 5);
  c.onFloor(204, 'A');
  c.onFloor(216, 'F');

  return {
    name: 'The Assembly', theme: 'foundry', daypart: 'dawn', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Coglar Foundry 6-2: "The Assembly" (228×50, dawn)
CONCEPT  THE WORKS. Four belted gallery floors — each drags you toward or
         away from the stairwell — a key on the far end of the drag, a
         locked switch deck, and the sealed dispatch chute.
SETPIECE THE DISPATCH CHUTE — three gates down the tower's east shaft; the
         master switch clears the column and drops you through gem lines to
         the yard.
ROUTES   stairwell rungs (a grade vent skips three) vs the belted floors;
         the approach undercut; the out-feed belt sprint.
TOKENS   approach undercut (x44) / floor B west end against the drag (x66)
         / switch deck (x110) / the chute fall (x120).`,
  };
}

// ---------------------------------------------------------------------------
// 6-3 THE TRIALS — the Rust keeps trophies: five worlds quoted in iron, one
// gauntlet. What the wilds taught, the machine now tests.
// ---------------------------------------------------------------------------
function trials() {
  const W = 248, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 246, FLOOR);

  c.onFloor(6, 'P');
  c.gems(10, 39, 4, 2);
  c.onFloor(16, 'E');

  // ---- TRIAL OF THE WOOD: a caged grove — oneway boughs, a spring, an owl ----
  c.oneway(26, 35, 4);
  c.oneway(33, 31, 4);
  c.oneway(40, 27, 4);
  c.set(42, 26, 'M');               // bough token
  c.gems(27, 33, 2, 1);
  c.gems(34, 29, 2, 1);
  c.onFloor(30, 'S');
  c.set(36, 22, 'O');
  c.onFloor(46, 'T');

  // ---- TRIAL OF SAND: the sprint — pits at momentum ---------------------------
  c.carve(56, FLOOR, 60, H - 1);
  c.carve(68, FLOOR, 72, H - 1);
  c.gemArc(58, 34, 5);
  c.gemArc(70, 34, 5);
  c.onFloor(64, 'A');
  c.onFloor(78, 'K');               // checkpoint after the sprint

  // ---- TRIAL OF THE DEEP: the coolant duct — swim under the works -------------
  c.carve(86, 41, 122, 43);
  c.addWater(86, 41, 122, 43);
  c.run(88, FLOOR, 14, 'C');        // grated crust over the west half
  // the east half is open water — dive in, swim west under the grate
  c.set(92, 42, 'M');               // duct token, under the grate
  c.gems(98, 42, 3, 1);
  c.gems(110, 42, 3, 1);
  c.set(104, 39, 'B');
  c.onFloor(126, 'E');

  // ---- TRIAL OF ASH: the vent chain over the melt ------------------------------
  c.carve(134, FLOOR, 138, H - 1);
  c.carve(146, FLOOR, 150, H - 1);
  c.onFloor(131, 'S');
  c.onFloor(142, 'S');
  c.gemArc(136, 33, 5);
  c.gemArc(148, 33, 5);
  c.set(148, 30, 'M');              // vent-flight token
  c.set(140, 26, 'O');
  c.onFloor(156, 'T');

  // ---- TRIAL OF FROST: a coolant-spill ice strip with one gap ------------------
  c.run(162, FLOOR, 30, 'I');
  c.carve(174, FLOOR, 178, H - 1);
  c.gems(166, 38, 3, 1);
  c.gems(182, 38, 3, 1);
  c.set(176, 36, 'M');              // the slide-gap token
  c.onFloor(188, 'A');

  // ---- the wardens key + the last door -----------------------------------------
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
    header: `EMBERWILDS — Coglar Foundry 6-3: "The Trials" (248×46, dusk)
CONCEPT  REMIX. The Rust keeps trophies — five worlds quoted in iron: a
         caged grove, the sand sprint, a coolant duct to swim, a vent chain
         over the melt, a frozen coolant spill. One key, one door, out.
SETPIECE the gauntlet itself — every mechanic the wilds taught, tested in
         sequence under one roof.
ROUTES   each trial carries its own side prize; the duct swims UNDER the
         grated crust for the deep token.
TOKENS   grove bough (x42) / coolant duct (x92) / vent flight (x148) /
         frost gap (x176).`,
  };
}

// ---------------------------------------------------------------------------
// 6-4 THE LAST MARCH — everything, against you: the belts run backward, the
// machines are out in force, and the Barons door waits at the end.
// ---------------------------------------------------------------------------
function lastMarch() {
  const W = 252, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 218, FLOOR);
  c.ground(219, 250, 34);           // the door terrace

  // ---- the against-belt approach: every step earned ----------------------------
  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.run(16, FLOOR, 36, '<');        // the road itself fights you
  c.onFloor(24, 'E');
  c.gems(30, 37, 3, 1);
  c.onFloor(38, 'E');
  c.gems(44, 37, 3, 1);
  c.set(54, 37, 'B');

  // ---- the grate channel: spikes under, one gap in the deck --------------------
  c.rect(62, 34, 77, 34, 'X');
  c.rect(80, 34, 95, 34, 'X');
  c.run(62, 37, 16, '^');
  c.run(81, 37, 15, '^');
  c.set(79, 36, 'M');               // channel token in the safe slot
  c.set(78, 37, 'S');               // the vent back up the gap
  c.gems(78, 35, 2, 1);
  c.onFloor(68, 'T');               // jacks hold the deck
  c.onFloor(88, 'T');
  c.gems(70, 32, 3, 1);
  c.gems(84, 32, 3, 1);
  c.onFloor(100, 'K');              // checkpoint

  // ---- the drone gallery: a belt sprint under diving drones --------------------
  c.run(106, FLOOR, 40, '>');
  c.carve(116, FLOOR, 120, H - 1);
  c.carve(130, FLOOR, 134, H - 1);
  c.gemArc(118, 32, 5);
  c.gemArc(132, 32, 5);
  c.set(132, 29, 'M');              // flight token under the drones
  c.set(112, 25, 'O');
  c.set(126, 23, 'O');
  c.set(140, 25, 'O');
  c.onFloor(150, 'A');
  c.set(154, 37, 'B');

  // ---- the piston stair: an ambush climb ----------------------------------------
  c.oneway(160, 33, 3);
  c.oneway(166, 29, 3);
  c.oneway(172, 25, 3);
  c.set(167, 28, 'T');
  c.set(173, 24, 'T');
  c.gems(161, 31, 2, 2);
  c.gems(173, 23, 2, 2);

  // ---- the key vault: under a fragile grate, the last key ----------------------
  c.run(184, FLOOR, 2, 'C');
  c.carve(181, 39, 188, 41);
  c.set(183, 40, 'j');              // THE BARONS KEY
  c.set(186, 40, 'M');              // vault token
  c.gems(182, 39, 2, 1);
  c.set(187, 41, 'S');
  c.gemArc(196, 36, 5);
  c.onFloor(202, 'A');
  c.onFloor(210, 'E');

  // ---- THE BARONS DOOR ------------------------------------------------------------
  c.rect(219, 22, 222, 29, 'X');    // the arch
  c.rect(220, 30, 220, 33, 'D');    // the locked door
  c.oneway(218, 21, 6);             // the parapet
  c.set(221, 20, 'M');              // parapet token (skill)
  c.gems(226, 32, 3, 2);
  c.onFloor(232, 'T');
  c.set(238, 33, 'B');
  c.onFloor(242, 'F');
  c.set(228, 26, 'O');

  return {
    name: 'The Last March', theme: 'foundry', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Coglar Foundry 6-4: "The Last March" (252×44, dusk)
CONCEPT  GAUNTLET. Everything, against you: the road is a belt running
         backward, drones dive the sprint, jacks hold the grate channel,
         and the last key hides in a vault under your feet.
SETPIECE THE BARONS DOOR — the final arch. Beyond it, the Foundry Heart.
ROUTES   the grate deck vs the spiked channel beneath; the key vault; the
         parapet over the door.
TOKENS   grate channel (x79) / drone flight (x132) / key vault (x186) /
         door parapet (x221, skill).`,
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
