// ---------------------------------------------------------------------------
// THE ONBOARDING, AS DATA
//
// The specification this implements is docs/TUTORIAL-GOALS.md. Its four rules,
// because every line below is downstream of them:
//
//   1. one lesson at a time
//   2. the message stays until the lesson is COMPLETE
//   3. nothing on screen that does not serve the lesson
//   4. the next area opens on success, never on a clock
//
// The SHAPE of the lesson lives here; the MACHINERY lives in main.js. This
// module says which legs get built and what shape they are, what the player is
// allowed to do on each step, and what words appear where and on which beat.
// main.js says what "reached the corner" means and how a barrier sinks.
//
// tool/ imports this file directly, which is the point: what the level tool
// edits is what the game runs, so a preview cannot lie. Same property
// src/genleg.js has for corridors.
// ---------------------------------------------------------------------------

// --- the numbers -----------------------------------------------------------
import { planToCells } from './genleg.js';

export const TUTOR = {
  hallCells: 7,         // default straight cells, when a leg does not say
  // CLOSE ENOUGH TO SEE FROM THE CORNER. At six cells past the rejoin the
  // barrier stood 56 m from the last turn, which on a phone is a corridor
  // fading to white — so it and its sign appeared out of nothing half way
  // down the straight instead of being the thing you turn the corner and see.
  // ...AND A COUPLE OF CELLS NEARER THAN IT WAS. This counts from the last
  // CORNER now — with the fork gone there is no rejoin to count from — and
  // the old arrangement put the barrier eight cells past it, 32 m of straight.
  // Two cells nearer is 24 m: still a walk, still small and far off when they
  // turn the corner and see it, which is what makes it a place rather than an
  // announcement. (Two cells flat measured 8 m, which is not a walk at all.)
  barrierCells: 5,      // cells from the last corner to the barrier
  barrierH: 1.05,       // low enough to see and shoot over
  standWithin: 2.6,     // metres from the barrier that counts as standing at it
  // FOUR, NOT FIVE. At five the gunner stood twenty metres past the barrier,
  // which on a portrait phone is a figure a centimetre tall firing a round the
  // player has to be told is there. Close enough to read the arm going up.
  // HOW FAR BEFORE THE FIRST CORNER THE LOOKING LESSON STARTS. In cells, so a
  // path edit in the tool cannot strand it. Eight metres — a shade more than
  // EARLY.wayLookM, so the words land just before the needle begins to turn.
  lookLeadCells: 2,
  // HOW CLOSE TO STRAIGHT DOWN THE HALLWAY COUNTS AS FACING IT — see the
  // `faced` event. Forty degrees either side: the corridor is about forty-two
  // degrees wide on a portrait phone, so this is "the hallway fills the
  // frame" rather than "the hallway is somewhere on screen". Tighter and a
  // player walking the corner on a diagonal never satisfies it and carries
  // DRAG TO MOVE all the way to the T; looser and it fires while they are
  // still looking at the corner wall.
  facedDeg: 40,
  // --- THE JOKE AT THE END OF THE DEAD END --------------------------------
  // The man in the wrong arm of the T is not a difficulty spike, he is a
  // punchline, and the three numbers below are what keep him one.
  //
  // His telegraph is HALF a gunner's, because his arm is already up when you
  // round the corner — there is nothing to raise, so the wind-up would only
  // be a pause. His round is faster than a sniper's, because a round that
  // merely arrives quickly reads as a skill test the player failed: a player
  // who backtracks at full speed has to plainly not make it, or the gag is a
  // lesson about reaction time and the corridor has told a lie about what it
  // wanted. And the red screen is short, because it is a beat, not a stop.
  jokeAim: 0.5,         // multiplier on the gunner's telegraph
  jokeSpeed: 3.2,       // ...and on the round's speed
  jokeCd: 0.15,         // ...and on the wait before the next one
  jokeHold: 1.5,        // seconds of red before you are back at the junction
  enemyCells: 4,        // cells beyond the barrier the first gunner stands
  enemyX: 1.15,         // ...and how far to either side the other two stand.
                        // A one-cell leg is 4 m of cell less 0.3 m of wall each
                        // side: 3.4 m of floor, so ±1.7 IS the wall and a body
                        // placed there is inside it.
  // ROUNDS HERE ARE ORDINARY ROUNDS — same speed in both clocks as every other
  // round in the game, because a tutorial that teaches a slower bullet than the
  // game fires has taught the wrong timing. What makes the first one fair is
  // not a handicap, it is that the world STOPS on the telegraph until the
  // player has read the prompt and pressed the button.
  aimBeat: 1.2,         // seconds from the enemy appearing to his arm rising
  // THE FREEZE LANDS ON THE ROUND, NOT ON THE ARM. It used to stop the world
  // part-way through the telegraph, so the words said DODGE THE BULLET with no
  // bullet anywhere on the screen: the player was asked to dodge a thing they
  // had never seen. He fires first, the round clears the muzzle, and THEN the
  // world stops — with the thing they have to get out of the way of hanging in
  // the air in front of them.
  // Not a third — nearly half. At a third the round is still inside the
  // gunner's silhouette, so the ring that names it reads as "this man" rather
  // than "this bullet". Clear of him, it is unmistakably a separate thing
  // hanging in the air, with eight metres still to come.
  freezeAfter: 0.45,    // of the way from the muzzle to the player
  // ...AND IT SETTLES INTO THE STOP RATHER THAN HITTING IT. The freeze used
  // to set the world's clock to zero on one frame, which took the bullet-time
  // zoom with it — the FOV is read straight off `timeScale` — so the lesson
  // opened with a jolt. Eased to a standstill over about half a second, and
  // then clamped to a true zero so nothing creeps while the player reads the
  // prompt. The round keeps travelling while it slows; see the harness note
  // on where it ends up.
  // 4/s: nine tenths of the way to a standstill in 0.58 s and a true zero by
  // about 1.2, against the single frame it used to take. Slower than this and
  // the stop stops reading as a stop; faster and the lens snap comes back.
  holdEase: 4,          // 1/s toward a dead stop once the freeze is called
  // ...and once they let it go, it travels at a pace a person can read. The
  // ordinary rule is that time moves when YOU move (0.05 standing still), and
  // at that rate a round twelve metres out takes half a minute to arrive: on
  // the beat that teaches dodging, the bullet did not appear to move at all.
  // The floor lifts for the dodging lessons and the ordinary rule comes back
  // with the meter, which is the lesson that is about the cost of slow time.
  // HOW FAR SIDEWAYS COUNTS AS OUT OF THE WAY. The freeze in the dodge lesson
  // is released by MOVING, not by a button — the slow-time control does not
  // exist yet — so this is the whole answer to "have they done it".
  dodgeStepM: 0.85,
  // HALF THE WIDTH OF THE LANE a round has to be passing through for it to be
  // worth saying DODGE about. The player's own hit radius is 0.32m; this is
  // wider because the prompt has to arrive while there is still time to act on
  // it, and a round that will shave past at half a metre is one you want to
  // have moved for. Anything outside it is a round going somewhere else.
  dodgeLaneM: 0.75,
  // What counts as having dragged, for the `aimed` event: a sixth of a turn
  // of look, or a metre of walk. Either is unmistakably deliberate; neither is
  // reachable by a thumb that only ever taps.
  aimedYaw: 0.52,
  aimedM: 1.0,

  // --- THE DEFERRED SLOW-TIME LESSONS --------------------------------------
  // Nothing in the shipped sequence reads anything below this line. It is the
  // machinery for teaching the time button and the meter, kept whole and kept
  // WIRED because that lesson is coming back — it is deferred past the
  // onboarding for now (docs/TUTORIAL-GOALS.md §5) and unlocks at a door
  // instead. When it returns it should be a data change, not an excavation.
  //
  // `DEFERRED` below holds the steps themselves, off the running order but in
  // the spec, so the tool lists them and `slowlesson.js` exercises them. That
  // is the difference between machinery that is kept and machinery that rots.
  dodgeScale: 0.18,     // floor on world speed while a taught round is in flight
  meterSecs: 7,         // meter: full to the knee, in seconds
  meterCrawlSecs: 70,   // ...and the rate below the knee
  meterKnee: 0.5,       // where the drain slows
  meterFloor: 0.25,     // how low the demo is ever allowed to take it
  resumeDelay: 1.6,     // beat between the meter appearing and the way out
  warnAt: 0.5,          // fraction of the TANK left that trips the reminder
  rampDrain: 0.5,       // multiplier on the bank's drain while a lesson runs
  volleyGap: 2.6,       // seconds between rounds in the three-round lesson
  // ...BUT ONCE THE ROUND IS PAST, THE BEAT IS SHORT. `volleyGap` also spaces
  // the FIRST shot of a beat, where the pause is doing work — the player has
  // just arrived and is reading. After a dodge they are standing there having
  // already done the thing, and 2.6 s of nothing reads as the lesson being
  // over. One second: long enough to see the round leave, short enough that
  // three of them are one exercise rather than three waits.
  //
  // 0.05, NOT 0.4: THE ARM STARTS UP AS THE ROUND GOES BY. This is the
  // countdown BEFORE the telegraph, and the telegraph is the tell the player
  // is here to learn, so it is the only part of the wait that is teaching
  // anything. Measured on the barrier beat, one round to the next:
  //
  //     round goes past -> arm rises     0.61-0.71 s   <- this constant
  //     arm rises       -> round leaves  0.66-0.77 s   <- the tell; untouched
  //     round leaves    -> goes past     3.75-4.41 s   <- the flight
  //
  // so the gap was the only second of the five-and-a-half a player spends per
  // round that was pure waiting. At 0.05 the next arm comes up on the frame
  // the last round clears you and the beat reads as one man working rather
  // than three separate events. (It was 2.6 before that, which with the
  // telegraph was 3.2 s of standing still.)
  dodgeGap: 0.05,
  // THE DODGE PROMPT, OUT IN THE TRAINING ROOMS. Lesson 5 teaches the dodge
  // against a round that is fired to be dodged; after the barrier the rooms
  // are real fights, and a player who has not internalised it just stands in
  // the lane and dies without ever learning why. So the lesson comes back —
  // for the FIRST round fired at him in an area, and only if that round is
  // still on course to hit when it is most of the way over. One round per
  // area, because a prompt that fires whenever somebody is in trouble is not
  // a rescue, it is a nag.
  //
  // 0.75, NOT 0.45 like the lesson's own freeze: this one interrupts a real
  // fight, so it waits as long as it can and still leave a quarter of the
  // flight to move in. Earlier and it stops the world over a round he was
  // already stepping out of.
  rescueAt: 0.75,       // fraction of the muzzle-to-player distance flown
  // 0.55 m = the player's 0.32 m radius and a graze. This is the answer to
  // "is he still in the path", so it has to mean the round would land; at the
  // metre it used to be, a bullet sailing past his shoulder brought up DODGE
  // THE BULLET and told a player who had just dodged that he had not.
  rescueLane: 0.55,     // metres off the round's line and still a threat
  // HOW FAR A SCRIPTED BODY WILL ENGAGE FROM. A gunner's engage radius is
  // rolled per spawn — 19 m plus up to 6 — and every retry deletes and
  // re-spawns the area's bodies, so every retry re-rolls it. The training
  // areas stand their lead man 5 cells in, which is 21.5 m from the door
  // plane the player actually walks through: above the 19 m floor and inside
  // the random band, so a measured 14 retries out of 30 came up under the
  // standing distance. Those rooms were dead FOREVER — a pinned body never
  // closes the gap, and `unstickHallEnemies` skips anything the script holds.
  //
  // A scripted body does not need a random radius. It cannot move, the script
  // decided where it stands, and turn-taking is enforced separately by
  // tutorTurnHolds() rather than by distance. So the script decides this too,
  // and it covers the deepest authored placement with room to spare. Measured
  // from the door plane the player walks through — which is 1.5 m behind the
  // leg's own spine[0], and most of why 5 cells came out at 21.5 m against a
  // 19 m floor — the worst is now 33.5 m: hall2's rear man and room1's, both
  // at z 8. (It was 42.9 m when the ramp ran to six areas and finished on a
  // corridor with a man ten cells down it.)
  engageM: 60,
  reshoot: 3.2,         // ...and the gap before a missed shot is retried
  // THE METER LESSON HAS A FLOOR. It empties at a readable rate to half, then
  // slows to a crawl, and never goes below a quarter: the player is being
  // taught that time is finite, not put in a hole they cannot climb out of
  // before anyone has told them how.
                        // this as full-to-EMPTY, so the half the player is
                        // being introduced to went in 3.5 s.

  gunRise: 0.6,         // seconds for the weapon to swing up into frame
  rampFireDelay: 0.9,   // beat after entering a ramp room before anyone fires
  // HALF PRICE WHILE THEY ARE STILL LEARNING. The ordinary drain empties a
  // full bank in ten seconds of frozen world, which in a training room is
  // about one fight — so a player using the button the way they have just been
  // taught to ran dry in the first room and spent the other five without it.
  // ...and where "it is running out" is worth saying out loud. HALF OF WHAT
  // THEY HAD WHEN THEY SLOWED TIME, not half of the bar: a wave starts with
  // `base` seconds against a bar drawn to `cap`, so the meter is ALREADY at
  // 50% on the frame it appears and a warning at half the bar would fire the
  // instant the button was pressed. Half the tank is what a player means by
  // half gone. The game's own `low` mark is the floor under it, so a tap on a
  // nearly-empty tank still gets warned.
  // NOTHING DEAD IN HERE. `dodgeRounds`, `faceRate` and `finalEnemies` used to
  // sit in this list, complete with sliders and help text in the tool, and not
  // one line of main.js read any of them: dragging "how many rounds must be
  // dodged" changed nothing at all. The real controls are `advance.need` on
  // the dodging step and `bodies` on each step, both of which the step editor
  // already has. Every key below IS read — see the greps in docs/TESTING.md.
};

