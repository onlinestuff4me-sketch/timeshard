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
| why the dodge coach spoke | `test/dodgewhy.mjs` |
| how hot each room actually is | `test/duelheat.mjs` |
| the gun on the floor, checked | `test/duelloot.mjs` |
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
steps the fire dial back. There is no closed form for that, and inventing one
would be a second description of the same thing, free to drift from it.

**…except the first seven rooms, which are authored** (`SIMPLE.duel.open`).
Taking turns moves the fire dial only every *other* room, and the opening has
one job: be hard enough by door 5 that the power arriving at door 6 is the
answer to something. Walked, two guns fired together for the first time in
room 5 and the room the button lands in had never once seen three — playtested
twice as *"still don't feel there's enough need to use the time button"*. Those
rooms name both their dials; the walk picks up from wherever the table leaves
them.

| room | groups | fire |
|---|---|---|
| 1 | 1 · 2 · 2 | 1 every 4.3 s — the two-verb lesson lives here |
| 2 | 1 · 2 · 2 | 1 every 3.2 s |
| 3 | 2 · 2 · 3 | 1 every 2.4 s |
| 4 | 2 · 3 · 3 | **2 together** every 2.8 s |
| 5 | 3 · 3 · 4 | **3 together** every 2.6 s |
| 6 | 3 · 3 · 4 | held — **the time button arrives** |
| 7 | 3 · 3 · 4 | held |

Rooms 6 and 7 hold everything, because the button is the new thing there and a
new thing is met in a room that is otherwise exactly the one before it — the
same rule a debut follows, applied to a power instead of a type. The
shotgunner then debuts at **room 8**.

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

| | shipped | then | now | measured |
|---|---|---|---|---|
| bullet, room 1 | 5.4 m/s | 7.0 | `bullet.openM` 7.0 | 2.7 s of flight from the far end |
| bullet, door 5 | 5.4 m/s | 9.5 | +`stepM` **1.1** a room | **11.4 m/s** |
| bullet, door 6 | 5.4 m/s | 10.1 | | **12.5 m/s** |
| bullet, ceiling | 6.2 by room 12 | 13.5 | `capM` **15** | 15 by room 8 |
| closest they fire from | 19.2 m | 9.5 by room 10 | `engage` 15 → 9.5 **by room 5** | opens at ~19 m, closes to **2.4 m** |
| firing together at door 5 | 1 | 2 | fire dial reaches **3** | **3** |
| rounds in the air at door 5 | 1 | — | | **3** |

Those last three columns are the two passes this took. The first fixed the
numbers and left the *schedule* walking, so the speeds arrived four rooms after
they were needed; the second authored the opening (above) so they arrive at
door 5. `test/duelheat.mjs` is where the "measured" column comes from — it
stands in a room and counts what is actually in the air, which is the thing the
schedule cannot tell you.

`engage` is a **cap on a type's own engage distance**, not a replacement — a
shotgunner still opens at its own ten metres, and a gunner stops being able to
plink from the far wall.

**...and the cap starts on a man's second round, not his first**
(`openAnywhere`). Measured, the second and third men in a room went **ten to
seventeen world seconds** between arriving and firing. Part of that is the
room's own clock, which is the pacing dial and stays — and part of it was a man
placed at twenty metres walking a third of the strip before he was allowed to
shoot at all. A room you walk into should announce itself. He opens from
wherever he is standing and closes afterwards, so the closing-in is something
the player watches happen rather than something that happens before anything
else does. `openIn` cuts the opening cooldown with it: the shared default gave
a man up to 1.4 s of thinking time before he could even raise his gun.

| | was | is |
|---|---|---|
| first body, arriving to firing | 3.5 s | **1.3 s** |
| the ones behind it | 10 – 16.7 s | 4.6 – 7.1 s (the room clock) |
| opens from | 14 m | ~19 m |
| ends up at | — | **2.6 – 3.7 m**, the hold line |

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

