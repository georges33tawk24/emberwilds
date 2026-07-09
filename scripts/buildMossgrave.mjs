/**
 * Mossgrave Ruins rebuilt to the Phase-2 bar + the concept directive. The
 * world's mechanics ARE the identities — each level owns one, the last owns
 * them all:
 *   3-1 SUNKEN CLOISTER   — SWIM.    Setpiece: THE SUNKEN NAVE.
 *   3-2 THE KEYBEARERS WALK — KEYS.  Setpiece: THE THREE DOORS.
 *   3-3 THE SWITCHWORKS   — GATES.   Setpiece: THE GREAT UNLOCKING.
 *   3-4 THE SEALED VAULT  — ALL.     Setpiece: THE DROWNED VAULT.
 * (3-5 The Tidewarden's Reliquary, the boss arena, is untouched.)
 * Engine facts honored: keys are counted, each door consumes one; striking
 * ANY switch opens EVERY gate at once (so gates pay off in one spectacle);
 * water is a region — swimmable foothold + 8 tiles of lift in the lint model.
 * Run: node scripts/buildMossgrave.mjs
 */
import { Canvas, validate, writeLevel } from './levelBuilder.mjs';

const out = (f) => new URL(`../src/data/levels/${f}`, import.meta.url).pathname;

// ---------------------------------------------------------------------------
// 3-1 SUNKEN CLOISTER — learn to swim in a drowned monastery. Water is calm,
// inviting, full of gems; the nave is the deep end.
// ---------------------------------------------------------------------------
function sunkenCloister() {
  const W = 244, H = 42, FLOOR = 36;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  // ---- terrain --------------------------------------------------------------
  c.ground(1, 242, FLOOR);
  // the teach pool: a sunlit basin off the first courtyard
  c.carve(30, 33, 50, 40);
  c.addWater(30, 34, 50, 40);
  // THE SUNKEN NAVE: the great flooded hall
  c.carve(110, 30, 168, 39);
  c.addWater(110, 30, 168, 39);
  // climb-out stair
  c.ground(169, 176, 37);

  // lethal dry gaps between the pools — the new commitment (water is safe,
  // the dry floor between it is not)
  c.carve(22, FLOOR, 25, H - 1); c.gemArc(21, 34, 5);
  c.carve(178, FLOOR, 182, H - 1); c.gemArc(177, 34, 6);

  // teach pool dressing: gems below, berry on the far rim
  c.gems(34, 37, 4, 3);
  c.gems(40, 39, 3, 3);
  c.set(52, 35, 'B');

  // ---- the cloister colonnade (dry arcade with a roof-walk) -----------------
  const pillar = (x) => c.rect(x, 30, x + 1, FLOOR - 1, 'X');
  pillar(58); pillar(66); pillar(74); pillar(82); pillar(90); pillar(98);
  c.oneway(57, 29, 4); c.oneway(65, 29, 4); c.oneway(73, 29, 4);
  c.oneway(81, 29, 4); c.oneway(89, 29, 4); c.oneway(97, 29, 4);
  c.rect(55, 33, 56, 35, 'X');      // the stair block onto the roof-walk
  c.gems(60, 35, 4, 4);             // floor road gems (between pillars)
  c.gems(66, 28, 3, 4);             // roof-walk gems
  c.gems(82, 28, 3, 4);
  c.set(100, 28, 'M');              // roof-walk prize at the arcade's end
  c.set(94, 35, 'B');

  // checkpoint before the nave
  c.onFloor(105, 'K');

  // ---- THE SUNKEN NAVE dressing ---------------------------------------------
  // drowned pillar stumps + a dry island where a golem stands watch
  c.rect(120, 36, 121, 39, 'X');
  c.rect(132, 35, 133, 39, 'X');
  c.ground(140, 142, 34);           // the island breaks the surface
  c.rect(152, 36, 153, 39, 'X');
  c.rect(160, 35, 161, 39, 'X');
  // rafters above the water — the dry high road, with gaps
  c.oneway(112, 28, 5);
  c.oneway(122, 28, 5);
  c.oneway(134, 27, 5);
  c.oneway(146, 28, 5);
  c.oneway(158, 27, 5);
  c.set(166, 26, 'M');              // rafter-end prize
  // treasure under the surface
  c.gems(116, 33, 4, 3);
  c.gems(126, 37, 3, 3);
  c.gems(144, 33, 4, 3);
  c.gems(156, 37, 3, 3);
  c.set(150, 38, 'M');              // the deep token, between the stumps
  c.set(137, 38, 'B');

  // ---- key + door: a gentle taste of what Mossgrave asks next ---------------
  c.oneway(184, 31, 2);
  c.set(184, 30, 'j');              // the key on a ledge
  c.gems(180, 35, 2, 2);
  c.rect(196, 33, 196, 35, 'D');    // the door across the road

  // ---- beacon court + cellar secret -----------------------------------------
  c.gemArc(204, 34, 5);
  c.set(208, 35, 'B');
  c.run(212, FLOOR, 2, 'C');        // cracked flagstone
  c.carve(212, 37, 213, 37);
  c.carve(209, 38, 216, 40);
  c.set(214, 39, 'M');              // the cellar token
  c.set(209, 39, 'L');              // the keeper's lantern in the drowned dark
  c.gems(210, 39, 2, 2);
  c.set(215, 40, 'S');
  c.onFloor(230, 'F');

  // ---- cast -------------------------------------------------------------------
  c.onFloor(6, 'P');
  c.onFloor(18, 'E');               // moss-crawler
  c.onFloor(62, 'E');
  c.onFloor(78, 'T');               // cave-hopper between the pillars
  c.set(70, 24, 'O');               // bats in the vaulting
  c.set(128, 24, 'O');
  c.set(141, 33, 'A');              // the island golem
  c.set(155, 24, 'O');
  c.onFloor(190, 'T');
  c.onFloor(222, 'E');

  return {
    name: 'Sunken Cloister', theme: 'mossgrave', daypart: 'day', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-1: "Sunken Cloister" (244×42, day)
CONCEPT  SWIM. Water is calm, sunlit and full of gems — the drowned monastery
         invites you in before the deep end asks anything of you.
SETPIECE THE SUNKEN NAVE — a great flooded hall: rafters above (dry road,
         bats), drowned pillar stumps below (gem road), one island where a
         golem stands watch. A token rests in the deepest dark.
ROUTES   colonnade floor vs pillar roof-walk; nave rafters vs the dive; the
         cellar under the beacon court via a cracked flagstone.
TOKENS   roof-walk end (x100) / nave deep (x150) / rafter end (x166) /
         cellar (x214). Key at x184 opens the door at x196.`,
  };
}

// ---------------------------------------------------------------------------
// 3-2 THE KEYBEARERS WALK — three doors, three keys, three different asks:
// dive for one, climb for one, pound for one.
// ---------------------------------------------------------------------------
function keybearersWalk() {
  const W = 248, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 246, FLOOR);
  // lethal dry gaps flanking the procession
  c.carve(28, FLOOR, 31, H - 1); c.gemArc(27, 36, 5);
  c.carve(206, FLOOR, 209, H - 1); c.gemArc(205, 36, 5);

  // ---- intro ------------------------------------------------------------------
  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.onFloor(16, 'E');
  c.onFloor(26, 'T');

  // ---- DOOR I: the dive -------------------------------------------------------
  c.carve(34, 32, 56, 41);
  c.addWater(34, 33, 56, 41);
  c.rect(44, 38, 45, 41, 'X');      // drowned stump the golem guards
  c.set(44, 37, 'A');
  c.set(48, 40, 'j');               // the first key, at the bottom
  c.gems(38, 36, 4, 3);
  c.gems(50, 38, 2, 3);
  c.set(52, 40, 'M');               // the dive token, past the key
  c.rect(60, 35, 60, 37, 'D');
  c.set(58, 37, 'B');

  // ---- vault court -------------------------------------------------------------
  c.gems(66, 37, 4, 2);
  c.gemArc(76, 36, 5);
  c.onFloor(84, 'K');               // checkpoint after the first door
  c.set(88, 37, 'B');
  c.onFloor(92, 'E');
  // the whispering pocket: an undercut bank most will sprint past
  c.run(70, 34, 4, 'X');
  c.set(72, 36, 'M');

  // ---- DOOR II: the climb -------------------------------------------------------
  c.oneway(104, 34, 3);
  c.oneway(109, 30, 3);
  c.oneway(114, 26, 3);
  c.set(115, 25, 'j');              // the second key, up in the vaulting
  c.oneway(119, 24, 3);
  c.set(120, 23, 'M');              // one platform higher, the prize
  c.set(108, 20, 'O');              // bats own this shaft
  c.set(118, 18, 'O');
  c.gems(105, 33, 2, 2);
  c.gems(110, 29, 2, 2);
  c.rect(126, 35, 126, 37, 'D');

  // ---- junction gauntlet ---------------------------------------------------------
  c.run(134, 37, 3, '^');
  c.gemArc(140, 36, 5);
  c.onFloor(148, 'A');              // a golem holds the junction
  c.gems(152, 37, 3, 2);
  c.set(156, 37, 'B');

  // ---- DOOR III: the pound -------------------------------------------------------
  c.run(164, FLOOR, 2, 'C');        // the cracked seal in the floor
  c.carve(164, 39, 165, 39);
  c.carve(161, 40, 168, 42);
  c.set(165, 41, 'j');              // the third key, under the seal
  c.gems(162, 41, 2, 2);
  c.set(167, 42, 'S');
  c.rect(176, 35, 176, 37, 'D');

  // ---- the procession: a long earned celebration ----------------------------------
  c.gems(182, 37, 5, 2);
  c.gemArc(194, 36, 5);
  c.onFloor(200, 'T');
  c.gems(204, 37, 4, 2);
  c.run(212, 30, 3, 'X');           // the watch-slab: last token, skill only
  c.set(213, 29, 'M');
  c.onFloor(216, 'E');
  c.set(222, 37, 'B');
  c.gemArc(226, 36, 5);
  c.onFloor(238, 'F');

  return {
    name: 'The Keybearers Walk', theme: 'mossgrave', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-2: "The Keybearers Walk" (248×44, dusk)
CONCEPT  KEYS. Three doors bar the walk and each key asks a different verb:
         DIVE past the golem for the first, CLIMB the bat shaft for the
         second, POUND the cracked seal for the third.
SETPIECE THE THREE DOORS — the level IS the setpiece: door, lesson, door,
         lesson, door, celebration.
ROUTES   the walk itself is linear by design (a procession) — the variety
         lives above and below it: the vaulting climb, the seal cellar, the
         undercut pocket at x70.
TOKENS   undercut pocket (x72) / above the second key (x120) / watch-slab
         (x213, skill) / and one hides with the gems in the dive (see x50).`,
  };
}