// --- the legs --------------------------------------------------------------
// AUTHORED, not generated. "A straight run, then a jog left, then another"
// is a sequence of specific corners; a generator that produces
// something like it four times out of five is no use for a lesson whose whole
// point is that the player knows what is coming.
//
// `moves` reads as instructions — ['f', 7] is seven cells forward, ['r', 3]
// three to the right — because that is how the lesson is described. `extra`
// hangs cells off the spine: a fork's second lane, or the width of a room.
// Both are relative to the leg's own start.
//
// Anything past the end of this list is an ordinary generated leg, which is
// what the end of the tutorial looks like.

// The teaching leg's moves, named, so the steps can say "ends at the corner"
// instead of "ends at spine index 7" — and stay right when somebody makes the
// first hallway one cell longer in the tool.
// TWO JOGS, NOT THREE, AND NO FORK. A lateral run is TWO turns to the person
// walking it — one into it, one back onto the axis — so three of them is six
// turns before anybody has been handed a gun, over a hundred and sixteen
// metres of corridor. Two is four: left, right, left, right, and then the
// straight the barrier stands in. The fork went with the third: a second route
// that rejoins is one more thing to notice, and lessons 1-3 are about the two
// thumbs and nothing else.
// LEFT FIRST, AND SHORTER. A lateral run is TWO turns to the person walking it
// — one into it and one back onto the axis — so `['r', 3]` between two forward
// runs reads as "left, then right", and two of them is four turns.
//
// FOUR IS THE FLOOR, not a choice. An odd number needs the leg to FINISH on a
// lateral run, and the barrier cannot live on one: it is placed at a grid ROW
// and spans that row's width (see the placement in main.js), so a leg ending
// sideways puts the slab off the floor entirely — measured, at (12, 64) with
// no floor under it. The sign, the gunner's cells and the dodge lane make the
// same assumption. Three walking lessons also need three distinct end marks,
// and one jog cannot supply them. So: two jogs, both turning LEFT first, on
// the shortest runs that still leave room to walk.
//
// (The move letters do not match the turn the player feels. Measured off the
// build, `['r', N]` swings the camera +90 degrees, which is a LEFT turn in the
// yaw convention the whole HUD uses. The names say which way the corridor
// steps in the grid, not which way the head goes.)
const TEACH_MOVES = [
  ['f', 5],    // 1. MOVE — dead straight, nothing else on screen
  ['r', 3],    // 2. LOOK — the first corner
  ['f', 3],
  ['l', 3],    // 3. CORNERS — and back onto the axis
  ['f', 3],    //    the short hall to the junction
  ['r', 4],    // 4. THE T — the spine takes the LEFT arm, the one marked
               //    THIS WAY. `r` steps grid +x, which with the player
               //    walking +z is to their left; marksFromPlan derives the
               //    screen direction from the cells rather than the letter.
  ['f', 13],   // 5-9. the barrier, the dodging, the shooting, the door
];
// THE DEAD END, hung off the junction as `extra` cells — the right arm of
// the T, which is a joke and not the route. Leg-relative, like every other
// cell list here.
//
// It turns AWAY from the spine on purpose. A branch that hooks back across
// the onward corridor is measurable but ugly: it puts the player standing
// beside a cell of the route they have not walked to, which is the case
// test/spine.mjs exists to keep honest.
//
//   (0,11) is the junction. Right is grid -x.
const TEACH_DEAD_END = [
  [-1, 11], [-2, 11], [-3, 11],          // the short hall right
  [-3, 10], [-3, 9],                     // first turn — TURN AROUND
  [-4, 9], [-5, 9], [-6, 9],             // second turn — and the man
];
// --- marks: named cells on the walked path ---------------------------------
// DERIVED, NEVER TYPED. A mark is a place in the lesson — "the first corner",
// "where the fork rejoins" — and the level tool lets the path be redrawn. Held
// as literals they went stale the instant it was: redrawing the teaching leg
// in the tool left the barrier standing 24 m inside solid rock, with lesson 4
// waiting for the player to reach a cell the corridor no longer had and the
// STAND HERE sign gated off a spine index the leg no longer reached. Nothing
// on screen, no way forward, no error.
//
// So they are computed from the plan, every load, for every leg — which means
// a path edit cannot strand them and the tool needs no control for them.
// Where the path last changes direction, as a spine index. For a leg that
// ends on a straight this is the end of the last lateral run; for one that
// ends going sideways it is where that run begins.
function lastTurnAt(runs) {
  let at = 0;
  for (let i = 1; i < runs.length; i++) {
    if (runs[i].dir !== runs[i - 1].dir) at = runs[i - 1].at;
  }
  return at;
}

