// ---------------------------------------------------------------------------
// PROTOCOLS — the content system.
//
// A PROTOCOL is the whole configuration of one leg: the FORM it is, the
// CONDITION it is under, and the MEASURES the building runs against you.
// Those three are kinds of ELEMENT, and they all live in one registry, so
// adding content is adding a row.
//
// Values mirror the Protocol Pacing artifact and docs/PROTOCOLS.md.
// `impl: false` means the composer never picks it, so the registry can run
// ahead of the game.
//
// `unlockAt` IS RATIONING, AND A CATALOGUE THIS SMALL CANNOT BE RATIONED.
// It exists so a long run does not empty UNLOCKS in one sitting (see
// docs/PROTOCOLS.md), which is the right idea for the registry this file will
// eventually hold. Today eight elements are implemented, and rationing four of
// those behind 15 and 40 LIFETIME doors left a first run with exactly four —
// one form repeated, one measure — for its first fourteen doors. Measured
// across 400 simulated first runs, the atrium first appeared on door 17 and
// dim strips on door 20. So every IMPLEMENTED row runs on `minDoor` alone and
// `unlockAt` starts rationing again when there is a catalogue to ration: the
// unbuilt rows below keep theirs and want them. It covers two cases: not built yet, and BUILT BUT NOT
// YET APPROVED FOR THE MAIN FLOW — fog and blackout are both built and are
// reachable through Settings > Conditions for playtesting, which is why their
// minDoor is set for where they should eventually land rather than where they
// can currently be seen.
// ---------------------------------------------------------------------------

