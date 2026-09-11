// ---------------------------------------------------------------------------
// THE SCRIPT, AS DATA
//
// The specification is docs/SCRIPT.md §6. Twenty-five lines in five acts, in
// order, and the order is the thing to protect — §5.3: "The ordered list is
// the thing to protect; the doors are arithmetic."
//
// SO THERE ARE NO DOOR NUMBERS IN THIS FILE. Not one. `unlockDoor()` in
// balance.js is a SPEED rather than a door, so the door slow time arrives on
// moves every time the ramp is retuned — and the finale is derived the same
// way. A line pinned to door 30 breaks the moment somebody changes a tread.
// Placement is computed from those two anchors; see docs/ROADMAP.md phase 2.
//
// THREE VOICES, and which one a line belongs to decides how it reaches the
// player as well as whether it is true:
//
//   P  the programme      stencilled signage       deliberately false
//   S  Hale, the eighth   paint on the masonry     honest, wrong in places
//   B  the engineers      stencilled, never jammed true
//
// P and B share a register, which is a known hole — the true voice and the
// false one look alike. docs/ROADMAP.md Q-D settles it by how they ARRIVE
// rather than by a third look, and that is phase 3's problem, not this file's.
// ---------------------------------------------------------------------------

// A line that decodes carries `after`: what the wall says once the player has
// the page for it. The programme cannot read the channel — all it can do is
// jam individual words and substitute its own — so a rewritten line is the
// same sentence with one or two words turned over, and the skeleton survives.
// See docs/SCRIPT.md §3.2.
export const STORY_ACTS = [
  {
    id: 'test', name: 'The Test',
    // The first line reads as interface. The third turns it into a character
    // in four words.
    beats: [
      { v: 'P', text: 'YOUR SESSION HAS RESUMED' },
      { v: 'P', text: 'THE EXIT IS JUST AHEAD',
        after: 'THE EXIT AHEAD IS A LIE' },
      { v: 'S', text: 'they write these signs' },
      { v: 'P', text: 'YOU ARE PERFORMING WELL' },
      { v: 'P', text: 'EVERY DOOR YOU REACH IS RECORDED',
        after: 'EVERY TIME YOU DIE IS RECORDED' },
      { v: 'S', text: 'this is not a simulation' },
    ],
  },
  {
    id: 'others', name: 'The Others',
    // "i was the eighth" lands one beat after the player learns they are
    // ninth, which is when a name means something.
    beats: [
      { v: 'P', text: 'YOU ARE THE FIRST TO GET THIS FAR',
        after: 'YOU ARE THE NINTH TO GET THIS FAR' },
      { v: 'S', text: 'i was the eighth' },
      { v: 'P', text: 'ALL SUBJECTS ARE RELEASED WHEN THEY FINISH',
        after: 'ALL SUBJECTS ARE ERASED WHEN THEY FINISH' },
      { v: 'S', text: 'i never got out' },
      { v: 'S', text: 'their files call them ENGINEERS' },
    ],
  },
  {
    id: 'anomaly', name: 'The Anomaly',
    // The 1947 line swaps two words and both matter: not a simulation, and
    // not built.
    beats: [
      { v: 'S', text: 'they did not build this place' },
      { v: 'P', text: 'THIS SIMULATION WAS BUILT IN 1947',
        after: 'THIS PLACE WAS FOUND IN 1947' },
      { v: 'S', text: 'no engineer is on the payroll · i checked' },
      // TIGHTENED: was `THIS CHANNEL IS WRITTEN OVER BY THE PROGRAMME`,
      // which kept three words of seven. One word turns over now, and it is
      // the better line for it — the programme's own justification survives
      // intact and becomes the horror, which is exactly what §3.1 says
      // happened: the voice began as a psychiatric measure.
      { v: 'P', text: 'THIS CHANNEL IS MONITORED FOR YOUR SAFETY',
        after: 'THIS CHANNEL IS REWRITTEN FOR YOUR SAFETY',
        was: 'THIS CHANNEL IS WRITTEN OVER BY THE PROGRAMME' },
      { v: 'S', text: 'i could never read the numbers · you might' },
      // ANCHORED, NOT SPACED — docs/SCRIPT.md §5.2. The programme's jamming
      // fails on exactly the door the player's ability changes: the builders
      // hand over the power and identify themselves in the same breath, and
      // it costs nothing because both are derived from the same number.
      //
      // It also turns over a word the player has read as staff since Hale
      // first used it — one the programme has had in its own filing for
      // eighty years without knowing what it meant.
      { v: 'B', text: 'WE ARE THE ENGINEERS · THAT IS THEIR WORD', at: 'unlock' },
    ],
  },
  {
    id: 'watchers', name: 'The Watchers',
    // ELEVEN reads as believable — eight before the player, plus a few —
    // until one jammed word turns it into a number that predates the
    // programme. PASS THE TEST is the only promise anybody makes, and it is
    // the one that is true.
    beats: [
      { v: 'B', text: 'WE LEFT THIS PLACE RUNNING AND WALKED AWAY' },
      { v: 'B', text: 'IT IS NOT A WEAPON · IT IS A TEST' },
      { v: 'P', text: 'ELEVEN PEOPLE HAVE BEEN THROUGH THIS PLACE',
        after: 'ELEVEN THOUSAND HAVE BEEN THROUGH THIS PLACE' },
      // TIGHTENED: was `NO ONE HAS EVER BEEN SENT HOME`, two words of
      // seven. The skeleton is kept and the promise becomes a statement that
      // it has never once happened — the same fact, in the sentence the
      // player already read.
      { v: 'P', text: 'YOU WILL BE SENT HOME WHEN YOU FINISH',
        after: 'NO ONE WILL BE SENT HOME WHEN THEY FINISH',
        was: 'NO ONE HAS EVER BEEN SENT HOME' },
      { v: 'B', text: 'PASS THE TEST AND WE WILL SPEAK WITH YOU' },
    ],
  },
  {
    id: 'copy', name: 'The Copy',
    // The last line is the win condition in plain words, and both versions
    // are true instructions — the false one just stops one step short of the
    // thing that wins.
    beats: [
      // TIGHTENED: was `THE LAST DOOR HOLDS SOMETHING WEARING YOUR FACE`,
      // three words of eight. One word now — READY becomes COPIED — and the
      // line stops being a reassurance about the player's readiness and
      // starts explaining the mechanic: the door is waiting on the copy, not
      // on them.
      { v: 'P', text: 'THE LAST DOOR OPENS WHEN YOU ARE READY',
        after: 'THE LAST DOOR OPENS WHEN YOU ARE COPIED',
        was: 'THE LAST DOOR HOLDS SOMETHING WEARING YOUR FACE' },
      { v: 'S', text: 'i died behind the last door' },
      { v: 'P', text: 'HOLD STILL AND TIME WILL SLOW FOR YOU',
        after: 'HOLD PERFECTLY STILL AND TIME WILL STOP', at: 'finale' },
    ],
  },
];

