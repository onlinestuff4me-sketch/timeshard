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
node tools/sim-arsenal.mjs --spawner  # the spawner room, three ways (§9)
node tools/sim-arsenal.mjs --schedule # the floors door by door, and the rules they keep (§1)
node tools/sim-arsenal.mjs --boss     # the floor-1 boss, against brackets and shells (§10)
node tools/sim-arsenal.mjs --finale   # the finale Keeper: bait, read, land it inside his cooldown (§14)
node tools/sim-arsenal.mjs --keeper-room  # how hot his room is before slow time (§10)
node tools/sim-arsenal.mjs --spawner-boss # the floor-4 boss against three loadouts (§12)
```

The ladder, `--waves` and `--schedule` exit non-zero if anything leaves its band or breaks a rule; the others print their tables.

---

## 1. Floors and elevators

**Built (2026-09-26):** `FLOORS`, `floorOf()` and `BOSS_OF_FLOOR` in
`src/balance.js`; the HUD leads with the floor (`F2 · DOOR 11`); a new floor
is announced on its first door; the warm-up door eases the room (`WARMUP`:
three-quarters of the men up at once, a 30% longer shot gap — the slow-time
school keeps its own gap on door 10); the door map drives `TYPE_INTRO`
(armored 18, kamikaze 20, rocketeer 22, laser 32); a type a boss debuts
(`BOSS_TYPES`, `byBoss` in protocols) joins the next floor's cast with no door
debut of its own; and each floor's last leg is its boss's room once that boss
is built (`bossLeg()`). Checked by `test/floors.mjs`. Not built: the elevator
itself, and the gauntlet.

**Decided: each floor has its own cast, and every floor ends in a boss who
introduces the next floor's hardest type.** The boss is the big version, met
once, as the type's debut. The next floor then fills with ordinary ones.
Floor 1's boss is the Keeper, and his death gives you slow time (§10, §12).
Gunners run through every floor. Types from earlier floors come back as
**guests**, a tier up.

| floor | doors | new cast | guests (tier-ups) | ends in |
|---|---|---|---|---|
| **1** | 1–9 (9) | gunner, rusher, shotgunner, shield | – | **the Keeper**, the first blinker → slow time |
| **2** | 10–16 (7) | heavy, sniper, bomber, *blinkers* | shotgunner II, rusher II | **the first Frankenstein** |
| **3** | 17–23 (7) | armored, rocketeer, *Frankensteins*, *kamikazes* | shield II, gunner II, heavy II | **the first drone** |
| **4** | 24–30 (7) | *drones* | bomber II, shotgunner III, sniper II, blinker II, Frankenstein II, rusher III | **the first spawner** |
| **5** | 31–39 (9) | laser, *spawners* | gunner III, armored II, rocketeer II, kamikaze II, drone II, heavy III, Frankenstein III | **the finale**: the Keeper, again |

*Italics:* the types the previous floor's boss introduced, now ordinary.
The Frankenstein boss introduces two: his last phase is the kamikaze's rush
(§12).

Door by door (`node tools/sim-arsenal.mjs --schedule`; `·` is a door that
carries a protocol debut instead):

```
F1   1:gunner  2:·  3:·  4:rusher  5:·  6:shotgunner  7:·  8:shield  9:·    BOSS: the Keeper (blinker)
F2   10:SLOW TIME  11:heavy  12:shotgunner II  13:sniper  14:·  15:bomber
     16:rusher II                                                         BOSS: Frankenstein
F3   17:warm-up  18:armored  19:shield II  20:kamikaze  21:gunner II
     22:rocketeer  23:heavy II                                            BOSS: drone
F4   24:warm-up  25:bomber II  26:shotgunner III  27:sniper II  28:blinker II
     29:Frankenstein II  30:rusher III                                    BOSS: spawner
F5   31:warm-up  32:laser  33:gunner III  34:armored II  35:rocketeer II
     36:kamikaze II  37:drone II  38:heavy III  39:Frankenstein III        BOSS: the Keeper, blinker III