export function marksFromPlan(plan) {
  const moves = (plan && plan.moves) || [];
  let n = 0;
  const runs = [];
  for (const m of moves) {
    const dir = String((m && m[0]) || 'f');
    n += Math.max(0, (m && m[1]) | 0);
    runs.push({ dir, at: n });
  }
  const fwd = runs.filter((r) => r.dir === 'f');
  const turns = runs.filter((r) => r.dir !== 'f');
  const marks = {
    firstCorner: fwd.length ? fwd[0].at : n,          // end of the opening straight
    // ...AND A LEAD ON IT, WHERE DRAG TO LOOK ARRIVES. The looking lesson used
    // to start AT the corner, which is the one place it is too late to be
    // useful: the player is already turning, and the way-out needle — which
    // reads `EARLY.wayLookM` metres ahead along the path — has already begun
    // swinging toward the turn by then. Two cells is eight metres, a shade
    // more than the needle's own lookahead, so the words are up first and the
    // needle then turns under them in the direction they are asking for.
    firstCornerLead: fwd.length ? Math.max(1, fwd[0].at - TUTOR.lookLeadCells) : n,
    secondRun: fwd.length > 1 ? fwd[1].at : n,        // ...and of the next one
    // WHERE THE FIRST JOG PUTS THEM BACK ON THE AXIS. The looking lesson used
    // to end at the second forward run, which on a leg with only two of them
    // is the SAME CELL as the last corner — so `corners` would have had no
    // length at all and would have ended on the frame `look` began. Coming out
    // of the first corner is its own moment and does not collide with
    // anything.
    firstJogEnd: runs.length > 1 ? runs[1].at : n,
    // WHERE THE SECOND JOG PUTS THEM BACK ON THE AXIS, and therefore where
    // the hallway they are about to walk down BEGINS. This is the corner
    // `turnLead` deliberately skips — turning back onto the axis is not a
    // decision the player makes, so it gets no sign — but it is exactly the
    // moment the looking lesson has been proved: they came round a corner and
    // pointed themselves down what is on the other side of it.
    //
    // Off the lateral runs rather than off a raw index, because `runs[3]` is
    // only the second jog for a path that happens to start with a straight.
    // (`firstJogEnd` above is the same number by a shakier route; it is left
    // alone because every leg in the build reads it and none of them starts
    // with a turn.)
    secondJogEnd: turns.length > 1 ? turns[1].at : n,
    // THE LAST CORNER — the last place the path CHANGES DIRECTION, which is
    // not the same as the end of the last lateral run. A leg that finishes
    // going sideways (the teaching leg does now: its last move is the run the
    // barrier stands in) has its final corner at the START of that run, and
    // reading the end of it put the barrier past the end of the corridor.
    // Everything past this point is one straight run to the door, so it is
    // where the barrier first comes into view — and therefore where the STAND
    // HERE sign is allowed to appear, small, in the distance.
    finalRun: lastTurnAt(runs),
    forkEnd: n,   // ...the end of the walk, unless a side lane rejoins sooner
    // WHERE THE BARRIER STANDS. The onboarding's leg ends in a fork, and the
    // barrier belongs just past where it rejoins — so `forkEnd` was the
    // anchor and, for that leg, still is. A leg with NO fork has forkEnd at
    // the very end of the walk, which put the slab three cells past the last
    // cell of the corridor: inside the door, with nowhere for the man who is
    // supposed to shoot at you over it to stand. Without a fork the anchor is
    // the last corner instead, so the barrier is the first thing you see when
    // you round it and the rest of the run is the lesson's stage.
    barrierAt: 0,
    // EVERY TURN, AND A LEAD ON IT. A sign belongs on the wall a turn faces,
    // and it is only useful if it can be READ before the player is standing
    // in the corner — so each entry is a couple of cells short of the turn,
    // the same lead and for the same reason as `firstCornerLead`.
    //
    // One entry per change of direction, carrying which way the path goes
    // next, because that is what decides both the words and the wall.
    // Derived like everything else here: drag the path in the tool and the
    // signs move with it, which is the whole point of this function.
    turnLead: [],
  };
  // WHICH WAY THE TURN GOES ON SCREEN, from the cells rather than from the
  // letter in the plan. `['r', 3]` steps grid +x, and with the player walking
  // +z that is to their LEFT — the plan's letters are grid directions, not the
  // player's hand. Getting this from the move list produced an arrow pointing
  // one way at a sign standing the other, which is worse than no arrow.
  //
  // Camera-right for a heading (hx, hz) is (-hz, hx) in this convention, so
  // the sign of `out · right` is the whole answer and it cannot drift if the
  // corridor is ever rebuilt.
  const { spine } = planToCells(0, 0, moves);   // ...and reused by the fork test below
  const cellAt = (i) => spine[Math.max(0, Math.min(spine.length - 1, i))];
  for (let i = 1; i < runs.length; i++) {
    // ONLY WHERE THE PATH GOES SIDEWAYS. A jog is a lateral run and then a
    // forward one, so every corner shows up here twice — once turning out of
    // the straight, once turning back onto the axis. The second is not a
    // decision the player makes and a sign on it points at the wall they are
    // already walking along.
    if (runs[i].dir === 'f' || runs[i].dir === runs[i - 1].dir) continue;
    const at = runs[i - 1].at;
    const a = cellAt(at - 1), b = cellAt(at), c = cellAt(at + 1);
    const hx = b[0] - a[0], hz = b[1] - a[1];
    const ox = c[0] - b[0], oz = c[1] - b[1];
    const dot = ox * -hz + oz * hx;          // out · camera-right
    marks.turnLead.push({
      at: Math.max(1, at - TUTOR.lookLeadCells),
      turnAt: at,
      dir: dot > 0 ? 'r' : 'l',
    });
  }
  marks.barrierAt = marks.finalRun;
  // The rejoin is the one mark the moves alone cannot state, because the fork's
  // second lane is `extra` cells hanging off the spine. It is the furthest cell
  // of the walked path that any of them touches.
  const extra = (plan && plan.extra) || [];
  if (extra.length) {
    let lo = Infinity, hi = -1;
    for (const [ex, ez] of extra) {
      for (let i = 0; i < spine.length; i++) {
        if (Math.abs(spine[i][0] - ex) + Math.abs(spine[i][1] - ez) <= 1) {
          if (i < lo) lo = i;
          if (i > hi) hi = i;
        }
      }
    }
    // A FORK REJOINS. A DEAD END DOES NOT, and telling them apart matters
    // because this mark is where the barrier stands.
    //
    // The onboarding's `extra` used to be one thing: a second lane that left
    // the spine and came back, so the furthest cell it touched was the
    // rejoin and the barrier belonged just past it. A dead-end branch —
    // the junction's right arm, which is a joke and not the route — touches
    // the spine at ONE place, the junction itself, and reading that as a
    // rejoin put the barrier at the T with the whole second half of the leg
    // behind it.
    //
    // So: touched at two separated points is a fork; touched at one is a
    // branch, and the marks are left where the path put them.
    if (hi > lo + 2) { marks.forkEnd = hi; marks.barrierAt = hi; }
  }
  return marks;
}

// The fork's second lane is gone with the third jog — see TEACH_MOVES. It ran
// out to the right at the split, forward alongside, and back in at the
// rejoin; both routes reached the same place, which was all it ever said.

// EVERY TRAINING AREA WITH MORE THAN ONE BODY IN IT TAKES TURNS. Two rounds
// resolving on the same frame is one loud event a first-time player cannot
// parse; the same two a beat apart is a room reacting to them. `fireOrder`
// says so per leg, and after the first hallway every leg that holds a pair or
// a trio says 'turns'.
//
// A room is the spine plus width. Three cells across and four deep reads as a
// room on a portrait phone without becoming a space you can get lost in.
export const TEACH_MARKS = marksFromPlan({ moves: TEACH_MOVES });

const room = (halfW, z0, z1) => {
  const out = [];
  for (let x = -halfW; x <= halfW; x++) {
    if (x === 0) continue;
    for (let z = z0; z <= z1; z++) out.push([x, z]);
  }
  return out;
};

