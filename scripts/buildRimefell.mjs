/**
 * RIMEFELL (World 5) — the snowfield. The world's identity is ICE: momentum
 * carries, stopping takes room, turning is a commitment ('I' tiles, ice
 * physics in TUNING.ice). Levels escalate the one idea:
 *   5-1 THE LONG SLIDE   — SLIDE.   Setpiece: the long terraced ice run.
 *   5-2 (next)           — ICE + CLIMB
 *   5-3 (next)           — FRAGILE ICE (pound) + FROSTBLOOM
 *   5-4 (next)           — BLIZZARD GAUNTLET
 * Movement law: jump 4 up / 6 across; pits ≤5; springs lift 8; ice is solid
 * for reachability (slip is feel, not reach). Run: node scripts/buildRimefell.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 5-1 THE LONG SLIDE — learn what ice does to your feet. Short patch first,
// then the long terraced run where momentum carries you over the gaps.
// ---------------------------------------------------------------------------
function longSlide() {
  const W = 240, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: rolling snowfield stepping gently downhill then home -------
  c.ground(1, 40, FLOOR);           // walk-in
  c.ground(41, 72, 34);             // first rise (the teach pond sits here)
  c.ground(73, 118, 30);            // THE LONG SLIDE, terrace I
  c.ground(119, 150, 33);           // terrace II
  c.ground(151, 182, FLOOR);        // terrace III (runout)
  c.ground(183, 214, 33);           // bench
  c.ground(215, 238, 31);           // beacon rise

  // an extra lethal gap at the bench's end — slide off it and you're gone
  c.carve(208, 33, 211, H - 1); c.gemArc(207, 31, 5);

  // ---- walk-in: earth underfoot, a vole, the first gems ---------------------
  c.gems(8, 35, 4, 2);
  c.gems(24, 34, 3, 2);
  c.onFloor(14, 'E');
  c.set(28, 35, 'B');
  c.onFloor(32, 'E');

  // ---- the teach pond: a short ice patch — feel the coast, no danger --------
  c.run(48, 34, 16, 'I');           // ice caps the rise's surface
  c.gems(50, 32, 3, 1);
  c.gems(58, 32, 3, 1);
  c.onFloor(68, 'T');               // a pika waits at the far lip

  // ---- THE LONG SLIDE: three ice terraces, gaps momentum carries you over ---
  c.run(74, 30, 44, 'I');           // terrace I — ice REPLACES the surface row
  c.carve(96, 30, 99, H - 1);       // gap I (4 wide) — punched through the ice
  c.run(119, 33, 31, 'I');          // terrace II
  c.carve(132, 33, 136, H - 1);     // gap II (5 wide)
  c.run(151, 36, 20, 'I');          // terrace III, the runout
  c.gems(78, 28, 3, 1);             // gem lines ride the slide
  c.gems(88, 28, 3, 1);
  c.set(97, 27, 'M');               // the flight token — over gap I at speed
  c.gems(104, 28, 3, 1);
  c.gems(122, 31, 3, 1);
  c.set(134, 30, 'M');              // the second flight token, over gap II
  c.gems(140, 31, 3, 1);
  c.gems(154, 34, 3, 1);
  // icicles on the slide's south lip punish a botched stop
  c.run(162, 35, 4, '^');
  c.gems(170, 33, 2, 2);
  c.onFloor(176, 'K');              // checkpoint at the runout's end

  // frost owls patrol the open slide air
  c.set(100, 22, 'O');
  c.set(130, 24, 'O');

  // ---- the frozen cellar: fragile ice over a pocket (pound it) --------------
  c.run(188, 33, 2, 'C');           // fragile ice plate IS the floor here
  c.carve(185, 34, 192, 37);
  c.set(190, 36, 'M');              // cellar token
  c.set(187, 36, 'L');              // the keeper's lantern under the frost
  c.gems(186, 36, 2, 2);
  c.set(191, 37, 'S');              // spring back out
  c.onFloor(196, 'T');
  c.gems(198, 31, 2, 1);
  c.set(202, 32, 'B');
  c.onFloor(206, 'A');              // a hailstone rolls the bench

  // ---- beacon rise: the ice pillar (skill token — slick wall-kicks) ---------
  c.rect(222, 27, 223, 30, 'I');    // the pillar is pure ice — jump its cap
  c.oneway(221, 26, 4);
  c.set(222, 25, 'M');              // pillar token
  c.gems(216, 29, 3, 2);
  c.gems(210, 31, 2, 2);
  c.onFloor(232, 'F');
  c.onFloor(228, 'E');

  c.onFloor(6, 'P');

  return {
    name: 'The Long Slide', theme: 'rimefell', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-1: "The Long Slide" (240×42, day)
CONCEPT  SLIDE. Ice carries you — a safe pond teaches the coast, then the
         long terraced run asks you to trust it over the gaps.
SETPIECE THE LONG SLIDE — three iced terraces stepping downhill, two gaps
         that only momentum crosses, tokens riding the flight lines, frost
         owls over the open air, icicles waiting where a stop goes wrong.
ROUTES   the slide itself / the frozen cellar under a fragile-ice plate on
         the bench / the ice pillar by the beacon for the skill climb.
TOKENS   gap I flight (x97) / gap II flight (x134) / frozen cellar (x190) /
         ice pillar (x222, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 5-2 THE FROSTFANG SPIRES — the climb, on slick footing. Ice-capped pillars
// cross the chasm; every landing wants to carry you off the far edge.
// ---------------------------------------------------------------------------
function frostfangSpires() {
  const W = 228, H = 48, FLOOR = 42;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain ---------------------------------------------------------------
  c.ground(1, 36, FLOOR);           // walk-in
  c.ground(37, 64, 38);             // bench
  c.ground(65, 120, FLOOR);         // THE CHASM (spires rise from its floor)
  c.ground(121, 150, 34);           // mid mesa
  c.ground(151, 180, 30);           // the high field
  c.ground(181, 226, 34);           // beacon field

  // lethal gaps: the walk-in and the beacon field bite now
  c.carve(24, FLOOR, 27, H - 1); c.gemArc(23, 40, 5);
  c.carve(184, 34, 187, H - 1); c.gemArc(183, 32, 5);

  // walk-in + bench
  c.gems(8, 41, 4, 2);
  c.gems(20, 41, 2, 2);
  c.onFloor(14, 'E');
  c.set(30, 41, 'B');
  c.gems(44, 37, 3, 2);
  c.gems(56, 36, 3, 2);
  c.onFloor(52, 'T');
  c.onFloor(60, 'E');

  // ---- THE FROSTFANG SPIRES: ice-capped pillars over the chasm ---------------
  const spire = (x, capY) => {
    c.rect(x, capY + 1, x + 1, FLOOR - 1, 'X');
    c.rect(x - 1, capY, x + 2, capY, 'I');   // the slick cap
  };
  spire(70, 34);
  spire(78, 31);
  spire(86, 34);
  spire(94, 30);
  spire(102, 33);
  spire(110, 30);
  c.gems(69, 32, 2, 1);
  c.gems(85, 32, 2, 1);
  c.gems(101, 31, 2, 1);
  c.set(94, 28, 'M');               // token above the tallest cap
  // the chasm floor: hailstones own it; a token pays the brave
  c.set(74, 41, 'A');
  c.set(98, 41, 'A');
  c.set(90, 41, 'M');               // chasm-floor token
  c.gems(80, 40, 3, 2);
  c.gems(94, 40, 2, 2);
  c.set(106, 41, 'B');
  c.oneway(114, 39, 3);             // the ladder out, east face
  c.oneway(117, 36, 3);

  c.onFloor(126, 'K');              // checkpoint on the mid mesa
  c.gems(130, 32, 3, 2);
  c.gems(140, 32, 2, 2);
  c.onFloor(136, 'T');

  // ---- the high field: iced run, owls above, one pit at speed ----------------
  c.run(151, 30, 30, 'I');          // the field is ice end to end
  c.carve(162, 30, 166, H - 1);     // the pit (5) — momentum crosses it
  c.set(164, 27, 'M');              // flight token over the pit
  c.gems(154, 28, 3, 1);
  c.gems(170, 28, 3, 1);
  c.gems(176, 28, 2, 1);
  c.set(158, 22, 'O');
  c.set(172, 20, 'O');

  // ---- beacon field: fragile-ice cellar + the beacon --------------------------
  c.gems(186, 32, 3, 2);
  c.onFloor(192, 'A');
  c.run(200, 34, 2, 'C');           // fragile plate is the floor
  c.carve(197, 35, 204, 38);
  c.set(202, 37, 'M');              // cellar token
  c.gems(198, 37, 2, 1);
  c.set(203, 38, 'S');
  c.onFloor(210, 'T');
  c.set(214, 33, 'B');
  c.onFloor(220, 'F');

  c.onFloor(6, 'P');

  return {
    name: 'The Frostfang Spires', theme: 'rimefell', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-2: "The Frostfang Spires" (228×48, day)
CONCEPT  ICE CLIMB. Six ice-capped pillars cross the chasm — every cap is
         slick, every landing wants to carry you off the far edge.
SETPIECE THE FROSTFANG CROSSING — the spire line itself, with the tallest
         cap holding a token and hailstones prowling the chasm floor below
         (dropping down is a choice; the one-way ladder brings you back).
ROUTES   spire caps vs chasm floor; the iced high field with its momentum
         pit; a fragile-ice cellar on the beacon field.
TOKENS   tallest cap (x94) / chasm floor (x90) / high-field flight (x164) /
         beacon cellar (x202).`,
  };
}

// ---------------------------------------------------------------------------
// 5-3 THE FROZEN MERE — the lake wears a fragile crust: walk it, pound
// through it, and swim the gallery beneath. Frostbloom waits on the shore.
// ---------------------------------------------------------------------------
function frozenMere() {
  const W = 236, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 234, FLOOR);
  // lethal dry gaps on the shores (the mere itself is a safe swim)
  c.carve(18, FLOOR, 21, H - 1); c.gemArc(17, 38, 5);
  c.carve(198, FLOOR, 201, H - 1); c.gemArc(197, 38, 5);

  // ---- west shore -------------------------------------------------------------
  c.onFloor(6, 'P');
  c.gems(10, 39, 4, 2);
  c.onFloor(16, 'E');
  c.set(24, 39, 'z');               // FROSTBLOOM — this world's own power
  c.onFloor(28, 'T');

  // ---- THE FROZEN MERE (x34..x150): fragile crust over a swim gallery --------
  c.carve(34, 41, 150, 44);         // the water body under the surface row
  c.addWater(34, 41, 150, 44);
  // the crust: fragile ice with breathing holes and two solid islands
  c.run(34, FLOOR, 30, 'C');        // crust I
  c.carve(64, FLOOR, 66, FLOOR);    // breathing hole I
  c.run(67, FLOOR, 25, 'C');        // crust II
  // island I keeps its '#' at x92..x96 (never replaced)
  c.run(97, FLOOR, 20, 'C');        // crust III
  c.carve(117, FLOOR, 119, FLOOR);  // breathing hole II
  c.run(120, FLOOR, 24, 'C');       // crust IV
  // island II: x144..x150 stays solid ground
  // under-ice treasure: THE DROWNED LANTERNS
  c.gems(40, 42, 3, 2);
  c.gems(56, 43, 3, 1);
  c.set(70, 43, 'M');               // gallery token I, deep under crust II
  c.gems(84, 42, 3, 2);
  c.gems(104, 43, 3, 1);
  c.set(126, 43, 'M');              // gallery token II, past hole II
  c.gems(136, 42, 3, 2);
  // over the crust: gems mark the walk, owls patrol
  c.gems(48, 38, 3, 1);
  c.gems(100, 38, 3, 1);
  c.gems(130, 38, 3, 1);
  c.gems(120, 38, 3, 1);
  c.set(60, 32, 'O');
  c.set(110, 30, 'O');
  c.set(94, 39, 'B');               // island I berry
  c.onFloor(146, 'K');              // checkpoint on island II

  // ---- east shore: pika benches + the icicle stretch ---------------------------
  c.gems(156, 39, 3, 2);
  c.onFloor(162, 'T');
  c.run(170, 39, 4, '^');           // icicle bed
  c.oneway(169, 36, 6);             // the span over it
  c.set(172, 34, 'M');              // span token, right over the icicles
  c.gems(170, 33, 2, 1);
  c.onFloor(180, 'T');
  c.onFloor(188, 'A');
  c.set(194, 39, 'B');

  // ---- beacon knoll + ice-pillar perch ----------------------------------------
  c.rect(204, 35, 205, 38, 'I');
  c.oneway(203, 34, 4);
  c.set(204, 33, 'M');              // perch token
  c.gems(210, 38, 3, 2);
  c.gems(222, 38, 2, 2);
  c.onFloor(216, 'E');
  c.onFloor(226, 'F');

  return {
    name: 'The Frozen Mere', theme: 'rimefell', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-3: "The Frozen Mere" (236×46, day)
CONCEPT  FRAGILE ICE. The lake wears a crust — walk it whole, pound through
         it anywhere, and swim the gallery beneath. Frostbloom waits on the
         west shore for anyone who wants to make MORE ice.
SETPIECE THE DROWNED LANTERNS — the under-crust swim gallery: two tokens in
         the deep, gem veins along the bed, breathing holes and two islands
         to surface at.
ROUTES   over the crust vs under the mere; the one-way span over the icicle
         bed; the ice-pillar perch by the beacon.
TOKENS   gallery deep I (x70) / gallery deep II (x126) / icicle span (x172)
         / ice-pillar perch (x204, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 5-4 THE WHITEOUT ROAD — the dusk gauntlet. All of it at once, on ice,
// ending at the pass gate below the Shiverback's den.
// ---------------------------------------------------------------------------
function whiteoutRoad() {
  const W = 240, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 206, FLOOR);
  c.ground(207, 238, 34);           // the pass shelf

  // ---- opening: hailstone convoy on iced flats ---------------------------------
  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.run(16, FLOOR, 30, 'I');        // iced from the first step
  c.onFloor(22, 'A');
  c.onFloor(30, 'A');
  c.set(40, 37, 'B');
  c.gems(34, 36, 3, 1);
  c.gems(26, 36, 3, 1);

  // ---- the slide-pit chain: momentum or nothing --------------------------------
  c.run(48, FLOOR, 44, 'I');
  c.carve(56, FLOOR, 60, H - 1);
  c.carve(70, FLOOR, 74, H - 1);
  c.carve(84, FLOOR, 88, H - 1);
  c.gems(62, 34, 3, 1);
  c.gems(76, 34, 3, 1);
  c.set(72, 33, 'M');               // flight token, mid-chain
  c.set(66, 28, 'O');
  c.set(80, 26, 'O');

  // ---- THE SHEAR: one long ice beam over the wide dark -------------------------
  c.carve(96, FLOOR, 118, H - 1);   // the wide pit (23)
  c.rect(98, 36, 116, 36, 'I');     // the beam — slick, one tile, no rails
  c.gems(102, 34, 3, 1);
  c.gems(110, 34, 3, 1);
  c.set(107, 33, 'M');              // beam token, dead center
  c.set(104, 26, 'O');              // owls dive the crossing
  c.set(114, 24, 'O');
  c.onFloor(122, 'K');              // checkpoint past the Shear
  c.gems(126, 36, 3, 2);

  // ---- pika ambush benches ------------------------------------------------------
  c.oneway(130, 33, 3);
  c.oneway(136, 29, 3);
  c.oneway(142, 25, 3);
  c.set(137, 28, 'T');
  c.set(143, 24, 'T');
  c.gems(131, 31, 2, 2);
  c.gems(143, 23, 2, 2);
  c.set(148, 37, 'B');

  // ---- the key grotto: under a fragile plate, a hailstone guards the key -------
  c.run(158, FLOOR, 2, 'C');        // fragile ice plate is the road here
  c.carve(155, 39, 162, 41);
  c.set(157, 40, 'j');              // THE PASS KEY
  c.set(160, 40, 'M');              // grotto token
  c.gems(156, 39, 2, 1);
  c.set(161, 41, 'S');              // spring back out
  c.gemArc(170, 36, 5);
  c.onFloor(176, 'E');
  c.onFloor(184, 'A');
  c.run(190, 37, 4, '^');           // icicle bed before the gate
  c.oneway(189, 34, 6);
  c.gems(191, 32, 3, 1);

  // ---- THE PASS GATE --------------------------------------------------------------
  c.rect(207, 22, 210, 29, 'X');    // the gate arch on the shelf
  c.rect(208, 30, 208, 33, 'D');    // its locked door
  c.oneway(206, 21, 6);             // the parapet
  c.set(209, 20, 'M');              // parapet token (skill)
  c.gems(214, 32, 3, 2);
  c.onFloor(220, 'T');
  c.set(226, 33, 'B');
  c.onFloor(230, 'F');
  c.set(216, 26, 'O');

  return {
    name: 'The Whiteout Road', theme: 'rimefell', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-4: "The Whiteout Road" (240×44, dusk)
CONCEPT  GAUNTLET, ON ICE. Everything the snowfield taught at pressure:
         hailstone convoy on slick flats, a slide-pit chain, pika ambush
         benches, and a fragile-plate key grotto before the gate.
SETPIECE THE SHEAR — one long ice beam over the wide dark, owls diving the
         crossing, a token dead center where there is no room to stop.
ROUTES   the beam or nothing; the key grotto under the road; the parapet
         line over the pass gate.
TOKENS   slide-chain flight (x72) / the beam (x107) / key grotto (x160) /
         gate parapet (x209, skill).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['rime1.ts', longSlide()],
  ['rime2.ts', frostfangSpires()],
  ['rime3.ts', frozenMere()],
  ['rime4.ts', whiteoutRoad()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
