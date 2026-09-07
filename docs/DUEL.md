# NO RETREAT — how the fight scales

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
| 7 | 2·3·3 | 8 | 1 | 3.3 s | **+ shotgunner** |
| 8 | 2·3·3 | 8 | 1 | 2.3 s | gunner, shotgunner |
| 9 | 3·3·4 | 10 | 1 | 2.3 s | gunner, shotgunner |
| 10 | 3·3·4 | 10 | 2 | 4.3 s | gunner, shotgunner |
| 11 | 3·4·4 | 11 | 2 | 4.3 s | gunner, shotgunner |
| 12 | 3·4·4 | 11 | 2 | 3.3 s | gunner, shotgunner |
| 13 | 3·3·4 | 10 | 2 | 4.3 s | **+ rusher** |
| 14 | 3·4·4 | 11 | 2 | 4.3 s | gunner, rusher |
| 15 | 3·4·4 | 11 | 2 | 3.3 s | gunner, rusher |
| 16 | 4·4·5 | 13 | 2 | 3.3 s | gunner, rusher |
| 17 | 4·4·5 | 13 | 2 | 2.3 s | gunner, rusher |
| 18 | 4·5·5 | 14 | 2 | 2.3 s | gunner, rusher |
| 19 | 4·5·5 | 14 | 2 | 2.3 s | **combination**: shotgunner + rusher |
| 20 | 4·5·5 | 14 | 2 | 2.3 s | **combination**: shotgunner + rusher |
| 21 | 4·4·5 | 13 | 2 | 3.3 s | **+ shieldbearer** |
| 22 | 4·4·5 | 13 | 2 | 2.3 s | gunner, shieldbearer |
| 23 | 4·5·5 | 14 | 2 | 2.3 s | gunner, shieldbearer |
| 24 | 4·5·5 | 14 | 3 | 4.3 s | gunner, shieldbearer |

Peak bodies of each complete cycle: **10 → 11 → 14**. It never ends a cycle
where the last one ended.

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
every other slot, and the room is made quieter than the one just cleared —
both other dials step back by `typeDrop: 1` — so the new thing is the only new
thing. It then has a full cycle (`rampRooms: 5`) before the next type. Two
types that have each had a cycle **meet** for a couple of rooms
(`hold: 2`) with every other dial frozen, because there the pairing is what is
new.

`duelQueue` builds the room group by group: each group leads with one of every
type the room is about, then gunners fill it out. That is what guarantees the
new type is on the floor and at the front of it in the room that debuts it —
which is what the freeze needs to land on. Before this, a debut room was
composed from the TUNNEL's introduction table: the roster let a shotgunner in
and no code ever put one in the queue, so room 7 filled with gunners and the
debut never happened. An empty permission.

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
seconds however the room got there.

Dodging is what releases it (`TUTOR.dodgeStepM` of sideways ground), because
dodging is what those words asked for both times they were said. `meetHold: 10`
seconds is the last resort, so a stopped world nobody knows how to un-stop
cannot happen. Once per type per run, and only in the room that type debuts in
— a shotgunner met again three cycles later in a combination room is not a
debut.

The card carried a sentence of tactics per type once ("FIVE PELLETS, WIDE ·
STEP EARLY AND STEP FAR", and four more like it). Every one was true and none
of them was going to be read: a stopped screen with a paragraph on it is a
loading screen. It was then a small plate pinned on the body with a cue tucked
down by the stick, which is a card that is scattered rather than one that is
read.

**The button comes first.** `buttonRoom: 6` is the peak of the first cycle, one
room before the first debut, because a debut says DODGE and slow time is what
makes dodging survivable.

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

## The name

It was CORRIDOR DUEL, and both words were wrong: *corridor* is what the tunnel
is, and a duel is one-on-one, which this has never been. The id is a save key,
so it stays `duel` for ever.
