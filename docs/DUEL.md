# Corridor Duel — how the fight scales

Plans and tables, drawn from this data:
**https://claude.ai/code/artifact/252766fc-7ae3-41bc-aace-d6d3c2defde1**

Every number here was **measured, not read off the source**. `test/duelwalk.mjs`
stands in each of the first twelve rooms from the first frame to the last body
and records the strip, every man who arrives, what he is, when he arrives and
how far away he is standing. `runall.sh` skips it; re-capture with:

```
OUT_JSON=/tmp/duelwalk.json ROOMS=12 node test/duelwalk.mjs
```

## The arena

A straight strip, **24 m long and three cells (12 m) wide**, with the door at
the far end. You hold your end: there is no forward control, so the strip is
an arena rather than a journey, and the corridor carries you through the door
at 6.5 m/s once the room is clear (`SIMPLE.duel.walkSpeed`). The drag's forward
half is dropped rather than clamped, so a diagonal thumb still sidesteps
cleanly.

Nobody can be placed closer than the **first-sight floor** — 13 m at these
depths — and `LEG.spawnMin` wants 9 m of room. Everything therefore arrives in
the far half.

## The twelve rooms, as measured

| room | bodies | most at once | cap | shot gap | bullet | aim | cast |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 2 | 2 | 4.3 s | 5.4 m/s | ×1.15 | 5 gunner |
| 2 | 7 | 2 | 2 | 4.3 s | 5.4 m/s | ×1.15 | 7 gunner |
| 3 | 8 | 3 | 3 | 4.3 s | 5.4 m/s | ×1.15 | 8 gunner |
| 4 | 9 | 3 | 3 | 4.3 s | 5.4 m/s | ×1.15 | 9 gunner |
| 5 | 7 | 4 | 4 | 4.3 s | 5.4 m/s | ×1.15 | 7 gunner |
| 6 | 5 | 3 | 4 | 4.3 s | 5.8 m/s | ×1.134 | 5 gunner |
| 7 | 5 | 3 | 4 | 4.3 s | 5.8 m/s | ×1.134 | 5 gunner |
| 8 | 7 | 4 | 4 | 4.3 s | 5.8 m/s | ×1.134 | 7 gunner |
| 9 | 9 | 5 | 5 | 4.3 s | 5.8 m/s | ×1.134 | 9 gunner |
| 10 | 9 | 5 | 5 | 4.3 s | 5.8 m/s | ×1.134 | 8 gunner + 1 shotgunner |
| 11 | 8 | 5 | 5 | 4.03 s | 6.0 m/s | ×1.127 | 7 gunner + 1 shotgunner |
| 12 | 8 | 5 | 5 | 3.76 s | 6.2 m/s | ×1.119 | 6 gunner + 2 shotgunner |

`aim` is a multiplier on the telegraph: **lower is faster**, so the arm comes
up sooner as it falls. `shot gap` is the room's shared clock — however many
men are standing there, one round leaves every `gap` seconds.

## What actually rises

**Concurrency, not headcount.** `most at once` climbs 2 → 5 without a single
break. That is `maxAlive()`, and it is the dial that decides whether a room is
a queue or a swarm.

**Speed and reaction, late and gently.** Bullet speed moves 5.4 → 6.2 m/s
across twelve rooms and the telegraph shortens by 3%. The shared clock does not
move at all until room 11, then tightens 4.3 → 3.76 s.

**The cast, from room 10.** Everything up to room 9 is gunners.

## Two things the capture found

### The headcount saw-tooths

Bodies per room run **5, 7, 8, 9, 7, 5, 5, 7, 9, 9, 8, 8**. It climbs to room
4, falls back to a room-1 sized fight at 6 and 7, then climbs again.

A duel room is one **leg**, and a door's encounters are dealt round-robin
across however many legs that door has (`legEncounters`). The tunnel hides
this: you walk several legs per door, so the shares add up on the way. Here one
room is one leg, so the room inherits whichever slice of the door's plan its
index happened to draw. It is not a rest that anybody designed.

### Everyone stands on the centre line

The strip is 12 m wide. Every body measured across twelve rooms arrived within
**one metre of the spine** — x from −0.9 to +0.85 — at z 12, 16, 20 or 24.

That is the placement pool: the duel places into `L.approach`, which is the
spine's last four cells, and the cells either side of it are not in that list.
The mode's verb is sidestepping, and at the moment every round comes down the
same line. Widening the pool to the strip's full width in the approach band is
a small change (the same filter the feature-stretch pool already uses) but it
is a **design decision**, not a fix, so it is written down here rather than
made quietly.

## The cast, and what the duel does with it

The duel shares the tunnel's introduction schedule (`TYPE_INTRO`) and then
substitutes, because two of the types cannot be answered in a strip you cannot
retreat down:

| tunnel introduces | at door | the duel gets |
|---|---|---|
| gunner | 1 | gunner |
| rusher | 7 | **gunner** — a rusher does not fire, it arrives, and there is no back |
| shotgunner | 9 | shotgunner |
| shieldbearer | 11 | shieldbearer |
| heavy | 13 | heavy |
| sniper | 16 | **gunner** |
| bomber | 19 | shotgunner |
| armored | 23 | armored |
| rocketeer | 27 | heavy |
| laser | 31 | **gunner** |

`EARLY.gunnerOnlyDoors` holds everything back to room 6 regardless, and the
roster is also metered by what the player has met across all runs — which is
why the first shotgunner measured at room 10 rather than at its nominal 9.

## Time

Room 1 runs at full speed and is simply the fight. From room 2 the time button
arrives with a coach (see `SIMPLE.duel.buttonRoom`), on the tunnel's own bank:
5 s at wave start, 10 s ceiling, 2 s refunded per kill, 1 s spent per second
frozen. It runs dry on its own and lets go.

The mode used to slow itself whenever a round was inbound — inside 1.1 s and
passing within 2.6 m. That rule is invisible from outside, which is why it read
as the world slowing at random.
