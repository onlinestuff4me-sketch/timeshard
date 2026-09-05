# Where this leaves off — 2026-08-28

TIME SHATTER, live at **https://timeshatter.app**. Portrait-mobile
first-person arcade shooter, Superhot-descended. Development is
playtest-driven: the owner plays on an iPhone, reports what went wrong,
the change is measured rather than eyeballed, and it ships from this repo.

## Which repository — read this before anything else

**`onlinestuff4me-sketch/timeshard`, branch `main`, is the only home of
TIME SHATTER.** GitHub Pages serves timeshatter.app from its root: what is
on `main` is what players get. Every change belongs here and nowhere else.

**`onlinestuff4me-sketch/neon-grid-breaker` is a DIFFERENT GAME. Nothing to
do with TIME SHATTER goes into it.**

That repo used to be called `physics-arcade-game`, and for a long time this
game's work was mirrored into it as well. It has since been renamed and
repurposed. The trap is that **GitHub silently redirects git pushes to a
renamed repository**: a working copy whose remote still reads
`.../onlinestuff4me-sketch/physics-arcade-game` will push, report success,
and land the commits in `neon-grid-breaker` — where they are invisible to
anyone looking for this project. Check `git remote -v` before pushing.
There is nothing to migrate out of it.

> Container paths (`/home/user/...`, `/workspace/...`) are an artefact of
> whichever machine a session runs on and mean nothing to the person reading
> a handoff. Always name repositories.

**A deploy is confirmed by the GitHub Actions conclusion, never by the
push.** `.github/workflows/pages.yml` runs `on: push: branches: [main]`
only — **a push to any other branch deploys nothing and produces no run to
check**. Match the head SHA, wait for `completed / success`.

### THIS SESSION'S WORK IS NOT LIVE YET

It is on `claude/timeshatter-dev-continue-s3afr6`, because the session brief
named that branch and said never to push elsewhere without permission. The
site serves `main`. Nothing below is in front of players until somebody
merges it.

## What shipped this session

Four of the five NEXT UP items, the fifth confirmed as already correct, and
a repair to the tool that writes docs/BALANCE.md.

**The direction mark was doing two jobs.** A small red triangle appeared and
disappeared "seemingly at random" walking the training hallway, once landing
on top of DRAG TO MOVE. It was two marks trading places: the per-enemy edge
arrows, which latch on and off as a body crosses the edge of frame, and the
door arrow added last session, which shows only on a leg with nobody in it.
They separate now. While the player is being led — the whole onboarding, and
then through `EARLY.wayDoors` — there is ONE mark: `#wayarrow`, a large
needle laid on the floor ahead by a perspective tilt, turning to a bearing
rather than jumping around a ring, and it never blinks. The small per-enemy
marks are a later lesson.

It points at the **path**, not the door. A leg that jogs twice puts its door
through a wall from where you stand, and an arrow pointing at a wall is a
wrong answer confidently given: `wayTarget()` walks the spine forward and
takes the furthest point still in line of sight — the corner you are heading
for — and points at the door only once the door itself is visible.

**Why door 8.** `doorAlive()` — how many bodies may be up at once — is 1
through door 3, reaches 2 at door 4 and 3 at door 8. The small marks say
"somebody is over there", which is only worth saying when there is more than
one somebody, so they arrive at door 9 and not before.

**The spurious arrow on walking in** was the door fallback answering a
question nobody had asked: on the frame you cross, the leg has no bodies
YET, so it came up pointing at the door and went out again as the opener
spawned. A settle timer alone only moves the flash — at 1.6 s, measured at
door 15, the arrow came on at 1.60 s and off at 2.20 s, two transitions. A
leg that has not released anybody is not clear, it is **not started**, and
the leg knows: it still owes bodies. `wayArrowShows()` asks that first, and
the timer is now a 0.7 s debounce sitting on top rather than the test.

**The ammo pips** wanted the readout's halo, and the halo turned out not to
be the problem. `#ammo` carries a `text-shadow`, which does nothing for a
`background`-filled box, so the magazine gets a `drop-shadow` that follows
the rendered alpha. But the pip that vanishes is the **spent** one — hollow
at 42% opacity, measuring 1.99:1 against the floor, and the halo made it
*worse* (2.25 → 2.02) because it lightens the ground under a mark that is
itself pale. At 75% opacity it reads 4.18:1 with a full cartridge at 6.87:1
— visible, and still unmistakably the dimmer of the two, which is the whole
job. Widening the ring instead does nothing: .13em measured 4.16:1.

**The training ramp is three areas.** It ran room/hall/room/hall/room/hall
at 1,1,2,2,3,3 — six checkpoints where the last four teach nothing the first
two did. Now `hall1` (one man), `hall2` (two, taking turns), `room1` (three
in a vault with four columns authored in `plan.pillars` — the first cover in
the game, met with three men standing among it), then Door 1. Cutting it
touched `LEGS`, `STEPS`, the `exit` cue (which said GO TO THE NEXT ROOM
where the next area is now a hallway), `docs/TUTORIAL.md` and one comment in
`tool/tutorial-pane.js`.

**UNLOCKS spans game modes**, confirmed with the owner and now written
down in `discoverData()` and `docs/SAVES.md` rather than left as a question.
Discovery is a property of the player, not of the save and not of the mode.

**docs/BALANCE.md can be regenerated again.** It could not: the guard failed
the whole document over "reach full heat together on door 98" — a true claim
solved from the same functions as the rest of the file, which merely sat
near the word "school". The generator also still computed
`diffT = (w - 1) / RAMP.rampWaves` after that dial was deleted last session,
so every cell of the ramp table rendered `NaN`, and a hand-written section
had been appended BELOW the marker, where regenerating discards it. Guard
taught the cap door, `diffT` read from the speed staircase the way the game
reads it, prose moved above the marker. `node tools/gen-balance-doc.mjs` is
idempotent now — run it after touching `src/balance.js`.

## The measurements

| what | number |
|---|---|
| way arrow up over an onboarding walk | 1800 / 1800 frames |
| per-enemy marks up over the same walk | 0 frames |
| on/off transitions | 0 |
| arrow box vs every visible message box, at all 11 steps | no overlap at any |
| flips on crossing into a new leg, at door 15 | 0, 0, 0 (was 2 on the first) |
| ...and on a leg cleared of everybody it owed | mark still comes up, 0.05 s |
| full cartridge against the floor | 6.00 → 6.87 : 1 |
| spent cartridge against the floor | 1.99 → 4.18 : 1 |
| ramp areas walked | corridor/1 → corridor/2 → vault/3 with 4 columns |
| deepest scripted body in the ramp | 42.9 m → 33.5 m (`TUTOR.engageM` 60) |

## The quiet early corridors — asked, and the answer is "they are not quiet"

The owner asked whether the opening corridors feel too empty, and chose
"degrade, don't veto" for the first-sight rule: where no spot gives 13 m of
clear ground at first sight, take the best available down to a floor rather
than spawning nobody.

**I did not make that change, because the problem it fixes does not happen.**
Walked doors 1-10 twice, driving the real stick so the release gate sees a
real walk:

