# Probes

Playwright probes that press the things a player presses. They exist because
the menu shipped a bug — NEW RUN opening the LOAD GAME page — that sixty
probes about corridors, enemies and HUD geometry could never have caught, and
because the harness those probes lived in was in a per-session scratchpad and
is gone. **These live in the repo so the next session starts with them.**

```bash
npm install          # once — playwright is a devDependency
npm test             # every probe
bash test/runall.sh menu    # only probes whose name contains "menu"
```

The selector probes need the preview clips to exist — `node tools/rec-previews.mjs`
writes them, and they are committed, so a fresh clone has them already.

`runall.sh` serves the repo root on `TS_PORT` (8321) if nothing is listening,
and fails a probe on a non-zero exit, an `errors:` line above zero, or any
line containing `FAIL` or `WRONG`. Screenshots land in `test/out/`, which is
gitignored.

**A DEAD RENDERER IS NOT A FAILED CHECK.** This box draws WebGL through
SwiftShader, and under a long probe it sometimes takes the page down with it —
measured at **two runs in three of `dodge.mjs` on unchanged code**, which is
the definition of not being about the code. Playwright reports it as
`Target page, context or browser has been closed` plus a non-zero exit, which
is indistinguishable from a real failure unless somebody looks. So `runall.sh`
looks: a crash is **retried once**, and a probe that crashes twice is reported
as `CRASHED`, separately from `FAILED`, and counted separately in the summary.
One means the game is wrong; the other means the suite could not ask. If you
see a crash, re-run that probe by name before believing anything about it.

## What is here

