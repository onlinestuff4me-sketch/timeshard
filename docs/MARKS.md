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

## 2. Red, and one at a time

**No new colour.** `#ts-world` — the element `STAND HERE` is already drawn in
— is `#ff2d1a`, the signal red. Corridor signs use the same one.

The palette stays at three meanings and none of them collide:

| | |
|---|---|
| **white** | the world |
| **red** | the building talking, and the threat it is talking about |
| **black screen text** | the game instructing the player |

The earlier draft proposed orange for wayfinding and hit a real conflict:
`VIS.contactBlackCol` is `0xff6a24`, which is orange and already means *an
enemy is standing there*. Both problems go away by not inventing a colour.

### 2.1 One message on screen, counting the screen

What keeps red unambiguous is not hue, it is **count** — and the count is
across both channels, not one. `docs/BEATS.md` §1 is the rule; this is how it
is enforced.

`tutorSignPick` returns the nearest sign still ahead on the path and nothing
else is drawn, so a corridor reads as a sequence of single instructions
rather than as a noticeboard.

Three rules, all in `tutorPlaceSign`:

- **Any cue slot showing means no sign.** Not just the world slot — `DRAG TO
  MOVE` and a sign twenty metres away are two instructions competing for one
  glance, and they land within a few per cent of each other because a sign
  high on a wall projects near the vanishing point, which is where the coach
  line sits.
- **The barrier's `STAND HERE` wins**, being a world cue itself.
- **No sign while anybody is on the floor.** A navigation mark belongs in a
  corridor with nobody in it — the rule `wayArrowShows()` already reaches for
  past the onboarding. It is also why a sign does not ride on the `way`
  grant: that grant is off for the door lesson, whose entire subject is a
  door, and on for the dodging lesson, which is a fight.

### 2.2 A sign retires the needle

`tutorPlaceSign` latches `tutorSignSeen` the moment it genuinely draws, the
same way `tutorPlaceWorldCue` does. The red floor needle and a red sign
pointing at the same place are two answers to one question.

---

## 3. Marks are derived, never typed — with one exception

A sign names **which place on the path it belongs to**, never a coordinate.

This is not a preference. `src/tutorial.js` carries the scar:

> *DERIVED, NEVER TYPED. […] Held as literals they went stale the instant
> [the path] was: redrawing the teaching leg in the tool left the barrier
> standing 24 m inside solid rock […] Nothing on screen, no way forward, no
> error.*

So route signs hang off `marksFromPlan`, and dragging the path in the tool
carries them. Three ways to name a place, in order of preference:

| | | |
|---|---|---|
| `'door'` | the far end of the walked path | resolved when the leg is built |
| a mark name | `firstCorner`, `finalRun`, … | derived, survives a path edit |
| `[gx, gz]` | an explicit cell | **the exception** |

### 3.1 The exception, and why it has to exist

A dead-end branch is not on the spine, so there is no mark to hang a sign on
— `marksFromPlan` only knows the walked path. The `TURN AROUND` warnings in
§5 have nowhere else to live.

Two rules keep it honest:

- **Anything on the route stays named.** A coordinate is for somewhere the
  path does not go, and nothing else.
- **Cells are leg-relative**, the same frame of reference `plan.extra`
  already uses (`docs/LEVELS.md`). A leg starts wherever the last one ended,
  so an absolute coordinate is meaningless — and the failure is silent:
  measured, a sign authored at `[6, 12]` landed a few metres from the
  player's spawn and retired itself before the run had begun.

### 3.2 Two ways to retire a sign, one per kind of anchor

| | retired when |
|---|---|
| **route sign** | the walk has gone past the cell it hangs on |
| **placed sign** | the player has walked within 1.4 cells of it, latched |

A placed sign has no spine index to be passed, so proximity is the only
retirement available to it. That latch is cleared by
`tutorResyncSpineIx()` — **arriving somewhere is not the same as having
walked there**, and without that a teleport silently retired whatever it
landed near. Measured: the tool's step jump retired a branch sign
twenty-six metres away, because the jump had put the player beside it for a
frame.

### 3.3 The pick is by distance, not by spine order

The route-only version walked the spine in order. A branch is not on the
spine, so ordering along it cannot say which of a route sign and a branch
sign is the one in front of you — and at a junction both are a few metres
away.

Nearest is the honest answer, and it is the same answer on a straight
corridor, where the next sign ahead is also the closest one left.

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

## 5. The opening sequence

The answer to *what gives lesson 1 a destination* is not geometry and not a
sign. **It is a decision.** A junction with two labelled ways is a place the
player walks to in order to choose, which is a stronger reason to cross twenty
metres than any marker.

### 5.1 The sequence

