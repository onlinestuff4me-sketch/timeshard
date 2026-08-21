// ---------------------------------------------------------------------------
// THE MODE REGISTRY — every mode the game can start, in the order it was
// built.
//
// One list, two readers: the menu's OTHER MODES row and the MODES section in
// Settings both render from this, so a mode cannot exist in one and not the
// other, and its one-line description cannot say two different things in two
// places (docs/PILLARS.md §7).
//
// Build order is the sort order because it is the only ordering that stays
// true on its own. Alphabetical says nothing; "best first" is an opinion that
// goes stale; newest-first would reshuffle the list every time we prototype.
// Reading down the list is reading the game's history, which is also roughly
// the order of how much has been built on top of each one.
//
// `line` is one line. It is the whole description a player gets, so it says
// what you DO, not what the mode is about.
// ---------------------------------------------------------------------------

export const MODES = [
  {
    id: 'wave',
    name: 'CITY STREETS',
    line: 'Endless waves in the white city — the original arena.',
  },
  {
    id: 'rush',
    name: 'RUSH HOUR',
    line: 'Freeze the crowd, find the one face that matters, walk out.',
  },
  {
    id: 'hall',
    name: 'THE TUNNEL',
    line: 'Door to door, deeper each time. The main game.',
    main: true,   // this is what PLAY starts; it needs no button of its own
  },
  {
    id: 'duel',
    name: 'CORRIDOR DUEL',
    line: 'They come to you. Drag to sidestep, tap them to shatter.',
    simple: true,
    // Time is not yours here: it drops on its own while a round is in the air.
    time: 'incoming',
  },
  {
    id: 'stop',
    name: 'DEAD STOP',
    line: 'Time only moves while you do. Stand still and the world waits.',
    simple: true,
    time: 'motion',
  },
];

export const modeById = (id) => MODES.find((m) => m.id === id) || null;

// The simplified modes: one movement mechanic, no look, no time button. Kept
// as a predicate rather than a list of ids in main.js so adding a third one
// is a line in this file and nothing else.
export const isSimple = (id) => !!(modeById(id) || {}).simple;
