# Levels — how a corridor leg is built

One generator, `src/genleg.js`, called by the game and by the level tool at
`/tool`. It is pure apart from `Math.random`: the occupancy grid is passed in
rather than reached for, so a caller can generate a whole run without a game
running underneath.

## Anatomy

A **leg** is one door to the next. It is a chain of **stretches** — a straight
run plus the turn that ends it — followed by the **approach**, the straight
stare down at the door.

```
start ──stretch──┐
                 └──stretch──┐
                             └── approach (4 cells) ── DOOR
```

Cells are `LEG.cellM` = 4 m. The corridor is one cell wide unless something
widens it.

## What can widen or bend it

| feature | when | what it does |
|---|---|---|
| **jog** | rolled between stretches | 3 cells lateral, 2 forward — the corner |
| **no-jog fallback** | if the rolls produced none | forces one right before the approach, so a door is always found around a corner |
| **chamber** | `corridor` and `atrium` forms, spine > 10 | widens a stretch to 5 cells with four pillars in two rows |
| **vault** | `vault` form, once per leg | a 4×4-cell pillared hall, one way in and one way out, exit offset so crossing it is the only route |
| **branch lanes** | 2 normally, 3 for a service run, 0 for gauntlet/vault | alternate routes that only ever move forward and rejoin the spine |
| **`straight`** | a leg that must be a straight shot | suppresses all of the above |
| **an authored plan** | the onboarding's seven legs | suppresses the generator entirely — see below |

Width is the axis a portrait phone does not have — see `docs/PILLARS.md` §5.
That is why the vault is four cells across and not eight.

## Authored legs

`genAuthoredLeg`, in the same file. A leg may carry a **plan** instead of being
rolled:

```js
plan: {
  moves: [['f', 7], ['r', 3], ['f', 4], ['l', 3], …],   // f b r l, in cells
  extra: [[4, 18], [5, 18], …],   // cells hung off the path: a room's width,
                                  // a fork's second lane. Leg-relative.
  approach: 4,
}
```

Moves read as instructions — "seven forward, then three right" — because that
is how a corridor is described. A list of absolute coordinates becomes
unreadable the moment somebody wants the first hallway one cell longer.

It returns exactly the shape `genHallLeg` returns, so `buildHallLeg` cannot
tell the difference and the tool draws and edits both with the same code. Each
change of direction becomes a stretch boundary, so spawn pacing treats an
authored corner exactly like a generated jog.

This is what the onboarding runs on, and it is the answer to a bug that came
back four times: a lesson that depends on a specific corner cannot be built by
something that produces that corner most of the time.

## Forms

From `src/protocols.js`. `corridor`, `serviceRun` (constant turns), `vault`,
`atrium` (mostly chamber), `gauntlet` (one long straight, no recesses).
`gallery`, `stairwell`, `spiral` are registered and not built.

## Who is in it

The leg's enemy budget comes from the leg, not from a number picked per door:
every stretch is worth a few bodies (`LEG.perCell`, growing per door), and the
approach is worth exactly one final group — the wave you clear with the door
in frame. A stretch's share is released when you **walk into it**, so the
fight travels with you and nothing piles up in front of the door.

### The room gets the crowd

Playtest: *"the hallways and rooms feel a bit too empty... more enemies should
appear in rooms especially, hallways can be tight so we don't have to increase
volume there."* Measured across doors 2–14, of 63 bodies met **19% stood in
rooms, 30% in corridors and 51% at the door** — the open space the player walks
into looking for a fight was the emptiest part of the leg, because it was
getting the leftovers: the biggest group guards the door and the room took
whatever the climax did not want.

Four dials answer that, and the first three cost no incoming fire at all,
because a leg shares **one shot clock** (`gapFrom`) — eight men in a room fire
no more often than three did, they each wait longer for a turn.

| dial | what it does |
|---|---|
| `OPENING.roomMul`, `roomAdd`, `roomCap` | the room's group, multiplied and topped up, **added** to the leg rather than taken off the corridor — so a hallway holds exactly what it held before |
| `OPENING.roomAlive` | how many may stand in the room at once, × the leg's ordinary ceiling. A 16 m pillared hall can hold a swarm where a 4 m corridor can only hold a queue |
| `OPENING.aliveMul` | the crowd ceiling for the whole tunnel |
| `LEG.lookahead` | how far ahead of you the plan may be spent — see below |