| | what the player gets | on screen |
|---|---|---|
| 1 | A straight hallway. | `DRAG TO MOVE` + thumb coach |
| 2 | At the corner, the look lesson joins it. | + `DRAG TO LOOK` + its coach |
| 3 | Another turn. **The moment they face down the new hallway, both prompts and the divider go.** | nothing |
| 4 | A few metres on, the hallway ends in a **T**. On the wall: a red arrow left, `THIS WAY`. A red arrow right, `NOT THIS WAY`. | one signpost |
| 5a | **Right:** a short hall. At the first turn, `TURN AROUND`. At the next, `I'M NOT JOKING, TURN AROUND`. Immediately past that corner a gunner stands with his arm already up, and fires. | one message at a time |
| 5b | Red screen, about 1.5 s. No retry card. Back at the T, facing the signpost. | nothing |
| 6 | **Left:** at the next turn, `GOOD CHOICE`. Then `STAND HERE` on the barrier, and the lesson continues as built. | one message at a time |

### 5.2 Why this is the right shape

- **It answers the destination problem without a marker.** The walk has a
  reason: something to decide at the end of it.
- **The screen is empty by step 4**, so the signpost never competes. The rule
  holds without a special case.
- **It is the first thing the player chooses**, two minutes in, and the game
  responds to the choice. That teaches agency before it teaches a trigger.
- **It plants a vocabulary.** The arrow-and-message pattern is the one Hale
  uses later to point at things he found. The player learns to read his
  handwriting before they know he exists.
- **It is funny**, which nothing else in this game is, and ninety seconds in
  that buys a lot of patience.

### 5.3 The signpost is one message, not two

`THIS WAY` and `NOT THIS WAY` share a wall and are read together — a
signpost, the way a road sign naming two destinations is one sign. The rule
in `docs/BEATS.md` §1 is about unrelated instructions competing; this is one
instruction with two halves.

**Built as one element**, not two: `halves` renders a single box on a single
anchor, so the two labels scale and move together. Two elements would be two
messages, which is the thing the rule forbids — and the left label lands over
the left corridor mouth and the right over the right for free, because the
box is painted across the junction.

It carries one real constraint: **both halves must be in frame at once.** The
camera is about 42° horizontal in portrait, so the T wall has to be readable
whole from the approach. A four-metre wall at eight metres spans roughly 28°,
which fits — but it is the thing to check first, because a signpost you have
to pan across is two messages after all.

### 5.4 The arrow is Hale's signature

**The building labels places. Hale points at them.**

| | uses | never uses |
|---|---|---|
| **the building** | `EXIT`, `STAND HERE` — nouns, places, stencilled | arrows, second person |
| **Hale** | `→ THIS WAY`, `→ TURN AROUND` — arrows, spoken to you | naming a place as if it were signage |

One glyph does the whole job: **an arrow means a person marked this.** No
explanation is needed at the time, and the reveal costs nothing later because
the player already sorted the two voices by eye.

**Consequence:** the derived turn signs currently read `EXIT ▶`. If the arrow
is Hale's, the building cannot use one — those become plain `EXIT`, or they
become Hale's and mean something quite different. That is a decision, not a
detail.

### 5.5 The death has to be a joke, not a punishment

This is the player's first death, and it arrives before they know death
exists. The difference between *a joke with a punchline* and *the game killed
me for being curious* is entirely in the framing:

- **Two warnings first**, so it is plainly consented to.
- **Unwinnable on purpose, and visibly so.** The round must be faster than
  backtracking, or a player will believe they were merely slow — which turns
  a gag into a skill test they failed without being taught the skill.
- **The cost is about two seconds and no progress.** No retry card, no lost
  ground, straight back to the T. `TUTORIAL-GOALS` goal 4 is satisfied: the
  junction is the anchor and nothing before it is replayed.

**Built, and what "unwinnable" turned out to mean.** Speed alone cannot do
it. Every round in this game is aimed at *where you are*, so at any finite
speed a perfect sideways input beats it — measured, a 3.2× round crosses the
dead end in 0.7 s and a player who sidesteps on the fire frame walks out of
its lane. Making it fast enough to be unbeatable would make it invisible,
which is a different lie.

Three things together do it instead, and only the first is about the round:

- **No sight grace.** Every other gun in the game waits `RAMP.sightGrace`
  (0.45 s) after it can see you — the half-second that makes walking into a
  room survivable. He does not. With the grace, a player who sidesteps the
  instant they round the corner is back out of the branch before he ever
  fires, so the punchline was optional.
- **His arm is already up**, so the telegraph has nothing to animate. The gun
  still flashes white, so the shot is still announced; there is just no
  wind-up to read as a chance.
- **He does not stop.** A dodge buys about a second, and the branch is one
  cell wide and three deep. There is nowhere in it to be.

Measured one cell in from the corner, holding a perfect input from the first
frame: standing dies at 0.9 s, running back out at 1.0 s, both sidesteps at
0.8 s. The one escape left is stopping *exactly on the corner cell* and
sidestepping back out within a third of a second — which is not beating the
round, it is obeying the second warning at the last possible moment, and it
should work. `test/joke.mjs` is that measurement.

**He belongs to the branch, not to the leg.** Placed when the player walks in,
removed when they walk out. This is not tidiness: the shooting lesson advances
on `!enemies.length`, so a man left standing round two corners behind the
barrier is a lesson that can never be finished — by a player who went the
wrong way once, was told to turn around, and did. It also makes the joke
repeatable, which is the right default: Hale's warnings do not change on a
second visit, so neither does what they warn about.

