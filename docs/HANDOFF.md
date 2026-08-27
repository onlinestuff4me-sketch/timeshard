# Where this leaves off — 2026-08-27

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

**The archive spans game modes**, confirmed with the owner and now written
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
the floor turned down archived the enemy type, and `recordMet` calls
`saveProgress`, so it went to disk — while nothing ever reached the scene.
Measured at 0.68 refusals a leg over doors 1-10, so it was not rare, and the
opening doors ease their floor out to door 18, which is past the first
debuts. It now sits on the line that puts the body in the world.

Proven both ways, because moving it down could just as easily have stopped
the archive filing anything: with the floor forced to a value nothing can
satisfy, 40 of 40 calls refused, 41 refusals counted, 0 enemies in the world
and the archive unchanged in memory AND on disk; then one heavy placed
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
5. **`e.stageZ` bodies** (the man staged in a vault room) hold fire until
   the player is through the near doorway. The stall watchdog arms them if
   nothing happens for `LEG.stallAfter`, but that path has never been seen
   in real play. `LEG.stallAfter` is 4.5 s, chosen from the shape of the
   problem rather than from play.

## The test harness — read this before writing a probe

**It does not survive between sessions.** The scratchpad directory is
per-session, so last session's 45 files were gone and this one started from
nothing. Budget for that, or move the harness into the repo.

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
