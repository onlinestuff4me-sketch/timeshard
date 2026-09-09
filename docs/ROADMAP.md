# The story, from here

One ordered list. `STORY.md` is the world, `SCRIPT.md` is the words,
`BEATS.md` and `MARKS.md` are how a message reaches a player. None of them
says what to build next, and each carries its own build-order section that has
drifted from the others. This is the single list; the others stay the source
of truth for their own subject and are referenced rather than copied.

---

## 1. Where this actually stands

**Written:** about 1,600 lines across four documents. Twenty-five wall lines
in five acts, ten of which decode. Ten of Hale's logs, five drafted. A
one-time-pad economy, a reveal sequence, a board, a finale, an ending.

**Built:** the onboarding's message system, and nothing else.

| | state |
|---|---|
| floating signs (`#ts-sign`) | built — onboarding only |
| painted walls (`tutorAddPaint`) | built — onboarding only |
| world cues (`STAND HERE`) | built — onboarding only |
| `EXIT` above a door | built as a capability, **authored on no leg** |
| wall lines past the tutorial | none |
| the pad, the board, the reveal | none |
| transmissions, Hale's audio | none |
| the finale, the clone, the ending | none |

**The gap, in one line.** `SCRIPT.md` §6 opens *"`EXIT` sits above every door
for the whole game."* It sits above none. Every message the game can currently
draw is behind one gate in the frame loop:

```js
if (tutorStep !== null) { tutorPlaceWorldCue(); tutorPlaceSign(); }
```

Everything below is downstream of removing that line honestly.

---

## 2. The sequence

Ordered by dependency, not by appeal. Each phase is a thing that can be
played; none of them is a refactor with no visible result.

### Phase 1 · The carrier leaves the tutorial

The message system belongs to a **leg**, not to a **lesson**.

- Drive the painter from the leg rather than from `tutorStep`.
- `tutorBuildSigns()` runs on tutorial resets and `tutorLegIx++` only; it
  needs to run whenever any leg is built.
- Signs and paint come from `tutorLegsOf()[tutorLegIx]`, an authored spec.
  Ordinary legs are *generated* (`genleg.js`) and have no spec, so a leg needs
  a story spec derived from its door number.
- The `tutor*` prefix stops being true. Renaming is not urgent and is not free
  — it touches every probe — so it is called out here and deferred.

**Proof it works:** `EXIT` above every door. Smallest possible payload, and it
is the first line of `SCRIPT.md` §6.

**The risk to measure:** `PILLARS` §8, no stall the player can feel. Paint is
a canvas, a texture, a material and a mesh per message. In the onboarding
those are built once with a leg the player is standing still in front of.
Ordinary legs are built as you walk. `__ts.render()` already reports draw
calls and triangles; the cost wants measuring before the second phase leans on
it, not after.

### Phase 2 · The ordered list, placed

`SCRIPT.md` §5 is already written as arithmetic rather than as door numbers,
which is the hard part done. What is missing is the function.

- `storyBeats(U, F)` → `door → { voice, text, page }`, spacing each act's span
  by `range ÷ beats` per §5.1.
- **U** exists: `unlockDoor()` in `balance.js`.
- **F does not exist.** There is no finale door in the build — `finaleWave` is
  the last group at an ordinary door, not a story beat. Acts 1–3 can be placed
  today; acts 4–5 cannot. See Q-A below.

### Phase 3 · The two registers, past the tutorial

Already true in the onboarding and mostly free here: the programme is
stencilled floating signage, Hale is paint on the masonry. This phase is
placement rather than machinery — **except** for the engineers, who are also
stencilled (`SCRIPT.md` §3), which means the true voice and the false one look
identical. See Q-D.

### Phase 4 · The pad

The largest single build in the document, and the one most worth questioning.

Debt tracking per door · payment on any exit from a run · the post-death
reveal hallway · the board in UNLOCKS · a wall line that changes permanently
and stays changed across runs (so: save state).

`STORY.md` §3.4 says the walls carry the plot and the audio is optional. The
pad is what turns nine of the wall lines over. Without it those nine simply
read as the programme's version and are never contradicted — a smaller story,
but a coherent one. See Q-E.

### Phase 5 · Audio

Hale's ten logs and the numbers station. Deliberately last: §3.4 says nothing
load-bearing lives in the audio, so this is texture over a story that already
works. One recorded voice; the numbers can be synthesised.

### Phase 6 · The finale and the ending

The clone that dodges, the hidden full stop, the meeting, the questions, the
wipe. Needs F to exist (phase 2), the last three wall lines (phase 2), and
`STORY.md` §9's decisions about what survives.

---

## 3. What blocks the build

Five decisions. The eleven open questions in `STORY.md` §10 are mostly colour
and can be answered late; these five change what gets written.

| | question | what it blocks |
|---|---|---|
| **Q-A** | **Where is F — the finale door?** | Acts 4 and 5. Every beat in them is spaced against it, and there is no finale in the build to space against. Until F is a number, phase 2 places acts 1–3 and stops. (This is half of `STORY.md` Q24.) |
| **Q-B** | **Does the one-message rule hold outside the tutorial?** | Phase 1's shape. Inside the onboarding, one message in focus is enforced three ways. Outside it there are already `LEG_HEADLINES` centre-screen cards, the way-out needle, and per-enemy marks — and wall lines are about to join them. Either a wall line suppresses the headline the way paint suppresses a sign, or the rule was a tutorial rule. |
| **Q-C** | **Do twenty-five beats get read?** | How many beats there are. A player who stops at door 12 reads three of twenty-five. `SCRIPT.md` §5.3 says the fix is fewer beats rather than compressed ones — which is a cut nobody has made yet. (`STORY.md` Q2.) |
| **Q-D** | **How does the player tell the engineers from the programme by eye?** | Act 3 onward. `SCRIPT.md` §3 gives both the same register — stencilled signage — with the engineers' merely "un-overwritten". Hale is sorted from both by one glyph. The true voice and the false one currently are not. |
| **Q-E** | **Is the pad worth its cost?** | Phase 4, which is bigger than phases 1–3 together. Build it, defer it behind the walls shipping, or cut it and let the programme's version stand uncontradicted. |

Two smaller ones, answerable whenever:

- **Q22** — a rewritten wall: struck-through false word, or replaced outright.
  Struck through keeps the drama and doubles the text on a phone.
- **Q18** — does T25 need to exist? It is the win condition in plain words.

---

## 4. What I would cut, or defer, unprompted

- **The transmission leg** is already retired (`STORY.md` §3.5) and should stay
  retired. Nothing load-bearing lives in the audio, so a 69 m corridor built to
  carry it is 69 m built for nothing.
- **`LEG_HEADLINES` onto the walls** (`BEATS.md` §7) is listed as later work,
  and it should wait for Q-B rather than lead it. The headline and a wall line
  are the same decision.
- **Renaming `tutor*`** — real, worth doing, and not before the carrier is
  proved.

---

## 5. Where the other documents fit

| document | owns |
|---|---|
| `STORY.md` | the world, the pad's economy, the questions log |
| `SCRIPT.md` | the twenty-five lines, the three voices, the spacing arithmetic |
| `BEATS.md` | the tutorial's message vocabulary and its one-message rule |
| `MARKS.md` | how a mark is anchored, and the junction |
| `TUTORIAL-GOALS.md` | the onboarding's specification — changing a line is a design decision |
| **this file** | what to build, in what order, and what is blocked |

`MARKS.md` §8 and `BEATS.md` §7 are build orders for their own subject and are
now mostly complete; where they disagree with this file about sequence, this
file is the later document.
