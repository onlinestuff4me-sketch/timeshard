// ---------------------------------------------------------------------------
// THE MODE REGISTRY — every mode the game can start.
//
// One list, two readers: the menu's CHOOSE A GAME picker and the MODES
// section in Settings both render from this, so a mode cannot exist in one
// and not the other, and its one-line description cannot say two different
// things in two places (docs/PILLARS.md §7).
//
// ORDER: the main game first, then the rest in the order they were built.
//
// Those are two different jobs and neither one alone does both. The top of a
// list is where a reader looks first, and what they should find there is the
// game — not the oldest thing we happen to still ship. Everything under it is
// in build order because that is the only ordering of the alternates that
// stays true on its own: alphabetical says nothing, "best first" is an
// opinion that goes stale, and newest-first would reshuffle the list every
// time we prototype. So the list reads as "here is the game, and here is
// everything else we have tried, oldest first", which is what it is.
//
// `main: true` is what puts a mode at the top of both lists, and it is also
// the game a first launch opens on (`DEFAULT_MODE` in main.js reads it). One
// flag, so those two cannot disagree.
//
// `line` is one line. It is the whole description a player gets, so it says
// what you DO, not what the mode is about.
//
// `unit` is what one step of progress is CALLED in that mode, because the
// leaderboard is per mode and "WAVE 12" is a lie in a game made of doors.
// `null` means the count does not move there and the board leaves it out
// rather than ranking everybody equal-first.
//
// ---------------------------------------------------------------------------
// UNLOCKING — `doors`, and why the order is what it is.
//
// The tunnel is the game: it has the lesson in it, it is the only mode with a
// progression to climb, and every other mode is bought with that climb. So
// `doors` is how many tunnel doors you have ever passed before a mode opens,
// and the tunnel itself has none.
//
// The ORDER is by how much the mode asks of your hands, not by when it was
// built. A player who has just been taught two thumbs and a time button gets
// the two ONE-THUMB modes first — they are a rest, and they teach the dodge
// on its own — and the two full-control arena games last, because those ask
// for everything the tunnel taught at once and with no doors to pace it.
//
// `preview` is a short looping clip of the mode being played, shown on its
// card in the selector. See tools/rec-previews.mjs, which makes them.
// ---------------------------------------------------------------------------

export const MODES = [
  {
    id: 'hall',
    unit: 'DOOR',
    name: 'THE TUNNEL',
    line: 'Door to door, deeper each time. The main game.',
    main: true,
    doors: 0,          // the game itself is never locked
    preview: 'assets/preview/hall.webm',
  },
  {
    id: 'wave',
    unit: 'WAVE',
    name: 'CITY STREETS',
    line: 'Endless waves in the white city — the original arena.',
    doors: 15,
    preview: 'assets/preview/wave.webm',
  },
  {
    id: 'rush',
    unit: null,
    name: 'RUSH HOUR',
    line: 'Freeze the crowd, find the one face that matters, walk out.',
    doors: 20,
    preview: 'assets/preview/rush.webm',
  },
  {
    id: 'duel',
    unit: 'ROUND',
    name: 'CORRIDOR DUEL',
    line: 'They come to you. Drag to sidestep, tap them to shatter.',
    simple: true,
    // Time is not yours here: it drops on its own while a round is in the air.
    time: 'incoming',
    doors: 5,
    preview: 'assets/preview/duel.webm',
  },
  {
    id: 'stop',
    unit: 'ROUND',
    name: 'STAND STILL',
    line: 'Time only moves while you do. Stand still and the world waits.',
    simple: true,
    time: 'motion',
    doors: 10,
    preview: 'assets/preview/stop.webm',
  },
];

export const modeById = (id) => MODES.find((m) => m.id === id) || null;

// The simplified modes: one movement mechanic, no look, no time button. Kept
// as a predicate rather than a list of ids in main.js so adding a third one
// is a line in this file and nothing else.
export const isSimple = (id) => !!(modeById(id) || {}).simple;

// The locked modes in the order they open, which is the order the selector
// lists them in and the order UNLOCKS counts them in. Shallowest gate first,
// so the list reads as a route rather than a set.
export const LOCKED_MODES = MODES.filter((m) => (m.doors || 0) > 0)
  .sort((a, b) => a.doors - b.doors);

// WHAT IT TAKES, in the player's words. One line, on the card and in UNLOCKS,
// so the two cannot describe the same gate differently.
export function unlockLine(id) {
  const m = modeById(id);
  if (!m || !m.doors) return '';
  return `REACH DOOR ${m.doors} IN THE TUNNEL`;
}

// IS IT OPEN? `doors` is the deepest door the player has ever reached, across
// every save — unlocking is the player's, like UNLOCKS itself, not the save's.
//
// `played` is the grandfather clause and it is not a nicety: these gates are
// being added to a game people are already playing, and somebody who has put
// twenty runs into City Streets must not open the app to find it locked
// behind a tunnel they have never touched. Any mode you have a save in is
// yours, whatever the gate says.
export function modeUnlocked(id, doors = 0, played = null) {
  const m = modeById(id);
  if (!m) return false;
  if (!m.doors) return true;
  if (played && played.has(id)) return true;
  return doors >= m.doors;
}