* **34 legs, 0 of them fielded nobody.** Every leg met its whole quota.
* Mean bodies met per leg **1.59** (it was 1.48 after last session's change).
* The rule refuses **23 placements, 0.68 per leg** — so it is doing work —
  and **all 6 legs that saw a refusal still fielded their full quota**. One
  refused 13 times and still delivered its man.

That is the design working: a refusal defers a body, the corridor tries again
further along, and it recovers every time. Degrading would loosen a safety
rule the owner asked for in exchange for nothing measurable, so the veto
stays. `__ts.sightRefusals()` was added to make this askable again in one
line — if a future playtest *does* report a silent early corridor, that
counter plus the walk in `early.mjs` is the whole diagnosis.

Caveat worth knowing: the walker kills each body 0.7 world-seconds after it
appears. A player who dawdles gives the release gate a different rhythm, and
34 legs is two runs, not thirty.

## Spawn integrity — asked after the fact, and one real defect found

The ramp change put four columns in a room that scripted bodies are placed
into by `spawnEnemy`'s `at` argument, and `at` **skips the obstacle test on
purpose** ("the caller has already decided"). So the plan is the only thing
between a gunner and the inside of a column. Checked as a BOX against every
solid in the leg, not as a point — a body clear at its feet can still have a
shoulder in the stone:

* **0 bodies inside a solid**, across all three training areas and the first
  real leg (117, 46, 58 and 106 solids checked).
* **0 phantom spawns.** Every arrival watched from its first frame: 13
  arrivals over 8 real corridor legs, all born in state `assemble` and
  settled at exactly the position their swarm converged on — jump across
  the assemble 0 m for every one. Biggest single-frame move 0.17 m, which is
  a walk; a teleport is metres in one frame.
* **0 bodies appeared and then vanished** without being killed.

> A warning for the next person: "how far did he move" is NOT the test. A
> gunner in a real leg walks, and the first version of `clip.mjs` scored the
> live corridor at 7.6-12.0 m and called it drift. The teleport is the gap
> between the swarm's target and the finished man, and he is shards until
> that point, so a walk cannot appear in it.

**The defect: a man the floor refused was filed as met.** `recordMet([type])`
sat on the first line of `spawnEnemy`, above everything — and last session's
first-sight veto returns out of the middle of the function. So a placement
the floor turned down filed the enemy type, and `recordMet` calls
`saveProgress`, so it went to disk — while nothing ever reached the scene.
Measured at 0.68 refusals a leg over doors 1-10, so it was not rare, and the
opening doors ease their floor out to door 18, which is past the first
debuts. It now sits on the line that puts the body in the world.

Proven both ways, because moving it down could just as easily have stopped
UNLOCKS filing anything: with the floor forced to a value nothing can
satisfy, 40 of 40 calls refused, 41 refusals counted, 0 enemies in the world
and the unlock set unchanged in memory AND on disk; then one heavy placed
through `at`, in the world, filed and saved.

## The needle, after a playtest of it

The owner recorded the first hallway and asked for a navigation aid rather
than a goal marker: "it has a delay before it turns, and sometimes points in
the wrong direction for a little bit before correcting itself and swinging
suddenly." Measured off the shipped build (429c151) against a rebuilt one,
walking the same opening straight:

| | 429c151 | now |
|---|---|---|
| peak turn rate of the world bearing | **1104** deg/world-s | **96** |
| world bearing moved while only the VIEW swept +/-57 deg | **16.1** deg | **0.0** |
| angle off the straight, 10 m before the corner | 0 deg | 1 |
| ...8 m | 0 | 4 |
| ...6 m | 0 | 8 |
| ...4 m | 0 | 18 |
| ...2 m | 27 | 35 |
| ...at the corner | 69 | 57 |
| ...2 m past | **105** (overshoot, then back to 90) | 75 |
| `DRAG TO LOOK` appears | 1.7 m before the corner | **10 m** |

Three separate causes, and the clip showed all three at once:

1. **It read the wrong thing.** It took the furthest point still in line of
   sight, which is right down a straight corridor and badly wrong at the one
   moment it matters: the frame the branch comes into view, the furthest
   visible point is deep inside it, ninety degrees off the way you are
   walking. It now reads the PATH ahead and ignores sight entirely — the
   corridor goes where it goes whether or not you can see round the bend, and
   saying so early is the whole job.
2. **One lookahead is not enough.** A single point only starts to swing once
   the corner is nearer than the point itself, so its warning distance is its
   own length — and simply making it long reports "straight on" through an
   S-bend, because a point far enough ahead is straight again. Four samples,
   near-weighted 4:3:2:1 over `EARLY.wayLookM`: the far ones lean the needle
   into a turn while it is still metres off, the near ones keep it honest
   about the corner actually in front.
3. **It was eased on the SCREEN, not in the world.** The drawn angle is the
   world bearing minus the player's yaw, and easing that meant the player's
   own head-turn went through the damping too — so the needle swung after
   them a beat late. That is the "delay before it turns". Only changes in
   where the path goes are eased now; yaw is subtracted fresh every frame,
   undamped. A compass needle does not lag your head.

Two things this cost, both caught by re-running the older files:

* A leg that jogs comes back alongside itself, and a plain nearest-segment
  search decides the player is standing on a stretch they walked a minute ago.
  `wayProject` searches forward only, from where it was last frame.
* Walking right up to the door leaves the player standing on the last point of
  the path, where there is no direction left to measure — and the mark simply
  disappeared, which is the exact vanishing act it exists to avoid. It holds
  its last bearing instead.

## The second needle playtest, and four things around it

Screenshots, five findings, all shipped.

**The needle is a WALKING aid and nothing else now.** It used to be up for the
whole onboarding and then through door 8. It is a grant — `way`, in
`MECHANICS` — held by `move`, `look` and `corners` and dropped the moment
STAND HERE goes up on the barrier: from there the player is being sent to a
place that is on screen, and a mark pointing at it is a second answer to a
question already answered. It is off for the combat course and off for all
three ramp areas. Past the onboarding it returns only on a hallway with
nobody left in it, which was already the late rule.

`EARLY.wayDoors` still exists and still means door 9 — but only for the SMALL
per-enemy marks. The two used to share one test and they are two different
questions.

**The divider belongs to the words.** `corners` shows DRAG TO MOVE and DRAG TO
LOOK with `divider: false`, so the line vanished under the player mid-corridor.
It is on wherever those words are.

**And the needle draws over it.** `#tutor` is a sibling inside `#hud` at
z-index 11; the needle was at 7, so the dotted line ran through the mark.
It is at 12.

**Once there is a gun, the needle moves to the top of the frame.** Measured in
its own column strip on a 402x874 frame, the viewmodel's dark mass starts at
50% of the height and is solid from 71% — the low seat it uses during the
walking lessons, when no gun is drawn, sits on top of it. `body.armed` moves
it to 58 px from the top, where the only thing near it is the score line.
Measured on a cleared leg at door 12: 0 of 3 visible HUD boxes overlap, and
274 px of clearance above the gun.

**The pillared room was laid out wrong.** Columns at 12 and 24 m with the men
at 20 put the columns ON the sight lines: the left-hand man was completely
hidden, and cover you have to walk twelve metres into the fight to reach is
not cover anybody uses on the first round fired at them. Columns forward to 6
and 11 m, men back to 22 and 26. Measured in the running game:

* 0 of 3 men concealed from the doorway (was 1).
* every one of the three can be hidden from, at 5.1, 5.1 and 5.7 m from the
  doorway.
* a round fired at a column dies at (8.6, 213.65) against a column spanning
  213.7-214.3 — i.e. **on its face**. Columns stop rounds, so ducking behind
  one is a real answer and the lesson has something to teach.

**The menu shows gameplay again after a death.** `menuBackdrop()` built its
corridor only `if (!hall)` — and after a run there IS a hall: the run's, whose
legs are hundreds of metres down the tunnel, while the attract loop walks its
ghost up and down the ORIGIN where the menu's own leg goes. So the camera
stood outside the level in white nothing. The test is not "is there a hall"
but "is this hall the menu's": `hall.forMenu`. Measured after dying at door
10 — `forMenu` true, one leg, ghost on floor at the origin, two enemies
fighting, and a frame whose mean and spread match a first load (196/38.1
against 200/37.9).

## The dodge freeze, and two more from the same play

**The needle fades now instead of being cut.** `#wayarrow` used `display:none`
for its off state, so the opacity transition beside it had never run once —
the element left layout on the frame the class went. `visibility` with a
delayed transition keeps it painted for the length of the fade: measured
through the hand-off to STAND HERE, opacity 1 → 0.87 → 0.42 → 0.16 → 0.05 → 0
over 0.60 s, nine frames caught mid-fade.

**The room's entrance is flat.** It widened one cell IN, leaving a stub of
wall either side of the door: the player walks in through a one-cell slot and
the first thing anybody tries — step aside, out of the line of the round — is
the one thing that slot will not let them do. `room(1, 0, 8)` instead of
`room(1, 1, 8)`. Measured standing in the doorway: 6 m of floor to the left
and 6 m to the right (was 1.7). Cover from the two flanking men is now **1.5 m
away** — one sidestep — and from the third 3.8 m, and the probe confirms the
thing doing the blocking is a COLUMN in every case, not a wall.

**The freeze settles instead of hitting.** Four things arrive when the lesson
stops the world: the clock, the zoom (read straight off the clock), the colour
grade and the letterbox bars. All four used to land inside a frame or two.

| | live before | now |
|---|---|---|
| clock to a dead stop | 0.05 s | 1.27 s |
| peak lens change | **291 deg/s** | **68** |
| peak grade change | 3.4 /s | 1.0 |
| peak bar change | 9.6 scaleY/s | 3.4 |
| 90% of the zoom | 0.05 s | 0.53 s |
| 90% of the grade | 0.32 s | 1.02 s |
| 90% of the bars | 0.32 s | 0.72 s |
| the round when the clock stops | 47% of its flight, 9.09 m to go | 53%, 8.08 m |

Three separate causes:

* **The hold snapped.** `if (tutorWorldHeld) timeScale = 0` — one frame, and
  the FOV follows `timeScale`, so the lens snapped 14 degrees with it.
* **It has to BE the target, not a correction after one.** The first attempt
  eased toward zero *after* the ordinary ease had already pulled toward full
  speed; the two rates balance and the clock stuck at **0.57 and stayed
  there** — the world never stopped at all. `TUTOR.holdEase` owns the target
  and the rate now.
* **The grade and the bars hung off a class that flips at a threshold.**
  `body.slowmo` toggles when `timeScale` crosses 0.55, and the canvas filter
  and `.lbar` transform changed on that frame. Both come off a smooth scalar
  now (`VIS.slowLookOn`), written per frame — and at rest the filter property
  is REMOVED rather than set to an identity, because a full-screen filter
  costs a compositor pass on a phone whether or not it changes anything.

## Three more off a second look at the dodge

**The needle is retired by the SIGN, not by the step.** `stand` begins the
moment the player reaches the last corner — which they can reach without
having turned to look down the straight — so the mark was going out while
there was still nothing on screen to replace it. The step holds the `way`
grant now, and `tutorPlaceWorldCue` sets `tutorSignSeen` on the frame it
actually puts STAND HERE in frame; `wayArrowShows()` waits for that. Latched,
because a mark that returns every time the player glances away is the flicker
this whole thing exists to remove. Walked, the reported case: round the last
corner without turning, and across 102 frames the sign was on screen in **0**
and the needle stayed up for **all 102**. Then turn: sign at frame 1, needle
fades over 11 frames.

**Two things still cut at the start of the freeze.** The world, the zoom, the
grade and the bars were fixed last round; what was left was the headline and
the ring.

* `tutorSlot` writes `innerHTML` every frame, so one cue replacing another in
  the same slot swapped a full-width sentence between two frames — TAP
  ANYWHERE TO SHOOT to DODGE THE BULLET, at the exact moment the world starts
  stopping. The old line dips out first now (`.tslot.swapout`, 190 ms) and the
  new one arrives on its own fade.
* `#tutorpin` already had an opacity transition and it had never once run: the
  `.on` rule adds `pinpulse`, which holds opacity 1 at 0%, and **a running
  animation beats a transition on the same property**. Delayed past the fade,
  the ring now comes up 0 → 0.11 → 0.47 → 0.85 → 1 across 19 frames.

That same trap bit the headline swap too, and is worth remembering: an
outgoing line that was PULSING cannot dissolve, because a removed animation
cannot be transitioned from — the computed value jumps to the declared one
before the transition is set up. So a pulsing line clears in a frame and then
there is a gap before the new one fades in; a non-pulsing one cross-dissolves
properly (measured: 1 → 0.76 → 0.27 → 0.03 → 0.41 → 0.74 → 1, 11 frames).

**The first two ramp gunners stand closer.** At 5 cells the first man anybody
meets stood 21.5 m from the door they walk in through, which on a portrait
phone is a figure about a centimetre tall — a hard first target for somebody
who has held the trigger once. 3.5 cells puts him at **17.5 m**, which is the
same range as the teaching leg's own gunner (`TUTOR.enemyCells` is 4 cells
past the barrier, and the player stands at the barrier). `hall2`'s pair went
21.5/33.5 → 17.5/25.5. The pillared room is unchanged.