export const ELEMENTS = [
  // --- forms: what the leg IS ---------------------------------------------
  { id: 'corridor', name: 'CORRIDOR', kind: 'form', tier: 1, minDoor: 1, unlockAt: 0, weight: 10, impl: true,
    blurb: 'Standard service corridor. No deviation logged.' },
  { id: 'serviceRun', name: 'SERVICE RUN', kind: 'form', tier: 1, minDoor: 2, unlockAt: 0, weight: 7, impl: true,
    blurb: 'Maintenance route. Frequent turns. Sightlines under four metres.' },
  { id: 'vault', name: 'VAULT', kind: 'form', tier: 1, minDoor: 2, unlockAt: 0, weight: 8, impl: true,
    blurb: 'Plant hall. One way in, one way out, columns between.' },
  { id: 'atrium', name: 'ATRIUM', kind: 'form', tier: 2, minDoor: 3, unlockAt: 0, weight: 6, impl: true,
    blurb: 'Assembly volume. Columns load-bearing. Occupancy unlimited.' },
  { id: 'gauntlet', name: 'GAUNTLET', kind: 'form', tier: 2, minDoor: 4, unlockAt: 0, weight: 5, impl: true,
    blurb: 'Transit spine. No recesses. Do not stop walking.' },
  { id: 'gallery', name: 'GALLERY', kind: 'form', tier: 3, minDoor: 6, unlockAt: 80, weight: 4, impl: false,
    blurb: 'Observation run. Full length sightline maintained.' },
  { id: 'stairwell', name: 'STAIRWELL', kind: 'form', tier: 3, minDoor: 7, unlockAt: 140, weight: 3, impl: false,
    blurb: 'Vertical circulation. Mind the level above you.' },
  { id: 'spiral', name: 'SPIRAL', kind: 'form', tier: 4, minDoor: 10, unlockAt: 200, weight: 2, impl: false,
    blurb: 'Containment geometry. There is no straight line out.' },

  // --- conditions: how the leg IS -----------------------------------------
  { id: 'dimStrips', name: 'DIM STRIPS', kind: 'condition', tier: 1, minDoor: 3, unlockAt: 0, weight: 6, impl: true,
    blurb: 'Illumination at half. Power is needed elsewhere.' },
  { id: 'fog', name: 'FOG', kind: 'condition', tier: 2, minDoor: 13, unlockAt: 120, weight: 5, impl: false,
    blurb: 'Suppressant discharged. Visibility eight metres. Stop the clock and it parts.' },
  { id: 'blackout', name: 'BLACKOUT', kind: 'condition', tier: 3, minDoor: 15, unlockAt: 180, weight: 4, impl: false,
    blurb: 'Emergency lighting only. Compliance is not required to see.' },
  { id: 'flood', name: 'FLOOD', kind: 'condition', tier: 4, minDoor: 11, unlockAt: 200, weight: 2, impl: false,
    blurb: 'Level breached. Movement impaired. Proceed.' },
  { id: 'deadAir', name: 'DEAD AIR', kind: 'condition', tier: 4, minDoor: 12, unlockAt: 260, weight: 2, impl: false,
    blurb: 'Acoustic dampening active. You will not hear them coming.' },

  // --- measures: what the building DOES ------------------------------------
  { id: 'alcoves', name: 'ALCOVES', kind: 'measure', tier: 1, minDoor: 2, unlockAt: 0, weight: 7, impl: true,
    blurb: 'Recessed bays. Not designed as cover. Usable as cover.' },
  { id: 'oneWaySeal', name: 'ONE-WAY SEAL', kind: 'measure', tier: 2, minDoor: 4, unlockAt: 0, weight: 5, impl: true,
    blurb: 'Section closed behind you. Return is not authorised.' },
  { id: 'breachWalls', name: 'BREACH WALLS', kind: 'measure', tier: 2, minDoor: 5, unlockAt: 40, weight: 5, impl: false,
    blurb: 'Panels rated for personnel egress. From either side.' },
  { id: 'grinder', name: 'GRINDER', kind: 'measure', tier: 3, minDoor: 6, unlockAt: 80, weight: 4, impl: false,
    blurb: 'Sanitation unit dispatched. Do not remain stationary.' },
  { id: 'turretDrop', name: 'TURRET', kind: 'measure', tier: 3, minDoor: 8, unlockAt: 140, weight: 3, impl: false,
    blurb: 'Fixed emplacement lowered. It does not need to reload.' },

  // --- enemies: same schedule, different kind ------------------------------
  // `minDoor` here and TYPE_INTRO in balance.js carry the SAME schedule and
  // have to move together: this one decides what a door may claim in its
  // headline, that one composes the wave. See TYPE_INTRO for why the opening
  // is one new thing at a time and what each door's one thing is.
  //
  // ...AND `unlockAt` IS ZERO ON EVERY ONE OF THEM, WHICH IS NOT AN OVERSIGHT.
  //
  // It was 15, 40, 80, 140 and 200, and `enemyRoster()` is read by the wave
  // builder — so it was a SECOND schedule, on a different clock (lifetime
  // doors, not this run's), quietly overruling the first. Measured on a first
  // run: the sniper TYPE_INTRO introduces on door 16 could not appear until
  // door 40, the bomber's 19 became 40, the armored's 23 became 80, the
  // rocketeer's 27 became 140 and the laser's 31 became 200. A player's first
  // run met FIVE of the ten types in its first forty doors and had no way to
  // know why the game had stopped introducing itself.
  //
  // `unlockAt` is a real dial and it keeps doing its real job on the rows
  // below and above — it stops a long run exhausting the CATALOGUE of forms
  // and conditions. Enemy types are not catalogue: they are the ramp, the ramp
  // is TYPE_INTRO, and a ramp with two schedules is a ramp with none.
  // `meet` and `hint` are the DEBUT CARD (docs/ARSENAL.md §11). Plain words,
  // no riddles: `meet` is what makes him different, in one short line; `hint`
  // is how to beat him, said outright, and only where that is not obvious.
  // The gunner has no card: the onboarding is his.
  { id: 'gunner', name: 'GUNNER', kind: 'enemy', tier: 1, minDoor: 1, unlockAt: 0, weight: 10, impl: true,
    blurb: 'Compliant. Armed. The building has many.' },
  { id: 'rusher', name: 'RUSHER', kind: 'enemy', tier: 1, minDoor: 4, unlockAt: 0, weight: 8, impl: true,
    blurb: 'Close-quarters directive. Watch the arm come back.',
    meet: 'He charges at you.', hint: 'Watch out when his arm pulls back.' },
  { id: 'shotgunner', name: 'SHOTGUNNER', kind: 'enemy', tier: 2, minDoor: 6, unlockAt: 0, weight: 6, impl: true,
    blurb: 'Wide pattern. Effective only near. Get past him.',
    meet: 'Deadly up close.', hint: 'Keep your distance.' },
  { id: 'shieldbearer', name: 'SHIELD', kind: 'enemy', tier: 2, minDoor: 8, unlockAt: 0, weight: 5, impl: true,
    blurb: 'Plate rated for small arms. The plate only.',
    meet: 'His shield stops shots.', hint: 'Hit uncovered areas. Or get behind him.' },
  { id: 'heavy', name: 'HEAVY', kind: 'enemy', tier: 2, minDoor: 11, unlockAt: 0, weight: 5, impl: true,
    blurb: 'Three rounds, in quick succession, every time.',
    meet: 'Fires three rounds at a time.' },
  { id: 'sniper', name: 'SNIPER', kind: 'enemy', tier: 3, minDoor: 13, unlockAt: 0, weight: 4, impl: true,
    blurb: 'Long authorisation delay. Longer reach.',
    meet: 'Slow to aim. His round is fast.', hint: 'Move while he aims.' },
  { id: 'bomber', name: 'BOMBER', kind: 'enemy', tier: 3, minDoor: 15, unlockAt: 0, weight: 4, impl: true,
    blurb: 'Area denial. The floor is the weapon.',
    meet: 'Throws grenades.', hint: 'Keep out of the red ring.' },
  { id: 'armored', name: 'ARMORED', kind: 'enemy', tier: 3, minDoor: 18, unlockAt: 0, weight: 3, impl: true,
    blurb: 'Body plated. The head was not considered a risk.',
    meet: 'Body shots bounce off.', hint: 'Aim for the head.' },
  { id: 'kamikaze', name: 'KAMIKAZE', kind: 'enemy', tier: 3, minDoor: 20, unlockAt: 0, weight: 3, impl: true,
    blurb: 'Personnel carrier, single use. Keep the distance.',
    meet: 'Explodes when he reaches you.', hint: 'Shoot him near his friends.' },
  { id: 'rocketeer', name: 'ROCKETEER', kind: 'enemy', tier: 4, minDoor: 22, unlockAt: 0, weight: 3, impl: true,
    blurb: 'Guided munition. It will follow. Break the line.',
    meet: 'His rocket follows you.', hint: 'Put a wall between you and it.' },
  { id: 'laser', name: 'LASER', kind: 'enemy', tier: 4, minDoor: 32, unlockAt: 0, weight: 2, impl: true,
    blurb: 'Sweep emitter. Cover is irrelevant. Kill it.',
    meet: 'Beam sweeps across the room.', hint: 'Cover does not stop it. Kill him quick.' },
  // BY A BOSS: the Keeper is the first blinker, so the type has no door debut
  // of its own (byBoss) and joins the ordinary cast from floor 2 (door 10).
  { id: 'blinker', name: 'BLINKER', kind: 'enemy', tier: 4, minDoor: 10, unlockAt: 0, weight: 0, impl: true, byBoss: true,
    blurb: 'Reads the trigger. Moves before the round does.',
    meet: 'Dodges the moment you fire.', hint: 'Fire to make him move, then shoot where he’ll be.' },

  // --- weapons: ids match the WEAPONS keys, so a pickup files itself --------
  // A WEAPON ARRIVES WHEN THE MAN CARRYING IT DOES. These rows are registry
  // only (weight 0, never picked) but they are what UNLOCKS shows, and they
  // named doors 3, 5, 6, 7 and 10 while TYPE_DROP in balance.js says the
  // shotgun comes off a shotgunner, the burst off a heavy, the rail off a
  // sniper, the launcher off a bomber and the rocket off a rocketeer. Each one
  // now reads the door its carrier debuts on.
  { id: 'knife', name: 'KNIFE', kind: 'weapon', tier: 1, minDoor: 1, unlockAt: 0, weight: 0, impl: true,
    blurb: 'Not a service item. What is left when the count reaches zero.' },
  { id: 'pistol', name: 'PISTOL', kind: 'weapon', tier: 1, minDoor: 1, unlockAt: 0, weight: 0, impl: true,
    blurb: 'Sidearm. Five rounds. Sufficient, in the right order.' },
  { id: 'shotgun', name: 'SHOTGUN', kind: 'weapon', tier: 1, minDoor: 6, unlockAt: 0, weight: 0, impl: true,
    blurb: 'Six pellets on one authorisation. Distance is the price.' },
  { id: 'burst', name: 'BURST RIFLE', kind: 'weapon', tier: 2, minDoor: 11, unlockAt: 0, weight: 0, impl: true,
    blurb: 'Three rounds per pull. The building prefers certainty.' },
  { id: 'sniper', name: 'RAIL', kind: 'weapon', tier: 3, minDoor: 13, unlockAt: 0, weight: 0, impl: true,
    blurb: 'Rated to pass through three. It usually finds them.' },
  { id: 'launcher', name: 'LAUNCHER', kind: 'weapon', tier: 3, minDoor: 15, unlockAt: 0, weight: 0, impl: true,
    blurb: 'Arcing charge. Mind what is between you and the arc.' },
  { id: 'rocket', name: 'ROCKET', kind: 'weapon', tier: 4, minDoor: 19, unlockAt: 0, weight: 0, impl: true,
    blurb: 'Direct munition. Not intended for corridors. Used in them anyway.' },
];

