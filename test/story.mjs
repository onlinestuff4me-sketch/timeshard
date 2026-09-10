// THE SCRIPT, CHECKED AGAINST THE DOCUMENT IT WAS TRANSCRIBED FROM.
//
// docs/SCRIPT.md §6 is prose with tables in it, and src/story.js is that
// prose turned into data by hand. A dropped line, a voice typed wrong, a
// rewrite that no longer shares its skeleton with the line it replaces —
// none of those throws, and none of them shows up in a screenshot. So they
// are asserted here.
//
// No browser: this is data and arithmetic.
import { STORY_ACTS, STORY_BEATS, STORY_REGISTER, STORY_SHAPE, storyPages }
  from '../src/story.js';

let bad = 0;
const fail = (m) => { console.log('FAIL ' + m); bad++; };

// ---- the shape the document states ---------------------------------------
console.log(`  ${STORY_SHAPE.acts} acts · ${STORY_SHAPE.beats} beats · ` +
  `${STORY_SHAPE.pages} decode · ${STORY_SHAPE.anchored} anchored`);
if (STORY_SHAPE.beats !== 25) fail(`${STORY_SHAPE.beats} beats, not 25`);
if (STORY_SHAPE.acts !== 5) fail(`${STORY_SHAPE.acts} acts, not 5`);
if (STORY_SHAPE.pages !== 10) fail(`${STORY_SHAPE.pages} pages, not 10`);

// ---- per act, the counts §6's tables come to ------------------------------
const WANT = { test: 6, others: 5, anomaly: 6, watchers: 5, copy: 3 };
for (const a of STORY_ACTS) {
  const p = a.beats.filter((b) => b.after).length;
  const v = a.beats.map((b) => b.v).join('');
  console.log(`  ${a.id.padEnd(9)} ${String(a.beats.length).padStart(2)} beats · ` +
    `${p} decode · voices ${v}`);
  if (a.beats.length !== WANT[a.id]) {
    fail(`act "${a.id}" has ${a.beats.length} beats, not ${WANT[a.id]}`);
  }
}

// ---- only the programme decodes ------------------------------------------
// Hale never had the key and the engineers are never jammed, so neither has
// anything to turn over. docs/SCRIPT.md §3.
for (const b of storyPages()) {
  if (b.v !== 'P') fail(`"${b.id}" decodes but is voice ${b.v}, not the programme`);
}

// ---- a rewrite is a JAM, not a redraft -----------------------------------
// docs/SCRIPT.md §3.2: the programme cannot read the channel, "all they can
// do is jam individual words and substitute their own — which is why a
// rewritten sign is a real sentence with one or two words wrong, and why the
// true version fits the same skeleton."
//
// Measured as shared words. The floor is a quarter: below that the two lines
// have no skeleton in common and the turn is a redraft, which loses the whole
// drama — you are supposed to RECOGNISE the sentence.
//
// Three of the shipped ten replace more than half, which is deeper than §3.2
// describes. Reported rather than failed: they are the document's own lines,
// and tightening them is a writing decision. See docs/ROADMAP.md.
const deep = [];
for (const b of storyPages()) {
  const w = (s) => new Set(s.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean));
  const a = w(b.text), c = w(b.after);
  let shared = 0;
  for (const x of a) if (c.has(x)) shared++;
  const frac = shared / Math.max(a.size, 1);
  if (frac < 0.25) fail(`"${b.id}" is a redraft, not a jam: ${shared}/${a.size} words kept`);
  else if (frac < 0.5) deep.push(`${b.id} ${shared}/${a.size}`);
}
console.log(`  deeper than "one or two words": ${deep.length ? deep.join(' · ') : 'none'}`);

