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
for (const [file, def] of [
  ['rime1.ts', longSlide()],
]) {
  const res = validate(def.rows, { water: def.water });
  console.log(`${def.name}: ${res.ok ? 'PASS' : 'FAIL'} (gems ${res.gems}, tokens ${res.tokens})`);
  for (const issue of res.issues) console.log(`  - ${issue}`);
  if (res.ok) {
    writeLevel(out(file), def);
    console.log(`  -> wrote ${file}`);
  }
}
