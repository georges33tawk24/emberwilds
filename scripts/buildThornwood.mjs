/**
 * Thornwood rebuilt to the Phase-3 bar: FULL-HEIGHT three-lane anatomy (ground
 * road / one-way mid lane / sky lane), SMB-1-1 kishotenketsu pacing per level
 * (teach safe -> develop -> twist -> payoff), a secret per third, and one
 * dominating setpiece each. The world's identity is LAYERS — the forest has a
 * ceiling worth reaching, and every level sells a higher lane harder.
 * Movement law: jump 4 up / 6 across (3 across when climbing >2); pits <=5
 * wide; springs lift 8; carve pits AFTER ground fills.
 * Run: node scripts/buildThornwood.mjs   (validates, then writes the .ts files)
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 1-1 SUNROOT HOLLOW — the game's first two minutes. One idea, taught safely:
// the forest is layered. Ground road for walkers, a broken canopy road above
// it, and a sky road of small pads above THAT — each lane faster and richer.
// ---------------------------------------------------------------------------
function sunrootHollow() {
  const W = 228, H = 42;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: meadow -> canopy underlands -> crest -> gauntlet -> stairs --
  c.ground(1, 38, 34);              // intro meadow
  c.ground(39, 58, 33);             // gentle rise to the canopy eaves
  c.ground(59, 127, 34);            // the canopy underlands
  c.ground(128, 158, 32);           // checkpoint crest
  c.ground(159, 196, 34);           // the twist gauntlet
  c.ground(197, 202, 32);           // celebration staircase, step I
  c.ground(203, 208, 30);           //   step II
  c.ground(209, 226, 28);           // beacon court

  // ---- beat 1, INTRO (x1-38): walk, one jump, one stomp ---------------------
  c.gems(8, 32, 5, 2);              // the walk-in gem line
  c.carve(30, 34, 33, H - 1);       // first gap — 4 wide, forgiving
  c.gemArc(29, 32, 6);              // the arc shows the jump
  c.set(36, 33, 'B');               // a berry right after — kindness early

  // ---- beat 2, DEVELOP (x39-58): the spring lesson ---------------------------
  c.gems(44, 31, 3, 2);
  c.onFloor(56, 'S');               // the canopy on-ramp: a ledge no jump reaches
  c.gemArc(53, 28, 5);              // its flight line

  // ---- beat 3, THE SUNROOT CANOPY (x59-148) — the setpiece -------------------
  // ground lane: two pits and a spike strip, each with a marked flight
  c.carve(84, 34, 88, H - 1);       // pit I
  c.carve(112, 34, 116, H - 1);     // pit II
  c.gemArc(83, 31, 6);
  c.gemArc(111, 31, 6);
  c.run(124, 33, 4, '^');           // spike strip under the canopy's end
  c.gemArc(123, 30, 6);
  // canopy lane (y26): a broken one-way road the spring feeds
  c.oneway(60, 26, 17);             // x60-76
  c.oneway(82, 26, 17);             // x82-98
  c.oneway(104, 26, 15);            // x104-118
  c.oneway(124, 26, 15);            // x124-138
  c.oneway(144, 26, 5);             // the last hop down to the crest
  c.gems(64, 24, 4, 2);
  c.gems(90, 24, 4, 2);
  c.gems(128, 24, 4, 2);
  // canopy risk spur (y22): a short balcony over pit II, toad-tempted
  c.oneway(109, 22, 5);
  c.set(111, 21, 'M');              // TOKEN — nerve (the spur over the pit)
  c.set(109, 21, '*');
  c.set(113, 21, '*');
  // sky lane (y18): small pads, entered by a second spring ON the canopy
  c.set(72, 25, 'S');               // canopy spring -> the sky road
  c.oneway(75, 18, 3);
  c.oneway(83, 18, 3);
  c.oneway(91, 18, 3);
  c.oneway(99, 18, 3);
  c.oneway(107, 18, 3);
  c.oneway(115, 18, 3);
  c.oneway(123, 18, 3);
  c.oneway(131, 18, 5);             // the sky road's landing porch
  for (let i = 0; i < 7; i++) c.set(76 + i * 8, 16, '*'); // the high line
  c.set(134, 17, 'M');              // TOKEN — mastery (the sky road's end)
  c.gems(138, 20, 3, 2);            // glide-off breadcrumbs down to the crest

  // ---- crest (x128-158): breathe ---------------------------------------------
  c.onFloor(152, 'K');              // the checkpoint
  c.set(155, 31, 'B');
  c.gems(146, 30, 3, 2);

  // ---- beat 4, TWIST (x159-196): everything at once + the cellar -------------
  c.carve(160, 34, 163, H - 1);     // pit (4 wide)
  c.gemArc(159, 31, 6);
  c.run(167, 33, 2, '^');           // spikes pinch the landing
  c.run(182, 33, 3, '^');           // second pinch
  c.gemArc(181, 30, 5);
  c.carve(188, 34, 191, H - 1);     // last pit before the stairs
  c.gemArc(187, 31, 6);
  // the ember cellar — the pound lesson pays out
  c.run(172, 34, 2, 'C');           // cracked lid in the gauntlet floor
  c.carve(172, 35, 173, 35);        // the throat
  c.carve(169, 36, 177, 38);        // the cellar room
  c.set(173, 37, 'M');              // TOKEN — the pound secret
  c.set(171, 36, 'L');              // the keeper's lantern glows in the dark
  c.gems(170, 37, 2, 2);
  c.set(175, 37, 'B');
  c.set(176, 38, 'S');              // spring back out through the lid

  // ---- beat 5, PAYOFF (x197-226): the staircase and the beacon court ---------
  c.set(199, 30, '*');              // celebration line up the steps
  c.set(202, 29, '*');
  c.set(205, 28, '*');
  c.set(208, 27, '*');
  c.gems(211, 26, 3, 2);
  c.rect(220, 24, 221, 27, 'X');    // the beacon wall — 4 tall, hop it
  c.oneway(217, 24, 3);             // its stepping ledge
  c.set(223, 26, 'M');              // TOKEN — the nook behind the wall
  c.onFloor(214, 'F');              // the Warmth Beacon

  // ---- cast -------------------------------------------------------------------
  c.onFloor(5, 'P');
  c.onFloor(18, 'E');               // the first beetle, alone in the open
  c.onFloor(46, 'E');
  c.onFloor(70, 'E');               // underlands patrol
  c.set(88, 25, 'T');               // toads own the canopy road
  c.set(130, 25, 'T');
  c.onFloor(102, 'E');
  c.onFloor(133, 'E');              // guards the spike strip's far side
  c.onFloor(166, 'E');              // the gauntlet pack
  c.onFloor(178, 'T');
  c.onFloor(194, 'E');

  return {
    name: 'Sunroot Hollow', theme: 'thornwood', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Thornwood 1-1: "Sunroot Hollow" (228×42, Phase-3 rebuild)
CONCEPT  LAYERS. The forest has a ceiling worth reaching — three stacked lanes
         that weave and reconnect, each faster and richer than the last.
SETPIECE THE SUNROOT CANOPY (x59-148): pits and spikes on the ground road, a
         broken one-way canopy road over them, and a sky road of small pads
         over THAT. Spring x56 feeds the canopy; spring x72 feeds the sky.
PACING   intro meadow -> spring lesson -> the canopy weave -> crest checkpoint
         -> gauntlet twist (pits+spikes+pack, cellar secret) -> celebration
         staircase -> beacon court.
ROUTES   low: ground road. mid: canopy one-ways. high: sky pads (fast, rich).
         secret: pound the cracked lid at x172 into the ember cellar.
TOKENS   canopy spur over pit II (x111, nerve) / sky road end (x134, mastery)
         / cellar (x173, pound) / beacon-wall nook (x223, hop the wall).`,
  };
}

// ---------------------------------------------------------------------------
// 1-2 BRAMBLERISE — the forest tilts up. Terraces teach the climb, a spring
// chain sells the fast vertical line, and the RIDGE ROAD pays both off: a
// floating earth spine with commit gaps, bramble galleries slung beneath it,
// and a hollow trunk you chain-pound through every layer to the roots.
// ---------------------------------------------------------------------------
function bramblerise() {
  const W = 228, H = 44;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain: valley -> terraces -> (the ridge above) -> rise --------------
  c.ground(1, 30, 38);              // the valley walk-in
  c.ground(31, 44, 35);             // terrace I
  c.ground(45, 58, 32);             // terrace II
  c.ground(59, 72, 29);             // terrace III — the ridge on-ramp
  c.ground(73, 190, 38);            // the dark valley floor under the ridge
  c.ground(191, 202, 36);           // rise, step I
  c.ground(203, 226, 32);           // beacon rise

  // THE RIDGE ROAD — a floating earth spine across the whole midsection
  c.rect(73, 16, 95, 18, '#');
  c.rect(101, 16, 128, 18, '#');    // (commit gap I at x96-100)
  c.rect(134, 16, 147, 18, '#');    // (the trunk bay at x129-133)
  c.rect(153, 16, 176, 18, '#');    // (commit gap III at x148-152)

  // THE HOLLOW TRUNK — chain-pound: cap on the ridge, shaft down its throat,
  // cracked roots at the floor, the root chamber under those
  c.rect(129, 19, 129, 33, 'X');    // trunk walls hang below the ridge bay...
  c.rect(132, 19, 132, 33, 'X');
  c.rect(130, 16, 131, 18, '#');    // ...the bay bridged by ridge earth
  c.run(130, 16, 2, 'C');           // the cracked cap — pound I
  c.carve(130, 17, 131, 33);        // the shaft (open air below its mouth)
  c.run(130, 38, 2, 'C');           // the cracked roots — pound II, same fall
  c.carve(127, 39, 134, 41);        // THE ROOT CHAMBER
  c.set(128, 40, '*');
  c.set(130, 40, 'M');              // TOKEN — the trunk secret
  c.set(133, 40, 'B');
  c.set(127, 41, 'S');              // spring out through the broken roots

  // ---- fast route: the spring chain up the terraces ---------------------------
  c.onFloor(33, 'S');               // terrace I spring
  c.oneway(36, 27, 4);
  c.set(37, 26, 'S');               // ledge spring (8 lift -> the crown)
  c.oneway(40, 19, 4);              // the chain's crown
  c.set(41, 18, 'M');               // TOKEN — the fast line's prize
  c.gems(38, 24, 2, 2);
  c.gems(47, 17, 2, 2);             // crown -> ridge breadcrumbs
  c.oneway(47, 19, 3);              // hop-across pads onto the ridge head
  c.oneway(54, 19, 4);
  c.oneway(62, 18, 4);
  c.oneway(69, 17, 3);

  // ---- the ridge itself: commit gaps, owls, galleries beneath -----------------
  c.gemArc(95, 13, 6);              // flight over gap I
  c.gemArc(147, 13, 6);             // flight over gap III
  c.gems(80, 14, 3, 2);             // ridge running lines
  c.gems(120, 14, 3, 2);
  c.gems(160, 14, 3, 2);
  // under-ridge alcove: hug gap I's right wall as you drop — pads catch you
  c.oneway(99, 22, 5);
  c.set(101, 21, 'M');              // TOKEN — the alcove under the gap
  c.set(99, 21, '*');
  c.set(103, 21, 'S');              // the way back over the spine
  // bramble galleries: the middle lane for anyone who falls off the ridge
  c.oneway(84, 27, 6);
  c.oneway(96, 28, 6);
  c.oneway(110, 27, 6);
  c.oneway(122, 28, 4);
  c.oneway(140, 27, 6);
  c.oneway(154, 28, 6);
  c.oneway(166, 27, 6);
  c.gems(85, 25, 3, 2);
  c.gems(111, 25, 3, 2);
  c.gems(141, 25, 3, 2);
  c.gems(167, 25, 3, 2);
  // the valley floor beneath: dark, spiked, still walkable
  c.run(92, 37, 3, '^');
  c.run(136, 37, 3, '^');
  c.gemArc(135, 34, 5);
  c.run(163, 37, 3, '^');
  c.set(170, 37, 'K');              // checkpoint at the ridge's end, floor level
                                    // (set, not onFloor — a gallery pad hangs above)

  // ---- descent + the burr lesson (x176-199) -----------------------------------
  c.oneway(178, 21, 4);             // drop-through stack off the ridge end
  c.oneway(180, 27, 4);
  c.oneway(178, 33, 4);
  c.set(180, 20, '*');
  c.set(182, 26, '*');
  c.set(180, 32, '*');
  // the ridge-end skill slab: a floating stone finger only a glide crosses
  c.rect(186, 24, 187, 30, 'X');
  c.oneway(185, 23, 4);
  c.set(186, 22, 'M');              // TOKEN — the slab (glide from the stack)
  c.run(196, 37, 2, '^');           // spikes guard the burr...
  c.onFloor(199, 'A');              // ...the burr guards the road: shoot it

  // ---- beacon rise (x200-226): celebration -------------------------------------
  c.set(204, 34, '*');
  c.set(206, 33, '*');
  c.set(208, 32, '*');
  c.gemArc(212, 29, 6);
  c.set(220, 30, 'B');
  c.onFloor(216, 'F');

  // ---- cast ---------------------------------------------------------------------
  c.onFloor(5, 'P');
  c.onFloor(14, 'E');               // valley beetle
  c.onFloor(48, 'T');               // terrace toads
  c.onFloor(62, 'T');
  c.set(86, 15, 'T');               // the ridge belongs to toads...
  c.set(118, 15, 'E');
  c.set(158, 15, 'T');
  c.set(98, 12, 'O');               // ...and owls circle its commit gaps
  c.set(150, 12, 'O');
  c.set(112, 26, 'T');              // a gallery toad
  c.onFloor(104, 'E');              // valley floor patrol
  c.onFloor(146, 'E');
  c.onFloor(208, 'T');              // one last toad on the rise

  return {
    name: 'Bramblerise', theme: 'thornwood', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Thornwood 1-2: "Bramblerise" (228×44, Phase-3 rebuild)
CONCEPT  CLIMB. The forest tilts up: terraces teach stepped ascent, a spring
         chain sells the fast vertical line, the RIDGE ROAD pays both off.
SETPIECE THE RIDGE ROAD (x73-176): a floating earth spine two screens up with
         commit gaps owls circle, bramble galleries slung beneath it, and a
         spiked valley floor below — three true lanes the whole midsection.
PACING   valley walk-in -> terraces (or the spring chain) -> the ridge run ->
         hollow-trunk plunge -> descent stack -> burr lesson -> beacon rise.
ROUTES   safe: terraces, then the galleries. fast: spring chain (x33) to the
         crown, then the ridge. secret: chain-pound the trunk — cap (x130),
         fall the shaft, pound the cracked roots below into THE ROOT CHAMBER.
TOKENS   root chamber (x130, double pound) / spring-chain crown (x41, the
         fast prize) / under-ridge alcove below gap I (x101, drift into it) /
         ridge-end slab (x186, glide from the descent stack).`,
  };
}

// ---------------------------------------------------------------------------
// 1-3 EMBERFALL RIDGE — dusk momentum exam. Everything W1 taught at speed:
// pit rhythm, spike gauntlet over a cellar, the one-way ridge road — and now
// an owl line in the dusk sky for anyone who never touches the ground.
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
  c.carve(28, 36, 32, H - 1);
  c.carve(40, FLOOR, 44, H - 1);
  c.carve(52, FLOOR, 56, H - 1);
  // late pits
  c.carve(122, FLOOR, 126, H - 1);
  c.carve(180, FLOOR, 184, H - 1);

  // ---- ridge road (mid lane): longer now, toad-held -------------------------
  c.oneway(64, 30, 3);              // on-ramp from the mid rise
  c.oneway(70, 26, 5);
  c.oneway(79, 24, 5);
  c.oneway(88, 26, 5);
  c.oneway(97, 23, 5);
  c.oneway(106, 25, 5);
  c.oneway(115, 23, 5);
  c.oneway(124, 25, 5);
  c.oneway(133, 26, 5);             // ...and it now reaches the second rise
  c.gems(71, 25, 3, 2);
  c.gems(89, 25, 3, 2);
  c.gems(107, 24, 3, 2);
  c.gems(125, 24, 3, 2);

  // ---- THE OWL LINE (sky lane, y15): dusk pads over the whole midsection ----
  c.set(98, 22, 'S');               // spring on the ridge road feeds the sky
  c.oneway(101, 15, 3);
  c.oneway(109, 15, 3);
  c.oneway(117, 15, 3);
  c.oneway(125, 15, 3);
  c.oneway(133, 15, 5);             // the line's landing porch
  for (let i = 0; i < 5; i++) c.set(102 + i * 8, 13, '*');
  c.set(136, 14, 'M');              // TOKEN — the owl line's end
  c.gems(139, 18, 2, 2);            // glide-off breadcrumbs to the second rise

  // ---- spike gauntlet with the cellar under it ------------------------------
  c.run(90, 37, 4, '^');
  c.run(98, 37, 4, '^');
  c.oneway(95, 34, 2);              // safe hop between the strips
  c.carve(92, 40, 102, 41);         // the cellar
  c.run(96, FLOOR, 2, 'C');         // cracked lid between the spike strips
  c.carve(96, 39, 97, 39);
  c.set(100, 41, 'M');              // TOKEN — below the danger
  c.gems(93, 41, 2, 2);
  c.set(94, 41, 'B');
  c.set(101, 41, 'S');

  // pit-rhythm gem arcs + the flight token
  c.gemArc(28, 34, 5);
  c.gemArc(40, 36, 5);
  c.gemArc(52, 36, 5);
  c.set(42, 33, 'M');               // TOKEN — over the middle pit, mid-flight

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

  // ---- the watchtower (finale + last token) ----------------------------------
  c.rect(216, 24, 219, 32, 'X');    // stone tower on the knoll
  c.oneway(212, 30, 3);             // rungs up the outside
  c.oneway(212, 26, 3);
  c.oneway(217, 23, 2);             // the top board
  c.set(217, 22, 'M');              // TOKEN — the summit
  c.gems(213, 29, 2, 2);
  c.onFloor(209, 'F');              // the beacon at the tower's foot

  // ---- cast -------------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(24, 'E');
  c.onFloor(36, 'T');               // between pits — keep moving
  c.onFloor(63, 'E');
  c.set(82, 23, 'T');               // a toad ON the ridge road now
  c.set(76, 19, 'O');               // dusk owls between the lanes
  c.set(112, 11, 'O');              // one owl OVER the owl line
  c.set(120, 19, 'O');
  c.onFloor(112, 'A');              // burr guards the valley under the ridge
  c.onFloor(133, 'E');
  c.onFloor(156, 'T');
  c.onFloor(170, 'E');
  c.onFloor(175, 'A');              // second burr
  c.onFloor(190, 'E');
  c.onFloor(199, 'T');

  return {
    name: 'Emberfall Ridge', theme: 'thornwood', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Thornwood 1-3: "Emberfall Ridge" (232×44, Phase-3 rebuild)
CONCEPT  MOMENTUM. The W1 exam at dusk — pit rhythm, spike gauntlets, and all
         three lanes at once, taken at speed.
SETPIECE THE OWL LINE (x98-137): a sky lane of dusk pads over the ridge road,
         fed by a spring ON the road itself — ground, ridge, and sky stacked
         three lanes deep across the whole midsection.
PACING   raised trailhead -> pit rhythm x3 -> mid rise -> spike gauntlet
         (cellar beneath) -> ridge road + owl line -> checkpoint rise -> late
         gauntlet with burrs -> watchtower finale.
ROUTES   low: the valley, its pits and spikes. mid: the one-way ridge road
         x64-138. high: the owl line. secrets: pound the lid BETWEEN the spike
         strips (x96); climb the watchtower rungs past the beacon.
TOKENS   over the middle pit (x42, mid-flight) / cellar (x100) / owl line end
         (x136) / watchtower summit (x217).`,
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
