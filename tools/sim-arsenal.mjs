// ---------------------------------------------------------------------------
// THE ARSENAL MODEL — does the enemy Mk ladder and the weapon Mk ladder
// actually produce "struggle, then relief"?
//
//   node tools/sim-arsenal.mjs            the ladder check (every Mk debut)
//   node tools/sim-arsenal.mjs --waves    the kill-order check (wave recipes)
//   node tools/sim-arsenal.mjs --matrix   new enemy traits x new answers
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
  rusher:       { speed: 3.4, d: 14, melee: true },
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
  rusher: [null,
    { axis: 'closing',  speed: 4.4 },
    { axis: 'closing',  speed: 4.9 },
  ],
  shotgunner: [null,
    { axis: 'pattern',  pellets: 7, spread: 0.12, d: 10 },    // wider, and from further
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
    { axis: 'burst',    burst: 4, spread: 0.008, shatter: 0.35 },   // a burst can meet a burst
    { axis: 'burst',    burst: 5, spread: 0.006, pierce: 2, shatter: 0.5 },
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
const ANSWERED_BY = { rusher: 'shotgun', shieldbearer: 'launcher', laser: 'rocket' };

// --- THE SCHEDULE (proposal): five floors, every Mk debut on its door ------
export const FLOORS = [6, 7, 7, 8, 9];     // doors per floor; an elevator gauntlet after each
export const DEBUTS = [
  // floor 1 — doors 1-6
  [1, 'gunner', 1], [3, 'rusher', 1], [5, 'shotgunner', 1],
  // floor 2 — doors 7-13 (slow time arrives on 10: powerUnlockDoor)
  // sniper before gunner Mk II: the Mk II pistol (pierce, shatter) out-guns
  // a Mk I rifle, and a weapon has to be the best answer on the day it lands
  [8, 'shieldbearer', 1], [11, 'heavy', 1], [12, 'sniper', 1],
  // floor 3 — doors 14-20
  // shotgunner Mk II before rusher Mk II: the rusher's answer is the shotgun,
  // so his Mk has to arrive after the Mk of the thing that answers it
  [15, 'bomber', 1], [16, 'shotgunner', 2], [17, 'armored', 1], [18, 'rusher', 2],
  [19, 'rocketeer', 1], [20, 'shieldbearer', 2],
  // floor 4 — doors 21-28. The gunner's Mk II is the floor's first door and
  // not door 13, where it used to be: doors 10-19 are the slow-time school,
  // which already makes the room fire in volleys, and a Mk whose axis is
  // "fires together" is invisible inside it (measured: identical P).
  [21, 'gunner', 2], [22, 'laser', 1], [23, 'heavy', 2], [25, 'sniper', 2],
  [26, 'bomber', 2], [27, 'armored', 2], [28, 'rocketeer', 2],
  // floor 5 — doors 29-37
  [29, 'laser', 2], [30, 'gunner', 3], [31, 'shotgunner', 3], [32, 'heavy', 3],
  [33, 'sniper', 3], [34, 'rusher', 3], [35, 'armored', 3], [36, 'rocketeer', 3],
  [37, 'bomber', 3],
];
// Doors with no enemy debut carry the protocol debuts (forms, conditions,
// measures), as today. Shield Mk III and laser Mk III are held for the final
// elevator gauntlet.

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
  return FITTS_A + FITTS_B * Math.log2(1 + SWING / (2 * half * (w.zoom || 1))) + zoomIn;
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
  let extra = 0;
  if (w.pierce > 1) extra += Math.min(w.pierce, k) - 1 > 0 ? (Math.min(w.pierce, k) - 1) * 0.35 : 0;
  if (w.pellets > 1) {
    const at = e.melee ? e.d / 2 : e.d;                     // you meet a rusher halfway
    const cone = 2 * at * Math.tan(w.spread * 2);           // metres the pattern covers
    extra += Math.min(k - 1, cone / 1.5) * 0.5;               // men ~1.5 m apart
  }
  if (w.blast) extra += Math.min(k - 1, w.blast / 2.5) * 0.5;
  if (w.sweep && w.burst > 1) extra += (Math.min(w.burst, k) - 1) * 0.3;
  // a ricochet finds the next man for you — no line-up needed, unlike pierce
  if (w.ricochet) extra += Math.min(k - 1, w.ricochet) * 0.6;
  // a beam dragged across a group takes whoever it crosses
  if (w.beam) extra += Math.min(k - 1, 2) * 0.5;
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
  const G = group ?? groupOf(e.type, door);
  const { t, rounds, p } = killCost(e, w, G);
  const drain = TIME.drain * scarcity('timeDrain', door);
  let P = 0, bank = 0, extraRounds = 0;
  if (e.melee) {
    // they are the clock: all of them arrive together, and whatever is left
    // standing when they do is finished with the world stopped
    // every man still on his feet when they arrive is a hard dodge at arm's
    // length (~1.2 s of footwork); the rest were a glance
    const arrive = e.d / e.speed;
    const reached = Math.max(0, G - arrive / t);
    P = G * 0.15 + reached * 1.2;
    bank = Math.max(0, G * t - arrive) * drain;
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
    const E = enemy(type, mk);
    const before = arsenalAt(door - 1), after = arsenalAt(door);
    const own = !!DROPS_FROM[type];
    const rt = own ? DROPS_FROM[type] : ANSWERED_BY[type];
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
    console.log(`${String(r.door).padStart(4)} | ${pad(r.who, 18)} | ${pad(r.axis, 8)} | ${r.speed.padStart(4)} | ${r.G} | ${r.prev === undefined ? '      - ' : f(r.prev) + '   '} | ${pad(r.sw, 17)} |${f(r.sP)} | ${f(r.sR)} | ${pad(r.rw, 18)} |${f(r.rP)} | ${f(r.rR)} | ${r.rds.toFixed(1).padStart(3)} | ${r.check}`);
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
  'the clock':         { door: 23, w: ['pistol', 2], mix: [['laser', 1, 1, 22], ['shieldbearer', 1, 1, 10], ['gunner', 2, 2, 12]] },
  // the rushers are the clock, and they start furthest away
  'close pressure':    { door: 19, w: ['shotgun', 2], mix: [['gunner', 2, 1, 7], ['rusher', 3, 2, 16]] },
  // the answer to the plates is carried by the man behind them
  'take his gun':      { door: 20, w: ['pistol', 1], mix: [['shieldbearer', 2, 2, 8], ['bomber', 1, 1, 13], ['gunner', 2, 1, 10]] },
};
function threatRate(e, door) {
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
      men.push({ ...enemy(type, mk), d, label: `${type}${mk > 1 ? ' ' + MK(mk) : ''}` });
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

if (process.argv.includes('--matrix')) matrix();
else if (process.argv.includes('--waves')) process.exitCode = waves() ? 1 : 0;
else process.exitCode = ladder() ? 1 : 0;