// ---- every line is legible on a portrait phone ----------------------------
// docs/SCRIPT.md §2.3 / STORY A30: two or three rows on a wall, never more.
// A row of this signage fits about 22 characters at the size it is read at,
// so three rows is about 66. Both versions of a rewritten line have to fit.
const LIMIT = 66;
for (const b of STORY_BEATS) {
  for (const [which, s] of [['text', b.text], ['after', b.after]]) {
    if (!s) continue;
    if (s.length > LIMIT) fail(`"${b.id}".${which} is ${s.length} chars — over three rows`);
  }
}

// ---- the two anchored beats ----------------------------------------------
// §5.2: WE ARE THE ENGINEERS lands ON the unlock door, and the win condition
// lands on the finale. Everything else is spaced between them.
const anchors = STORY_BEATS.filter((b) => b.at).map((b) => `${b.id}@${b.at}`);
console.log(`  anchored: ${anchors.join(' · ')}`);
if (!STORY_BEATS.some((b) => b.at === 'unlock' && b.v === 'B')) {
  fail('no engineers line anchored to the unlock door');
}
if (!STORY_BEATS.some((b) => b.at === 'finale')) fail('nothing anchored to the finale');

// ---- NO DOOR NUMBERS. The whole point of §5 ------------------------------
// A line that carries a door breaks the moment somebody changes a tread of
// the ramp, and the failure is silent: the beat simply never fires.
for (const b of STORY_BEATS) {
  for (const k of Object.keys(b)) {
    if (k === 'ix') continue;
    if (typeof b[k] === 'number') fail(`"${b.id}" carries a number in "${k}" — §5 forbids door numbers`);
  }
}

// ---- ids are unique, and every voice has a register -----------------------
const seen = new Set();
for (const b of STORY_BEATS) {
  if (seen.has(b.id)) fail(`duplicate beat id "${b.id}"`);
  seen.add(b.id);
  if (!STORY_REGISTER[b.v]) fail(`voice "${b.v}" has no register`);
}
// The order is the thing to protect (§5.3), so assert it is actually ordered.
for (let i = 1; i < STORY_BEATS.length; i++) {
  if (STORY_BEATS[i].ix <= STORY_BEATS[i - 1].ix) fail('the ordered list is not ordered');
}
const byReg = {};
for (const b of STORY_BEATS) {
  const r = STORY_REGISTER[b.v];
  byReg[r] = (byReg[r] || 0) + 1;
}
console.log(`  registers: ${Object.entries(byReg).map(([k, n]) => `${k} ${n}`).join(' · ')}`);

// ---- placement, across the ramps the game might actually ship with -------
//
// The whole point of §5 is that no line owns a door: the script re-spaces
// itself when the difficulty ramp is retuned. The unlock could come down from
// door 46 to 15, so this walks a spread of ramps and checks the shape holds
// on every one of them.
import { SPEED, unlockDoor, finaleDoor, speedAt } from '../src/balance.js';
import { storyDoors, STORY_PACE } from '../src/story.js';

