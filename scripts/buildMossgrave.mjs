/**
 * MOSSGRAVE RUINS rebuilt to the Phase-3 bar: FULL-HEIGHT three-lane anatomy in
 * a drowned monastery. The world's identity is SWIM — WATER IS THE MID LANE.
 * The three roads become: rafters overhead (sky, dry, one-ways + bats), the
 * water line (mid — a swimmable region that also grants 8 tiles of lift, the
 * artery that stitches the other two lanes), and the drowned flagstone floor
 * (ground, torn by LETHAL dry pits that drop into the open void below).
 *
 * Water safety (the law): every addWater region keeps a SOLID floor row beneath
 * it (carve to at most H-2), or the swimmer sinks through into the void and
 * dies. Lethal pits are DRY floor carved to H-1 and NEVER overlap water.
 *
 * Gimmick escalation 1->4:
 *   3-1 SUNKEN CLOISTER    — SWIM taught pure.  Setpiece: THE SUNKEN NAVE.
 *   3-2 THE KEYBEARERS WALK — SWIM + KEYS.      Setpiece: THE THREE DOORS.
 *   3-3 THE SWITCHWORKS    — SWIM + GATES.      Setpiece: THE GREAT UNLOCKING.
 *   3-4 THE SEALED VAULT   — ALL: swim/keys/gates + SPRINGS UNDER WATER.
 *                                                Setpiece: THE DROWNED VAULT.
 * (3-5 The Tidewarden's Reliquary, the boss arena, is untouched.)
 *
 * Engine facts honored: keys 'j' are counted, each door 'D' consumes one;
 * striking ANY switch 'n' opens EVERY gate 'H' at once; springs 'S' lift 8;
 * water lifts 8 and is a foothold; 'C' cracked lids pound through to cellars.
 * The keeper's lantern 'L' lives in moss1's cellar ONLY (world owns one of six).
 * Movement law: jump 4 up / 6 across (3 across when climbing >2); pits <=5 wide;
 * carve pits AFTER ground fills. Run: node scripts/buildMossgrave.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 3-1 SUNKEN CLOISTER — SWIM taught pure. Three lanes the whole midsection:
// rafters over the nave (sky), the flooded nave itself (mid, swim + lift), and
// the drowned floor with lethal dry gaps (ground). The water is calm, sunlit,
// gem-rich; it invites you in and teaches that it lifts you to the rafters.
// ---------------------------------------------------------------------------
function sunkenCloister() {
  const W = 236, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD: the drowned cloister floor, torn by lethal dry gaps -----
  c.ground(1, 234, FLOOR);
  // lethal dry gaps (bottomless — fall = death). Spaced along the ground road.
  c.carve(24, FLOOR, 27, H - 1);  c.gemArc(23, 34, 5);
  c.carve(96, FLOOR, 99, H - 1);  c.gemArc(95, 34, 5);
  c.carve(210, FLOOR, 213, H - 1); c.gemArc(209, 34, 5);

  // ---- MID LANE: the teach pool, then the great flooded nave ---------------
  // teach pool: a shallow sunlit basin — first taste of the mid lane. Floor at
  // H-1 stays SOLID; water fills to H-2. A spring-free lift lesson: swim up out.
  c.carve(34, 32, 52, H - 2);
  c.addWater(34, 33, 52, H - 2);
  c.gems(38, 38, 4, 3);            // treasure under the surface
  c.gems(40, 34, 3, 3);
  c.set(48, 33, 'B');

  // THE SUNKEN NAVE: the great flooded hall (mid lane) with rafters over it.
  c.carve(108, 26, 172, H - 2);
  c.addWater(108, 27, 172, H - 2);
  // drowned pillar stumps break the surface — footholds + a golem's island
  c.rect(120, 33, 121, H - 2, 'X');
  c.rect(134, 31, 135, H - 2, 'X');
  c.ground(146, 149, 33);         // the dry island, mid-nave
  c.rect(158, 33, 159, H - 2, 'X');
  // treasure in the deep — breadcrumbs down and across the nave
  c.gems(112, 32, 4, 3);
  c.gems(126, 36, 3, 3);
  c.gems(140, 30, 3, 3);
  c.gems(154, 36, 3, 3);
  c.gems(166, 32, 3, 3);

  // ---- SKY LANE: the rafters over the nave (dry one-way road, bat-held) -----
  // reached by SWIMMING UP (water lifts 8): from the nave surface (y~27) a
  // rafter at y19 is 8 up — the gimmick's core lesson, catchable.
  c.oneway(110, 19, 6);
  c.oneway(120, 19, 6);
  c.oneway(130, 19, 6);
  c.oneway(140, 19, 6);
  c.oneway(150, 19, 6);
  c.oneway(160, 19, 7);
  c.gems(112, 17, 3, 3);
  c.gems(132, 17, 3, 3);
  c.gems(152, 17, 3, 3);
  c.set(167, 18, 'M');            // TOKEN — glide: ride the rafters to the end
  c.gems(163, 17, 2, 2);

  // ---- the cloister colonnade before the nave (dry ground + roof-walk) ------
  const pillar = (x) => c.rect(x, 30, x + 1, FLOOR - 1, 'X');
  pillar(60); pillar(68); pillar(76); pillar(84);
  c.oneway(59, 29, 4); c.oneway(67, 29, 4); c.oneway(75, 29, 4); c.oneway(83, 29, 4);
  c.rect(56, 33, 57, 35, 'X');    // stair block onto the roof-walk
  c.gems(62, 35, 4, 4);           // ground road gems between pillars
  c.gems(68, 28, 3, 4);           // roof-walk gems
  c.set(88, 28, 'M');             // TOKEN — mastery: walk the whole roof line
  c.set(80, 35, 'B');

  // checkpoint on the nave's near lip
  c.onFloor(104, 'K');

  // the deep token: swim to the nave floor's dark corner (nerve — go deepest)
  c.set(138, 34, 'M');            // stands on the drowned floor row (H-1 solid)

  // ---- key + door: a first, gentle taste of what Mossgrave asks next --------
  c.oneway(180, 31, 2);
  c.gems(178, 33, 2, 2);
  c.set(180, 30, 'j');            // the key on a low ledge (place after gems)
  c.rect(192, 33, 192, 35, 'D');  // the door across the road

  // ---- beacon court + the cellar secret (with the keeper's lantern) --------
  c.gemArc(200, 34, 5);
  c.set(204, 35, 'B');
  c.run(216, FLOOR, 2, 'C');      // cracked flagstone lid — pound through
  c.carve(216, 37, 217, 37);
  c.carve(213, 38, 220, 40);      // the drowned cellar room
  c.gems(214, 39, 2, 2);
  c.set(218, 39, 'M');            // TOKEN — pound: the cellar prize (after gems)
  c.set(214, 39, 'L');            // the keeper's lantern in the drowned dark
  c.set(219, 40, 'S');            // spring back out through the lid
  c.onFloor(228, 'F');

  // ---- cast: tempo on all three lanes --------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(16, 'E');             // moss-crawler on the ground road
  c.onFloor(64, 'E');
  c.set(68, 28, 'T');             // cave-hopper on the roof-walk (one-way at y29)
  c.set(147, 32, 'A');            // the island golem, mid-nave
  c.set(124, 22, 'O');            // bats in the rafters
  c.set(156, 22, 'O');
  c.onFloor(186, 'T');
  c.onFloor(206, 'E');

  return {
    name: 'Sunken Cloister', theme: 'mossgrave', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-1: "Sunken Cloister" (236x42, day)
CONCEPT  SWIM taught pure. WATER IS THE MID LANE — a swimmable region that also
         lifts you 8 tiles, the artery between the drowned floor and the
         rafters. Calm, sunlit, gem-rich: the drowned monastery invites you in.
SETPIECE THE SUNKEN NAVE (x108-172) — a great flooded hall three lanes deep:
         rafters over it (sky, bats, the glide token), the flooded nave itself
         (mid, swim across drowned stumps and an island), and the drowned floor
         in the dark below (a deep token for the nerve to go down).
PACING   colonnade + roof-walk -> teach pool -> checkpoint -> THE SUNKEN NAVE
         (swim up to the rafters, or across, or down) -> key+door taste ->
         beacon court with the pound-cellar.
ROUTES   low: drowned floor road (lethal dry gaps). mid: swim the pools + nave
         (8-lift up to the sky). high: the roof-walk + nave rafters.
TOKENS   roof-walk end (x88, mastery) / rafters end (x167, glide) / nave floor
         (x138, nerve/deep) / cellar (x218, pound). Key x180 opens door x192.`,
  };
}

// ---------------------------------------------------------------------------
// 3-2 THE KEYBEARERS WALK — SWIM + KEYS develop. Three doors bar the walk; each
// key hides on a DIFFERENT lane, so bearing them is a lane-mastery drill: DIVE
// the mid lane for one, CLIMB the sky rafters for one, POUND the ground cellar
// for one. The water threads the whole level as the mid artery.
// ---------------------------------------------------------------------------
function keybearersWalk() {
  const W = 244, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- GROUND ROAD ---------------------------------------------------------
  c.ground(1, 242, FLOOR);
  c.carve(28, FLOOR, 31, H - 1);   c.gemArc(27, 36, 5);   // lethal dry gaps
  c.carve(150, FLOOR, 153, H - 1); c.gemArc(149, 36, 5);
  c.carve(228, FLOOR, 231, H - 1); c.gemArc(227, 36, 5);

  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.onFloor(16, 'E');

  // ---- DOOR I: the DIVE. Key on the mid lane's floor, past a golem. --------
  c.carve(36, 30, 60, H - 2);
  c.addWater(36, 31, 60, H - 2);
  c.rect(46, 34, 47, H - 2, 'X');  // drowned stump the golem guards
  c.set(46, 33, 'A');
  c.gems(40, 34, 3, 3);
  c.gems(52, 36, 3, 3);
  c.set(50, H - 2, 'j');           // the first key, deep on the water floor
  // a rafter over this pool teaches the swim-up-lift again (sky lane here)
  c.oneway(40, 22, 5);
  c.oneway(50, 22, 6);
  c.gems(42, 20, 2, 2);
  c.set(55, 21, 'M');              // TOKEN — glide: ride the pool's rafters
  c.gems(52, 20, 2, 2);
  c.rect(64, 35, 64, 37, 'D');
  c.set(62, 37, 'B');

  // ---- vault court + the whispering pocket ---------------------------------
  c.gems(70, 37, 4, 2);
  c.gemArc(80, 36, 5);
  c.onFloor(88, 'K');              // checkpoint after the first door
  c.set(92, 37, 'B');
  c.onFloor(96, 'E');
  c.run(74, 34, 4, 'X');           // an undercut bank most will sprint past
  c.gems(75, 36, 2, 2);
  c.set(76, 36, 'M');              // TOKEN — nerve: the shaded pocket, look up

  // ---- DOOR II: the CLIMB. Key up in the bat-owned rafters (sky lane). -----
  c.oneway(108, 34, 3);
  c.oneway(113, 30, 3);
  c.oneway(118, 26, 3);
  c.gems(114, 29, 2, 2);
  c.set(119, 25, 'j');             // the second key, up in the vaulting
  c.oneway(123, 23, 3);
  c.gems(124, 21, 2, 2);
  c.set(124, 22, 'M');             // TOKEN — mastery: one rafter higher
  c.set(112, 19, 'O');             // bats own this shaft
  c.set(122, 17, 'O');
  c.gems(109, 33, 2, 2);
  c.rect(130, 35, 130, 37, 'D');

  // ---- junction gauntlet ---------------------------------------------------
  c.run(138, 37, 3, '^');          // spikes pinch the walk
  c.gemArc(144, 36, 5);
  c.onFloor(160, 'A');             // a golem holds the junction (past the gap)
  c.gems(164, 37, 3, 2);
  c.set(168, 37, 'B');

  // ---- DOOR III: the POUND. Key under the cracked seal (ground cellar). -----
  c.run(176, FLOOR, 2, 'C');       // the cracked seal in the floor
  c.carve(176, 39, 177, 39);
  c.carve(173, 40, 180, 42);       // the seal cellar
  c.gems(174, 41, 2, 2);
  c.set(178, 41, 'j');             // the third key, under the seal (after gems)
  c.set(179, 42, 'S');             // spring back out
  c.rect(188, 35, 188, 37, 'D');

  // ---- the procession: a long earned celebration ---------------------------
  c.gems(194, 37, 5, 2);
  c.gemArc(206, 36, 5);
  c.onFloor(214, 'T');
  c.gems(218, 37, 3, 2);
  c.run(222, 30, 3, 'X');          // the watch-slab: last token, glide only
  c.gems(221, 28, 2, 2);
  c.set(223, 29, 'M');             // TOKEN — glide: leap to the slab (after gems)
  c.onFloor(220, 'E');
  c.set(236, 37, 'B');
  c.onFloor(238, 'F');

  return {
    name: 'The Keybearers Walk', theme: 'mossgrave', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-2: "The Keybearers Walk" (244x44, dusk)
CONCEPT  SWIM + KEYS. Three doors bar the walk and each key hides on a DIFFERENT
         lane, so bearing them is a lane-mastery drill: DIVE the mid lane (swim
         to the pool floor) for the first, CLIMB the sky rafters for the second,
         POUND the ground cellar for the third.
SETPIECE THE THREE DOORS — the level IS the setpiece: dive, door; climb, door;
         pound, door; then the procession celebration.
PACING   walk-in -> dive pool (door I) -> checkpoint + pocket -> climb shaft
         (door II) -> junction gauntlet -> seal cellar (door III) -> procession.
ROUTES   low: the walk itself (lethal gaps, seal cellar). mid: the dive pool
         (swim + its rafters). high: the vaulting climb (bats, the key).
TOKENS   dive-pool rafters (x55, glide) / whispering pocket (x76, nerve) / above
         key II (x124, mastery) / procession watch-slab (x223, glide).`,
  };
}

// ---------------------------------------------------------------------------
// 3-3 THE SWITCHWORKS — SWIM + GATES develop. The temple's flooded machinery:
// gates seal every lane (a gated bridge over a drowned moat, a sky loft, a
// grand wall) and taunt you the whole way in. One master switch — reached by
// swimming UP a flooded shaft to the pulpit — drops them ALL at once.
// ---------------------------------------------------------------------------
function switchworks() {
  const W = 248, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 246, FLOOR);
  c.carve(22, FLOOR, 25, H - 1);   c.gemArc(21, 36, 5);   // lethal dry gaps
  c.carve(230, FLOOR, 233, H - 1); c.gemArc(229, 36, 5);

  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.onFloor(16, 'E');

  // ---- the DROWNED MOAT + the gated bridge (mid lane, ground lane) ----------
  c.ground(34, 37, 34);            // west bank, raised to the bridge head
  c.ground(60, 63, 34);            // east bank
  c.carve(38, 33, 59, H - 2);      // the moat between the banks (flooded)
  c.addWater(38, 34, 59, H - 2);   // ...swim it — the floor at H-1 stays solid
  c.oneway(39, 29, 20);            // the bridge deck (sky, over the moat)
  c.rect(38, 28, 38, 30, 'H');     // gate towers seal BOTH bridge heads
  c.rect(59, 28, 59, 30, 'H');
  c.gems(42, 36, 3, 3);            // moat gems, deep (swim for them)
  c.gems(52, 36, 3, 3);
  c.set(56, H - 2, 'M');           // TOKEN — nerve: the moat's deepest floor
  c.gems(43, 29, 5, 3);            // bridge gems — visible, locked away

  // ---- the works: halls with gated vaults (visible treasure, sealed) --------
  c.gems(68, 37, 3, 2);
  c.onFloor(72, 'T');
  // vault A: a gated floor vault
  c.rect(82, 33, 82, 37, 'H');
  c.carve(83, 34, 90, 37);
  c.rect(83, 33, 90, 33, 'X');
  c.gems(84, 36, 2, 2);
  c.set(88, 36, 'M');              // TOKEN — mastery: the sealed vault A prize
  c.onFloor(96, 'E');
  c.run(102, 37, 3, '^');          // spikes pinch the walk
  // vault B: a high gated loft (sky lane)
  c.oneway(110, 32, 4);
  c.rect(116, 28, 116, 31, 'H');
  c.oneway(117, 31, 4);
  c.gems(118, 30, 2, 2);
  c.set(121, 30, 'M');             // TOKEN — glide: the sealed loft B (after gems)
  c.onFloor(126, 'A');             // golem before the climb

  // ---- checkpoint + THE FLOODED SHAFT up to the MASTER SWITCH ---------------
  c.onFloor(134, 'K');
  // a flooded shaft: swim UP it (water lifts 8) to the switch pulpit — the
  // gimmick and the gate-machinery fused into the level's key beat.
  c.carve(140, 22, 146, H - 2);
  c.addWater(140, 23, 146, H - 2);
  c.gems(142, 34, 2, 3);           // gems mark the ascent
  c.gems(142, 28, 2, 3);
  c.oneway(147, 22, 4);            // the switch pulpit at the top of the swim
  c.set(148, 21, 'n');             // THE MASTER SWITCH — strike it
  c.gems(150, 20, 2, 2);
  c.set(144, 18, 'O');             // bats over the pulpit

  // ---- the grand door: a full gate wall, now open --------------------------
  c.rect(160, 32, 160, 37, 'H');
  c.gemArc(164, 36, 5);
  c.set(170, 37, 'B');

  // ---- the cistern breather (mid lane again) -------------------------------
  c.carve(176, 33, 196, H - 2);
  c.addWater(176, 34, 196, H - 2);
  c.gems(180, 36, 4, 3);
  c.set(190, 35, 'B');
  // a rafter over the cistern (sky) with breadcrumbs
  c.oneway(180, 25, 6);
  c.oneway(190, 25, 6);
  c.gems(182, 23, 3, 2);

  // ---- final gauntlet + the beacon -----------------------------------------
  c.onFloor(204, 'E');
  c.run(210, 37, 3, '^');
  c.gemArc(216, 36, 5);
  c.onFloor(224, 'A');
  c.gems(236, 37, 2, 2);
  c.set(64, 33, 'B');              // east-bank welcome
  // the beacon-road cellar — pound the cracked flagstone in (the 4th token,
  // pound-reachable now instead of stranded on a floating glide slab)
  c.run(235, FLOOR, 2, 'C');       // cracked lid (x235-236)
  c.carve(235, 39, 236, 39);       // the throat
  c.carve(234, 40, 240, 42);       // the cellar room
  c.set(238, 41, 'M');             // TOKEN — pound: the beacon cellar secret
  c.gems(235, 41, 2, 2);
  c.set(239, 42, 'S');             // spring back out through the lid
  c.onFloor(242, 'F');

  return {
    name: 'The Switchworks', theme: 'mossgrave', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-3: "The Switchworks" (248x44, dusk)
CONCEPT  SWIM + GATES. The temple's flooded machinery taunts you the whole way
         in — a gated bridge over a DROWNED MOAT, two sealed vaults, a grand
         gate wall — every one visible, none open. The master switch sits atop a
         FLOODED SHAFT you must swim up (water lifts 8) to reach.
SETPIECE THE GREAT UNLOCKING — striking the pulpit switch (x148) drops EVERY
         gate at once (the engine makes it a spectacle). Backtrack for the
         vaults, or push on through the grand door.
PACING   walk-in -> drowned moat + gated bridge -> sealed vaults A/B -> checkpoint
         -> swim the flooded shaft to the switch -> the grand door -> cistern
         breather -> beacon gauntlet.
ROUTES   low: the walk (lethal gaps, vault A). mid: the moat + cistern + the
         switch shaft (swim). high: the bridge deck + loft + rafters (gated).
TOKENS   moat floor (x56, nerve) / vault A (x88, mastery) / loft B (x121, glide)
         / beacon watch-slab (x239, glide).`,
  };
}

// ---------------------------------------------------------------------------
// 3-4 THE SEALED VAULT — the world exam: ALL of Mossgrave plus the combine-with,
// SPRINGS UNDER WATER (8-lift chains). Swim the deepest water in the game, ride
// a submerged spring up a shaft, bear the key past golems, strike the switch,
// walk the gauntlet. Rafters over the drowned vault give a full third lane.
// ---------------------------------------------------------------------------
function sealedVault() {
  const W = 256, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 254, FLOOR);
  c.carve(18, FLOOR, 21, H - 1);   c.gemArc(17, 38, 5);   // lethal dry gaps
  c.carve(206, FLOOR, 209, H - 1); c.gemArc(205, 38, 5);

  // ---- act 1: the approach (recap at speed) --------------------------------
  c.gems(8, 39, 4, 2);
  c.onFloor(14, 'E');
  c.carve(24, 35, 40, H - 2);      // the warm-up pool (mid lane)
  c.addWater(24, 36, 40, H - 2);
  c.gems(28, 39, 3, 3);
  c.gems(30, 36, 2, 3);
  c.onFloor(46, 'T');
  c.run(52, 39, 3, '^');
  c.gemArc(58, 38, 5);
  // the approach cellar — pound the cracked flagstone (the 4th token, replacing
  // the borderline spring-fed high-ledge token with a pound-reachable one)
  c.run(60, FLOOR, 2, 'C');        // cracked lid (x60-61)
  c.carve(60, 41, 61, 41);         // the throat
  c.carve(58, 42, 64, 44);         // the cellar room
  c.gems(59, 43, 2, 2);            // gems FIRST (they overwrite same-cell entities)
  c.set(61, 43, 'M');              // TOKEN — pound: the approach cellar
  c.set(63, 44, 'S');              // spring back out through the lid

  // ---- act 2: THE DROWNED VAULT (the deepest water in the game) -------------
  c.carve(66, 24, 140, H - 2);
  c.addWater(66, 25, 140, H - 2);
  // the ruin maze under the surface — stumps to swim around
  c.rect(78, 36, 79, H - 2, 'X');
  c.rect(92, 32, 93, H - 2, 'X');
  c.rect(106, 36, 107, H - 2, 'X');
  c.rect(120, 30, 121, H - 2, 'X');
  c.rect(130, 38, 131, H - 2, 'X');
  // the air bell: a carved dry pocket above the waterline, mid-vault
  c.carve(98, 21, 104, 23);
  c.oneway(98, 24, 7);
  c.gems(100, 22, 2, 1);
  c.set(101, 21, 'M');             // TOKEN — nerve: surface inside the air bell
  // COMBINE-WITH: a submerged spring at the vault floor throws you 8 up a shaft
  c.set(112, H - 2, 'S');          // the drowned spring (stands on solid floor)
  c.gems(112, 33, 2, 3);           // the shaft it launches you up
  c.gems(112, 29, 2, 2);
  // rafters over the vault (sky lane) — a dry high road with breadcrumbs
  c.oneway(70, 18, 6);
  c.oneway(82, 18, 6);
  c.oneway(94, 18, 6);
  c.oneway(112, 16, 6);            // the spring's catch ledge (8 up from floor)
  c.oneway(124, 18, 6);
  c.gems(72, 16, 3, 2);
  c.gems(126, 16, 3, 2);
  c.set(114, 15, '*');             // breadcrumb on the spring-fed high ledge
  c.set(116, 17, 'B');             // (a berry rewards the swim-lift chain instead)
  // treasure rows in the deep
  c.gems(74, 30, 4, 3);
  c.gems(86, 37, 3, 3);
  c.gems(100, 34, 3, 3);
  c.gems(118, 37, 3, 3);
  c.gems(132, 32, 3, 3);
  // the key at the deepest, darkest corner — golems keep it
  c.set(136, H - 2, 'j');
  c.set(130, 37, 'A');             // on the stump at 130
  c.set(106, 35, 'A');             // on the stump at 106
  c.set(134, H - 2, 'M');          // TOKEN — nerve: swim deepest, beside the key
  // climb-out + the vault door
  c.ground(141, 148, 36);
  c.rect(150, 33, 150, 35, 'D');

  // ---- act 3: the switch loft + checkpoint ---------------------------------
  c.onFloor(154, 'K');             // breathe — you earned it
  c.set(157, 35, 'B');
  c.oneway(162, 32, 3);
  c.oneway(168, 28, 3);
  c.set(172, 22, 'O');
  c.oneway(174, 25, 3);
  c.gems(169, 27, 2, 2);
  c.set(175, 24, 'n');             // the switch, high in the loft
  c.gems(163, 31, 2, 2);
  // the gate wall it opens, and a gated side hoard
  c.rect(184, 34, 184, 39, 'H');
  c.rect(192, 36, 192, 39, 'H');
  c.carve(193, 37, 198, 39);
  c.rect(193, 36, 198, 36, 'X');
  c.gems(194, 38, 3, 2);
  c.set(197, 38, 'M');             // TOKEN — mastery: the gated hoard

  // ---- act 4: the long gauntlet to the beacon ------------------------------
  c.onFloor(214, 'E');
  c.run(218, 39, 3, '^');
  c.gemArc(224, 38, 5);
  c.onFloor(232, 'A');
  c.set(226, 39, 'B');
  c.run(236, 39, 3, '^');
  c.gems(242, 39, 2, 2);
  c.onFloor(240, 'T');
  // the final arch — Mossgrave's farewell landmark (beacon UNDER it)
  c.rect(246, 32, 247, 37, 'X');
  c.rect(252, 32, 253, 37, 'X');
  c.run(246, 31, 8, 'X');
  c.set(250, 39, 'F');             // UNDER the arch — set, not onFloor

  // ---- cast ----------------------------------------------------------------
  c.onFloor(6, 'P');
  c.set(84, 22, 'O');              // bats over the vault surface
  c.set(122, 22, 'O');

  return {
    name: 'The Sealed Vault', theme: 'mossgrave', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-4: "The Sealed Vault" (256x46, dusk)
CONCEPT  ALL + the combine-with SPRINGS UNDER WATER (8-lift chains). The world
         final: swim the deepest water in the game, ride a SUBMERGED SPRING up a
         shaft to the sky rafters, bear the key past golems, strike the loft
         switch, survive the gauntlet. Each act escalates one earlier lesson.
SETPIECE THE DROWNED VAULT (x66-140) — a 74-tile flooded bank vault three lanes
         deep: rafters over it (sky), the flooded maze (mid — a drowned spring
         at x112 fires you 8 up to a high ledge), the deep floor (the key + a
         nerve token in the darkest corner). An air bell surfaces mid-vault.
PACING   approach + warm-up pool -> THE DROWNED VAULT (swim/spring/rafters) ->
         vault door -> checkpoint -> switch loft + gated hoard -> the long
         gauntlet -> the farewell arch and beacon.
ROUTES   low: the vault floor (key, golems, lethal dry gaps outside). mid: swim
         + the drowned spring. high: the vault rafters + switch loft.
TOKENS   air bell (x101, nerve) / spring-fed high ledge (x114, glide) / beside
         the key (x134, nerve/deep) / gated hoard (x197, mastery).`,
  };
}

// ---------------------------------------------------------------------------
for (const [file, def] of [
  ['moss1.ts', sunkenCloister()],
  ['moss2.ts', keybearersWalk()],
  ['moss3.ts', switchworks()],
  ['moss4.ts', sealedVault()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
