# NO RETREAT — how the fight scales

> **THE MODE IS CALLED NO RETREAT. Its id is `duel`.** It shipped as CORRIDOR
> DUEL and both words were wrong; the id is a save key, so it stays `duel` for
> ever and every symbol in the source keeps that word — `SIMPLE.duel`,
> `duelPlan`, `duelmeet.mjs`, this file's old name `docs/DUEL.md`. **Reading
> `duel` in code and saying NO RETREAT to a player is correct, not a leftover.**

**Where everything is**

| what | where |
|---|---|
| the dials | `SIMPLE.duel` in `src/balance.js` |
| the walk that reads them | `duelPlan()` in `src/main.js` |
| who is in a room | `duelQueue()`, called from `hallWave()` |
| how close they may come | `duelHold()` |
| the shot clock | `duelMayFire()` / `duelTookShot()` / `shotGap()` |
| the debut cards | `duelNoteMeet()`, `duelMeetCard()`, `duelPlaceMeetPins()` |
| generated tables | `docs/BALANCE.md` → *NO RETREAT — the three dials* |
| the schedule, checked | `test/duelramp.mjs` |
| the debut cards, checked | `test/duelmeet.mjs` |
| the room-1 lesson, checked | `test/duelschool.mjs` |
| speed and range | `SIMPLE.duel.bullet` / `.engage`, read by `duelBulletSpeed()` / `duelEngageCap()` |
| the button and its bank | `test/duelbtn.mjs` |
| the published plan page | https://claude.ai/code/artifact/252766fc-7ae3-41bc-aace-d6d3c2defde1 |

They come to you. You hold your end of a strip you cannot walk down, drag to
sidestep, tap to shatter, and the corridor carries you through the door once
the room is dead.

Three dials ramp, and **only one of them moves per room**:

| dial | what it is | where it lives |
|---|---|---|
| **BODIES** | how many men, as groups that ascend within the room | `SIMPLE.duel.groups` |
| **FIRE** | how many shoot together, and how long the room waits after | `SIMPLE.duel.fire` |
| **CAST** | which types are in the mix | `SIMPLE.duel.cast` |

The schedule is **walked forward from room 1 rather than solved** (`duelPlan`),
because the rule *is* a walk: bodies and fire take it in turns, and a new type
steps both of them back. There is no closed form for that, and inventing one
would be a second description of the same thing, free to drift from it.

Everything in the table below is read out of the running game by
`test/duelramp.mjs`, which also checks that the guns do what it says.

## The arena

A straight strip, **24 m long and three cells (12 m) wide**, with the door at
the far end. There is no forward control, so the strip is an arena rather than
a journey; the corridor walks you out at 6.5 m/s once the floor is clear
(`SIMPLE.duel.walkSpeed`). The drag's forward half is dropped rather than
clamped, so a diagonal thumb still sidesteps cleanly.

Nobody may be placed closer than the **first-sight floor** — 13 m at these
depths — so everything arrives in the far half and walks in.

## How fast, and how close

**Measured, standing in the opening rooms and holding still:** rounds at
5.4 m/s, men at a median of **19 m**, and never more than **one** firing at a
time all the way to the button. A round fired from twenty metres at 5.4 m/s is
in the air for **three and three quarter seconds**.

The cause was inheritance, not a number anybody chose. Bullet speed came off
the tunnel's staircase (`SPEED`), written for a forty-six door climb; engage
distance came off the shared default of 19–25 m, written for a corridor you
walk down and take cover in. This mode is thirty-one rooms long and has
neither. So it keeps its own:

| | was | is | measured after |
|---|---|---|---|
| bullet, room 1 | 5.4 m/s | `bullet.openM` 7.0 | 2.1 s of flight |
| bullet, room 6 | 5.4 m/s | +`stepM` 0.62 a room | 10.1 m/s, **1.2 s** |
| bullet, ceiling | 6.2 by room 12 | `capM` 13.5 | room 11 at 13.2 |
| they stand at | 19.2 m | `engage` 15 → 9.5 by room 10 | 14.3 m → 7.0 m |
| firing together at the button | **1** | fire dial reaches 2 by room 5 | **2** |