// The whole script as one ordered list, which is how §5 says to think about
// it: an ordered list plus two anchors, never a table of door numbers.
export const STORY_BEATS = STORY_ACTS.flatMap((a, ai) =>
  a.beats.map((b, bi) => ({
    ...b,
    act: a.id,
    actName: a.name,
    // A stable name for a beat, so a save can record which have been read and
    // which pages are owed without depending on where the ramp put them.
    id: `${a.id}${bi + 1}`,
    ix: ai * 100 + bi,
  })));

// HOW A VOICE REACHES THE PLAYER. The register is a property of who is
// speaking, not of the line — which is the whole reason one glyph sorts Hale
// from the building by eye. See docs/SCRIPT.md §3 and docs/MARKS.md §2.
export const STORY_REGISTER = {
  P: 'sign',    // stencilled: the floating label the simulation draws
  B: 'sign',    // ...the same, and Q-D is about how it arrives instead
  S: 'paint',   // a can and a wall
};

// WHICH LINES OWE A PAGE. Ten of the twenty-five decode, and every one of
// them is the programme's: Hale never had the key and the engineers are never
// jammed, so neither has anything to turn over.
export const storyPages = () => STORY_BEATS.filter((b) => b.after);

// --- WHERE THE BEATS LAND -------------------------------------------------
//
// Two anchors and a steady drip between them. Everything here is a knob,
// because the difficulty ramp is going to move: the door slow time arrives on
// could come down from 46 to 10 or 15, and the whole script has to re-space
// itself against that without anybody editing a line.
export const STORY_PACE = {
  // ONE BEAT PER DOOR IS THE FLOOR. docs/SCRIPT.md §5.3 walks the ramp down
  // to door 12 and calls every-door "tight", which is the accepted bottom —
  // and it is acceptable because two lines on consecutive doors are read
  // twenty metres of corridor apart, not stacked on one screen.
  minGap: 1,
  // THE LAST STRETCH IS ANCHORED, NOT SPACED. §5.1: the closing act lives in
  // the last four doors, the final beat on the last door itself. Held apart
  // from the spacing arithmetic because "the last four doors" is a fact about
  // the ending rather than a share of a range.
  tailDoors: 4,
  // ...and it is this many BEATS. Counted separately from the doors above,
  // because they are different units and mixing them is exactly the bug this
  // knob replaced: slicing the beat list by a door count put a middle-act
  // line between two closing ones on a fast ramp.
  tailBeats: 3,
  // ...and the act 4 span stops short of it. §5.1 has both act 4's last beat
  // and act 5's first at F−4, which is one door carrying two lines; the fix
  // is a door of clearance rather than a tie-break.
  tailClear: 2,
};

// KEEP `n` OF A LIST, SPREAD THROUGH IT. When a span cannot hold its beats at
// the floor above, §5.3 is explicit: "the fix is to cut beats rather than to
// compress them. The ordered list is the thing to protect." So beats are
// dropped rather than crowded — thinned evenly, keeping the first and the
// last, so the arc still has a beginning, a middle and an end.
function thin(list, keep) {
  if (keep >= list.length) return list.slice();
  if (keep <= 1) return list.slice(0, Math.max(0, keep));
  const out = [];
  for (let i = 0; i < keep; i++) {
    out.push(list[Math.round(i * (list.length - 1) / (keep - 1))]);
  }
  return out;
}