export const LEGS = [
  {
    id: 'teaching', form: 'corridor', barrier: true, countsAsDoor: false,
    note: 'Lessons 1-9. Straight run, two jogs left, then the straight where '
      + 'the barrier stands and the combat lesson happens.',
    plan: { moves: TEACH_MOVES, extra: TEACH_DEAD_END, approach: 4 },
    // ONE MESSAGE IN FOCUS, AND IN THE TEACHING LEG THE SCREEN HAS IT.
    //
    // Lessons 1-3 are `DRAG TO MOVE` and `DRAG TO LOOK`, and a sign twenty
    // metres down the corridor lands within a few per cent of them: a sign
    // high on a wall projects near the vanishing point, and on a portrait
    // phone that is exactly where the coach line sits. Screenshots of the
    // first build show the two overlapping into one unreadable block.
    //
    // So no turn signs here. A message about a THUMB has to be on the glass
    // and cannot be anywhere else; a message about a PLACE can be in the
    // world. Where a control is being taught the screen owns the frame, and
    // the world only speaks once it is done.
    //
    // That leaves the teaching leg exactly two world messages, and both of
    // them REPLACE a screen line rather than joining it:
    //   `STAND HERE`  on the barrier   (lesson 4, already built)
    //   `EXIT`        on the door      (lesson 7, replacing GO THROUGH THE DOOR)
    //
    // `turnSigns: false` turns off the derived ones for this leg only. Every
    // leg past the onboarding has no coach text at all, so they are free to
    // come back there — which is where they were always going to earn their
    // keep, and where `EXIT` starts telling the story as well as the way out.
    turnSigns: false,
    // THE DEAD END, as the leg's own furniture: which cells it is, who is
    // standing at the end of it, and where a death down there puts you back.
    // Held here rather than in main.js because it is content — the tool edits
    // this file — and because the cell list is also the test for "is the
    // player in the joke", which nothing else can derive.
    dead: {
      cells: TEACH_DEAD_END,
      man: [-6, 9],       // he is round the second corner, arm already up
      // WHERE THE JOKE PUTS YOU BACK: two cells short of the junction, facing
      // it. Not the junction cell itself — the signpost is painted on its far
      // wall, 1.6 m from a player standing on it, and at that range a 3.4 m
      // message is four letters filling the screen. Photographed both: from
      // here the whole sign is in frame at the size it was written to be read
      // at, which is the point of being sent back to it.
      back: [0, 9]
    },
    // NO `EXIT` SIGN ON THIS LEG. One message in focus, and on the door beat
    // Hale's paint is what the player is reading. The building gets its
    // signage back on the doors past the onboarding.
    signs: [],
    // HALE'S PAINT, on the three end walls of the junction. An end wall is
    // the only surface a walking player faces — a side wall is edge-on and
    // unreadable — which is why his messages live at corners and why the T
    // is the right place for the pattern to be introduced.
    paint: [
      // The junction's back wall: one object, two lines, stacked. Four metres
      // of corridor width will not carry two messages side by side at a
      // readable size, and stacking them is also how a person with one can
      // and limited reach would do it.
      { at: [0, 11], face: '-z', halves: ['THIS WAY', 'NOT THIS WAY'], h: 0.34 },
      // The dead end. Two warnings on the walls its turns face, then a man.
      { at: [-3, 11], face: '+x', text: 'TURN AROUND', h: 0.4 },
      { at: [-3, 9], face: '+z', text: 'NOT JOKING', h: 0.4 },
      // ...and the reward for obeying, on the wall the left arm turns at.
      { at: [4, 11], face: '-x', text: 'GOOD CHOICE', h: 0.4 },
    ],
  },
  // WITHIN ENGAGE RANGE OF THE DOOR YOU COME IN THROUGH. A gunner's
  // engageDist is 19-25 m; bodies parked at z 7-10 stood 28 m from the entry,
  // so nothing happened for the first four cells of every area and "fires as
  // they enter" never once happened. They stand at 4-6 cells now.
  //
  // ROOMS ARE WIDE AT THE MOUTH. A three-cell bay buried mid-leg is
  // indistinguishable from a corridor at the only moment the difference
  // matters, which is when you walk in.
  // --- THE RAMP: THREE AREAS, NOT SIX -------------------------------------
  // It ran room, hall, room, hall, room, hall at 1, 1, 2, 2, 3, 3 — six
  // checkpoints and six door crossings between the last lesson and Door 1,
  // where the last four say nothing the first two did not. Each of the three
  // that remain is a different sentence: one man in a hallway, two men in a
  // hallway, three men in a room with pillars.
  //
  // THE ROOM COMES LAST, and it is the only one of the three that is about
  // GROUND rather than about numbers — the first cover in the game you can put
  // between yourself and a raised arm. Meeting it with three men standing in
  // it is what makes walking to a column worth doing.
  //
  // WITHIN ENGAGE RANGE OF THE DOOR YOU COME IN THROUGH. A gunner's engageDist
  // is 19-25 m; bodies parked at z 7-10 stood 28 m from the entry, so nothing
  // happened for the first four cells of every area and "fires as they enter"
  // never once happened. They stand at 4-6 cells now.
  // CLOSE ENOUGH TO AIM AT. At 5 cells the first man anybody meets stood 21.5 m
  // from the door they walk in through, which on a portrait phone is a figure
  // about a centimetre tall — a hard first target for somebody who has held
  // the trigger once. 3.5 cells is 15.5 m, the same order as the teaching
  // leg's own gunner (TUTOR.enemyCells, 4 cells past the barrier).
  // ...AND NOT MUCH CORRIDOR LEFT AFTER HIM. See THE DEAD TAIL below.
  { id: 'hall1', form: 'corridor', kind: 'hall', note: '10. One enemy in a hallway.',
    plan: { moves: [['f', 6]], approach: 3 },
    enemies: [{ x: 0, z: 3.5, type: 'gunner' }], fireOrder: 'free' },
  // OFF THE CENTRE LINE. Two bodies at x = 0 are one silhouette: the front one
  // occludes the other perfectly and the HUD count contradicts the screen.
  // THE DEAD TAIL. A door opens on the frame the area's last man goes down, and
  // it opens onto the next area — which from anywhere in the last stretch of
  // corridor is straight ahead through the doorway, lit, and EMPTY, because
  // nothing is placed in an area until the player crosses into it. Measured on
  // the built legs, that walk was 18 m in both hallways and 14 m in the room:
  // three and a bit seconds of approaching a room you can see has nobody in it
  // before anything happens. The playtest read it as the room being late —
  // "I entered the room with the pillars but had to walk further in to hear the
  // announcement and see the enemies appear" — when in fact all of it lands on
  // the threshold to the frame. What was long was the walk up to the threshold.
  //
  // Filling the next area early is not the answer: nothing should be there
  // before you enter. Shortening the walk is. Every area now ends about ten
  // metres past its last man, which is two seconds rather than three and a
  // half, and still leaves the door a place you walk TO rather than fall over.
  { id: 'hall2', form: 'corridor', kind: 'hall', note: '11. Two in a hallway, taking turns.',
    plan: { moves: [['f', 8]], approach: 3 },
    // x is in CELLS, so a quarter is a metre — enough to break the silhouette
    // in a corridor that only has 3.4 m of floor to play with.
    enemies: [{ x: -0.22, z: 3.5, type: 'gunner' }, { x: 0.22, z: 5.5, type: 'gunner' }],
    fireOrder: 'turns' },
  // ...AND THE ROOM HAS COLUMNS IN IT — the first cover in the game, and the
  // whole lesson of the area. `plan.pillars` is in CELLS like the rest of a
  // plan: the room is three cells wide, so 12 m of floor from -6 to +6.
  //
  // THE COLUMNS ARE NEAR THE PLAYER AND THE MEN ARE NOT. First pass put the
  // columns at 12 and 24 m with the men at 20 — half way down the room, on
  // top of the sight lines — and a playtest found exactly what that geometry
  // predicts: the left-hand man was completely hidden behind a column, and
  // cover you have to walk twelve metres INTO the fight to reach is not cover
  // you will use on the first round fired at you.
  //
  // So the columns come forward to 6 and 11 m, close enough to step behind,
  // and the men go back to 22 and 26 m. That also clears every sight line by
  // construction: from the doorway the three of them subtend +/-4.2 m at 22 m,
  // which is +/-1.2 m of fan at the near column row and +/-2.0 m at the far
  // one, against columns whose inner faces stand at 2.75 m. Nobody is hidden,
  // and a player who steps sideways to a column has put it between themselves
  // and the man shooting at them.
  { id: 'room1', form: 'vault', kind: 'room', note: '12. Three in a room with pillars.',
    // ...AND THE ROOM IS ALREADY WIDE AT THE DOOR. It used to start widening
    // one cell IN, which leaves a stub of wall jutting out either side of the
    // entrance: the player walks in through a one-cell slot, and the first
    // thing they try — step aside, out of the line of the round — is the one
    // thing that slot will not let them do. Widened from the entry row, so the
    // wall they come through is flat and sidestepping works from the first
    // frame in the room.
    plan: { moves: [['f', 9]], extra: room(1, 0, 8), approach: 3,
      pillars: [[-0.85, 1.5], [0.85, 1.5], [-0.85, 2.75], [0.85, 2.75]] },
    enemies: [{ x: -1.05, z: 5.5, type: 'gunner' }, { x: 1.05, z: 5.5, type: 'gunner' },
      { x: 0, z: 6.5, type: 'gunner' }], fireOrder: 'turns' },
];

