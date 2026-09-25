// ---------------------------------------------------------------------------
// THE ARSENAL MODEL — does the enemy Mk ladder and the weapon Mk ladder
// actually produce "struggle, then relief"?
//
//   node tools/sim-arsenal.mjs            the ladder check (every Mk debut)
//   node tools/sim-arsenal.mjs --waves    the kill-order check (wave recipes)
//   node tools/sim-arsenal.mjs --matrix   new enemy traits x new answers
//   node tools/sim-arsenal.mjs --newcomers  kamikaze, frankenstein, drone
//   node tools/sim-arsenal.mjs --spawner  the spawner room, three ways
//   node tools/sim-arsenal.mjs --schedule the floors, and the rules the schedule keeps
//   node tools/sim-arsenal.mjs --boss     the floor-1 boss's blink, against brackets and shells
//
// A PROPOSAL, NOT THE GAME. The Mk tables below are the design in
// docs/ARSENAL.md and nothing in the game reads them yet. When the ladder is
// built they move into src/balance.js (PILLARS §7: one source of tunable
// numbers) and this file imports them from there. The live numbers it DOES
// use — bullet speed per door, the room's shot clock, the school's volleys,
// group sizes, the bank and scarcity curves, the Mk I weapons — are imported,
// so moving a dial in balance.js moves this check with it.
//
// ENEMY_BASE is copied from ENEMY_TYPES in src/main.js, which is not
// exported. It is the one duplicated table here, and the build moves it.
//
// WHAT IT MEASURES
//
// The game is one hit both ways, so a matchup is not decided by health. It is
// decided by how much answering it costs you, and the cost is DODGING: every
// second a man stays alive he gets to fire, and every round he fires is a
// sidestep you owe. So the unit is
//
//   PRESSURE  P = seconds of dodging one kill costs you
//             = sum over the fight of (volleys at you x seconds to clear each)
//
// and it is honest in both directions: an enemy gets harder by firing more,
// faster, wider or from further (more dodge per volley, or more volleys), and
// a weapon gets better by killing sooner (fewer volleys). Some of that dodging
// you can do on foot; the part you cannot — a round too fast to walk out of,
// or one landing inside the window you need for another — you pay in bank:
//
//   BANK      R = bank spent per kill / bank a kill refunds
//
// R below 1 and the fight pays for itself. R above 1 and it is eating the
// bank. R is the one that turns red on a phone; P is the one that is always
// there, and the one the checks run on, because RATIOS of P barely depend on
// the model's one real guess (how long a thumb takes to settle — FITTS_A/B).
//
// THE CHECKS, per Mk debut:
//
//   FELT      the new Mk, met with what you had:  P >= 1.25 x the last Mk
//             fought with its own weapon AT THE SAME DOOR — he got harder
//   RELIEF    ...and with the weapon he drops:    P <= 0.75 x the struggle
//   CAUGHT UP ...which puts you back where the last Mk had you, at this
//             door: 0.7x to 1.35x. Not free, not still losing.
//
// Mk I debuts run RELIEF only: struggle is the pistol, relief is his drop.
// ---------------------------------------------------------------------------

import { TIME, WEAPONS, OPENING, SPEED,
  speedAt, scarcity, doorEncounters, volleyAt, powerUnlockDoor } from '../src/balance.js';

// --- the player -----------------------------------------------------------
const MOVE = 5.5;          // m/s at full stick — MOVE_SPEED in main.js
const REACT = 0.30;        // s from seeing the round leave to moving
const AIM_SIGMA = 0.010;   // rad of thumb error on a settled aim
// ACQUIRING A MAN IS FITTS'S LAW: a + b x log2(1 + swing / width). The width
// is the angle at which the pull still kills — so a cone, a blast or a guided
// round is not only more forgiving, it is FASTER to fire, because you tap as
// soon as he is inside it. This is the lever PILLARS §4 leaves us: nothing may
// move the camera for you, but a weapon may ask less precision of your thumb.
const FITTS_A = 0.35, FITTS_B = 0.18;   // s, s/bit. THE GUESS — measure it
const SWING = 0.6;                      // rad, a typical turn from one man to the next
const BODY_W = 0.55, HEAD_W = 0.24;   // m, the hit widths
const CLEAR = 0.8;         // m you move to leave a single round's lane

// --- enemies: the shipped values (ENEMY_TYPES, main.js) -------------------
// d is the distance the fight is typically had at: from `engage` where the
// type has one, ~14 m (a 16 m room) where it does not.
const ENEMY_BASE = {
  gunner:       { aim: 0.55, cd: [0.9, 0.8], mul: 1,    pellets: 1, d: 14 },
  // RUSHER and KAMIKAZE both come at you, and both get harder by NUMBERS:
  // how many, and how tightly their timers are staggered (`gap`, seconds
  // between one setting off and the next). See rush().
  rusher:       { speed: 3.4, d: 14, melee: true, gap: 0.9 },
  // proposed (docs/ARSENAL.md §8): a separate type with its own body — he
  // arms inside R and bursts after `fuse`. `count` is how many a room holds.
  kamikaze:     { speed: 4.2, d: 12, melee: true, R: 3.5, fuse: 0.5, count: 5, gap: 0.35 },
  // proposed (docs/ARSENAL.md §10): the floor-1 boss's kind. He reads the
  // trigger and BLINKS `blinkR` to a side you cannot know, then cannot blink
  // again for `blinkCd`. He fires like a gunner. Scales by how many.
  // Mk I recovers in 1.2 s: the Keeper's second phase, and the cooldown at
  // which only a cone re-aims fast enough on foot. After slow time, the
  // world-clock cooldown can be outwaited frozen: you took his time, and his
  // kin are what it is for.
  blinker:      { aim: 0.55, cd: [1.2, 0.8], mul: 1, pellets: 1, d: 10, blinkR: 1.5, blinkCd: 1.2, count: 1 },
  shotgunner:   { aim: 0.65, cd: [1.6, 0.9], mul: 0.85, pellets: 5, spread: 0.09, d: 8 },
  shieldbearer: { aim: 0.7,  cd: [1.6, 1.0], mul: 1,    pellets: 1, d: 12, shielded: true },
  heavy:        { aim: 0.55, cd: [1.8, 1.0], mul: 1,    pellets: 1, burst: 3, d: 14 },
  sniper:       { aim: 1.35, cd: [2.4, 1.0], mul: 2.3,  pellets: 1, d: 22 },
  bomber:       { aim: 0.8,  cd: [2.4, 1.2], mul: 0.6,  pellets: 1, d: 9, splash: 2.2 },
  armored:      { aim: 0.6,  cd: [1.2, 0.8], mul: 1,    pellets: 1, d: 12, headOnly: true },
  rocketeer:    { aim: 1.0,  cd: [3.4, 1.4], mul: 0.7,  pellets: 1, d: 13, guided: 2.0 },
  laser:        { aim: 2.6,  cd: [5.0, 1.5], d: 20, sweep: true },
};

// --- THE ENEMY LADDER (proposal) ------------------------------------------
// Each Mk moves ONE axis and names it. The weapon he drops at that Mk answers
// the SAME axis — that pairing is the whole design.
export const ENEMY_MK = {
  // GUNNER: NOT CADENCE. A gunner who fires more often changes nothing while the
  // room's shot clock is the binding limit — measured, identical P at door 12
  // — and the clock binds until about door 20. What the clock does not cap is
  // how fast the round travels once it is fired.
  // And not raw velocity either, until the rounds are fast: at door 13 a
  // round 1.4x faster is still walkable. What bites early is two of them
  // firing TOGETHER — the same shape the slow-time school teaches with.
  gunner: [null,
    { axis: 'pairs',    volley: 2, cd: [2.4, 1.2] },          // fire with a partner — less often, together
    { axis: 'pairs',    volley: 2, cd: [1.8, 1.0], mul: 2.0 },  // ...and the rounds are fast
  ],
  // the rusher's timers tighten and he gets quicker; the pack is the door's
  rusher: [null,
    { axis: 'numbers',  speed: 4.4, gap: 0.4 },
    { axis: 'numbers',  speed: 5.0, gap: 0.25 },
  ],
  // the kamikaze's pack grows and its timers tighten
  kamikaze: [null,
    { axis: 'numbers',  count: 6, gap: 0.3, R: 4.5, speed: 4.6 },
    { axis: 'numbers',  count: 7, gap: 0.25, speed: 5.0, fuse: 0.4 },
  ],
  // blinkers come in more at a time, and recover faster
  blinker: [null,
    { axis: 'numbers',  count: 2 },
    { axis: 'numbers',  count: 3, blinkR: 1.8 },
  ],
  shotgunner: [null,
    { axis: 'pattern',  pellets: 7, spread: 0.13, d: 10 },    // wider, and from further
    { axis: 'pattern',  pellets: 7, spread: 0.12, d: 11, burst: 2 },  // both barrels
  ],
  shieldbearer: [null,
    { axis: 'coverage', flankM: 5 },                          // turns faster: a longer walk round
    { axis: 'coverage', flankM: 7, cd: [1.1, 0.8] },
  ],
  heavy: [null,
    { axis: 'burst',    burst: 5 },
    { axis: 'burst',    burst: 6, cd: [1.4, 0.8] },
  ],
  sniper: [null,
    { axis: 'reach',    aim: 1.1, mul: 3.6 },                 // a round you cannot walk out of
    { axis: 'reach',    aim: 0.7, mul: 5.0, d: 26 },
  ],
  bomber: [null,
    { axis: 'area',     splash: 3.0, cd: [2.1, 1.1] },
    { axis: 'area',     splash: 3.0, cd: [2.1, 1.1], burst: 2 },  // two lobs
  ],
  armored: [null,
    { axis: 'advance',  cd: [0.8, 0.6], speed: 2.2 },         // fires on the move, and closes
    { axis: 'advance',  cd: [0.5, 0.4], speed: 3.2, d: 9 },
  ],
  rocketeer: [null,
    { axis: 'tracking', guided: 2.6, cd: [2.8, 1.2] },
    { axis: 'tracking', guided: 2.6, cd: [2.6, 1.2], burst: 2 },   // a pair
  ],
  laser: [null,
    { axis: 'charge',   aim: 2.0 },
    { axis: 'charge',   aim: 1.6, d: 24 },
  ],
};

