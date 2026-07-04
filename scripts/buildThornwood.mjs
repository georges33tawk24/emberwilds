/**
 * Thornwood rebuilt to the Phase-2 bar (MISSION.md 2A): ≥220×40, three-route
 * anatomy (safe low road / fast high road / secret roads), a secret room per
 * level, intro→teach→develop→twist→test pacing, distinct silhouettes.
 * Run: node scripts/buildThornwood.mjs   (validates, then writes the .ts files)
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 1-1 SUNROOT HOLLOW — the gentle meadow that teaches everything
//   low road: rolling ground, beetles/toads, gentle pits
//   high road: spring onto a one-way canopy that runs half the level
//   secrets:  pound-through cellar under the mid meadow; nook behind the beacon
// ---------------------------------------------------------------------------
function sunrootHollow() {
  const W = 224, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);

  // borders
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain silhouette (left to right) --------------------------------
  c.ground(1, 111, FLOOR);          // intro meadow
  c.ground(112, 118, 34);           // hill: first step
  c.ground(119, 128, 31);           // hill crest (checkpoint lives here)
  c.ground(129, 136, 34);           // hill: down step
  c.ground(137, 146, 38);           // shaded dell
  c.ground(147, 222, FLOOR);        // test stretch to the beacon

  // pits (carved AFTER the fills)
  c.carve(31, FLOOR, 34, H - 1);    // first gap — 4 wide, safe teach
  c.carve(84, FLOOR, 88, H - 1);    // meadow gap — 5 wide, full jump
  c.carve(150, FLOOR, 154, H - 1);  // test gap — 5 wide

  // ---- the canopy (fast high road) ---------------------------------------
  c.onFloor(62, 'S');               // spring on-ramp
  c.oneway(60, 28, 5);
  c.oneway(67, 24, 5);
  c.oneway(74, 20, 6);
  // canopy run — gentle rhythm, small rises and dips
  c.oneway(84, 20, 5);
  c.oneway(93, 18, 5);
  c.oneway(102, 20, 6);
  c.oneway(112, 18, 5);
  c.oneway(121, 20, 5);
  c.oneway(130, 18, 5);
  c.oneway(139, 20, 6);
  // canopy prize: token floating over the last leaves
  c.set(142, 17, 'M');
  // canopy gems
  c.gems(75, 19, 3, 2);
  c.gems(94, 17, 3, 2);
  c.gems(113, 17, 3, 2);
  c.gems(131, 17, 3, 2);

  // ---- secret cellar (pound the cracked floor) ---------------------------
  c.carve(96, 38, 108, 40);         // the room
  c.run(100, FLOOR, 2, 'C');        // cracked lid in the floor
  c.carve(100, 37, 101, 37);        // drop shaft under the lid
  c.set(104, 39, 'M');              // token in the dark
  c.gems(97, 39, 3, 1);
  c.gems(105, 40, 3, 1);
  c.set(98, 40, 'B');
  c.set(107, 39, 'S');              // spring back out (needs the lid broken)

  // ---- ground road dressing ----------------------------------------------
  c.gems(14, 35, 5, 2);             // first steps teach-line
  c.set(28, 35, 'B');
  c.gemArc(31, 34, 4);              // over the first gap
  c.gemArc(84, 34, 6);              // over the meadow gap
  c.gemArc(150, 34, 6);             // over the test gap
  c.oneway(158, 31, 4);             // refuge ledges in the test stretch
  c.gems(158, 30, 2, 2);
  c.oneway(170, 30, 4);
  c.gems(170, 29, 2, 2);

  // spikes with a stone hop mid test stretch
  c.run(160, 35, 4, '^');
  c.run(176, 35, 3, '^');

  // skill-gated token: high slab, no spring — stomp-bounce or glide
  c.run(186, 28, 3, 'X');
  c.set(187, 27, 'M');

  // hill dressing
  c.gems(120, 30, 4, 2);
  c.set(126, 30, 'B');

  // ---- finale: celebration approach + beacon + hidden nook ----------------
  c.gemArc(196, 34, 5);
  c.gemArc(202, 34, 5);
  c.set(206, 35, 'B');
  c.onFloor(212, 'F');
  // the nook: a wall-jump secret — kick up the stone wall behind the beacon
  c.rect(216, 32, 216, 35, 'X');
  c.set(219, 35, 'M');
  c.gems(218, 34, 2, 2);
  c.set(221, 35, 'S');              // bounce back over the wall

  // ---- cast ----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(46, 'E');               // the first beetle — stomp teach
  c.onFloor(72, 'T');
  c.onFloor(92, 'E');
  c.onFloor(120, 'T');              // hill toad
  c.onFloor(124, 'K');              // checkpoint on the crest
  c.onFloor(141, 'E');              // dell beetle
  c.onFloor(168, 'E');
  c.onFloor(172, 'T');
  c.onFloor(182, 'E');

  return {
    name: 'Sunroot Hollow', theme: 'thornwood', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Thornwood 1-1: "Sunroot Hollow" (224×42, Phase-2 rebuild)
PACING  intro meadow (walk/jump/gems, x1-30) -> first gap -> stomp teach (x46)
        -> canopy on-ramp spring (x62) -> hill + checkpoint crest (x119-128)
        -> dell -> test stretch (pits, spikes, beetle pack) -> celebration -> F.
ROUTES  low: rolling ground road. high: spring at x62 onto a one-way canopy
        running x60-145 (token at its end). secret: pound the cracked lid at
        x100 into the cellar (token, hoard, spring out); leaf-hop the stone
        wall behind the beacon for the last token nook.
TOKENS  canopy end (x142) / cellar (x104) / skill slab (x187, no spring —
        stomp-bounce or glide) / beacon nook (x219).`,
  };
}

// ---------------------------------------------------------------------------
// 1-2 BRAMBLERISE — the climb: terraces up, ridge run, hollow-trunk secret,
//   drop-through descent. Owls patrol the ridge; the burr teaches "don't stomp".
// ---------------------------------------------------------------------------
function bramblerise() {
  const W = 228, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);

  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: valley -> terraces -> ridge -> descent -> valley ----------
  c.ground(1, 34, FLOOR);           // starting valley
  c.ground(35, 46, 35);             // terrace 1
  c.ground(47, 58, 32);             // terrace 2
  c.ground(59, 70, 29);             // terrace 3
  c.ground(71, 128, 26);            // the ridge road
  c.ground(129, 140, 30);           // descent step 1
  c.ground(141, 152, 34);           // descent step 2
  c.ground(153, 226, FLOOR);        // long valley to the beacon

  // ridge gaps — commit to the jumps
  c.carve(88, 26, 92, H - 1);       // 5 wide
  c.carve(106, 26, 110, H - 1);     // 5 wide

  // hollow trunk (secret): a climbable stump; pound its cracked cap to drop
  // down the shaft into the root chamber
  c.rect(118, 23, 124, 25, 'X');    // the stump on the ridge (walk over it)
  c.run(120, 23, 3, 'C');           // cracked cap set into its top
  c.carve(120, 24, 122, 25);        // hollow neck under the cap
  c.carve(120, 26, 122, 40);        // the shaft through the ridge
  c.carve(118, 36, 124, 40);        // the root chamber
  c.set(121, 39, 'M');              // token in the roots
  c.gems(118, 38, 2, 2);
  c.gems(123, 38, 2, 2);
  c.set(119, 40, 'B');
  c.set(123, 40, 'S');              // spring: chamber -> mid-shaft ledge
  c.oneway(118, 32, 2);             // mid-shaft leaf
  c.set(119, 31, 'S');              // second spring: ledge -> out the neck

  // fast road: spring chain skipping the terraces
  c.onFloor(30, 'S');
  c.oneway(28, 31, 4);              // spring -> leaf
  c.oneway(34, 27, 4);              // leaf -> terrace-3 height
  c.gems(29, 30, 2, 2);
  c.gems(35, 26, 2, 2);

  // terrace dressing (safe road)
  c.gems(38, 34, 3, 2);
  c.gems(50, 31, 3, 2);
  c.gems(62, 28, 3, 2);
  c.set(44, 34, 'B');

  // ridge road dressing
  c.gems(76, 25, 4, 2);
  c.gemArc(88, 24, 5);              // over ridge gap 1
  c.gemArc(106, 24, 6);             // over ridge gap 2
  c.gems(98, 25, 3, 2);
  c.onFloor(100, 'K');              // checkpoint mid-ridge

  // under-ridge alcove: drift INTO the left wall of ridge-gap 2 as you fall —
  // a leaf floor catches you; the spring fires you back to the road
  c.carve(103, 31, 105, 33);
  c.oneway(103, 34, 3);
  c.set(104, 32, 'M');
  c.set(105, 33, 'S');

  // ridge-end prize
  c.set(126, 23, 'M');

  // skill token: slab high above the ridge — no help, earn it
  c.run(148, 22, 3, 'X');
  c.set(149, 21, 'M');

  // descent: drop-through leaves teach down+jump
  c.oneway(132, 28, 4);
  c.oneway(144, 32, 4);
  c.gems(132, 27, 2, 2);
  c.gems(144, 31, 2, 2);

  // valley run: spikes, the burr lesson, arcs
  c.run(168, 37, 3, '^');
  c.gemArc(174, 36, 5);
  c.carve(184, FLOOR, 188, H - 1);  // valley gap — 5 wide
  c.gemArc(184, 36, 5);
  c.run(198, 37, 4, '^');
  c.set(206, 37, 'B');
  c.gemArc(208, 36, 5);

  // beacon on a gentle rise
  c.ground(214, 226, 35);
  c.onFloor(218, 'F');

  // ---- cast ---------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(20, 'E');
  c.onFloor(40, 'T');               // terrace toad
  c.onFloor(54, 'E');
  c.onFloor(66, 'T');
  c.set(82, 20, 'O');               // ridge owls (they fly — no support needed)
  c.set(114, 20, 'O');
  c.onFloor(134, 'T');              // descent landings
  c.onFloor(146, 'E');
  c.onFloor(162, 'E');
  c.onFloor(180, 'A');              // the burr: "do not stomp me"
  c.onFloor(196, 'E');
  c.onFloor(210, 'T');

  return {
    name: 'Bramblerise', theme: 'thornwood', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Thornwood 1-2: "Bramblerise" (228×44, Phase-2 rebuild)
PACING  valley intro -> terraces teach climbing -> ridge road with commit gaps
        and owls -> hollow-trunk secret -> drop-through descent -> burr lesson
        -> valley gauntlet -> beacon rise.
ROUTES  safe: terrace switchbacks. fast: spring chain at x30 straight to the
        heights. secrets: pound the trunk cap (x120) down the hollow shaft to
        the root chamber; drop off the ridge south face at x96-100 into the
        under-ridge alcove.
TOKENS  root chamber (x121) / under-ridge alcove (x98) / skill slab above the
        ridge (x149, glide or stomp-bounce) / plus the alcove spring returns
        you to the road. 4th token: see slab + alcove + chamber + ridge-end.`,
  };
}

// ---------------------------------------------------------------------------
// 1-3 EMBERFALL RIDGE — dusk momentum test: pit rhythm, spike gauntlets,
//   ridge high road vs valley floor, every enemy, watchtower finale.
// ---------------------------------------------------------------------------
function emberfallRidge() {
  const W = 232, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);

  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain ------------------------------------------------------------
  c.ground(1, 226, FLOOR);          // one long valley floor...
  c.ground(1, 20, 36);              // ...with a raised trailhead
  c.ground(60, 68, 35);             // mid rise
  c.ground(140, 150, 35);           // second rise
  c.ground(202, 205, 36);           // step up to the knoll
  c.ground(206, 226, 33);           // the watchtower knoll

  // pit rhythm — three in a row, momentum carries you
  c.carve(28, 36, 32, H - 1);       // 5
  c.carve(40, FLOOR, 44, H - 1);    // 5
  c.carve(52, FLOOR, 56, H - 1);    // 5
  // late pits
  c.carve(122, FLOOR, 126, H - 1);  // 5
  c.carve(180, FLOOR, 184, H - 1);  // 5

  // ---- ridge high road (one-way leaves above the valley) ------------------
  c.oneway(70, 26, 5);
  c.oneway(79, 24, 5);
  c.oneway(88, 26, 5);
  c.oneway(97, 23, 5);
  c.oneway(106, 25, 5);
  c.oneway(115, 23, 5);
  c.set(118, 22, 'M');              // ridge-road prize
  c.gems(71, 25, 3, 2);
  c.gems(89, 25, 3, 2);
  c.gems(107, 24, 3, 2);
  // on-ramp to the ridge from the mid rise
  c.oneway(64, 30, 3);

  // ---- spike gauntlet with a hidden cellar under it -----------------------
  c.run(90, 37, 4, '^');
  c.run(98, 37, 4, '^');
  c.oneway(95, 34, 2);              // safe hop between the strips
  c.carve(92, 40, 102, 41);         // the cellar
  c.run(96, FLOOR, 2, 'C');         // cracked lid between the spike strips
  c.carve(96, 39, 97, 39);
  c.set(100, 41, 'M');              // token below the danger
  c.gems(93, 41, 2, 2);
  c.set(94, 41, 'B');
  c.set(101, 41, 'S');

  // pit-rhythm gem arcs
  c.gemArc(28, 34, 5);
  c.gemArc(40, 36, 5);
  c.gemArc(52, 36, 5);
  // token floating over the middle pit — collect it mid-flight
  c.set(42, 33, 'M');

  // checkpoint on the second rise
  c.onFloor(144, 'K');
  c.set(147, 33, 'B');
  c.gems(141, 33, 3, 2);

  // late valley: spikes + arcs + the pack
  c.run(160, 37, 3, '^');
  c.gemArc(166, 36, 5);
  c.gemArc(180, 36, 5);
  c.run(192, 37, 4, '^');
  c.gems(198, 36, 3, 2);
  c.set(202, 36, 'B');

  // ---- the watchtower (finale + last token) --------------------------------
  c.rect(216, 24, 219, 32, 'X');    // stone tower on the knoll
  c.oneway(212, 30, 3);             // rungs up the outside
  c.oneway(212, 26, 3);
  c.oneway(217, 23, 2);             // the top board
  c.set(217, 22, 'M');              // token at the summit
  c.gems(213, 29, 2, 2);
  c.onFloor(209, 'F');              // the beacon at the tower's foot

  // ---- cast ---------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(24, 'E');
  c.onFloor(36, 'T');               // between pits — keep moving
  c.onFloor(63, 'E');
  c.set(76, 20, 'O');               // dusk owls over the ridge
  c.set(102, 19, 'O');
  c.onFloor(112, 'A');              // burr guards the valley under the ridge
  c.onFloor(133, 'E');
  c.onFloor(156, 'T');
  c.onFloor(170, 'E');
  c.onFloor(175, 'A');              // second burr
  c.onFloor(190, 'E');
  c.onFloor(199, 'T');

  return {
    name: 'Emberfall Ridge', theme: 'thornwood', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Thornwood 1-3: "Emberfall Ridge" (232×44, Phase-2 rebuild)
PACING  raised trailhead -> pit rhythm x3 (momentum!) -> mid rise -> spike
        gauntlet (cellar hidden beneath) -> ridge high road with owls ->
        checkpoint rise -> late gauntlet with burrs -> watchtower finale.
ROUTES  low: the valley floor and its pits/spikes. high: one-way ridge road
        x70-120 (token at its end). secrets: pound the lid BETWEEN the spike
        strips (x96) into the cellar; climb the watchtower rungs past the
        beacon for the summit token.
TOKENS  over the middle pit (x42, collect mid-jump) / cellar (x100) /
        ridge end (x118) / watchtower summit (x217).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['thornwood1.ts', sunrootHollow()],
  ['thornwood2.ts', bramblerise()],
  ['thornwood3.ts', emberfallRidge()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