```

Floor 1 is exactly the shipped opening: gunner 1, rusher 4, shotgunner 6,
shield 8, slow time on 10. The boss slots in between door 9 and door 10, so
the encounter curve and the slow-time school stay where they are.

**The rules the schedule keeps**, each checked by `--schedule`:

- **One new thing per door**, and per boss. A tier-up counts as new.
- **Every floor ends in a boss. Every boss before the last is a type's
  debut (Mk I), and the next floor fills with ordinary ones of his kind.**
- **Slow time is the floor-1 boss's reward.** The Keeper ends floor 1 and
  slow time unlocks on the next door. `powerUnlockDoor()` still derives
  that door from the encounter curve. If the curve ever moves it, the check
  fails, because floor 1 has to move with it.
- **The warm-up door out of each elevator holds no debut.** It is the easing
  door of the Hades-style rise and drop. Floor 2's warm-up is slow time's
  first room.
- **Tiers in order**, each after the last.
- **No "fire together" tier inside the slow-time school** (10–19): the school
  already fires the room in volleys, so the gunner's pairs would be invisible
  there. His Mk II is on 21.
- **The answer is on the floor before the question.**
  - The shotgun (6) comes before the Keeper, and the shotgun's Mk II (12)
    before the rusher's (16).
  - The launcher (15) comes before the Frankenstein boss (both arms in one
    aim), shield II, blinker II (a blast wider than their blink) and the
    spawner.
  - The rocket (22) comes before the laser (32).
- **A weapon is the best answer on the day it lands.** The Mk II pistol
  (pierce, shatter) out-guns the sniper's and the armored man's Mk I drops,
  so both come before gunner Mk II.
- **Drone and spawner are not introduced on the same floor** (decided). The
  drone's boss ends floor 3 and the spawner's ends floor 4.

**The door budget.** Fourteen types at three tiers is ~42 debuts, and five
floors of one-new-thing doors hold ~40 slots, before the protocols take
theirs. So **a type's tier count is how long it has been on the floors**:
the floor-1 cast and the heavy reach Mk III inside a run, Frankenstein's
Mk III is part of his design, and everyone else tops out at Mk II. Their
Mk IIIs (still defined in `ENEMY_MK`) are for past the fifth floor, a
Heat-style mode (`TUNNEL_META.md` §2e).

**Two things the model moved:** the shotgunner's Mk II to door 12 (before
slow time the room fires so seldom that a wider pattern changes nothing), and
the armored man ahead of gunner Mk II (see the rule above).

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
is not nearest-first, is at least ×1.30 cheaper in dodging, and uses only
what the schedule has put on the floors by its door (checked):

| recipe | door | mix (nearest first) | best order | worth |
|---|---|---|---|---|
| **the clock** | 33 | shield · 2 gunner II · laser at the back | laser first, shield last | ×2.06 |
| **take his gun** | 20 | 2 shield II · 2 gunner · bomber behind them | bomber first, then the plates with his launcher | ×1.92 |
| **plated screen** | 24 | 2 shield II · 2 gunner II behind | the pair first, over the plates | ×1.47 |
| **close pressure** | 19 | 2 gunner near · 3 rusher II far | the rushers, who start furthest away | ×1.38 |
| **kamikaze in the crowd** | 36 | 2 gunner II · 2 kamikaze II behind | the kamikazes first | ×1.40 |
| **the spotter** | 29 | 3 gunner II · a hovering drone | the drone first | ×1.34 |

**What makes a mix a question (all measured):**

- **A clock.** Laser, rushers and kamikazes. They get worse while you do something
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
| rusher | **numbers**: timers 0.4 s apart, 4.4 m/s | 0.25 s apart, 5.0 m/s | nothing: the shotgun answers him |
| kamikaze (new, §8) | **numbers**: 6 men, 0.3 s apart, 4.5 m radius | 7 men, 0.25 s apart, faster, shorter fuse | nothing: the shotgun answers him |
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
| burst rifle | **sweep**: the burst walks across a line of men | 4-round · shatter 40% | 5-round · pierce 2 · shatter 55% |
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
| 4 | rusher I | debut | 5.6 | 4 | – | pistol I | 0.15 | 0.00 | pistol I (footwork) | 0.15 | 0.00 |
| 6 | shotgunner I | debut | 5.9 | 4 | – | pistol I | 0.14 | 0.01 | shotgun I | 0.08 | 0.00 |
| 8 | shield I | debut | 6.6 | 4 | – | pistol I | 0.19 | 0.01 | pistol I (footwork) | 0.19 | 0.01 |
| G1 | blinker I | debut | 6.9 | 1 | – | pistol I | 0.55 | 0.00 | shotgun I | 0.20 | 0.00 |
| 11 | heavy I | debut | 7.5 | 4 | – | pistol I | 0.67 | 0.88 | burst I | 0.46 | 0.57 |
| 12 | shotgunner II | pattern | 7.8 | 4 | 0.35 | shotgun I | 0.43 | 0.60 | shotgun II | 0.27 | 0.38 |
| 13 | sniper I | debut | 8.2 | 2 | – | pistol I | 0.43 | 0.57 | rifle I | 0.32 | 0.43 |
| 15 | bomber I | debut | 8.8 | 4 | – | pistol I | 3.04 | 4.77 | launcher I | 0.92 | 1.42 |
| 16 | rusher II | numbers | 9.1 | 7 | 0.15 | pistol I | 0.66 | 0.82 | shotgun II | 0.15 | 0.00 |
| 18 | armored I | debut | 9.8 | 4 | – | pistol I | 4.09 | 6.40 | AP I | 1.89 | 2.92 |
| 19 | shield II | coverage | 10.1 | 4 | 0.73 | pistol I | 4.51 | 7.06 | launcher I | 0.73 | 1.12 |
| 20 | kamikaze I | debut | 10.4 | 5 | – | pistol I | 0.77 | 0.66 | shotgun II | 0.15 | 0.00 |
| 21 | gunner II | pairs | 10.7 | 4 | 0.50 | pistol I | 1.14 | 1.76 | pistol II | 0.67 | 1.03 |
| 22 | rocketeer I | debut | 11.0 | 4 | – | pistol II | 0.32 | 0.26 | rocket I | 0.17 | 0.08 |
| 23 | heavy II | burst | 11.4 | 4 | 0.72 | burst I | 1.09 | 0.79 | burst II | 0.76 | 0.69 |
| 25 | bomber II | area | 12.0 | 4 | 0.37 | launcher I | 0.81 | 0.68 | launcher II | 0.43 | 0.38 |
| 26 | shotgunner III | pattern | 12.3 | 4 | 0.84 | shotgun II | 1.09 | 0.88 | shotgun III | 0.70 | 0.65 |
| 27 | sniper II | reach | 12.6 | 2 | 0.20 | rifle I | 0.30 | 0.12 | rifle II | 0.21 | 0.16 |
| 28 | blinker II | numbers | 13.0 | 2 | 0.13 | pistol II | 0.83 | 0.70 | launcher II | 0.16 | 0.09 |
| 30 | rusher III | numbers | 13.0 | 7 | 0.15 | pistol II | 0.66 | 0.82 | shotgun III | 0.15 | 0.00 |
| 32 | laser I | debut | 13.0 | 1 | – | pistol II | 0.74 | 0.00 | rocket I | 0.38 | 0.00 |
| 33 | gunner III | pairs | 13.0 | 4 | 0.67 | pistol II | 1.26 | 1.59 | pistol III | 0.75 | 0.99 |
| 34 | armored II | advance | 13.0 | 4 | 1.15 | AP I | 2.05 | 1.85 | AP II | 1.33 | 1.18 |
| 35 | rocketeer II | tracking | 13.0 | 4 | 0.17 | rocket I | 0.30 | 0.19 | rocket II | 0.18 | 0.11 |
| 36 | kamikaze II | numbers | 13.0 | 6 | 0.15 | pistol III | 0.45 | 0.32 | shotgun III | 0.15 | 0.00 |
| 38 | heavy III | burst | 13.0 | 4 | 1.04 | burst II | 1.78 | 1.89 | burst III | 1.30 | 1.47 |
| G5 | blinker III | numbers | 13.3 | 3 | 0.16 | pistol III | 1.36 | 1.60 | launcher II | 0.21 | 0.15 |

**28 of 28 inside the bands** — every tier the floor-cast schedule (§1) puts in a run; G1 and G5 are the blinker bosses. Read one row: at door 21 the gunner starts
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
   room in volleys. The gunner's Mk II moved from door 13 to after the school (now door 22).
5. **The shipped armored drop is wrong.** He drops the burst rifle, whose
   spread makes it *worse than the pistol* against a man you can only
   headshot. His drop should answer him: armour-piercing rounds.
6. **The shipped rifle barely beats the pistol against snipers.** Its lead
   advantage (95 m/s against 46 m/s) is small at 22 m. Its Mk I trait is
   shatter: his round is a line, and so is yours.
7. **A weapon must be the best answer on the day it lands.** Pistol Mk II
   (pierce, shatter) out-guns rifle Mk I, so the sniper debuts before the
   gunner's Mk II. And **an answer's Mk must arrive before the Mk of the
   thing it answers**: shotgunner II (door 12) comes before rusher II (16).
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
| slight frame, always moving | drone **Mk II** (§8) | shotgun cone, grenade, beam |
| always moving | gunner **Mk III** | cone, beam |
| dodger | sniper **Mk III**, or a late elite type | faster rifle rounds, timing, blast |
| beam | dropped by the laser man | (it is the answer) |

---

## 8. Three proposed types: kamikaze, Frankenstein, drone

Priced at door 25 by `--newcomers`: P per kill, ×n against the pistol on the same
room, and R (bank per kill ÷ refund).

| | pistol | ricochet | shotgun cone | grenade | beam | rifle + zoom |
|---|---|---|---|---|---|---|
| kamikaze Mk I ×5 (0.35 s apart, R 3.5 m) | 0.77 · R 0.7 | ×0.20 | ×0.20 | ×0.20 | ×0.20 | ×1.40 |
| kamikaze Mk II ×6 (0.3 s apart, R 4.5 m) | 1.36 · R 1.3 | ×0.33 | ×0.11 | ×0.11 | ×0.11 | ×1.00 |
| kamikaze Mk III ×7 (0.25 s apart, faster, shorter fuse) | 1.45 · R 1.4 | ×0.64 | ×0.28 | ×0.10 | ×0.10 | ×1.18 |
| Frankenstein Mk I | 1.43 · R 2.3 | ×1.00 | ×0.88 | ×0.84 | ×0.88 | ×1.00 |
| Frankenstein Mk II (arms only) | 2.20 · R 1.8 | ×0.90 | ×0.72 | ×0.55 | ×0.59 | ×0.97 |
| Frankenstein Mk III (+ final rush) | 2.35 · R 1.8 | ×0.91 | ×0.74 | ×0.57 | ×0.61 | ×0.97 |
| drone Mk II ×3 (jinking, firing) | 1.77 · R 1.2 | ×0.66 | ×0.28 | ×0.24 | ×0.31 | ×0.87 |

For scale: two gunners firing together cost 2.45 per pair.

### Kamikaze

**Built (2026-09-26), Mk I:** `KAMI` in `src/balance.js`, `kamiBurst()` in
`src/main.js`, checked by `test/kamikaze.mjs`. A pack of five sets off 0.35 s
apart; he arms 3.5 m out and bursts 0.5 s later, taking everything inside the
radius. Two calls made building him: **shot, he still pops** — his friends
inside the radius go, you do not (the card's tip, "Shoot him near his
friends") — and **he is exempt from the door-approach hold** that keeps a
leg's last few waiting at the door: coming to you is his act. Debuts on door
20 as the door map has it (the ladder table below predates the map).

**Decided: his own type, not the rusher's Mk II.** Both come at you and both
get harder by **numbers**: how many, and how tightly their timers are
staggered. But they ask different things and have to look different.

| | rusher | kamikaze |
|---|---|---|
| what he wants | to reach you | to be near you when his fuse ends |
| what a miss costs | a hard dodge at arm's length | an escape run of his radius, bought with the time button |
| can you finish him late? | yes: he's in front of you, shoot him | yes, *during the fuse*, and he's safe only if he dies before it ends |
| body | lean, low, fast; bare hands, a sprinter's lean | heavy and top-heavy; a waddling run; a vest or core that glows red and pulses faster as the fuse runs |
| readable in the dark | his speed | his core is his light (`PILLARS.md` §6) |

The silhouette has to say which one it is from across a room, before either
moves: *outrun him* versus *out-shoot him or out-distance his blast*.

**How numbers make them harder (measured).** Each man sets off on his own
timer, `gap` seconds after the last, and each has a deadline: reaching you,
or his fuse ending inside R.

- **Staggering alone makes a pack easier, not harder,** because a wave that
  assembles all at once can be shot while it waits. Three kamikazes from
  16 m never reach you, whatever you hold. A pack only bites when **how many
  × how long a kill takes** exceeds the window before they arrive. So the
  numbers have to be real: five kamikazes from 12 m, 0.35 s apart, at his
  debut.
- **The stagger decides clump or line.** Men who set off `gap` apart run
  `gap × speed` metres apart. A tight stagger is a clump: one shotgun shell
  or grenade takes several. A wide one is a line: area weapons take a man at
  a time, and pierce, down a line coming straight at you, takes several. So
  the stagger isn't only a difficulty dial. It chooses which weapon is the
  answer.
- **In a crowd, he's a kill-order question:** kill him first, ×1.40 cheaper
  than nearest-first (`--waves`, *kamikaze in the crowd*).

**The ladder** (§4, re-checked on the floor-cast schedule):

| door | tier | pack | struggle (pistol II / pistol III) | with the shotgun |
|---|---|---|---|---|
| 26 | kamikaze Mk I | 5, 0.35 s apart, 3.5 m radius | 0.46 · R 0.33 | 0.15 |
| 36 | kamikaze Mk II | 6, 0.3 s apart, 4.5 m radius, faster | 0.45 · R 0.32 | 0.15 |
| 16 | rusher Mk II | the door's pack (7), 0.4 s apart, 4.4 m/s | 0.66 · R 0.82 | 0.15 |
| G4 | rusher Mk III | 7, 0.25 s apart, 5.0 m/s | 0.66 · R 0.82 | 0.15 |

The kamikaze debuts on floor 4 (door 26), with his Mk II on floor 5. His
Mk III (7 men, 0.25 s apart, a 0.4 s fuse) is past the fifth floor: see the
door budget in §1.

- **Fuse, not proximity.** Arming at R and bursting ~0.5 s later gives three
  outs: kill him before R, kill him during the fuse, or run clear. Clearing
  3.5 m takes ~0.7 s, longer than the fuse, so the run is bought with the
  time button: the button buying distance, not aim.
- **His blast should hit his own side.** Shooting him when he's beside his
  friends is the payoff, and it makes his position part of kill order.

### Frankenstein

**Built (2026-09-26):** `FRANK` in `src/balance.js`, `frankHit()` and
`frankArmOff()` in `src/main.js`, checked by `test/frankenstein.mjs`. **Every
Frankenstein is arms-only**, not just the boss: the owner's approved card says
"Only his arms shatter", so the gentler one-hit Mk I in the table below is
dropped. A body or head shot clanks off (a miss, for the streak); an arm takes
its gun; he fires a pair while he has both. An ordinary one comes apart with
his second arm; the floor-2 boss opens his chest and rushes, bursting like a
kamikaze at 3.5 m, and one shot on the open chest stops him. His twin-pistol
drop is not built.

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
- **Decided: a new mechanic, not a tougher enemy** (`PILLARS.md` §2 now
  says so). Only his arms can be shattered. The first arm takes one gun and
  leaves the other firing. The second arm shatters the whole body (Mk II),
  or opens his chest for the final rush (Mk III). There is no health; every
  hit changes what he does.
- **The tech it depends on.** Arms that shatter separately are per-part
  shatter, which was built and reverted (`BACKLOG.md` #3). The write-up says
  it wants per-part rigid bodies and the glTF characters first. Frankenstein
  needs that work.
- **His drop:** twin pistols. Two rounds a tap, one to each hand: the paired
  fire he taught you, turned around.

### Drone

**Built (2026-09-26), Mk I and the floor-3 boss:** `DRONE` in
`src/balance.js`, `droneMove()`/`droneMarking()` in `src/main.js`, checked by
`test/drone.mjs`. The spotter hovers still at 2.45 m, holds 7–11 m, never
fires; while one is up the HUD reads MARKED and every round aims into your
motion (measured: 4.2 m ahead of a player moving sideways at 4 m/s from 12 m).
One round on the hull brings it down. The boss on door 23's last leg is the
same hull at 2.4×, four hits, faster each time and jinking once hurt, with two
gunners and a shotgunner on a loop (the third stands behind him, out of the
lane); his reward is SIGHT, streamed into you (`hall.sightTaken`).
`SIGHT.playtest` is still on, so sight is owned from door 1 until the owner
turns that off.

Head-sized, just above head height.

- **Height is the axis a portrait screen has.** The camera is 80° vertical
  (`PILLARS.md` §5), so overhead is in view, and a drone makes you use the
  pitch of your look for the first time. It costs aim: a longer swing up to
  it (modelled as 1.5× the usual turn).
- **Mk I, the spotter (decided):** fires nothing, and while it's up every other man
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

---

## 9. The Spawner

**Built (2026-09-26), Mk I and the floor-4 boss:** `SPAWNER` in
`src/balance.js`, `spawnerHolding()`/`queueRevive()`/`updateRevives()` in
`src/main.js`, checked by `test/spawner.mjs`. A kill within 10 m of a live
dish hangs for 2 world-seconds inside a filling ring, then stands up where he
fell; it refunds no bank and drops nothing; the door waits for hangs; break
the dish and every hang it holds ends. The dish is the only thing a round can
break — the dome is plate (a sphere round the dome, so a round passing over it
to the dish is not stopped on the way in). The boss on door 30's last leg
holds his six guards (shotgunner, heavy, armored, blinker, gunner, bomber)
with a 3 s hang; his dish's first break hangs HIM for 4 s while his guards stay
down, then he reforms and restores the room to six (not six more); the second
break ends him. Reward: **a second life** — once a run, the hit that would
shatter you stops the world instead; the HUD says 2ND LIFE while you hold it.
Not built: the hang's hovering debris (the ring carries it for now), and the
Mk II/III spawners.

A small armored dome with a spinning radio dish on top. While the dish
turns, any man near it who shatters **hangs where he fell for 2 seconds, then
reassembles**. Shattering his guards only buys time; the dish is the kill.
Its role is the drone spotter's: a support that makes the rest of the room
worse while it's alive, so you have to decide whether to go for it first.

`--spawner` prices a room of three gunner guards (Mk I: 2 s hang) and four
(Mk II: 1.5 s) at door 25, played three ways. **Tank:** shoot the dish under
fire. **Clear:** shatter the guards, then take the dish before the first one
is back. **Clear, then freeze for the dish:** stop time only for whatever
part of the dish shot the window doesn't cover.

| Mk I, 3 guards, 2 s | tank | clear | back early | window | dish takes | clear + freeze the dish |
|---|---|---|---|---|---|---|
| pistol | 4.90 | 1.93 | 1 of 3 | 0.8 s | 1.4 s | 1.46 + **1.0 s bank** |
| ricochet | 3.56 | 1.38 | 1 of 3 | 1.2 s | 1.4 s | 1.00 + 0.4 s |
| shotgun cone | 2.11 | 0.67 | 0 of 3 | 1.6 s | 1.1 s | 0.67 + 0 |
| grenade | 1.81 | 0.55 | 0 of 3 | 1.8 s | 0.7 s | 0.55 + 0 |
| beam | 2.29 | 0.70 | 0 of 3 | 1.5 s | 0.8 s | 0.70 + 0 |
| rifle + zoom | 4.27 | 1.93 | 1 of 3 | 0.7 s | 1.3 s | 1.51 + 1.0 s |

| Mk II, 4 guards, 1.5 s | tank | clear | back early | window | dish takes | clear + freeze the dish |
|---|---|---|---|---|---|---|
| pistol | 11.72 | 7.85 | 3 of 4 | **−0.7 s** | 1.4 s | 2.43 + **3.4 s bank** |
| shotgun cone | 4.15 | 1.32 | 1 of 4 | 0.7 s | 1.1 s | 1.02 + 0.5 s |
| grenade | 3.80 | 0.82 | 0 of 4 | 1.0 s | 0.7 s | 0.82 + 0 |
| beam | 4.94 | 1.35 | 1 of 4 | 0.7 s | 0.8 s | 1.07 + 0.3 s |

(Room costs are seconds of dodging for the whole room; the bank caps at 10 s.)

### What the numbers say

1. **Going for the dish first is the wrong instinct.** Tanking costs 2.5×
   clearing with the pistol, and more with everything else. The spawner
   rewards a *sequence*: guards, then dish, inside the window.
2. **Mk I with the pistol is a near miss, on purpose.** Clearing three guards
   leaves 0.8 s; the dish takes 1.4 s. The first guard is back just before
   the dish goes. The skilled answer is to clear on foot and **press the
   button for the last half-second of the dish shot**, about 1 s of bank.
   Freezing the whole room costs 7 of the bank's 10 s. That's the time button
   used exactly when it matters, which is what the school exists to teach.
3. **Mk II is a wall for the pistol.** The first guard returns before the
   last one is down (a negative window). A cone, a grenade or a beam clears
   the guards in one or two aims and turns it back into a question. So
   **stage a Mk II spawner with its answer in the room**: a bomber among
   the guards, whose launcher is the way through. That's *take his gun*
   (§3) again, and it makes the bomber the first kill.
4. **The zoom doesn't help with the dish.** At 14 m it isn't too small for
   the pistol, and settling the zoom costs what the precision saves (1.3 s
   against 1.4 s). If the dish should reward the rifle, put the spawner far
   back (20 m or more) and keep it spinning, so the dish is only edge-on,
   and hittable, part of the time.

### Rules it needs

- **The hang runs on the world clock.** Freezing time stretches the 2
  seconds, which is what makes the time button the answer. Running it on the
  real clock would make it the second thing after the grinder that ignores
  a freeze (`PILLARS.md` §1). It doesn't need that.
- **No kill under a spawner refunds bank or drops anything until the dish
  is gone.** Otherwise the room is a farm: every reassembly is another 2 s
  refund and another roll for a clip. Everything pays out when the dish breaks.
- **When the dish breaks, everything it is holding stays down.** That's the
  payoff: shatter the room, kill the dish inside the window, and the whole
  room falls at once.
- **The hang must read.** The shards hover where he fell, a ring around them
  fills over the 2 seconds, then the shards fly back together. It is the
  shatter played backwards, the assemble effect built from his own debris,
  and it is the most "Time Shatter" image in this document. Two costs:
  - **Performance:** a hanging man's debris can't be recycled for 2 s.
    `SHATTER.pool` (512) and `perKill` (52) set how many men can hang at
    once, about nine, and a spawner room must stay under that
    (`PILLARS.md` §8: no allocation at runtime).
  - **Legibility:** the ring has to read in a blackout (`PILLARS.md` §6).
- **Mk ladder:** Mk I 2 s, Mk II 1.5 s with a fourth guard, Mk III **two
  spawners, each keeping the other alive**. Both dishes must go inside one
  window, which is the grenade's or the beam's job, or a freeze's.
- **It pairs with the drone.** A room holding a spawner *and* a spotter asks
  which support dies first. The spotter makes the guards' rounds harder to
  dodge; the spawner makes their deaths temporary. The answer depends on
  what you are holding, which is exactly the question to ask.

---

## 10. The Keeper and the blinkers: slow time is a boss's reward

**Built** (tunnel only): the blinker (`blinkersReact()`, `BLINKER` in
`src/balance.js`, `test/blinker.mjs`) and the Keeper's room on door 9's last
leg (`keeperTick()`, `KEEPER`, `test/keeper.mjs`): the seal, the pair on its
3 s loop, his own fire clock, three hits and three phases, the phase-3 time
stop, and the reward (his shards hang, stream into you, and the button
arrives on door 9; door 10 is still slow time's first room and the school
runs from there). **Not built:** the elevator. Calls made while building it:
a wall cuts his blink short (down to 0.9 m) rather than cancelling it; the
shotgunners stand in from the start rather than arriving in phase 2 (the room
section below overrides the phase table); a shotgun shell takes at most one
hit off him; and a retry reopens the seal behind you.

**Decided: slow time is not handed out on a door. It is taken from the man
who has it.** Floor 1 ends in an elevator gauntlet against **the Keeper**, a
man who moves before your round does. When he shatters, his shards don't fall.
They hang in the air, the world stops, the shards stream into you, and the
button appears. The elevator carries you up with it. The next door (10) is
slow time's first room, and the school runs from there as it does today.

### What he does

He reads the trigger, not the round. The moment you fire a round whose lane
would hit him, he **blinks** 1.5 m to one side (you can't know which) and
then can't blink again for his **cooldown**. A visible tell carries the
fight: an afterimage where he stood, and a glow on him while he recharges.
That glow is the window.

`--boss` prices every way of shooting him, at 10 m (20,000 trials each):

| attempt | cooldown 1.0 s | 1.2 s | 1.3 s | 1.5 s |
|---|---|---|---|---|
| one aimed pistol shot | 0% | 0% | 0% | 0% |
| pistol bracket: centre, then left, then right | 49% | 49% | 49% | 99% |
| one shotgun shell, centred | 7% | 7% | 7% | 8% |
| **bait and punish**, pistol | 0% | 0% | 99% | 99% |
| **bait and punish**, shotgun | 0% | 94% | 94% | 95% |
| bait and punish, shotgun Mk II | 0% | 96% | 97% | 96% |

**What that says:**

1. **A single shot at where he stands is always dodged**, as you wanted.
2. **The fight is "bait the blink, punish the recovery."** Fire at him, see
   which way he went, swing onto him and fire again before his glow fades.
   That is your idea of firing around him to anticipate the move, turned into a
   read rather than a guess.
3. **The shotgun helps for a reason you can feel.** One centred shell rarely
   covers a 1.5 m blink (7%), so it isn't the spread itself. It's that
   **a cone is faster to re-aim**: you fire as soon as he's inside it. At
   a 1.2 s cooldown only the cone is fast enough (94%). The pistol's punish
   just misses, and its bracket is a coin flip.
4. **The cooldown is the fight's difficulty dial:** 1.5 s and anyone can punish
   him; 1.2 s and you want the shotgun; 1.0 s and nothing on foot is fast
   enough. That last one is foreshadowing: that is what slow time is for.

### The fight, in three phases

| phase | cooldown | what it teaches |
|---|---|---|
| **1. Blink** | 1.5 s | a single shot is dodged; bait, then punish. The pistol works. |
| **2. Faster** | 1.2 s | the pistol's punish window closes. **Shotgunners assemble**; take a shotgun off one: *take his gun* (§3), inside a boss fight. |
| **3. He stops the world** | 1.2 s | he freezes the room for a moment. His rounds **hang in the air** where you can see them, then all release at once, a volley. You survive by reading the hanging rounds and being somewhere else when time restarts. It is the lesson of the slow-time school, taught one room before you are given the button. |

Then he shatters, and you get the power you just watched him use.

- **He is the dodger trait's capstone** (§7): the reaction-based dodge, with
  the rounds on the world clock and timing as the answer.
- **His time stop is his, not a free freeze for the player** (`PILLARS.md` §1).
  Its rounds hang where you can read them; nothing hits you while the world is
  stopped.
- **Name to decide.** *The Keeper* (he keeps time; you take it) fits the
  building's terse voice. Alternatives: *the Timekeeper*, *the Warden*,
  *Custody*.

---

### The Keeper's room (decided)

- **Two shotgunners stand in with him, on a loop.** Shattered, the pair comes
  back 3 s after the *second* one goes, and each leaves a shotgun. The room
  keeps feeding you the answer and keeps the pressure on. And since the loop
  restarts only when both are down, leaving one alive is a real choice: one
  shotgunner firing, but no fresh shotguns.
- **He fires on his own timer** (not the room's shot clock), every 1–1.5 s. `--keeper-room` measures what
  that costs *before you have slow time*, as **load**: the share of each second
  spent stepping out of lanes. Past ~0.5 there's no time left to aim, and
  the fight stops being a duel.

| Keeper fires every | the pair fires | Keeper | pair | total load |
|---|---|---|---|---|
| 1.0 s | at their own rate | 0.45 | 0.14 | **0.58** |
| 1.25 s | at their own rate | 0.36 | 0.14 | **0.50** |
| 1.5 s | at their own rate | 0.30 | 0.14 | **0.44** |

- **His own fire is almost all of it.** The pair adds 0.14 at most, because it
  is only up about a third of the time. So set his clock to **1.5 s in
  phase 1 and 1.25 s in phases 2–3**. That's hot, and still a duel. At 1.0 s
  it's a wall, and there's no slow time yet to get through one.

### Blinkers: the Keeper's kind (decided)

The Keeper is the first **blinker**, and floors 2 onward have ordinary ones:
the same blink, the Keeper's second-phase cooldown (1.2 s), no time stop.
They scale by **how many at once**:

| tier | where | pack | hard with | answered by |
|---|---|---|---|---|
| Mk I | the Keeper (G1), then floor 2 | 1 | pistol: the bracket's coin flip (P 0.55) | **shotgun**: the cone's re-aim beats his cooldown (0.20) |
| Mk II | door 28 | 2 | pistol (0.83) | **launcher**: a blast wider than their blink (0.16) |
| Mk III | the finale (G5) | 3, blinking further (1.8 m) | pistol (1.36) | launcher (0.21) |

- **One blinker is a punish; a pack is a blast.** While you bait one, the
  other fires. With the shotgun alone, two blinkers were a step too far, so
  from Mk II the launcher is the answer: they can't blink out of a blast wider
  than their blink.
- **After door 10 the loop closes.** His cooldown runs on the world clock
  and your swing doesn't, so freezing during his recovery buys the punish
  with any weapon, paid in bank. You took his time, and his kin are what it
  is for.

## 11. Debut cards: every new type gets an introduction

**Built** for the ten types in the game today (tunnel, city and rush; NO
RETREAT keeps its own cards). Code: `meetMaybe()` in `src/main.js`, the copy
as `meet`/`hint` on each enemy row in `src/protocols.js`, remembered per save
(`carded`), checked by `test/meetcard.mjs`. The gunner has no card: the
onboarding introduces him. Not built yet: the small name tag on returning
runs (the old one-word name flash still plays there), and the tier-up line
under the door number, which waits for the tiers themselves.

**Decided: every new enemy type is announced.** The machinery exists. NO
RETREAT stops the world on a type's first appearance and shows a card
(`duelMeetCard()`, copy in `SIMPLE.duel.meet`, checked by
`test/duelmeet.mjs`), so the tunnel ports it rather than building a new one.

**The sequence** (decided: no announcement at the door; the card is the
introduction):

1. **The first room holds him alone.** It is the existing debut rule: a new
   type arrives in a quieter room. For the four bosses, the boss fight is the
   debut and the card opens it.
2. **When he finishes assembling, the world stops.** He gets the ring the
   debut card uses, the rest of the room dims, and the card shows **three
   lines at most**:
   - his **name**;
   - **what he does**, in one line;
   - a **tip**, *only if how to beat him isn't obvious*, said plainly.
3. **A touch releases the world.**

**Once per save, not per run.** The full stop plays the first time you ever
meet a type (UNLOCKS already records it). On later runs a small name tag over
him is enough: a returning player should not be stopped fifteen times a run.

**Tier-ups are announced at the door, under the door number** (decided). The
door number stays the headline; the tier-up is a smaller second line:

```
            DOOR 21
    GUNNER MK II · FIRES IN PAIRS