// Every entry carries a stable designation, because a LOCKED entry has to
// show something: UNLOCKS hides the name, never the fact that a slot
// exists. Derived from registry order so adding a row needs no bookkeeping.
const KIND_TAG = { form: 'F', condition: 'C', measure: 'M', enemy: 'E', weapon: 'W' };
{
  const seq = {};
  for (const e of ELEMENTS) {
    seq[e.kind] = (seq[e.kind] || 0) + 1;
    e.designation = `${KIND_TAG[e.kind] || 'X'}-${String(seq[e.kind]).padStart(2, '0')}`;
  }
}

// Pairs that break each other mechanically. Slots handle the rest.
export const CONFLICTS = [
  ['grinder', 'oneWaySeal'],    // both own the leg's back wall
  ['grinder', 'flood'],         // the grinder outruns a slowed player
  ['blackout', 'gallery'],      // a gallery is FOR sightlines
  ['deadAir', 'breachWalls'],   // the breach is telegraphed by sound
  ['turretDrop', 'atrium'],     // 360 degrees of open room, no counterplay
];

export const COMP = {
  budgetBase: 1, budgetPerDoors: 3, budgetCap: 5,
  maxConditions: 1, maxMeasures: 2,
  formRepeatGap: 3, otherRepeatGap: 4,
};