| Probe | Presses |
|---|---|
| `menu.mjs` | The menu with a save on it: layout and tap targets, MODE opens the picker and changes the button without starting a run, ARCHIVE opens the archive, CONTINUE starts the mode it names, and the menu comes back the same shape after END RUN. |
| `menufirst.mjs` | The menu with **no saves** — a player's first sight of the game. PLAY rather than CONTINUE, no LOAD/NEW pair, an empty archive bar. |
| `menusmall.mjs` | Four phone sizes down to a 375×667 iPhone SE. Nothing clipped, nothing overflowing. |
| `modesel.mjs` | The mode selector from a standing start: PLAY opens it with no tutorial question, THE TUNNEL is the hero card, the other four are locked in unlock order and each says what opens it, a locked card refuses in place without starting anything, and the hero card starts the game. |
| `modesel2.mjs` | The selector with a history: CONTINUE names the most recent run across games, nothing is locked at 24 doors, the recently-played band is under the hero, the clips load 4:3 and play, and the tutorial checkbox actually arms the lesson on a brand-new save. |
| `unlocks.mjs` | LOAD GAME lists every mode's runs with each row naming its mode, and UNLOCKS has a MODES section that counts the gates and shows how far off each locked one is. |
| `duel.mjs` | NO RETREAT can be finished: 40 seconds of shattering everything that appears must field a wave, open doors and carry the player forward. It scored 2 bodies, 0 doors and z 0 before the placement fix, and deadlocks — floor empty, bodies owed, door shut — are counted and capped. |
| `duelwalk.mjs` | A capture, not a check, and skipped unless named. Stands in each of the first twelve NO RETREAT rooms from the first frame to the last body and records the strip, every man who arrives, what he is, when, and how far away. It is the floor-plan capture; the schedule in `docs/NO_RETREAT.md` comes from `duelramp.mjs`, which reads it out of the running game. |
| `duelramp.mjs` | NO RETREAT's three dials — bodies, fire, cast — and the rule that only one of them moves per room. Reads the schedule out of the running game for 24 rooms, checks the shape (groups ascend, five is the ceiling, three fire together at most, a debut arrives alone, a combination moves nothing, every cycle peaks higher than the last), and then stands in rooms 4, 10 and 24 to check the guns actually fire 1, 2 and 3 together at the gaps it promised. |
| `duelmeet.mjs` | Meeting a new type stops the world. Walks the run door by door to all five debut rooms, clearing each one on the way — `warpDoor` moves the room number and not the fight in front of you, and a forced door carries the last room's men into the next — then checks that the type's first act freezes time and fills the screen: its NAME in the announcing type, a two-word instruction, a thumb doing what the words ask, and a RING on whatever they mean (five of them for a shotgun blast). The rows must be in order, on screen, headline biggest, neither running off the sides; the armored unit must say SHOOT and show a press, and the shieldbearer must light the time button. Each card is then answered only with what it asked for, once per type and not once per body. |
| `duelschool.mjs` | NO RETREAT's opening lesson, played rather than described: the player arrives with no weapon, the first round stops the world with DODGE THIS and a ring on the round, stepping aside brings the pistol AND the second half — TAP HERE TO SHOOT, a ring on a man and a thumb pressing on his chest, no second thumb on the card — and SHATTERING A BODY puts both away — a shot that hits nothing does not, because the gesture without its consequence is not the lesson, and nobody shoots back while that card is up. Then the rules that keep it from nagging: the room that already said it does not say it again, a NEW room standing in a round's lane earns hearing it a second time, a third round never does, and two more rooms of shattering nothing do not produce a third telling. |
| `dodgewhy.mjs` | WHY the dodge coach spoke, as numbers rather than as an impression. Plays the opening rooms as a player who ACTUALLY DODGES — driving the real stick at a thumb's speed, not teleporting — and records, for every telling, how far along the round was, how close it was going to come with BOTH of them moving, and how many seconds were left. A telling on a round that misses by more than the lane, or with less than `teach.warnS` to go, is the bug this exists for: the shipped build fired the repeat 0.40 s before the round arrived. A player who dodges everything must hear the line once and never be corrected. |
| `duelheat.mjs` | HOW HOT EACH ROOM ACTUALLY IS — the numbers a player feels, which the schedule cannot tell you. Stands in rooms 4, 5, 6, 8 and 15 for 46 WORLD seconds each and counts the most rounds in the air at once, how fast they cross, how far out they are opened from and how close they end up. Door 5 has to reach three in the air, under 12 m, in under 1.2 s of flight, so that the button arriving at door 6 answers something; door 6 must be door 5 with a button in it; and a later cycle must beat both, or the opening is the hardest the mode ever gets. It also checks the two things that make a room answerable at all: the nearest a man with a gun ever got, and how far off your facing he was when he did — there is no look control here, so a man who has walked onto you cannot be turned to, stepped round, or seen. It PLAYS FORWARD rather than warping: `warpDoor` moves the room number and not the fight, and both ways round that were worse than the disease — leaving the last room's men measures bodies placed against another leg's geometry, and clearing them WINS the room, which opens the door and carries the player into the next one (room 5 quietly printed room 6's bullet speed). It answers the lesson first and spends its second dodge telling before measuring, because a twelve-second freeze landing mid-room silently halves the room it was measuring. |
| `duelloot.mjs` | THE GUN ON THE FLOOR. Wins rooms 1 to 7 rather than warping to 8, clears the shotgunner's debut room, and checks the room says how to take what he left: the world goes heavy without stopping, the corridor keeps walking, a ring goes on the gun, the instruction names it on ONE line without running off the sides, and a thumb says which way. Then drags across and checks that walking over it picks it up and puts the card away. |
| `duelrush.mjs` | THE RUSHER HOLDS ITS DISTANCE, BREAKS IT TO ATTACK, AND BACKS OFF AGAIN. Gives a room to a single rusher so the trace is one man's cycle rather than a crowd's, and stands still on purpose — a charge commits to where you WERE, so a probe that dodges never sees one land and never sees the retreat. Checks that it coils (there is a tell to read), that it actually charges (a stand-off it cannot break is a rusher that has stopped being one), that the charge ARRIVES (one that stops short is a telegraph with no consequence), that it coils from its holding distance rather than from wherever the last charge left it, and that no single visit inside the stand-off LASTS — measured in seconds, because it has to pass through there both ways and counting frames proves nothing. |
| `duelup.mjs` | THE DOOR-6 HANDOVER, played rather than described — the one moment this mode gains a verb. Wins rooms 1 to 5 honestly (the sequence fires on ARRIVAL, and `warpDoor` moves the room number and not the fight), then walks all seven beats: the pistol away and NEW UPGRADE / SLOW TIME on a still screen with no thumb under it, the room filling in behind the card, the card fading as they raise and fire ONE volley, the prompt with the world stopped, the press buying slow time with the rounds ringed, and the pistol coming back with a body to put it on. Reads are taken a beat after each state flips, because the card, the gun and the clock are all eased rather than snapped. |
| `duelwall.mjs` | WEDGED ON THE WALL BESIDE A DOOR. Holds the player three metres off the doorway's centre while the corridor pushes — which is what stepping aside for a late round leaves you doing — and checks the room says DRAG TO MOVE with a thumb pointing the right way, that dragging toward it gets them through, and that the card does not outlive the problem. Then the other half: a probe that stays on the spine and is carried out normally must never see it once, because the whole thing keys off PROGRESS rather than position. |
| `loadout.mjs` | THE BAG IS A SHELF PER WEAPON. Drops a weapon at the player's feet and stands on it, then holds the three promises of the playtest: the best gun you have found is in your hands, everything you walk over goes in the bag whatever you are holding, and running one dry reaches for the next thing in the bag rather than the blade. Emptied by FIRING, not by calling the fallback — a probe that calls the function tests the function. In the TUNNEL, because the duel reloads off a belt and is the one mode where the reserve is deliberately not a resource. |
| `rooms.mjs` | WHERE THE BODIES ACTUALLY STAND — the room, the corridor, or the door. `fire.mjs` answers "does the door spend its plan"; this answers "and where did it put it", which is the half nothing could see when the playtest said the rooms felt empty. Counts room-owed men placed outside the room (`strays`) and sight refusals, and fails a room that was funded and stayed empty. Walks forward from door 1 and never warps: `warpDoor` moves the door NUMBER and not the fight, so the first draft re-walked door 4's spent leg and called doors 6 and 8 empty. |
| `shield.mjs` | THE SHIELD IN THE DOORWAY. Both halves of the playtest are measurable and neither was measured: how far from the door slab he stands, and how much floor is left either side of him there — 0.00 m, once, in a 2.53 m corridor. Also the slew either side of the time button, in WORLD seconds, because the whole point of the slew being in world time is that bullet time buys you the flank. One pass off the live cast and one with a man placed by hand, since a walk can deal nobody past the unlock. |
| `switcher.mjs` | THE WEAPON SWITCHER, in the tunnel. A new gun goes into the bag and the hand, most recent first; a clip reaches the pistol wherever it is; a fourth gun pushes out the oldest find and never the pistol; each gun keeps its own rounds across swaps; no trigger during a swap; an empty gun leaves the rotation and the hand moves on. And a real touch swipe on the weapon name swaps without turning the camera. |
| `tempo.mjs` | THE TEMPO STREAK. Kills in tempo shorten reload and swap: x0.75 at 5, x0.5 at 10, x0.25 at 15, no reload at 20. A break drops it to zero; a walk through a cleared room does not break it (the window only runs while someone is alive); and the reload itself really is halved at 10 and instant at 20. |
| `meetcard.mjs` | THE DEBUT CARD, in the tunnel. A type this save has never met stops the world as he finishes assembling: ringed, named, what he does, and a hint only where it is not obvious (the heavy has none). The world clock does not move under it; a tap takes it down without firing; the same type is not carded twice, not after a reload either; and the gunner is never carded. |
| `blinker.mjs` | THE BLINKER. He moves on the trigger pull, not the round: a shot at him finds him gone, sideways and square to the lane (cut short by a wall, never cancelled), with his chest burning white while he is spent. A second round inside that window kills him; a shot wide of him does not move him; once the window closes he dodges again. |
| `keeper.mjs` | THE KEEPER'S ROOM, floor 1's boss on door 9's last leg. Door 9's first leg is an ordinary corridor; the last is his, and its exit does not open on an empty room. Walking past the seal shuts it and stands up the Keeper and his pair of shotgunners. He fires on his own clock (1.5 s in phase 1); the pair comes back 3 s after the second one goes. Three bait-and-punish hits: each is dodged and then lands, moving him to phase 2 (blink cooldown 1.2 s) and phase 3, which stops the world with a five-round volley hanging still until it lets go. The third shatters him and the pair goes with him. His shards hang in a stopped world and stream into the player; only then is slow time unlocked and the exit opened, and door 10 beyond it keeps the power. |
| `sight.mjs` | THE NO-MISSES STREAK AND SIGHT. The forgiveness rule walks 43 -> 30 -> 32 -> 10 -> 12 -> 10 -> 14 -> 0 exactly. Real rounds: a kill counts one, a round into the wall breaks it, a body shot on armor is a miss, and a six-pellet shotgun kill counts once. Every enemy carries a see-through twin; nothing shows before sight is owned, and once it is, nothing under 10 and fainter-to-sharper at 10, 30 and 50. |
| `runlog.mjs` | SEND LOG AND THE PLAYTEST MENU, with GitHub stubbed in the page (every request recorded, nothing posted). A run's kill, miss, pause and death are logged. The first SEND LOG queues the report and asks once for a key; saving the key posts it to the repo's issues API with that key, labelled `playtest`, carrying the kill, 50% accuracy and the events, and toasts LOG SENT. Offline, a send is kept and says it will go later; the death screen's SEND LOG then sends both without starting a retry. The title's PLAYTEST → SKIP TO THE KEEPER starts on door 9's Keeper leg. |
| `floors.mjs` | FLOORS. The map is 9/7/7/7/9 with each floor's last door marked; the HUD leads with the floor (F1, F2); crossing onto door 10 announces FLOOR 2; and door 10, the first out of the elevator, is the warm-up door (fewer men up at once) while doors 8 and 11 are not. |
| `leftovers.mjs` | THE SMALL BEATS. A known rusher gets a name tag over him (no card) that goes on its own; with the bag full, a sniper on the floor near you dims the last find's pill and only while it is there; sight at 50 rings the door approach while a wave is to come, not below 50 and not with nothing queued; crossing onto door 10 rides the elevator (FLOOR 2) and it lifts. |
| `kamikaze.mjs` | THE KAMIKAZE. A pack of three sets off exactly 0.35 s apart and none of them ever aims. Left alone, one arms at 3.5 m and his burst 0.5 s later kills the player. Shot beside a gunner, he pops and takes the gunner with him, and the player lives. |
| `frankenstein.mjs` | FRANKENSTEIN AND THE SEEKER. An ordinary one: a body shot clanks off, he fires a pair, one arm shot takes one arm, and the second takes him. PLAYTEST → SKIP TO FRANKENSTEIN lands in his room on door 16 with two bombers; both arms off and he rushes, one shot on the open chest stops him, the seeker forms on the floor, the exit stays shut until it is picked up, and then the hand holds a loaded seeker. Fired at a man off to the side, it turns and kills him; a refill gives one back. |
| `drone.mjs` | THE DRONE. With none up, nobody is marked; one up hovers above head height, holds its distance, never aims, and the HUD reads MARKED. A gunner's round then leads a player moving sideways by metres. One round on the hull brings it down and the mark lifts. SKIP TO THE DRONE lands in his room on door 23 with two gunners and a shotgunner; he takes exactly four hits, SIGHT is given, and the exit opens. |
| `spawner.mjs` | THE SPAWNER. A gunner shattered near a live dish hangs, refunds no bank, and stands up again after the hang; break the dish while he hangs and he stays down. SKIP TO THE SPAWNER lands in his room on door 30 with the six guards; a guard shattered there hangs; the first round on the dish hangs the boss and his guard stays down; he reforms with the room back at six; the second round ends him; the second life is given and shown on the HUD, the exit opens, and it saves exactly one killing hit. |
| `finale.mjs` | THE FINALE on door 39. His cooldown is 0.65 s, he takes three head hits, a spawner stands in his room with the five guards, and he sends a rocket or kamikaze of his own within five seconds. With his dodge held off: a body shot clanks, three head shots bring him down and he hangs under the spawner; break the dish during the hang and he stays down, RUN COMPLETE is announced, and the exit opens. |
| `tiers.mjs` | THE TIER LADDER, from a run on door 21. A gunner there is Mk II and fires a pair; the door's tier line reads GUNNER MK II · FIRES IN PAIRS; his first kill drops a Mk II pistol and walking over it upgrades the pistol in hand (pierce 2, shatter 0.5, HUD PISTOL II). Twelve rounds of theirs met head-on by a Mk II round: some break and some do not (it measured 6 of 12). A Mk II shotgun's kill knocks the gunner beside it out of his aim. |
| `duelbtn.mjs` | NO RETREAT's time button: absent in room 1, nothing slowing itself there, and then present — in whichever room the schedule hands it over, which the probe walks to rather than assuming — wearing its own charge with the big meter, drained while spending, refilled on kills, letting go by itself when the bank empties. The meter line that follows the tap must arrive PAIRED with the shooting cue — a ring on a man and a thumb on his chest, in the slowed room — because “SHATTER ENEMIES TO REFILL” says nothing about how, at the one moment the world has stopped to let them. |
| `facing.mjs` | A capture, not a check, and skipped unless named. Walks doors 3, 6 and 10 facing the direction of travel and bins how far off the way out that puts you — the measurement `EARLY.wayBackDeg` is set from. A corridor that turns reaches 117 degrees on a clean walk, so 90 would fire on 5.5% of ordinary walking and 120 on none of it. |
| `news.mjs` | The "something opened" badge on the title screen: it is up when a mode has opened unseen, opening UNLOCKS clears it, it stays cleared across a relaunch, and THE TUNNEL never wears a NEW badge. |
| `wayback.mjs` | Turn your back on the door and the needle returns, in a corridor that still owes bodies so the empty-leg rule cannot take the credit: down at 0 degrees, up at 180, still up at 120 because it latched, down again at 80, and DOWN at 161 when a man is marked off screen behind you — his mark wins. |
| `unlockbanner.mjs` | Crossing a gate with nothing else on the door (10, STAND STILL) puts the NEW MODE UNLOCKED card on screen, moves the high-water mark once, and leaves nothing queued. |
| `selscroll.mjs` | The selector's list scrolls, and a scroll is not a choice: pointerdown inside it is not default-prevented, a wheel moves it, dragging a locked card says nothing and starts nothing, and a real tap on one says so while a real tap on an open one starts it. |
| `unlockdefer.mjs` | Crossing the gate that collides with the slow-time school (5, NO RETREAT): the school owns the screen, so the announcement must be held in the queue rather than dropped. |
| `waydoor.mjs` | Walks a real leg at door 12 with the way-arrow up: it must retire well before the slab, never snap sideways, and fade rather than cut. |
| `headline.mjs` | Asks each of the eight leg forms for its banner line: none may be blank, and none may announce what the player can already see (PILLARS ARE YOUR ONLY COVER). |
| `gait.mjs` | Bodies that are not going anywhere stand still: three men the onboarding pins have zero leg rotation while still turning to face you and raising the gun, against a control that really is walking. |
| `dodge.mjs` | DODGE THE BULLET is about a bullet that is going to hit you: a player standing in the lane is taught, a player already clear is left alone, and stepping out ends it. Plus the shooting lesson putting the drag prompts back for a player who only ever taps. |
| `behind.mjs` | Walks doors 1-15 and asserts every body is released **ahead of the player along the path** (spine index, not z — a corridor that turns makes those different things), and that a body standing behind you lights its edge mark. |
| `social.mjs` | The link preview, which nobody playing the game can see: the Open Graph and Twitter tags are all present, `og:image` is an absolute https URL at 1200×630, and the file at the end of it really is a JPEG of that size. |
| `saves.mjs` | A full list of six: the card fits the phone and its middle scrolls, both sorts work and reverse, a seventh run is refused rather than silently overwriting one, and the pruning page ticks and deletes in bulk. |
| `newsbadge.mjs` | Both entry points carry the news, the archive says what is new at the top as one headed list and marks the rows it means, PLAY THE NEW MODES lands on the mode board, the board's own summary names the modes that opened and nothing it cannot open, and every badge clears once the page has been seen — including across a reload. |
| `fire.mjs` | The two numbers that must move in opposite directions: bodies met per door must go **up**, rounds fired per minute must **not**. Either alone is easy to satisfy and useless. |
| `music.mjs` | The whole audio surface. Taps the signal reaching the speakers and asks how loud the music is and **in which bands** — a track whose energy sits under 300Hz is silent on a phone however healthy the audio graph looks. Then: the track's two sections and that a change between them lands on a bar line; that bullet time muffles it (treble gone, bass kept) rather than ducking it; that footsteps are spent by distance covered and never by a player standing still; that the menu comes in ON THE DROP rather than on the sparse opening bars, the volume slider, booting with the sound toggle off, and that the beat drops when the tutorial ends. ~2.5 min. |

## The one that is not a check

`walk.mjs` is a **capture**, not a probe: it walks doors 1-5 leg by leg and
writes the geometry, the plan and every body's arrival distance to JSON. That
JSON is what draws the published floor-plan page. It asserts nothing, takes
minutes, and `runall.sh` skips it unless you name it:

```sh
OUT_JSON=/tmp/walk-a.json bash test/runall.sh walk
```

It is in the repo because the previous capture was scratchpad-only, so when
the encounter table moved there was no way to redraw the maps without writing
the walker again from nothing.

## Writing another one

`lib.mjs` has `boot()`, `boxOf()` and `done()`. Every probe must print an
`errors:` line — `done()` does it — and must attach `page.on('pageerror')`,
which `boot()` does.

Conventions that cost real time to learn, from `docs/HANDOFF.md`:

* Chromium, **402×874**, `hasTouch` + `isMobile`, `deviceScaleFactor: 1`.
  dsf 2 costs eight times the frame rate and silently breaks any pixel
  measurement made in CSS coordinates.
* **Seed `localStorage` in `addInitScript`**, not after the page loads — by
  then it has already read its saves.
* **A dead player measures nothing.** Pin `player.iframes = 999` every frame
  in any loop that idles.
* **Never seed `Math.random`.** Short cycles make the leg generator's retry
  loops spin forever, which reads exactly like a hung harness.
* Long probes should serve a **frozen copy** of the repo on a second port, or
  they report half of one build and half of another.
* **`page.tap('.go')` does not start a run on a virgin profile** any more —
  the big button says PLAY and opens the mode board. Either seed a save
  (`ts_s0_used`/`_mode`/`_doors`/`_rdoor`/`_at`/`_born` plus `ts_saves`) so
  it says CONTINUE, or follow PLAY with a tap on `#mslist [data-mode="hall"]`.
  A probe that needs the onboarding must take the second path and must NOT
  seed `timeshard_taught`.