// --- THE WEAPON LADDER (proposal) -----------------------------------------
// What the Mk N carrier drops. Mk I is the shipped weapon, untouched.
// Every Mk II and Mk III carries two things: a STAT on the axis (more pierce,
// a wider cone, a longer burst) and a TRAIT on the threat side (stagger,
// shatter, a broken charge). The model is why: the stat alone buys 10-15%,
// because the slow part of a kill is the aim, not the shot. "That enemy got
// easier" needs the trait.
export const WEAPON_MK = {
  pistol: [null,
    { axis: 'pairs',    pierce: 2, mag: 7, shatter: 0.5 },   // off a Mk II gunner: through one into the next,
                                                              // and a round that can break his
    { axis: 'pairs',    pierce: 3, mag: 8, shatter: 0.65, burst: 2, sweep: true },
  ],
  shotgun: [null,
    { axis: 'pattern',  pellets: 9, spread: 0.07, mag: 3, stagger: true },   // a fuller cone that knocks the next man off his aim
    { axis: 'pattern',  pellets: 12, spread: 0.08, mag: 4, cd: 0.35, stagger: true, shatter: 0.4 },  // ...that swats pellets too
  ],
  // ARMOUR-PIERCING: the armored man's own rounds. Mk I is the shipped burst
  // rifle with one change that matters — body hits crack plate. (Measured: the
  // shipped burst is WORSE than the pistol against armored, because its spread
  // spoils the headshot that is the only way through. His drop should be the
  // answer to him.)
  ap: [null,
    { axis: 'advance',  burst: 4, stagger: true },            // a hit on plate rocks him back
    { axis: 'advance',  burst: 5, pierce: 2, cd: 0.4, stagger: true, shatter: 0.3 },
  ],
  burst: [null,
    { axis: 'burst',    burst: 4, spread: 0.008, shatter: 0.4 },    // a burst can meet a burst
    { axis: 'burst',    burst: 5, spread: 0.006, pierce: 2, shatter: 0.55 },
  ],
  sniper: [null,
    { axis: 'reach',    pierce: 5, mag: 3, cd: 0.6, shatter: 0.7 },
    { axis: 'reach',    pierce: 5, mag: 3, cd: 0.45, shatter: 0.85, stopsCharge: true },  // a hit breaks a charge
  ],
  launcher: [null,
    { axis: 'area',     blast: 8, cd: 0.5, stagger: true, shatter: 0.2 },   // the blast knocks survivors off their aim, and his lobs out of the air
    { axis: 'area',     blast: 8, cd: 0.45, mag: 3, burst: 2, sweep: true, stagger: true, shatter: 0.45 },  // two lobs, like his
  ],
  rocket: [null,
    { axis: 'tracking', guided: true, cd: 0.8, stagger: true },   // steers onto the crosshair
    { axis: 'tracking', guided: true, burst: 2, sweep: true, mag: 3, cd: 0.7, stagger: true, shatter: 0.45 },  // a pair, like his
  ],
};

// Who drops what. Rusher, shield and laser carry nothing — they are the
// questions another man's weapon answers, which is itself kill order: the
// shield is a reason to take the bomber first and pick up his launcher.
const DROPS_FROM = {
  gunner: 'pistol', shotgunner: 'shotgun', heavy: 'burst', armored: 'ap',
  sniper: 'sniper', bomber: 'launcher', rocketeer: 'rocket',
};
// The laser anchors — he does not strafe — so the rifle's lead advantage is
// worth nothing against him; the rocket's guidance and blast is what reaches.
const ANSWERED_BY = { rusher: 'shotgun', kamikaze: 'shotgun', blinker: 'shotgun', shieldbearer: 'launcher', laser: 'rocket' };

// --- THE SCHEDULE (proposal): five floors, every Mk debut on its door ------
// FLOOR CASTS (decided). Each floor has its own new types; gunners run
// through every floor; types from earlier floors come back as GUESTS at a
// higher Mk. A floor's first door (after floor 1) is the warm-up: no debut.
// A gauntlet slot is written as the floor's last door + 0.5.
//
// EVERY FLOOR ENDS IN A BOSS (decided), and each boss is the debut of the
// next floor's hardest type: the boss is the big version, and the next floor
// fills with ordinary ones. The fourth field marks a boss.
//
//   G1  THE KEEPER — the first BLINKER. His death gives you slow time.
//   G2  the first FRANKENSTEIN — both arms, then the rush, all at once
//   G3  the first DRONE — a spotter the size of a car, marking you for a room
//   G4  the first SPAWNER — dishes to break while its guards are down
//   G5  the finale: the Keeper again, with slow time of his own (to decide)
//
// Slow time is still door 10, where powerUnlockDoor() puts it: floor 1 is the
// shipped opening (gunner 1, rusher 4, shotgunner 6, shield 8) and the Keeper
// ends it. --schedule checks the two stay together.
//
//   floor 1  gunner, rusher, shotgunner, shield        boss: blinker (the Keeper)
//   floor 2  heavy, sniper, bomber (+ blinkers)        boss: Frankenstein
//   floor 3  armored, rocketeer (+ Frankensteins)      boss: drone
//   floor 4  kamikaze (+ drones)                       boss: spawner
//   floor 5  laser (+ spawners)                        boss: the finale
//
// DRONE AND SPAWNER ARE SEPARATED (decided): both are supports you choose to
// kill first, so they are not introduced on the same floor. The drone comes
// first; its ordinary Mk I is a spotter that HOVERS.
export const FLOORS = [9, 7, 7, 7, 9];     // doors per floor; an elevator boss after each
export const DEBUTS = [
  // floor 1 — doors 1-9, the shipped opening. Odd doors carry protocols.
  [1, 'gunner', 1], [4, 'rusher', 1], [6, 'shotgunner', 1], [8, 'shieldbearer', 1],
  [9.5, 'blinker', 1, 'boss'],
  // floor 2 — doors 10-16. 10 is slow time's first room and the warm-up. The
  // shotgun's Mk II arrives before the rusher's Mk II it answers — on 12, not
  // 9: before slow time the room fires so seldom that a wider pattern changes
  // nothing (measured). The sniper comes before gunner Mk II: the Mk II
  // pistol out-guns a Mk I rifle, and a weapon has to be the best answer on
  // the day it lands.
  [11, 'heavy', 1], [12, 'shotgunner', 2], [13, 'sniper', 1], [15, 'bomber', 1],
  [16, 'rusher', 2], [16.5, 'frankenstein', 1, 'boss'],
  // floor 3 — doors 17-23. The armored man also comes before gunner Mk II
  // (measured: AP Mk I barely beats pistol Mk II). Gunner Mk II is after the
  // slow-time school (10-19): his axis is "fire together", which the school
  // already does to the room (measured: invisible inside it).
  [18, 'armored', 1], [19, 'shieldbearer', 2], [20, 'heavy', 2], [21, 'gunner', 2],
  [22, 'rocketeer', 1], [23, 'bomber', 2], [23.5, 'drone', 1, 'boss'],
  // floor 4 — doors 24-30
  [25, 'kamikaze', 1], [26, 'shotgunner', 3], [27, 'sniper', 2], [28, 'blinker', 2],
  [29, 'frankenstein', 2], [30, 'rusher', 3], [30.5, 'spawner', 1, 'boss'],
  // floor 5 — doors 31-39
  [32, 'laser', 1], [33, 'gunner', 3], [34, 'armored', 2], [35, 'rocketeer', 2],
  [36, 'kamikaze', 2], [37, 'drone', 2], [38, 'heavy', 3], [39, 'frankenstein', 3],
  [39.5, 'blinker', 3, 'boss'],
];
// THE DOOR BUDGET. Fourteen types at up to three Mks is ~40 debuts, and five
// floors of one-new-thing doors hold ~40 slots — before the protocols take
// theirs. So a type's Mk count is how long it has been on the floors: the
// floor-1 cast and the heavy reach Mk III inside a run, Frankenstein's Mk III
// is part of his design, and everyone else tops out at Mk II. Their Mk IIIs
// (the ENEMY_MK rows below) are for past the fifth floor — a Heat-style
// mode (TUNNEL_META.md §2e) — and the ladder does not schedule them.
//
// Types the ladder cannot price in a room of their own — a spotter fires
// nothing, Frankenstein and the spawner are multi-stage — are priced by
// --newcomers and --spawner instead, and checked here only by --schedule.
const LADDERED = (type) => type in ENEMY_BASE;

