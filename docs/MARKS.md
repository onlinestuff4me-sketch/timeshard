# Marks — the orange things in the world

Working design notes for a system that does not exist yet, written against a
specific request:

> *More things like the floating STAND HERE — messages that appear in the
> world, luring the player to specific places and guiding them to where they
> need to go next.*

`docs/STORY.md` needs a sign painter. This is what it paints, what the
words are allowed to say, and the rule that stops it becoming a second HUD.
**Where each of them goes, and what it is for, is `docs/BEATS.md`.**

**Adopting §5 changes `docs/TUTORIAL-GOALS.md`, which is the specification.**
`PILLARS` says a change to a line in a fence document is a design decision and
belongs in a conversation before it belongs in a commit. §5.6 lists exactly
which lines, and what the current reasoning behind each of them was, so that
the conversation can be had against the real text rather than against a
summary of it.

---

## 1. What a mark is

A **MARK** is a message anchored to a place in the world, painted orange, that
names what that place is for.

Three channels now, and they must not blur:

| | lives on | says | leaves when |
|---|---|---|---|
| **cue** | a screen slot | how to work a control | the lesson is complete |
| **headline** | a card, centre screen | what just changed | a timer |
| **mark** | a wall, in the world | *go here* / *this is the place* | you arrive |

A cue teaches. A headline announces. **A mark is the only one of the three that
is navigation**, and it is the only one that is a thing rather than a caption
about a thing. `STAND HERE` already works this way and is the proof: it is
painted across the barrier at a width in metres, it grows as you walk up to it,
and it is hidden the moment the barrier is not in view.

That behaviour is the specification for every mark. It is already written, in
`tutorPlaceWorldCue`, for one string.

---

## 2. Orange is a law, not a colour choice

The palette has exactly two meanings today: the world is white, and **red is
threat** (`main.js:11298` — *"in a world this pale red means threat"*).

Marks add a third and it must be as strict as the first two:

> **Orange means the building is telling you where to go. It never means
> anything else.**

Not damage, not a pickup, not a HUD accent, not a highlight. The moment orange
appears on something that is not a direction, the direction stops being
readable at a glance — which is the entire value of a mark on a phone screen at
thirty metres.

### 2.1 Why this is the most important line in this document

The tutorial is going to spend ninety seconds teaching a player that orange is
trustworthy. `docs/STORY.md` then spends the rest of the game betraying that
trust: every door is marked `EXIT`, the simulation keeps announcing that it is
finishing, and neither is true.

**You cannot betray a signal the player never learned to trust.** So the
onboarding is not merely onboarding here — it is the setup for the lie, and
every honest mark in the first ten doors is a deposit against it. That is the
strongest argument for building this system, and it is a story argument rather
than a UX one.

### 2.2 One conflict, and it is real

`VIS.contactBlackCol` is `0xff6a24`. That is orange, and it currently means
*an enemy is standing there* — the fog-exempt contact mote that `PILLARS` §6
requires so a blackout cannot hide a body.

Orange therefore already means "threat you cannot otherwise see", which is the
exact opposite of what §2 wants it to mean. This has to be settled before a
single mark is painted, and there are only two answers:

1. **The mote goes red**, joining every other threat signal. Correct by the
   colour law and by `PILLARS` §6; it is a change to a tuned, shipped value.
2. **Marks take a different amber**, further from red than `0xff6a24` is.
   Cheaper, but it puts two similar oranges on screen meaning opposite things,
   which is the failure mode `updateEdgeArrows` already documents for two reds:
   *"two reds meaning two different things is worse than either one alone."*

Recommendation: **(1)**. Blackout is `impl: false` and reachable only through
Settings → TEST, so the mote is not in the main flow and the change costs
nothing today. It will cost something the day blackout ships, and this is the
cheap moment.

---

## 3. Marks are derived, never typed

A mark declares **which named place on the path it belongs to**, never a
coordinate.

This is not a preference. `src/tutorial.js` already carries the scar:

> *DERIVED, NEVER TYPED. […] Held as literals they went stale the instant
> [the path] was: redrawing the teaching leg in the tool left the barrier
> standing 24 m inside solid rock, with lesson 4 waiting for the player to
> reach a cell the corridor no longer had and the STAND HERE sign gated off a
> spine index the leg no longer reached. Nothing on screen, no way forward, no
> error.*

So marks hang off `marksFromPlan` exactly as the barrier does, and dragging the
path in the tool carries them. `docs/LEVELS.md` already describes the barrier,
the start and the door as *"drawn but not painted: all three are derived, so
they move when the geometry does instead of being separately maintained."*
Marks are the fourth thing on that list.

### 3.1 One new derived mark, and it generalises

`marksFromPlan` gains **`turnLead[]`** — for every change of direction in the
path, the cell a short run before it.

That single addition gives every authored leg a sign before every turn for
free, and it is what real building wayfinding does. The tutorial's two turns
are then not special-cased; they are the first two entries in a list.

### 3.2 Which wall it goes on

A mark before a left turn belongs **on the wall you would walk into if you did
not turn** — the far face of the T, derived from the turn's direction.