### 5.6 Nothing essential lives down the right branch

Most players will take `THIS WAY`. The branch has to be pure reward for
curiosity, so no lesson, no mechanic and no required message can sit in it.

What it pays instead is character: somebody wrote these, somebody expected
you to disobey, and somebody found it funny. That is a better prize than
anything mechanical, and it is why the joke is worth building for the
minority who see it.

### 5.7 What this changes in the build

- **Lesson 3's prompts end on facing, not on reaching — built.** They used to
  run to the last corner, four cells past the T, so `DRAG TO MOVE` landed
  directly across `THIS WAY`: §1 broken at the exact place the player is first
  asked to read the world instead of the screen, and the joke's return frame
  landed on it too.

  **The prompts leave before the step does, and this is the only place in the
  build where those are different moments.** The step still has to run to the
  last corner — that is where the barrier comes into view and where `stand` is
  built to begin. Its words do not: they retire on a new event, `faced`, which
  is the player standing at `marks.secondJogEnd` and turned to look down the
  hallway on the other side of it.

  Both halves are derived. The place is the corner where the second jog
  rejoins the axis — the one `turnLead` deliberately skips, because turning
  back onto the axis is not a decision and gets no sign. The direction is the
  leg's own spine either side of that cell, so a path redrawn in the tool
  carries this with it. `TUTOR.facedDeg` is 40°, which is roughly the width of
  the corridor on a portrait phone: "the hallway fills the frame", not "the
  hallway is somewhere on screen".

  It is also the honest end of the lesson, which is `TUTORIAL-GOALS` goal 2:
  `DRAG TO LOOK` is satisfied by having looked, not by having walked
  somewhere. The three cells between the corner and the T are the screen
  handing the frame over with nothing on it, so what arrives next arrives
  alone.

  The divider moved from the step to the cues — a shape `tutorRenderCues`
  already supported — so it leaves with the words instead of hanging over an
  empty corridor all the way to the junction.

  One ordering trap, and it is why `tutorNext` asks before it emits `enter`
  rather than after: the joke's death puts the player back on the approach
  already facing the hallway and re-enters the step, so asking on the next
  frame instead painted both prompts for one frame and took them away again.
  `test/faced.mjs` holds all of it down, that case included.
- **The teaching leg grows a dead-end branch — investigated and fixed.**
  `genAuthoredLeg` already carries `extra` cells hung off the spine, which is
  the right mechanism. The problem was `tutorSpineIx`: a nearest-cell search
  over the whole path, which is right while the player is on it and silently
  wrong the moment they are not.

  Measured on a leg shaped like §5.1, walking three differently-shaped dead
  ends at real speed: a branch that turns back toward the route reported
  spine cell **26**, and one that hooks across it **28**, where the player had
  walked as far as **18**. Monotonic, so it never recovers, and nothing on
  screen says so — the lesson simply believes eight or ten cells of walking
  that never happened. A branch that turns *away* measured correctly, which
  is worse rather than better: it makes the bug depend on how somebody drew
  the corridor, and the tool lets anybody redraw it.

  The measure is now what its name always claimed. **It may advance one cell
  at a time, and only while the player is standing at that cell** (0.9 of a
  cell — above one they can claim the next from where they stand, below about
  0.6 a player cutting a bend can stall it). All three shapes now report
  exactly the cell walked to, and a walk of the whole route still reaches its
  last cell.

  A teleport cannot arrive by walking, so `tutorResyncSpineIx()` does the
  unclamped search at the three places that move the player without them
  going anywhere: a retry's anchor, the tool's step jump, and a new leg.
  `test/spine.mjs` holds the whole thing down.
- **`DRAG TO LOOK` timing.** The sequence says the look lesson arrives *at*
  the corner. The current build puts it two cells short, with a reason
  recorded in `marksFromPlan`: it has to be on screen before there is
  anything to look at, or the player is already mid-turn when it appears.
  Worth keeping the lead.

### 5.8 No way-out needle anywhere in the onboarding

Photographing the finished junction turned up the one thing that could defeat
the painted arrows. The needle points a few metres along the **walked path**,
and at the T the walked path is the left arm — the same arm `THIS WAY` names.
So the programme was answering the question the graffiti asks, and a player
never had to read either one.

The deeper cost is not the junction, it is the habit. A player taught to
follow a needle through lessons 1–3 has been taught that the writing on the
walls is decoration, and every painted message after this one inherits that.

So no step of the onboarding grants it. The corridor leads on its own here:
one route, one branch, and paint at the only place a choice exists — which is
also §9's rule, that a player who never reads a word should still reach the
door. The needle arrives once the onboarding is over, on the terms it always
had past that point: a hallway with nobody left in it, or a player who has
turned their back on the way out.

`way` stays in the grant list rather than being deleted. It is still a real
capability, the tool can still hand it to a step, and `wayArrowShows()` still
honours the old hand-off (retired by the SIGN, not by the step) for anything
that does. Nothing in the shipped sequence does. `test/faced.mjs` walks all
seven lessons and asserts the needle is down on every one of them; `wayback`
and `waydoor` still measure it at door 6, which is the other side of the same
rule.

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
