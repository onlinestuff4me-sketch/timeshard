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
| **Dodge** | yes — the spot out of the line | the corridor widens at this beat so a sidestep is visibly available | none — the room teaches it |
| **Shoot** | no — the target is a person | the enemy raises his arm before firing | none — stays on screen |
| **Take a gun** | yes — the gun on the floor | the drop magnetises when you are close | `TAKE IT` on the gun |
| **Go through the door** | yes | the barrier sinks, the door opens | `EXIT` above it |
| **Use cover** | yes — behind a pillar | a room with pillars and enemies on the far side | none — the room teaches it |
| **Headshot the armored** | no — a body part | the head is already bright red on a gunmetal body | none — already taught |
| **Slow time** | no — it is a button | the barrier and `STAND HERE` return, so the player knows to stop and read | none — the screen cue owns it |

Four mechanics get a world message. Six do not, and saying so is the point:
the ones that stay on screen are the ones with no place to stand — plus the
dodge, which has a place and gets geometry instead of a label. See §6.

---

## 3. The vocabulary

Three shapes, four strings.

| shape | strings | means |
|---|---|---|
| `<VERB> HERE` | `STAND HERE` | put yourself on this spot |
| direction | `EXIT →` | the way out is this way |
| destination | `EXIT` | the way out is through here |
| object label | `TAKE IT` | pick this up |

`STEP HERE` used to be the second string in the first row, rhyming with
`STAND HERE` on purpose. It is cut — see §6.

---

## 4. What each one replaces

| new world message | screen text it removes |
|---|---|
| `EXIT` above the door | `GO TO THE NEXT DOOR` |
| *(nothing — the geometry leads)* | the way-out needle, for the whole tutorial |
| `TAKE IT` on the gun | the `WALK OVER IT TO TAKE IT` banner |
| `STAND HERE` at 20 m | nothing — it gives `DRAG TO MOVE` a target it did not have |

Net effect: two screen strings and one HUD element removed, two added to the
world.

The needle's row is the one that changed shape. `EXIT →` at the turns was
going to replace it, and on the teaching leg it does not: turn signs are off
there (§1 — the screen owns the frame while a control is being taught), so
lessons 1–3 have no destination marker at all. That is deliberate. The
teaching leg is one route with one branch, so the corridor itself leads, and
the first thing the player is ever asked to *read* is Hale's signpost at the
junction. See `docs/MARKS.md` §5.8.

---

## 5. The two that need geometry, not text

**The dodge corridor widens — built.** The teaching leg was one cell wide. A
sidestep of 0.85 m in a four-metre corridor is possible but does not *look*
possible, and the beat was asking a first-time player to invent a movement
under pressure. The stretch running up to the barrier is now three cells
across.

Measured on the beat itself, at the moment the world freezes with the round in
the air: clearing the lane takes **0.76 m** of sideways movement, and the room
either side went from **1.5 m to 5.5 m**. The step the beat asks for was 57%
of the floor available to make it in; it is now 15%. A first-timer swiping in
a panic used to end up against masonry.

**What it costs, honestly.** `tutorBuildBarrier` sizes the slab to the row it
stands in, so a three-cell room means a 13.2 m barrier. Photographed from the
last corner that is the point — the corridor visibly opens out into a space
with something across it, which is the "obvious before anything names it" this
section asked for. Photographed from two cells short it is not: the side walls
have left the frame, the barrier runs off both edges, and it reads as a wall
rather than as an object standing in a room. The width is legible at distance
and invisible up close, which on a 42° horizontal frame is what `PILLARS` §5
means by *width is the axis the screen doesn't have*.

The open follow-up is whether the barrier should stop being full-width — a
parapet with visible ends, standing in a room the player can see past, rather
than a wall spanning it. That would put the sideways room in the middle of the
picture where the frame can see it, and it would make the tutorial's first
piece of cover behave like every other piece of cover in the game. It also
means the player can walk around it, which changes what lesson 4 is asking,
so it is a decision rather than a tidy-up.

**The first corner comes with a reason to look.** A sign placed on the wall
the turn faces cannot be read without turning the head — so `DRAG TO LOOK` is
not an instruction the player takes on trust, it is the only way to find out
where they are going.

---

## 6. `STEP HERE` is cut

It was going to appear on the floor at the spot out of the round's line, on
the first of three dodges and never again — floating world UI in the same
register as `STAND HERE`, and rhyming with it on purpose.

Two reasons it is not being built.

**The screen already owns that frame, and should.** During the freeze the
player has `DODGE THE BULLET` and a swipe hand under it. §1.2 says a world
message replaces a screen one rather than joining it, so `STEP HERE` would
have had to take the frame — and the swipe hand is the only place in the game
that shows a first-time player *how* to sidestep. Trading the control lesson
for a destination label is the wrong way round.

**And a mark is less clear than a hand here.** `STAND HERE` works because it
names a fixture that is standing there whether or not you are looking at it.
A dodge target is a spot on empty floor that exists for one second and is
different every round; naming it teaches *go to the painted spot* rather than
*get out of the line*, which is a crutch the real game never provides.

The geometry does the work instead. §5's widening is what makes the sidestep
available; nothing labels it.

---

## 7. Build order

0. **The T-junction** (`docs/MARKS.md` §5) — the destination problem is
   answered by a decision rather than a marker, and it plants the arrow
   pattern Hale reuses for the rest of the game. This is now the first item.
   *Built* — the T, the two warnings, the man with his arm already up, the
   death that has no retry screen, and the handover: lesson 3's prompts and
   the divider retire when the player turns to look down the hallway, three
   cells before the junction, so Hale's signpost arrives on an empty screen.
   `docs/MARKS.md` §5.5 and §5.7.
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
4. ~~**Widen the dodge stretch**, then add `STEP HERE` to the first dodge.~~
   The widening is *built* (§5). `STEP HERE` is *cut* (§6).
5. **`TAKE IT` on dropped guns.**

---

## 8. Not doing

- A world message for a mechanic with no place — see the five "none" rows.
- A message that adds to a screen cue instead of replacing one.
- Any message that stays up after the mechanic has been performed once.
- Marking cover, or the armored head. The room and the model already do it.