`engage` is a **cap on a type's own engage distance**, not a replacement — a
shotgunner still opens at its own ten metres, and a gunner stops being able to
plink from the far wall. Bodies are placed past the 13 m first-sight floor, so
at these numbers the back rank has to walk in before it may fire at all, which
is the closing-in the mode was missing.

The telegraph rides the same staircase (`diffT`), so a mode with its own
speeds does not keep the tunnel's reaction times.

## The room-1 lesson

Two beats, in the order the mode needs them, and **the player arrives with no
weapon on screen** — a gun in frame is an invitation to use it, and the first
thing this mode has to say is that a round is coming and you move.

1. **DODGE THIS.** The first round anyone fires stops the world the way a
   debut does, rings the round, and shows a thumb crossing the stick. Stepping
   aside answers it.
2. **TAP HERE TO SHOOT.** The world starts again, the pistol arrives, a man
   gets a ring and a thumb presses on his chest — in this mode a shot goes
   where the thumb went, so the cue is on the *body*, not on the stick. Firing
   puts both away.

**It is said twice at most** (`SIMPLE.duel.teach`), and the second time has to
be earned by missing it: a round that got `lateAt` (half way) to the player
while they stood in its lane, or a whole room crossed without a body
shattered. Past that it is nagging somebody who is playing.

**How close they get: 2.6 m** (`SIMPLE.duel.holdM`), measured from where you
stand. That number sits between two others. A man inside **1.5 m** switches to
melee and stops shooting; a rusher plants and lunges at **3.4 m**. Held at the
tunnel's own line — the door approach, eight metres out — the rusher never
arrives at all: measured, the nearest one ever got to a standing player was
7.89 m, and its debut froze on a tell it was never going to give. Removed
entirely, two of five bodies ended up stood on the player swinging, and a room
scheduled to fire three together fired two.

## The schedule, as the game reads it out

| room | groups | bodies | fire together | gap | cast |
|---|---|---|---|---|---|
| 1 | 1·2·2 | 5 | 1 | 4.3 s | gunner |
| 2 | 2·2·3 | 7 | 1 | 4.3 s | gunner |
| 3 | 2·2·3 | 7 | 1 | 3.3 s | gunner |
| 4 | 2·3·3 | 8 | 1 | 3.3 s | gunner |
| 5 | 2·3·3 | 8 | 1 | 2.3 s | gunner |
| 6 | 3·3·4 | 10 | 1 | 2.3 s | gunner — **the time button arrives** |
| 7 | 3·3·4 | 10 | 1 | 3.3 s | **+ shotgunner** |
| 8 | 3·3·4 | 10 | 1 | 2.3 s | gunner, shotgunner |
| 9 | 3·4·4 | 11 | 1 | 2.3 s | gunner, shotgunner |
| 10 | 3·4·4 | 11 | 2 | 4.3 s | gunner, shotgunner |
| 11 | 3·4·4 | 11 | 1 | 2.3 s | **+ rusher** |
| 12 | 4·4·5 | 13 | 1 | 2.3 s | gunner, rusher |
| 13 | 4·4·5 | 13 | 2 | 4.3 s | gunner, rusher |
| 14 | 4·5·5 | 14 | 2 | 4.3 s | gunner, rusher |
| 15 | 4·5·5 | 14 | 2 | 4.3 s | **combination**: shotgunner + rusher |
| 16 | 4·5·5 | 14 | 2 | 4.3 s | **combination**: shotgunner + rusher |
| 17 | 4·5·5 | 14 | 2 | 4.3 s | **combination**: shotgunner + rusher |
| 18 | 4·5·5 | 14 | 1 | 2.3 s | **+ shieldbearer** |
| 19 | 4·5·5 | 14 | 2 | 4.3 s | gunner, shieldbearer |
| 20 | 5·5·5 | 15 | 2 | 4.3 s | gunner, shieldbearer |
| 21 | 5·5·5 | 15 | 2 | 3.3 s | gunner, shieldbearer |
| 22 | 5·5·5 | 15 | 2 | 3.3 s | **combination**: shotgunner + rusher + shieldbearer |
| 23 | 5·5·5 | 15 | 2 | 3.3 s | **combination**: shotgunner + rusher + shieldbearer |
| 24 | 5·5·5 | 15 | 2 | 4.3 s | **+ armored** |
| 25 | 5·5·5 | 15 | 2 | 3.3 s | gunner, armored |
| 26 | 5·5·5 | 15 | 2 | 2.3 s | gunner, armored |
| 27 | 5·5·5 | 15 | 3 | 4.3 s | gunner, armored |
| 28 | 5·5·5 | 15 | 2 | 2.3 s | **+ heavy** |
| 29 | 5·5·5 | 15 | 3 | 4.3 s | gunner, heavy |
| 30 | 5·5·5 | 15 | 3 | 3.3 s | gunner, heavy |
| 31 | 5·5·5 | 15 | 3 | 2.3 s | gunner, heavy — **both dials are now at their ceiling** |
| 32–33 | 5·5·5 | 15 | 3 | 2.3 s | **combination**: rusher + shieldbearer + armored |
| 34–35 | 5·5·5 | 15 | 3 | 2.3 s | **combination**: shotgunner + armored + heavy |
| 36 on | 5·5·5 | 15 | 3 | 2.3 s | the whole roster, at maximum |

