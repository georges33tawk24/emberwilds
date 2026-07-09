/**
 * RIMEFELL (World 5) rebuilt to the Phase-3 bar: FULL-HEIGHT three-lane anatomy
 * (ground road / one-way mid lane / sky lane), SMB-1-1 kishotenketsu pacing per
 * level, a secret per third, one dominating setpiece each. The world's identity
 * is SLIDE — 'I' ice tiles are slippery: momentum carries, stopping takes room,
 * turning is a commitment. Ice is SOLID for reachability (slip is feel, not
 * reach); the three lanes are iced terraces stacked deep, gaps only speed
 * crosses. The gimmick escalates 1->4:
 *   5-1 THE LONG SLIDE      — SLIDE taught pure.
 *   5-2 THE FROSTFANG SPIRES — ICE CLIMB (slick caps up a chasm).
 *   5-3 THE FROZEN MERE     — FRAGILE ICE crust over a swim gallery.
 *   5-4 THE WHITEOUT ROAD   — combine SLIDE + VENTS; THE SHEAR; the exam.
 * Below the map is OPEN VOID: any pit carved to H-1 is bottomless and LETHAL.
 * Water regions keep a solid floor row beneath (carve to <=H-2), never H-1.
 * Movement law: jump 4 up / 6 across (3 across when climbing >2); pits <=5 wide;
 * springs AND water lift 8; a spring's caught ledge must be <=8 rows above the
 * stand cell; carve pits AFTER ground fills. Tokens ('M') AFTER gems.
 * Run: node scripts/buildRimefell.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 5-1 THE LONG SLIDE — SLIDE taught safe. Three lanes stacked full height: an
// iced GROUND ROAD with lethal gaps momentum carries you over, a broken MID
// terrace of one-ways over it, and a SKY LANE of frost pads over THAT. Springs
// on the ice feed the upper lanes; the frozen cellar hides the keeper's lantern.
// ---------------------------------------------------------------------------
function longSlide() {
  const W = 240, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD: snowfield -> the long iced run -> runout -> beacon rise --
  c.ground(1, 40, FLOOR);            // walk-in on honest snow
  c.ground(41, 72, 34);              // the teach pond rise
  c.ground(73, 150, 34);            // THE LONG SLIDE (iced, gapped)
  c.ground(151, 182, FLOOR);        // the runout
  c.ground(183, 214, 34);           // the bench
  c.ground(215, 238, 32);           // beacon rise

  // walk-in gems + first voles
  c.gems(8, 35, 4, 2);
  c.gems(24, 35, 3, 2);
  c.onFloor(14, 'E');
  c.set(28, 35, 'B');
  c.onFloor(33, 'E');

  // ---- the teach pond: a short safe ice patch — feel the coast, no gap -------
  c.run(48, 34, 18, 'I');           // ice caps the rise
  c.gems(50, 32, 3, 1);
  c.gems(58, 32, 3, 1);
  c.onFloor(56, 'S');               // pond spring -> the mid terrace on-ramp
  c.set(68, 33, 'T');               // a pika at the far lip

  // ---- THE LONG SLIDE (ground lane, y33 ice): two LETHAL gaps momentum crosses
  c.run(73, 33, 78, 'I');           // ice replaces the whole run's surface
  c.carve(96, 34, 100, H - 1);      // gap I (5 wide) — bottomless void
  c.carve(126, 34, 130, H - 1);     // gap II (5 wide)
  c.gemArc(95, 31, 6);              // flight lines over each gap
  c.gemArc(125, 31, 6);
  c.gems(80, 31, 3, 1);             // running breadcrumbs on the ice
  c.gems(110, 31, 3, 1);
  c.gems(140, 31, 3, 1);
  c.run(146, 33, 3, '^');           // icicles where a botched stop slides you in
  c.gemArc(145, 30, 5);

  // ---- MID TERRACE (one-ways, y26-28): a broken road over the slide ----------
  c.oneway(60, 27, 6);              // pond spring x56 catches here
  c.oneway(72, 26, 6);
  c.oneway(84, 27, 6);
  c.oneway(96, 26, 6);              // spans the ground gap I
  c.oneway(108, 27, 6);
  c.oneway(120, 26, 6);
  c.oneway(132, 27, 6);             // spans ground gap II
  c.oneway(144, 26, 5);             // last mid pad down to the runout
  c.gems(74, 24, 3, 1);
  c.gems(110, 24, 3, 1);
  c.set(98, 25, 'M');               // TOKEN — nerve: the mid pad over gap I
  c.set(96, 25, '*');
  c.set(100, 25, '*');

  // ---- SKY LANE (frost pads, y18): a second spring ON the mid road feeds it ---
  c.set(84, 26, 'S');               // mid-road spring -> the sky lane
  c.oneway(87, 18, 3);
  c.oneway(95, 18, 3);
  c.oneway(103, 18, 3);
  c.oneway(111, 18, 3);
  c.oneway(119, 18, 3);
  c.oneway(127, 18, 5);             // the sky lane's landing porch
  for (let i = 0; i < 6; i++) c.set(88 + i * 8, 16, '*'); // the high line
  c.set(130, 17, 'M');              // TOKEN — mastery: the sky lane's far end
  c.gems(134, 20, 3, 2);            // glide-off breadcrumbs down to the runout

  // frost owls patrol the open slide air (between the lanes)
  c.set(104, 22, 'O');
  c.set(122, 23, 'O');

  // ---- runout: breathe, the checkpoint ---------------------------------------
  c.onFloor(158, 'K');
  c.set(162, 35, 'B');
  c.gems(166, 34, 3, 2);
  c.set(174, FLOOR - 1, 'T');

  // ---- THE FROZEN CELLAR: fragile-ice lid on the bench, pound through it ------
  c.run(190, 34, 2, 'C');           // fragile plate IS the bench floor here
  c.carve(190, 35, 191, 35);        // the throat
  c.carve(187, 36, 194, 39);        // the cellar room
  c.set(192, 38, 'M');              // TOKEN — pound: the cellar secret
  c.set(188, 38, 'L');              // the keeper's lantern glows under the frost
  c.gems(189, 38, 2, 2);
  c.set(191, 38, 'B');
  c.set(193, 39, 'S');              // spring back out through the lid
  c.onFloor(200, 'A');              // a hailstone rolls the bench
  c.set(206, 33, 'B');

  // ---- beacon rise: the ice pillar (slick skill climb) -----------------------
  c.rect(224, 28, 225, 31, 'I');    // pure-ice pillar — jump its slick cap
  c.oneway(222, 27, 4);
  c.gems(216, 30, 3, 2);
  c.set(224, 26, 'M');              // TOKEN — glide/skill: onto the ice cap
  c.gems(210, 32, 2, 2);
  c.onFloor(232, 'F');
  c.onFloor(228, 'E');

  c.onFloor(6, 'P');

  return {
    name: 'The Long Slide', theme: 'rimefell', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-1: "The Long Slide" (240×42, Phase-3 rebuild)
CONCEPT  SLIDE, taught safe. Three lanes full height — an iced ground road with
         lethal gaps momentum carries you over, a broken mid terrace over it,
         and a sky lane of frost pads over THAT.
SETPIECE THE LONG SLIDE (x73-150): the iced ground run, two bottomless gaps,
         with the mid one-ways and the sky pads stacked above the whole stretch.
         Pond spring x56 feeds the mid road; mid spring x84 feeds the sky.
PACING   snow walk-in -> the safe teach pond -> the long slide weave (three
         lanes) -> runout checkpoint -> the frozen cellar -> beacon rise.
ROUTES   low: the iced ground road (lethal gaps, icicles). mid: the one-way
         terrace. high: the sky frost-pad line (fast, rich). secret: pound the
         fragile lid at x190 into the frozen cellar (keeper's lantern).
TOKENS   mid pad over gap I (x98, nerve) / sky lane end (x130, mastery) /
         frozen cellar (x192, pound) / ice-pillar cap (x224, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 5-2 THE FROSTFANG SPIRES — ICE CLIMB. The world tilts up: ice-capped spires
// cross a chasm (every slick cap wants to carry you off the far edge), a mid
// gallery of one-ways is slung between them, and a sky ridge of frost pads runs
// over the top. The chasm floor is a LETHAL void the caps arch across.
// ---------------------------------------------------------------------------
function frostfangSpires() {
  const W = 232, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain ----------------------------------------------------------------
  c.ground(1, 40, FLOOR);           // walk-in
  c.ground(41, 64, 37);             // the launch bench (chasm on-ramp)
  c.ground(65, 130, FLOOR);         // the CHASM span (its floor torn to void)
  c.ground(131, 160, 34);           // mid mesa (checkpoint)
  c.ground(161, 192, 30);           // the high field (iced)
  c.ground(193, 230, 34);           // beacon field

  // the chasm floor is a LETHAL void — the spire caps / gallery cross it
  c.carve(72, FLOOR, 124, H - 1);

  // walk-in + bench, a lethal starter gap to set the tone
  c.gems(8, 39, 4, 2);
  c.carve(26, FLOOR, 29, H - 1); c.gemArc(25, 37, 5);
  c.onFloor(14, 'E');
  c.set(34, 39, 'B');
  c.gems(46, 34, 3, 2);
  c.onFloor(52, 'T');
  c.onFloor(60, 'E');
  c.onFloor(44, 'S');               // bench spring -> the sky ridge on-ramp

  // ---- MID GALLERY (one-ways, y36): the connective crossing over the void -----
  // pads <=6 apart so the flat weave is walkable; caps rise off it, sky over it
  c.oneway(68, 36, 4);              // steps off the bench (y37) onto the gallery
  c.oneway(76, 36, 4);
  c.oneway(84, 36, 4);
  c.oneway(92, 36, 4);
  c.oneway(100, 36, 4);
  c.oneway(108, 36, 4);
  c.oneway(116, 36, 4);
  c.oneway(124, 36, 6);             // the gallery's landing shelf onto the mesa
  c.gems(70, 34, 2, 1);
  c.gems(104, 34, 2, 1);

  // ---- THE FROSTFANG SPIRES (high lane): slick ice caps rising off the gallery
  // each cap is <=4 rows over a gallery pad, reachable by a jump from below
  const spire = (x, capY) => {
    c.rect(x, capY + 1, x + 1, 35, 'X');    // the stone stem hangs to the gallery
    c.rect(x - 1, capY, x + 2, capY, 'I');   // the slick ice cap (4 wide)
  };
  spire(77, 33);
  spire(85, 32);
  spire(93, 33);
  spire(101, 32);
  spire(109, 33);
  spire(117, 32);
  // gallery token placed AFTER the spires so no stem clobbers it (x89 = a gap)
  c.set(89, 35, 'M');               // TOKEN — nerve: the gallery over the void
  c.set(88, 35, '*');
  c.set(90, 35, '*');
  c.gems(78, 31, 2, 1);
  c.gems(94, 31, 2, 1);
  c.gems(110, 31, 2, 1);
  c.set(101, 30, 'M');              // TOKEN — mastery: atop the tallest cap
  c.set(100, 30, '*');
  c.set(102, 30, '*');

  // ---- SKY RIDGE (frost pads, y22): the bench spring feeds a high run ----------
  c.oneway(47, 22, 3);              // spring x44 catches here
  c.oneway(55, 22, 3);
  c.oneway(64, 22, 3);
  c.oneway(73, 22, 3);
  c.oneway(82, 22, 3);
  c.oneway(91, 22, 3);
  c.oneway(100, 22, 5);             // the ridge's landing porch over the spires
  for (let i = 0; i < 6; i++) c.set(48 + i * 9, 20, '*'); // the high line
  c.set(103, 21, 'M');              // TOKEN — glide: the sky ridge's end
  c.gems(107, 24, 3, 2);            // glide-off breadcrumbs toward the mesa
  // owls circle the chasm air between the lanes
  c.set(88, 27, 'O');
  c.set(112, 27, 'O');

  // ---- mid mesa: checkpoint + the frozen cellar ------------------------------
  c.onFloor(138, 'K');
  c.set(142, 33, 'B');
  c.gems(146, 32, 3, 2);
  c.run(152, 34, 2, 'C');           // fragile-ice lid in the mesa floor
  c.carve(152, 35, 153, 35);
  c.carve(149, 36, 156, 39);        // the cellar room
  c.set(154, 38, 'M');              // TOKEN — pound: the mesa cellar
  c.gems(150, 38, 2, 2);
  c.set(155, 39, 'S');              // spring out through the lid

  // ---- the high field: an iced run with a momentum pit, owls above -----------
  c.run(161, 30, 32, 'I');          // the field is ice end to end
  c.carve(174, 30, 178, H - 1);     // LETHAL pit (5) — momentum crosses it
  c.gemArc(173, 27, 6);
  c.gems(164, 28, 3, 1);
  c.gems(184, 28, 3, 1);
  c.set(170, 24, 'O');
  c.set(186, 22, 'O');

  // ---- beacon field ----------------------------------------------------------
  c.carve(196, 34, 199, H - 1); c.gemArc(195, 32, 5); // one last lethal bite
  c.gems(204, 32, 3, 2);
  c.onFloor(210, 'A');
  c.set(216, 33, 'B');
  c.onFloor(224, 'F');
  c.onFloor(220, 'T');

  c.onFloor(6, 'P');

  return {
    name: 'The Frostfang Spires', theme: 'rimefell', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-2: "The Frostfang Spires" (232×46, Phase-3 rebuild)
CONCEPT  ICE CLIMB. The world tilts up onto slick footing — six ice-capped
         spires cross a killing chasm, every cap wanting to slide you off.
SETPIECE THE FROSTFANG CROSSING (x72-124): the spire line over a LETHAL void,
         a mid gallery of one-ways slung between the stems, and a sky ridge of
         frost pads running over the top — three lanes across the whole chasm.
PACING   walk-in (lethal starter gap) -> launch bench + sky-ridge spring -> the
         three-lane crossing -> mesa checkpoint + cellar -> iced high field with
         a momentum pit -> beacon field.
ROUTES   high: cap-to-cap over the void. mid: the slung gallery. sky: the frost
         ridge (spring x44). secret: pound the mesa lid at x152 into the cellar.
TOKENS   tallest cap (x101, mastery) / gallery over the void (x114, nerve) /
         sky ridge end (x103, glide) / mesa cellar (x154, pound).`,
  };
}

// ---------------------------------------------------------------------------
// 5-3 THE FROZEN MERE — FRAGILE ICE + SWIM. The lake wears a fragile crust:
// walk it whole, pound through it anywhere, and swim the gallery beneath. The
// WATER is the mid lane; a rafter road of one-ways runs above the crust, and a
// sky pad-line over that. Frostbloom waits on the west shore.
// ---------------------------------------------------------------------------
function frozenMere() {
  const W = 236, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 234, FLOOR);
  // lethal DRY gaps on the shores (the mere itself is a safe swim — never here)
  c.carve(18, FLOOR, 21, H - 1); c.gemArc(17, 38, 5);
  c.carve(206, FLOOR, 209, H - 1); c.gemArc(205, 38, 5);

  // ---- west shore ------------------------------------------------------------
  c.onFloor(6, 'P');
  c.gems(10, 39, 4, 2);
  c.onFloor(14, 'E');
  c.set(26, 39, 'z');               // FROSTBLOOM — the world's own power on the shore
  c.onFloor(30, 'T');

  // ---- THE FROZEN MERE (x36..x150): fragile crust over a swim gallery --------
  // WATER: carve to H-2 max (keep row FLOOR+3 solid) so nobody sinks to the void
  c.carve(36, 41, 150, 42);         // the water body under the surface row
  c.addWater(36, 41, 150, 42);
  // the crust (fragile ice IS the surface), with breathing holes + two islands
  c.run(36, FLOOR, 30, 'C');        // crust I
  c.carve(64, FLOOR, 66, FLOOR);    // breathing hole I (swim up / drop through)
  c.run(67, FLOOR, 25, 'C');        // crust II
  // island I: x92..x96 keeps its solid '#' (a place to surface and stand)
  c.run(97, FLOOR, 20, 'C');        // crust III
  c.carve(117, FLOOR, 119, FLOOR);  // breathing hole II
  c.run(120, FLOOR, 24, 'C');       // crust IV
  // island II: x144..x150 stays solid ground (the checkpoint isle)

  // the swim gallery beneath — THE DROWNED LANTERNS (mid lane = the water)
  c.gems(40, 41, 3, 2);
  c.gems(56, 41, 3, 1);
  c.gems(84, 41, 3, 2);
  c.gems(104, 41, 3, 1);
  c.gems(136, 41, 3, 2);
  c.set(70, 41, 'M');               // TOKEN — nerve: swim deep under crust II
  c.set(126, 41, 'M');              // TOKEN — nerve: swim past breathing hole II
  // over the crust: the walk, marked with gems
  c.gems(48, 38, 3, 1);
  c.gems(100, 38, 3, 1);
  c.gems(130, 38, 3, 1);
  c.set(94, 39, 'B');               // island I berry
  c.onFloor(146, 'K');              // checkpoint on island II

  // ---- RAFTER ROAD (one-ways over the crust, y32): the dry high lane ----------
  c.oneway(40, 32, 5);
  c.oneway(52, 32, 5);
  c.oneway(64, 32, 5);              // over breathing hole I
  c.oneway(76, 32, 5);
  c.oneway(88, 32, 5);
  c.oneway(100, 32, 5);
  c.oneway(112, 32, 5);             // over breathing hole II
  c.oneway(124, 32, 5);
  c.oneway(136, 32, 5);
  c.gems(42, 30, 3, 1);
  c.gems(90, 30, 3, 1);
  c.gems(126, 30, 3, 1);
  c.onFloor(58, 'S');               // shore-edge spring feeds the rafters/sky
  c.set(102, 31, 'M');              // TOKEN — mastery: on the rafter road
  c.set(100, 31, '*');
  c.set(104, 31, '*');

  // ---- SKY LANE (frost pads, y24): the spring throws you over the rafters -----
  c.oneway(60, 24, 3);              // spring x58 catches here
  c.oneway(68, 24, 3);
  c.oneway(76, 24, 3);
  c.oneway(84, 24, 3);
  c.oneway(92, 24, 5);             // sky landing porch over island I
  for (let i = 0; i < 4; i++) c.set(61 + i * 8, 22, '*');
  c.set(94, 23, 'M');               // TOKEN — glide: the sky line's end
  c.gems(98, 26, 3, 2);            // glide-off toward the rafters
  c.set(74, 28, 'O');
  c.set(112, 27, 'O');

  // ---- east shore: pika benches + the icicle stretch --------------------------
  c.gems(156, 39, 3, 2);
  c.onFloor(162, 'T');
  c.run(172, 39, 4, '^');           // icicle bed on the ground road
  c.oneway(171, 36, 6);             // the span over it (mid lane)
  c.gems(172, 34, 2, 1);
  c.onFloor(182, 'T');
  c.onFloor(190, 'A');
  c.set(198, 39, 'B');

  // ---- beacon knoll + ice-pillar perch (a slick optional flourish, no token) --
  c.rect(214, 35, 215, 38, 'I');    // pure-ice perch pillar
  c.oneway(213, 34, 4);
  c.gems(220, 38, 3, 2);
  c.set(214, 33, 'B');              // a berry rewards the slick climb
  c.gems(228, 38, 2, 2);
  c.onFloor(224, 'E');
  c.onFloor(230, 'F');

  return {
    name: 'The Frozen Mere', theme: 'rimefell', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-3: "The Frozen Mere" (236×46, Phase-3 rebuild)
CONCEPT  FRAGILE ICE + SWIM. The lake wears a crust — walk it whole, pound
         through it anywhere, swim the gallery beneath. The WATER is the mid
         lane. Frostbloom waits on the west shore.
SETPIECE THE DROWNED LANTERNS (x36-150): the under-crust swim gallery with two
         deep tokens and gem veins, a dry rafter road of one-ways over the
         crust, and a sky pad-line over THAT — three lanes across the mere.
PACING   west shore (frostbloom) -> the mere (crust walk / swim gallery / rafter
         road / sky line) -> island checkpoint -> east-shore icicles -> beacon.
ROUTES   low: swim the flooded gallery. mid: walk/rafter the crust. high: the
         sky pad-line (spring x58). breathing holes + islands stitch them.
TOKENS   gallery deep under crust II (x70, nerve) / gallery past hole II (x126,
         nerve) / rafter road (x102, mastery) / sky line end (x94, glide).`,
  };
}

// ---------------------------------------------------------------------------
// 5-4 THE WHITEOUT ROAD — the exam: SLIDE combined with VENTS. Geyser springs
// punch up through iced shafts to fling you between the lanes; THE SHEAR is one
// long slick ice beam over the wide dark. All three lanes at once, at pressure,
// ending at the pass gate below the Shiverback's den.
// ---------------------------------------------------------------------------
function whiteoutRoad() {
  const W = 244, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD -----------------------------------------------------------
  c.ground(1, 206, FLOOR);
  c.ground(207, 242, 34);           // the pass shelf

  // opening: hailstone convoy on iced flats
  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.run(16, FLOOR, 30, 'I');        // iced from the first steps
  c.onFloor(22, 'A');
  c.onFloor(32, 'A');
  c.set(40, 37, 'B');
  c.gems(28, 36, 3, 1);
  c.onFloor(44, 'S');               // first VENT (spring) -> the mid lane

  // ---- the slide-pit chain (ground): momentum or the void --------------------
  c.run(48, FLOOR, 44, 'I');
  c.carve(56, FLOOR, 60, H - 1);
  c.carve(70, FLOOR, 74, H - 1);
  c.carve(84, FLOOR, 88, H - 1);
  c.gemArc(55, 34, 5);
  c.gemArc(69, 34, 5);
  c.gemArc(83, 34, 5);

  // ---- MID LANE (one-ways, y30): a vented terrace over the slide-pit chain -----
  c.oneway(47, 30, 5);              // vent x44 catches here
  c.oneway(58, 30, 5);              // over ground gap I
  c.oneway(72, 30, 5);              // over ground gap II
  c.oneway(86, 30, 5);              // over ground gap III
  c.oneway(98, 30, 5);
  c.gems(48, 28, 3, 1);
  c.gems(74, 28, 3, 1);
  c.gems(88, 28, 3, 1);
  c.set(60, 29, 'T');               // a pika holds the mid terrace

  // ---- SKY LANE (frost pads, y22): a VENT on the mid terrace flings you up -----
  // the vent stands on a small solid ice pad (not floating over the pit)
  c.rect(85, 29, 87, 29, 'I');      // a solid ice landing the vent sits on
  c.set(86, 28, 'S');               // mid VENT -> the sky lane
  c.oneway(89, 22, 3);
  c.oneway(97, 22, 3);
  c.oneway(105, 22, 3);
  c.oneway(113, 22, 5);            // sky landing porch
  for (let i = 0; i < 4; i++) c.set(90 + i * 8, 20, '*');
  c.set(116, 21, 'M');              // TOKEN — glide: the sky line's end
  c.gems(120, 24, 3, 2);           // glide-off toward the checkpoint mesa
  c.set(66, 26, 'O');
  c.set(94, 25, 'O');

  // ---- THE SHEAR: one long slick ice beam over the wide dark ------------------
  c.carve(126, FLOOR, 150, H - 1);  // the wide LETHAL pit (25)
  c.rect(128, 36, 148, 36, 'I');    // the beam — slick, one tile, no rails
  c.gems(132, 34, 3, 1);
  c.gems(142, 34, 3, 1);
  c.set(138, 33, 'M');              // TOKEN — nerve: the beam, dead center
  c.set(136, 33, '*');
  c.set(140, 33, '*');
  c.set(133, 27, 'O');              // owls dive the crossing
  c.set(145, 25, 'O');
  c.onFloor(154, 'K');              // checkpoint past the Shear
  c.gems(158, 36, 3, 2);

  // ---- pika ambush benches (mid, stepping up) --------------------------------
  c.oneway(162, 33, 3);
  c.oneway(168, 29, 3);
  c.oneway(174, 25, 3);
  c.set(169, 28, 'T');
  c.set(175, 24, 'T');
  c.gems(163, 31, 2, 2);
  c.gems(175, 23, 2, 2);
  c.set(180, 37, 'B');

  // ---- the key grotto: under a fragile plate, the pass key -------------------
  c.run(186, FLOOR, 2, 'C');        // fragile-ice plate is the road here
  c.carve(186, 39, 187, 39);
  c.carve(183, 40, 190, 42);        // the grotto (floor row 43 stays solid)
  c.set(184, 41, 'j');              // THE PASS KEY
  c.set(188, 41, 'M');              // TOKEN — pound: the grotto secret
  c.gems(185, 41, 2, 1);
  c.set(189, 42, 'S');              // spring back out
  c.gemArc(196, 36, 5);
  c.onFloor(200, 'A');
  c.run(202, 37, 3, '^');           // icicle bed before the gate

  // ---- THE PASS GATE ---------------------------------------------------------
  c.rect(210, 22, 213, 29, 'X');    // the gate arch on the shelf
  c.rect(211, 30, 211, 33, 'D');    // its locked door (openable for BFS)
  c.oneway(209, 21, 6);             // the parapet
  c.gems(216, 32, 3, 2);
  c.set(214, 20, 'M');              // TOKEN — skill: the gate parapet
  c.onFloor(222, 'T');
  c.set(228, 33, 'B');
  c.onFloor(234, 'F');
  c.set(218, 26, 'O');

  return {
    name: 'The Whiteout Road', theme: 'rimefell', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Rimefell 5-4: "The Whiteout Road" (244×44, Phase-3 rebuild)
CONCEPT  THE EXAM — SLIDE combined with VENTS. Geyser springs punch up through
         iced shafts to fling you between all three lanes, at pressure.
SETPIECE THE SHEAR (x126-150): one long slick ice beam over the wide killing
         dark, owls diving the crossing, a token dead center where there is no
         room to stop.
PACING   hailstone convoy on ice -> slide-pit chain (three lanes, vents stitch
         them) -> THE SHEAR -> checkpoint -> pika ambush benches -> key grotto
         -> the pass gate + parapet.
ROUTES   low: iced ground road (slide-pit chain, the Shear beam). mid: the
         vented one-way terrace. high: the sky frost-pad line (vent x86).
         secret: pound the fragile plate at x186 for the pass key + grotto token.
TOKENS   sky line end (x116, glide) / the Shear beam (x138, nerve) / key grotto
         (x188, pound) / gate parapet (x214, skill).`,
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