export const PACE = {
  debutsPerLeg: 1,      // unfamiliar things introduced at once
  // ONE DOOR OF SILENCE, NOT TWO. A cooldown of 2 means `door - last > 2`,
  // which is a debut every THIRD door — and measured across 400 first runs
  // that is exactly what it delivered: something new on doors 2, 5, 8, 11, 14,
  // 17, 20, 23 and nothing whatever on the fifteen doors in between. Two out
  // of every three doors introduced themselves as the previous door again.
  debutCooldown: 1,     // doors of silence after a debut
  firstDebutDoor: 2,    // door 1 is the control
  debutLegTierCap: 1,   // a debut leg stays legible
  enemyDebutGap: 1,
};

const byId = new Map(ELEMENTS.map((e) => [e.id, e]));
export const element = (id) => byId.get(id);
const conflicts = (a, b) =>
  CONFLICTS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/**
 * Compose one leg's protocol.
 *
 * @param door           1-based door number within this run
 * @param lifetimeDoors  doors cleared across every run, ever
 * @param mem            { seen:Set, lastUsed:{}, lastProtoDebut, lastEnemyDebut }
 *                       — carried for the whole run, mutated here
 * @param rand           () => [0,1)
 * @returns { door, budget, form, condition, measures[], enemyDebut, debuts[] }
 */
