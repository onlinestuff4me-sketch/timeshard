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

console.log(`errors: ${bad}`);