Peak bodies of each cycle: **10 → 11 → 14 → 15**, and then the bodies table has
no step left to take. **The ramp tops out in room 31** — five to a group and
three firing together are both ceilings somebody chose — and from there the
mode is at maximum with only the cast changing. That is a design fact, not a
curve that gave up: `test/duelramp.mjs` knows about it and stops asking for a
climb once both tables have run out of steps.

`groups` is a list and stays a list. Three, then three, then four is a room
that ends on its biggest fight; four, four, two is the same ten men arriving in
the wrong order. Everywhere else the encounter list only sets a leg's total and
the groups are re-derived per stretch, which is fine in a corridor you walk
down — here the room *is* the fight, so `hall.duelGroups` survives as written.

## What each dial does

**BODIES** climbs 1·2·2 → 5·5·5 through `SIMPLE.duel.groups`, capped at
`encCap: 5`. Five is the ceiling on one group, not on the room.

**FIRE** is a pair: how many fire as one event, and how long the room then
waits. It runs 1 every 4.3 s → 1 every 2.3 s → **2** every 4.3 s → 2 every
2.3 s → **3** every 4.3 s. Tighten three times, then add a gun and reset the
clock. A volley is measured from its **start**, not from its last round, so two
men firing together cost the room one turn rather than two
(`duelVolleyAt`/`duelVolleyN`), and the join window is derived —
`volleyStep * volley + volleySlack` — because a fixed 0.18 s window fitted two
rounds and not three, so triples quietly fired pairs.

**CAST** introduces one type at a time. A debut arrives **alone**: gunners fill
every other slot, and the room is made quieter than the one just cleared — the
**fire** dial steps back by `typeDrop: 1`. It then has the rest of its cycle
(`rampRooms: 3`, so four rooms in all) before the next type. Types that have
each had a cycle **meet** for a short interlude (`hold`) with every other dial
frozen, because there the pairing is what is new.

**Why the fire dial and not both.** It used to step bodies back as well. That
is affordable on a six-room cycle and is not on a four-room one: three moves a
cycle, two of them spent climbing back to where the last cycle ended, and the
peaks came out 10, 10, 11, 11 — a ramp that is a flat line with debuts drawn
on it. `test/duelramp.mjs` said so, which is exactly what that check is for.
Fire is the one worth spending it on: bodies decide how crowded the room
*looks*, the shared clock decides how much is coming **at** you, and a player
being shown a new silhouette needs the beats between rounds more than they
need one fewer man at the back.

**Why cycles are four rooms.** They were six, and the whole cast did not arrive
until room 44 — armored, the type whose entire lesson is *body shots bounce,
aim high*, was thirty-seven rooms in, which is a type most players would never
meet. Four-room cycles put the last debut at 28.

`duelQueue` builds the room group by group: each group leads with the types the
room is about, then gunners fill it out, and **at least one gunner stays in
every group** — the shot clock is carried by whoever can actually pull a
trigger, so a room with no gunners in it fires fewer rounds together than its
own schedule says. The types **rotate across the groups**, so a deep room
carrying the whole roster still shows all of it; taking the first few every
time would drop the tail of that list silently.