## The headline's colour, and a shorter walk

**DODGE THE BULLET came up black and flashed white.** The HUD palette flips on
`body.slowmo`, which is set when the clock crosses 0.55 — about 0.15 s into
the hold — while the cue that goes with the freeze fires on the hold itself.
So the words were painted in the light-corridor colour for a tenth of a
second and then changed under the player. Off the recording: black at 0.33 s,
still black at 0.38, white at 0.43.

The onboarding's hold is known on its first frame, so the palette flips there
instead (`timeScale < 0.55 || tutorWorldHeld`), and `.tslot` transitions its
colour and shadow over 0.35 s so even the flip eases. Measured: `slowmo` is on
at clock 1.000, two frames before the words are legible at all, and the colour
then climbs 0.09 → 0.24 → 0.42 → 0.65 → 0.79 → 0.94 in step with the fade —
one frame is both legible and darkish, at 17% opacity.

**The teaching leg is shorter and has two jogs, not three.** A lateral run is
TWO turns to the person walking it — one into it, one back onto the axis — so
`['r',3]` reads as "left, right", and three of them is six turns before
anybody has been handed a gun. Now: straight, jog left, jog left, straight.
The fork came out with the third jog. `barrierCells` counts from the last
corner now rather than the fork's rejoin, two cells nearer than the old
arrangement worked out to.

| | before | now |
|---|---|---|
| direction changes on the walked path | 6 | **4** |
| off-spine cells (the fork) | 6 | **0** |
| walk to the barrier | 108 m | **88 m** |
| whole path end to end | 148 m | 124 m |
| barrier past the last corner | 32 m | 24 m |

Everything the lessons stand on still fits, asked of the running build: the
barrier on floor, all three of the shooting lesson's men on floor 16 m past
it, and the door 22 m past them.

> Careful with `barrierCells`. Two cells flat put the barrier **8 m** past the
> corner — no walk at all — because the old number counted from a rejoin that
> was itself well down the straight. Six is what "a couple of cells nearer"
> actually means now.

## Three from the third dodge playtest

**The DODGE line was cleared, not faded.** Two separate things: its beat ran
long, and its retirement was instant. `off: 'dodge'` fires when the round is
BEHIND the player — at resumed speed, a second and a half after the freeze has
finished fading — so the words sat over an ordinary corridor going black as
the palette dropped. It leaves on `freeze` now, which is the frame the player
steps aside. And `tutorSlot(slot, null)` cleared `innerHTML` on the spot, so
what faded was an empty box: a retired line gets `.tslot.fadeout` and its
content goes only when the fade has. Measured from the release: the words fade
1 → 0.93 → 0.77 → 0.57 → 0.40 → 0.24 → 0.09 → 0 by frame 16, the grade reaches
zero at 21, and **0 frames** have the words legible and dark with the effect
gone. The palette also rides the effect out now (`slowLook > 0.3`) rather than
snapping back when the clock crosses 0.55.

**The readout arrives after the pistol.** Both are switched on by the same
lesson, but the HUD is a DOM node and the viewmodel has to be raised into
frame, so PISTOL and its cartridges appeared first, labelling a weapon that
was not there. The gun is visible at frame 0 and the readout passes half
opacity at frame 14 now.

> It had to be an ANIMATION, not a transition. `#ammo` is switched on with
> `display`, and an element coming out of `display:none` does not transition —
> the new value is simply where it starts. A delayed fade did nothing at all;
> a keyframe with `both` holds it at nothing through the delay.

**The teaching leg turns LEFT first, and is shorter again.**

| | two builds ago | last build | now |
|---|---|---|---|
| direction changes | 6 | 4 | 4 |
| first turn | right | right | **left** |
| walk to the barrier | 108 m | 88 m | **76 m** |
| whole path | 148 m | 124 m | 108 m |

> **Four turns is a floor, not a choice** — worth knowing before anybody tries
> for three again. An odd number needs the leg to FINISH on a lateral run, and
> the barrier cannot live on one: it is placed at a grid ROW and spans that
> row's width, so a leg ending sideways puts the slab off the floor entirely
> (measured, at (12, 64) with nothing under it). The sign, the gunner's cells
> and the dodge lane make the same +z assumption. Three walking lessons also
> need three distinct end marks, and one jog cannot supply them.

> **The move letters do not match the turn the player feels.** Measured off the
> build, `['r', N]` swings the camera +90 degrees, which is a LEFT turn in the
> yaw convention the whole HUD uses. They say which way the corridor steps in
> the grid, not which way the head goes.

`marksFromPlan` gained `firstJogEnd` (the looking lesson ends there — on a leg
with only two forward runs, `secondRun` is the SAME CELL as the last corner
and `corners` would have had no length), and `finalRun` is now the last place
the path changes direction rather than the end of the last lateral run.

## Three from the fourth playtest

**The reload showed a half-built menu.** The document ships a menu skeleton so
there is something for the game to fill in, and until `main.js` has run it is
the WRONG menu: no discovery panel, no CONTINUE / LOAD GAME row, no attract
corridor behind it, and `#hud` reading `WAVE 1 · 0` painted over the top of it
(the frame loop is what hides that). Measured at first paint on a throttled
boot: `body.className` empty, `#hud` opacity 1, `#discpanel` missing, no canvas
— and then the whole thing rearranged. `<html class="booting">` plus a `#boot`
veil in the game's own background colour now holds it back, and the frame loop
takes the class off on the first picture it actually RENDERS (the menu backdrop
is a rendered corridor; uncovering before it exists uncovers a blank canvas).
An 8 s inline `setTimeout` clears it if the module never loads, so a bad deploy
gets the skeleton rather than a grey rectangle.

> The class has to be on the `<html>` TAG. A class added by a script — even the
> first script in `<head>` — is already one paint too late on a cold load.

**The DODGE beat's furniture was a third of a screen from what it was about.**
Measured on the freeze frame at 402x874: the words ran 26–34% of the height,
the thumb coach sat at 42%, and the round itself is ringed in red at **52%**.
There is now a seventh text slot, `dodge` — `mid` eight per cent lower — and:

| | before | now |
|---|---|---|
| words | 26–34% | **34–42%** |
| thumb coach | 38–46% | **46–54%** |
| the ringed round | 52% | 52% |

The coach is on the LEFT half (25%), where the ring never is, so 50% is as low
as it can go and still clear it.

> **A new slot re-opened the black-then-white flash, in miniature.** `.tslot`
> eases its colour over 0.35 s so a line already on screen does not flash when
> the palette flips — but this one arrives ON the frame the palette does, so it
> rode that ramp underneath its own fade-in: luminance 0.17 at 9% opacity,
> 0.75 at 78%. `#ts-dodge` is painted light outright now (it is never on screen
> against a light corridor), and has no `transition` of its own so
> `.tslot.fadeout` still owns the way it leaves. 1 dark frame of 24 → **0**.

**The pillared room was empty until you were inside it — and the room was not
the problem.** First pass staged the next area's bodies when its door opened,
so the room was occupied 42 m before the threshold. The playtest rejected it,
correctly: *"the message, audio, or enemies should not appear before you enter
a room or hallway, but they should appear as soon as you enter, so that you
aren't waiting around thinking it's broken."* Reverted in full.

The clip settles where the player actually was. The HUD read
`TRAINING · GO TO THE NEXT DOOR` for the whole four and a half seconds, and
that line only shows while the **current** leg's door is open — in the room it
reads `CLEAR THE ROOM`, and a door never re-closes. So the player was in hall 2
the whole time, looking through its open door at the empty room ahead. Nothing
was late. Instrumented across the threshold, every sound and every element:

| | when |
|---|---|
| door chime (`sfx.wave`) | **−0.00 s** |
| three bodies exist | **+0.00 s** |
| HUD reads `CLEAR THE ROOM` | +0.04 s |
| all three finished assembling | +0.28 s / 1.5 m |
| first round fired | +1.54 s |

What was long was the walk up to it. A door opens on the frame its area's last
man goes down, onto an area that is necessarily empty — so the tail of each
training corridor is time spent approaching a room you can see nobody is in:

| | before | now |
|---|---|---|
| hall 1 | 8 cells, **18 m** after its man | 6 cells, **10 m** |
| hall 2 | 10 cells, **18 m** after its rear man | 8 cells, **10 m** |
| room 1 | 10 cells, **14 m** | 9 cells, **10 m** |

3.3 s of dead corridor becomes 1.8 s, and the rule stays: nothing in an area
before you cross into it, all of it the frame you do.

> **Instrument the whole entry, not the thing you suspect.** Two rounds were
> spent on the room's population because that is what the report named. Wrapping
> every `sfx` method and logging the HUD, the banner and all seven text slots
> per frame across the crossing answered it in one run — and the answer was that
> none of them was late.

> **The harness lied twice, in the same way both times.** The probe swept
> `enemies` at the top of each frame and read `hall.cur` after it: the game's
> own frame had already crossed the door and placed the room's three men, so
> the broom killed them and the log said the room was empty. Read the crossing
> BEFORE the broom, and stop sweeping once it has happened.

## Three from the fifth playtest

**The two cue lines collided.** `TAP ANYWHERE TO SHOOT` is up from the first man in the area
who aims; `DODGE THE BULLET` arrives on the freeze while it is still there. Measured, the two
boxes overlapped by 0.3% of the frame and read as one four-line block. Moving the dodge line
would only have made a taller block: the freeze exists so the player can read three words and
step sideways, so while the world is held the dodge slot is now the ONLY text slot. One line in
`tutorCues`, after `tutorSpent` is decided, so the trigger reminder is not spent — it fades out
and comes back if they still have not fired. **0 of 31 held frames** have both legible.

