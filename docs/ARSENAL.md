# The Tunnel — floors, rooms, and the arsenal ladder

**A proposal. Nothing here is built.** It answers three playtest directions:

1. *Levels full of doors, separated by elevators* — five floors of 5–10
   doors; reach the last door, beat a gauntlet, ride up.
2. *Kill order that emerges from the mix* — which types, how many of each, and
   how the mix changes wave to wave inside one room.
3. *Get stronger along with them* — no boons. Every enemy type climbs Mk I →
   Mk II → Mk III, and each Mk drops a stronger version of the weapon he
   carries, built to answer exactly what got harder about him. You struggle
   when he levels up, and then you take his gun.

The numbers are checked by a model, `tools/sim-arsenal.mjs`, run against the
live dials in `src/balance.js` (bullet speed per door, the room's shot clock,
the slow-time school's volleys, group sizes, the bank and scarcity curves).
**The model changed the design more than once**, and those findings are in
§5. They are the most useful part of this document.

```
node tools/sim-arsenal.mjs            # every Mk debut: struggle, then relief
node tools/sim-arsenal.mjs --waves    # the kill-order recipes
node tools/sim-arsenal.mjs --matrix   # new enemy traits x new answers (§7)
node tools/sim-arsenal.mjs --newcomers  # kamikaze, frankenstein, drone (§8)
```

Both exit non-zero if a row leaves its band.

---

## 1. Floors and elevators

| floor | doors | what debuts | the elevator gauntlet |
|---|---|---|---|
| **1** | 1–6 (6) | gunner, rusher, shotgunner | three waves of the floor's cast |
| **2** | 7–13 (7) | shield, **slow time (10)**, heavy, sniper | the first gauntlet you need the button for |
| **3** | 14–20 (7) | bomber, shotgunner II, armored, rusher II, rocketeer, shield II | the floor's Mk IIs, mixed |
| **4** | 21–28 (8) | gunner II, laser, heavy II, sniper II, bomber II, armored II, rocketeer II | a clock in every wave |
| **5** | 29–37 (9) | laser II, then every Mk III | shield III and laser III, held back for this |

- **One new thing per door** still holds, and "new" now includes a Mk. Doors
  with no enemy debut carry the protocol debuts (forms, conditions, measures),
  as they do today.
- **The slow-time unlock stays where it is derived** (`powerUnlockDoor()`,
  door 10) and its ten-door school sits across floors 2 and 3.
- **Difficulty rises, then drops back at each floor.** The first door out of
  each elevator should step the pressure dials back a notch (group size and
  shot gap, not bullet speed, which is the staircase's job). You get to
  enjoy the weapons you took off the last floor for one door before the
  next floor starts asking. This is Hades' rhythm: each biome eases in, then
  climbs.
- **The gauntlet is the floor's exam.** It locks, runs 3–4 waves, and each
  wave is a kill-order recipe (§3) built from that floor's cast at its newest
  Mk. It is where the floor's weapons pay for themselves.

Floor sizes are a dial: `FLOORS` in the model. Moving a door moves every check.

## 2. Rooms: lock, assemble, wave

- **The room seals** at both ends when you step in. The one-way seal
  (`oneWaySeal`) already exists; this is that measure, made the rule for
  every combat room instead of a protocol.
- **A wave assembles all at once**, every body visible, using the red-shard
  assemble animation that already plays for each spawn. Nobody is hittable until formed,
  so the first second of a wave is a free read of the room: who is here, and
  in what order you are going to take them. That read is the Hades/Returnal
  moment you described.
- **2–3 waves per room, each a different mix** (§3). The next wave starts
  assembling when the last man of this one drops, or when one is left, once
  the floor is late enough that overlapping pressure is the point.
- **Portrait constraint** (`PILLARS.md` §5): a wave assembles in the front
  arc. At most one man assembles off-screen, and he is announced by the edge
  arrow and his assembly sound. "Surrounded" comes from numbers and timing,
  not from peripheral vision.
- **Budget to check:** a body assembles from 156 shards (`N_INIT + N_LATE`)
  and `SHATTER.assemblePool` is 768. A seven-man wave assembling at once needs
  ~1,100, so the pool grows at `warmUp()` or wave bodies use fewer shards.
  It must not be allocated at runtime (`PILLARS.md` §8).

## 3. Kill order

Every man fires until he is dead, so a wave's cost is *Σ (his threat × how
long he stayed alive)*. That is the weighted-shortest-job problem from
scheduling. Its textbook answer is to kill in descending *threat ÷
time-to-kill*. It stops being the answer the moment a kill hands you a better
gun, so the model tries every order. A **recipe** is a wave whose best order
is not nearest-first, and is at least ×1.30 cheaper in dodging:

| recipe | door | mix (nearest first) | best order | worth |
|---|---|---|---|---|
| **the clock** | 23 | shield · 2 gunner II · laser at the back | laser first, shield last | ×2.00 |
| **take his gun** | 20 | 2 shield II · 2 gunner · bomber behind them | bomber first, then the plates with his launcher | ×1.92 |
| **plated screen** | 24 | 2 shield II · 2 gunner II behind | the pair first, over the plates | ×1.47 |
| **close pressure** | 19 | 2 gunner near · 3 rusher II far | the rushers, who start furthest away | ×1.38 |

**What makes a mix a question (all measured):**

- **A clock.** Laser and rushers. They get worse while you do something
  else, so they jump the queue however far away they are.
- **An expensive screen.** Plates. Walking round a shield is a second the
  men behind it spend firing.
- **The answer in someone else's hands.** Rusher, shield and laser drop
  nothing; the shotgun, launcher and rocket answer them. A bomber behind
  shields is a reason to go for the back of the room first.
- **Not a cheap screen.** Behind three gunners, no anchor was ever worth
  shooting first: not a Mk II sniper, a Mk III heavy or a Mk II rocketeer
  (×1.00–1.07). Quick kills are always right to take first, so gunners in
  front are a warm-up, not a question. And a sniper is a low priority until his
  round cannot be walked out of. At Mk I he fires once every four seconds
  and is the slowest man in the room to kill.

**Wave-to-wave inside one room:** change *which recipe*, not just *how many*.
Wave 1 teaches the room (a warm-up screen), wave 2 asks the question (a clock
or an expensive screen), wave 3 hands over or demands the answer (take his gun).

## 4. The arsenal ladder

**Each Mk moves one axis, and his drop answers that axis.** The pairing is
the whole design: the gunner fires in pairs, so his pistol breaks rounds in
the air; the armored man advances, so his rounds crack plate and rock him back.

### Enemies

| type | Mk II | Mk III | drops |
|---|---|---|---|
| gunner | **pairs**: two fire together, less often | pairs, and rounds ×2.0 speed | pistol |
| rusher | **closing**: 4.4 m/s | 4.9 m/s | nothing: the shotgun answers him |
| shotgunner | **pattern**: 7 pellets, wider, from 10 m | both barrels | shotgun |
| shield | **coverage**: turns faster, a 5 m walk round | 7 m, and fires faster | nothing: the launcher answers him |
| heavy | **burst**: 5 rounds | 6 rounds, more often | burst rifle |
| sniper | **reach**: rounds ×3.6, a round you cannot walk out of | ×5.0, from 26 m | rifle |
| bomber | **area**: 3 m splash, more often | two lobs | launcher |
| armored | **advance**: fires on the move, closes | faster, from 9 m | **AP rifle** (new: see §5) |
| rocketeer | **tracking**: harder to break, more often | a pair | rocket |
| laser | **charge**: 2.0 s | 1.6 s, from 24 m | nothing: the rocket answers him |

### Weapons

Every Mk II and Mk III carries a **stat** on the axis and a **trait** on the
threat side. §5 explains why the trait is not optional.

| weapon | Mk I (shipped, plus) | Mk II | Mk III |
|---|---|---|---|
| pistol | as shipped | pierce 2 · **shatter** 50% | pierce 3 · a double-tap that walks · shatter 65% |
| shotgun | as shipped | 9 pellets, fuller cone · **stagger** | 12 pellets, 4 shells · stagger · shatter 40% |
| burst rifle | **sweep**: the burst walks across a line of men | 4-round · shatter 35% | 5-round · pierce 2 · shatter 50% |
| AP rifle | the burst rifle, and **body hits crack plate** | 4-round · stagger | 5-round · pierce 2 · stagger · shatter 30% |
| sniper rifle | **shatter** 40% | pierce 5 · 3 rounds · shatter 70% | faster · shatter 85% · **a hit breaks a laser's charge** |
| launcher | as shipped | blast 8 m · stagger · shatter 20% | two lobs · shatter 45% |
| rocket | as shipped | guided · stagger | a guided pair · shatter 45% |

- **Shatter:** your round breaks his in the air. A volley answered with a
  round instead of a step, which turns dodging into ammo. That is
  `PILLARS.md` §2's currency, and it is in the game's name.
- **Stagger:** a blast, a cone or a hit on plate knocks the men beside the
  kill off their aim; they restart their telegraph.
- **Drops:** the first kill of a new Mk always drops his weapon (the debut
  guarantee), and after that `SCARCITY.weaponDrop` decides as it does today.
  A higher Mk replaces yours. The same or a lower Mk is a clip. **Everything
  resets per run**: the flat start (`TUNNEL_META.md` §2) is untouched. The
  climb happens *inside* a run, and it is earned by meeting the man who
  carries it.

### The ladder, checked

**P** = seconds of dodging a kill costs. **R** = bank spent per kill ÷ bank
a kill refunds (above 1 the fight is eating your bank). **x** = how many of
him at once in his debut room.

The rules for each Mk debut:

- **Felt:** the new Mk, met with what you had, costs ≥1.25× the last Mk fought
  with its own weapon *at the same door*.
- **Relief:** his drop cuts that by ≥25%.
- **Caught up:** the relief puts you within 0.7–1.35× of where the last Mk had
  you.

| door | enemy | axis | m/s | x | last Mk P | struggle with | P | R | relief with | P | R |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | gunner I | debut | 4.8 | 2 | – | pistol I | 0.13 | 0.00 | pistol I | 0.13 | 0.00 |
| 3 | rusher I | debut | 4.8 | 3 | – | pistol I | 0.15 | 0.00 | pistol I (footwork) | 0.15 | 0.00 |
| 5 | shotgunner I | debut | 5.6 | 4 | – | pistol I | 0.14 | 0.01 | shotgun I | 0.08 | 0.00 |
| 8 | shield I | debut | 6.6 | 4 | – | pistol I | 0.19 | 0.01 | pistol I (flank) | 0.19 | 0.01 |
| 11 | heavy I | debut | 7.5 | 4 | – | pistol I | 0.67 | 0.88 | burst I | 0.46 | 0.57 |
| 12 | sniper I | debut | 7.8 | 2 | – | pistol I | 0.43 | 0.57 | rifle I | 0.32 | 0.43 |
| 15 | bomber I | debut | 8.8 | 4 | – | pistol I | 3.04 | 4.77 | launcher I | 0.92 | 1.42 |
| 16 | shotgunner II | pattern | 9.1 | 4 | 1.37 | shotgun I | 1.94 | 3.01 | shotgun II | 1.13 | 1.74 |
| 17 | armored I | debut | 9.4 | 4 | – | pistol I | 3.30 | 5.13 | AP I | 1.54 | 2.36 |
| 18 | rusher II | closing | 9.8 | 7 | 0.15 | pistol I | 0.85 | 1.01 | shotgun II | 0.18 | 0.02 |
| 19 | rocketeer I | debut | 10.1 | 4 | – | pistol I | 1.66 | 2.58 | rocket I | 0.42 | 0.64 |
| 20 | shield II | coverage | 10.4 | 4 | 0.13 | pistol I | 0.66 | 0.22 | launcher I | 0.13 | 0.04 |
| 21 | gunner II | pairs | 10.7 | 4 | 0.50 | pistol I | 1.14 | 1.76 | pistol II | 0.67 | 1.03 |
| 22 | laser I | debut | 11.0 | 1 | – | pistol II | 0.74 | 0.00 | rocket I | 0.38 | 0.00 |
| 23 | heavy II | burst | 11.4 | 4 | 0.72 | burst I | 1.09 | 0.79 | burst II | 0.79 | 0.69 |
| 25 | sniper II | reach | 12.0 | 2 | 0.20 | rifle I | 0.28 | 0.12 | rifle II | 0.20 | 0.16 |
| 26 | bomber II | area | 12.3 | 4 | 0.37 | launcher I | 0.84 | 0.68 | launcher II | 0.45 | 0.38 |
| 27 | armored II | advance | 12.6 | 4 | 1.15 | AP I | 2.05 | 1.85 | AP II | 1.33 | 1.18 |
| 28 | rocketeer II | tracking | 13.0 | 4 | 0.17 | rocket I | 0.30 | 0.19 | rocket II | 0.18 | 0.11 |
| 29 | laser II | charge | 13.0 | 1 | 0.30 | pistol II | 0.97 | 0.00 | rocket II | 0.37 | 0.00 |
| 30 | gunner III | pairs | 13.0 | 4 | 0.67 | pistol II | 1.26 | 1.59 | pistol III | 0.75 | 0.99 |
| 31 | shotgunner III | pattern | 13.0 | 4 | 0.85 | shotgun II | 1.17 | 0.88 | shotgun III | 0.74 | 0.65 |
| 32 | heavy III | burst | 13.0 | 4 | 1.08 | burst II | 1.85 | 1.93 | burst III | 1.36 | 1.51 |
| 33 | sniper III | reach | 13.0 | 2 | 0.21 | rifle II | 0.30 | 0.33 | rifle III | 0.22 | 0.28 |
| 34 | rusher III | closing | 13.0 | 7 | 0.15 | pistol III | 0.44 | 0.21 | shotgun III | 0.15 | 0.00 |
| 35 | armored III | advance | 13.0 | 4 | 1.33 | AP II | 1.80 | 1.81 | AP III | 1.31 | 1.47 |
| 36 | rocketeer III | tracking | 13.0 | 4 | 0.18 | rocket II | 0.37 | 0.29 | rocket III | 0.22 | 0.20 |
| 37 | bomber III | area | 13.0 | 4 | 0.48 | launcher II | 0.76 | 0.51 | launcher III | 0.51 | 0.38 |

**28 of 28 inside the bands.** Read one row: at door 21 the gunner starts
firing in pairs. With the pistol you had, a kill costs 1.14 s of dodging and
1.76× what it refunds, so the bank drains. His Mk II pistol breaks one round
in two in the air, and the same fight costs 0.67 s and roughly pays for itself.

## 5. What the model found

These changed the design. Each is recorded next to the number it moved in
`tools/sim-arsenal.mjs`.

1. **The slow part of a kill is the aim, not the shot.** At these ranges the
   pistol already kills with ~95% of its pulls. Swinging onto the next man
   and settling takes ~0.9 s by Fitts's law; the shot takes nothing. So
   *faster, tighter, more pellets* bought only 10–15% relief. A weapon feels
   stronger when it **kills more than one man per aim** (pierce, cone, blast,
   a sweeping burst). Deep portrait rooms line men up, so pierce pays. Or it
   works on the **threat** (shatter, stagger, a broken charge). Every Mk II
   and III carries one of those for this reason.
2. **A wide weapon is faster, not just more forgiving.** You fire as soon as
   he is inside the cone, so the shotgun, launcher and rocket shorten the aim
   itself. This is the lever `PILLARS.md` §4 leaves open: nothing may move
   the camera, but a weapon may ask less precision of your thumb.
3. **A gunner who fires more often changes nothing on floors 1–3.** The room's
   shot clock (`OPENING.gapFrom` → `gapTo`) is the binding limit until about
   door 20. Cadence was the first idea for his Mk II and it measured
   identical. His axis is *pairs*.
4. **A Mk that debuts inside the slow-time school (doors 10–19) is
   invisible** if its axis is "fire together": the school already fires the
   room in volleys. The gunner's Mk II moved from door 13 to door 21.
5. **The shipped armored drop is wrong.** He drops the burst rifle, whose
   spread makes it *worse than the pistol* against a man you can only
   headshot. His drop should answer him: armour-piercing rounds.
6. **The shipped rifle barely beats the pistol against snipers.** Its lead
   advantage (95 m/s against 46 m/s) is small at 22 m. Its Mk I trait is
   shatter: his round is a line, and so is yours.
7. **A weapon must be the best answer on the day it lands.** Pistol Mk II
   (pierce, shatter) out-guns rifle Mk I, so the sniper debuts before the
   gunner's Mk II. And **an answer's Mk must arrive before the Mk of the
   thing it answers**: shotgunner II (door 16) comes before rusher II (18).
8. **The laser is answered by the rocket, not the rifle.** He anchors, so
   the rifle's lead advantage is worth nothing against him.

## 6. Open questions

- **Shatter is a new mechanic.** Shooting rounds out of the air is not in
  the game. It is the trait the ladder leans on most, and it needs a
  playtest before anything else here is built. It must be readable at 0.05×
  (the freeze is where you will do it) and must not become an aim-assist
  (`PILLARS.md` §4).
- **Mk I debuts with the pistol are heavy on the bank.** Bomber and armored
  run R ≈ 5 with four of them. The existing rule that a new type arrives in a
  quieter room still applies: debut rooms should show two of him, and the Mk
  II/III rooms four.
- **Ammo:** the burst and AP line spends 2–4 rounds a kill (see the `rds`
  column the model prints). They are the ammo-hungry answers, which is a
  scarcity lever (`SCARCITY.ammoDrop`), not a bug.
- **The model's guess:** Fitts constants (0.35 s + 0.18 s/bit) and a thumb
  error of 0.010 rad. The checks are ratios, so they barely move with these;
  the absolute P and R do. Measure one real acquisition time in playtest and
  set it.
- **Where the tables live when built:** `ENEMY_MK`, `WEAPON_MK`, `FLOORS` and
  the schedule move into `src/balance.js`, the model imports them, and
  `ENEMY_TYPES` (today unexported in `main.js`) moves with them. One source
  of tunable numbers (`PILLARS.md` §7).

---

## 7. More ways to get harder, and what answers them

A second round of ideas: enemies that are **smaller**, **hidden behind a
plate with an eye slot**, **always moving**, or that **dodge your shots**;
and answers that **ricochet**, **blast a cone**, **sweep a beam**, **zoom**,
or **improve the time button**. `--matrix` prices every pairing at door 25
(a gunner underneath, so rows differ only in the trait). Cells are P, and
×n against the plain pistol on the same man.

**Four of him at 14 m:**

| | pistol | ricochet | shotgun cone | grenade | beam sweep | rifle + zoom |
|---|---|---|---|---|---|---|
| plain | 2.89 | ×0.64 | ×0.26 | ×0.30 | ×0.37 | ×0.82 |
| slight frame | 3.39 | ×0.64 | ×0.25 | ×0.26 | ×0.32 | ×0.78 |
| riot shield + eye slot | 5.24 | ×0.64 | ×0.33 | ×0.17 | ×0.22 | ×0.74 |
| always moving | 3.34 | ×0.64 | ×0.22 | ×0.26 | ×0.32 | ×0.82 |
| dodger | 4.56 | ×0.64 | ×0.30 | ×0.19 | ×0.23 | ×0.52 |

**One of him at 24 m:**

| | pistol | ricochet | shotgun cone | grenade | beam sweep | rifle + zoom |
|---|---|---|---|---|---|---|
| plain | 0.44 | ×1.00 | ×0.68 | ×0.54 | ×0.58 | ×0.78 |
| slight frame | 0.53 | ×1.00 | ×0.71 | ×0.46 | ×0.49 | ×0.80 |
| riot shield + eye slot | 0.93 | ×1.00 | ×1.27 | ×0.27 | ×0.29 | ×0.76 |
| always moving | 0.54 | ×1.00 | ×0.57 | ×0.50 | ×0.47 | ×0.89 |
| dodger | 0.65 | ×1.00 | ×0.79 | ×0.37 | ×0.40 | ×0.79 |

### How much harder each trait makes him (the pistol column)

| trait | a group | alone, far | read |
|---|---|---|---|
| riot shield + eye slot | **+81%** | **+111%** | the strongest; a Mk III-sized step |
| dodger | **+58%** | +48% | strong, and it tests timing (below) |
| always moving | +16% | +23% | mild; a good Mk II |
| slight frame | +17% | +20% | mild; a good Mk II, or a trait of a small fast type |

### What the matrix says

1. **The grenade and the beam answer everything.** Neither cares about
   leading a target, a sidestep, or how thin he is. That makes them the
   dominant pick unless they are priced. They need short charges, few rounds
   (`SCARCITY` already squeezes the launcher to 2 + 3), and a single source:
   the beam should drop only from the laser man. That also fills the gap of
   the laser dropping nothing. If the riot shield should resist them, its
   plate has to block splash from the front. Then the eye slot, a flank or a
   ricochet off the wall behind him become the only ways through, and the
   zoom has a job no other weapon can do.
2. **Zoom answers small and still targets, not moving ones.** It divides your
   thumb's error by the zoom. It does not help you lead a strafing man: that
   error comes from how slow your round is, and zoom doesn't change it. It
   costs tunnel vision (one man per aim) and a moment to settle, so it is a
   specialist: the eye slot, a headshot, a braced man far off.
3. **Always-moving is answered by instant or wide hits:** the cone (×0.22 in
   a group) and the beam (×0.47 alone). A zoomed rifle barely helps (×0.82–0.89).
4. **Ricochet is a group weapon that needs no line-up.** It holds ×0.64 in
   any group, where pierce needs men standing in a row, and does nothing
   against one man.

### Dodgers: make it a reaction, not a percentage

A hidden dodge roll is wrong for a one-hit game. A clean, well-aimed shot
that silently fails reads as a bug. Make the dodge **visible, with a reaction
time**, and it becomes a test of the timing you described:

- **Freezing time does not beat him.** Your rounds travel on the world clock
  (`updateBullets(sdt)`), the same clock he reacts on, so both slow together.
- **What does:** a round faster than his reaction (the rifle, ×0.52 in a
  group), a hit he can't sidestep (blast, beam, guided), or **timing**. While
  he is aiming he is committed and cannot move. Shoot during his telegraph and
  every round lands. The model makes this choice for you whenever waiting
  beats spraying.
- The dodge percentage then **emerges** from round speed against his
  reaction. It is never rolled.

### Hold-to-zoom and a held beam: the controls

The default scheme is the time **button** (`timeMode = 'toggle'`), so a
still hold on the right half is free there. A tap fires and a drag looks, so
a hold that doesn't move is distinguishable from both. It is **taken** in the
optional classic mode, where holding anywhere slows time. One way to make
both work: in classic mode the rifle scopes in *while* you hold, so the
freeze and the zoom are the same gesture. A beam that fires for a fixed
~0.4 s on a tap, and follows your drag while it burns, needs no hold at all.

### Time-button upgrades do not need a weaker start

The worry was that a better button means a worse one at the beginning. The
scarcity curve already makes that unnecessary: the bank loses value on its
own as you go deeper.

| door | what the bank is worth | with −20% drain and +25% refund |
|---|---|---|
| 1 | 1.00 | 1.56 |
| 6 | 0.70 | 1.09 |
| 8 | 0.46 | 0.72 |
| 12 onward | **0.31** | **0.49**, about door 8's value |

(Worth = kill refund ÷ freeze drain, from `SCARCITY.timeGain` and
`timeDrain`.) By door 12 a frozen second already costs about three times what
it did on door 1. An upgrade picked up on floor 3 hands back part of what the
curve took; the first floors feel exactly as they do today.

The limits, because scarcity *is* the difficulty curve (`PILLARS.md` §2):

- **Few:** one per elevator ride. The ride is the natural moment, and it
  keeps rewards off individual doors.
- **Capped:** never back above about door 6's worth (~0.7).
- **Felt:** e.g. *headshots made while frozen can fill the bank past its
  cap*. That is the fix `BACKLOG.md` #3 asked for: a headshot reward that
  still lands when the bank is already full.

### Where the new traits could sit on the ladder

A suggestion, not yet re-checked by `node tools/sim-arsenal.mjs`:

| trait | on | answered by |
|---|---|---|
| riot shield + eye slot | shield **Mk II** (in place of "turns faster") | rifle + zoom through the slot; grenade if splash gets past the plate |
| slight frame, always moving | rusher **Mk II** | shotgun cone |
| always moving | gunner **Mk III** | cone, beam |
| dodger | sniper **Mk III**, or a late elite type | faster rifle rounds, timing, blast |
| beam | dropped by the laser man | (it is the answer) |

---

## 8. Three proposed types: kamikaze, Frankenstein, drone

Priced at door 25 by `--newcomers`: P per kill, ×n against the pistol on the same
room, and R (bank per kill ÷ refund).

| | pistol | ricochet | shotgun cone | grenade | beam | rifle + zoom |
|---|---|---|---|---|---|---|
| kamikaze Mk I ×3 (R 3.5 m) | 0.15 | ×1.00 | ×1.00 | ×1.00 | ×1.00 | ×1.00 |
| kamikaze Mk II ×3 (R 5 m, faster) | 0.80 · R 0.7 | ×0.19 | ×0.19 | ×0.19 | ×0.19 | ×1.00 |
| kamikaze Mk III ×4 (shorter fuse) | 1.61 · R 1.6 | ×0.40 | ×0.09 | ×0.09 | ×0.09 | ×1.00 |
| Frankenstein Mk I | 1.43 · R 2.3 | ×1.00 | ×0.88 | ×0.84 | ×0.88 | ×1.00 |
| Frankenstein Mk II (arms only) | 2.20 · R 1.8 | ×0.90 | ×0.72 | ×0.55 | ×0.59 | ×0.97 |
| Frankenstein Mk III (+ final rush) | 2.35 · R 1.8 | ×0.91 | ×0.74 | ×0.57 | ×0.61 | ×0.97 |
| drone Mk II ×3 (jinking, firing) | 1.77 · R 1.2 | ×0.66 | ×0.28 | ×0.24 | ×0.31 | ×0.87 |

For scale: two gunners firing together cost 2.45 per pair.

### Kamikaze

Runs at you. Alive inside radius R, he arms (a visible, audible fuse) and
bursts; you must be outside R when he does.

- **A kamikaze alone is not a threat. In a crowd he is a question.** Three Mk Is
  in an empty room die before they arrive with any weapon. Among firing gunners
  he is a clock competing for your aim: **kill him first**, ×1.48 cheaper than
  nearest-first (`--waves`, *kamikaze in the crowd*). Stage him in mixed
  rooms, never alone.
- **Fuse, not proximity.** Arming at R and bursting after ~0.5 s gives three
  outs: kill him before R, kill him during the fuse, or run clear. Running
  clear of 3.5 m takes ~0.7 s, longer than the fuse, so the run is bought
  with the time button. That is the button at its best: it buys distance, not
  aim.
- **His blast should hit his own side.** Shooting him when he's beside his
  friends is the payoff, and it makes his position part of kill order.
- **Mk ladder:** radius (3.5 → 5 m), then speed, then a shorter fuse. Area
  weapons crush him (×0.09 by Mk III); the zoomed rifle does nothing (one man per aim).
- **He overlaps the rusher.** Both are the arrive-before-you-kill-them
  clock. The cleanest fit is **rusher Mk III = kamikaze** ("he no longer
  needs to reach you"), not an eleventh type. The shotgun still answers him.

### Frankenstein

Plated head to foot, a gun in each hand, both firing together.

- **Mk I is gentler than two gunners, not harsher.** Two rounds at once from
  one body cost 1.43 to kill; the same two rounds from two gunners cost 2.45.
  One kill stops both guns. That makes him the ideal *introduction* to paired
  fire: put him on floor 2–3, before gunner Mk II teaches pairs from two men.
- **Mk II (arms only) is 1.5× Mk I**, and the answers split cleanly: grenade
  ×0.55, beam ×0.59, cone ×0.72 take both arms in one aim. Pistol, ricochet and
  zoom take one arm at a time (×0.90–0.97). The zoom barely helps: at 12 m a
  13 cm arm is not too small for the pistol, just slow to take twice.
- **Mk III's final rush is a ~1.3 s reflex check.** By the time his second arm
  goes he has walked to ~8 m. Alone it adds little (+7%). Like the kamikaze,
  it is dangerous in company. This creates a **real choice: leave him
  one-armed** (half his fire) while you clear the room, and take the second
  arm when nothing else can punish the rush.
- **Two things to decide first:**
  - **The pillar.** `PILLARS.md` §2 says enemies don't get tougher. Two arms is
    two hits. The defence: no hit is a health tick. Each one visibly removes
    a gun and changes what he does. That is a design call for you, not an
    implementation detail.
  - **The tech.** Arms that shatter separately are per-part shatter, which
    was built and reverted (`BACKLOG.md` #3). The write-up says it wants
    per-part rigid bodies and the glTF characters first. Frankenstein depends
    on that work.
- **His drop:** twin pistols. Two rounds a tap, one to each hand: the paired
  fire he taught you, turned around.

### Drone

Head-sized, just above head height.

- **Height is the axis a portrait screen has.** The camera is 80° vertical
  (`PILLARS.md` §5), so overhead is in view, and a drone makes you use the
  pitch of your look for the first time. It costs aim: a longer swing up to
  it (modelled as 1.5× the usual turn).
- **Mk I, the spotter:** fires nothing, and while it's up every other man
  leads you. It only works if it is strong and still:
  - **Still:** a spotter that jinks is so slow to hit that the gunners stay
    the better first target (×1.00). It should **hover** to watch; the
    jinking belongs to the Mk II.
  - **Strong:** its mark has to make the room's rounds about twice as hard to
    dodge. At +50% it sorts first but saves nothing (×1.03); at +100% it's the
    kill-order question (×1.34, *the spotter*).
- **Mk II jinks and fires.** Small and erratic is the hardest pistol target
  in the matrix: cone ×0.28, grenade ×0.24, beam ×0.31, ricochet ×0.66, zoom
  ×0.87. A ricochet off a drone into the man below it is the moment the
  ricochet exists for.
- **Mk III dives:** a kamikaze with wings, the same code as the kamikaze
  (`PILLARS.md` §7: one implementation of anything shared).
- **Legibility:** it needs its own light, so a blackout can't hide it
  (`PILLARS.md` §6). It drops nothing: it is answered by the wide weapons.
