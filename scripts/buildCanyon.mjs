/**
 * Ochre Canyon rebuilt to the Phase-2 bar + the "every level is a concept"
 * directive. Four identities, four named setpieces:
 *   2-1 DUSTWIND FLATS  — SPEED.   Setpiece: THE GREAT DUNE gem cascade.
 *   2-2 HOODOO HEIGHTS  — CLIMB.   Setpiece: the HOODOO FOREST cap-crossing.
 *   2-3 THE SUNKEN WASH — WEAVE.   Setpiece: the SLOT CANYON squeeze.
 *   2-4 THE RUST SCAR   — INVASION. Setpiece: the broken RUST TRESTLE.
 * (2-5 Rustjaw's Hollow, the boss arena, is untouched.)
 * Principles applied, not copied: teach→practice→combine→reward (Wonder),
 * one idea escalated then a coda (Tropical Freeze), whispering side paths
 * (Celeste), silhouette landmarks (Hollow Knight).
 * Run: node scripts/buildCanyon.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 2-1 DUSTWIND FLATS — run fast, stay fast. Dune waves keep the sprint alive;
// springs launch you through gem arcs; the Great Dune pays off the whole idea.
// ---------------------------------------------------------------------------
function dustwindFlats() {
  const W = 244, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: rolling dune waves, then the Great Dune, then the flats ---
  c.ground(1, 20, FLOOR);           // trailhead
  c.ground(21, 32, 33);             // wave up
  c.ground(33, 46, FLOOR);          // wave down
  c.ground(47, 58, 33);             // wave up (hoodoo grows from this one)
  c.ground(59, 99, FLOOR);          // spring flats
  c.ground(100, 106, 33);           // THE GREAT DUNE — the long climb...
  c.ground(107, 112, 30);
  c.ground(113, 118, 27);
  c.ground(119, 126, 24);           // the crest
  c.ground(127, 131, 27);           // ...and the long dive
  c.ground(132, 136, 30);
  c.ground(137, 141, 33);
  c.ground(142, 145, FLOOR);
  c.ground(146, 158, 38);           // the bowl (checkpoint rest)
  c.ground(159, 213, FLOOR);        // sprint finale
  c.ground(214, 242, 34);           // beacon rise

  // spring flats: islands between pits, arcs overhead
  c.carve(68, FLOOR, 72, H - 1);
  c.carve(78, FLOOR, 82, H - 1);
  c.onFloor(64, 'S');
  c.onFloor(75, 'S');
  c.onFloor(85, 'S');
  c.gemArc(68, 29, 5);
  c.gemArc(78, 29, 5);
  c.set(80, 28, 'M');               // token riding the second arc — take it in flight
  c.carve(204, FLOOR, 208, H - 1);  // one last pit at sprint speed
  c.gemArc(204, 34, 5);

  // the lone hoodoo (landmark + skill token on its cap)
  c.rect(52, 27, 53, 32, 'X');
  c.oneway(51, 26, 4);
  c.set(52, 25, 'M');               // no help up here — wall-kick or glide

  // inside the Great Dune: pound the crest, drop into the hollow
  c.run(122, 24, 2, 'C');
  c.carve(122, 25, 123, 25);
  c.carve(119, 26, 126, 28);
  c.set(124, 27, 'M');
  c.gems(120, 27, 2, 2);
  c.set(120, 28, 'B');
  c.set(125, 28, 'S');

  // gem cascade down the dive — the money shot
  c.gems(127, 26, 2, 2);
  c.gems(132, 29, 2, 2);
  c.gems(137, 32, 2, 2);
  c.gems(142, 35, 2, 2);

  // dressing
  c.gems(10, 35, 4, 2);             // sprint teach-line
  c.gems(24, 32, 3, 2);
  c.gems(36, 35, 3, 2);
  c.gems(101, 32, 2, 3);            // climb markers up the dune
  c.gems(108, 29, 2, 3);
  c.gems(114, 26, 2, 3);
  c.set(120, 23, 'B');              // crest berry
  c.gems(166, 35, 4, 2);            // sprint lines between the burrs
  c.gems(188, 35, 4, 2);
  c.set(198, 35, 'B');

  // the arch — walk under it, wall-kick onto it (landmark + last token)
  c.rect(218, 30, 219, 33, 'X');
  c.rect(224, 30, 225, 33, 'X');
  c.run(218, 29, 8, 'X');
  c.set(221, 28, 'M');
  c.onFloor(230, 'F');

  // the bowl
  c.onFloor(152, 'K');
  c.set(150, 37, 'B');

  // ---- cast: rhythm obstacles, not walls -----------------------------------
  c.onFloor(6, 'P');
  c.onFloor(28, 'E');               // rock-crab on the first wave
  c.onFloor(50, 'T');
  c.onFloor(92, 'E');
  c.onFloor(104, 'T');              // dust-hares on the dune
  c.onFloor(148, 'T');
  c.onFloor(156, 'T');
  c.onFloor(172, 'A');              // tumbleburrs roll the sprint
  c.onFloor(184, 'A');
  c.onFloor(196, 'E');
  c.set(134, 24, 'O');              // buzzard rides the dune wind

  return {
    name: 'Dustwind Flats', theme: 'canyon', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-1: "Dustwind Flats" (244×42, day)
CONCEPT  SPEED. Dune waves keep a sprint alive; nothing here wants you to stop.
SETPIECE THE GREAT DUNE — a four-step climb to the crest, then a diving gem
         cascade into the checkpoint bowl.
ROUTES   flat-out floor sprint / spring arcs overhead (token rides arc two) /
         inside the dune via its cracked crest; wall-kick the lone hoodoo and
         the finale arch for the skill tokens.
TOKENS   spring arc (x80, in flight) / dune hollow (x124) / hoodoo cap (x52,
         skill) / arch top (x221, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 2-2 HOODOO HEIGHTS — the climb world of stone pillars. Cross the caps while
// burrs prowl the chasm floor below; dropping down is a choice, not a death.
// ---------------------------------------------------------------------------
function hoodooHeights() {
  const W = 236, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: mesas step down into the chasm, up again, and beyond ------
  c.ground(1, 30, 30);              // start mesa
  c.ground(31, 44, 33);             // step
  c.ground(45, 58, 36);             // step
  c.ground(59, 92, FLOOR);          // the chasm floor (HOODOO FOREST above it)
  c.ground(93, 120, 33);            // mid mesa (checkpoint)
  c.ground(121, 134, 29);           // climb resumes
  c.ground(135, 148, 25);
  c.ground(149, 178, 25);           // high plateau
  c.ground(179, 198, 29);           // descent
  c.ground(199, 234, 33);           // beacon mesa

  // undercut bank under the first step — the whispering secret
  c.carve(36, 34, 44, 35);
  c.set(39, 34, 'M');
  c.gems(41, 34, 2, 2);

  // ---- the HOODOO FOREST: pillar caps across the chasm ---------------------
  const hoodoo = (x, capY) => {
    c.rect(x, capY + 1, x + 1, FLOOR - 1, 'X');
    c.oneway(x - 1, capY, 4);
  };
  hoodoo(62, 31);
  hoodoo(68, 29);
  hoodoo(74, 31);
  hoodoo(80, 29);
  hoodoo(86, 31);
  c.gems(63, 30, 2, 2);
  c.gems(69, 28, 2, 2);
  c.gems(75, 30, 2, 2);
  c.gems(81, 28, 2, 2);
  // the chasm floor: risk it for the prize, ladder out the far side
  c.set(76, 39, 'M');
  c.gems(64, 39, 3, 2);
  c.set(71, 39, 'B');
  c.oneway(89, 37, 3);
  c.oneway(91, 34, 2);

  c.gems(8, 29, 4, 2);              // start-mesa teach line
  c.gems(96, 32, 3, 2);             // mid-mesa greeting

  // mid mesa: rest + hollow-mesa secret
  c.onFloor(100, 'K');
  c.set(103, 32, 'B');
  c.run(107, 33, 2, 'C');
  c.carve(107, 34, 108, 35);
  c.carve(105, 36, 112, 38);
  c.set(110, 37, 'M');
  c.gems(106, 37, 2, 2);
  c.set(111, 38, 'S');

  // the second climb: rung ladders between mesas, buzzards on patrol
  c.oneway(122, 31, 2);
  c.oneway(136, 27, 2);
  c.set(128, 22, 'O');
  c.set(142, 20, 'O');
  c.gems(124, 28, 2, 2);
  c.gems(138, 24, 2, 2);

  // high plateau: reward stretch + climbable hoodoo (reachable token)
  c.gems(152, 24, 4, 2);
  c.rect(160, 19, 161, 24, 'X');
  c.oneway(158, 21, 2);
  c.oneway(159, 18, 4);
  c.set(160, 17, 'M');
  c.set(170, 24, 'B');
  c.onFloor(174, 'T');

  // descent + beacon mesa framed by a hoodoo pair (the landmark you aim for)
  c.gemArc(180, 28, 4);
  c.gems(186, 28, 3, 2);
  c.gems(200, 32, 3, 2);
  c.gems(216, 31, 3, 4);            // between the framing hoodoos
  c.rect(214, 27, 215, 32, 'X');
  c.rect(226, 27, 227, 32, 'X');
  c.onFloor(220, 'F');

  // ---- cast -----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(22, 'E');
  c.onFloor(38, 'T');
  c.onFloor(52, 'E');
  c.set(70, 39, 'A');               // burrs prowl the chasm
  c.set(83, 39, 'A');
  c.onFloor(116, 'E');
  c.onFloor(146, 'T');
  c.onFloor(190, 'E');
  c.onFloor(206, 'T');
  c.onFloor(210, 'E');

  return {
    name: 'Hoodoo Heights', theme: 'canyon', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-2: "Hoodoo Heights" (236×46, day)
CONCEPT  CLIMB. Stone pillars and mesa steps; height is progress, the chasm
         floor is a choice you make for treasure.
SETPIECE the HOODOO FOREST — five pillar caps across a burr-prowled chasm;
         drop for the floor prize and ladder out the far side.
ROUTES   cap-to-cap high crossing / chasm floor risk run / hollow mesa via its
         cracked top; the undercut bank under the first step hides a token
         where only the curious look.
TOKENS   undercut bank (x39) / chasm floor (x76) / hollow mesa (x110) /
         plateau hoodoo summit (x160, rung climb).`,
  };
}

// ---------------------------------------------------------------------------
// 2-3 THE SUNKEN WASH — two roads, one river of dust. Rim above, wash below,
// springs and stairs weaving them together; the slot canyon squeezes the end.
// ---------------------------------------------------------------------------
function sunkenWash() {
  const W = 248, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // the wash floor runs the whole level
  c.ground(1, 246, FLOOR);
  c.carve(96, FLOOR, 100, H - 1);   // wash gaps
  c.carve(176, FLOOR, 180, H - 1);

  // ---- the rim road: one-way runs above the wash ---------------------------
  const rim = (x, len, y = 29) => c.oneway(x, y, len);
  rim(34, 6); rim(46, 6); rim(58, 5); rim(70, 6);
  rim(84, 6); rim(98, 6); rim(112, 5); rim(126, 6);
  rim(140, 6); rim(154, 5); rim(168, 6); rim(182, 6);
  // a high-rim stretch with the rim prize
  rim(190, 4, 26); rim(196, 4, 26);
  c.set(198, 25, 'M');
  // rim gems — the fast road pays
  c.gems(35, 28, 3, 2);
  c.gems(47, 28, 2, 2);
  c.gems(71, 28, 2, 2);
  c.gems(85, 28, 2, 2);
  c.gems(113, 28, 2, 2);
  c.gems(127, 28, 2, 2);
  c.gems(155, 28, 2, 2);
  c.gems(169, 28, 2, 2);

  // crossovers: springs fire you up, stair rungs walk you up
  c.onFloor(40, 'S');
  c.onFloor(120, 'S');
  c.onFloor(200, 'S');
  c.oneway(78, 35, 2); c.oneway(80, 32, 2);   // stair pocket one
  c.oneway(160, 35, 2); c.oneway(162, 32, 2); // stair pocket two

  // ---- undercut banks: overhangs shading wash alcoves ----------------------
  c.run(60, 33, 6, 'X');
  c.gems(61, 36, 3, 2);
  c.set(64, 37, 'B');
  c.run(140, 33, 7, 'X');
  c.set(143, 36, 'M');              // the shaded token — walk in, look up
  c.gems(141, 37, 2, 4);

  // wash-floor cellar (pound the lid)
  c.run(30, FLOOR, 2, 'C');
  c.carve(30, 39, 31, 39);
  c.carve(27, 40, 34, 41);
  c.set(32, 40, 'M');
  c.gems(28, 40, 2, 2);
  c.set(33, 41, 'S');

  // ---- the SLOT CANYON: stone teeth squeeze the wash ------------------------
  c.rect(214, 30, 214, 36, 'X');    // rising tooth
  c.rect(220, 24, 220, 33, 'X');    // hanging tooth
  c.rect(226, 30, 226, 36, 'X');    // rising tooth
  c.run(216, 37, 2, '^');
  c.run(222, 37, 2, '^');
  c.onFloor(211, 'S');              // the spring that fires you up the slot
  c.oneway(216, 27, 1);
  c.oneway(218, 25, 3);
  c.set(219, 24, 'M');              // token at the slot's throat
  c.gems(228, 36, 2, 2);

  // beacon on the far rise
  c.ground(232, 246, 35);
  c.onFloor(238, 'F');
  c.set(234, 34, 'B');

  // checkpoint mid-wash, under the rim road
  c.onFloor(124, 'K');
  c.gemArc(96, 36, 5);
  c.gemArc(176, 36, 5);
  c.gems(105, 37, 3, 2);
  c.gems(130, 37, 3, 2);
  c.gems(191, 25, 2, 2);            // the high-rim payoff
  c.set(70, 37, 'B');

  // ---- cast -----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(24, 'T');
  c.onFloor(52, 'E');
  c.set(66, 20, 'O');               // buzzards circle above the rim
  c.set(118, 20, 'O');
  c.set(186, 19, 'O');
  c.onFloor(88, 'A');               // tumbleburr owns the mid-wash
  c.onFloor(136, 'E');
  c.onFloor(158, 'T');
  c.onFloor(188, 'E');
  c.onFloor(206, 'T');

  return {
    name: 'The Sunken Wash', theme: 'canyon', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-3: "The Sunken Wash" (248×44, dusk)
CONCEPT  WEAVE. Two parallel roads the whole way — the rim above, the wash
         below — stitched by springs and stair pockets; choose and re-choose.
SETPIECE the SLOT CANYON — stone teeth squeeze the wash into a spike zigzag;
         a spring fires you up the throat to the token.
ROUTES   rim road (fast, buzzards) / wash floor (shaded, burrs, undercut
         banks) / floor cellar at x30; the shaded alcove token hides under
         the second overhang.
TOKENS   cellar (x32) / undercut alcove (x143) / high rim (x198) /
         slot throat (x219).`,
  };
}

// ---------------------------------------------------------------------------
// 2-4 THE RUST SCAR — environmental storytelling: the canyon is natural until
// the Scar, where the Rust has torn it open; iron, debris, and the trestle.
// ---------------------------------------------------------------------------
function coglarsScar() {
  const W = 240, H = 44, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain --------------------------------------------------------------
  c.ground(1, 143, FLOOR);          // the natural half
  c.ground(30, 42, 33);             // one last friendly dune
  c.ground(144, 149, 32);           // trestle on-ramp rise
  c.ground(150, 226, FLOOR);        // ...replaced below by the Scar
  c.ground(227, 238, 33);           // the boss-gate rise
  // the Scar: a torn trench crossed by the trestle
  c.carve(150, FLOOR, 188, 41);     // trench (its floor is y42 — survivable)

  // the Rust arrives: the ground itself turns to bolted iron past x100
  c.rect(100, FLOOR, 143, 37, 'X');
  c.rect(189, FLOOR, 226, 37, 'X');

  // ---- the RUST TRESTLE: broken iron spans over the Scar --------------------
  c.run(150, 30, 9, 'X');
  c.run(163, 30, 9, 'X');
  c.run(176, 30, 9, 'X');
  c.oneway(160, 34, 2);             // sagging remnants catch a missed jump
  c.oneway(173, 34, 2);
  c.set(167, 29, 'M');              // token on the middle span
  c.gems(152, 29, 3, 2);
  c.gems(178, 29, 3, 2);
  // the Scar floor: a maintenance run for the brave
  c.set(168, 41, 'M');
  c.gems(158, 41, 3, 2);
  c.set(154, 41, 'B');
  c.oneway(186, 39, 2);             // climb out the east face
  c.oneway(188, 36, 2);
  c.set(163, 41, 'A');              // wreck-burrs prowl the trench
  c.set(178, 41, 'A');

  // ---- natural half: recap at speed, then the mood turns --------------------
  c.gems(12, 35, 4, 2);
  c.gems(33, 32, 3, 2);
  c.carve(52, FLOOR, 56, H - 1);
  c.gemArc(52, 34, 5);
  c.onFloor(64, 'S');
  c.gemArc(62, 29, 5);
  c.rect(74, 27, 75, 32, 'X');      // one hoodoo, dressed in gems
  c.oneway(73, 26, 4);
  c.set(74, 25, 'M');               // skill cap, one last natural treasure
  c.carve(84, FLOOR, 88, H - 1);
  c.gemArc(84, 34, 5);

  // debris piles: pound through the Rust's litter (C is standable — hop over
  // or break them; breaking feels better)
  c.run(108, 35, 3, 'C');
  c.run(126, 35, 2, 'C');
  c.gems(114, 35, 3, 2);
  c.set(120, 35, 'B');

  // checkpoint at the trestle on-ramp — breathe before the crossing
  c.onFloor(146, 'K');

  // post-Scar gauntlet: the Rust's welcome
  c.run(196, 35, 3, '^');
  c.gems(202, 35, 3, 2);
  c.run(210, 35, 3, '^');
  c.set(216, 35, 'B');
  c.gemArc(219, 34, 5);
  // the debris cache — pound the pile beside the gate
  c.run(222, 35, 2, 'C');
  c.carve(222, 36, 223, 37);
  c.set(222, 37, 'M');
  c.gems(223, 37, 1, 1);

  // the boss gate: iron pillars frame the beacon — Rustjaw is next door
  c.rect(230, 28, 231, 32, 'X');
  c.rect(235, 28, 236, 32, 'X');
  c.onFloor(233, 'F');

  // ---- cast -----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(26, 'E');
  c.onFloor(46, 'T');
  c.onFloor(70, 'E');
  c.onFloor(94, 'T');
  c.onFloor(112, 'A');              // the Rust's own start here
  c.onFloor(132, 'E');
  c.set(156, 24, 'O');              // buzzards ride the Scar's updraft
  c.set(172, 22, 'O');
  c.onFloor(198, 'E');
  c.onFloor(206, 'A');
  c.onFloor(218, 'E');

  return {
    name: 'The Rust Scar', theme: 'canyon', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-4: "The Rust Scar" (240×44, dusk)
CONCEPT  INVASION. The canyon is natural until x100 — then bolted iron floors,
         debris piles, and the Scar itself. The world tells you who lives at
         the end of this road.
SETPIECE the RUST TRESTLE — three broken iron spans over the torn trench,
         buzzards diving, sagging remnants catching missed jumps; the trench
         floor is a burr-prowled maintenance run with its own prize.
ROUTES   trestle high crossing / Scar-floor run (climb out the east face) /
         debris cellar beside the boss gate; the last natural hoodoo (x74)
         holds a skill token.
TOKENS   hoodoo cap (x74, skill) / middle span (x167) / Scar floor (x168) /
         gate-side cache (x222).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['canyon1.ts', dustwindFlats()],
  ['canyon2.ts', hoodooHeights()],
  ['canyon3.ts', sunkenWash()],
  ['canyon4.ts', coglarsScar()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