// --- what the player is allowed to do --------------------------------------
// A grant is a capability, not a step name. Reading "can they shoot yet" off
// the sequence order meant the answer moved whenever the sequence did, and
// twice it moved somewhere nobody intended.
export const MECHANICS = [
  ['gun',    'Weapon in hand',   'The viewmodel is on screen.'],
  ['fire',   'Can fire',         'Tapping the screen shoots. Off, and a tap does nothing.'],
  ['timebtn','Time button',      'The slow-motion control exists on screen at all.'],
  ['meter',  'Time meter',       'The bank bar at the top of the screen.'],
  ['bank',   'Freezing costs',   'Off, stopping time is free — the script owns the bank.'],
  ['ammo',   'Ammo readout',     'The magazine line at the bottom.'],
  ['aiFire', 'Enemies may fire', 'Off, only the script pulls a trigger. Their walk and aim are untouched.'],
  ['spawns', 'Spawn queue runs', 'Off, the queue is held: nobody arrives unless the script places them.'],
  ['score',  'Door / enemy line','The HUD line at the top left.'],
  // THE WAY-OUT NEEDLE, and it belongs to the WALKING lessons and nothing
  // else. Once STAND HERE is on the barrier the player is not being sent
  // anywhere any more — they are being sent to a PLACE that is on screen, and
  // a second mark pointing at it is one answer too many. Past that it comes
  // back on its own terms: only on a hallway with nobody left in it, where
  // "which way now" is a real question. See wayArrowShows() in main.js.
  ['way',    'Way-out needle',   'The big red needle that points along the corridor.'],
];

// Everything is off unless a step says otherwise. A tutorial that has to
// remember to take things away has already given them to somebody by mistake.
export const NO_GRANTS = {
  gun: false, fire: false, timebtn: false, meter: false,
  bank: false, ammo: false, aiFire: false, spawns: false, score: false,
  way: false,
  // `rescue` — may this area stop the world for a round that is about to hit
  // somebody who is not reacting? The teaching beats say no: they fire rounds
  // ON PURPOSE and have their own freezes, and a second one arriving over the
  // top of lesson 5 would be the lesson interrupting itself.
  rescue: false,
};
// ...and what the ramp areas grant, which is simply "the game".
// What a training area grants: the game, MINUS the slow-motion control. That
// is deferred past the whole onboarding on purpose (docs/TUTORIAL-GOALS.md) —
// it arrives later as something you unlock, not as a fifth thing to read on
// your first corridor.
const PLAYING = { gun: true, fire: true, timebtn: false, meter: false,
  bank: false, ammo: true, aiFire: true, spawns: false, score: true,
  rescue: true };

// --- when a cue comes and goes ---------------------------------------------
export const CUE_EVENTS = [
  ['enter',   'the step begins'],
  ['held',    'the world stops mid-telegraph'],
  ['freeze',  'the player stops time'],
  ['dodge',   'a round goes past them'],
  ['kill',    'they drop one'],
  ['threat',  'somebody starts to aim at them'],
  // deferred with the slow-time lessons — see DEFERRED at the end of this file
  ['meter',   'the meter warning lands'],
  ['low',     'the meter falls past the warning mark'],
  ['resume',  'the player lets time run again'],
  ['ready',   'they have slowed AND resumed time in this area'],
  ['shot',    'they pull the trigger'],
  // THE LOOKING LESSON IS OVER WHEN THEY HAVE LOOKED. Fired when the player
  // has walked to `marks.secondJogEnd` — the corner the second jog rejoins
  // the axis at — and has turned to face down the hallway on the other side
  // of it. A lesson about a thumb ends when the thumb has done the thing,
  // not when a distance has been covered; and the T is a few cells past this
  // corner, so this is also the last moment the screen can hand the frame to
  // the world before Hale's signpost is in it.
  ['faced',   'they turn to look down the new hallway'],
  ['advance', 'the step ends'],
];
// `advance` as a HIDE is the same as "stays until the step ends", because the
// next step clears the screen on the way in. Spelled out rather than left
// implicit so a cue always states both halves of its own life.
export const CUE_SHOW = CUE_EVENTS.filter(([id]) => id !== 'advance');

// WHERE WORDS GO. One element each, all able to be on screen together — which
// is goal 2's requirement: DRAG TO MOVE has to still be there when DRAG TO
// LOOK arrives, or the player reads the second as replacing the first.
export const CUE_SLOTS = [
  ['mid',   'Centre'],
  // ...AND A LOWER CENTRE, for the dodge. `mid` sits at a quarter of the way
  // down, which is the right height for a line with nothing else on screen —
  // but the dodge beat also has a thumb coach under the words and a round
  // ringed in red out in the world, and a playtest found the sentence stranded
  // up under the topbar with the two things it is about halfway down the
  // frame. This slot puts it near where DRAG TO MOVE stood, which is the
  // height the player has already learned to read instructions at.
  ['dodge', 'Centre, low'],
  ['left',  'Left half'],
  ['right', 'Right half'],
  ['atbtn', 'Above the time button'],
  ['top',   'Under the meter'],
  ['world', 'Hovering over the barrier'],
];
export const CUE_ARROWS = [['none', 'None'], ['down', 'Down to the button'], ['up', 'Up to the meter']];
// `sway` is `side`'s twin on the LEFT half of the screen: the same
// side-to-side swipe, over the move stick rather than the look area, because
// "get out of the way" is a sideways instruction and a hand travelling upwards
// says "walk forward" — straight into the round.
export const CUE_HANDS = [['none', 'None'], ['up', 'Swipe up'],
  ['side', 'Swipe across (right)'], ['sway', 'Swipe across (left)'], ['tap', 'Tap']];

// --- the sequence ----------------------------------------------------------
// `advance` names the built-in condition in main.js that ends the step. These
// are code, not data — "reached the corner" is not something a text box can
// express — so the tool offers the list rather than a free field.
export const ADVANCE_KINDS = [
  ['reached',  'walked to a point on the leg (spine cell)'],
  ['atBarrier','reached the barrier'],
  ['froze',    'stopped time (the world is held until they do)'],
  ['dodged',   'dodged N rounds'],
  ['gunUp',    'the weapon has finished rising'],
  ['cleared',  'every enemy is down'],
  ['resumed',  'let time run again (the meter lesson)'],
  ['crossed',  'walked through the door'],
  ['none',     'never (the last step)'],
];

// --- the training rooms' one reminder --------------------------------------
//
// The six training areas used to carry a three-cue loop about the time button.
// The time button does not exist during the onboarding any more — the whole
// slow-motion control is deferred past it — so what is left is the one thing
// a player can forget under pressure on their first corridor: the trigger.
//
// It is `once` per area, which means SPENT BY THE ACTION IT ASKED FOR. Shoot
// in this room and the words are gone for this room; the next room starts
// fresh, because `tutorSpent` is cleared with the step and an area IS a step.
// It arrives on `threat` — somebody starting to aim — rather than on entry,
// so it is an answer to something rather than a caption on an empty corridor.
const REMIND_SHOOT = () => [{
  text: 'TAP ANYWHERE TO SHOOT', slot: 'mid', arrow: 'none', hand: 'none',
  pulse: true, on: 'threat', off: 'shot', once: true,
}];

// ...AND THE DODGE, when a round is about to land on somebody who is not
// moving. Same words, same swipe and same divider as lesson 5, because it IS
// lesson 5 — recognising it is the point. `once` per area: the rescue fires
// at most one round per room, and answering it retires the prompt there.
// ...AND IT LEAVES WHEN THE PLAYER ACTS, not when the round finally passes.
// `dodge` fires when the bullet is behind them, which at resumed speed is a
// second and a half after the freeze has faded out — so the words sat there
// over an ordinary corridor, black, long after the thing they were about had
// finished. `freeze` is the frame they step aside, which is the frame the
// effect starts going.
const REMIND_DODGE = () => [{
  text: 'DODGE THE BULLET', slot: 'dodge', arrow: 'none', hand: 'sway',
  pulse: false, on: 'held', off: 'freeze', once: true, divider: true,
}];