// ---------------------------------------------------------------------------
// 3-3 THE SWITCHWORKS — the temple's gate machinery. Locked gates taunt you
// the whole way in; one master switch drops them ALL at once.
// ---------------------------------------------------------------------------
function switchworks() {
  const W = 252, H = 44, FLOOR = 38;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 250, FLOOR);
  // lethal dry gaps (the spike moat is no longer the only way to fall)
  c.carve(24, FLOOR, 27, H - 1); c.gemArc(23, 36, 5);
  c.carve(176, FLOOR, 179, H - 1); c.gemArc(175, 36, 5);

  // ---- intro -------------------------------------------------------------------
  c.onFloor(6, 'P');
  c.gems(10, 37, 4, 2);
  c.onFloor(18, 'E');

  // ---- the SPIKE MOAT + the gated bridge -----------------------------------------
  c.ground(36, 39, 34);             // west bank, raised to the bridge head
  c.ground(63, 66, 34);             // east bank
  c.carve(40, 35, 62, 40);          // the moat between the banks
  c.run(40, 41, 23, '^');           // ...its floor lined with spikes
  const stone = (x) => c.rect(x, 41, x, 41, 'X');
  stone(40); stone(46); stone(47); stone(51); stone(52); stone(57); stone(62);
  c.oneway(41, 30, 21);             // the bridge deck between the banks
  c.rect(40, 29, 40, 31, 'H');      // gate towers seal BOTH bridge heads
  c.rect(62, 29, 62, 31, 'H');
  c.gems(44, 40, 2, 4);             // moat gems for the careful
  c.set(57, 40, 'M');               // moat token, standing on the last stone
  c.gems(45, 29, 5, 3);             // bridge gems — visible, locked away

  // ---- the works: halls with gated vaults (visible treasure, sealed) -------------
  c.gems(70, 37, 3, 2);
  c.onFloor(74, 'T');
  // vault A: gems + token behind a gate
  c.rect(84, 33, 84, 37, 'H');
  c.carve(85, 34, 92, 37);
  c.rect(85, 33, 92, 33, 'X');
  c.set(88, 36, 'M');
  c.gems(86, 36, 1, 1);
  c.gems(90, 36, 1, 1);
  c.onFloor(98, 'E');
  c.run(104, 37, 3, '^');
  // vault B: a high gated loft
  c.oneway(112, 32, 4);
  c.rect(118, 28, 118, 31, 'H');
  c.oneway(119, 31, 4);
  c.set(121, 30, 'M');
  c.gems(119, 30, 1, 1);
  c.onFloor(126, 'A');              // golem before the climb

  // ---- checkpoint + the climb to the MASTER SWITCH --------------------------------
  c.onFloor(134, 'K');
  c.oneway(140, 34, 3);
  c.oneway(145, 30, 3);
  c.oneway(150, 26, 3);
  c.set(144, 22, 'O');
  c.set(154, 20, 'O');
  c.gems(141, 33, 2, 2);
  c.gems(146, 29, 2, 2);
  c.oneway(156, 24, 4);             // the switch pulpit
  c.set(157, 23, 'n');              // THE MASTER SWITCH — strike it
  c.gems(158, 22, 2, 2);

  // ---- the grand door: a full gate wall, now open ----------------------------------
  c.rect(170, 32, 170, 37, 'H');
  c.gemArc(174, 36, 5);
  c.set(180, 37, 'B');

  // ---- the cistern breather ----------------------------------------------------------
  c.carve(186, 34, 202, 41);
  c.addWater(186, 35, 202, 41);
  c.gems(190, 38, 4, 3);
  c.set(198, 40, 'B');

  // ---- final gauntlet ------------------------------------------------------------------
  c.onFloor(208, 'E');
  c.run(214, 37, 3, '^');
  c.gemArc(220, 36, 5);
  c.onFloor(228, 'A');
  c.gems(232, 37, 3, 2);
  c.gems(60, 33, 2, 2);             // east-bank welcome
  // the last token watches from a slab above the beacon road
  c.run(236, 30, 3, 'X');
  c.set(237, 29, 'M');
  c.onFloor(242, 'F');

  return {
    name: 'The Switchworks', theme: 'mossgrave', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-3: "The Switchworks" (252×44, dusk)
CONCEPT  GATES. The temple's machinery taunts you the whole way in — a gated
         bridge over a spike moat, two sealed treasure vaults, a grand gate
         wall — every one of them visible, none of them open.
SETPIECE THE GREAT UNLOCKING — the master switch on the pulpit (x159) drops
         EVERY gate in the level at once (the engine makes it a spectacle:
         dust, shake, all doors falling together). Backtrack for the vaults,
         or push on through the grand door.
ROUTES   moat floor (spikes, careful stones, a token) vs the bridge deck
         (locked until the switch); the vaults reward the walk back.
TOKENS   moat (x57) / vault A (x88) / vault B loft (x121) / watch-slab by
         the beacon (x237, skill).`,
  };
}

// ---------------------------------------------------------------------------
// 3-4 THE SEALED VAULT — everything Mossgrave taught, in one drowned bank
// vault: dive deepest, bear the key, strike the switch, walk the gauntlet.
// ---------------------------------------------------------------------------
function sealedVault() {
  const W = 256, H = 46, FLOOR = 40;
  const c = new Canvas(W, H);
  c.rect(0, 0, 0, H - 1, '#');
  c.rect(W - 1, 0, W - 1, H - 1, '#');

  c.ground(1, 254, FLOOR);
  // lethal dry gaps bracketing the drowned vault
  c.carve(18, FLOOR, 21, H - 1); c.gemArc(17, 38, 5);
  c.carve(198, FLOOR, 201, H - 1); c.gemArc(197, 38, 5);

  // ---- act 1: the approach (recap at speed) --------------------------------------
  c.gems(10, 39, 4, 2);
  c.onFloor(16, 'E');
  c.carve(24, 36, 40, 43);
  c.addWater(24, 37, 40, 43);       // the warm-up pool
  c.gems(28, 40, 3, 3);
  c.onFloor(46, 'T');
  c.run(52, 39, 3, '^');
  c.gemArc(58, 38, 5);

  // ---- act 2: THE DROWNED VAULT ---------------------------------------------------
  c.carve(66, 26, 138, 43);
  c.addWater(66, 27, 138, 43);
  // the ruin maze under the surface
  c.rect(76, 36, 77, 43, 'X');
  c.rect(90, 32, 91, 43, 'X');
  c.rect(104, 36, 105, 43, 'X');
  c.rect(118, 30, 119, 43, 'X');
  c.rect(128, 38, 129, 43, 'X');
  // the air bell: one carved pocket above the waterline, mid-vault
  c.carve(96, 24, 102, 25);
  c.oneway(96, 26, 7);
  c.set(99, 24, 'M');               // token in the bell — surface inside it
  c.set(97, 25, 'B');
  // treasure rows
  c.gems(72, 32, 4, 3);
  c.gems(84, 38, 4, 3);
  c.gems(100, 34, 4, 3);
  c.gems(112, 40, 4, 3);
  c.gems(124, 33, 4, 3);
  // the key at the deepest, darkest corner — two golems keep it
  c.set(134, 42, 'j');
  c.set(128, 37, 'A');              // on the stump at 128 (support below)
  c.set(104, 35, 'A');              // on the stump at 104
  c.set(132, 40, 'M');              // the deep token beside the key
  // climb-out + the vault door
  c.ground(139, 146, 36);
  c.rect(148, 33, 148, 35, 'D');

  // ---- act 3: the switch loft + checkpoint ------------------------------------------
  c.onFloor(152, 'K');              // breathe — you earned it
  c.set(155, 35, 'B');
  c.oneway(160, 32, 3);
  c.oneway(166, 28, 3);
  c.set(170, 22, 'O');
  c.oneway(172, 25, 3);
  c.set(173, 24, 'n');              // the switch, high in the loft
  c.gems(161, 31, 2, 2);
  c.gems(167, 27, 2, 2);
  // the gate wall it opens, and a gated side hoard
  c.rect(182, 34, 182, 39, 'H');
  c.rect(190, 36, 190, 39, 'H');
  c.carve(191, 37, 196, 39);
  c.rect(191, 36, 196, 36, 'X');
  c.gems(192, 38, 3, 2);
  c.set(195, 38, 'M');              // the hoard token

  // ---- act 4: the long gauntlet to the beacon -----------------------------------------
  c.onFloor(202, 'E');
  c.run(208, 39, 3, '^');
  c.gemArc(214, 38, 5);
  c.onFloor(220, 'A');
  c.set(226, 39, 'B');
  c.run(230, 39, 3, '^');
  c.gems(236, 39, 3, 2);
  c.onFloor(236, 'T');
  // the gauntlet watch-slab: the 4th token, skill only
  c.run(222, 32, 3, 'X');
  c.set(223, 31, 'M');
  // the final arch — Mossgrave's farewell landmark
  c.rect(240, 32, 241, 37, 'X');
  c.rect(246, 32, 247, 37, 'X');
  c.run(240, 31, 8, 'X');
  c.set(244, 39, 'F');              // UNDER the arch — onFloor would perch it on top

  // ---- cast ------------------------------------------------------------------------
  c.onFloor(6, 'P');
  c.set(82, 22, 'O');               // bats over the vault surface
  c.set(122, 22, 'O');

  return {
    name: 'The Sealed Vault', theme: 'mossgrave', daypart: 'dusk', rows: c.rows(), water: c.water,
    header: `EMBERWILDS — Mossgrave 3-4: "The Sealed Vault" (256×46, dusk)
CONCEPT  EVERYTHING. The world final: swim the deepest water in the game,
         bear the key past two golems, strike the loft switch, survive the
         gauntlet. Each act is one lesson from 3-1/3-2/3-3, escalated.
SETPIECE THE DROWNED VAULT — a 72-tile flooded bank vault: a ruin maze below
         the surface, an air bell with a token INSIDE it, the key in the
         deepest corner under golem watch.
ROUTES   over the vault on rafters is impossible here — the vault must be
         swum (the one level that commits). Side hoard behind the second
         gate; the arch frames the beacon.
TOKENS   air bell (x99) / beside the key (x132) / gated hoard (x195) /
         and the warm-up pool hides nothing — the vault hides it all (see
         the deep pair).`,
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