**Every cap is what the floor can physically hold, not what would be nice.**
Bodies are placed through four rules — ahead of the player, at least
`vaultSpawnMin` away, clear of the furniture, and past the first-sight floor —
and a room is sixteen metres deep, so only a handful of its cells qualify at
any moment. Asked for nine, a room placed six of them in the corridor either
side and refused thirty candidates doing it. Five is what a room seats.

**A leg with no room gets nothing extra, and that is the answer rather than a
gap.** Two attempts to give those legs more anyway are out rather than tuned,
and they failed identically: a tail of extra pairs on every door produced 29
sight refusals on door 7 and 32 on door 9, both legs stalled with the door
never opening and delivery down from 92% to 75%; the same bonus moved to the
door approach produced 32 on door 8 and shut that leg. A tight winding corridor
has nowhere for extra men to stand. **More bodies than the ground can hold is
not more fight, it is a leg that never ends.** The across-the-board half of the
playtest is answered by `aliveMul` and `lookahead` instead, which raise how
many of the *same* bodies are on their feet and need no floor that is not
already there.

**A room body goes in the room or goes back on the queue — while the room is
still ahead of the player, and not after.** The placement loop falls through to
wider pools when the tight one has no spot, and for a man the room is paying
for that drift *is* the bug: twelve stood outside the room against eleven
inside it, which reads as a plan delivered and plays as an empty room.

The second half of that sentence is not a hedge, it is the whole thing working.
Refusing unconditionally stalls the leg: the funding scan only looks **forward**,
so a room behind the player is never offered again, its `fill` never enters the
release window, and the door — which waits on an empty queue — never opens.
Measured, doors 5 through 9 all stopped at leg 1 of 2 and the walk delivered
36% of its plan. Insist while insisting can still work; let him drift once it
cannot. `test/rooms.mjs` counts the drift as `strays`, which is the honest
record of what the trade costs.

Two things this measurement changed that were not tuning:

* **The first-sight floor is a corridor rule, and a room is not a corridor.**
  Thirteen metres of clear ground is right where the alternative is a body four
  metres round a bend, and wrong in the one place on the leg that is open
  floor — a 16 m room cannot offer thirteen clear metres from most of itself,
  so most of its candidates were refused and its share was paid back as
  silence. Measured at door 4: funded for three, placed none, four stood in the
  corridor instead. A room body gets the room floor (`vaultSpawnMin`), and it
  gets it for **having** a room (`featureStretch`) rather than for the form
  being called `vault`.
* **A leg with one group left over now puts it at the front.** It used to go to
  the stretch nearest the door, so a leg with two encounters released *nothing*
  until the player had walked most of it: measured standing at the start of
  door 1 for fourteen world seconds, quota `[0,0,5,0,1,2]`, allowance 0, nobody
  at all. That is the "hallways feel empty" of the playtest exactly. The last
  group already guards the door, so the leftovers are the leg's opening — and
  an opening belongs at the start. A leg whose front is still empty borrows one
  man from the room: a quiet stretch is allowed as a breath, not as a first
  impression.

**`LEG.lookahead` is the dial that decides how populated a leg feels**, which
is not the same question as how many bodies it holds. At one it funded the
stretch you stand in and the next, and standing still at the start of doors 1,
3, 5 and 8 with nobody killed gave **three men up at every one of them** —
however deep the door. It is two now: the same plan and the same totals, spent
over three stretches instead of two.

Measured after all of it:

| | before | after |
|---|---|---|
| men up at once, standing still at doors 1/3/5/8 | 2, 3, 4, 5 | **5, 6, 8, 10** |
| of bodies met, share standing in a room | 19% | **36%** |
| ...in a corridor | 30% | 26% |
| ...at the door | 51% | 37% |
| room-owed men standing outside the room | — | **0** |
| doors spending what the table deals them | 92% | **100%** |
| rounds a minute, doors 1–8 | 3.6–8.0 | 8.1, against the 14.0 the clock allows |
| rounds that beat the room clock | — | 0 of 5 |