export const STEPS = [
  // --- 1. MOVE -------------------------------------------------------------
  // Ends a couple of cells SHORT of the corner, not after n metres. Goal 2 is
  // unharmed — DRAG TO MOVE does not leave, it is in the next step's cues too
  // — and the point of stopping early is that DRAG TO LOOK has to be on
  // screen BEFORE there is anything to look at. It used to arrive at the
  // corner, by which time the player is already mid-turn and the way-out
  // needle has already started swinging toward it.
  {
    id: 'move', label: '1 · Move',
    hud: 'PROCEED DOWN THE HALLWAY',
    advance: { kind: 'reached', need: 'firstCornerLead' },
    // THE BARRIER IS A FIXTURE, not something lesson 4 conjures. It stands
    // from the first frame of the run, so turning the last corner shows you a
    // corridor with a thing in it rather than a corridor that grows one.
    grants: { way: true }, divider: true, buildBarrier: true,
    cues: [{ text: 'DRAG TO MOVE', slot: 'left', arrow: 'none', hand: 'up',
      pulse: false, on: 'enter', off: 'advance' }],
  },
  // --- 2. LOOK -------------------------------------------------------------
  // DRAG TO MOVE stays. The point being made is that looking is a SEPARATE
  // action that happens at the same time as moving, not a mode you enter.
  {
    id: 'look', label: '2 · Look',
    hud: 'PROCEED DOWN THE HALLWAY',
    advance: { kind: 'reached', need: 'firstJogEnd' },
    grants: { way: true }, divider: true,
    cues: [
      { text: 'DRAG TO MOVE', slot: 'left', arrow: 'none', hand: 'up',
        pulse: false, on: 'enter', off: 'advance' },
      { text: 'DRAG TO LOOK', slot: 'right', arrow: 'none', hand: 'side',
        pulse: false, on: 'enter', off: 'advance' },
    ],
  },
  // --- 3. CORNERS AND A FORK ----------------------------------------------
  {
    id: 'corners', label: '3 · Corners + fork',
    hud: 'PROCEED DOWN THE HALLWAY',
    // ...and ends AT THE LAST CORNER, not eight cells past it. The walking
    // lesson is over the moment there is something ahead to walk to, and that
    // moment is the turn: STAND HERE is on screen from the frame the barrier
    // comes into view, which is what makes it a place rather than an
    // announcement.
    advance: { kind: 'reached', need: 'finalRun' },
    // THE PROMPTS LEAVE BEFORE THE STEP DOES, and this is the only step in the
    // build where those are different moments.
    //
    // The step has to run to the last corner: that is where the barrier comes
    // into view and where `stand` is built to begin. But the T is at cell 17,
    // four cells before it, and Hale's signpost is painted across its back
    // wall — so a step whose prompts ran to cell 21 put DRAG TO MOVE directly
    // across THIS WAY. Photographed; it is the one-message rule broken at the
    // exact place the player is first asked to read the world instead of the
    // screen.
    //
    // So they retire on `faced` — the player at the corner the second jog
    // rejoins the axis at, turned to look down the hallway on the other side
    // of it. Which is also the honest end of the lesson: DRAG TO LOOK is
    // satisfied by having looked, not by having walked somewhere. The three
    // cells between there and the T are the screen handing the frame over
    // with nothing on it, so what arrives next arrives alone.
    //
    // THE DIVIDER BELONGS TO THE WORDS, not to a particular lesson. It names
    // which half of the glass each instruction is about, so it has to be
    // there for as long as DRAG TO MOVE and DRAG TO LOOK are — and this step
    // shows both of them while having switched it off, so the line vanished
    // under the player mid-corridor for no reason they could see. Now that
    // the words go before the step does, it is declared on the CUES rather
    // than on the step, so it leaves with them instead of hanging over an
    // empty corridor all the way to the junction.
    grants: { way: true },
    cues: [
      { text: 'DRAG TO MOVE', slot: 'left', arrow: 'none', hand: 'up',
        pulse: false, on: 'enter', off: 'faced', divider: true },
      { text: 'DRAG TO LOOK', slot: 'right', arrow: 'none', hand: 'side',
        pulse: false, on: 'enter', off: 'faced', divider: true },
    ],
  },
  // --- 4. STAND HERE -------------------------------------------------------
  // The prompts go. The first thing they are asked to AIM at rather than do.
  {
    id: 'stand', label: '4 · Stand here',
    hud: 'GO TO THE BARRIER',
    advance: { kind: 'atBarrier' },
    // THE NEEDLE IS STILL HELD HERE, and dropped by the SIGN rather than by
    // this step starting. `stand` begins the moment the player reaches the
    // last corner, which they can do without having turned to look down the
    // straight — so retiring the mark on the step took it away while there
    // was still nothing on screen to replace it. wayArrowShows() waits for
    // tutorPlaceWorldCue to put STAND HERE in frame.
    grants: { way: true },
    cues: [{ text: 'STAND HERE', slot: 'world', arrow: 'none', hand: 'none',
      pulse: true, on: 'enter', off: 'advance' }],
  },
  // --- 5. THE ROUND, THREE TIMES ------------------------------------------
  // ONE BEAT, REPEATED, AND THE ANSWER IS YOUR THUMB. He appears, raises his
  // arm, FIRES, and the world stops with the round in the air. The words say
  // dodge it and a thumb swipes side to side under them. Step out of the lane
  // and time runs again on its own: the round goes past, the words fade, and
  // the next one comes.
  //
  // There is no time BUTTON here and no meter. The whole slow-motion control
  // is deferred — see docs/TUTORIAL-GOALS.md — because a player who has just
  // been handed a corridor and a gun wants to shoot something, not to learn a
  // resource. The freeze in this lesson is the game buying them a moment to
  // read three words, not a mechanic being introduced.
  {
    id: 'dodge', label: '5 · Dodge three rounds',
    advance: { kind: 'dodged', need: 3 },
    // `bodies` is how many should be STANDING THERE, not how many to add.
    // Declaring it per beat is what lets a retry rebuild the world.
    grants: {}, bodies: 1, hardFreeze: true,
    hud: 'DODGE THE ROUNDS',
    // ON `held` — the frame the world stops, which is the frame after the
    // shot. The hand is the instruction: a swipe across, under the words,
    // over the half of the screen the move stick lives on — and it now
    // actually IS on that half. `sway` sat at left:50%, dead centre and
    // straddling the divider, while this comment claimed otherwise: a swipe
    // in the middle of the screen tells you to move but not where to put
    // your thumb. With the divider drawn, the left half is named.
    //
    // ON THE CUE, NOT ON THE STEP. At step level the line hung over the whole
    // barrier beat — including the seconds between rounds, when nothing is
    // being asked and there is no prompt for it to divide. A player standing
    // at the barrier saw a dotted line down the middle of an empty corridor.
    // It comes and goes with the words now, which is when it means something.
    cues: [{ text: 'DODGE THE BULLET', slot: 'dodge', arrow: 'none', hand: 'sway',
      pulse: false, on: 'held', off: 'freeze', divider: true }],
  },
  // --- 6. THE GUN, AND THE OTHER TWO --------------------------------------
  // The squad arrives and the weapon comes up on the same beat as the words
  // that name it. Nothing else is on the screen: this is the first thing the
  // player has been asked to DO to somebody rather than get away from.
  {
    id: 'shoot', label: '6 · Shoot',
    advance: { kind: 'cleared' },
    grants: { gun: true, fire: true, ammo: true },
    bodies: 3, raiseGun: true,
    // AND THEY SHOOT BACK, ONE AT A TIME. Measured before this existed: three
    // men stood in this hallway for thirty seconds and fired nothing — every
    // frame of it in `advance`, held by the script, no rounds at all. So the
    // first thing the player is asked to DO to somebody was a shooting
    // gallery, and the beat that follows the barrier taught nothing the
    // barrier had not.
    //
    // `turns` runs the same driver the barrier beat does: whoever is next in
    // the rotation raises his arm as the last round clears the player, so
    // this is three men taking it in turn rather than a volley. There is no
    // freeze here — that was lesson 5's, and its job is done — so what is
    // being asked is the two things together, step aside and shoot back.
    // `volleyGap` still buys the beat before the first of them aims, which is
    // the beat TAP ANYWHERE TO SHOOT is read in.
    turns: true,
    hud: 'CLEAR THE HALLWAY',
    // AND IF THEY SHOOT WITHOUT EVER TURNING, SAY IT AGAIN. There is no aim
    // control in this game: you aim by facing, which is the same drag that
    // walks you down the corridor. A player who taps and taps at three men
    // standing off the centre line has understood the trigger and not the
    // thing the trigger needs, and nothing on screen was telling them —
    // TAP ANYWHERE TO SHOOT retires on the first shot and left them with a
    // blank screen and a miss. These come up on that first shot and go the
    // moment either thumb drags, so a player who already knew never sees them.
    cues: [
      { text: 'TAP ANYWHERE TO SHOOT', slot: 'mid', arrow: 'none',
        hand: 'none', pulse: true, on: 'enter', off: 'shot' },
      { text: 'DRAG TO MOVE', slot: 'left', arrow: 'none', hand: 'up',
        pulse: false, on: 'shot', off: 'aimed' },
      { text: 'DRAG TO LOOK', slot: 'right', arrow: 'none', hand: 'side',
        pulse: false, on: 'shot', off: 'aimed' },
    ],
  },
  // --- 9. THE DOOR ---------------------------------------------------------
  {
    id: 'exit', label: '7 · The door',
    advance: { kind: 'crossed' },
    // The score line comes on here — the first beat of the onboarding where
    // there is a door count worth having — and reads TRAINING · GO TO THE NEXT
    // DOOR rather than DOOR 1 · OPEN — GO.
    grants: { gun: true, fire: true, ammo: true, score: true },
    dropBarrier: true, openDoor: true, hud: 'GO TO THE NEXT DOOR',
    // NO SCREEN CUE. `EXIT` is painted on the door itself, and one message in
    // focus means the world one REPLACES the screen one rather than joining
    // it — `GO THROUGH THE DOOR` centred over a door already labelled EXIT is
    // the same sentence twice, in two places, competing for one glance.
    //
    // This is the trade the whole sign system is worth making: the screen
    // line said one thing, the sign says the same thing AND says the building
    // is the sort of place that labels its doors. Two jobs, one message.
    // (The old cue read GO THROUGH THE DOOR — not "the next room", because
    // the next area is a hallway. The sign has no such problem: it names the
    // door rather than what is past it.)
    cues: [],
  },
  // --- 10-12. THE RAMP -----------------------------------------------------
  // The teaching is over. Each of these is a real fight and a checkpoint: the
  // enemies come from the LEG rather than the step, and dying puts the player
  // back at the start of this area and nowhere further.
  //
  // THREE OF THEM. One step per leg, in the order the LEGS above stand in —
  // hallway, hallway, room — and then Door 1. There is no numbering here that
  // is independent of that list: a step whose leg has gone is a step with
  // nobody in it.
  { id: 'ramp1', label: '8 · Hall · 1', advance: { kind: 'crossed' },
    grants: { ...PLAYING }, checkpoint: true, hud: 'CLEAR THE HALLWAY',
    cues: REMIND_DODGE() },
  // ...and from here on the reminders are once each, per area. The trigger
  // prompt starts after the first hallway with anybody in it, which is where
  // a player who has been shooting without being told has proved they do not
  // need it and one who has not is overdue.
  { id: 'ramp2', label: '9 · Hall · 2', advance: { kind: 'crossed' },
    grants: { ...PLAYING }, checkpoint: true, hud: 'CLEAR THE HALLWAY',
    cues: [...REMIND_SHOOT(), ...REMIND_DODGE()] },
  { id: 'ramp3', label: '10 · Room · 3', advance: { kind: 'crossed' },
    grants: { ...PLAYING }, checkpoint: true, hud: 'CLEAR THE ROOM',
    cues: [...REMIND_SHOOT(), ...REMIND_DODGE()] },
  // ...AND IT LETS THE GAME SPAWN. `PLAYING` holds the spawn queue, because
  // a training area's bodies come from the LEG rather than the queue — but
  // `done` is entered on crossing into the FIRST REAL LEG, whose wave has
  // just been composed and queued. Holding it there emptied that queue every
  // frame until the onboarding finished ending, and door 1 had nobody in it.
  // ...AND NO RESCUE. `done` is entered on crossing into the FIRST REAL LEG:
  // the onboarding is over, and a hand appearing over a round in door 1 would
  // be the lesson refusing to end.
  { id: 'done', label: 'Done', advance: { kind: 'none' },
    grants: { ...PLAYING, spawns: true, rescue: false }, cues: [] },
];

