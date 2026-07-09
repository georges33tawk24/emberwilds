/**
 * OCHRE CANYON rebuilt to the Phase-3 bar: FULL-HEIGHT three-lane anatomy
 * (ground road / spring-fed ledge road / mesa-top wind road), harder than the
 * Phase-2 pass — the pits are LETHAL now (fall = death), so every gap is a real
 * commitment and the spike strips pinch the landings. The world's identity is
 * OPEN AIR: springs and updrafts throw you between the three lanes, and the sky
 * road rewards anyone who never touches the dust.
 * Movement law: jump 4 up / 6 across (3 across when climbing >2); pits <=5 wide;
 * springs lift 8; carve pits AFTER ground fills.
 * Run: node scripts/buildCanyon.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 2-1 DUSTWIND FLATS — SPEED, taught safe. Ground sprint with lethal gaps, a
// spring-fed dune-ledge road over it, and a mesa-top wind road over THAT. The
// GREAT DUNE is the setpiece; a keeper's cellar hides under its hollow.
// ---------------------------------------------------------------------------
function dustwindFlats() {
  const W = 240, H = 44, FLOOR = 37;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD: dune waves, lethal gaps, spike pinches ------------------
  c.ground(1, 20, FLOOR);            // trailhead
  c.ground(21, 30, 34);              // wave up
  c.ground(31, 52, FLOOR);
  c.ground(53, 64, 34);              // wave up (the lone hoodoo grows here)
  c.ground(65, 99, FLOOR);           // spring flats
  c.ground(100, 106, 34);            // THE GREAT DUNE — the long climb
  c.ground(107, 112, 31);
  c.ground(113, 120, 28);            // the crest
  c.ground(121, 126, 31);
  c.ground(127, 133, 34);            // the dive
  c.ground(134, 145, FLOOR);
  c.ground(146, 158, 39);            // the bowl (checkpoint rest)
  c.ground(159, 212, FLOOR);         // sprint finale
  c.ground(213, 238, 34);            // beacon rise

  // lethal gaps in the flats (<=5 wide, jumpable, now DEADLY)
  c.carve(70, FLOOR, 73, H - 1);
  c.carve(80, FLOOR, 84, H - 1);
  c.gemArc(69, 34, 6);
  c.gemArc(79, 34, 6);
  c.carve(170, FLOOR, 174, H - 1);   // sprint gaps
  c.carve(196, FLOOR, 200, H - 1);
  c.gemArc(169, 34, 6);
  c.gemArc(195, 34, 6);
  c.run(90, 36, 3, '^');             // spikes pinch a landing
  c.run(184, 36, 3, '^');
  c.gemArc(89, 33, 5);
  c.gemArc(183, 33, 5);

  // ground springs feed the MID lane
  c.onFloor(66, 'S');
  c.onFloor(162, 'S');

  // ---- MID LANE: the dune-ledge road (y28-30 one-ways) ---------------------
  c.oneway(63, 29, 5);               // spring x66 catches here
  c.oneway(72, 28, 5);
  c.oneway(82, 29, 5);
  c.oneway(92, 27, 5);
  c.gems(64, 27, 2, 2);
  c.gems(74, 26, 2, 2);
  c.set(96, 26, 'M');                // TOKEN — mid-lane end, over the spikes
  c.oneway(160, 29, 5);              // second-half ledge stretch
  c.oneway(170, 28, 5);
  c.oneway(180, 29, 5);
  c.gems(172, 26, 2, 2);

  // a mid spring throws you to the SKY lane
  c.set(76, 27, 'S');                // on the x72 pad's reach
  c.set(174, 27, 'S');

  // ---- SKY LANE: the mesa-top wind road (y19 pads) --------------------------
  c.oneway(78, 19, 3);
  c.oneway(86, 19, 3);
  c.oneway(94, 19, 3);
  c.oneway(102, 19, 5);              // wind-road landing porch on the dune
  for (let i = 0; i < 5; i++) c.set(79 + i * 6, 17, '*'); // the high line
  c.set(104, 18, 'M');               // TOKEN — the wind road's end

  // ---- THE GREAT DUNE: pound the crest into the keeper's cellar -------------
  c.run(116, 28, 2, 'C');            // cracked crest — pound I
  c.carve(116, 29, 117, 30);
  c.carve(113, 31, 120, 33);         // the hollow
  c.set(118, 32, 'M');               // TOKEN — the dune's pound secret
  c.set(114, 31, 'L');               // the keeper's lantern in the dark
  c.gems(115, 32, 2, 2);
  c.set(119, 31, 'B');
  c.set(119, 33, 'S');               // spring back out through the crest

  // gem cascade down the dive — the money shot
  c.gems(127, 27, 2, 2);
  c.gems(131, 30, 2, 2);
  c.gems(135, 33, 2, 2);
  c.gems(139, 35, 2, 2);

  // dressing
  c.gems(9, 35, 4, 2);               // sprint teach-line
  c.gems(24, 32, 3, 2);
  c.gems(101, 32, 2, 3);             // climb markers up the dune
  c.gems(108, 29, 2, 3);
  c.set(118, 26, 'B');               // crest berry
  c.gems(204, 35, 3, 2);             // sprint lines to the rise
  c.set(210, 36, 'B');

  // the lone hoodoo (landmark + skill token on its cap)
  c.rect(52, 27, 53, 33, 'X');
  c.oneway(51, 26, 4);
  c.set(52, 25, 'M');                // TOKEN — hoodoo cap (wall-kick or glide)

  // the beacon arch — walk under, wall-kick onto it
  c.rect(220, 28, 221, 33, 'X');
  c.rect(228, 28, 229, 33, 'X');
  c.run(220, 27, 10, 'X');
  c.onFloor(232, 'F');

  // the bowl checkpoint
  c.onFloor(152, 'K');
  c.set(150, 38, 'B');

  // ---- cast: rhythm obstacles, not walls -----------------------------------
  c.onFloor(6, 'P');
  c.onFloor(28, 'E');                // rock-crab on the first wave
  c.onFloor(48, 'T');
  c.set(74, 27, 'T');                // a dust-hare on the ledge road
  c.onFloor(96, 'E');
  c.set(114, 27, 'O');               // buzzard rides the dune wind
  c.onFloor(148, 'T');
  c.onFloor(178, 'A');               // tumbleburrs roll the sprint
  c.onFloor(190, 'A');
  c.onFloor(206, 'E');
  c.set(88, 18, 'O');                // an owl over the wind road

  return {
    name: 'Dustwind Flats', theme: 'canyon', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-1: "Dustwind Flats" (240×44, Phase-3 rebuild)
CONCEPT  OPEN AIR, taught safe. Three lanes — dust sprint, spring-fed dune
         ledges, a mesa-top wind road — with LETHAL gaps on the ground now.
SETPIECE THE GREAT DUNE — a four-step climb to a crest you can pound through
         into the keeper's cellar, then a diving gem cascade to the bowl.
PACING   flats sprint -> spring to the ledge road -> the dune + wind road ->
         bowl checkpoint -> sprint finale with burrs -> the beacon arch.
ROUTES   low: dust sprint (lethal gaps, spikes). mid: dune-ledge one-ways.
         high: the wind road (fast, rich). secret: pound the dune crest (x116).
TOKENS   hoodoo cap (x52, skill) / mid-lane end (x96) / wind road (x104) /
         dune cellar (x118, pound).`,
  };
}

// ---------------------------------------------------------------------------
// 2-2 HOODOO HEIGHTS — CLIMB developed. Pillar caps across a burr-prowled
// chasm whose FLOOR IS NOW A LETHAL DROP on the deep spans — the cap crossing
// is a commitment, not a stroll. Ladders climb three mesa tiers.
// ---------------------------------------------------------------------------
function hoodooHeights() {
  const W = 236, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: mesas step down into the chasm, up again, and beyond -------
  c.ground(1, 30, 30);               // start mesa
  c.ground(31, 44, 33);              // step
  c.ground(45, 58, 36);              // step
  c.ground(59, 92, FLOOR);           // the chasm floor (HOODOO FOREST above)
  c.ground(93, 120, 33);             // mid mesa (checkpoint)
  c.ground(121, 134, 29);            // climb resumes
  c.ground(135, 148, 25);
  c.ground(149, 178, 25);            // high plateau
  c.ground(179, 198, 29);            // descent
  c.ground(199, 234, 33);            // beacon mesa

  // the chasm has two LETHAL voids — the caps are the only way across them
  c.carve(72, FLOOR, 76, H - 1);
  c.carve(84, FLOOR, 88, H - 1);

  // undercut bank under the first step — the whispering secret
  c.carve(36, 34, 44, 35);
  c.set(39, 34, 'M');                // TOKEN — undercut bank
  c.gems(41, 34, 2, 2);

  // ---- the HOODOO FOREST: pillar caps across the chasm ---------------------
  const hoodoo = (x, capY, toFloor = FLOOR - 1) => {
    c.rect(x, capY + 1, x + 1, toFloor, 'X');
    c.oneway(x - 1, capY, 4);
  };
  hoodoo(62, 31);
  hoodoo(68, 29);
  hoodoo(74, 31, 36);                // caps over the voids (their stems stop short)
  hoodoo(80, 29);
  hoodoo(86, 31, 36);
  c.gems(63, 30, 2, 2);
  c.gems(69, 28, 2, 2);
  c.gems(75, 30, 2, 2);
  c.gems(81, 28, 2, 2);
  // the safe chasm floor between the voids: risk it for the prize
  c.set(70, 39, 'M');                // TOKEN — chasm floor, between the voids
  c.gems(64, 39, 3, 2);
  c.set(66, 39, 'B');
  c.oneway(89, 37, 3);               // ladder out the far side
  c.oneway(91, 34, 2);

  c.gems(8, 29, 4, 2);               // start-mesa teach line
  c.gems(96, 32, 3, 2);             // mid-mesa greeting

  // mid mesa: rest + hollow-mesa cellar
  c.onFloor(100, 'K');
  c.set(103, 32, 'B');
  c.run(107, 33, 2, 'C');
  c.carve(107, 34, 108, 35);
  c.carve(105, 36, 112, 38);
  c.set(110, 37, 'M');               // TOKEN — hollow mesa (pound)
  c.gems(106, 37, 2, 2);
  c.set(111, 38, 'S');

  // ---- the second climb: rung ladders + a SKY wind-line over the plateau ---
  c.oneway(122, 31, 2);
  c.oneway(136, 27, 2);
  c.gems(124, 28, 2, 2);
  c.gems(138, 24, 2, 2);
  // sky line: spring off the plateau to a run of high pads
  c.onFloor(152, 'S');
  c.oneway(150, 17, 3);
  c.oneway(158, 17, 3);
  c.oneway(166, 17, 5);
  for (let i = 0; i < 4; i++) c.set(151 + i * 6, 15, '*');
  c.set(168, 16, 'M');               // TOKEN — the plateau sky-line end

  // high plateau reward stretch
  c.gems(156, 24, 4, 2);
  c.set(170, 24, 'B');
  c.onFloor(174, 'T');

  // descent + beacon mesa framed by a hoodoo pair (the landmark)
  c.gemArc(180, 28, 4);
  c.gems(186, 28, 3, 2);
  c.gems(202, 32, 3, 2);
  c.gems(216, 31, 3, 4);
  c.rect(214, 27, 215, 32, 'X');
  c.rect(226, 27, 227, 32, 'X');
  c.onFloor(220, 'F');

  // ---- cast -----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(22, 'E');
  c.onFloor(38, 'T');
  c.onFloor(52, 'E');
  c.set(66, 39, 'A');                // a burr on the safe floor patch
  c.set(64, 30, 'O');                // buzzards over the caps
  c.set(82, 28, 'O');
  c.onFloor(116, 'E');
  c.onFloor(146, 'T');
  c.set(160, 16, 'O');               // an owl on the sky line
  c.onFloor(190, 'E');
  c.onFloor(206, 'T');
  c.onFloor(210, 'E');

  return {
    name: 'Hoodoo Heights', theme: 'canyon', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-2: "Hoodoo Heights" (236×46, Phase-3 rebuild)
CONCEPT  CLIMB developed. Pillar caps across a chasm whose deep spans are now
         LETHAL voids — the cap crossing is a real commitment.
SETPIECE the HOODOO FOREST — five caps over two killing voids, a safe floor
         patch between them holding a prize, ladder out the far wall.
PACING   mesa steps -> the cap crossing -> mid-mesa checkpoint + cellar ->
         rung climb + plateau sky-line -> framed beacon mesa.
ROUTES   high: cap-to-cap. mid: rung ladders + plateau sky pads. low: the
         chasm floor patch (voids on either side). secret: undercut bank (x39).
TOKENS   undercut bank (x39) / chasm floor (x70) / hollow mesa (x110, pound) /
         plateau sky-line (x168).`,
  };
}

// ---------------------------------------------------------------------------
// 2-3 THE SUNKEN WASH — WEAVE. Rim road above, wash below, a SKY thermal line
// over both; springs and stairs stitch them. The slot canyon squeeze — now a
// lethal spike gauntlet — is the exam.
// ---------------------------------------------------------------------------
function sunkenWash() {
  const W = 248, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // the wash floor runs the whole level, torn by lethal gaps
  c.ground(1, 246, FLOOR);
  c.carve(96, FLOOR, 100, H - 1);
  c.carve(148, FLOOR, 152, H - 1);
  c.carve(176, FLOOR, 180, H - 1);
  c.gemArc(95, 35, 6);
  c.gemArc(147, 35, 6);
  c.gemArc(175, 35, 6);

  // ---- the rim road: one-way runs above the wash ---------------------------
  const rim = (x, len, y = 29) => c.oneway(x, y, len);
  rim(34, 6); rim(46, 6); rim(58, 5); rim(70, 6);
  rim(84, 6); rim(102, 6); rim(114, 5); rim(126, 6);
  rim(140, 6); rim(158, 5); rim(170, 6); rim(184, 6);
  rim(192, 4, 26); rim(198, 4, 26);  // a high-rim stretch with the rim prize
  c.set(200, 25, 'M');               // TOKEN — high rim
  c.gems(35, 28, 3, 2);
  c.gems(71, 28, 2, 2);
  c.gems(115, 28, 2, 2);
  c.gems(171, 28, 2, 2);

  // crossovers: springs fire you up, stair rungs walk you up
  c.onFloor(40, 'S');
  c.onFloor(120, 'S');
  c.onFloor(206, 'S');
  c.oneway(78, 35, 2); c.oneway(80, 32, 2);   // stair pocket one
  c.oneway(162, 35, 2); c.oneway(164, 32, 2); // stair pocket two

  // ---- SKY thermal line: a spring on the rim throws you to high pads --------
  c.set(48, 28, 'S');
  c.oneway(50, 20, 3);
  c.oneway(58, 20, 3);
  c.oneway(66, 20, 5);
  for (let i = 0; i < 4; i++) c.set(51 + i * 6, 18, '*');
  c.set(68, 19, 'M');                // TOKEN — the thermal line's end

  // ---- undercut banks: overhangs shading wash alcoves ----------------------
  c.run(60, 33, 6, 'X');
  c.gems(61, 36, 3, 2);
  c.set(64, 37, 'B');
  c.run(130, 33, 7, 'X');
  c.set(133, 36, 'M');               // TOKEN — the shaded token, walk in look up
  c.gems(131, 37, 2, 4);

  // wash-floor cellar (pound the lid)
  c.run(30, FLOOR, 2, 'C');
  c.carve(30, 39, 31, 39);
  c.carve(27, 40, 34, 41);
  c.set(32, 40, 'M');                // TOKEN — cellar
  c.gems(28, 40, 2, 2);
  c.set(33, 41, 'S');

  // ---- the SLOT CANYON: stone teeth + a lethal spike floor -----------------
  c.rect(214, 30, 214, 36, 'X');     // rising tooth
  c.rect(220, 24, 220, 33, 'X');     // hanging tooth
  c.rect(226, 30, 226, 36, 'X');     // rising tooth
  c.run(215, 37, 4, '^');
  c.run(222, 37, 4, '^');
  c.onFloor(211, 'S');               // spring fires you up the slot
  c.oneway(216, 27, 1);
  c.oneway(218, 25, 3);
  c.gems(228, 36, 2, 2);

  // beacon on the far rise
  c.ground(232, 246, 35);
  c.onFloor(238, 'F');
  c.set(234, 34, 'B');

  // checkpoint mid-wash, under the rim road
  c.onFloor(110, 'K');
  c.gems(105, 37, 3, 2);
  c.gems(136, 37, 3, 2);
  c.gems(193, 25, 2, 2);
  c.set(70, 37, 'B');

  // ---- cast -----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(24, 'T');
  c.onFloor(88, 'A');                // tumbleburr owns the mid-wash
  c.set(66, 20, 'O');                // buzzards circle above the rim
  c.set(122, 20, 'O');
  c.set(188, 19, 'O');
  c.onFloor(136, 'E');
  c.onFloor(158, 'T');
  c.onFloor(190, 'E');
  c.onFloor(208, 'T');
  c.set(54, 19, 'O');                // an owl on the thermal line

  return {
    name: 'The Sunken Wash', theme: 'canyon', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-3: "The Sunken Wash" (248×44, Phase-3 rebuild)
CONCEPT  WEAVE. Three roads the whole way — rim above, wash below (lethal
         gaps), a sky thermal line over both — stitched by springs and stairs.
SETPIECE the SLOT CANYON — stone teeth squeeze the wash into a lethal spike
         zigzag; a spring fires you up the throat past the hanging tooth.
PACING   wash walk-in + cellar -> rim/thermal weave -> checkpoint -> undercut
         banks -> the slot exam -> far-rise beacon.
ROUTES   rim road (fast, buzzards) / wash floor (shaded, burrs, lethal gaps) /
         sky thermal line. secret: pound the cellar lid (x30).
TOKENS   cellar (x32) / thermal line (x68) / undercut alcove (x133) /
         high rim (x200).`,
  };
}

// ---------------------------------------------------------------------------
// 2-4 THE RUST SCAR — INVASION + the combine-with (W1 canopy weaving). The
// canyon is natural until the Scar tears it open; the RUST TRESTLE spans a
// LETHAL trench, and a slung iron canopy weaves beneath the spans.
// ---------------------------------------------------------------------------
function rustScar() {
  const W = 240, H = 44, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain --------------------------------------------------------------
  c.ground(1, 143, FLOOR);           // the natural half
  c.ground(30, 42, 33);              // one last friendly dune
  c.ground(144, 149, 32);            // trestle on-ramp rise
  c.ground(189, 226, FLOOR);         // the Scar's far bank
  c.ground(227, 238, 33);            // the boss-gate rise
  // the Scar: a LETHAL torn trench crossed only by the trestle
  c.carve(150, FLOOR, 188, H - 1);

  // the Rust arrives: the ground turns to bolted iron past x100
  c.rect(100, FLOOR, 143, 37, 'X');
  c.rect(189, FLOOR, 226, 37, 'X');

  // ---- the RUST TRESTLE: broken iron spans over the killing Scar ------------
  c.run(150, 30, 9, 'X');
  c.run(163, 30, 9, 'X');            // (commit gap x159-162)
  c.run(176, 30, 9, 'X');            // (commit gap x172-175)
  c.gemArc(158, 27, 5);              // flight over commit gap I
  c.gemArc(171, 27, 5);              // flight over commit gap II
  c.set(167, 29, 'M');               // TOKEN — the middle span
  c.gems(152, 29, 3, 2);
  c.gems(178, 29, 3, 2);
  // the slung iron canopy: one-ways weaving BENEATH the spans (W1 combine)
  c.oneway(155, 34, 4);
  c.oneway(163, 35, 4);
  c.oneway(171, 34, 4);
  c.oneway(179, 35, 4);
  c.set(173, 33, 'M');               // TOKEN — the canopy weave, over the void
  c.gems(156, 33, 2, 2);
  c.gems(180, 33, 2, 2);
  c.set(157, 33, 'S');               // a spring on the canopy climbs back up
  c.set(167, 27, 'O');               // buzzards dive the trestle
  c.set(160, 25, 'O');

  // ---- natural half: recap at speed, then the mood turns -------------------
  c.gems(12, 35, 4, 2);
  c.gems(33, 32, 3, 2);
  c.carve(52, FLOOR, 56, H - 1);     // lethal gaps
  c.gemArc(51, 34, 6);
  c.onFloor(64, 'S');
  c.oneway(66, 29, 4);               // spring feeds a short high road
  c.oneway(74, 27, 4);
  c.oneway(82, 29, 4);
  c.gems(67, 27, 2, 2);
  c.set(76, 25, 'M');                // TOKEN — the natural high road
  c.carve(88, FLOOR, 92, H - 1);
  c.gemArc(87, 34, 6);
  // the lone hoodoo, dressed in gems (the last natural landmark)
  c.rect(120, 30, 121, 35, 'X');
  c.oneway(119, 29, 4);
  c.set(120, 28, 'B');

  // debris piles: pound through the Rust's litter (C is standable)
  c.run(108, 35, 3, 'C');
  c.run(130, 35, 2, 'C');
  c.gems(114, 34, 3, 2);
  c.set(126, 35, 'B');
  // the debris cellar beside the on-ramp
  c.run(136, 35, 2, 'C');
  c.carve(136, 36, 137, 37);
  c.carve(134, 38, 140, 40);
  c.set(138, 39, 'M');               // TOKEN — debris cellar (pound)
  c.gems(135, 39, 2, 2);
  c.set(139, 40, 'S');

  // checkpoint at the trestle on-ramp — breathe before the crossing
  c.onFloor(146, 'K');

  // post-Scar gauntlet: the Rust's welcome
  c.run(196, 35, 3, '^');
  c.gems(202, 35, 3, 2);
  c.run(210, 35, 3, '^');
  c.set(216, 35, 'B');
  c.gemArc(207, 33, 5);

  // the boss gate: iron pillars frame the beacon — Rustjaw is next door
  c.rect(230, 28, 231, 32, 'X');
  c.rect(235, 28, 236, 32, 'X');
  c.onFloor(233, 'F');

  // ---- cast -----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(26, 'E');
  c.onFloor(46, 'T');
  c.onFloor(70, 'E');
  c.onFloor(112, 'A');               // the Rust's own start here
  c.onFloor(132, 'E');
  c.onFloor(198, 'E');
  c.onFloor(206, 'A');
  c.onFloor(218, 'E');

  return {
    name: 'The Rust Scar', theme: 'canyon', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Ochre Canyon 2-4: "The Rust Scar" (240×44, Phase-3 rebuild)
CONCEPT  INVASION + combine-with W1 weaving. Natural canyon until x100 — then
         bolted iron, debris, and a LETHAL Scar spanned by the Rust Trestle.
SETPIECE the RUST TRESTLE — three broken iron spans over a killing trench with
         a slung iron canopy weaving beneath them; buzzards dive the gaps.
PACING   natural recap (lethal gaps, high road) -> the Rust + debris cellar ->
         trestle checkpoint -> the trestle/canopy crossing -> boss-gate gauntlet.
ROUTES   trestle high crossing / the slung canopy beneath / the debris road;
         the trench itself is death now. secret: debris cellar (x138).
TOKENS   natural high road (x76) / debris cellar (x138) / middle span (x167) /
         canopy weave (x173).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['canyon1.ts', dustwindFlats()],
  ['canyon2.ts', hoodooHeights()],
  ['canyon3.ts', sunkenWash()],
  ['canyon4.ts', rustScar()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