Twice the men on their feet and **less** incoming fire than before — which is
the shared shot clock doing exactly what it is for. `test/rooms.mjs` fails on
defects (a funded room left empty, room-owed men standing outside it, a leg
that never opens) and only prints the share, because a share is a ratio between
two things that both moved.

### The shielded man needs a way round him

Playtest: *"at door eight we introduce the shield enemy right in the doorway so
you can't get past him nor can you shoot him."* Measured, one stood **1.9 m
from the door slab, inside the approach, with 0.00 m of floor either side** —
the corridor is 2.53 m wide there and he is 0.94 m across.

The shield is the one type whose counterplay is *floor*: you beat it by
outpacing his pivot, and outpacing a pivot means having somewhere to walk to.
So he gets two placement rules nobody else needs (`LEG.shieldDoorM`,
`shieldSideM`) and is never the man guarding the door. And his slew is a
**pair** of numbers, not one: `ENEMY_TYPES.shieldbearer.slew` is 0.42 rad/s
before the time button arrives and 0.80 after — 24°/s, then 46°/s. He is
beatable on foot when you meet him and beatable with the power afterwards,
which is the power being worth something. Measured after: 0 of 4 in the
approach, ≥2.5 m clear either side, and the pair confirmed at 0.42 → 0.80 with
the live men agreeing with the dial.

> `timeUnlocked()` answers `tutorMay('timebtn')` while a lesson is running, so
> anything that walks through door 10 and then looks back at door 8 will be
> told the power is already in hand. That is the game being right about the
> state the walk created, and it cost a probe an afternoon: `test/shield.mjs`
> reads the dial **before** it walks.

**The opening doors override this.** Only gunners until door 3
(`EARLY.gunnerOnlyDoors`), and through that same door nobody fires while a
round is still on its way to you (`EARLY.oneRoundDoors`). Three doors, not
five: the loop is four beats long and does not need five doors to teach, and
the floor used to sit at 6 only because that was once the time button's door —
which held the whole enemy schedule back two doors after the button moved.
`oneBodyDoors` and `soloDoors` are gone; the encounter curve
(`OPENING.encounters`) answers how many, how often and how many at once, and it
opens door 1 with a pair, a pair and a single. See `docs/PILLARS.md` §3.

## Conditions and measures

A **condition** changes how the leg looks and what it costs: `fog`,
`blackout`, `dimStrips`. A **measure** is something the building does to you:
`alcoves`, `oneWaySeal`, `grinder`.

Both are gated by `impl` in `src/protocols.js`. `impl: false` covers two
cases — not built, and *built but not yet approved for the main flow*. Fog,
blackout and the grinder are all in the second category: reachable only
through **Settings → TEST**, and the composer cannot pick them at any door or
lifetime (re-verified over 400 runs × 30 doors on every change).

Conditions also carry a **tax** (`CONDITION_TAX`) that multiplies the scarcity
curves a second time — fewer clips, fewer floor guns, less time per kill, and
fewer bodies at once. A condition that only changes what you can see is a
lighting effect; changing what you can afford is what makes it a condition.

## The tool

`/tool` — desktop web, two modes: **LEVELS** and **TUTORIAL**.

### LEVELS

It imports `genleg.js`, `protocols.js` and
`balance.js`, so what it draws is what the game builds.

* every door as an overhead map, with the protocol that composed it
* paint corridor / room / pillar / cover, place entry and exit doors, erase
* **rotate leg** — pick a spine cell and everything past it swings 90° about
  it, carrying its pillars, covers, spawns and exit
* enemy spawns with type: drag, add, delete
* ~200 balance sliders bound to the live values, applied immediately so
  *Reroll layout* shows what a new number actually builds
* **Export JSON** emits layouts and balance overrides together

### TUTORIAL

The onboarding, editable, with the real game running it in the pane on the
right. It imports `src/tutorial.js` — the same module `main.js` consumes — so
the preview is not a mock-up of the lesson, it *is* the lesson.

