// ---------------------------------------------------------------------------
// THE ARC, DOOR BY DOOR.
//
//   node tools/arc.mjs              the shipped ramp
//   node tools/arc.mjs 1.44         a faster one (stepM)
//   node tools/arc.mjs 1.44 400     ...for a player 400 lifetime doors in
//
// A run of The Tunnel is supposed to be a drip feed of new things: an enemy
// type you have not met, a form of corridor, a condition, a measure the
// building runs against you — and, once it is placed, a line on a wall.
// Every one of those is already data with a door on it, and they have never
// been looked at together. This prints them as one schedule so the gaps and
// the pile-ups are visible.
//
// It asserts nothing. It is for deciding what the ramp should be.
// ---------------------------------------------------------------------------
import { SPEED, speedAt, unlockDoor, finaleDoor, powerUnlockDoor } from '../src/balance.js';
import { ELEMENTS } from '../src/protocols.js';
import { storyDoors } from '../src/story.js';

const stepM = +process.argv[2] || SPEED.stepM;
const life = process.argv[3] === undefined ? 1e9 : +process.argv[3];
const S = { ...SPEED, stepM };

const U = powerUnlockDoor();            // where the time button is handed over
const speedU = unlockDoor(S);           // where rounds get fast
const F = finaleDoor(S);

// The story spaces against the door slow time arrives on — see SCRIPT.md §5.1.
const story = storyDoors({ unlock: U, finale: F, schoolDoors: S.schoolDoors });

// Everything the registry introduces, by the door it first becomes eligible
// on. Two keys, per PROTOCOLS.md §5: `minDoor` is depth within a run,
// `unlockAt` is doors walked in a lifetime.
const arrivals = new Map();
const add = (door, s) => {
  if (!arrivals.has(door)) arrivals.set(door, []);
  arrivals.get(door).push(s);
};
for (const e of ELEMENTS) {
  if (e.weight === 0) continue;                    // weapons: not a surprise
  if (life < (e.unlockAt || 0)) continue;          // not yet earned, lifetime
  const tag = e.impl ? '' : ' (not built)';
  add(e.minDoor, `${e.kind}: ${e.name}${tag}`);
}
for (const b of story.beats) {
  add(b.door, `story: ${b.v === 'S' ? 'hale' : b.v === 'B' ? 'engineers' : 'programme'} — ${b.text.slice(0, 38)}`);
}
add(U, 'POWER: the time button');
if (speedU !== U) add(speedU, 'speed: rounds reach unlockM');
add(F, 'THE LAST DOOR');

const last = Math.max(...arrivals.keys());
console.log(`ramp stepM ${stepM}  ·  time button door ${U}  ·  rounds fast door ${speedU}` +
  `  ·  last door ${F}  ·  lifetime ${life === 1e9 ? 'everything unlocked' : life + ' doors'}`);
console.log(`story: ${story.beats.length}/25 placed${story.cut.length ? `, cut ${story.cut.map((c) => c.id).join(',')}` : ''}`);
console.log('');

let quiet = 0, worst = 0, worstAt = 0;
for (let d = 1; d <= last; d++) {
  const here = arrivals.get(d);
  if (!here) {
    quiet++;
    if (quiet > worst) { worst = quiet; worstAt = d; }
    continue;
  }
  if (quiet) console.log(`     ${'·'.repeat(Math.min(quiet, 40))}  ${quiet} door${quiet > 1 ? 's' : ''} with nothing new`);
  quiet = 0;
  const v = speedAt(d, S).toFixed(1);
  console.log(`${String(d).padStart(4)}  ${v.padStart(5)} m/s  ${here.join('\n              + ')}`);
}
console.log('');
console.log(`longest stretch with nothing new: ${worst} doors, ending at ${worstAt}`);
console.log(`doors with something new: ${arrivals.size} of ${last}`);