// What each non-laddered debut needs already on the floor (weapon, Mk).
// Where a man's answer changes with his Mk. One blinker is a punish, and the
// cone re-aims fastest; a PACK of them is a blast wider than their blink —
// while you bait one, the other is firing (measured: the shotgun's relief on
// two blinkers is a step too far).
const ANSWERED_AT = { 'blinker:2': 'launcher', 'blinker:3': 'launcher' };
// After each boss, the next floor fills with ordinary ones of his kind.
const POPULATES = { blinker: 2, frankenstein: 3, drone: 4, spawner: 5 };
const NEEDS = {
  'frankenstein:1': ['launcher', 1],   // his boss fight is the full kit: both arms in one aim
  'shieldbearer:2': ['launcher', 1],   // over the plate (the ladder: the Mk I launcher is enough)
  'frankenstein:2': ['launcher', 1],   // both arms in one aim
  'frankenstein:3': ['launcher', 1],
  'drone:2': ['shotgun', 2],           // a jinking head-sized target: a cone
  'spawner:1': ['launcher', 1],        // guards cleared inside the window
};

// --- building the specs ----------------------------------------------------
function enemy(type, mk) {
  const s = { type, mk, head: HEAD_W, flankM: 3, burst: 1, ...ENEMY_BASE[type] };
  for (let i = 1; i < mk; i++) Object.assign(s, ENEMY_MK[type][i]);
  return s;
}
function weapon(type, mk) {
  // Mk I is the shipped weapon, with the one change its row in docs/ARSENAL.md
  // names: the burst rifle's rounds walk across a line of men (`sweep`), and
  // the armored man's copy of it cracks plate (`ap`), and the rifle can shoot a
// round out of the air (`shatter`).
  const base = type === 'ap' ? { ...WEAPONS.burst, ap: true, sweep: true }
    : type === 'burst' ? { ...WEAPONS.burst, sweep: true }
    // the shipped rifle is barely better than the pistol against the man who
    // drops it (measured) — its lead advantage is small at 22 m. So its Mk I
    // trait: his round is a line, and so is yours. Shoot it out of the air.
    : type === 'sniper' ? { ...WEAPONS.sniper, shatter: 0.4 } : WEAPONS[type];
  const s = { type, mk, pellets: 1, spread: 0, burst: 1, blast: 0, pierce: 1, ...base };
  for (let i = 1; i < mk; i++) Object.assign(s, WEAPON_MK[type][i]);
  return s;
}
const MK = (n) => 'Mk ' + ['I', 'II', 'III'][n - 1];