console.log('');
console.log('  ramp             U    F  speed@F  placed   cut');
const RAMPS = [
  ['shipped', {}],
  ['stepM 0.6', { stepM: 0.6 }],
  ['stepM 1.0', { stepM: 1.0 }],
  ['stepM 1.44', { stepM: 1.44 }],
  ['stepM 2.4', { stepM: 2.4 }],
  ['stepDoors 2', { stepDoors: 2 }],
  ['school 4', { stepM: 1.44, schoolDoors: 4 }],
];
for (const [label, over] of RAMPS) {
  const S = { ...SPEED, ...over };
  const U = unlockDoor(S), F = finaleDoor(S);
  const m = storyDoors({ unlock: U, finale: F, schoolDoors: S.schoolDoors });
  console.log(`  ${label.padEnd(15)}${String(U).padStart(3)} ${String(F).padStart(4)}` +
    `   ${speedAt(F, S).toFixed(1).padStart(5)}    ${String(m.beats.length).padStart(2)}/25   ` +
    (m.cut.length ? m.cut.map((x) => x.id).join(',') : 'none'));

  // THE ORDER IS THE THING TO PROTECT (§5.3). A line out of sequence is worse
  // than a line missing: the reveal about being the ninth subject arriving
  // after Hale says he was the eighth is the story told backwards.
  for (let i = 1; i < m.beats.length; i++) {
    if (m.beats[i].door <= m.beats[i - 1].door) {
      fail(`${label}: ${m.beats[i].id} on door ${m.beats[i].door} is not after ` +
        `${m.beats[i - 1].id} on ${m.beats[i - 1].door}`);
      break;
    }
  }
  // ...and the ordered list stays ordered: what is placed must be a
  // subsequence of the script, never a reshuffle.
  const script = STORY_BEATS.map((b) => b.id);
  let at = -1;
  for (const b of m.beats) {
    const ix = script.indexOf(b.id);
    if (ix <= at) { fail(`${label}: ${b.id} is out of script order`); break; }
    at = ix;
  }

  // The two anchored beats land exactly on their anchors — §5.2. The
  // engineers identify themselves on the door the power arrives on, and the
  // win condition is on the last door.
  const onUnlock = m.beats.find((b) => b.at === 'unlock');
  const onFinale = m.beats.find((b) => b.at === 'finale');
  if (!onUnlock || onUnlock.door !== U) {
    fail(`${label}: the engineers' line is on ${onUnlock && onUnlock.door}, not the unlock door ${U}`);
  }
  if (!onFinale || onFinale.door !== F) {
    fail(`${label}: the win condition is on ${onFinale && onFinale.door}, not the last door ${F}`);
  }
  // The closing act owns the last few doors and nothing else is in there.
  const tailFrom = F - STORY_PACE.tailDoors;
  const inTail = m.beats.filter((b) => b.door >= tailFrom);
  if (inTail.some((b) => b.act !== 'copy')) {
    fail(`${label}: ${inTail.filter((b) => b.act !== 'copy').map((b) => b.id).join(',')} ` +
      `is inside the closing stretch`);
  }
  // Nothing lands past the last door, or before the first.
  for (const b of m.beats) {
    if (b.door < 1 || b.door > F) fail(`${label}: ${b.id} is on door ${b.door}`);
  }
  // A cut beat is cut, not silently placed somewhere.
  for (const c of m.cut) {
    if (m.beats.some((b) => b.id === c.id)) fail(`${label}: ${c.id} is both cut and placed`);
  }
  if (m.beats.length + m.cut.length !== 25) {
    fail(`${label}: ${m.beats.length} placed + ${m.cut.length} cut is not 25`);
  }
}

// The shipped ramp has to carry the whole script. If it cannot, the script is
// too long for the game rather than the game too short for the script.
const now = storyDoors({ unlock: unlockDoor(), finale: finaleDoor(),
  schoolDoors: SPEED.schoolDoors });
if (now.cut.length) fail(`the shipped ramp cuts ${now.cut.length} beats`);

// ---- the decode log ------------------------------------------------------
// Both versions of every line that turns over, with how much of the sentence
// survives. The goal is a majority kept — the player should recognise the
// sentence they read before — without it being a rule that blocks a line
// whose meaning has to change.
console.log('');
console.log('  beat        kept  reads → after its page');
const words = (t) => new Set(t.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean));
let majority = 0;
for (const b of storyPages()) {
  const a = words(b.text), c = words(b.after);
  let k = 0;
  for (const x of a) if (c.has(x)) k++;
  if (k / a.size >= 0.5) majority++;
  console.log(`  ${b.id.padEnd(11)} ${String(k) + '/' + a.size}   ${b.text}`);
  console.log(`  ${' '.repeat(11)}      → ${b.after}${b.was ? '   (was: ' + b.was + ')' : ''}`);
}
console.log(`  ${majority} of ${storyPages().length} keep a majority of the sentence`);
if (majority < 9) fail(`only ${majority} of 10 rewrites keep a majority`);

console.log(`errors: ${bad}`);