```

No stop, and no card. The one change a tier makes is all it needs to say.

### The cards (the copy in the game)

**Decided after playtest: plain words, no riddles.** The first draft was in
the building's voice ("Plated, head to foot. Almost." / "The head was not
considered."), and a player had to decode it mid-fight. A card says what
makes him different in one short line, and how to beat him outright:

| type | what makes him different | tip (only where it isn't obvious) |
|---|---|---|
| gunner | no card (the onboarding is his) | – |
| rusher | He charges at you. | Watch out when his arm pulls back. |
| shotgunner | Deadly up close. | Keep your distance. |
| shield | His shield stops shots. | Hit uncovered areas. Or get behind him. |
| heavy | Fires three rounds at a time. | – |
| sniper | Slow to aim. His round is fast. | Move while he aims. |
| bomber | Throws grenades. | Keep out of the red ring. |
| armored | Body shots bounce off. | Aim for the head. |
| rocketeer | His rocket follows you. | Put a wall between you and it. |
| laser | Beam sweeps across the room. | Cover does not stop it. Kill him quick. |
| **blinker** (the Keeper) | Dodges the moment you fire. | Fire to make him move, then shoot where he’ll be. |
| kamikaze *(not built)* | Explodes when he reaches you. | Shoot him near his friends. |
| Frankenstein *(not built)* | Two guns. Only his arms shatter. | Shoot off each arm. |
| drone *(not built)* | While it flies, the others aim better. | – |
| spawner *(not built)* | Brings shattered enemies back. | Break the dish while they are down. |

The blurbs in `protocols.js` keep the building's voice; the cards do not.

**Status: the owner's edits from two review passes (2026-09-25 and -26) are
in** — the rusher, shotgunner, shield, bomber, laser and blinker in the game,
and Frankenstein and drone above. Cards the owner left untouched keep the second draft. The
review page records no explicit approvals, so any card may still change.

---

## 12. A boss at the end of every floor

**Decided: the Keeper's pattern repeats.** Every floor ends in an elevator
boss who is the first of the next floor's hardest type: a big, phased version
met once. The next floor then fills with ordinary ones. Every boss fight has
the same three parts.

1. **Adds on a respawn loop.** A few earlier enemies stand in with the boss and
   come back a few seconds after the last of them is shattered, like the
   Keeper's shotgunners. They keep the pressure on, and **one of them carries
   the boss's answer**, so the loop keeps handing it to you.
2. **The boss**, phased, firing on his own timer (§10 for the numbers the
   Keeper settled).
3. **The reward, delivered by his shards** (decided):
   - **A power:** his shards hang, then stream into you. Slow time is the
     first.
   - **A weapon:** his shards stream together into the weapon, on the floor.
     **The exit door stays locked until you pick it up.**

| ends | boss | adds on a loop (and the answer they carry) | reward | kind |
|---|---|---|---|---|
| floor 1 | **the Keeper**, the first blinker | 2 shotgunners → the shotgun's fast re-aim | **slow time** | power |
| floor 2 | **the first Frankenstein**: an evolved gunner, a gun in each hand; his arms go one at a time, and then he rushes and bursts | 2 bombers → the launcher takes both arms in one aim | **the seeker** | weapon |
| floor 3 | **the first drone**, the size of a car, marking you so its gunners lead you | gunners it steers, and a shotgunner → the cone for a target overhead | **sight** | power |
| floor 4 | **the first spawner**, guarded by the toughest of every earlier floor, all of whom it reassembles, and with **one second life of its own** | a bomber among the guards → a blast that clears them inside the hang | **a second life** | power |
| floor 5 | **the finale: the Keeper, again**, with slow time of his own | blinkers at Mk III | – | – |

**What the Frankenstein boss is:** a gunner that evolved. Two guns fire at
once. Only his arms break, and each arm takes a gun with it. When both are
gone his chest opens and he runs at you and bursts: the kamikaze's rush,
seen for the first time. So he introduces **two** types to floor 3:
Frankensteins (the gentle Mk I, two guns and one shot) and **kamikazes**.
The schedule now has the kamikaze on door 20 (floor 3), not floor 4, and
`--schedule` still keeps every rule.

### The rewards

**Slow time** (the Keeper). As today, from door 10.

**Built (2026-09-26):** the Frankenstein boss on door 16's last leg (the
Keeper's room, generalised: `bossProto()`, `BOSS_ADDS`), his two bombers on a
loop, and the seeker: his shards stream together on the floor where he fell,
the exit waits until it is picked up, it fires a homing charge that bursts in
3.5 m (you included), and a kamikaze pack cleared without any of it arming
refills it (+1, one at a time). The seeker is never the automatic fallback
when a gun runs dry, and it stays in the bag empty.

**The seeker** (Frankenstein; a weapon, so it's collected). One kamikaze of
your own. Send it and it hunts the nearest enemy, then bursts, shattering him
and anyone in its radius, **you included** if you're too close.
- It lives in the weapon switcher (§13) as `SEEKER ×1`.
- **It refills once per kamikaze encounter** (decided). Clear a group of
  kamikazes without letting one arm, and the group leaves **one** core
  behind: +1 seeker. That's one per group, not one per kamikaze, because the
  seeker is strong. It holds one at a time. That turns *kill the kamikaze
  first* (§3, ×1.40) into a reward as well as a survival rule.
- Its radius should match the kamikaze's (3.5 m), so it reads as the same
  thing, turned around.

**Sight** (the drone; a power), **fed by a no-misses streak** (decided).
**Built** except the drone boss that hands it over: the streak and its
forgiveness rule (`aimHit()`/`aimMiss()`, numbers in `SIGHT` in
`src/balance.js`) and the see-through render (a twin of every body part on one
precompiled material, drawn only where a wall covers him), checked by
`test/sight.mjs`. It counts from the start of every run. By design nothing
shows until `hall.sightTaken` is set, which is the drone boss's job — but
**for playtesting (decided), `SIGHT.playtest` owns it from door 1 of every
tunnel run** until the drone boss exists; turn it off then. Rules made while
building it: one trigger pull is one shot however many pellets; a burst
weapon's rounds are each their own shot; a launcher shell is a hit if its
blast shatters anyone; landing on the Keeper without killing him is a hit;
a round that flies off into the distance and expires is a miss; the streak
is the run's (a new run starts at 0, a retry keeps it). Not built: the next
wave's assembly spot at 50, and any HUD count (the owner's call).
After the drone boss, a run of hits without a miss lets you see through walls:

| hits in a row | what you see |
|---|---|
| 10 | faint shapes through walls |
| 30 | sharper shapes |
| 50 | sharp outlines, including where the next wave will assemble |

- **A miss is a round that hits a wall or surface without shattering anyone.**
  A shotgun shell counts as a hit if any of its pellets shatters someone. A
  pierced round that shatters one man and then hits the wall is a hit.
- **Plate and armor count as misses** (decided). A round on a shield's plate
  or an armored body hits a surface and shatters no one. That teaches you to
  shoot round the plate and at the head.
- **A blinker's dodged bait shot counts as a miss** (decided). Blinkers are
  streak-breakers: punish his cooldown rather than bait him, or bait with a
  blast he can't blink out of.
- **Every tier forgives one miss** (decided). The first miss in a tier drops you
  to that tier's floor. A second miss in the same tier drops you to the floor
  of the tier below, which forgives once in turn:

  ```
  43 ─miss→ 30 ─2 hits→ 32 ─miss→ 10 ─2 hits→ 12 ─miss→ 10 ─4 hits→ 14 ─miss→ 0
  ```

  Sight follows the tier you land on: sharp, sharper, faint, gone.
- **It's a long-horizon streak.** It runs across rooms and doors for the whole
  run, which is what makes it passive and global, as you described: you
  maintain it through careful shooting everywhere.
- **Before the drone boss the streak doesn't show.** Nothing yet reads it.

**The tempo streak shortens reloads and weapon swaps** (decided, **built**:
`tempoTick()`/`tempoKill()` in `src/main.js`, numbers in `TEMPO` in
`src/balance.js`, checked by `test/tempo.mjs`; the count shows beside the gun
pills from 5), in tiers of five. It counts kills, each within ~3 world-seconds of the last:

| kills in tempo | reload and swap time | pistol reload (1.0 s) | launcher reload (2.0 s) |
|---|---|---|---|
| 5 | ×0.75 | 0.75 s | 1.5 s |
| 10 | ×0.5 | 0.5 s | 1.0 s |
| 15 | ×0.25 | 0.25 s | 0.5 s |
| **20** | **none**: the reload sound and a quick flick of the gun, for as long as the streak holds | – | – |

- **Any break drops it to zero** (decided). No tiers on the way down. It's the
  short, hot streak; no-misses is the long, forgiving one.
- **The window only runs while someone is alive to shoot.** A cleared room
  pauses it, so the walk to the next door never breaks it. Without that,
  every corridor would reset it, and tempo would measure walking speed
  instead of fighting pace.
- **It's on the world clock.** Freezing stretches the window, and the bank
  pays for it.
- **Three streaks on screen is too many to read.** Headshots feed the refund,
  no-misses feeds sight, and tempo feeds reloads. Each should show only while
  it's live, small, next to the thing it feeds: the tempo tier by the weapon
  name and its pills, the no-misses tier by the sight shimmer, and the
  headshot count by the slow-time meter.

**A second life** (the spawner; a power). Once per run, when you're
shattered, you hang where you fell and **reassemble**, the spawner's own
trick turned around. It's used once and gone for the run, and the HUD shows
it while you hold it. While you reassemble the world is stopped, and you
come back with a moment's grace. This bends "one hit and you shatter" once,
late, and visibly, which is why it is the last reward and not the first.

**The headshot streak → slow-time refund rate** (decided, a base mechanic,
not a boss reward). It also answers `BACKLOG.md` #3: a headshot reward that
still lands when the bank is already full.

### The spawner boss (floor 4)

- **Guarded by the toughest of everything the run has met:** shotgunner III,
  heavy II, an armored man, a blinker, gunner II, and a bomber whose launcher
  is the way through.
- **It reassembles all of them.** Every guard it holds hangs, then reforms.
- **It has one second life of its own.** Break its dish and it hangs too. Its
  guards stay down while it reforms, a breather to collect guns. Then it
  reforms and brings the whole room back with it. Break it again, and
  everything it was holding stays down.

`--spawner-boss` asks the question a spawner room asks, harder: can five tough
guards go down before the first is back, with time left for the dish? With
the switcher, each guard is taken with the best gun you carry:

| loadout (3 slots) | hang 2 s | 3 s | 4 s |
|---|---|---|---|
| pistol II only | 15.5 s of bank | 12.3 s | 9.1 s |
| pistol II, shotgun III, AP rifle | 7.7 s | 4.5 s | 1.3 s |
| pistol II, shotgun III, **launcher II** | 1.0 s | **0 s** | 0 s |

(Bank seconds to finish, both of its lives; the bank caps at 10.)

- **With the pistol alone it's a wall at any hang**, which is right for a boss:
  it asks what you brought.
- **Recommend a 3 s hang.** With a launcher the guards go down inside it. With
  a shotgun and an AP rifle it costs about 2 s of bank per life, a real spend.
  Take the bomber's launcher first and it's a clean fight: the *take his gun*
  recipe (§3), as a boss's key.

- **Boss rooms keep the room rules:** the seal, waves assembling at once, and
  a kill-order question built into the adds.
- **What the model covers:** the Keeper and his room (`--boss`,
  `--keeper-room`, ladder rows G1 and G5), and each boss's type at its
  ordinary tiers (`--newcomers`, `--spawner`). The other bosses' phases are
  sketches that each need their own pass of the Keeper's kind.
- **The finale** is §14.

---

## 13. The weapon switcher

**Built** (tunnel, city and rush; the simplified modes keep one gun). Code:
`switcherOn()` through `bagTake()` in `src/main.js`, numbers in `SWITCHER` in
`src/balance.js`, checked by `test/switcher.mjs`. Not built yet: dimming the
pill a new pickup would push out, and the seeker's slot (it waits for the
seeker).

**Decided: you keep the guns you find and swipe between them.** Today a pickup
is the one gun you hold, plus clips. With a switcher, *take his gun* stops
meaning *give up yours*, and choosing the right gun for the room becomes part
of the fight.

- **The control:** the weapon name at the bottom of the screen gets a small
  triangle on each side, `◀ SHOTGUN ▶`. **Swipe left or right on it** to
  change weapons.
- **Order: most recently picked up first.** The gun you just took is one
  swipe away, and the pistol, picked up first, sits at the far end.
- **The label is its own touch zone.** The screen already splits into
  left-drag (move), right-drag (look) and tap (fire). A swipe that *starts*
  on the label belongs to the switcher. It must never turn the camera or
  fire, because the camera never moves unless the player moved it
  (`PILLARS.md` §4).
- **How many to carry: a cap of three**, the pistol plus the two most recent.
  A new type past the cap pushes out the one picked up longest ago, which
  the recency order already shows you. **Why cap it:** each gun keeps its
  own clips, so carrying everything multiplies your ammo, and scarcity *is* the
  difficulty curve (`PILLARS.md` §2). A cap keeps the choice a choice.
- **An empty gun leaves the rotation.** A swipe should never land on a gun
  that can't fire.
- **Switching takes a beat** (~0.25 s, the same clock as a reload) and works
  while frozen. Stopping time to change guns is exactly the kind of decision
  slow time is for, and the bank pays for it.
- **A pill counter shows the slots** (decided), subtle, under the name:

  ```
        ◀  SHOTGUN  ▶
           ●  ◉  ○
  ```

  One pill per slot, in rotation order. Filled means carried, ringed means
  the gun in hand, and hollow means an empty slot. At three filled, the next
  pickup will push one out, so the pill it will replace, the oldest, should
  dim when a new gun is on the floor near you.
- **The seeker is a slot too** (`SEEKER ×1`), and it doesn't count against the
  cap or take a pill.
- **What it does to the model:** nothing breaks. The ladder already prices a
  tier against the best gun on the floors; the switcher is what makes
  "the best gun on the floors" the gun in your hand.

---

## 14. The finale: the Keeper, reassembled

**Built (2026-09-26):** `FINALE` in `src/balance.js`, `finaleStart()`/
`finaleTick()` in `src/main.js`, checked by `test/finale.mjs`. Door 39's last
leg: the Keeper with a 0.65 s dodge, armored (body shots clank; three head
hits), firing his rounds on a 1.25 s clock and, every 4 world-seconds, a
homing rocket or a small kamikaze of his own that hunts you (2 m burst). A
spawner stands in the chamber beside and behind him holding him and five
guards (shotgunner, heavy, armored, gunner, bomber): guards hang 3 s, he hangs
6 s. Break the dish while he is down and the loop is broken: his shards hang,
RUN COMPLETE, and the exit opens onto floor 6. **Not built:** the wall
shattering outward onto the white city (the run simply continues).

**Decided: the Keeper is the ultimate boss.** The run ends where it began,
against the man whose time you took, now carrying a piece of every floor.

**Why he's back.** Floor 5 is full of spawners, and a spawner reassembles
the shattered. A spawner in his room keeps reassembling *him*.

### What makes him ultimate

- **He dodges at the trigger** (decided). The moment you fire, he knows where
  the round will be, picks a direction and blinks. His blink and his short
  cooldown run on the world clock like everything else, but so fast that:
  - **at full speed his blink is a teleport.** There's nothing to read, and he
    is untouchable;
  - **in slow time it's a dash you can see start**, so you know which way
    he's going.
- **The fight: bait, read, land it.** Fire one round to bait him. Watch which
  way he goes, swing onto where he's heading, and fire again in quick
  succession. The second round has to **arrive** before his cooldown ends, or
  he blinks out of it.
- **He's armored.** Only his head counts.
- **He carries the floors' attacks:** kamikazes he fires at you (small ones
  that hunt you and burst), rockets that follow you, and his own rounds.

No exception to `PILLARS.md` §1 is needed: he's on the world clock. What
makes him hard is that his clock is fast, and what makes him beatable is the
power you took from him.

`--finale` prices the second round: react, swing onto his 24 cm head, fire,
and the round's flight, all against his cooldown, at 10 m. Your reaction and
swing are real seconds, so the world time they cost depends on whether slow
time is on, and while it is, whether you're moving:

| his cooldown | slow time, still (×0.05) | slow time, moving (×0.3) | no slow time |
|---|---|---|---|
| 0.40 world-s | 77–95% | 0% | 0% |
| 0.55 world-s | 77–95% | 77–78%, shotgun Mk III or rifle only | 0% |
| **0.65 world-s** | **77–95%** | **77–95%** | **0%** |

(The range is the gun: 77% for most, 95% for the Mk III pistol's paired
round. What's left, once the round arrives in time, is hitting a head.)

**Set it at 0.65 s** (decided goal: the double-shot needs slow time, and
it's a budget to manage, not a pose to hold). The double-shot works with any
gun, at any pace inside slow time, and never without it.

**The budget is the fight, and it's tight but possible:**
- **Each attempt costs ~1.1 s of slow time:** the bait shot, the read, and the
  swing.
- **Three head hits** (one per phase) at ~78% take about **3.8 attempts: ~6.9 s
  of bank** at the fifth floor's drain, out of a bank that holds 10.
- **The rest has to cover dodging** his rounds, his kamikazes, his rockets and
  the guards', which in his room is slow time too.
- **So the guards are the refill.** Each guard shattered refunds ~1 s at that
  depth. The rhythm the fight asks for: kill guards to fund an attempt, spend
  it on the bait and the head, repeat. The headshot refunds you've banked all
  run are what let you start it with a full bar.

### The loop, and how to break it (decided)

A spawner in the room, guarded, keeps reassembling him and his guards. The only
way out:

1. **Shatter the guards, then the Keeper.**
2. **The Keeper hangs** where he fell. It's a long hang, and
   it is your window.
3. **During it, his guards reform** (their hang is shorter). **Shatter them
   again, then break the spawner's dish**, before the Keeper comes back.
4. **With the spawner gone, the loop is broken.** Whatever it was holding,
   him included, stays down.

`--spawner-boss` already prices step 3. Re-clearing five tough guards and
breaking a dish takes about **3.6 s** with a launcher in your loadout, **5.8 s**
with a shotgun and an armor-piercing rifle, and **8.7 s** with the pistol alone.
So **his hang should be about 6 world-seconds**: on foot, a clean window with
the right guns, a tight one without them, and a wall with the pistol alone.
Everything is on the world clock, so freezing stretches the hang and the
guards' reform alike. That turns the window into a **bank** question: the
re-clear costs ~3.6 real seconds frozen with a launcher and ~8.7 with the
pistol alone, against a bank that caps at 10. The last loadout exam of the
run is also its last scarcity exam (`PILLARS.md` §2).

**His shards.** When the loop breaks, his shards don't stream into you. You
already have his time. They hang, the whole room's shards hang with them, and
then the wall at the end shatters outward, and the window from
`TUNNEL_META.md` §1 is there: the white city, the tower you've been climbing.
The tunnel was always inside it. That ties the Tunnel to CITY STREETS: the
place you step out into is the arena mode's city.

- **After the run, the Mk IIIs.** The door budget (§1) left most types'
  Mk IIIs past the fifth floor. Beating the Keeper is the natural key for a
  harder mode that has them (`TUNNEL_META.md` §2e: modifiers you choose).
