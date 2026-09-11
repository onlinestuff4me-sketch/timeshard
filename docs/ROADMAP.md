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

**The hand-off, revived.** The needle carries the corridor while the door is a
red rectangle in the distance and retires once `EXIT` above it is readable —
both answer "which way now", and the one written on the building names the
place instead of pointing at it. Only that branch: a player who has turned
their back cannot read a sign behind them, so the needle still answers there.

**Drawn is not read**, and that distinction cost a probe. The first version
handed over the instant the sign was projected, which at forty metres is a few
pixels — `waydoor` walks a real leg at door 12 and reported the needle never
appearing at all, because the sign was technically on screen for the whole
walk. `SIGN_READ_PX` is 26 against a 44 px ceiling, so the hand-off happens
around twenty metres out. Measured after: the needle is up for 37 frames of
that walk and retires 20.5 m from the door, where it used to run to 10.2 m.

The latch moved with it. `tutorSignSeen` was cleared once per run, which was
fine while it gated a lesson that happens once and wrong the moment it started
retiring the run's needle — one sign read on the first leg would have kept the
needle off for fifty doors. It belongs to the leg now.

### Phase 2 · The ordered list, placed — **arithmetic built, one anchor wrong**

**The script is data.** `src/story.js` holds all twenty-five lines in order,
with voice, the ten rewrites and the two anchored beats. No door numbers.

**The last door exists.** `finaleDoor()` in `balance.js`, the same shape as
`unlockDoor()`: the first door the speed staircase reaches `finaleM` (18 m/s)
on. Door 80 on the shipped ramp, and it moves with a retune. It carries a
floor as well as a speed — `finaleFloor`, twelve doors past the school —
because on a steep ramp the staircase crosses 13 → 18 m/s in three doors, and
measured at `stepM` 1.44 the entire middle act lost all five of its lines with
nowhere to go. Neither a shorter school nor a higher threshold recovered them;
both move the last door too.

**The spacing works.** `storyDoors({ unlock, finale, schoolDoors })` drips the
beats between the anchors, cuts rather than crowds when a span is too short
(`SCRIPT.md` §5.3), and every knob is in one `STORY_PACE` object because the
ramp is going to move. `test/story.mjs` walks seven ramps and checks the shape
holds on all of them: strictly increasing doors, the placed beats a
subsequence of the script, the engineers' line exactly on the unlock, the win
condition exactly on the last door, nothing but the closing act inside the
last four doors.

| ramp | slow time | last door | placed |
|---|---|---|---|
| shipped | 46 | 80 | 25 / 25 |
| `stepM` 0.6 | 22 | 44 | 25 / 25 |
| `stepM` 1.0 | 18 | 40 | 25 / 25 |
| `stepM` 1.44 | 15 | 37 | 23 / 25 |
| `stepM` 2.4 | 13 | 35 | 21 / 25 |

**The rewrites are tightened**, per the answer to log both versions and keep
as many words as possible while the meaning still turns over. Three lines were
redrafts; all ten now keep a majority of the sentence, and the probe prints
the before, the after, and what each one used to say.

| beat | kept | was |
|---|---|---|
| `anomaly4` | 6/7 | 3/7 — `THIS CHANNEL IS WRITTEN OVER BY THE PROGRAMME` |
| `watchers4` | 6/7 | 2/7 — `NO ONE HAS EVER BEEN SENT HOME` |
| `copy1` | 7/8 | 3/8 — `THE LAST DOOR HOLDS SOMETHING WEARING YOUR FACE` |

#### The anchor, and what it is waiting on

**`SCRIPT.md` §5.1 anchors the story to "where slow time arrives". There are
two doors that could mean, and they are 36 apart:**

| | | |
|---|---|---|
| `powerUnlockDoor()` | **10** | where the time button is handed over — derived from the first door that fields a group too big to sidestep |
| `unlockDoor(SPEED)` | **46** | where rounds get genuinely fast; the speed staircase's own landmark |

**This is being fixed in the balance session, not here.** Rounds should get
fast *on* the door the time button arrives, because the button is the answer
to fast rounds — handing over the mitigation thirty-six doors before the
problem is backwards. The two numbers become one.

**What the story needs from that work: the unlock door at 17 or later.**

Sixteen beats sit ahead of the anchored one and each wants a door of its own
at the one-per-door floor, so `storyMinUnlock()` computes 17 and
`test/story.mjs` prints it every run. It is derived, not typed — cut a line
from acts 1–3 and the requirement drops with it.

| unlock door | script |
|---|---|
| 10 (today's button) | 18 / 25 — seven cut |
| **17** | **25 / 25** |
| 46 (today's speed) | 25 / 25 |

If the ramp settles below 17, the script is what gives: `SCRIPT.md` §5.3 is
explicit that the fix is to cut beats rather than crowd them, and
`storyDoors()` already does exactly that and reports what it dropped. At door
10 it would lose `test2`, `test4`, `test6`, `others2`, `others5`, `anomaly2`
and `anomaly4` — which includes both of act 1's rewrites, so the first time a
wall turns over would move from act 1 to act 2.

**Placement is not wired to a leg yet, and should not be until that number
settles** — wiring it now wires it to a door that is about to move. Everything
else is ready: `storyDoors` takes the anchors as plain numbers, so the day the
ramp lands this is one call.

#### The drip is one arc, not four schedules

The story is one strand of something bigger, and looking at the strands
together — `tools/arc.mjs`, which prints every new thing a run introduces
door by door — says something none of them says alone.

**A brand-new player's run:**

```
  1   corridor · gunner · first wall line
  2   service run · vault · alcoves · Hale
  3-6 story only
  7   rusher
  9   shotgunner
 10   the time button
 11-29  ·················· nineteen doors with nothing new at all
 30   story
 41   story
 52   story        (~ten-door gaps to the end)
```

Everything a first-time player has not seen is spent by **door 10**, and then
there are **nineteen doors of corridor with nothing in them but faster
bullets**. That is the shape to fix, and a faster ramp does not fix it — it
makes the empty stretch arrive sooner and hotter.

**Most of the drip is already specified and not built.** Twenty-eight registry
rows can be introduced; **ten of them are `impl: false`** — which is precisely
the material the arc is short of:

| kind | waiting to be built |
|---|---|
| form | `GALLERY`, `STAIRWELL`, `SPIRAL` |
| condition | `FOG`, `BLACKOUT`, `FLOOD`, `DEAD AIR` |
| measure | `BREACH WALLS`, `GRINDER`, `TURRET` |

They also carry `unlockAt` values from 40 to 260 lifetime doors, so a new
player would not meet them even once they exist. Both dials — when a thing is
built and how long a player must have played to meet it — decide what the
first run feels like, and neither is a story dial.

**A mode break is a new kind.** The registry has `form`, `condition`,
`measure` and `enemy`. Walking through a door into City Streets — where
enemies come out of a crowd and shooting a pedestrian kills you — is none of
those: it is a leg that is a different game. It slots in as a fifth kind with
the same two keys, which means the arc tool would schedule it alongside
everything else the moment it exists. The crowd, the sleepers and the mark
already exist for Rush Hour; the pedestrian rule does not.

**What this changes for the story.** Nothing about the lines, and everything
about where they go. `storyDoors()` currently spaces the beats against two
anchors in isolation; if the arc is going to be a designed schedule, a story
beat should land on a door that has *nothing else* arriving on it, rather than
competing with a new enemy type for the player's attention — which is the
one-message rule again, at the scale of a run instead of a screen. That is a
small change to the spacing and it needs the arc settled first.

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
