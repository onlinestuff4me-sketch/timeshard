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

**Built:** the carrier, as of phase 1 — a leg can now say something, and every
door of the run says `EXIT`. None of the twenty-five lines is placed.

| | state |
|---|---|
| floating signs (`#ts-sign`) | built — **every leg**, phase 1 |
| painted walls (`tutorAddPaint`) | built — the carrier is general, no run leg authors any yet |
| world cues (`STAND HERE`) | built — onboarding only, and correctly so |
| `EXIT` above a door | **above every door of the run** |
| wall lines past the tutorial | none |
| the pad, the board, the reveal | none |
| transmissions, Hale's audio | none |
| the finale, the clone, the ending | none |

**The gap this started from.** `SCRIPT.md` §6 opens *"`EXIT` sits above every
door for the whole game."* It sat above none: every message the game could
draw was behind one gate in the frame loop —

```js
if (tutorStep !== null) { tutorPlaceWorldCue(); tutorPlaceSign(); }
```

— and behind three more nobody had found. Phase 1 is that line, honestly
removed. Everything below is downstream of it.

---

## 2. The sequence

Ordered by dependency, not by appeal. Each phase is a thing that can be
played; none of them is a refactor with no visible result.

### Phase 1 · The carrier leaves the tutorial — **BUILT**

The message system belongs to a **leg**, not to a **lesson**. `EXIT` is above
every door of the run, which is the first line of `SCRIPT.md` §6 and was true
of no door before this.

**There were four gates, not one**, and each of them was the same mistake:

1. the frame loop drew the painter only inside `if (tutorStep !== null)`
2. `tutorPlaceSign` refused again on its own, `if (cueUp || tutorStep === null)`
3. `tutorBuildSigns` ran on tutorial resets and `tutorLegIx++` only, so a
   run's legs were never asked what they carry
4. **`#ts-sign` lived inside `#tutor`, which is `display:none` unless
   `body.tutoring` is set** — so even with the first three open the sign was
   built, picked, positioned and invisible. Found by measuring the element's
   box, not by reading the CSS: the probe reported `onScreen=true` at 0×0 px.

`legStorySpec()` now answers "what is written on this leg": an authored
onboarding leg says for itself, and everything else is the run and derives
from its door. `runLegSpec(door)` is where the twenty-five lines go next — it
already takes the door, so phase 2 fills it in rather than reshaping it.

`marks` became optional along the way. They were free while only authored legs
carried messages (an authored leg always has a plan, so it always has derived
marks); a generated leg has neither, and bailing without them was the second
gate in disguise.

**The risk, measured.** `PILLARS` §8 — building a leg's signs costs **0.1 ms
at worst** over thirty runs, against a 16.7 ms frame. It is furniture: made
once with the corridor, never while a fight is running. `test/exitsign.mjs`
holds the number down along with the rest.

**Q-B applied.** A plain leg's `DOOR N` card stands down for the `EXIT` sign
at the end of that same corridor — the same sentence twice, and the one in the
room wins. Only the bare fallback: a leg that *promises* something (`TIGHT
TURNS`, `NO COVER · DO NOT STOP`) is making a claim no wall sign makes, and
still says it. `legPromises()` already knew the difference.

**Still deferred:** the `tutor*` prefix is now half a lie. Renaming touches
every probe and is not free, so it stays on this list rather than in this
commit.

**Noticed while measuring, not changed.** On a cleared run corridor the
way-out needle points at the same door `EXIT` names. They are sequential
rather than simultaneous — the needle is legible at nine cells where the sign
is not, and the sign takes over as it becomes readable — but for the last few
metres both are on screen saying the same thing. The machinery to hand over
already exists (`tutorSignSeen` retires the needle once the sign is in frame)
and is currently dead outside the lesson. Reviving it is a pacing decision,
not a tidy-up.

### Phase 2 · The ordered list, placed — **the script is data; placement is not**

**Done: `src/story.js`.** All twenty-five lines, in order, with voice, the ten
rewrites, and the two anchored beats. Not one door number in the file — §5's
whole point, and `test/story.mjs` asserts it, along with the per-act counts,
that only the programme decodes, and that every line fits three rows on a
phone.

**Not done: the placement.** Writing the arithmetic turned up three things the
documents do not settle, and guessing any of them produces a script that is
silently in the wrong place.

1. **§5.1's spans account for 20 of the 25 beats.** The table gives acts 1–2
   eleven beats over door 1 → U, act 3 one beat *on* U, act 4 five, act 5
   three. That is 20. §6's act 3 has **six** lines, five of which sit before U
   and appear in no span. §5.3's worked illustration (`U = 46` → "every 4
   doors") matches eleven beats over 46 doors, not sixteen — so the two
   sections disagree about how crowded the run-up to the unlock is.

2. **How F derives.** Q-A says derive it like U, and U is a *speed*: the door
   where the bullet-speed staircase first reaches `unlockM`. The shape is
   settled; the threshold is not. There is no finale in the build to measure
   against.

3. **Where on a leg a line sits.** `EXIT` is at the door. §6 says the authored
   lines are "between them", so a story line is not on a door — but "between"
   is a stretch of corridor, not a place. The two readings are materially
   different: at the leg's **mouth**, where it replaces the headline card the
   player used to get on crossing, or at its **last corner**, read on the way
   out with the door already in view.

**Also found, and it is a writing question rather than a build one.** §3.2
says the programme "can only jam individual words", so a rewritten line is
"a real sentence with one or two words wrong" sharing the true version's
skeleton. Three of the ten replace more than half of it:

| beat | reads | after its page | kept |
|---|---|---|---|
| `anomaly4` | `THIS CHANNEL IS MONITORED FOR YOUR SAFETY` | `…IS WRITTEN OVER BY THE PROGRAMME` | 3/7 |
| `watchers4` | `YOU WILL BE SENT HOME WHEN YOU FINISH` | `NO ONE HAS EVER BEEN SENT HOME` | 2/7 |
| `copy1` | `THE LAST DOOR OPENS WHEN YOU ARE READY` | `…HOLDS SOMETHING WEARING YOUR FACE` | 3/8 |

`test/story.mjs` reports these rather than failing them — they are the
document's own lines — and fails only a rewrite that shares nothing at all,
which would be a redraft rather than a jam.

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

**All five are answered.** Recorded on the roadmap artifact and repeated here,
because a decision that lives only in a page nobody re-opens is not settled:

| | answer | what it means for the build |
|---|---|---|
| **Q-A** | Derive **F** like **U**, from the ramp | The finale is a *speed*, not a door number — same shape as `unlockDoor()`, so it moves when the ramp is retuned and the script does not care. Phase 2 needs the derivation before acts 4–5. |
| **Q-B** | The rule holds everywhere — a wall line suppresses the headline | **Applied in phase 1.** A plain leg's `DOOR N` card stands down for its own `EXIT`; a leg that promises something still speaks. |
| **Q-C** | Keep twenty-five and accept most are late | No cut. The back half is for players who go deep, and that is a known, chosen cost rather than an oversight. |
| **Q-D** | Same signage, but it **arrives differently** | The engineers do not get a third look. Whatever separates them from the programme is in the arrival — when it appears, how, what it interrupts — which is a phase 3 design problem, not a palette one. |
| **Q-E** | Build the pad — the turn is the story | Phase 4 stays in. It is still the largest single build here, and it is now committed to rather than deferred. |

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
