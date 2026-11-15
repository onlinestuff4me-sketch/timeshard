# TIME SHATTER — read this first

Portrait-mobile first-person arcade shooter. Live at **https://timeshatter.app**.
The owner playtests on an iPhone and reports by screenshot, screen recording,
or a SEND LOG issue (GitHub label `playtest`). Changes are measured with a
probe, not eyeballed.

## Repository and deploy

- **This repo (`onlinestuff4me-sketch/timeshard`) is the only home of the game.**
  GitHub Pages deploys the repo root from `main` (`.github/workflows/pages.yml`,
  `CNAME` = timeshatter.app). What is on `main` is what players get.
- **Run `git remote -v` before pushing.** A stale remote URL ending in
  `physics-arcade-game` still "works": GitHub redirects it into
  `neon-grid-breaker`, a different game, and the commits vanish there.
- A push to any other branch deploys nothing. A deploy is confirmed by the
  Actions run for `main`'s head SHA, not by the push.
- **The live site runs the playtest build:** `PLAYTEST.on` and `SIGHT.playtest`
  in `src/balance.js` are `true`. That gives the title screen a PLAYTEST
  button and SEND LOG, and gives sight from door 1. Turn both off for a public
  release. Never embed a GitHub token: SEND LOG reads the key from the device's
  `localStorage` (`ts_gh_token`) only.

## Stack

- Buildless ES modules, no bundler. `index.html` holds the HUD, menus and CSS.
  `src/main.js` (~18k lines) is the frame loop, rendering, input, AI and hall.
  The other modules in `src/`: `balance.js` (every tunable), `protocols.js` (enemy and
  element registry, card copy), `genleg.js` (corridor generator), `tutorial.js`,
  `modes.js`, `runlog.js` (the SEND LOG report), `native.js`.
- Three.js **r170, vendored** at `lib/three.module.min.js`. No CDN.
- Audio is recorded: `assets/music/`, `assets/sfx/`.
- Pillar 8: materials and shader programs are created at boot only. Never
  create one mid-run; pool and reuse instead.

## The fence

**`docs/PILLARS.md` is the fence.** Anything that would change a line there is
a design decision. Ask the owner first. §1: slow time is a budget you spend
from a bank that kills refill. It is *not* "time moves when you do".

Other docs: `docs/ARSENAL.md` (floors, bosses, weapons, streaks, the progress
panel), `docs/BALANCE.md` (generated ramp tables), `docs/MODES.md`,
`docs/TESTING.md` (harness traps), `docs/BACKLOG.md`, `docs/HANDOFF.md`
(current state and open questions). Old session history: `docs/history/`.

## Run and test

```bash
npm install                        # once; playwright is a devDependency
bash test/runall.sh                # every probe; starts its own server on 8321
bash test/runall.sh spacing        # filter by name
TS_PORT=8362 bash test/runall.sh   # a second port for a parallel run
```

- Playwright drives the real game: Chromium at `/opt/pw-browsers`, viewport
  402×874, `hasTouch`/`isMobile`, `deviceScaleFactor` 1. `test/README.md` says
  what each probe presses. Hooks live on `window.__ts`.
- A probe fails on a non-zero exit, an `errors:` line above 0, or any line
  with FAIL. **Check the summary line ("all probes passed"). Don't grep for
  FAIL and treat a match as success.**
- **Wall clock is not game clock.** dt is capped at 0.05 and headless frames
  are slow. Wait on game state, frames or `__ts.worldClock()`, never on
  `waitForTimeout` alone.
- Seed `localStorage` in `addInitScript` (see `boot({ seed })` in
  `test/lib.mjs`). Set `timeshard_taught=1` to skip the onboarding. **Walker
  probes must seed `ts_s0_carded`** with the types already met, or a debut
  card freezes the world and the probe measures nothing.
- Pin `player.iframes = 999` in any loop that idles. A dead player measures
  nothing.
- `__ts.warpDoor()` changes only the door number. Reload the page for a
  fresh leg.
- Long probes (spacing, walkers) take minutes. Don't edit `src/` while one
  runs against the working tree.

## Conventions

- Tunables go in `src/balance.js` with the reasoning beside them. Comments
  record the playtest quote that motivated a change.
- A gameplay fix comes with a probe in `test/` and a row in `test/README.md`.
- No pull request unless asked. Keep model identifiers out of commits and
  repo files.
