# The beat map

Every environmental-storytelling opportunity in the game, in the order a
player meets it, against three experience goals:

| | goal | the player's question |
|---|---|---|
| **①** | **go** | where am I supposed to be going? |
| **②** | **do** | what do I do with my thumbs? |
| **③** | **why** | what is this place, and why should I keep walking into it? |

`docs/STORY.md` is what the story is. `docs/MARKS.md` is the system that
paints the signs. **This file is the map of moments** — what goes where, what
each one is for, and what it costs.

---

## 1. Three laws

### 1.1 A beat that only serves ③ may cost world space, never screen time

Lore that interrupts is lore that gets skipped, and then resented. A dropped
rifle on the floor of a corridor costs nothing — the player walks past it or
does not. A card in the middle of the screen explaining the rifle costs the
two seconds in which somebody was about to shoot them.

So: **③ can occupy a wall, a floor, a body, or a menu the player chose to
open. It cannot occupy a cue slot, a banner, or an input.**

### 1.2 The beats worth building serve two goals with one object

This is the ranking rule for everything below. `EXIT ▶ 8` painted on a
corridor wall tells the player which way to walk **and** tells them there is
an exit, that they are trying to reach it, and that there are eight of
something between here and there. One object, ① and ③, no screen time, no
second system.

A sign that only points is wayfinding. A sign that only hints is set dressing.
The map is sorted so that the two-goal beats come first, because they are the
ones that pay for themselves.

### 1.3 Every beat is ignorable

A player who reads nothing must still reach the door. That means the geometry
leads and the marks only make it faster — never the reverse. It is also the
test that keeps the system honest: if a beat cannot be removed without
breaking navigation, it was not a story beat, it was a dependency.

---

## 2. The coverage problem, stated up front

The playtest complaint is not *"the story is thin."* It is:

> *why am I here · why am I in this tunnel · who are these enemies · why is
> there a tutorial · why should I keep playing*

Every one of those is a ③ question, and they were asked **about the opening**.
A story that begins paying out at door 20 does not answer them, because the
players who asked are the players who did not get to door 20.

**So ③ has to land inside the first thirty seconds, before a shot is fired.**
Two beats do it — the first sign, and the reconfiguration — and everything
else in this document is a follow-through on those two. If only two things
from this map are ever built, build those.

---

## 3. Stage 0 — before the corridor

| # | beat | what the player gets | goals | cost |
|---|---|---|---|---|
| 0.1 | **Save slots are trials** | `CONTINUE · TRIAL 3 · DOOR 12` | ③ | one string in a row that already renders a save name and a door |
| 0.2 | **A death is an instance concluded** | the stats line reads `TRIAL 3 CONCLUDED` above the doors and the shattered count | ③ | one line on a screen that already exists |

**0.2 is a retention beat, not a lore beat.** The death screen currently
states a fact (`14 DOORS · 31 SHATTERED`) and offers `RETRY FROM LAST DOOR`.
Reframing the loss as an iteration is the cheapest possible answer to *why
should I keep playing* — you are not failing repeatedly, you are the
hundred-and-eighteenth attempt at something, and that is a different feeling
for the price of one word.

It also seeds the Act III reveal for free: a player who has watched their own
trial counter climb to 6 is set up for the fragment that quotes trial 117.

---

## 4. Stage 1 — the tutorial

This is where ① and ② are dense and where ③ has to get its hook in. Seven
beats, in order, mapped onto the existing lesson plan.

| # | beat | where | goals | cost |
|---|---|---|---|---|
| 1.1 | **`EXIT ▶ 8`** on the side wall beside where you wake | first frame, before any input | ①③ | one mark |
| 1.2 | **`INDUCTION`** stencilled on the opposite wall | first frame | ③ | one mark, one word |
| 1.3 | **`STAND HERE`** at 20 m | lesson 1, `DRAG TO MOVE` | ①② | one mark |
| 1.4 | **The reconfiguration** | on arrival at 1.3 | ③ | `docs/MARKS.md` §5.3–5.5 |
| 1.5 | **`EXIT TO THE LEFT`** | lesson 2, `DRAG TO LOOK` | ①② | one mark |
| 1.6 | **`EXIT TO THE RIGHT`** | lesson 3, corners | ①② | one mark |
| 1.7 | **`STAND HERE`** on the barrier | lesson 4 | ① | **already built** |
| 1.8 | **Designations on the bodies** | lesson 5, the first gunner | ③ | a texture |
| 1.9 | **`EXIT ▶ 7`** on the tutorial's door | lesson 7 | ①③ | the count, decremented |

### 1.1 + 1.2 — the first frame answers three questions with two signs

`EXIT ▶ 8` answers *what do I do* (walk that way), *why am I here* (I am
getting out) and *how far* (eight of something). `INDUCTION` answers *why is
there a tutorial* — because this is one, and buildings induct people.

