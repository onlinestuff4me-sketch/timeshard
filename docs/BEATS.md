# Teaching with the world

How the environment and floating world messages teach the core mechanics.

Story signs are deferred — see `docs/STORY.md`. This file is about goal ②:
**what do I do here.**

---

## 1. One message in focus. Ever.

> **The screen and the world are one channel, not two.**

`DRAG TO MOVE`, `DODGE THE BULLET`, `STAND HERE`, `GO TO THE NEXT DOOR` — the
game already works this way, and a sign on a wall does not get an exemption
just because it is in the world. Two instructions is two glances, and on a
portrait phone they are not even in different places: a sign painted high on a
corridor wall projects near the vanishing point, which is exactly where the
coach line sits. **Geometry puts them on top of each other**, so no amount of
tuning separates them — only not drawing both does.

Enforced in `tutorPlaceSign`: if any cue slot is showing, the sign waits.

### 1.1 A thumb message cannot leave the glass

> **A message about a CONTROL lives on the screen. A message about a PLACE can
> live in the world.**

That single line settles where everything goes:

| | example | where |
|---|---|---|
| **a thumb** | `DRAG TO MOVE`, `DRAG TO LOOK`, `TAP ANYWHERE TO SHOOT` | screen, always |
| **a place** | `STAND HERE`, `EXIT`, `GO THROUGH THE DOOR` | the world |

So the handoff is by lesson: **where a control is being taught, the screen
owns the frame. Once it is taught, the world speaks.**

### 1.2 A world message replaces a screen one, never joins it

This is the rule that makes the whole system pay for itself rather than
costing screen space.

| screen line | becomes | and gains |
|---|---|---|
| `GO THROUGH THE DOOR` | `EXIT` on the door | the building labels its doors |
| `GO TO THE BARRIER` | `STAND HERE` on the barrier | somebody painted this for you |
| `WALK OVER IT TO TAKE IT` | a label on the gun | it was dropped, not issued |
| `NO COVER · DO NOT STOP` | a stencil at the leg mouth | the building warns you |

**Every row does two jobs with one message** — the instruction the screen line
carried, plus a fact about the place that the screen line could never carry.
That is the answer to *how do these serve both goals at once*: not by adding
story text, but by moving instructions into objects.

### 1.2b A signpost is one message

`THIS WAY` / `NOT THIS WAY` on one wall at one junction is a signpost, not two
instructions — read together, as a road sign naming two destinations is. The
rule is about unrelated messages competing, and the constraint it carries is
geometric rather than editorial: both halves have to be in frame at once.
`docs/MARKS.md` §5.3.

### 1.3 What that leaves the tutorial

Two world messages, and both replace something:

| lesson | | |
|---|---|---|
| 1–3 move, look, corners | screen | thumbs are being taught |
| **4 stand here** | **world** | `STAND HERE` on the barrier *(already shipped)* |
| 5–6 dodge, shoot | screen | thumbs again, and a fight |
| **7 the door** | **world** | `EXIT` on the door, replacing `GO THROUGH THE DOOR` |

**No turn signs in the teaching leg.** The first build put them there and the
screenshots showed them landing on top of `DRAG TO MOVE`. `turnSigns: false`
on that leg; every leg past the onboarding has no coach text at all, which is
where they were always going to earn their keep.

---

## 2. Every core mechanic, checked against the rule

| mechanic | has a place? | what the environment does | world message |
|---|---|---|---|
| **Move** | yes — a destination | a long straight with no visible end: forward is the only option | `STAND HERE` at 20 m |
| **Look** | yes — around the corner | the corridor turns, and the sign is off-axis so you cannot read it without turning your head | `EXIT →` on the wall the turn faces |
| **Walk to a thing** | yes | the barrier stands there from the first frame | `STAND HERE` *(built)* |
| **Dodge** | yes — the spot out of the line | the corridor widens at this beat so a sidestep is visibly available | `STEP HERE` on the floor, **first dodge only** |
| **Shoot** | no — the target is a person | the enemy raises his arm before firing | none — stays on screen |
| **Take a gun** | yes — the gun on the floor | the drop magnetises when you are close | `TAKE IT` on the gun |
| **Go through the door** | yes | the barrier sinks, the door opens | `EXIT` above it |
| **Use cover** | yes — behind a pillar | a room with pillars and enemies on the far side | none — the room teaches it |
| **Headshot the armored** | no — a body part | the head is already bright red on a gunmetal body | none — already taught |
| **Slow time** | no — it is a button | the barrier and `STAND HERE` return, so the player knows to stop and read | none — the screen cue owns it |