// --- killing him -------------------------------------------------------------
function erf(x) {  // Abramowitz-Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496735) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
// LEADING HIM. A man strafing at STRAFE m/s moves while your round is in the
// air, and the part of that you misjudge is error. It does not depend on range
// — both the travel time and the angle scale with it — only on how fast your
// round is: 46 m/s pistol, 95 m/s rifle. This is what makes the rifle the rifle.
const STRAFE = 1.3;
function lead(e, w) {
  if (e.melee || w.guided || w.beam || !w.speed) return 0;   // he comes straight at you; a beam arrives now
  return 0.4 * (e.strafe ?? STRAFE) / w.speed;
}

// WHAT YOU ARE AIMING AT, and how steady the aim is. A plate or a riot shield
// leaves `exposed` of his width to shoot; a zoomed rifle divides the thumb's
// error by the zoom, and can take the eye slot (`slot`, metres) that nothing
// else can. `bodyW` is a slighter frame.
function aimTarget(e, w) {
  const zoom = w.zoom || 1;
  let width = e.headOnly && !w.ap ? e.head : (e.bodyW ?? BODY_W) * (e.exposed ?? 1);
  if (w.zoom && e.slot) width = Math.max(width, e.slot);
  const sigma = Math.hypot(AIM_SIGMA / zoom, w.spread, lead(e, w));
  return { width, sigma };
}
// Chance one trigger pull kills him. Each pellet (or burst round) is an
// independent draw on a gaussian around the aim point; a blast widens the
// target by some of its radius; a guided round widens it three times over.
// An armored head is a precision shot: only the aimed round of a spread can
// take it, though every round of a burst is aimed.
function pKill(e, w) {
  const headOnly = e.headOnly && !w.ap;
  const { width, sigma } = aimTarget(e, w);
  let half = Math.atan((width / 2 + w.blast * 0.3) / e.d);
  if (w.guided) half *= 3;
  if (w.beam) half += w.beam;                              // held on him, not tapped at him
  const p1 = erf(half / (sigma * Math.SQRT2));
  const n = headOnly && !w.blast ? w.burst : w.pellets * w.burst;
  return 1 - Math.pow(1 - p1, n);
}
function acquire(e, w) {
  const { width } = aimTarget(e, w);
  let half = Math.atan((width / 2 + w.blast * 0.3) / e.d);
  if (w.pellets > 1) half += w.spread * 1.2;
  if (w.guided) half *= 3;
  // A BEAM IS CROSSED, NOT POINTED. Dragging a line through a man is a
  // crossing task, and crossing is much faster than pointing: the width that
  // counts is the beam's, along the drag.
  if (w.beam) half += w.beam;
  // a zoom magnifies him — but settling it takes its own moment
  const zoomIn = w.zoom ? w.zoomT : 0;
  // `swing` is further for a man you have to look UP to — a drone overhead
  return FITTS_A + FITTS_B * Math.log2(1 + (e.swing ?? SWING) / (2 * half * (w.zoom || 1))) + zoomIn;
}

// HOW MANY MEN ONE AIM TAKES. This is the finding the model exists for: at
// these ranges the pistol already kills with ~95% of its pulls, so a weapon
// that fires faster or tighter barely moves a thing — the slow part of a kill
// is not the shot, it is swinging onto the next man and settling (acquire).
// In a one-hit game a weapon gets stronger by killing MORE THAN ONE MAN PER
// AIM. Deep portrait rooms line men up (PILLARS §5), so pierce pays; a cone
// or a blast pays on a group; a burst that walks across a line pays. k is how
// many of him are still standing.
function perAim(e, w, k) {
  if (k <= 1) return 1;
  // A RUSH IS A LINE OR A CLUMP, and its stagger decides which: men who set
  // off `gap` apart run gap x speed metres apart. A cone, blast or beam takes
  // a clump (within ~2 m) and a man at a time from a line. Pierce does the
  // opposite — a line coming straight at you is exactly what it is for.
  const clump = e.melee && e.gap ? Math.min(1, 2 / (e.gap * e.speed + 0.01)) : 1;
  let extra = 0;
  if (w.pierce > 1) extra += Math.min(w.pierce, k) - 1 > 0 ? (Math.min(w.pierce, k) - 1) * 0.35 : 0;
  if (w.pellets > 1) {
    const at = e.melee ? e.d / 2 : e.d;                     // you meet a rusher halfway
    const cone = 2 * at * Math.tan(w.spread * 2);           // metres the pattern covers
    extra += Math.min(k - 1, cone / 1.5) * 0.5 * clump;       // men ~1.5 m apart
  }
  if (w.blast) extra += Math.min(k - 1, w.blast / 2.5) * 0.5 * clump;
  if (w.sweep && w.burst > 1) extra += (Math.min(w.burst, k) - 1) * 0.3;
  // a ricochet finds the next man for you — no line-up needed, unlike pierce
  if (w.ricochet) extra += Math.min(k - 1, w.ricochet) * 0.6;
  // a beam dragged across a group takes whoever it crosses
  if (w.beam) extra += Math.min(k - 1, 2) * 0.5 * clump;
  // a zoom is tunnel vision: one man at a time, whatever the round does after
  if (w.zoom) extra = 0;
  return 1 + extra;
}
// World seconds from turning to him to his shards hitting the floor, and the
// rounds it cost. A burst weapon's magazine is counted in bursts.
// HE SEES IT COMING. A dodger sidesteps any round that takes longer than his
// reaction (`react`, world seconds) to reach him — and YOUR ROUNDS ARE ON THE
// WORLD CLOCK TOO (updateBullets(sdt) in main.js), so freezing time does not
// beat him: both slow together. Three things do. A round faster than his
// reaction. A blast, beam or guided round, which a sidestep does not escape.
// Or timing: while he is aiming (`aim` of his `cycle`) he is committed and
// cannot move, so a player who waits for the telegraph lands every round —
// at the cost of the wait. The player takes whichever is cheaper.
function dodged(e, w) {
  if (!e.react || w.beam || w.blast || w.guided) return null;
  const travel = e.d / w.speed;
  if (travel <= e.react) return null;
  const cycle = e.aim + e.cd[0] + e.cd[1] / 2;
  return { committed: e.aim / cycle, wait: (cycle - e.aim) / 2 };
}
function killCost(e, w, k = 1) {
  // A BLINKER (see --boss for the full model): bait the blink, then punish
  // inside his cooldown. The punish is REACT + a swing onto where he went +
  // the round's flight. On foot it lands if that fits in `blinkCd`. After the
  // unlock (`canFreeze`) the shortfall can be bought frozen — his cooldown runs
  // on the world clock, your swing does not — and it is paid in bank. Before
  // it, the fallback is the bracket: a coin flip per attempt. A blast wider
  // than his blink, or a guided round, does not care that he moved.
  if (e.blinkR && !(w.blast >= e.blinkR) && !w.guided) {
    const half = (e.bodyW ?? BODY_W) / 2;
    const cone = w.pellets > 1 ? 2 * e.d * w.spread : 0;
    const swing = FITTS_A + FITTS_B * Math.log2(1 + e.blinkR / (2 * half + cone));
    const travel = w.beam || !isFinite(w.speed) ? 0 : e.d / (w.speed || 46);
    const punish = REACT + swing + travel;
    const bait = acquire(e, w);
    if (punish <= e.blinkCd) return { t: bait + punish, rounds: 2 * w.burst, p: 1, freeze: 0 };
    if (e.canFreeze) return { t: bait + e.blinkCd, rounds: 2 * w.burst, p: 1, freeze: punish - e.blinkCd };
    return { t: 2 * (bait + 2 * swing), rounds: 6 * w.burst, p: 0.5, freeze: 0 };
  }
  let p = pKill(e, w);
  let wait = 0;
  const dg = dodged(e, w);
  if (dg) {
    const spam = 1 / (p * dg.committed) * w.cd;           // fire until one lands in his window
    if (spam < dg.wait) p *= dg.committed; else wait = dg.wait;
  }
  const pulls = 1 / p;
  let t = acquire(e, w) + wait + (pulls - 1) * w.cd;
  if (isFinite(w.mag)) t += Math.max(0, pulls - w.mag) / w.mag * w.reload;
  // the plate: walk round it, unless the weapon goes over it
  if (e.shielded && !w.blast) t += e.flankM / MOVE;
  const a = perAim(e, w, k);
  return { t: t / a, rounds: pulls * w.burst / a, p };
}

// --- being shot at --------------------------------------------------------------
// The room's shot clock — shotGap() in main.js, outside the school.
function gapAt(door) {
  const t = Math.max(0, Math.min(1, (door - OPENING.gapDoors) / Math.max(1, OPENING.gapBy - OPENING.gapDoors)));
  return OPENING.gapFrom + (OPENING.gapTo - OPENING.gapFrom) * t;
}
// The school's volleys: on its doors, this many fire together.
function volleyOn(door) {
  const i = door - powerUnlockDoor();
  return i >= 0 && i < SPEED.schoolDoors ? Math.max(1, volleyAt(i)) : 1;
}
// How many of him you meet at once IN HIS SHOWCASE ROOM — the room his Mk
// debuts in, a wave of him and only him: the door's biggest group, capped at
// SHOWCASE. A laser is always alone, snipers come in pairs, and rushers — who
// are cheap and are only a problem as a pack — come as the door's whole group. (TYPE_SHARE's
// caps are for MIXED rooms and are lower; see --waves for those.)
const SHOWCASE = 4;
function groupOf(type, door) {
  if (type === 'laser') return 1;
  const big = doorEncounters(door)[0];
  const cap = type === 'sniper' ? 2 : type === 'rusher' ? 7 : SHOWCASE;
  return Math.max(1, Math.min(big, cap));
}
// One volley: the real seconds it takes to see it leave and step clear of it,
// and how long it is in the air.
function volleyNeed(e, door) {
  const flight = e.d / (speedAt(door) * (e.mul || 1));
  let clear = CLEAR;
  if (e.pellets > 1) clear += e.d * Math.tan(e.spread) * 0.9;
  if (e.splash) clear = Math.max(clear, e.splash);
  if (e.guided) clear = Math.max(clear, e.guided);
  clear *= 1 + 0.3 * (e.burst - 1);   // a burst's lane follows you
  const need = REACT + clear / MOVE;
  // A ROUND YOU CANNOT WALK OUT OF IS A HARDER DODGE than one you can: it is
  // a freeze, a read and a step instead of a step. It starts to bite once the
  // flight is inside half again what the dodge needs.
  const effort = need * (1 + 1.5 * Math.max(0, Math.min(2, 1.5 * need / flight - 1)));
  return { need, flight, effort };
}

// AN ENCOUNTER: G of him, killed one at a time. While k stand they fire at
// k / cycle, throttled by the room clock — except in the school, where the
// clock releases them in volleys. Time you spend dodging is time you are not
// shooting, so a busy room stretches every kill (t / (1 - load)); that is
// what makes a group more than the sum of its men.
function matchup(e, w, door, group) {
  if (e.blinkR) e = { ...e, canFreeze: door >= powerUnlockDoor() };
  const G = group ?? e.count ?? groupOf(e.type, door);
  const { t, rounds, p } = killCost(e, w, G);
  const drain = TIME.drain * scarcity('timeDrain', door);
  let P = 0, bank = 0, extraRounds = 0;
  if (e.melee) {
    const r = rush(e, w, door, G, e.R || 0, e.fuse || 0);
    P = r.P; bank = r.bank;
  } else if (e.sweep) {
    // he is the clock too: kill him inside the charge or finish it frozen
    const charge = e.aim * (w.stopsCharge ? 1.6 : 1);
    P = Math.max(0.2, t / charge) * 1.5;
    bank = Math.max(0, t - charge) * drain * 2;
  } else {
    const cycle = e.aim + e.cd[0] + e.cd[1] / 2;
    const { need, flight, effort } = volleyNeed(e, door);
    const v = Math.max(volleyOn(door), e.volley || 1);
    // STAGGER: a blast or a cone that kills one man knocks the men beside him
    // off their aim, so they start their telegraph again. SHATTER: your round
    // breaks his in the air — a volley answered with a round instead of a
    // step, which turns dodging into ammo, which is PILLARS §2's currency.
    const stag = w.stagger ? 0.7 : 1;
    const sh = w.shatter || 0;
    for (let k = G; k >= 1; k--) {
      const rate = Math.min(k / cycle, v / gapAt(door)) * (k < G ? stag : 1);
      const load = Math.min(0.85, rate * need);
      const tk = killCost(e, w, k).t / (1 - load);
      const vol = rate * tk;                        // rounds he gets off before he drops
      const together = Math.min(v, k);
      const own = flight < need ? 1 : 0;
      const overlap = together > 1 ? 1 : (k > 1 ? 1 - Math.exp(-rate * need) : 0);
      P += vol * together * ((1 - sh) * effort + sh * 0.25);
      bank += vol * together * ((1 - sh) * Math.max(own, overlap) * need + sh * 0.25) * drain;
      extraRounds += vol * together * sh;
    }
  }
  // a blinker punished frozen: the part of the swing his cooldown did not cover
  if (e.blinkR) bank += (killCost(e, w, G).freeze || 0) * G * drain;
  const refund = TIME.bonus * scarcity('timeGain', door);
  return { P: P / G, R: bank / (G * refund), rounds: rounds + extraRounds / G, t, p, G };
}

// --- the ladder check ----------------------------------------------------------
// The Mk of each weapon lying on the floors by `door`: the highest Mk any of
// its carriers has reached. The pistol is always there.
function arsenalAt(door) {
  const have = { pistol: 1 };
  for (const [dd, type, mk] of DEBUTS) {
    if (dd > door) continue;
    const wt = DROPS_FROM[type];
    if (wt) have[wt] = Math.max(have[wt] || 1, mk);
  }
  return have;
}

function ladder() {
  const rows = [];
  let fails = 0;
  for (const [door, type, mk] of DEBUTS) {
    if (!LADDERED(type)) continue;
    const E = enemy(type, mk);
    const before = arsenalAt(door - 0.5), after = arsenalAt(door);
    const own = !!DROPS_FROM[type];
    const rt = own ? DROPS_FROM[type] : (ANSWERED_AT[`${type}:${mk}`] || ANSWERED_BY[type]);
    // STRUGGLE: a debut is met with the pistol — you have never seen his gun.
    // A new Mk is met with his gun one Mk down, the thing you have been
    // winning with. A man who carries nothing is always met with the pistol:
    // his answer is somebody else's gun, and whether you have it is kill order.
    const sw = mk === 1 || !own ? ['pistol', before.pistol] : [rt, before[rt] || 1];
    const struggle = matchup(E, weapon(...sw), door);
    const rw = own || rt in after ? [rt, after[rt] || 1] : sw;
    const relief = matchup(E, weapon(...rw), door);
    // THE SAME DOOR. Comparing a Mk II at door 23 with the Mk I you met at
    // door 11 mixes the Mk up with twelve doors of bullet speed, shot clock
    // and group size. So the last Mk is re-fought HERE, with its own weapon:
    // that is the fight you were comfortable in, at today's prices.
    const ok = {};
    // a debut whose answer is not on the floor yet is met with the pistol and
    // footwork, on purpose: it is a lesson, not a matchup (rusher, door 3)
    const answerHere = own || rt in after;
    if (door > 1 && answerHere) ok.relief = relief.P <= 0.75 * struggle.P;
    let prev;
    if (mk > 1) {
      const wasW = own ? weapon(rt, mk - 1) : weapon(rt, before[rt] || 1);
      prev = matchup(enemy(type, mk - 1), wasW, door).P;
      ok.felt = struggle.P >= 1.25 * prev;
      ok.caughtUp = relief.P >= 0.7 * prev && relief.P <= 1.35 * prev;
    }
    const bad = Object.entries(ok).filter(([, v]) => !v).map(([k]) => k);
    if (bad.length) fails++;
    rows.push({ door, who: `${type} ${MK(mk)}`, axis: mk > 1 ? ENEMY_MK[type][mk - 1].axis : 'debut',
      speed: speedAt(door).toFixed(1), G: struggle.G,
      sw: `${sw[0]} ${MK(sw[1])}`, sP: struggle.P, sR: struggle.R,
      rw: `${rw[0]} ${MK(rw[1])}${own ? '' : '*'}`, rP: relief.P, rR: relief.R,
      rds: relief.rounds, prev, check: bad.length ? 'MISS ' + bad.join(',') : 'ok' });
  }
  const f = (x) => x.toFixed(2).padStart(5);
  const pad = (v, n) => String(v).padEnd(n);
  console.log('door | enemy              | axis     | m/s  | x | last Mk | struggle with     |   P  |   R   | relief with        |   P  |   R   | rds | check');
  for (const r of rows) {
    console.log(`${doorLabel(r.door).padStart(4)} | ${pad(r.who, 18)} | ${pad(r.axis, 8)} | ${r.speed.padStart(4)} | ${r.G} | ${r.prev === undefined ? '      - ' : f(r.prev) + '   '} | ${pad(r.sw, 17)} |${f(r.sP)} | ${f(r.sR)} | ${pad(r.rw, 18)} |${f(r.rP)} | ${f(r.rR)} | ${r.rds.toFixed(1).padStart(3)} | ${r.check}`);
  }
  console.log('\nP = seconds of dodging per kill.  R = bank spent per kill / bank a kill refunds.');
  console.log('x = how many of him at once.  * carries nothing: answered by another man\'s weapon.');
  console.log(`${rows.length - fails}/${rows.length} Mk debuts inside the bands`);
  return fails;
}

// --- the kill-order check ------------------------------------------------------
// A wave's cost depends on the order you take it in: every man fires until he
// is dead, so the bill is sum(threat_i x time_i_is_alive) — the weighted-
// shortest-job problem. Its textbook answer (Smith's rule: descending threat /
// time-to-kill) stops being the answer the moment a kill hands you a better
// gun, so the best order is found by trying every one (a wave is six men at
// most: 720 orders). A RECIPE is good when the best order is NOT the order a
// player takes men in by default — nearest first — and is at least x1.30
// cheaper in dodging.
//
// [type, count, Mk, distance]. `w` is what you walk in holding.
export const WAVES = {
  // A SCREEN ONLY WORKS IF IT IS EXPENSIVE. Measured: behind three gunners,
  // no anchor — Mk II sniper, Mk III heavy, Mk II rocketeer — is ever worth
  // shooting first (x1.00-1.07): quick kills are always right to take first,
  // so a cheap screen is a warm-up, not a question. Plates are the screen that
  // asks it — every second walking round one is a second the pair behind it
  // is firing together.
  'plated screen':     { door: 24, w: ['pistol', 2], mix: [['shieldbearer', 2, 2, 8], ['gunner', 2, 2, 14]] },
  // a clock at the back of the room, a plate at the front
  'the clock':         { door: 33, w: ['pistol', 3], mix: [['laser', 1, 1, 22], ['shieldbearer', 1, 1, 10], ['gunner', 2, 2, 12]] },
  // the rushers are the clock, and they start furthest away
  'close pressure':    { door: 19, w: ['shotgun', 2], mix: [['gunner', 2, 1, 7], ['rusher', 3, 2, 16]] },
  // the answer to the plates is carried by the man behind them
  'take his gun':      { door: 20, w: ['pistol', 1], mix: [['shieldbearer', 2, 2, 8], ['bomber', 1, 1, 13], ['gunner', 2, 1, 10]] },
  // A kamikaze is a clock, and a clock only asks a question when something
  // else is competing for the aim.
  'kamikaze in the crowd': { door: 36, w: ['pistol', 3], mix: [['gunner', 2, 2, 9], ['kamikaze', 2, 2, 16]] },
  // a spotter fires nothing: while it is up every other man leads you
  'the spotter':       { door: 29, w: ['pistol', 2], mix: [['gunner', 3, 2, 9], ['drone', 1, 1, 11]] },
};
// proposed types, built from a gunner with their traits: not in ENEMY_BASE
// because nothing on the ladder uses them yet
const PROPOSED = {
  // a spotter HOVERS to watch — the jinking is the Mk II that shoots.
  // Measured: a spotter that jinks like the Mk II is so slow to hit that the
  // gunners stay the right first target (x1.00), and the spotter asks nothing.
  // And its mark has to be STRONG: at +50% on everyone else's dodge it sorts
  // first but saves nothing (x1.03); at +100% it is the question (x1.34).
  drone:    { bodyW: 0.3, strafe: 0.8, swing: 0.9, spotter: 1.0 },
};
function threatRate(e, door) {
  if (e.threat !== undefined) return e.threat;
  // A KAMIKAZE IS A DEADLINE, not a rate: the escape run he forces, spread
  // over the time until he arrives
  if (e.melee && e.R) return (REACT + (e.R + 0.5) / MOVE) * 1.5 / ((e.d - e.R) / e.speed);
  if (e.melee) return (REACT + CLEAR / MOVE) * e.speed / e.d * 3;   // he is coming whether you look or not
  if (e.sweep) return 3 / e.aim;
  const cycle = e.aim + e.cd[0] + e.cd[1] / 2;
  const { effort } = volleyNeed(e, door);
  return effort * (e.volley || 1) / cycle;
}
function waveCost(order, door, W0) {
  let clock = 0, bill = 0, W = W0;
  for (const e of order) {
    clock += killCost(e, W).t;
    bill += threatRate(e, door) * clock;
    // pick up what he drops if it is his answer to anyone still standing
    const wt = DROPS_FROM[e.type];
    if (wt && wt !== W.type) W = weapon(wt, e.mk);
  }
  return bill;
}
function* perms(a, n = a.length) {
  if (n <= 1) { yield a.slice(); return; }
  for (let i = 0; i < n; i++) {
    yield* perms(a, n - 1);
    const j = n % 2 ? 0 : i;
    [a[j], a[n - 1]] = [a[n - 1], a[j]];
  }
}
function waves() {
  let weak = 0;
  for (const [name, { door, w, mix }] of Object.entries(WAVES)) {
    const W = weapon(...w);
    const men = [];
    for (const [type, n, mk, d] of mix) for (let i = 0; i < n; i++) {
      const e = PROPOSED[type] ? { ...enemy('gunner', 1), ...PROPOSED[type], type } : enemy(type, mk);
      men.push({ ...e, d, label: `${type}${mk > 1 ? ' ' + MK(mk) : ''}` });
    }
    // THE SPOTTER'S THREAT IS EVERYONE ELSE'S: while he is up, their rounds
    // lead you, so his rate is a share of the rest of the room's.
    for (const e of men) if (e.spotter) {
      e.threat = e.spotter * men.filter((o) => o !== e).reduce((a, o) => a + threatRate(o, door), 0);
    }
    const nearest = [...men].sort((a, b) => a.d - b.d);
    let best = null, bestCost = Infinity;
    for (const o of perms([...men])) {
      const c = waveCost(o, door, W);
      if (c < bestCost) { bestCost = c; best = o; }
    }
    const cn = waveCost(nearest, door, W);
    console.log(`\n${name} — door ${door}, walking in with ${w[0]} ${MK(w[1])}`);
    console.log(`  nearest first: ${nearest.map((e) => e.label).join(' > ')}`);
    console.log(`  best order:    ${best.map((e) => e.label).join(' > ')}`);
    // a recipe may only use what the schedule has put on the floors by then
    for (const [type, , mk] of mix) {
      if (!DEBUTS.some(([d, t, m]) => t === type && m >= mk && d <= door)) {
        console.log(`  MISS: ${type} ${MK(mk)} has not debuted by door ${door}`); weak++;
      }
    }
    const held = arsenalAt(door)[w[0]] || 0;
    if (held < w[1]) { console.log(`  MISS: ${w[0]} ${MK(w[1])} is not on the floors by door ${door}`); weak++; }
    const worth = cn / bestCost;
    if (worth < 1.3) weak++;
    console.log(`  the order is worth x${worth.toFixed(2)} in dodging${worth < 1.3 ? '   MISS: under x1.30, not a kill-order question' : ''}`);
  }
  return weak;
}

// --- the counter matrix ---------------------------------------------------------
// New ways for an enemy to get harder, against new ways for you to answer.
// Every row is a room of four of him at door 25 (a gunner underneath, so the
// rows differ only in the trait); every column is a weapon. Each cell is P,
// seconds of dodging per kill, and in brackets how that compares to the plain
// pistol against the same man. The column that turns a row from worst to best
// is that trait's answer.
export const TRAITS = {
  'plain gunner':  {},
  'slight frame':  { bodyW: 0.36 },                        // a smaller surface, no armour
  'riot shield':   { exposed: 0.2, slot: 0.12, strafe: 0.5 },  // braced behind a plate: an edge showing, and an eye slot
  'always moving': { strafe: 3.2 },                        // strafes the whole time, not just between shots
  'dodger':        { react: 0.22 },                        // sidesteps any round slower than his reaction
};
function answers() {
  return {
    'pistol':        weapon('pistol', 1),
    'ricochet':      { ...weapon('pistol', 1), ricochet: 1 },
    'shotgun cone':  weapon('shotgun', 2),
    'grenade blast': weapon('launcher', 1),
    'beam sweep':    { ...weapon('pistol', 1), type: 'beam', beam: 0.05, cd: 0.25, mag: 6, reload: 1.5, speed: Infinity },
    'rifle + zoom':  { ...weapon('sniper', 1), zoom: 3, zoomT: 0.3 },
  };
}
function matrix() {
  const door = 25;
  const W = answers();
  const cols = Object.keys(W);
  const pad = (v, n) => String(v).padEnd(n);
  // two rooms, because the answers split on it: a group at mid range, where
  // anything that takes more than one man per aim wins; and one man far off,
  // where only precision and round speed matter
  for (const [label, G, d] of [['four of him at 14 m', 4, 14], ['one of him at 24 m', 1, 24]]) {
    console.log(`\ndoor ${door}, ${label}. P = seconds of dodging per kill (x vs the pistol)`);
    console.log(pad('', 15) + cols.map((c) => pad(c, 15)).join(''));
    for (const [name, trait] of Object.entries(TRAITS)) {
      const e = { ...enemy('gunner', 1), d, ...trait };
      const base = matchup(e, W.pistol, door, G).P;
      const cells = cols.map((c) => {
        const P = matchup(e, W[c], door, G).P;
        return pad(`${P.toFixed(2)} (x${(P / base).toFixed(2)})`, 15);
      });
      console.log(pad(name, 15) + cells.join(''));
    }
  }
  // THE TIME BUTTON. The bank is priced per door by SCARCITY: what a kill
  // refunds over what a frozen second costs. It is already falling on its own.
  console.log('\nwhat the bank is worth (kill refund / freeze drain, door 1 = 1.00)');
  const worth = (d, gain = 1, drain = 1) => (scarcity('timeGain', d) * gain) / (scarcity('timeDrain', d) * drain);
  for (const d of [1, 6, 8, 12, 20, 30]) {
    console.log(`  door ${String(d).padStart(2)}: ${worth(d).toFixed(2)}` +
      `   with a -20% drain, +25% refund upgrade: ${worth(d, 1.25, 0.8).toFixed(2)}`);
  }
}

// --- the newcomers ------------------------------------------------------------------
// Three proposed types, priced against the same answers at door 25:
//
// KAMIKAZE — runs at you; alive inside `R` he arms (`fuse`, world seconds) and
// bursts. Kill him outside R, kill him during the fuse, or run R clear of him.
// The run is paid frozen: at 5.5 m/s, clearing a 3.5 m radius takes ~0.7 s
// of real time and a 0.5 s fuse does not wait for it.
//
// FRANKENSTEIN — plated head to foot, a gun in each hand, both fire together.
// Mk I dies to one shot anywhere. Mk II: only the arms can be hit (a 13 cm
// target, twice); each arm taken is one gun gone. Mk III: when the second arm
// goes, his chest opens and he runs at you — a kamikaze with a 0.3 m core.
//
// DRONE — head-sized (0.3 m), just above head height, jinking the whole time.
// Mk I SPOTS: fires nothing, but while it is up every other man leads you
// (see --waves, 'the spotter'). Mk II fires. Mk III dives: a kamikaze with wings.

// A RUSH: G men who come at you, each on his own timer — man i sets off
// i x `gap` seconds after the first, all visible from the start (the wave
// assembles at once), so any of them can be shot while he waits. Each has a
// DEADLINE: when he reaches you (a rusher, R = 0) or when his fuse runs out
// inside R (a kamikaze). The right order is earliest deadline first, which
// here is the order they set off. Whoever is still up at his deadline costs
// you: a rusher a hard dodge at arm's length (~1.2 s of footwork), a
// kamikaze an escape run of R, paid frozen because it is longer than the fuse.
//
// Numbers make it harder in two ways at once: more deadlines to meet, and —
// because a tighter gap packs them together — less time between them. A
// stagger wider than your kill time is a queue you can work through; a
// stagger tighter than it is a pile-up, and the pile-up is where it bites.
function rush(e, w, door, G, R, fuse, core) {
  const drain = TIME.drain * scarcity('timeDrain', door);
  const target = { ...e, bodyW: core ?? e.bodyW, strafe: 0 };   // he comes straight at you
  const reach = Math.max(0, (e.d - R) / e.speed) + fuse;
  const gap = e.gap || 0;
  let clock = 0, misses = 0;
  for (let i = 0; i < G; i++) {
    clock += killCost(target, w, G - i).t;
    if (clock > reach + i * gap) misses++;
  }
  const cost = R ? REACT + (R + 0.5) / MOVE : 1.2;
  return { P: G * 0.15 + misses * cost * (R ? 1.5 : 1), bank: misses * cost * drain, escapes: misses };
}

function newcomers() {
  const door = 25;
  const W = answers();
  const cols = Object.keys(W);
  const pad = (v, n) => String(v).padEnd(n);
  const drain = TIME.drain * scarcity('timeDrain', door);
  const refund = TIME.bonus * scarcity('timeGain', door);
  const gunner = enemy('gunner', 1);
  const cycle = gunner.aim + gunner.cd[0] + gunner.cd[1] / 2;
  const { effort } = volleyNeed(gunner, door);

  const rows = {
    // a kamikaze room is priced per KILL, like every other row
    'kamikaze Mk I x5':     (w) => matchup(enemy('kamikaze', 1), w, door),
    'kamikaze Mk II x6':    (w) => matchup(enemy('kamikaze', 2), w, door),
    'kamikaze Mk III x7':   (w) => matchup(enemy('kamikaze', 3), w, door),
    // Frankenstein Mk I: ONE man firing TWO rounds together, one shot to kill
    'frankenstein Mk I':    (w) => {
      const t = killCost(gunner, w, 1).t;
      return { P: (t / cycle + 1) * effort * 2, bank: (t / cycle + 1) * 2 * volleyNeed(gunner, door).need * drain };
    },
    // Mk II: two arms, 13 cm each, and he walks slowly while he fires.
    // A cone, a blast, a beam or a ricochet can take both arms in one aim.
    'frankenstein Mk II':   (w) => arms(w, false),
    'frankenstein Mk III':  (w) => arms(w, true),
    'drone Mk II x3':       (w) => {
      const drone = { ...gunner, bodyW: 0.3, strafe: 3.5, swing: 0.9, d: 11, aim: 0.4, cd: [1.2, 0.8] };
      return matchup(drone, w, door, 3);
    },
  };
  function per(m, n) { return { P: m.P / n, bank: m.bank / n }; }
  function arms(w, mk3) {
    const arm = { ...gunner, bodyW: 0.13, strafe: 0.8, d: 12 };
    const both = w.pellets > 1 || w.blast || w.beam || w.ricochet ? (w.ricochet ? 1.5 : 1.8) : 1;
    const tArm = killCost(arm, w, 1).t;
    // two guns up for the first arm, one for the second — or none, if one aim took both
    const vols = (tArm / cycle + 1) * 2 + (both >= 1.8 ? 0 : (tArm / cycle) * 1 * (2 - both));
    let P = vols * effort, bank = vols * volleyNeed(gunner, door).need * drain * 0.5;
    if (mk3) {
      // by the time his second arm goes he has walked in: ~8 m, and he runs
      const r = rush({ ...gunner, speed: 4.5, d: 8 }, w, door, 1, 4.5, 0.5, 0.3);
      P += r.P; bank += r.bank;
    }
    return { P, bank };
  }

  console.log(`door ${door}. P = seconds of dodging per kill (x vs the pistol); R = bank per kill / refund\n`);
  console.log(pad('', 21) + cols.map((c) => pad(c, 19)).join(''));
  for (const [name, f] of Object.entries(rows)) {
    const base = f(W.pistol).P;
    const cells = cols.map((c) => {
      const m = f(W[c]);
      const R = m.R ?? m.bank / refund;
      return pad(`${m.P.toFixed(2)} x${(m.P / base).toFixed(2)} R ${R.toFixed(1)}`, 19);
    });
    console.log(pad(name, 21) + cells.join(''));
  }
  // for scale: the same door's plain rooms
  const two = matchup({ ...gunner, volley: 2 }, W.pistol, door, 2);
  console.log(`\nfor scale, pistol: two gunners firing together ${two.P.toFixed(2)} per kill (x2 men = ${(two.P * 2).toFixed(2)} a pair)`);
}

// --- the spawner ------------------------------------------------------------------
// A small armored dome with a spinning dish on top. While the dish turns, any
// man near it who shatters HANGS for `delay` world seconds where he fell, then
// reassembles (ASSEMBLE s, unhittable while forming). Only the dish kills it.
// When it dies, everything it is holding stays down.
//
// Three ways to play a spawner room, priced per room:
//   TANK   ignore the guards, shoot the dish under their fire, then clear them
//   CLEAR  shatter the guards, then take the dish before the first one is back;
//          whoever is back before the dish goes must be shattered again
//   FREEZE do CLEAR with the world stopped: the reassembly runs on the world
//          clock, so at 0.05x the 2 s becomes 40 s of real time — paid in bank
//
// And no kill under a spawner refunds bank or drops anything until the dish
// is gone. Otherwise a spawner is a farm: every reassembly is another refund.
const ASSEMBLE = 0.8;
const DISH = { bodyW: 0.25, strafe: 0, d: 14 };
function spawnerRoom(w, door, N, delay) {
  const drain = TIME.drain * scarcity('timeDrain', door);
  const g = { ...enemy('gunner', 1), d: 10 };
  const dish = { ...enemy('gunner', 1), ...DISH };
  const cycle = g.aim + g.cd[0] + g.cd[1] / 2;
  const { effort } = volleyNeed(g, door);
  const fire = (k, secs) => Math.min(k / cycle, 1 / gapAt(door)) * secs * effort;
  const tDish = killCost(dish, w, 1).t;

  // TANK: all N firing while you take the dish, then an ordinary room of N
  const tank = fire(N, tDish) + matchup(g, w, door, N).P * N;

  // CLEAR: kill times in order; guard i is back at kill_i + delay + ASSEMBLE
  let clock = 0; const back = [];
  let clearP = 0;
  for (let k = N; k >= 1; k--) {
    const t = killCost(g, w, k).t;
    clearP += fire(k, t);
    clock += t;
    back.push(clock + delay + ASSEMBLE);
  }
  const dishAt = clock + tDish;
  const returned = back.filter((b) => b < dishAt).length;
  const window = back[0] - clock;          // seconds between the last kill and the first return
  // the ones back before the dish went fire until it does, then are shattered again for good
  clearP += fire(returned, Math.max(0, dishAt - back[0])) + (returned ? matchup(g, w, door, returned).P * returned : 0);

  // FREEZE: the same sequence in real seconds, frozen
  const freezeBank = dishAt * drain;
  // ...or the skilled version: clear on foot, and stop the world only for
  // the part of the dish shot the window does not cover
  // (a negative window means the first guard is back before the last one is
  // down, so the freeze has to start that much earlier)
  const lastBit = Math.max(0, tDish - window) * drain;
  const clearOnFoot = clearP - (returned ? fire(returned, Math.max(0, dishAt - back[0])) + matchup(g, w, door, returned).P * returned : 0);
  return { tank, clear: clearP, returned, window, tDish, freezeBank, lastBit, clearOnFoot };
}

function spawner() {
  const door = 25;
  const W = answers();
  const pad = (v, n) => String(v).padEnd(n);
  for (const [label, N, delay] of [['Mk I: 3 guards, 2 s', 3, 2], ['Mk II: 4 guards, 1.5 s', 4, 1.5]]) {
    console.log(`\nspawner ${label} (door ${door}). Room cost in seconds of dodging; FREEZE in bank seconds (the bank caps at ${TIME.cap})`);
    console.log(pad('', 15) + pad('TANK', 8) + pad('CLEAR', 8) + pad('back early', 12) + pad('window', 9) + pad('dish takes', 12) + pad('FREEZE', 9) + 'CLEAR + FREEZE THE DISH');
    for (const [name, w] of Object.entries(W)) {
      const r = spawnerRoom(w, door, N, delay);
      console.log(pad(name, 15) + pad(r.tank.toFixed(2), 8) + pad(r.clear.toFixed(2), 8) + pad(`${r.returned} of ${N}`, 12) +
        pad(`${r.window.toFixed(1)} s`, 9) + pad(`${r.tDish.toFixed(1)} s`, 12) + pad(`${r.freezeBank.toFixed(1)} s`, 9) +
        `${r.clearOnFoot.toFixed(2)} dodging + ${r.lastBit.toFixed(1)} s bank`);
    }
  }
}

// --- the schedule check ----------------------------------------------------------
// The rules the schedule has to keep, each one a thing a playtest or the model
// taught. Every debut, laddered or not, is checked.
function doorLabel(d) {
  if (d % 1 === 0) return String(d);
  let end = 0;
  for (let f = 0; f < FLOORS.length; f++) { end += FLOORS[f]; if (d < end + 1) return `G${f + 1}`; }
  return String(d);
}
function floorOf(d) {
  let end = 0;
  for (let f = 0; f < FLOORS.length; f++) { end += FLOORS[f]; if (d <= end + 0.5) return f + 1; }
  return FLOORS.length + 1;
}
function schedule() {
  const bad = [];
  const seen = new Map();
  const button = powerUnlockDoor();
  const school = [button, button + SPEED.schoolDoors - 1];
  const total = FLOORS.reduce((a, b) => a + b, 0);
  for (const [door, type, mk] of DEBUTS) {
    const at = doorLabel(door);
    // one new thing per door (and per gauntlet)
    if (seen.has(door)) bad.push(`${at}: two debuts (${seen.get(door)} and ${type} ${MK(mk)})`);
    seen.set(door, `${type} ${MK(mk)}`);
    if (door > total + 0.5) bad.push(`${at}: past the last floor`);
    // the warm-up door out of each elevator stays empty (floor 2's is slow time's)
    let first = 1;
    for (let f = 0; f < FLOORS.length; f++) {
      if (f > 0 && door === first) bad.push(`${at}: floor ${f + 1}'s warm-up door holds ${type} ${MK(mk)}`);
      first += FLOORS[f];
    }
    // the slow-time door is the button's own
    if (door === button) bad.push(`${at}: the slow-time door holds ${type} ${MK(mk)}`);
    // Mks in order, each after the last
    if (mk > 1 && !DEBUTS.some(([d, t, m]) => t === type && m === mk - 1 && d < door)) {
      bad.push(`${at}: ${type} ${MK(mk)} before his ${MK(mk - 1)}`);
    }
    // a "fire together" axis is invisible inside the school
    const axis = mk > 1 && ENEMY_MK[type] ? ENEMY_MK[type][mk - 1].axis : null;
    if (axis === 'pairs' && door >= school[0] && door <= school[1]) bad.push(`${at}: ${type} ${MK(mk)} (pairs) inside the school`);
    // the answer is on the floor before the question
    const need = NEEDS[`${type}:${mk}`] || (ANSWERED_AT[`${type}:${mk}`] ? [ANSWERED_AT[`${type}:${mk}`], 1] : null) ||
      (ANSWERED_BY[type] && mk > 1 ? [ANSWERED_BY[type], mk] : null);
    if (need) {
      const have = arsenalAt(door - 0.5)[need[0]] || 0;
      if (have < need[1]) bad.push(`${at}: ${type} ${MK(mk)} needs ${need[0]} ${MK(need[1])} already on the floor`);
    }
  }
  // every floor ends in a boss, and every boss but the last is the debut of
  // a type the NEXT floor fills with ordinary ones (POPULATES)
  let end = 0;
  for (let f = 0; f < FLOORS.length; f++) {
    end += FLOORS[f];
    const b = DEBUTS.find(([d, , , boss]) => d === end + 0.5 && boss);
    if (!b) { bad.push(`floor ${f + 1} does not end in a boss`); continue; }
    if (f < FLOORS.length - 1 && b[2] !== 1) bad.push(`G${f + 1}: a boss before the last is a type's debut (Mk I), not ${MK(b[2])}`);
    if (f < FLOORS.length - 1 && POPULATES[b[1]] !== f + 2) bad.push(`G${f + 1}: the ${b[1]} boss is not followed by ordinary ${b[1]}s on floor ${f + 2}`);
  }
  // slow time is the floor-1 boss's reward: the unlock is the next door
  if (!DEBUTS.some(([d, t, , boss]) => boss && t === 'blinker' && d === FLOORS[0] + 0.5)) bad.push('the Keeper (the first blinker) does not end floor 1');
  if (button !== FLOORS[0] + 1) bad.push(`slow time unlocks on ${button} (powerUnlockDoor), not the door after the floor-1 boss (${FLOORS[0] + 1}): move floor 1 with it`);
  // drone and spawner are both supports: they are not INTRODUCED on the same
  // floor (a Mk II drone may guest on the spawner's floor — that pairing is
  // the point of it)
  const debutFloor = (t) => floorOf((DEBUTS.find(([, ty, m]) => ty === t && m === 1) || [0])[0]);
  if (debutFloor('drone') === debutFloor('spawner')) bad.push('drone and spawner debut on the same floor');
  if (debutFloor('drone') > debutFloor('spawner')) bad.push('the spawner debuts before the drone (the drone is the easier support: it comes first)');
  // print the floors
  let first = 1;
  for (let f = 0; f < FLOORS.length; f++) {
    const last = first + FLOORS[f] - 1;
    const here = DEBUTS.filter(([d]) => d >= first && d <= last + 0.5);
    const fresh = here.filter(([, , m]) => m === 1).map(([, t]) => t);
    const guests = here.filter(([, , m]) => m > 1).map(([, t, m]) => `${t} ${MK(m)}`);
    console.log(`floor ${f + 1}  doors ${first}-${last}`);
    console.log(`  new:    ${fresh.join(', ') || '-'}${button >= first && button <= last ? `  (+ slow time on ${button})` : ''}`);
    console.log(`  guests: ${guests.join(', ') || '-'}`);
    const row = [];
    for (let d = first; d <= last; d++) {
      const x = DEBUTS.find(([dd]) => dd === d);
      row.push(`${d}:${x ? x[1].slice(0, 5) + (x[2] > 1 ? MK(x[2]).slice(3) : '') : d === button ? 'TIME' : (d === first && f > 0 ? 'warm' : '·')}`);
    }
    const g = DEBUTS.find(([dd]) => dd === last + 0.5);
    row.push(`G${f + 1}:${g ? (g[3] ? 'BOSS ' : '') + g[1].slice(0, 5) + MK(g[2]).slice(3) : '·'}`);
    console.log('  ' + row.join(' '));
    first = last + 1;
  }
  console.log(bad.length ? '\n' + bad.map((b) => 'MISS ' + b).join('\n') : '\nschedule: every rule kept');
  return bad.length;
}

// --- the floor-1 boss: the man who moves before your round does ------------------
// He reads the trigger, not the round: the moment you fire a round whose lane
// would hit him, he BLINKS — `blinkR` metres to one side, a side you cannot
// know — and then cannot blink again for `cooldown` seconds. So:
//
//   one aimed shot                  always dodged
//   a bracket (centre, then both    the centre round makes him blink; whichever
//     sides, fast)                  side he chose, a side round is already
//                                   coming and lands inside his cooldown
//   a shotgun shell                 one trigger, a pattern: he blinks, and the
//                                   pattern either still covers where he went
//                                   or it does not — the width decides
//
// Monte Carlo, because "which side" is a coin and the pellets are random.
// Rounds travel on the world clock like everything else; the lateral
// position of each round when it reaches his line decides a hit.
function boss(blinkR, cooldown, opts = {}) {
  const d = opts.d ?? 10, half = 0.28, trials = 20000;
  const aim = (at) => at + gauss() * AIM_SIGMA * d;            // thumb error, metres at his range
  function gauss() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
  // shots: [{t: fire time, x: lateral aim point (m), pellets, spread (rad)}]
  function trial(shots) {
    let pos = 0, readyAt = 0;
    const rounds = [];
    for (const sh of shots) {
      const cx = aim(sh.x);
      for (let i = 0; i < (sh.pellets || 1); i++) {
        rounds.push({ fire: sh.t, arrive: sh.t + d / (sh.speed || 46), x: cx + gauss() * (sh.spread || 0) * d });
      }
    }
    rounds.sort((a, b) => a.fire - b.fire);
    // he blinks at the first trigger pull whose rounds threaten where he stands
    const pulls = [...new Set(rounds.map((r) => r.fire))];
    const blinks = [];
    for (const t of pulls) {
      const here = blinks.length ? blinks[blinks.length - 1].to : 0;
      const threat = rounds.some((r) => r.fire === t && Math.abs(r.x - here) < half);
      if (threat && t >= readyAt) {
        const to = here + (Math.random() < 0.5 ? -1 : 1) * blinkR;
        blinks.push({ t, to });
        readyAt = t + cooldown;
      }
    }
    const at = (t) => { let x = 0; for (const b of blinks) if (b.t <= t) x = b.to; return x; };
    return rounds.some((r) => Math.abs(r.x - at(r.arrive)) < half);
  }
  const p = (shots) => { let h = 0; for (let i = 0; i < trials; i++) if (trial(shots)) h++; return h / trials; };
  const pistol = WEAPONS.pistol, sg = WEAPONS.shotgun;
  // A THUMB NEEDS TIME TO SWING. A side shot is a new aim, blinkR to the side:
  // Fitts again, onto a man-width target (a cone makes the target wider).
  const swing = (w) => FITTS_A + FITTS_B * Math.log2(1 + blinkR / (2 * half + (w.pellets > 1 ? 2 * d * w.spread : 0)));
  const shell = { pellets: sg.pellets, spread: sg.spread };
  const shell2 = { pellets: 9, spread: 0.07 };
  // BAIT AND PUNISH: fire at him, SEE which way he went (REACT), swing onto
  // where he is now and fire again. It lands if it arrives inside his cooldown.
  function punish(w) {
    let h = 0;
    for (let i = 0; i < trials; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const tFire = Math.max(w.cd || 0, REACT + swing(w));
      const arrive = tFire + d / 46;
      if (arrive > cooldown) continue;                       // he is ready again: blinks
      const cx = aim(side * blinkR);
      const n = w.pellets || 1;
      let hit = false;
      for (let k = 0; k < n && !hit; k++) if (Math.abs(cx + gauss() * (w.spread || 0) * d - side * blinkR) < half) hit = true;
      if (hit) h++;
    }
    return h / trials;
  }
  return {
    'one aimed pistol shot': p([{ t: 0, x: 0 }]),
    'pistol bracket (real swings)': p([{ t: 0, x: 0 }, { t: swing(pistol), x: -blinkR }, { t: 2 * swing(pistol), x: blinkR }]),
    'one shotgun shell, centred': p([{ t: 0, x: 0, ...shell }]),
    'shotgun Mk II shell, centred': p([{ t: 0, x: 0, ...shell2 }]),
    'bait + punish, pistol': punish(pistol),
    'bait + punish, shotgun': punish({ ...sg, ...shell }),
    'bait + punish, shotgun Mk II': punish({ ...sg, ...shell2 }),
  };
}
function bossReport() {
  const pad = (v, n) => String(v).padEnd(n);
  const setups = [[1.5, 1.0], [1.5, 1.2], [1.5, 1.3], [1.5, 1.5]];
  console.log('the floor-1 boss at 10 m: chance one attempt hits him\n');
  const names = Object.keys(boss(1.5, 1.0));
  console.log(pad('', 38) + setups.map(([r, c]) => pad(`blink ${r} m, cd ${c} s`, 22)).join(''));
  const res = setups.map(([r, c]) => boss(r, c));
  for (const n of names) console.log(pad(n, 38) + res.map((r) => pad(`${Math.round(r[n] * 100)}%`, 22)).join(''));
}

if (process.argv.includes('--boss')) bossReport();
else if (process.argv.includes('--schedule')) process.exitCode = schedule() ? 1 : 0;
else if (process.argv.includes('--spawner')) spawner();
else if (process.argv.includes('--newcomers')) newcomers();
else if (process.argv.includes('--matrix')) matrix();
else if (process.argv.includes('--waves')) process.exitCode = waves() ? 1 : 0;
else process.exitCode = ladder() ? 1 : 0;