Both are legible before the player has touched the screen, and neither is a
prompt, an overlay, or a thing that fades. This is the whole of the playtest
complaint's opening answered by two pieces of architecture.

It also does something `TUTORIAL-GOALS` §3 will approve of: the opening
corridor stays as empty as that goal demands. A sign is not an obstacle, an
enemy, or a HUD element.

### 1.3 — the mark gives `DRAG TO MOVE` a destination

Lesson 1 currently ends *"a couple of cells short of the corner"* — a place
the player cannot see when the lesson starts. A visible target twenty metres
away is strictly better teaching: goal 4 of `TUTORIAL-GOALS` is *only progress
on success*, and success is far easier to pursue when it is on screen.

### 1.4 — the hook, at second twenty-five

The player did exactly as they were told, and the corridor they were promised
turned out not to be the corridor they got.

**No words.** This is the beat that makes *why should I keep playing* answer
itself, and it is the only one in the document that cannot be delivered by a
sign — which is why it is worth its cost. Everything in Act II
(`docs/STORY.md` §2.1) is a callback to it.

### 1.5 — the corner is why looking matters

`DRAG TO LOOK` arrives on the reconfiguration, mid-straight, so it is still
taught as a simultaneous separate axis (which is the current design's whole
point, and `docs/MARKS.md` §5.6 argues about it properly). The turn is where
it gets *used*. Taught on the straight, paid off at the corner.

### 1.8 — who these enemies are, without a word

`src/protocols.js` already answers it: *Compliant. Armed. The building has
many.* That sentence is currently readable only in a menu.

**Stencil a designation on the bodies.** `E-04`, on the chest or the back, in
the building's own type. It costs one texture, occupies no screen space, and
says these are inventory rather than people — which is the answer to *who are
these enemies* and is considerably more chilling than a memo about it. A shard
with a number on it lands on the floor when they shatter.

---

## 5. Stage 2 — the three training areas

The teaching is over; the only words left are one `TAP ANYWHERE TO SHOOT` per
area. Two beats, both nearly free.

| # | beat | goals | cost |
|---|---|---|---|
| 2.1 | **The count descends on each door** — `EXIT ▶ 6`, `5`, `4` | ①③ | the table |
| 2.2 | **`TRAINING COMPLETE` becomes `INDUCTION COMPLETE`** | ③ | one word |

**2.2 is the best value in this document.** That banner already exists, already
fires at the right moment, and already carries `GO TO THE NEXT DOOR`
underneath it, which is doing ①. Changing one word recasts the entire
tutorial, retroactively, as something *the building did to the player* rather
than something the game did to them — and it ties back to the `INDUCTION`
stencil they walked past ninety seconds earlier.

One word, no new system, no screen time, and it converts a piece of UI into a
piece of world.

---

## 6. Stage 3 — doors 1–10, the honest building

The building is helpful and consistent here, and that is the point: this is
the deposit that Act II spends. See `docs/MARKS.md` §2.1.

| # | beat | goals | cost |
|---|---|---|---|
| 3.1 | **`EXIT ▶ N` on every approach**, counting down honestly | ①③ | the mark painter |
| 3.2 | **`L-06 · P-31` beside each door** | ③ | strings the composer already computes |
| 3.3 | **`LEG_HEADLINES` move onto the walls** | ①②③ | see below |
| 3.4 | **A dropped rifle, empty**, in one leg | ③ | placement only |

### 3.3 — the single biggest change to the rest of the game

`LEG_HEADLINES` is a table of centre-screen cards shown for two seconds:
`NO COVER · DO NOT STOP`, `GRINDER · KEEP MOVING`, `IT SEALS BEHIND YOU`,
`THEY COME THROUGH THE WALLS`.

Every one of those is better stencilled at the mouth of the leg:

- **②** — `DO NOT STOP` and `KEEP MOVING` are control instructions, and they
  are on screen for two seconds in the middle of a fight they are about
- **①** — a stencil at the mouth of a leg is also a marker of where the leg
  begins
- **③** — a card is the UI talking; a stencil is the building talking
- it persists instead of timing out, which is `TUTORIAL-GOALS` goal 2's exact
  complaint about prompts, applied to the rest of the game
- it is where the player is already looking, rather than over the top of it

And the two rows that table deliberately has **no** headline for — `dimStrips`
and `vault` — stay silent, for the reason recorded there: *"a card telling the
player what they are already looking at is a card in the way of it."* The
discipline transfers with the content.

---

## 7. Stage 4 — doors 11–30, the building stops agreeing with itself

Nothing here is announced. Every beat is something the player catches.