**The needle sat at 7% of the frame and read as pointing nowhere.** It is a bearing laid flat on
the floor by `rotateX`; read against the ceiling at the top of the frame there is nothing for it
to be flat on. It moves to `top: 42%` — the seat the playtest asked for, just above the gun.
There is no gap it fits in cleanly (the banner runs 31-44%, the viewmodel starts at 50%, and the
needle is 104 px), and of the two the gun is the one to overlap: **the needle is only ever on
screen on a leg with nobody in it**, so nothing is being aimed at underneath it.

**The corridors after the tutorial hold one man per hundred metres.** Two runs of doors 1-7,
walked end to end:

| door | legs | path per leg | bodies per leg | longest empty run |
|---|---|---|---|---|
| 1 | 1 | 121 m | 1 | **109 m** |
| 2 | 1 | 115 m | 1 | **110 m** |
| 3 | 1 | 101 m | 2 | 52 m |
| 5 | 2 | 108 m | 1 | **104 m** |
| 7 | 2 | 115 m | 1 | **106 m** |

A player walks out of a training room holding three men into a hundred and twenty metres holding
one. The cause is a division: `doorBodies` is a whole DOOR's budget split across its legs, and
`legsEvery` (4) grows faster than `bodiesEvery` (2), so the count per corridor — the thing a
player actually walks — went 1, 1, 2, 2 and then back to 1 at door 5.

Two changes. `OPENING.perLegFrom/perLegEvery/perLegCap` put a floor under the split, **per leg**,
that never falls as the door number rises: 3 bodies in a corridor at door 1, one more every three
doors, ceiling 6. And `hallWave` spreads a leg worth three or more evenly down its stretches
instead of filling from the end, so the men stand along the corridor rather than in a heap at the
door. Re-measured:

| door | bodies per leg | longest empty run | empty share of the walk |
|---|---|---|---|
| 1 | 1.0 → **3.0** | 90 m → **29 m** | 76% → **28%** |
| 2 | 1.0 → **3.0** | 92 m → **31 m** | 87% → **32%** |
| 4 | 2.0 → **4.0** | 61 m → **48 m** | 41% → 57% |
| 5 | 1.0 → **4.0** | 96 m → **43 m** | 87% → **43%** |

> **It is how OFTEN, not how many.** `doorAlive` is untouched — one man on his feet at a time
> until door 4, two until door 9 — as are `EARLY.oneRoundDoors` (one enemy round in the air
> through door 5) and the three-second shot gap. The fight is the same shape; there is simply
> somebody in the corridor.

> Maps, plans and the full before/after are in the artifact **The First Five Doors**.

## Two from the sixth playtest — spacing, and the door group

**The door group was not a door group.** The last stretch of a leg is the
approach, and its share is the group you fight with the door in frame. Measured
over ten legs at doors 1-6: in **0 of 10** did the last man arrive after the
door came into view, and the door comes into view about 30 m out. It now waits
for the door — and getting there turned up four separate faults, each hidden
behind the last.

| | |
|---|---|
| the sight test was aimed at the door | The slab is an obstacle and stands in the doorway until the leg is clear, so a ray to the door's own position is blocked BY the door for the whole fight. It fired only after the door had opened. Aimed one cell short of the slab now: the floor the group stands on. |
| the allowance counted the plan, not what was owed | `quota` never moves, so a stretch's share was granted again every time the window slid over it — the third release of a leg, with stretch 3 already standing there, took the only thing still owed: the door group. The window sums `fill` now. |
| the stall watchdog called it early | 4.5 s of quiet is shorter than the walk from the last man to the last corner. It stands down while the only unspent share is the approach's and the door is not yet seen. |
| the approach was 16 m | The player first sees the door from the near end of it, which is the frame the group is released on, and `EARLY.firstSightM` wants 13 m of clear ground. `LEG.approach` is 5 cells. |

Result, 16 legs: **16 of 16** have the last man appear after the door is in
view, +7 to +10 m after it, with the player 32-35 m from the door.

**Half of every leg was empty and the rest were doubled up.** The quotas were
already spread evenly — the *placement* threw that away. The pool was "the
stretch the player is in, plus one", so a body funded by stretch 2 was placed
in stretch 5, because stretch 5 is where the player had walked to by the time
the allowance let it out.

| | before | after |
|---|---|---|
| a leg's stretches with nobody in them | 50% | **35%** |
| stretches holding two or more | 8 in 10 legs | **1 in 16** |
| men arriving within 6 m of the one before | 4 | **1** |
| first-sight refusals | 12 in 10 legs | **1 in 16** |

`L.fill` is what each stretch still owes; a release takes the first stretch at
or ahead of the player that still owes one, and stands the body there. Three
rules make it hold:

> **What is behind you is spent, and its body is dropped with it.** Every
> candidate in a stretch the player has finished walking fails the "never
> behind you" test, so the release burned forty tries and refused, over and
> over — 78 refusals in one leg. Carrying the body forward instead is no
> better: that is how one room ends up with two men while the room before had
> none. A leg you outrun is a quieter leg.

> **The spread starts at the SECOND stretch.** The opener comes out on arrival
> and the first-sight floor puts him a stretch ahead, so nothing can ever stand
> in the first one.

> **The remainder layers instead of piling.** `per` is 1 outside the slow-time
> school, so door 7's five-man leg with three rooms came out `[0,1,3,1]` — the
> loaded leg the playtest objected to. Raising the cap a layer at a time gives
> `[0,2,2,1]`.

> **A leg that owes nothing has an empty queue.** Found while chasing the last
> two stuck legs and it was real, not the harness: the player standing 1.5 m
> from the slab, nobody alive, every share spent, and one body still queued —
> and the door waits on an empty queue. 28 legs over doors 1-8 since: no leg
> failed to open its door.

## The encounter curve, and the door the power lands on

**A door is a list of encounters now, not a number of bodies.** An encounter is
a group of men who arrive together, and that is the unit the player answers.
One man is a sidestep and a shot; two is a sidestep that has to solve both;
three is the first thing a sidestep does not solve. `OPENING.encounters` is a
table for the first ten doors, because the shape of the first ten minutes is a
judgement and not an arithmetic:

| door | encounters | bodies | up at once |
|---|---|---|---|
| 1-2 | 1, 1, 1 | 3 | 1 |
| 3-4 | 2, 1, 1 | 4 | 2 |
| 5 | 3, 2, 1 | 6 | 3 |
| 6 | 3, 3, 2, 1, 1 | 10 | 3 |
| 7-8 | 3, 3, 2, 2, 1, 1 | 12 | 3 |
| 9-10 | 4, 3, 3, 2, 2, 1(, 1) | 15-16 | 4 |

> **`bodiesEvery` and `aliveEvery` are gone.** Two ramps for one question, and
> they disagreed: a door could plan four bodies and cap two of them on their
> feet, which turns a planned pair into two singles a beat apart. A group is
> the answer to how many, how often AND how many at once. The random clump of
> one-to-three in the release gate is gone with them — a group taken from the
> plan is not a clump, and every man in it still goes through the first-sight
> floor, so all three get their thirteen metres.

**A room is never empty; a corridor may be.** `featureStretch` — a vault's
pillared hall, or a chamber widened into an ordinary corridor — used to be paid
for only when the HEADLINE named it, so a leg whose banner said DOOR 4 could
widen into a room and put nobody in it. A playtest of the plans circled exactly
that, twice. The room now takes the second-largest encounter, and if there is
nothing left the door group lends it a man. Empty rooms across legs with one:
**3 in 11 → 1 in 10**. Empty corridor stretches are left alone deliberately —
they are the breath.

**The time button moves from door 46 to door 6.** It was solved from the speed
staircase: the door bullet speed first reaches `SPEED.unlockM`. That answers
*"when do rounds get too fast to walk out of"*, which is a real question and the
wrong one — what a sidestep cannot answer is not one fast round, it is three at
once, and that arrives forty doors earlier. `powerUnlockDoor()` solves the
encounter curve instead: the door after the first one that asks for a group of
`OPENING.unlockGroup`. Still derived, never typed.

| door | what is new |
|---|---|
| 1-5 | nothing. Gunners, and the loop. |
| 5 | the first three-man encounter — the wall |
| **6** | **slow time**, and nothing else that door |
| 7 | rusher — he does not fire, he arrives. What the power is *for*. |
| 9 | shotgunner &nbsp;·&nbsp; 11 shield &nbsp;·&nbsp; 13 heavy &nbsp;·&nbsp; then ~every 4 |

> `EARLY.gunnerOnlyDoors` is 6 so the power has its door to itself. `TYPE_INTRO`
> (balance.js) and `minDoor` (protocols.js) carry the same schedule and must
> move together. Verified end to end: door 6 builds the authored `slowteach`
> corridor, runs `slowStand` then `slowIntro` in the `slowroom` vault, the time
> button appears, and the school's volley climbs 2 → 3 over the doors after.

> The speed staircase keeps its own answer — still door 46, where bullets get
> genuinely fast and the curve levels off. Two questions, two answers, and
> `gen-balance-doc`'s door guard now knows both.

Measured over 10 legs of doors 1-5: **10 of 10** door groups arrive after the
door is in view, occupancy matches the plan leg for leg, and the one soft-lock
this turned up was the forfeit rule assuming a door group of one man — it
dropped two of a three-man group and the door then waited for ever on a queue
that could never empty. The rule is stated as an invariant now: **the queue is
exactly as long as the plan still owes**.

## Standing men stand still

The walk cycle ran on `moveSpeed`, which is what the `advance` state WANTS to
do — and it is non-zero for every body in that state. So a body pinned by the
script, a body whose heading has been zeroed because it is holding the door
approach or waiting for the player to enter its room, and a body walking into
a wall all marched on the spot.

It runs on measured displacement now: how far the body actually travelled since
last frame, in m/s, against `GAIT_MIN` (0.35). Below that the legs settle and
stay settled; above it the stride keeps pace with the ground actually covered
rather than running at one rate whenever the state machine is in `advance`.
Nothing in the arms is touched, so turning to face you and raising the gun are
unaffected.

| three pinned men, 1200 frames, player sidestepping | |
|---|---|
| biggest leg rotation | **0.0000 rad** |
| biggest firing-arm rotation | 1.511 rad |
| turn tracking the player | 360° |
| rounds in the air, peak | 2 |
| a walking body, control | gait 3.00 m/s, full 0.600 rad stride |

