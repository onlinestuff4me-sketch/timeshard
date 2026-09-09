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
      { v: 'P', text: 'THIS CHANNEL IS MONITORED FOR YOUR SAFETY',
        after: 'THIS CHANNEL IS WRITTEN OVER BY THE PROGRAMME' },
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
      { v: 'P', text: 'YOU WILL BE SENT HOME WHEN YOU FINISH',
        after: 'NO ONE HAS EVER BEEN SENT HOME' },
      { v: 'B', text: 'PASS THE TEST AND WE WILL SPEAK WITH YOU' },
    ],
  },
  {
    id: 'copy', name: 'The Copy',
    // The last line is the win condition in plain words, and both versions
    // are true instructions — the false one just stops one step short of the
    // thing that wins.
    beats: [
      { v: 'P', text: 'THE LAST DOOR OPENS WHEN YOU ARE READY',
        after: 'THE LAST DOOR HOLDS SOMETHING WEARING YOUR FACE' },
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

// A count check that lives with the data rather than in a comment, because
// the script is transcribed from a document and a dropped line is silent.
export const STORY_SHAPE = {
  beats: STORY_BEATS.length,           // 25
  pages: storyPages().length,          // 10
  acts: STORY_ACTS.length,             // 5
  anchored: STORY_BEATS.filter((b) => b.at).length,   // 2 — unlock, finale
};