* **the map** — the same overhead editor a generated door gets, applied to
  whichever tutorial leg is selected, drawn by calling the game's own
  `genAuthoredLeg`. Paint **floor** (a room's width, a fork's lane), drag the
  **path** — the leg's `moves` are re-derived from where you drop it, so a
  corner stays a corner rather than becoming coordinates nobody can read —
  place **enemies** and **pillars**, alt-drag to erase. The barrier, the start
  and the door are drawn but not painted: all three are derived, so they move
  when the geometry does instead of being separately maintained.
* **legs** — add, remove, rename; form, **turn order** (one man shoots and the
  next only starts when his round has gone past — the game reads `fireOrder` on
  every leg), and whether the leg starts with a barrier standing in it. A leg
  added here comes **with a path and a gunner**: one with no `plan` is one the
  map cannot touch, so "+ Add leg" used to make something only a text editor
  could finish. (`straight` is gone: an authored plan short-circuits
  `genHallLeg` before it is ever read, so the checkbox did nothing on any of
  the seven shipped legs.)
* **numbers** — every value in `TUTOR` on a slider, each with the reason it
  has the value it has in its tooltip
* **steps** — reorder, add, delete. Each carries:
  * the **advance condition**, chosen from a list rather than typed, because
    "moved 2.2 m" is not something a text box can express — plus its threshold
  * **what the player may do**: nine capabilities, each a checkbox. Weapon in
    hand, can fire, time button, time meter, whether freezing costs, ammo
    readout, whether enemies may fire at all, whether the spawn queue runs,
    and the door/enemy HUD line
  * **what the step brings with it**: place one gunner, place the squad, drop
    the barrier, open the door, show the dotted divider
  * **the text**: any number of cues, each with its words, which of the five
    slots it sits in, whether a pointer runs to the button or up to the meter,
    which hand animation plays, whether it pulses, and — this is the part that
    matters — the beat it **appears on** and the beat it **leaves on**
  * a **threshold** that may be a number *or the name of a mark* —
    `firstCorner`, `secondRun`, `finalRun`, `forkEnd`. Marks are derived from
    the leg's path on every load, so naming one is how a lesson says "ends at
    the corner" and stays right when you drag the corner
* **preview** — the real game in an iframe at `?tutorpreview=1`. *Restart*
  reloads it with the current edit; *jump to step* drops the running game
  straight onto a beat with that beat's furniture built; the strip underneath
  reports the live step, the beats that have fired, and what the player may
  currently do

* **warnings** — what this spec will do wrong, said out loud, above the steps.
  Every check is a failure somebody actually hit with nothing on screen to
  explain it: two steps with the same id (the sequence is walked by id, so it
  loops back and never ends), a cue hung on an event its step never fires (a
  blank lesson), a condition whose machinery nothing sets up (a barrier nobody
  raises; a `cleared` step with nobody on the floor, which ends on its first
  frame), a last step that ends on a condition, an unknown mark name, and a
  path that crosses itself. They are warnings, not refusals — a half-finished
  sequence is a normal thing to be looking at while you edit one.

The **beats** a cue can key off are `enter`, `held` (the world stopped
mid-telegraph), `freeze` (the player stopped time), `dodge` (a round went
past), `kill` (they dropped one), `meter` (the meter warning landed), `resume`,
and `advance`. That pair
— appears-on and leaves-on — is the whole of a cue's life, which is why
`TAP TO SLOW TIME` can be made to vanish the instant the button is used
without anyone touching `main.js`.

**Revert writes through the spec, it does not replace it.** The map is handed
the spec object once, at boot, and keeps its own reference. Rebinding the
variable left the two views editing different objects: the rails read the new
one, the map read the dead one, and every floor cell, pillar, enemy and path
drag after a revert went somewhere nothing would ever save — the map's own HUD
counting cells against a store that never changed. If two panes share a live
object, mutate it; never re-point one half of it.

Nothing is written back to the repo from the browser. The export is a patch to
hand back, and now carries the tutorial spec alongside the layouts and balance
overrides.

### The preview cannot leak

The tool writes its edited spec to `localStorage['ts_tutor_override']`, and
`loadTutorial()` reads that key **only** when the URL carries
`?tutorpreview=1`. Without the flag it does not look. So an afternoon of
editing cannot reach a real run on the same browser — verified by a test that
plants a deliberately absurd override and confirms an ordinary boot ignores
it.
