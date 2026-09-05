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

## What is here

| Probe | Presses |
|---|---|
| `menu.mjs` | The menu with a save on it: layout and tap targets, MODE opens the picker and changes the button without starting a run, ARCHIVE opens the archive, CONTINUE starts the mode it names, and the menu comes back the same shape after END RUN. |
| `menufirst.mjs` | The menu with **no saves** — a player's first sight of the game. PLAY rather than CONTINUE, no LOAD/NEW pair, an empty archive bar. |
| `menusmall.mjs` | Four phone sizes down to a 375×667 iPhone SE. Nothing clipped, nothing overflowing. |
| `modesel.mjs` | The mode selector from a standing start: PLAY opens it with no tutorial question, THE TUNNEL is the hero card, the other four are locked in unlock order and each says what opens it, a locked card refuses in place without starting anything, and the hero card starts the game. |
| `modesel2.mjs` | The selector with a history: CONTINUE names the most recent run across games, nothing is locked at 24 doors, the recently-played band is under the hero, the clips load 4:3 and play, and the tutorial checkbox actually arms the lesson on a brand-new save. |
| `unlocks.mjs` | LOAD GAME lists every mode's runs with each row naming its mode, and UNLOCKS has a MODES section that counts the gates and shows how far off each locked one is. |
| `news.mjs` | The "something opened" badge on the title screen: it is up when a mode has opened unseen, opening UNLOCKS clears it, it stays cleared across a relaunch, and THE TUNNEL never wears a NEW badge. |
| `unlockbanner.mjs` | Crossing a gate with nothing else on the door (10, STAND STILL) puts the NEW MODE UNLOCKED card on screen, moves the high-water mark once, and leaves nothing queued. |
| `selscroll.mjs` | The selector's list scrolls, and a scroll is not a choice: pointerdown inside it is not default-prevented, a wheel moves it, dragging a locked card says nothing and starts nothing, and a real tap on one says so while a real tap on an open one starts it. |
| `unlockdefer.mjs` | Crossing the gate that collides with the slow-time school (5, CORRIDOR DUEL): the school owns the screen, so the announcement must be held in the queue rather than dropped. |
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