That composition is what guarantees the new type is on the floor and at the
front of it in the room that debuts it — which is what the freeze needs to land
on. Before it, a debut room was composed from the TUNNEL's introduction table:
the roster let a shotgunner in and no code ever put one in the queue, so room 7
filled with gunners and the debut never happened. An empty permission.

## Meeting a new type

**It is the onboarding's dodge beat, with a name on top.** The world stops the
way the lesson stops it — `TUTOR.holdEase`, eased rather than snapped — and
three rows fill the still screen:

| row | what it is |
|---|---|
| the **NAME** | the type the game announces doors in, outlined in red |
| the **instruction** | two words, in the onboarding's own light ink |
| the **thumb** | the coach disc from that lesson, doing the thing the words ask |

...and **a ring round the thing the words mean**, the same one the onboarding
draws on the round it tells you to dodge. *Dodge this* is not an instruction
unless the player can find **this**: a shotgun pellet at fourteen metres is
four pixels. The ring is sized from the world — a head is a head, a body is a
body — with a floor so it is always findable and a ceiling so it stays a ring
rather than a vignette.

| type | it says | the ring is on | what answers it |
|---|---|---|---|
| shotgunner | DODGE THIS | every pellet of the blast, all five | a sidestep |
| heavy | DODGE THIS | the round it just fired | a sidestep |
| rusher | DODGE THIS | **its body** — it has no round, it *is* the round | a sidestep |
| armored | **SHOOT THIS** | the exposed head, the sphere the hit test uses | **a shot** |
| shieldbearer | STOP TIME · GET ROUND HIM | the plate that is in the way | a sidestep |

**What the card asks for is what releases it.** A card released by something
else is a card nobody has to read. So DODGE goes on the sidestep — the
onboarding's own rule, `TUTOR.dodgeStepM` measured from where you stood when
it stopped — and SHOOT goes when you pull the trigger. The third row follows:
a swipe under DODGE, a press under SHOOT, because the gesture *is* the
instruction and so it may not be the wrong gesture.

**The shieldbearer is the one a sidestep does not answer on its own.** He
turns to follow you, so stepping off his line at full speed only buys him the
beat he needs to come round. His card holds the time button lit while it says
so — its own `wanted` pulse, not the button lesson's, so it can put it out
again without touching that — and the ring goes on the plate, which is the
thing to get round rather than the thing to shoot.

The first act of a debuting type is what stops it: its first round, or for the
rusher the frame it plants and coils, which is the only tell it gives. **That
first round is reserved for it.** A debut has to win a turn on a clock four
gunners are also queuing for, and a shieldbearer — which may only fire while it
is facing you, so it forfeits most turns it wins — measured more than forty
seconds before its card appeared. By then the player has met it, been shot by
it and learned it the hard way, which is not an introduction. So in a debut
room nobody else may fire until the new type has.

That reservation carries its own way out, because this mode bypasses the
anti-deadlock valve every other one has — its clock is a volley schedule, not a
queue. It lifts the moment no live body of that type is on the floor (you shot
it before it opened), and it expires on its own after `meetLead: 12` world
seconds.

**Those twelve seconds are counted from when the debut can actually fire**, not
from when the room opened. A shotgunner opens fire at 10 m and is placed past
the 13 m first-sight floor, so it has a third of the strip to walk in — and it
strafes on the way, so it covers that at well under its 1.8 m/s. Measured
against a lead counted from the room's start, the room ran out of patience
while the man it exists to introduce was still crossing the floor, handed the
clock to the gunners, and never introduced him. Everyone else is in range from
the moment they arrive, so for them nothing changes.

Dodging is what releases it (`TUTOR.dodgeStepM` of sideways ground), because
dodging is what those words asked for both times they were said. `meetHold: 10`
seconds is the last resort, so a stopped world nobody knows how to un-stop
cannot happen. Once per type per run, and only in the room that type debuts in
— a shotgunner met again three cycles later in a combination room is not a
debut. The five debuts land in rooms **7, 11, 18, 24 and 28**.