This is where the sign goes in a real corridor, and it means the building
answers the question your body is about to ask, on the surface that is about to
stop you. It also needs no arrow to be understood, which is the test of a sign.

---

## 4. The vocabulary is closed

Five strings in three shapes, listed in `docs/BEATS.md` §3, each tied to a
mechanic that has a place. Adding one is a design decision.

The rule that decides membership: **a screen cue says what to do, a world
message says where to do it.** A mechanic with no place — shooting, the
headshot, the time button — has no mark and stays on screen.

Words are plain English, five words or fewer, and every one replaces a screen
string rather than joining it.

---

## 5. The tutorial's new opening

The requested sequence, specified.

### 5.1 What the player sees

1. They wake facing a corridor with **no visible end**. `DRAG TO MOVE`.
2. Twenty metres ahead, orange, and legible from the first frame: **`STAND HERE`**.
3. They reach it. They stop.
4. **The picture tears for less than a second.** When it settles, the endless
   straight is a wall, and there is a turn to the left that was not there.
5. On the wall the turn faces, orange: **`EXIT →`**.
6. They turn. Another stretch, another wall, another **`EXIT →`**.
7. They turn, and there is the barrier, with **`STAND HERE`** painted on it.

The first thing that ever happens to this player is the world being caught
changing shape, and it happens because they did as they were told.

### 5.2 The endless hallway is already built

`VIS.hallNear = 14`, `VIS.hallFar = 55`. The corridor fogs out from fourteen
metres and is solid air by fifty-five.

**A corridor longer than 55 m has no visible end.** The infinite hallway is not
an effect to build; it is a decoy run of cells that outruns the existing fog.
Nothing new, no shader, no far-plane change.

### 5.3 The geometry, and why nothing is built at runtime

`PILLARS` §8: *do not add a light, a material or a pass at runtime.* A
corridor that rebuilds itself when the player steps on a mark is exactly the
stall that rule exists to prevent.

So **both configurations exist from the first frame**, and the glitch toggles
`.visible` on two pooled wall panels. Nothing is allocated, nothing compiles.

```js
// src/tutorial.js
const TEACH_MOVES = [
  ['f', 8],    // 1. MOVE. The mark is at cell 5; the turn is at cell 8 and
               //    is capped until the glitch opens it.
  ['l', 3],    // 2. LOOK — EXIT -> on the decoy's cap
  ['f', 3],
  ['r', 3],    // 3. CORNERS — EXIT -> again
  ['f', 13],   // 4-9. barrier, dodge, shoot, door
];

// The decoy: cells hung off the path, which `plan.extra` already supports
// ("a room's width, a fork's second lane"). Cells 9-22 carry the straight
// past the turn and past the 55 m fog wall, so the corridor has no end.
extra: [[0, 9], [0, 10], /* … */ [0, 22]],
```

| | before the glitch | after |
|---|---|---|
| cap on the **left turn** at cell 8 | visible | hidden |
| cap on the **decoy** at cell 9 | hidden | visible |

The `EXIT →` sign is painted on the decoy's cap — **the wall that was
open air a second ago.** That is the best-placed sign in the sequence and it
falls out of the geometry for free.

### 5.4 The glitch

Six rules, each of them load-bearing:

1. **It fires on arrival, by proximity — not on the player stopping.** A player
   who walks straight through the mark still gets the beat. Nobody can be
   stranded in a corridor waiting for a trigger they did not know they had to
   arm.
2. **The camera never moves.** `PILLARS` §4 is absolute and this is the most
   tempting place in the game to break it. The player stays put, facing the
   same way. The *world* changes.
3. **Movement is held; look stays live.** The freeze is not a lockout, it is
   the sign being obeyed — the player was asked to stand, and standing is what
   they are doing. The look axis, which `PILLARS` §4 defends hardest, is never
   taken.
4. **Under a second.** Punctuation, not a scene. Nothing here may force a
   pause, and the line between an effect and a cutscene is a number:
   ~0.6 s is an effect. Two seconds is a scene, and it does not ship.
5. **It must read with the shader off.** `gradeAllowed` self-limits the
   full-screen grades on a slow phone. The geometry change is therefore the
   sentence and the effect is only the punctuation — a player who never sees
   the grade still sees the corridor become a different corridor.
6. **It must not read as a bug.** Two things prevent that: the player *caused*
   it, and it is authored rather than random noise.

### 5.5 The form of the glitch

**Not shattering walls.** An earlier draft had the capping wall burst into
white debris using the enemy shatter system. It is cut, and the reason is
worth keeping: *a simulation does not explode, it re-renders.* Shattering is
this game's verb for a body stopping — spending it on architecture in the
first twenty seconds spends the strongest thing the game owns on a moment that
does not need it, and it teaches the player that walls are destructible, which
they are not.

The glitch is therefore **screen-space only**, and the geometry underneath it
simply is not the same on the far side:

- a **third grade quad** beside `gradeMul` and `gradeTun`, driven by the same
  eased `gradeK` and the same `gradeWant` selector, built in the same `mk()`
  and **warmed in `warmUp()` like the other two.** Scanlines and grain are
  already in `GRADE_COMMON`; a horizontal displacement is the only new term.