**The shooting half is answered by a body coming apart, not by a trigger
pull.** It used to clear on the first tap, which is the gesture without its
consequence: a player who tapped a wall was told they had learnt it. What this
mode is made of is a man being there and you shattering him, so the card stays
up until one does — any of them. **And nobody shoots back while it is up**
(`duelMayFire`): rounds arriving during the one beat that is teaching the
player how to shoot is the room asking a question it has not finished teaching
the answer to. There is no rush on it for the same reason, so `shootHold` is a
long way out — a safety net against a wedged run, not a lesson that gives up on
you.

**It is said twice at most** (`SIMPLE.duel.teach`), and the second time has to
be earned by missing it. Past that it is nagging somebody who is playing.

**"It told me to dodge something that was never going to hit me."** Reported
with screenshots, and it is a claim about three numbers rather than an
impression, so it is measured (`test/dodgewhy.mjs` records why every telling
fired). Two things were wrong, and both came from asking the question in the
wrong unit:

* **A distance ratio is not time.** The repeat's bar was `lateAgainAt` — 82% of
  the way along the round's flight — and measured, that fired **0.40 s** before
  the round arrived. That is the result being read out, not a warning. Worse, a
  ratio silently gets meaner as the mode ramps: the same fraction of the same
  strip is a second at room 1's bullet speed and a third of one at the ceiling.
  Both bars are seconds now — `warnS` **0.7** is the earliest a telling is any
  use, `againBy` **1.25** is the latest the *correction* may arrive — and the
  window between them is real at every speed the mode reaches.
* **A player mid-drag is not standing anywhere.** The threat test asked whether
  the round passes close to where the player *is*. Somebody who has already
  started their sidestep is on their way out of the lane, and freezing the world
  to tell them to do the thing they are in the middle of doing is exactly the
  complaint. Both are treated as moving now: closest approach of two moving
  points (`duelRoundMiss`), which answers *given how they are going, is this
  going to hit them*. The onboarding's own dodge lesson keeps the old test —
  it stops the world at a scripted moment and the player there has no drag to
  be in the middle of.

The introduction is still placed along the flight (`lateAt`, half way): it
wants to arrive with plenty of round left to step out of, and sooner is better
for something you have never been told before. A probe that steps out of every
lane it is put in now hears the line **once** and is never corrected.

**And it never fires twice in the same room.**

**And the whole lesson ends where the power begins.** The button's own room
belongs to the button, which arrives with a coach of its own; measured, the
dodge repeat fired in room 6 and stopped that introduction happening at all.
This lesson is for the rooms *before* there is anything else to be told.

**How close they get: 2.6 m** (`SIMPLE.duel.holdM`), measured from where you
stand. That number sits between two others. A man inside **1.5 m** switches to
melee and stops shooting; a rusher plants and lunges at **3.4 m**. Held at the
tunnel's own line — the door approach, eight metres out — the rusher never
arrives at all: measured, the nearest one ever got to a standing player was
7.89 m, and its debut froze on a tell it was never going to give. Removed
entirely, two of five bodies ended up stood on the player swinging, and a room
scheduled to fire three together fired two.

## The cue points at somebody you can see

Worth knowing before you write any beat that draws a ring or a thumb on a man,
because the trap is not obvious and it caught one.

**The camera is portrait and its 80 degrees are vertical.** Measured in room 6:
`camera.fov` 80, aspect **0.46**, so the *horizontal* field of view is **42
degrees — twenty-one either side** of the way you are facing.

**Nobody ever gets behind you.** There is no forward control and the men come
to you: out of 2525 samples of a live man, **none** was behind the player.

**The men who fall off the screen are the ones who have CLOSED.** 128 of those
samples were off the glass, every one of them in front, at a median of **3.9 m
and 30 degrees off-axis** — a man who has walked in to the hold line and
strafed a couple of metres across. He is thirty degrees off, which is outside a
42-degree view while being squarely in front of you.