> **Measure against LAST frame, not the top of this one.** A held body is
> re-pinned AFTER the AI has had its turn (see the hold loop in `updateHall`),
> so a start-of-frame snapshot sees the drift and misses the correction. Last
> frame's final position is the pinned one, so the difference is zero — which
> is the truth about a man standing still.

> **A jump is a placement, not a step.** The stall watchdog re-routes a wedged
> body by moving it bodily to the approach ahead of the player. Divided by a
> bullet-time `sdt` that came out at **439 m/s** and sprinted his legs for a
> frame. Anything over a metre in one frame is not walking.

> The settle was a bare per-frame `* 0.9` — a different speed on every device,
> and it never reaches zero. It closes on standing at the same rate whatever
> the frame rate now, and takes the free arm with it so a body does not stop
> mid-swing.

## NEW RUN opened the LOAD GAME page, and nothing was watching the menu

**The bug.** `startNewRun` asks `makeSave` for a slot. At the save cap it
recycles a run that never went anywhere — but when all six have real depth
there is nothing to recycle, `makeSave` returns null, and the handler answered
that by calling `openSaves()`. So a player with six real runs taps NEW RUN and
lands on LOAD GAME.

The comment above that line said, of the version before it, *"a button that
answers a tap by showing you a different page has not done it"* — and then did
exactly that one branch further down. It now asks (`#askFull`): REPLACE THE
OLDEST, which takes the oldest slot and starts a run, or SEE MY RUNS, which is
the same page reached deliberately. Both answers do what the tap asked for.

**The real failure is that nothing had ever pressed a menu button.** Sixty-odd
probes in this harness, every one of them about corridors, enemies, cues or
HUD geometry. The menu is the first three seconds of the game and it had zero
coverage, so a broken primary button shipped and a playtester found it.

`menuflow.mjs` covers it now — 13 assertions, each one a real tap on a real
bounding box, across the three states the menu has (no saves, one save, six
saves with depth):

| | |
|---|---|
| the big button plays, with and without a save | 2 |
| LOAD GAME opens the list | 2 |
| NEW RUN: asks about the lesson / asks which run to replace | 3 |
| ...and both answers to that question | 2 |
| MODE, HOW TO PLAY, SETTINGS | 3 |
| REPLACE THE OLDEST takes the oldest slot and nothing else | 1 |

It fails loudly: `process.exit(1)`, and it did fail on the shipped build before
the fix.

> **A probe that seeds localStorage must seed it in `addInitScript`.** That
> re-runs on every navigation, so writing the slots from an `evaluate()` and
> then reloading silently puts the seed back — the depth assertion read six
> zeroes and looked like a game bug.

**And there is a `runall.sh` now.** `bash test/runall.sh [filter]` from the
repo root: it auto-discovers every `test/*.mjs`, runs them, and fails a probe
on a non-zero exit, a non-zero `errors:` line, or any line containing FAIL or
WRONG. Start `python3 -m http.server 8321` from the repo root first — it dies
on its own, and a stalled suite looks like a hang.

## The needle finishes before the door, and the vault stops narrating itself

**The sideways turn at the end.** The needle's path ENDS at the door, so inside
the last few metres all four lookahead samples clamp to the point the player is
walking onto — and a bearing to a point under your feet swings a long way for a
metre of lateral drift. `EARLY.wayDoneM` (10 m of path remaining) retires it
instead, and the existing 0.55 s fade takes it off. Measured on a walked leg at
door 12: it retires with **10.2 m still to the door**, biggest one-frame turn
while up **0.2°**, **0** frames snapping more than 20°, 6 frames caught
mid-fade.

**...and while proving that, the needle turned out not to appear at all.**
`wayArrowShows` asked `sum(quota) - released`, and `quota` is the PLAN, which
never moves. The moment the forfeit rule began DROPPING the share of a stretch
the player had walked past, that difference stopped reaching zero on any leg
anybody outran — measured, stuck at 1 from 45 m out all the way to the slab, on
every leg. Trying `fill` instead was the same mistake one level down: that is
where bodies will STAND, and a share can outlive the body meant to fill it.

> It asks `game.spawnQueue.length` now. The queue is the bodies themselves, and
> empty is the same test the DOOR uses to decide it may open — so the mark and
> the door agree by construction rather than by two pieces of arithmetic being
> kept in step. This is the second bug in three rounds caused by two numbers
> describing the same fact; prefer the one the rest of the game already reads.

**PILLARS ARE YOUR ONLY COVER is gone.** Same mistake `dimStrips` made from the
other end: the columns are the most visible thing in the room, they are on
screen before the banner is, and a card naming what the player is already
looking at is a card in the way of it. A headline earns its place by naming
something you could not see for yourself. `legPromisesPlace` went with it —
nothing in the fight read it any more, because a room is populated for BEING a
room (`featureStretch`) rather than for having been announced as one.

Two new probes, both in the repo's `test/` (13 there now, all passing):
`waydoor.mjs` walks a real leg at door 12 and asserts the needle never snaps
and never survives to the slab; `headline.mjs` asks `__ts.legPromise` for each
of the eight leg forms and asserts none announces PILLARS or a blank.

> `headline.mjs` started out walking forty doors, and rolled no vault in
> either of two runs — it was measuring the composer's dice, not the headline.
> Asking each form for its line directly tests the thing that changed. Where a
> probe has to walk to what it measures, seed a save: on a virgin profile the
> big button says PLAY and opens the mode board, so `page.tap('.go')` alone no
> longer starts anything. `waydoor.mjs` and `headline.mjs` seed `ts_s0_*` and
> `ts_saves` to get a CONTINUE; `gait.mjs` deliberately does not, because it
> needs the onboarding, and takes the PLAY → THE TUNNEL card path instead.

## The music was never missing, it was under the speaker's floor

Reported as "we seem to have lost the background music from the main menu and
the game itself." Every flag said it was playing: `ctx.state` running,
`music: true`, `musicRate` 1, master 0.9, and killing `setMusicVol(0)` took
the output to digital silence — so the music was the ONLY thing making a
sound and it still could not be heard.

The number that explained it was not a level, it was a spectrum. Tapping an
analyser onto everything that reaches `ctx.destination` and measuring peak
energy per band:

| band | before | after |
|---|---|---|
| 20-150 Hz (a phone cannot play this) | **-49.0 dB** | -45.1 dB |
| 150-300 Hz (nor this) | -59.9 dB | -45.3 dB |
| 500 Hz - 1 kHz | -79.3 dB | **-52.6 dB** |
| 2 - 5 kHz (a phone is loudest here) | -95.1 dB | -70.2 dB |

Thirty decibels more of the track lived in the two bands a 6mm phone driver
reproduces almost nothing of. Its loudest voice by a distance was the kick —
a 120→44 Hz sine at gain 0.42 — which is the one voice the player's hardware
cannot make a sound with at all, while the pad sat 23 dB beneath it behind a
750 Hz lowpass and the bass behind a 320 Hz one. On a laptop it was a mix. On
the only device this game is played on it was silence with a faint tick in it.

> **"Is it playing" is the wrong question, and every flag in the audio graph
> answers it yes.** The right question is how loud, and in which bands. This
> is the same failure as reading `quota` instead of the spawn queue: a number
> that describes the system's intent rather than the thing the player meets.

Three changes, all measured (`test/music.mjs`):

* **The track is voiced for a small speaker.** Pad and bass open their filters
  and each gain an octave-up partner, the arp moves up an octave into where a
  triangle's harmonics land, and the kick drops from 0.42 to 0.2 and gets a
  660 Hz click — the part of a kick a phone CAN render.
* **A low shelf on the music bus** (-9 dB below 170 Hz) frees the headroom the
  sub was hogging. Turning the music up used to clip on frequencies nobody
  could hear.
* **A compressor on the music branch alone** (-32 dB, 3:1, soft knee). The
  track's peak and its loudness were 21 dB apart — the kick set the ceiling
  while the tune sat far below it. The gunfire path is untouched and stays
  sharp.

Result: **-45.3 → -28.6 dBFS rms**, and the band a phone actually plays came
up **26 dB**. Peak 0.25 against a 0.62 gunshot, so nothing clips, in bullet
time either.

> Two measurement traps, both mine. Calling `sfx.update(ts, dt)` from a probe
> to fake bullet time makes the mixer fight the game's own per-frame call and
> reported a fictional 1.85 peak — drive it through `__ts.setTimeLocked`
> (added for this) and the real figure is 0.29. And `setTimeLocked` refuses
> while the onboarding is running, so a probe that needs bullet time must seed
> past the lesson AND past `SLOWMO.unlockDoor`.

### ...and the sound toggle was a second, separate bug

Asked directly: "was the music not playing because the audio toggle on the
start screen was off?" It was — and not for the reason the toggle suggests.

`setMuted` only moved the master gain. Every other sound in the game is made
on demand (a shot builds its voice when it fires), so raising the master is
genuinely enough for all of them. The music is the one thing that is a LOOP,
started once, and `startMusic` refuses to start while muted. Boot with the
toggle off and `musicSrc` was never created; turn the sound back on and you
got the entire game back except the music, on a menu measuring **-999 dB —
digital silence**. It reappeared only if you happened to start a run, because
a run flushes and a flush re-seats the loop.

> Two bugs wearing one symptom, and the mix work would have half-hidden this
> one: after the re-voicing, a player who never touched the toggle hears music
> and a player who did still hears nothing on the menu. Worth remembering that
> "I fixed the thing I measured" is not "I fixed what they reported" — the
> user's own guess found the half I had not looked at.

`setMuted` seats the loop on the way back up. The race is covered too: if the
buffer is still rendering, `buildMusic`'s own `startMusic` lands afterwards
and finds `muted` already false. `test/music.mjs` boots a second browser with
the toggle off, takes a gesture that is NOT the toggle so the render completes
while muted, then unmutes — it fails on the build before the fix.

## A recorded track, in two halves, and boots on the floor