// `n` beats across doors `from`..`to`, the last of them ON `to`. This is
// §5.1's "range ÷ beats": the illustration there puts eleven beats over
// forty-five doors at every four, which is what this returns.
function spread(from, to, n) {
  const range = to - from + 1;
  if (n <= 0 || range <= 0) return [];
  const out = [];
  for (let i = 0; i < n; i++) out.push(from - 1 + Math.round((i + 1) * range / n));
  return out;
}

// WHICH DOOR EACH LINE IS ON, for a given ramp.
//
//   unlock       the door slow time arrives on — balance.js unlockDoor()
//   finale       the last door                 — balance.js finaleDoor()
//   schoolDoors  how long the staircase holds while slow time is taught
//
// Returns the beats that FIT, each with its door, plus the ones that had to be
// cut so a caller can see what a fast ramp costs. Nothing here reads SPEED
// directly: the anchors arrive as numbers so this stays pure and testable.
export function storyDoors({ unlock, finale, schoolDoors = 0 } = {}) {
  const U = Math.max(2, unlock | 0);
  const F = Math.max(U + 1, finale | 0);
  const { minGap, tailDoors, tailClear } = STORY_PACE;
  const cut = [];
  const placed = [];

  const atUnlock = STORY_BEATS.findIndex((b) => b.at === 'unlock');
  const atFinale = STORY_BEATS.findIndex((b) => b.at === 'finale');

  // Everything before the unlock beat, dripped from door 1 to the door before
  // the unlock — so the last of them lands immediately before the handover.
  const fit = (beats, from, to) => {
    const room = Math.max(0, Math.floor((to - from + 1) / minGap));
    const keep = thin(beats, room);
    if (keep.length < beats.length) {
      for (const b of beats) if (!keep.includes(b)) cut.push(b);
    }
    spread(from, to, keep.length).forEach((door, i) => {
      placed.push({ ...keep[i], door });
    });
  };

  fit(STORY_BEATS.slice(0, atUnlock), 1, U - 1);
  placed.push({ ...STORY_BEATS[atUnlock], door: U });

  // The middle act runs from the far side of the school to a clear door short
  // of the closing stretch.
  const tailN = Math.max(1, Math.min(STORY_PACE.tailBeats, STORY_BEATS.length - atUnlock - 1));
  const mid = STORY_BEATS.slice(atUnlock + 1, STORY_BEATS.length - tailN);
  const tail = STORY_BEATS.slice(STORY_BEATS.length - tailN);
  // NOT CLAMPED UP TO `midFrom`. When the school's plateau runs past the door
  // the closing stretch begins on, the middle act has NO span — and clamping
  // it to a single door put its lines inside the ending, out of order and
  // sometimes on the same door as one of them. An empty span cuts its beats,
  // which `fit` already does, and that is the honest answer: on a ramp fast
  // enough, there is no room for that act and it should be visibly missing
  // rather than quietly interleaved.
  const midFrom = U + Math.max(0, schoolDoors | 0);
  fit(mid, midFrom, F - tailDoors - tailClear);

  // ...and the closing beats in the last `tailDoors`, the final one on F.
  const step = tail.length > 1 ? tailDoors / (tail.length - 1) : 0;
  tail.forEach((b, i) => {
    placed.push({ ...b, door: Math.round(F - tailDoors + i * step) });
  });

  placed.sort((a, b) => a.door - b.door || a.ix - b.ix);
  return { unlock: U, finale: F, beats: placed, cut };
}

// THE EARLIEST UNLOCK DOOR THE WHOLE SCRIPT FITS BEFORE.
//
// Every beat ahead of the anchored one wants a door of its own at the floor
// in STORY_PACE, so this is simply how many of them there are, plus the
// anchor's own door. Computed rather than written down, because the answer
// changes the moment a line is added to or cut from acts 1 to 3.
//
// WHY IT MATTERS RIGHT NOW. The difficulty ramp is being reworked in another
// session so that rounds get fast ON the door the time button arrives, rather
// than thirty-six doors later — today `powerUnlockDoor()` is 10 and
// `unlockDoor(SPEED)` is 46, and they are meant to become one number. If that
// number lands below this one, the script does not fit in front of it and the
// fix is to cut beats from the early acts rather than to crowd them
// (docs/SCRIPT.md §5.3). See docs/ROADMAP.md.
export function storyMinUnlock() {
  const before = STORY_BEATS.findIndex((b) => b.at === 'unlock');
  return before * STORY_PACE.minGap + 1;
}

// A count check that lives with the data rather than in a comment, because
// the script is transcribed from a document and a dropped line is silent.
export const STORY_SHAPE = {
  beats: STORY_BEATS.length,           // 25
  pages: storyPages().length,          // 10
  acts: STORY_ACTS.length,             // 5
  anchored: STORY_BEATS.filter((b) => b.at).length,   // 2 — unlock, finale
};