| # | beat | goals | cost |
|---|---|---|---|
| 4.1 | **The count stalls** — two doors both say `EXIT ▶ 2` | ①③ | one lookup-table entry |
| 4.2 | **The count goes back up** | ①③ | same table |
| 4.3 | **A leg designation repeats** — `L-14`, four doors apart | ③ | a string |
| 4.4 | **The scrawl** — `don't follow the arrows` | ③ | a second register in the mark painter |
| 4.5 | **Evidence of a previous walker** — debris already on the floor when you enter | ③ | placement, existing debris |
| 4.6 | **The reconfiguration returns**, mid-leg, unasked | ③ | already built at 1.4 |

**4.1 is the whole hook for one table entry.** The player has followed a
descending number for twenty minutes. It stops descending. Nobody mentions it.
Catching the building in a lie is worth more than any amount of being told
about one, and it is available for the price of an authored array — which is
why `docs/MARKS.md` §7 insists the counts are authored and never computed: a
player has to be able to *check*, and a random number cannot be checked.

**4.4 is the payoff on the coach messages.** The player has been reading
unattributed help since the first corridor and has been grateful for it. The
same register now turns up inside the world, in handwriting, contradicting the
signs. Nobody says *the voice that was helping you is in here too.* They work
it out. It is also safe: there is only ever one way forward, so a scrawl that
argues with a sign can never actually strand anybody.

**4.6 is why 1.4 was worth building.** A grammar established in second
twenty-five, spent again at door 22, when the player now has somewhere to put
it.

---

## 8. Stage 5 — door 30 and down

| # | beat | goals | cost |
|---|---|---|---|
| 5.1 | **The marks stop addressing you** — `SUBJECT 4409 · TRIAL 118 · RESPONSE NOMINAL` | ③ | strings |
| 5.2 | **The man who does not raise his arm** | ③ | *removing* behaviour |
| 5.3 | **The window on a city that rhymes** | ③ | a hole in a wall |
| 5.4 | **A mark that lies about the ground** — one late `STAND HERE`, once | ①③ | placement |

**5.2 says what these people are using only the game's own grammar.** The
entire combat language is *watch the arm come back*. A man who never does it
is the loudest possible statement, and it is built by taking code away. You
may shatter him or walk past; neither is punished, and that is the point.

**5.3 is free.** `src/main.js:529` — *"the city tiles from a 3x3 set of UNIQUE
block designs, so the pattern only repeats every PERIOD metres."* The city
already repeats. Look out, walk to the far end of the leg, look again, and you
see the same block. The most convincing evidence that the world is a
reconstruction is a rendering optimisation that shipped for framerate reasons.

**5.4 is the deepest cut and must be spent once.** Standing still is how you
survive this game. A `STAND HERE` that puts you in a firing line is fair only
if the corridor is readable at that moment — and it should never happen twice.

---

## 9. Stage 6 — between runs

| # | beat | goals | cost |
|---|---|---|---|
| 6.1 | **Fragments on personal-record doors** | ③ | `TUNNEL_META` §2c, already specified |
| 6.2 | **UNLOCKS blanks as the to-do list** | ③ | **already shipped** |
| 6.3 | **`+2 FILED TO UNLOCKS` on the death screen** | ③ | **already shipped** |

This is the only place long-form text is allowed, because it is the only
place where reading is the activity the player chose. §1.1 is not relaxed for
it — it is satisfied by it.

---

## 10. If you build five things

Ranked by answered-question per unit of work, not by order of appearance:

1. **1.1 `EXIT ▶ 8`** — answers *why am I here* and *which way* on the first
   frame, with one object.
2. **2.2 `INDUCTION COMPLETE`** — one word, recasts the whole tutorial.
3. **3.3 the headlines onto the walls** — the biggest single improvement to
   the rest of the game, and independent of everything else here.
4. **1.4 the reconfiguration** — the hook, and the grammar 4.6 spends later.
5. **4.1 the count stalls** — one table entry, and it is the reason to reach
   door 20.

Items 1, 2 and 5 are strings and a table. Item 3 is a migration of content
that already exists. Only item 4 is a new mechanic.

---

## 11. What is deliberately not on this map

- **An opening text crawl.** The player wakes with no memory; so does the
  player. Explaining in advance throws away the only narrative alignment this
  premise gets for free.
- **A ③ beat inside a lesson's cue slot.** `TUTORIAL-GOALS` §3 forbids it and
  §1.1 above forbids it again. If a story beat can only be delivered in a cue
  slot, it does not ship.
- **Anything that pauses.** The reconfiguration is under a second and is the
  only interruption in the document.
- **A collectible.** Every beat here is walked past, not picked up. The moment
  a story object needs an input it is competing with the trigger.
- **A second count that means something different.** There is one number on
  the walls, it is the exit count, and it lies exactly once and then keeps
  lying. Two numbers is a puzzle nobody asked for.