The synth loop is **shelved, not deleted** — `buildSynthMusic`, with a banner
saying so and how to switch back. It keeps the phone-speaker voicing it was
given last round, and it is still the fallback: `loadMusic` falls back to it if
the mp3 will not fetch or decode, which also means the game still has music
with the network off.

**The track is 95.000 bpm exactly**, so a bar is 2.526316 s, and every loop
point in `MUSIC` is a bar line measured off the recording rather than read off
a clock. The tempo was fitted over the whole main section (94.96 and 95.00
score identically; the difference is 25 ms across a sixty-second loop, and a
listener needs about 40 ms to hear a stumble).

| section | plays | loops |
|---|---|---|
| **INTRO** (`intro`) | the menu, a run's opening, the whole lesson | bars 0-5, **15.158 s** |
| **DROP** | bar 7, the riser — not a section, just the way through | once |
| **DRIVE** (`drive`) | once the player is in the game proper | bars 8-31, **60.632 s** |

> **The opening loop is six bars, not the seven the timestamps suggest.** The
> intro is a TWO-bar pattern — heavy bar, light bar — so an odd loop length
> puts two heavy bars back to back and the pattern stumbles every wrap. Six is
> the nearest even count to the seven that was asked for.

The main loop is 96 beats exactly, so it cannot drift. Verified by
cross-correlating the onset envelope either side of the seam: **-4.6 ms**, and
the same test reports +51 ms when the seam is deliberately moved 60 ms.

**A section change waits for the next EVEN bar.** A cut mid-bar is the one
thing that would make this sound like two files rather than one piece of
music. Asked at ten different phases, every switch landed within 0.1 ms of a
two-bar line and never waited longer than the two bars it was waiting for.
`main` is entered on its riser — the slide before the beat drops — which plays
once and is then looped past. It fires when the lesson ends, or on the second
door of the run, counted from `runOpenDoor` so a save resumed at door 40 still
gets its opening.

**Levels were reset against the gunfire, not in the abstract.** A pistol runs
about -21 dBFS rms; `MUSIC_GAIN` 0.2 puts the bed at **-34**, twelve decibels
under the shooting. The synth loop keeps its own 0.78 — it is far quieter per
unit gain — and the music-bus compressor is now transparent for the recording
(`musicDynamics`): it existed to close the synth loop's 21 dB crest, and a
mastered track arrives with that job done.

**Bullet time muffles the track geometrically.** The lowpass sweeps
`muffleHz * (openHz/muffleHz)^ts`, not linearly: a linear sweep from 18 kHz
spends nearly all its travel above 4 kHz where moving it does nothing you can
hear, and with the world stopped it was still sitting at **3.8 kHz** — duller,
not muffled. Geometric lands on 420 Hz where the button does (507 Hz at the
ts=0.05 floor). Measured on the music alone: 2k-5k drops **30 dB**, 1k-2k
drops 14, and the bass is untouched — muffled means dull, not quiet, and the
bass staying is what makes it sound like music through a wall.

> `MUSIC_SLOW.slowRate` (0.72) is the tape-slow, and it is the judgement call
> in here. The synth loop ran at 0.3 — a full turntable stop, which reads as
> an effect. On a recorded track that is a lot. 1 leaves it at pitch and
> muffles only.

> **What I nearly shipped for nothing.** The music read 6 dB LOUDER in bullet
> time, so I made its echo send fall as time slowed — principled, and it
> changed the measurement by 0.6 dB. Measuring the music ALONE showed it holds
> level and the swell was the game's other sounds. Reverted. The echo send is
> 13 dB down; nothing routed that quietly is worth a per-frame write.

**Footsteps are spent by distance covered**, measured after the collision
solver — the same lesson as the enemies' walk cycle, from the other end. A
player grinding along a wall is not walking, and bullet time thins the cadence
without anything having to ask it to. One boot per 1.85 m; measured, 1.87.
They get their own convolver (two early reflections at 19 and 37 ms, then a
dark tail) rather than the global echo bus, which is 6% wet at full speed and
would have given them almost nothing.

Masters live in `Timeshard-sfx/`, with a README saying what was cut from what
and the exact ffmpeg lines. The uploaded track was 7.8 MB of 320 kbps; what
ships is 81.55 s at 112 kbps, **1.1 MB**.

## The playhead only goes forwards

Four notes from a playtest, and one of them was a bug I had shipped without
noticing.

**The track restarted when a run began.** `flush()` re-seated the music at the
top of its loop. That was right when the music was an abstract eight-bar synth
pad — a retry got a clean slate — and wrong the moment it became a track with
a shape: tapping PLAY re-cued the song you were already two seconds into, and
every retry did it again. flush drains the echo tail and cuts whooshes; that
is what it is for. It no longer touches the music except to seat it if nothing
ever did. Measured across menu -> run -> pause -> resume -> death -> menu ->
second run, the playhead now runs **2.1s to 28.3s without once going
backwards**, and the probe asserts exactly that: a step backwards is the
signature of this bug.

**The music came off the master.** Everything else hangs there, and the master
is what pause and death cut in 0.16s, because a frozen world must not drone.
The music wants the opposite — half a second out, most of a second back, into
wherever it has got to. So it has its own path to the limiter and three
envelopes with one job each: `musicGain` the player's slider, `musicDuck`
bullet time, `musicOut` the pause/death fade. `setMuted` has to take both
paths down now, which is the cost.

**No pitch bend in bullet time.** Tape-slowing a recorded track reads as a
broken record — the effect draws attention to itself and away from the thing
it decorates. `slowRate` is 1 and the muffle keeps its job, joined by a duck
(`MUSIC_SLOW.duck`, 0.42) so slow time takes the music down AND behind the
wall. Measured: 5 dB quieter, 2k-5k still down 30.

**One footstep sample, not two.** The uploaded pair did not match each other —
one simply was not the same floor — so the other is both feet, and the left is
the same recording a semitone and a half up. Two pitches off one sample is
also what makes them a PAIR: same boot, same floor, which is what a real
footstep pair has and two recordings do not. Light foot first. The cadence
went from 1.85 m to **2.75 m** per boot (a step every ~0.5s at full stick,
which is a walk rather than the jog it was), and the level from 0.42 to
**0.04**.

> **Measuring a quiet sound under a loud one measures the loud one.** I dropped
> the footstep gain by 8.5 dB and the analyser reported it 0.4 dB quieter,
> because the music bed peaks at -19 dB and a -28 dB boot is invisible in the
> sum at the destination. Silence the bed, measure each alone, then compare:
> the boot is 8-15 dB under the bed depending on which section is playing.

## Four notes, and two of them were the same mistake

**DODGE THE BULLET was said about rounds that were going to miss.** From a
clip: the round tracks down the far left of the corridor, the player is well
clear, and the words sit there for its whole flight and past it. Two faults
stacked. The prompt fired on any round that had flown `TUTOR.freezeAfter` of
its span — distance from the muzzle, nothing about where it was GOING. And the
only thing that retired it was stepping sideways `dodgeStepM` from wherever the
player stood when it froze, so somebody who dodged early had to dodge a second
time to clear a warning about a bullet that was never a threat.

`tutorRoundThreatens` projects the round along its own velocity, finds the
closest approach to the player and asks whether that is inside
`TUTOR.dodgeLaneM` (0.75 m — wider than the 0.32 m hit radius, because the
prompt has to arrive while there is still time to act on it). Nothing else
holds the world. Leaving the lane is what ends it, however far that took.

| | before | after |
|---|---|---|
| stands in the lane | taught | taught (896 of 900 frames) |
| steps clear early, round 1.2 m wide | **still told to dodge** | 0 frames |
| steps out mid-round | needs a second dodge | gone in 13 frames |

It is also once per SHOOTER now (`tutorDodgeTaught`), not once per area —
three men in a room is three first rounds — except at the barrier, where three
shots from one man at a player with no gun is the whole exercise.

**"Never behind you" was measuring the wrong axis.** The spawn rule read
`pz < player.pos.z + PACING.aheadMin`, which is exactly right in a straight
corridor and wrong the moment one turns: a leg that jogs leaves the player
facing along x with the rest of the corridor beside them, and a body four
metres further down z is then four metres past their shoulder — behind them,
while passing a test called `aheadMin`. `spineIx` compares progress along the
walked path instead, which is the question the rule meant to ask. Measured
across doors 1-15: **2 bodies of 64 released behind the player at door 9,
about 20 m away round a corner. Now 0 of 47.**

> Both of those are the same mistake: a cheap proxy standing in for the real
> quantity, correct in the case it was written for and quietly wrong outside
> it. Distance flown for "will it hit me". A z comparison for "is it in front
> of me". Neither announces itself, because the proxy keeps agreeing with the
> truth right up until the geometry changes.

**The edge marks are back for the main game.** They were off for the whole of
`beingLed()` — the lesson AND doors 1-8 — because the opening met one man at a
time. The encounter table outgrew that: door 5 puts three up at once. Off
during the lesson, on afterwards.

**The time button moved from door 6 to door 10** by changing one number —
`OPENING.unlockGroup` 3 to 4 — because the door is derived from the encounter
curve, not typed. Door 6 was BEFORE the rusher (7): the answer arriving ahead
of the question. Door 10 is after the rusher and the shotgunner (9).

**Aiming is facing, and nothing said so.** There is no aim control; you aim by
turning, which is the same drag that walks you. TAP ANYWHERE TO SHOOT retires
on the first shot, so a player who tapped at three men off the centre line was
left with a blank screen and a miss. The shooting lesson puts DRAG TO MOVE and
DRAG TO LOOK back on that first shot, and the new `aimed` event (a sixth of a
turn of look, or a metre of walk) takes them down — so a player who already
knew never sees them.

## The whole track is the loop, and the rooms have people in them

**The menu played the quietest fifteen seconds of the song forever.** INTRO
and DRIVE were two separate loops, so the start screen looped six sparse bars
and the game looped twenty-four busy ones and neither ever heard the other.
Both go round the full thirty-two now — `loopStart` 0, `loopEnd` 80.842 — and
DRIVE falls back into INTRO, which works because bar 31 is a fill and arriving
at bar 0 off the back of it is the resolution the fill already pointed at. A
section is now only a place to come IN:

| | comes in at | loops |
|---|---|---|
| `intro` | bar 0 | bars 0-5 — the tutorial, and only the tutorial |
| `full` | bar 0 | all 32 — the menu |
| `drive` | bar 7, the DROP | all 32 — a run |

> `musicPart` defaults to `full` rather than being set by `showMenu`, because
> `showMenu` is not called on a cold boot — the overlay is already up. The
> default IS the menu's setting.

**Starting a run does not rewind the track.** `full` and `drive` are the same
loop, so switching between them past the drop needs no edit at all — and
making one would rewind, which is precisely what read as "the soundtrack
restarted" the last time. Coming from INTRO, or from anywhere before the drop,
still gets the riser. Measured: a menu left running to 23.9s and then started
reads 30.9s five seconds later, not 20.

## More to shoot at, without more being shot at

The doors after the lesson measured **one or two bodies met across a whole
walked door**. The encounter table roughly doubled — door 1 from 3 bodies to
5, door 8 from 12 to 18, most-at-once from 1 to 2 at the start and 3 to 4 by
door 8.

The rule that was supposed to make that free is that the room shares ONE shot
clock (`lastEnemyShotAt`, `shotGap`), so five men fire no more often than one
— they each wait longer for a turn. It did not hold, twice, and neither would
have been visible without measuring the rate directly:

* **The hold ceiling was a stopwatch, not a queue.** A man who had waited
  longer than `gap + holdSlack` fired regardless of the clock, so a fuller
  room leaked shots past the thing meant to be spacing them. Door 8 went from
  **13.9 to 28.9 rounds a minute** with no difficulty dial touched. The
  allowance scales with how many men are actually waiting now: with four
  ahead of you, waiting four turns is taking your turn.
* **The clock was set to a ceiling the old rooms never reached.** `gapFrom` 3s
  permits 20 rounds a minute; the sparse early doors delivered about **14**,
  and 14 is the pace the game was actually played at. Filling the rooms found
  the ceiling for the first time. `gapFrom` is 4.3s now — 60/4.3 is 14 — so
  the dial says what the game was already doing.

Measured after both: **11.4 rounds a minute across doors 1-8** against 12.1
when the doors were near-empty, with bodies met up from 1-2 to 3-4.
`test/fire.mjs` watches the two numbers together, because either alone is
easy to satisfy and useless.

> `OPENING.unlockGroup` moved 4 to 5 at the same time, and that is bookkeeping
> rather than a decision: the time-button door is derived from "the first door
> that asks for a group this big", so a more generous table drags the whole
> slow-time lesson earlier unless the threshold keeps pace. Door 10 either way.

## A full save list, and news that reaches both doors

**Six saves made a card taller than the phone.** The title went up behind the
address bar and CLOSE went down behind the tab bar — a page you could neither
read the top of nor leave. The card is capped at `min(84vh, 700px)` and the
list is the only part that moves. Measured at 402x874: card 87 to 787, CLOSE
at 769, list 487 tall over 783 of content.

**Nothing is overwritten without being chosen.** `makeSave` used to recycle
"a run that never went anywhere" — the oldest save still at door 1 — when the
list was full. The reasoning was sound (NEW RUN must start a new run, and the
alternative was answering it with the LOAD GAME page, which is the
broken-button bug this area has been fixing) and the method was not: a save at
door 1 might be the run you started thirty seconds ago, and nothing on screen
said which one went. It returns null now and the player is asked.

That is only tolerable because the ask leads somewhere useful: the list opens
**worst first**, with the two likeliest called out by name (LEAST FAR,
OLDEST), a checkbox column, and one delete for the lot. Nothing is pre-ticked
— a pre-ticked list is a page you can agree to without reading. Sorting is
RECENT / DEEPEST with a direction toggle, and tapping the column you are
already sorted by reverses it.

**The news now reaches both doors and covers everything.** It counted MODES
only and sat on the archive button only, so finding a weapon said nothing
anywhere, and the badge you did get pointed at the page you READ about modes
on rather than the one you PLAY them from. `unlockNews()` is the single
source: the archive button counts everything, NEW RUN counts only the modes
(a badge promising a weapon and then handing you a mode board is a lie), the
page says what is new at the top, and the rows it means carry the mark.
PLAY THE NEW MODES closes the archive and presses NEW RUN — with a visible
ghost tap, which names the button the player will press themselves next time.

> **A tap inside the archive card is swallowed by the handler that makes it a
> card.** The PLAY link had to be answered above that early return, not down
> in the menu handler where every other button lives. It rendered, it looked
> right, and it did nothing.

## The walker is in the repo now

`test/walk.mjs` is a **capture, not a check**: it walks doors 1-5 leg by leg,
kills each body 0.7s after it appears, and writes the geometry, the plan and
every body's arrival distance to JSON. That JSON draws the published
floor-plan page. `runall.sh` skips it unless you name it (`bash
test/runall.sh walk`) because it takes minutes and asserts nothing.

It is in the repo because the previous capture was scratchpad-only — so when
the encounter table doubled there was no way to redraw the maps without
writing the walker again from nothing. Re-measured, doors 1-5, two runs, 12
legs, 67 bodies:

| | first pass | after the spacing work | now |
|---|---|---|---|
| men met per corridor | 1.3 | 3.2 | **5.6** |
| empty run to the door | 85 m | 31 m | 29 m |
| empty share of the walk | 73% | 25% | 25% |

The empty share stopped moving two passes ago and that is right — the walk to
the door is the breath before the door group. What changed is density inside
the rest of the corridor.

> Worth watching from that capture: **door 3 is the busiest thing in the
> opening** (eight men in a single corridor, in both samples), and the door
> group is now only **7 of 67** bodies — a tenth arrive in the last 25 m,
> where the door is in frame. The climax of a corridor is a smaller share of
> it than when corridors held three men.

## The link preview

Texting the link produced a one-line row with the 192px app icon in it. The
cause was not a bad tag, it was **no tags**: `index.html` had no `og:image`,
and with none Apple's link previewer falls back to the `apple-touch-icon` —
whose square shape is exactly what makes it choose the compact layout.

The full Open Graph and Twitter set is in the head now, and
`assets/social/og-card.jpg` is 1200×630 at an absolute `https` URL, which is
what gets the large card. Two things worth keeping in mind:

* **The image chooses the layout, not the card type.** `summary_large_image`
  with a square image still renders the compact row. Size and aspect are the
  lever; the tags only describe them.
* **Change the filename, not the file.** Every previewer caches hard and Apple
  will serve a stale card for days. Rename and update all four image tags
  together.

The card is generated from the running game rather than drawn —
`node tools/social/make-card.mjs` warps to a corridor door, finds the longest
straight run of the leg's spine, stands three men down it close enough to read
at thumbnail size, shatters the nearest, screenshots 260 ms into the burst with
the HUD stripped, and composites that under the wordmark. `test/social.mjs`
guards the tags and fetches the file to check it really is 1200×630, because
nothing inside the game changes when any of this breaks.

## NEXT UP

1. **Play the needle again.** The turn profile is now a ramp instead of a
   step, but two numbers are judgement calls nobody has felt yet:
   `EARLY.wayLookM` 14 m sets how early it leans, and the 4:3:2:1 weighting
   sets how hard. At the corner itself it reads 57 deg of a 90 deg turn —
   deliberately short, because the near samples are still on the straight —
   and reaches 83 deg two metres past. If that reads as under-committed,
   weight the far samples heavier before lengthening the lookahead.
2. **The small marks arrive at door 9 with no introduction.** The player
   asked for them "once the player has learned what the marks mean" — and
   nothing currently teaches that. A one-time line on the door they turn on
   would close the loop; it is deliberately not built, because it is a
   tutorial decision and those get confirmed first.
3. **`EARLY.waySettleS` is 0.7 s** and is now only a debounce. Nothing has
   measured whether a gap between two releases in one stretch can still
   blink the mark — the `owed` test should make it impossible, and that is
   an assumption, not a measurement.
4. **Doors 19-50 may read limp** after last session's ramp change.
   `RAMP.aimRange` is the knob; steepen it before touching `aimBase`. The
   regenerated table in docs/BALANCE.md now shows the real telegraph scale
   per door, which it did not when it was full of `NaN`.
5. **The encounter table is a proposal with two runs behind it.** Doors 1-6
   are hand-written and nobody has played them. `OPENING.encounters` is the
   whole dial: add a row, change a row, and `doorBodies`, `doorAlive` and the
   door the power lands on all follow. Watch door 6 especially — it doubles
   the body count of door 5 and hands over the button in the same breath.
6. **~50% of a leg's stretches hold nobody**, and that is now deliberate: an
   empty corridor between encounters is the breath. An empty ROOM is not, and
   1 in 10 still slips through — a leg whose room stretch was outrun before its
   share came out.
7. **serviceRun legs defeat the harness walker**, not the game. Their branch
   lanes make the spine-follower oscillate — 280-300 m walked on a 120 m leg.
   It predates all of this; a probe that reports one STUCK is usually reporting
   that, and `door.open`/`queue`/`fill` in the STUCK line say which.
8. **Watch the ammo economy.** Door 1 held one body and now holds three;
   door 6 held three and now holds ten. Every kill has a chance of a clip
   (`DROPS.clipRate`) and that curve was written against the old counts, so
   the opening may now be awash with pistol ammo — which is the one scarcity
   the whole game hangs off.
9. **The door group now arrives 7-10 m after the door comes into view**, with
   the player 32-35 m out. That is measured, not felt: nobody has walked into
   one yet. If it lands too early the dial is where the sight test aims (one
   cell short of the slab); too late, and `LEG.approach` is the lever.
10. **Ten metres of tail is a guess with a measurement behind it, not a
   measured answer.** 18 m read as too long; 10 m is two seconds and nobody has
   walked it yet. If it still reads as dead air the lever is the leg length in
   `LEGS` (6 / 8 / 9 cells), not the bodies — they were moved forward once
   already and are as close to the entrance as the sight lines allow.