export function composeProtocol(door, lifetimeDoors, mem, rand = Math.random) {
  const budget = Math.min(
    COMP.budgetBase + Math.floor(door / COMP.budgetPerDoors), COMP.budgetCap);
  let left = budget;
  const chosen = [];
  const debuts = [];

  const eligible = (e) =>
    e.impl && door >= e.minDoor && lifetimeDoors >= e.unlockAt;

  // A TYPE'S OWN DOOR BELONGS TO THAT TYPE.
  //
  // The enemy schedule is authored — TYPE_INTRO in balance.js and `minDoor`
  // here, two doors apart by hand — and it used to be run through the same
  // random debut slot as the forms and conditions, last in the queue, only if
  // nothing else had claimed the door and only if a cooldown allowed it.
  // Measured, the door the rusher was introduced on announced a VAULT, and
  // doors 11 and 14 spent the slot re-announcing the gunner. A schedule that
  // has to win a lottery to be heard is not a schedule.
  //
  // So: if a type is due on this exact door, it takes the door, and the
  // protocol debut stands down for one door rather than sharing it. One new
  // thing per door is still the rule — this only decides which one.
  const dueEnemy = ELEMENTS.filter((e) => e.kind === 'enemy' && eligible(e) &&
    !mem.seen.has(e.id) && e.minDoor === door && !e.byBoss);   // a boss was his debut
  //
  // ...AND THE TWO SCHEDULES KEEP THEIR OWN COOLDOWNS. They used to share one
  // (`lastDebutDoor`), which an enemy debut also set — so once types landed
  // every two doors, an enemy on door 4 silenced the protocols on 3, 5 and 6
  // and the forms, conditions and measures were squeezed out of the opening
  // altogether: measured, three protocol debuts in twenty-four doors, and
  // ALCOVES — a door-2 measure — never introduced at all. A cooldown exists so
  // one KIND of new thing does not arrive twice in a row, and an enemy is not
  // a form. Separate clocks, so the protocols take the doors the types leave.
  const canDebut = door >= PACE.firstDebutDoor && dueEnemy.length === 0 &&
    door - mem.lastProtoDebut > PACE.debutCooldown;

  const pick = (kind, slots) => {
    for (let s = 0; s < slots; s++) {
      const strict = ELEMENTS.filter((e) => {
        if (e.kind !== kind || !eligible(e) || e.tier > left) return false;
        if (chosen.some((c) => c.id === e.id || conflicts(c.id, e.id))) return false;
        const gap = kind === 'form' ? COMP.formRepeatGap : COMP.otherRepeatGap;
        if (mem.lastUsed[e.id] !== undefined && door - mem.lastUsed[e.id] <= gap) return false;
        const isNew = !mem.seen.has(e.id);
        if (isNew && (!canDebut || debuts.length >= PACE.debutsPerLeg)) return false;
        // a debut leg stays readable: nothing heavy alongside the new thing
        if (!isNew && debuts.length > 0 && e.tier > PACE.debutLegTierCap) return false;
        return true;
      });
      // the no-repeat window can empty the pool; relax it rather than
      // collapsing to the same default leg after leg
      const pool = strict.length ? strict : ELEMENTS.filter((e) =>
        e.kind === kind && eligible(e) && e.tier <= left && mem.seen.has(e.id) &&
        !chosen.some((c) => c.id === e.id || conflicts(c.id, e.id)));
      if (!pool.length) return;
      const total = pool.reduce((a, e) => a + e.weight, 0);
      let r = rand() * total, hit = pool[0];
      for (const e of pool) { r -= e.weight; if (r <= 0) { hit = e; break; } }
      if (!mem.seen.has(hit.id)) { debuts.push(hit); mem.lastProtoDebut = door; }
      mem.seen.add(hit.id);
      mem.lastUsed[hit.id] = door;
      left -= hit.tier;
      chosen.push(hit);
      if (kind === 'form') return;   // exactly one form per leg
    }
  };

  pick('form', 1);
  if (!chosen.length) {   // nothing eligible at all: the plain corridor
    const c = element('corridor');
    mem.seen.add(c.id); mem.lastUsed[c.id] = door;
    chosen.push(c); left -= c.tier;
  }
  pick('condition', COMP.maxConditions);
  pick('measure', COMP.maxMeasures);

  // Enemy debuts never share a leg with a protocol debut — one unfamiliar
  // thing at a time is the whole rule — but on a door a type is DUE on, it is
  // the protocol that stands aside. See `dueEnemy` above.
  let enemyDebut = null;
  // `dueEnemy` first and unconditionally — it is the door's own schedule. The
  // random path behind it is the CATCH-UP: a player who met a type in an
  // earlier run, or walked past its door inside a leg, still gets introduced
  // to everything they have not seen, just not on a door that owes somebody.
  const pool = dueEnemy.length ? dueEnemy
    : (debuts.length === 0 && canDebut && door - mem.lastEnemyDebut > PACE.enemyDebutGap)
      ? ELEMENTS.filter((e) => e.kind === 'enemy' && eligible(e) && !mem.seen.has(e.id))
      : [];
  if (pool.length) {
    const total = pool.reduce((a, e) => a + e.weight, 0);
    let r = rand() * total, hit = pool[0];
    for (const e of pool) { r -= e.weight; if (r <= 0) { hit = e; break; } }
    enemyDebut = hit;
    mem.seen.add(hit.id);
    mem.lastEnemyDebut = door;
    debuts.push(hit);
  }

  return {
    door, budget, spent: budget - left,
    form: chosen.find((c) => c.kind === 'form'),
    condition: chosen.find((c) => c.kind === 'condition') || null,
    measures: chosen.filter((c) => c.kind === 'measure'),
    enemyDebut, debuts,
  };
}

/** Fresh per-run memory. `known` is what the player has unlocked, so anything they
 *  have already met is not treated as a debut again. */
export function newRunMemory(known) {
  return {
    seen: new Set(known || []),
    lastUsed: {},
    lastProtoDebut: -99,
    lastEnemyDebut: -99,
  };
}

/** Every enemy this player may meet at their experience, for wave building. */
export function enemyRoster(door, lifetimeDoors) {
  return ELEMENTS.filter((e) =>
    e.kind === 'enemy' && e.impl && door >= e.minDoor && lifetimeDoors >= e.unlockAt)
    .map((e) => e.id);
}