// ---------------------------------------------------------------------------
// DEFERRED — THE SECOND COURSE, not an off switch
//
// `deferred: true` used to mean "kept in the spec, never walked into". It now
// means "belongs to the OTHER lesson". These steps teach the time button and
// the meter, and they run in the middle of a real run — on the door the speed
// staircase unlocks the power on (`unlockDoor()` in src/balance.js), which is
// the door bullet speed first reaches the point where walking out of a round
// stops being enough.
//
// Why not in the onboarding: a first-time player wants to shoot something, not
// to learn a resource. See docs/TUTORIAL-GOALS.md §5 and §6.
//
// main.js runs both courses on one machine — `tutorCourse` points
// `tutorOrder()` and `tutorLegsOf()` at this list and at SCHOOL_LEGS above,
// and nothing below that line knows which lesson it is running. So everything
// that was true of these steps while they were switched off is still true:
//
//   * the machinery that drives them (`hardFreeze` released by the button,
//     `startMeter`, the `resumed` advance, the `meter`/`low`/`resume`/`ready`
//     cue events, `tutorRefusesResume`) has a live consumer, so it cannot be
//     quietly broken by a change to something else;
//   * `slowlesson.js` plays them through, every run of the suite;
//   * the tool lists them, so they can be read and edited;
//   * and each is one `deferred` flag away from moving between the courses.
//
// `loadTutorial` normalises both lists; `tutorOrder()` in main.js is what
// splits them into the onboarding's running order and this one.
// --- THE SLOW-TIME LESSON'S OWN CORRIDOR ------------------------------------
// The onboarding's teaching leg is nine cells of walking before anything
// happens, because at that point the player is learning to walk. This one is
// not: it is played by somebody seventy doors in who has just been told a new
// power exists. One corner, so the barrier arrives as a thing you turn into
// rather than a thing you were already looking at, then the run it stands in.
const SLOW_MOVES = [
  ['f', 5],
  ['r', 3],    // the corner. The barrier is in frame the moment you round it.
  ['f', 12],   // the run the whole lesson happens in
];
export const SCHOOL_LEGS = [
  {
    id: 'slowteach', form: 'corridor', barrier: true, countsAsDoor: false,
    note: 'The slow-time lesson. One corner, the barrier, the button, the '
      + 'meter — then a room to use all three in.',
    plan: { moves: SLOW_MOVES, approach: 4 },
  },
  { id: 'slowroom', form: 'vault', kind: 'room',
    note: 'Practice. Three of them, taking turns, with the meter running.',
    plan: { moves: [['f', 10]], extra: room(1, 1, 8), approach: 3 },
    enemies: [{ x: -1, z: 5, type: 'gunner' }, { x: 1, z: 5, type: 'gunner' },
      { x: 0, z: 8, type: 'gunner' }], fireOrder: 'turns' },
];

export const DEFERRED = [
  // --- A. THE MARK --------------------------------------------------------
  // Same furniture as the onboarding's lesson 4, and deliberately so: a player
  // who is seeing a barrier and the words STAND HERE for the second time in a
  // run already knows what they mean, and that recognition is the cheapest
  // possible way to say "this is a lesson, stop and read it".
  {
    id: 'slowStand', label: '@ · Stand here (again)', deferred: true,
    hud: 'GO TO THE BARRIER',
    advance: { kind: 'atBarrier' },
    grants: { ...PLAYING, timebtn: false, meter: false, spawns: false },
    buildBarrier: true,
    cues: [{ text: 'STAND HERE', slot: 'world', arrow: 'none', hand: 'none',
      pulse: true, on: 'enter', off: 'advance' }],
  },
  {
    id: 'slowIntro', label: 'A · Slow time', deferred: true,
    advance: { kind: 'froze' },
    grants: { timebtn: true }, bodies: 1, hardFreeze: true,
    hud: 'SLOW TIME',
    // Released by the BUTTON, not by stepping aside: that is the whole point
    // of this lesson and the reason `tutorRefusesResume` exists.
    cues: [{ text: 'DODGE THE BULLET<span>TAP HERE TO SLOW TIME</span>',
      slot: 'atbtn', arrow: 'down', hand: 'none', pulse: true,
      on: 'held', off: 'freeze' }],
  },
  {
    id: 'slowMove', label: 'B · Move out of the way', deferred: true,
    advance: { kind: 'dodged', need: 1 },
    grants: { timebtn: true }, bodies: 1,
    hud: 'DODGE THE ROUND',
    cues: [{ text: 'DRAG TO MOVE', slot: 'left', arrow: 'none', hand: 'sway',
      pulse: false, on: 'enter', off: 'advance' }],
  },
  {
    id: 'meter', label: 'C · The meter', deferred: true,
    advance: { kind: 'resumed' },
    grants: { timebtn: true, meter: true }, bodies: 3, startMeter: true,
    hud: 'WATCH THE METER',
    cues: [
      { text: 'YOUR METER DRAINS<br>WHILE TIME IS SLOW',
        slot: 'top', arrow: 'up', hand: 'none',
        pulse: false, on: 'enter', off: 'advance' },
      { text: 'TAP AGAIN TO RESUME',
        slot: 'atbtn', arrow: 'down', hand: 'none',
        pulse: true, on: 'meter', off: 'advance' },
    ],
  },
  // ...and the per-area reminder loop the training rooms used to carry. A cue
  // with `once` is SPENT by the action it asked for, for the rest of that area.
  {
    id: 'slowPractice', label: 'D · Practice · reminders', deferred: true,
    advance: { kind: 'crossed' },
    grants: { ...PLAYING, timebtn: true, meter: true, bank: true },
    checkpoint: true, hud: 'CLEAR THE ROOM',
    cues: [
      { text: 'TAP TO SLOW TIME', slot: 'atbtn', arrow: 'down', hand: 'none',
        pulse: true, on: 'threat', off: 'freeze', once: true },
      { text: 'YOUR METER IS RUNNING OUT', slot: 'top', arrow: 'up', hand: 'none',
        pulse: false, on: 'low', off: 'resume', once: true },
      { text: 'TAP AGAIN TO RESUME', slot: 'atbtn', arrow: 'down', hand: 'none',
        pulse: true, on: 'low', off: 'resume', once: true },
      { text: 'TAP ANYWHERE TO SHOOT', slot: 'mid', arrow: 'none', hand: 'none',
        pulse: true, on: 'ready', off: 'shot', once: true },
    ],
  },
  // --- E. HANDOVER --------------------------------------------------------
  // The onboarding's `done` in miniature, and it exists for the same reason:
  // something has to be the last step, or `tutorAfter` walks off the end of
  // the list and hands the player back a step it has already played.
  {
    id: 'slowDone', label: 'E · Back to the run', deferred: true,
    advance: { kind: 'none' },
    grants: { ...PLAYING, timebtn: true, meter: true, bank: true, spawns: true },
    hud: '',
    cues: [],
  },
];

export const DEFAULT_SPEC = { TUTOR, LEGS, SCHOOL_LEGS, STEPS: [...STEPS, ...DEFERRED] };

// --- the tool's channel ----------------------------------------------------
// The level tool writes an edited spec here and opens the game in an iframe.
// It is honoured ONLY under ?tutorpreview=1, so an override left in a browser
// by an afternoon of editing can never reach an ordinary run — the one thing
// this hatch must not be able to do.
export const OVERRIDE_KEY = 'ts_tutor_override';
export const PREVIEW_PARAM = 'tutorpreview';