The card carried a sentence of tactics per type once ("FIVE PELLETS, WIDE ·
STEP EARLY AND STEP FAR", and four more like it). Every one was true and none
of them was going to be read: a stopped screen with a paragraph on it is a
loading screen. It was then a small plate pinned on the body with a cue tucked
down by the stick, which is a card that is scattered rather than one that is
read.

**The button comes first.** `buttonRoom: 6` is the peak of the opening, one
room before the first debut, because a debut says DODGE and slow time is what
makes dodging survivable. The opening entry in the cast programme names its own
length (`rooms: 6`) rather than taking a debut's cycle, because the rooms
before the first debut are not a debut's ramp — they are the mode being taught
by playing it, and they have to outlast the button arriving inside them.

## Time

Rooms 1 to 5 run at full speed and are simply the fight. From room 6 the button
is the player's, on the tunnel's own bank: 5 s at wave start, 10 s ceiling, 2 s
back per kill, 1 s spent per second frozen. It runs dry on its own and lets go.
Slow time here is `SIMPLE.duel.slow: 0.3` — 0.13 shipped once, and at that
speed a round takes 23 seconds to cross the strip against a bank that holds
ten.

The first round anyone fires once the button exists stops the world with the
prompt **on the button**, and pressing it releases straight into ordinary slow
time. The second line follows at the meter, which is by then visibly draining.

The mode used to slow itself whenever a round was inbound — inside 1.1 s and
passing within 2.6 m. That is a real rule and an invisible one: nothing states
it and the player cannot cause it, so from the outside the world slowed down at
random.

## Lifting this ramp into another mode

The three dials are being **trialled here**, in the smallest mode with the
fewest controls, precisely so the shape can be judged before it is spent
anywhere else. If it plays well the obvious next home is the tunnel, whose
opening ramp is four dials that all move at once (`OPENING` in
`src/balance.js`, `docs/BALANCE.md` → *The opening ramp*).

**What is portable, and what is not.**

| piece | portable? |
|---|---|
| *one dial moves per room, taking turns* | **yes** — this is the idea, and it is mode-agnostic |
| *a debut arrives alone, in a quieter room* | **yes**, wherever types are introduced at all |
| *a debut's first act stops the world and names it* | **yes**, given a mode with a freeze to spend |
| the walk (`duelPlan`) | **yes in shape, no in code** — it is written against `SIMPLE.duel` |
| groups as an ordered list | needs a mode where one room is one leg (see below) |
| the volley clock | needs a shared room shot clock; the tunnel has one (`shotGap`) |
| `holdM`, `walkSpeed`, `legCells` | no — arena numbers, meaningless where the player walks |

**The one structural dependency.** A NO RETREAT room is exactly one leg
(`doorLegs()` returns 1 for it), which is what lets `hall.duelGroups` survive
as an ordered list — 3, 3, 4 is a room that builds. A tunnel door is several
legs and its encounters are dealt round-robin across them (`legEncounters`), so
a door there cannot promise an order without deciding first whether the ORDER
belongs to the door or to the leg. That is the question to answer before
porting, and it is a design question, not a port.

**Do it by generalising, not by copying.** The honest port is to move the walk
and its tables behind a per-mode block — `RAMP[mode] = { groups, fire, cast, … }`
— and let `duelPlan` become `roomPlan(mode, n)`. Copying the function and
editing the constants gives two descriptions of one rule, free to drift, which
is the failure this repo has already had several times (see the header comment
on `duelPlan`, and `composeWave` vs the duel's own cast, which is exactly this
bug: the roster let a type in and no code ever put one in the queue).

**How to tell whether it worked here first.** `test/duelramp.mjs` is the
measurement: it reads the schedule out of the running game for 24 rooms, checks
the shape (groups ascend, five is the ceiling, three fire together at most, a
debut arrives alone, a combination moves nothing, every complete cycle peaks
higher than the last), then stands in rooms 4, 10 and 24 and checks the guns
actually fire 1, 2 and 3 together at the gaps promised. Any port should be able
to pass the same shape of check in its own mode before it ships.

## The name

It was CORRIDOR DUEL, and both words were wrong: *corridor* is what the tunnel
is, and a duel is one-on-one, which this has never been. The id is a save key,
so it stays `duel` for ever — and so `SIMPLE.duel`, `duelPlan`, `duelramp.mjs`
and the rest keep it too. Nothing a PLAYER sees says duel.
