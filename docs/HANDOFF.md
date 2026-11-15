# Where this leaves off — 2026-11-15

TIME SHATTER, live at **https://timeshatter.app** from `main`. Read
`CLAUDE.md` first for the repo, deploy, stack and test rules. This file is
the current state and the open questions. The long session-by-session record
up to 2026-10-06 is in [`history/HANDOFF-2026-09.md`](history/HANDOFF-2026-09.md),
including its long harness section. The harness traps also live in
`docs/TESTING.md`, and every probe is listed in `test/README.md`.

## What is live

The **playtest build** (`PLAYTEST.on`, `SIGHT.playtest`). The PLAYTEST button
gives floor 1 from door 1, straight to the Keeper, the intro cards again, sight
on or off, and SEND LOG.

- **The tunnel** is the main game: five floors of 9/7/7/7/9 doors. Each floor
  ends in a gauntlet and a boss (Keeper → slow time, Frankenstein → seeker,
  drone → sight, spawner → second life, the Keeper again at door 39). Mk II/III
  enemies carry chest numerals and better drops. See `docs/ARSENAL.md`.
- **A door is a string of fights.** Legs are cut into ≤16 m stretches
  (`LEG.stretchMax`). Groups go into the widest gaps between the entry, the
  room and the door's fight, and small extra groups fill any gap over
  `LEG.encounterEveryM`. One group at a time (`LEG.oneAtATime`), and a group
  you walk past is carried forward, not dropped. Measured by `test/spacing.mjs`:
  the longest empty walk went from 52-114 m to 23-49 m. Doors now hold more
  bodies than before (door 8 legs: 18-23).
- **The progress panel**, top left: TEMPO (quick kills → faster reloads),
  STREAK (no misses → more slow time per kill), PARRY (a round passes within
  1 m, then you shatter its shooter within 2 s → PERFECT, +1.5 s, a bigger
  bank). A level banner flies into its row. The weapon switcher is centred
  between round ◀ ▶ buttons.
- **Debut cards** freeze on the ordinary view for 1.1 s, then zoom slowly to
  the panel. A rusher primes (coils, then charges) the moment his card closes.
- **Arms for the unarmed** (`ARMS_RELIEF`): knife only with no rounds and
  nobody up but unarmed types → two gunners stand up, each dropping a pistol.
- **Edge marks are darts** drawn as SVG and turned in JS. A rotated ▲ was
  being read as pointing the wrong way. The exit needle is SVG too.
- **SEND LOG** buttons read SENDING… / LOG SENT ✓ #n and ignore repeat taps.

## Open questions from the last playtest (2026-10-06)

- **The big exit arrow in two cases** (door 3 screenshot, door 5 recording)
  pointed behind the player while enemies were still owed. It only shows then
  when the player faces away from the path. `test/wayroom.mjs` never got it to
  point backwards from any floor cell. It is unconfirmed whether the player
  was facing back. Ask before changing it.
- One leg in nine still came out at 49 m empty (a planned pair never stood
  up); cause not found.

## NEXT UP — judgement calls nobody has felt yet

Carried over unchanged from the 2026-09 handoff.

1. **Play the needle again.** `EARLY.wayLookM` 14 m sets how early it leans,
   and the 4:3:2:1 weighting sets how hard. It reads 57 deg of a 90 deg turn
   at the corner and 83 deg two metres past. If that reads as under-committed,
   weight the far samples heavier before lengthening the lookahead.
2. **The small marks arrive with no introduction.** A one-time line on the
   door they turn on would close the loop. It is a tutorial decision, so
   confirm it first.
3. **`EARLY.waySettleS` is 0.7 s**, now only a debounce. Nobody has measured
   whether a gap between two releases in one stretch can still blink the mark.
4. **Doors 19-50 may read limp.** `RAMP.aimRange` is the knob; steepen it
   before touching `aimBase`.
5. **The encounter table is a proposal.** `OPENING.encounters` is the whole
   dial. Watch door 6, which doubles door 5's bodies and hands over the button
   in the same breath.
6. **Empty corridor stretches are the breath; an empty ROOM is not.**
   Re-check this under the new spacing.
7. **serviceRun legs defeat the harness walker**, not the game: branch lanes
   make the spine-follower oscillate. A STUCK report is usually that.
8. **Watch the ammo economy.** Door bodies have roughly tripled since
   `DROPS.clipRate` was written, so the opening may be awash with pistol
   ammo. That is the one scarcity the whole game hangs off.
9. **The door group's arrival point** is measured, not felt. Too early: the
   sight test's aim point. Too late: `LEG.approach`.
10. **Ten metres of tail after the door group** is two seconds that nobody
    has walked. The lever is the leg length in `LEGS`, not the bodies.
11. **`e.stageZ` bodies** hold fire until the player is through the near
    doorway. The stall watchdog arms them after `LEG.stallAfter` (4.5 s), a
    path never seen in real play.

## Standing lesson

Twice the fix that was asked for was not the fix that was needed, and only
measuring the thing the player looks at told the difference. On 2026-10-06
the "wrong-way" marks were placed and turned correctly; the triangle's shape
was the bug. Measure the half you are about to change, and the other half too.