- the two wall caps toggle `.visible` behind it.

Nothing is allocated, nothing is compiled, no debris is spawned, and the
effect is a variant of a pass that already ships rather than a new system.

### 5.6 What this changes in `TUTORIAL-GOALS.md`

Three lines, with the reasoning that is currently behind each:

**Lesson 1's end condition.** It ends at `firstCornerLead`, *"a couple of cells
SHORT of the corner"*, because `DRAG TO LOOK` *"has to be on screen BEFORE
there is anything to look at."* Under this plan it ends at the mark, and
`DRAG TO LOOK` arrives on the glitch — which is still before the turn, and is a
far better moment for it: the world has just changed and the instruction is to
go and look at it. **The reasoning survives and is better served.**

**Lesson 2's location.** Look is currently taught on a straight, deliberately:
*"the point being made is that looking is a SEPARATE action that happens at the
same time as moving, not a mode you enter."* Teaching it at a corner risks the
player learning *look = turn corners*, which is the wrong lesson and is a real
cost, not a hypothetical one. **Mitigation:** the cue still arrives mid-straight
on the glitch, so it is still taught as simultaneous; the turn is where it gets
*used*. That is the intended shape — taught on the straight, paid off at the
corner — but it is the line in this proposal most worth arguing about.

**The way-out needle.** `wayArrowShows()` holds the needle through the walking
lessons and retires it on `tutorSignSeen`. With a mark in every walking lesson,
it is retired at the first one and never returns during the onboarding — it
only needs `tutorSignSeen` to be set by *any* mark rather than only the
barrier's. **This proposal removes a system from the onboarding rather than
adding one**, which is the direction `TUTORIAL-GOALS` §3 asks everything to
move in.

### 5.7 STAND HERE means one thing, in both places

It appears twice: at 20 m, and on the barrier. That is a rhyme, not a
collision, and `TUTORIAL-GOALS` §6 already blesses the technique — *"the same
furniture as onboarding lesson 4, and deliberately so […] that recognition is
the cheapest possible way to say stop and read this."*

The condition on it: **both must behave identically.** Arrive, stop, and the
world does something. If one of them is a place and the other is a button, the
words mean two things and the rhyme becomes a lie.

---

## 6. The glitch is a grammar, not a one-off

Establish it once in the tutorial and it can be spent for the rest of the game
without building anything else:

- **The one-way seal** (`oneWaySeal`, shipped, `IT SEALS BEHIND YOU`) glitches
  shut instead of merely closing.
- **Breach walls** (`impl: false`) are the same effect from the other side.
- **Deep in the tunnel, a glitch that does not resolve cleanly.** The corridor
  comes back with a sign that is subtly wrong, or with the same sign twice.

That last one says the simulation is failing without a word of text, using a
mechanic the player learned in their first twenty seconds. It is the payoff
for building the grammar in the tutorial rather than inventing a bespoke
effect for it later.

---

## 7. Later, and not yet

Two extensions are specified elsewhere and deliberately not part of the first
build:

- **`LEG_HEADLINES` onto the walls.** The four headline strings are control
  instructions shown as centre-screen cards over the fight they are about.
  Moving them to the mouth of the leg is the same argument as §1, applied to
  the rest of the game.
- **Story signs.** `docs/STORY.md`. `EXIT THIS WAY →` and `EXIT` are the
  only two the opening needs, and they are already in the teaching set.
  Nothing else there ships until the teaching marks have been played.

One rule holds across both: **`EXIT` may eventually lie; `STAND HERE` may
not.** Standing still is how you survive this game, so a mark that puts
somebody in a firing line breaks the one signal they have to trust to play at
all.

---

## 8. Build order

1. **The mark painter.** Generalise `tutorPlaceWorldCue` from one barrier
   string to a list of world-anchored messages. Everything else is downstream.
2. **`turnLead[]` in `marksFromPlan`**, so marks anchor to named places.
3. **The tutorial marks** — `docs/BEATS.md` §7.
4. **Resolve the orange conflict** (§2.2). Small, and it blocks the rest.
5. **The glitch** — the grade variant in `warmUp()`, and the cap toggle.

---

## 9. What I would deliberately not build

- **A mark that follows the player.** The moment it is clamped into the frame
  it is a HUD element wearing a costume, and `tutorPlaceWorldCue` already
  carries the comment explaining what that looked like: *"a label on a barrier
  [that followed] the player around the corridor and hung over blank walls
  three turns away from the thing it names."*
- **A mark with more than four words.** It is read at thirty metres, in
  motion, on a phone.
- **A mark that is required.** Every one of them must be ignorable. A player
  who never reads a word should still reach the door — which for the tutorial
  means the geometry alone has to lead, and the marks only make it faster.
- **A glitch the player did not cause.** Without causality it is a bug, and
  the first one they see teaches them which of the two this game does.
- **An arrow that animates.** `PILLARS` §4 — nothing eases, snaps or settles
  on its own, and a pulsing chevron is the camera-motion argument in miniature.
