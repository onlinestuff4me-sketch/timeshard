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
| `unlockdefer.mjs` | Crossing the gate that collides with the slow-time school (5, CORRIDOR DUEL): the school owns the screen, so the announcement must be held in the queue rather than dropped. |

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