11. **`e.stageZ` bodies** (the man staged in a vault room) hold fire until
   the player is through the near doorway. The stall watchdog arms them if
   nothing happens for `LEG.stallAfter`, but that path has never been seen
   in real play. `LEG.stallAfter` is 4.5 s, chosen from the shape of the
   problem rather than from play.

## The test harness — read this before writing a probe

**Run `bash runall.sh` before you say anything shipped.** 19 probes,
fastest-first, about eight minutes; a probe fails on a non-zero exit, an
`errors:` line above zero, or any line containing FAIL or WRONG. It starts the
server itself if there is not one. `bash runall.sh menu` filters by name.

**Cover the thing the player touches first.** Sixty probes into this harness,
every one of them was about corridors, enemies, cues or HUD geometry, and the
MENU had none — so NEW RUN opening the LOAD GAME page shipped and a playtester
found it. If a change can be reached from a button, there should be a probe
that presses that button.

**The menu and mode-selector probes now live in the repo, at `test/`.** `npm install` once
(playwright is a devDependency), then `npm test`, or `bash test/runall.sh
menu` to filter. `test/README.md` says what each one presses and carries the
conventions below. They were moved in because the scratchpad is per-session
and the harness kept being rebuilt from nothing — and because the menu is
the one screen where that loss had already cost a shipped bug.

**The mode selector is where choosing a game lives now.** PLAY and NEW RUN
open it, CONTINUE never does, and the menu no longer has a MODE control at
all. Its cards carry recorded gameplay clips from `assets/preview/`, remade
with `node tools/rec-previews.mjs`. Four of the five games are now gated on
tunnel depth — see `docs/MODES.md` for the gates and the three rules that
keep them honest, the third of which is that anybody who has already played a
mode keeps it whatever the gate says.

**Everything else still does not survive between sessions.** Most corridor,
enemy, cue and HUD probes are still scratchpad-only: last session's 45 files
were gone and this one started from nothing. Budget for that, or move them in
alongside `test/menu.mjs` as you need them — this round moved three
(`waydoor.mjs`, `headline.mjs`, `gait.mjs`), which is the whole cost of
keeping one: adapt its boot to the current menu and add it to `test/`.

What this session rebuilt, under the session scratchpad in `test/`:
`lib.mjs` (boot/tap/done), `walk.mjs` (the leg walker), `early.mjs`,
`arrows.mjs`, `late.mjs`, `ramp.mjs`, `archive.mjs`, `pips2.mjs`,
`pipsweep.mjs`, `fps.mjs`. Every file prints an `errors:` line.

Serve the repo root with `python3 -m http.server 8321`; the server dies on
its own, so check
`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8321/index.html`
before diagnosing anything else. Chromium, viewport 402x874,
`hasTouch`/`isMobile`. Always attach `page.on('pageerror')`.

Traps that cost real time, all of them mine:

* **Serve a FROZEN SNAPSHOT to any probe that runs longer than an edit.**
  A twenty-minute walk against the working tree picks up every change made
  while it runs and reports half of one build and half of another. Copy the
  repo to a scratch directory, serve it on a second port, and point long
  probes at that (`TS_PORT` in `lib.mjs`).
* **A dead player measures nothing.** Pin `player.iframes = 999` every frame
  in any loop that idles, including the ones that only wait for cues. The
  first arrows run reported "arrow off at every step from `exit`, and up on
  0 of 5000 walked frames" — all true of a corpse and of nothing else.
* **Wait on state, but never let a stopped clock be the only way out.** The
  dodge lesson STOPS THE WORLD until the player steps aside, so a loop
  capped in world seconds never terminates. Cap on frames as well.
* **`deviceScaleFactor: 2` costs eight times the frame rate** — 2 fps
  against 17 at dsf 1, on the same machine. Use 1. It also silently breaks
  any pixel measurement that indexes a screenshot with CSS-pixel
  coordinates: scale by `png.width / clip.width` or you sample the floor and
  call it the mark (a first pass reported 1.01:1 for every case).
* **Do not seed `Math.random`.** A 32-bit xorshift folded through `% 1e6`
  has short enough cycles that the leg generator's retry loops never
  terminate: the page hangs with no error, which reads exactly like a
  stalled harness. Variety comes from walking more legs.
* **The walker gets stuck in vault rooms**, whose exit jogs sideways out of
  a room wider than the spine. It burned 157 s of wall clock reporting "did
  not cross", which reads as a corridor bug and is a harness one. `walk.mjs`
  slides along the wall when it stops making progress, the way a player
  would.
* The PLAY button is **`.go`, a class, not `#go`**, and the playing state is
  **`'play'` or `'intro'`, never `'playing'`**.
* Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
* **Never pipe a long probe through `head`/`tail`.** When the outer timeout
  kills it, the pager dies holding everything and you see nothing at all.
  Redirect to a file and read the file.
* **`pkill -f "early.mjs"` in the same command that launches
  `node early.mjs` kills its own shell** — `-f` matches the whole command
  line, including the one about to run. Kill in a separate step.
* Wait on STATE, never on a clock. Game time runs far slower than wall clock
  headless; rates in world seconds via `__ts.worldClock()`.
* Measure the subject, not a proxy. A kill is `game.kills`, not
  `enemies.length` dropping.
* Never assert against the constant under test. Write the spec number out,
  and add a second assertion that the code still asks for it.
* `isFinite(null)` is `true`. It coerces to 0.
* `__ts.crossDoor()` teleports to `door.z + 2.5` — two metres closer than a
  real crossing, which hides the dead-room bug entirely.
* Synthetic `.click()` does nothing on overlay buttons; use
  `page.touchscreen.tap` on a `boundingBox()`.
* **A body that walks is not a body that teleported.** Any "did he move"
  metric scores a healthy gunner as broken. Sample the position on the frame
  he stops being shards and compare it to the frame he was born on: he
  cannot walk while he is a swarm, so anything in that gap is the bug.
* **Binning by straight-line distance mixes the approach with the departure.**
  The teaching leg is f7, r3, f4, l3, f4, r3 — so after the first corner the
  player comes back within eighteen metres of it, walking somewhere else. The
  first version of `turn.mjs` filed those samples in the same rows as the
  approach and produced a -43 deg "wrong way" in BOTH builds, which is the
  tell: an artefact that survives the change is usually the metric's.
* **A jump to a step is not the same as being there.** Walking the whole step
  list ends on `done`, which tears the tutor layer down — `body.tutoring`
  goes, `#tutor` computes to `display:none` — and jumping back to `corners`
  does not put it back. A z-order test then sampled bare corridor and reported
  the divider on top of a mark it could not see. Anything that needs the tutor
  layer rendered gets its own page.
* **Decide a z-order by DIFFING THE SAME PIXELS, not by a colour threshold.**
  Three readings in a row were wrong here: a patch near the box centre missed
  the mark entirely (it rotates), a mean over the strip was dominated by the
  halo, and a "is it red enough" threshold was a guess about the renderer.
  Screenshot with the thing on and off and count how many of the mark's own
  core pixels changed. Zero means it is on top.
* **A lateral run is two turns, not one.** `['r', 3]` is a jog: you turn into
  it and turn back out. Counting `moves` entries undercounts what the player
  feels by half, which is how a leg described as "three corners" walked like
  six.
* **A running CSS animation beats a transition on the same property, and a
  removed animation cannot be transitioned FROM.** This has now cost time
  twice in one session: the ring on the round had an opacity transition that
  had never run because `pinpulse` held opacity up, and the headline swap
  measured a dip that never happened for the same reason (0.78, steady, then
  the words changed anyway). If something with a pulse has to fade, cancel
  the animation — and expect the first frame to jump rather than ease.
* **Two easings pulling opposite ways settle at an equilibrium, not at
  either end.** A hold that eases toward zero AFTER the ordinary ease has
  pulled toward full speed does not stop the world; it parks it at whatever
  the two rates balance at. Measured 0.57, forever. Whatever wants to win has
  to own the target, not correct it afterwards.
* **Half a cell, not less.** Corridor cells are 4 m across, so an `onFloor`
  test with a 1.7 m half-tolerance leaves a 0.6 m hole between every pair of
  neighbours. A sidestep probe walked into one and reported a twelve-metre
  room pinched to 1.5 m.
* **"Not inside an obstacle" is not "on floor".** Everywhere outside the level
  passes that test, and out there a wall sits between you and everybody — so a
  cover probe happily reported perfect cover 6.5 m away, through the side of
  the corridor. Ask the leg for its own `cells`.
* **A round dying is not a round being stopped by the thing you aimed at.**
  The first bullet-versus-column test fired from six metres out, which that
  near the doorway is inside the side wall; it hit the wall at 1.8 m and the
  file called it a pass. Assert WHERE it died, against that column's box.
* **A field only the new build exposes measures nothing on the old one.**
  `way().world` is `undefined` on 429c151, and `undefined !== null` is true,
  so the first comparison reported 900 frames, a peak turn rate of zero and a
  head-test error of `NaN`. Compare on something BOTH builds draw.
* **`at`-placed bodies skip the obstacle test.** Anything authored into a
  plan — the tutorial's legs — is checked by nobody but the plan. If you add
  furniture to an authored leg, box-test its bodies against `__ts.obstacles`
  (`clip.mjs`).

Checks before any commit: `node --input-type=module --check < src/main.js`,
`grep -oE "^function ([A-Za-z0-9_]+)\(" src/main.js | sort | uniq -c |
awk '$1>1'` for duplicate definitions, and
`node tools/gen-balance-doc.mjs` if `src/balance.js` moved.

## Standing lesson

Twice this session the fix that was asked for was not the fix that was
needed, and only measuring the thing the player actually looks at told the
difference. The ammo pips were meant to want the readout's halo; the halo
helped the cartridge that was already legible and made the spent one worse,
and the spent one was the whole complaint. The opening corridors were meant
to be too quiet; walked twice over ten doors they were never once empty, and
the change that had been agreed would have loosened a safety rule in
exchange for nothing. Both times the proposed diagnosis was reasonable and
both times it was wrong about which half of the thing was broken. Measure
the half you are about to change, and measure the other half too.