**And he is also the nearest.** Median distance of a man *on* screen: 15.2 m.
Of one *off* it: 3.9 m. "Nearest" and "visible" are close to opposites in this
mode, so `duelNearestBody` asks the camera — a body counts if its chest
projects inside the viewport with a margin — rather than sorting by distance.
Its comment used to claim it took the nearest man *in front*, and the code
never checked; even the fixed version of that claim would have been wrong,
because in front is not the same as on screen.

## The gun on the floor

A shotgunner leaves his shotgun behind, and **there is no pick-up button in
this game** — you walk over a thing to take it. NO RETREAT never asks the player
to go anywhere: the drag is for stepping out of the way of rounds and the
corridor does the walking. So the one gesture that gets you the gun is the one
gesture the mode has never used the drag for, and a player who has only ever
played this mode has no reason to guess it.

So the room says so. When a room is cleared with a weapon lying in it and the
player is not yet carrying one (`duelWantsLoot`), the world **goes heavy** —
`loot.slow` 0.35, not a freeze — a ring goes on the gun, and the thumb points
the way across. It is not a freeze because *the corridor has to keep carrying
them*: the walk is what makes the sideways drag mean something, and a stopped
world would leave the player with nothing to drag against. It goes the moment
they have it, or the moment they are past it and the answer is no.

**It comes back at every cleared room until they are carrying one.** Missing it
is the likeliest outcome the first time — the gun may be at the far side of a
strip they are being walked down the middle of.

**And the room guarantees there is something to point at.** A weapon drop is
normally a roll (`DROPS`, `scarcity`), which is the lever the whole game hangs
off — but a room that introduces a type exists to introduce it, and what he was
carrying is part of meeting him. One guaranteed drop per room, only while the
player has yet to pick a weapon up at all; past their first weapon it is
ordinary loot again, and loot is meant to be scarce.

Checked end to end by `test/duelloot.mjs`, which wins rooms 1 to 7 rather than
warping to 8 — `warpDoor` moves the room number and not the fight in front of
you.

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
the roster let a shotgunner in and no code ever put one in the queue, so the
debut room filled with gunners and the debut never happened. An empty
permission.

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
debut. The five debuts land in rooms **8, 12, 19, 25 and 29**.

The card carried a sentence of tactics per type once ("FIVE PELLETS, WIDE ·
STEP EARLY AND STEP FAR", and four more like it). Every one was true and none
of them was going to be read: a stopped screen with a paragraph on it is a
loading screen. It was then a small plate pinned on the body with a cue tucked
down by the stick, which is a card that is scattered rather than one that is
read.

**The button comes first.** `buttonRoom: 6`, two rooms before the first debut,
because a debut says DODGE and slow time is what makes dodging survivable. The
opening entry in the cast programme names its own length (`rooms: 7`) rather
than taking a debut's cycle, because the rooms before the first debut are not a
debut's ramp — they are the mode being taught by playing it, and they have to
outlast both the button arriving inside them and the two rooms that hold the
difficulty steady around it.

## Time

Rooms 1 to 5 run at full speed and are simply the fight — and by room 5 that
fight is three guns firing together every 2.6 s at 11.4 m/s from under ten
metres, which is the point: the power has to be the answer to a question the
player has already been asked. From room 6 the button is the player's, on the tunnel's own bank: 5 s at wave start, 10 s ceiling, 2 s
back per kill, 1 s spent per second frozen. It runs dry on its own and lets go.
Slow time here is `SIMPLE.duel.slow: 0.3` — 0.13 shipped once, and at that
speed a round takes 23 seconds to cross the strip against a bank that holds
ten.

The first round anyone fires once the button exists stops the world with the
prompt **on the button**, and pressing it releases straight into ordinary slow
time. The second line follows at the meter, which is by then visibly draining —
**paired with the shooting cue**: a ring on a man and a thumb pressing on his
chest, in the slowed room, while the line about refilling is on screen. The
meter line asks the player to shatter and said nothing about how, at the one
moment the world has slowed down to let them. Stopping time and taking a shot
are one idea, so both halves are in frame together, and the cue goes the moment
they take the shot it was asking for.

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