export function previewing(search) {
  const q = search === undefined
    ? (typeof location !== 'undefined' ? location.search : '') : search;
  return new URLSearchParams(q || '').get(PREVIEW_PARAM) === '1';
}

// Merged rather than replaced, so a spec written by an older build of the tool
// still boots: anything it does not mention keeps the shipped value.
export function loadTutorial(search) {
  const spec = { TUTOR: { ...TUTOR }, LEGS: normaliseLegs(LEGS),
    SCHOOL_LEGS: normaliseLegs(SCHOOL_LEGS),
    STEPS: normalise([...STEPS, ...DEFERRED]) };
  if (!previewing(search)) return spec;
  let raw = null;
  try { raw = localStorage.getItem(OVERRIDE_KEY); } catch { /* private */ }
  if (!raw) return spec;
  try {
    const o = JSON.parse(raw);
    if (o && o.TUTOR) Object.assign(spec.TUTOR, o.TUTOR);
    if (o && Array.isArray(o.LEGS) && o.LEGS.length) spec.LEGS = normaliseLegs(o.LEGS);
    if (o && Array.isArray(o.SCHOOL_LEGS) && o.SCHOOL_LEGS.length) {
      spec.SCHOOL_LEGS = normaliseLegs(o.SCHOOL_LEGS);
    }
    if (o && Array.isArray(o.STEPS) && o.STEPS.length) spec.STEPS = normalise(o.STEPS);
  } catch (err) {
    console.warn('[tutorial] override ignored:', err && err.message);
  }
  return spec;
}

// A LEG OFF THE TOOL IS AS UNTRUSTED AS A STEP. It used to be cloned raw, so
// `moves: 'forward'` — a string where a list of moves belongs — built a
// one-cell corridor rather than being refused, and any hand-edited leg could
// put a NaN into the geometry. Everything is coerced to the shape genleg reads
// and the marks are recomputed from whatever path survives that.
export function normaliseLegs(legs) {
  return (legs || []).map((l) => {
    const src = l && l.plan ? l.plan : null;
    const moves = (Array.isArray(src && src.moves) ? src.moves : [])
      .map((m) => [String((m && m[0]) || 'f'), Math.max(0, (m && m[1]) | 0)])
      .filter(([dir, n]) => n > 0 && 'flrb'.includes(dir));
    const cellList = (v) => (Array.isArray(v) ? v : [])
      .filter((c) => Array.isArray(c) && isFinite(c[0]) && isFinite(c[1]))
      .map((c) => [+c[0], +c[1]]);
    const plan = src ? {
      ...src,
      moves: moves.length ? moves : [['f', Math.max(1, TUTOR.hallCells)]],
      extra: cellList(src.extra),
      pillars: cellList(src.pillars),
      approach: Math.max(1, (src.approach | 0) || 4),
    } : null;
    const out = {
      ...l,
      id: String((l && l.id) || 'leg'),
      form: (l && l.form) || 'corridor',
      barrier: !!(l && l.barrier),
      enemies: ((l && l.enemies) || [])
        .filter((e) => e && isFinite(e.x) && isFinite(e.z))
        .map((e) => ({ x: +e.x, z: +e.z, type: String(e.type || 'gunner') })),
      fireOrder: (l && l.fireOrder) === 'turns' ? 'turns' : 'free',
      // A HALF-WRITTEN SIGN MUST NOT THROW IN THE FRAME LOOP. Same rule as
      // the enemy list above: filter here so an edited spec cannot reach the
      // painter with a sign that has no words or no place to stand.
      // Derived turn signs are on by default and off where a lesson owns the
      // screen. Explicit `false` only — an absent flag means yes.
      turnSigns: (l && l.turnSigns) !== false,
      // The dead end's furniture. `cells` doubles as the test for whether the
      // player is inside the joke, so a leg without one is simply not one.
      dead: (l && l.dead && Array.isArray(l.dead.cells) && l.dead.cells.length)
        ? { cells: l.dead.cells.map((c) => [c[0] | 0, c[1] | 0]),
            man: Array.isArray(l.dead.man) ? [l.dead.man[0] | 0, l.dead.man[1] | 0] : null,
            back: Array.isArray(l.dead.back) ? [l.dead.back[0] | 0, l.dead.back[1] | 0] : null }
        : null,
      // Hale's painted messages: a leg-relative cell, which wall face it is
      // on, and the words. Filtered like everything else so a half-written
      // entry cannot reach the frame loop.
      paint: ((l && l.paint) || [])
        .filter((g) => g && Array.isArray(g.at)
          && (g.text || (Array.isArray(g.halves) && g.halves.length === 2)))
        .map((g) => ({ at: [g.at[0] | 0, g.at[1] | 0],
          text: g.text ? String(g.text) : '',
          halves: Array.isArray(g.halves)
            ? [String(g.halves[0]), String(g.halves[1])] : null,
          face: g.face || '-z', dir: g.dir || null,
          // cap height in metres — the number a person would give for how
          // tall the letters are. A hand's span is about right for a can.
          h: +g.h || 0.26, y: g.y != null ? +g.y : null })),
      // A HALF-WRITTEN SIGN MUST NOT THROW IN THE FRAME LOOP — same rule as
      // the enemy list above. Three anchor shapes survive: a mark name, a
      // spine index, and an explicit [gx, gz] cell for somewhere the path
      // does not go. A signpost carries `halves` instead of `text`, so one
      // or the other is required rather than `text` alone.
      signs: ((l && l.signs) || [])
        .filter((g) => g && g.at != null
          && (g.text || (Array.isArray(g.halves) && g.halves.length === 2)))
        .map((g) => ({
          at: typeof g.at === 'string' ? g.at
            : Array.isArray(g.at) ? [g.at[0] | 0, g.at[1] | 0]
            : (g.at | 0),
          text: g.text ? String(g.text) : '',
          halves: Array.isArray(g.halves)
            ? [String(g.halves[0]), String(g.halves[1])] : null,
        })),
    };
    if (plan) { out.plan = plan; out.marks = marksFromPlan(plan); }
    else delete out.marks;   // no path, no marks: main.js falls back on distance
    return out;
  });
}

// An edited step may be missing anything, including its cue list. Fill it in
// rather than letting a half-written step throw inside the frame loop.
function normalise(steps) {
  // TWO STEPS WITH THE SAME ID MAKE THE SEQUENCE A LOOP. `tutorAfter` and
  // `tutorSpecOf` both take the FIRST match, so renaming step 7 to `stand` in
  // the tool produced move → look → corners → stand → dodge1 → dodgeMove →
  // stand → … for as long as anybody cared to watch: an onboarding that can
  // never be finished, with nothing on screen to say why. Ids are made unique
  // on the way in, and the tool warns about the collision separately.
  const seen = new Set();
  const uniq = (id) => {
    let out = id, n = 2;
    while (seen.has(out)) out = `${id}-${n++}`;
    seen.add(out);
    return out;
  };
  return steps.map((s) => ({
    id: uniq(String(s.id || 'step')),
    label: s.label || s.id || 'Step',
    advance: { kind: (s.advance && s.advance.kind) || 'none',
      need: s.advance && s.advance.need },
    grants: { ...NO_GRANTS, ...(s.grants || {}) },
    bodies: s.bodies | 0,
    startMeter: !!s.startMeter,
    // OFF THE RUNNING ORDER, still in the spec. See DEFERRED above.
    deferred: !!s.deferred,
    // What the line at the top of the screen says after "TRAINING". Optional:
    // a step without one falls back to the ordinary door-and-enemies readout.
    hud: s.hud == null ? '' : String(s.hud),
    buildBarrier: !!s.buildBarrier,
    dropBarrier: !!s.dropBarrier,
    openDoor: !!s.openDoor,
    raiseGun: !!s.raiseGun,
    hardFreeze: !!s.hardFreeze,
    // ONE AT A TIME, AND THE SCRIPT HANDS OUT THE TURNS — see the `shoot`
    // step. Named here because this normaliser rebuilds a step field by
    // field and a key it does not name is silently dropped, which is the
    // same trap the cue loop below documents: the flag was set in the spec,
    // arrived as undefined, and three men stood in a hallway firing nothing.
    turns: !!s.turns,
    checkpoint: !!s.checkpoint,
    divider: !!s.divider,
    cues: (s.cues || []).map((c) => ({
      text: String(c.text == null ? '' : c.text),
      slot: c.slot || 'mid',
      arrow: c.arrow || 'none',
      hand: c.hand || 'none',
      pulse: !!c.pulse,
      // ...shown at most once per area, spent by the action it asked for
      once: !!c.once,
      // A CUE CAN ASK FOR THE SCREEN DIVIDER. The step-level `divider` hangs
      // it over the whole beat, which is right for lesson 5 and wrong for the
      // rescue — that one runs inside a real fight and the line has to come
      // and go with the words. This normaliser rebuilds a cue field by field,
      // so a key it does not name is silently dropped: `divider` was set in
      // the spec, arrived as undefined, and the line never came on.
      divider: !!c.divider,
      on: c.on || 'enter',
      off: c.off || 'advance',
    })),
  }));
}
const clone = (v) => JSON.parse(JSON.stringify(v));