Five mechanics get a world message. Five do not, and saying so is the point:
the ones that stay on screen are the ones with no place to stand.

---

## 3. The vocabulary

Three shapes, five strings.

| shape | strings | means |
|---|---|---|
| `<VERB> HERE` | `STAND HERE`, `STEP HERE` | put yourself on this spot |
| direction | `EXIT →` | the way out is this way |
| destination | `EXIT` | the way out is through here |
| object label | `TAKE IT` | pick this up |

`STAND HERE` and `STEP HERE` rhyming is deliberate — a player who learned the
first in lesson 1 reads the second in lesson 5 without thinking about it.

---

## 4. What each one replaces

| new world message | screen text it removes |
|---|---|
| `EXIT` above the door | `GO TO THE NEXT DOOR` |
| `EXIT →` at the turns | the way-out needle, for the whole tutorial |
| `TAKE IT` on the gun | the `WALK OVER IT TO TAKE IT` banner |
| `STEP HERE` | nothing — it joins `DODGE THE ROUNDS`, then both go |
| `STAND HERE` at 20 m | nothing — it gives `DRAG TO MOVE` a target it did not have |

Net effect: two screen strings and one HUD element removed, two added to the
world, and every lesson gains a visible destination.

---

## 5. The two that need geometry, not text

**The dodge corridor widens.** The teaching leg is one cell wide. A sidestep
of 0.85 m in a four-metre corridor is possible but does not *look* possible,
and the beat is asking a first-time player to invent a movement under
pressure. Widening this stretch to three cells makes the sideways room
obvious before `STEP HERE` names it. This is the single most valuable change
in the document, because it fixes a lesson rather than labelling one.

**The first corner comes with a reason to look.** A sign placed on the wall
the turn faces cannot be read without turning the head — so `DRAG TO LOOK` is
not an instruction the player takes on trust, it is the only way to find out
where they are going.

---

## 6. `STEP HERE` appears once

On the first of three dodges, and never again. Dodges two and three have no
mark.

Otherwise the lesson teaches *go to the painted spot* instead of *get out of
the line*, and the mark becomes a crutch the real game never provides. Teach
with it, then take it away while the player is still in the room.

---

## 7. Build order

0. **The T-junction** (`docs/MARKS.md` §5) — the destination problem is
   answered by a decision rather than a marker, and it plants the arrow
   pattern Hale reuses for the rest of the game. This is now the first item.
   *Geometry, paint and the joke are built* — the T, the two warnings, the
   man with his arm already up, and the death that has no retry screen. One
   piece is not: lesson 3's prompts still run to the last corner, so
   `DRAG TO MOVE` sits across `THIS WAY` at the junction. See
   `docs/MARKS.md` §5.7, first bullet.
1. ~~**`STAND HERE` at 20 m**~~ — **cut.** On the shipped path the opening
   straight is five cells, so twenty metres *is* the first corner: an
   authored `STAND HERE` there would have stood two cells from the turn sign
   and broken the one-at-a-time rule. It also had nothing to do — the beat
   that makes standing there matter is the corridor reconfiguring, and that
   is not built. A sign naming a place where nothing happens is the one kind
   this system cannot afford. `STAND HERE` stays on the barrier.
2. **`EXIT ◀` at the turns** — *built.* Derived from `marks.turnLead`, one per
   change of direction, hung on the wall the turn faces. This is what gives
   lesson 1 its destination, and it does it better than the cut item: it is
   twenty metres away, legible from the first frame, and reaching it does
   something.
3. **`EXIT` above the door** — *built.* Anchored to the last cell of the
   walked path.
4. **Widen the dodge stretch**, then add `STEP HERE` to the first dodge.
5. **`TAKE IT` on dropped guns.**

---

## 8. Not doing

- A world message for a mechanic with no place — see the five "none" rows.
- A message that adds to a screen cue instead of replacing one.
- Any message that stays up after the mechanic has been performed once.
- Marking cover, or the armored head. The room and the model already do it.
