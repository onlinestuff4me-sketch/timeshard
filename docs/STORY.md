# The story, and how the walls tell it

Working design notes. **Nothing here is built.** This is the menu we pick
from, in the same spirit as `docs/TUNNEL_META.md` — and it is written against
a specific piece of playtest feedback:

> *why am I here · why am I in this tunnel · who are these enemies · why is
> there a tutorial · why should I keep playing*

Five questions. Four of them can be answered by things painted on a wall.

---

## 0. The thing to notice first

**Half of this story is already in the repo, in the wrong medium.**

`src/protocols.js` does not describe a shooter. It describes an institution:

> GUNNER — *Compliant. Armed. The building has many.*
> ONE-WAY SEAL — *Section closed behind you. Return is not authorised.*
> BLACKOUT — *Emergency lighting only. Compliance is not required to see.*

`docs/PROTOCOLS.md` §1 already commits to the fiction outright: *"the city
runs on schedule; the building is part of the system; when you refuse to
comply it reconfigures itself to contain you."* The UNLOCKS screen already
calls its entries **RECOVERED** and lists them by the building's own
designation. The composer already assigns every leg a protocol number.

None of that is on screen where the player is. It is in a menu they reach by
pressing a button on the title screen, written in a voice nobody in the
corridor speaks.

So the work is not *invent a story*. It is **move the story that exists out of
the data files and onto the geometry**, and then decide what it is a story
*about*.

---

## 1. The fence

Rules first, in the style of `docs/PILLARS.md`, because a story is the single
easiest thing in a game to let creep across a line it was not meant to cross.

### 1.1 The story never takes the screen

No cutscene, no forced pause, no unskippable text, no camera the player did not
move (`PILLARS` §4 already forbids the last one and it applies here hardest).
**A player who reads nothing gets exactly the game they have now.** Every word
is on a surface that is in the world and can be walked past.

### 1.2 The teaching slots are never the story slots

`docs/TUTORIAL-GOALS.md` §3 — *only introduce what serves the lesson* — is not
relaxed for narrative. The five cue slots teach. Walls tell. The one card that
is allowed to carry story is the between-legs headline, and only when the leg
has no actionable claim to make (`legHeadline` already falls back to `DOOR N`,
which is the least interesting true sentence in the game).

### 1.3 Every reveal explains a rule the player already felt

This is the load-bearing rule and the reason to prefer some of the endings
below over others. A twist in a film only has to be surprising. A twist in a
game has to make an old mechanic mean something new. The unexplained rules we
have to spend are:

| The rule | The player already asks |
|---|---|
| time slows when you stand still | why does the world wait for me? |
| one hit kills you, one hit kills them | why are we equally fragile? |
| the world is white; only threat is red | why is there nothing here? |
| they shatter instead of bleed | what are they made of? |
| doors do not end | how far does this go? |
| a death rewinds you | who is putting me back? |
| coach text you did not ask for | who is writing to me? |

Seven unpaid debts. A good ending pays several with one sentence.

### 1.4 Story is not power

Directly inherited from `TUNNEL_META` §2. No fragment changes a number, a
loadout, or a difficulty. What you accumulate is knowledge and access.

### 1.5 Three voices, three surfaces, never mixed

| Voice | Surface | Register |
|---|---|---|
| **the building** | stencilled caps, on walls and doors | designations, directives, no verbs of feeling |
| **a person** | scrawl, off-grid, lower case | short, urgent, second person |
| **the institution** | fragments, on UNLOCKS and record screens | memo, log, transcript |

If the player ever cannot tell which of the three is speaking, the system has
failed. This is cheap to enforce — it is three CSS classes.

---

## 2. The spine

### 2.1 What the player is told, in order

**Act I — doors 1–10. The exit is ahead, and the signs are helping.**

You wake in a corridor with no memory of arriving. On the wall ahead, before
you have moved a step, stencilled at a size you can read from the far end:

```
EXIT ▶ 8
```

That single sign answers *why am I here* (I am getting out), *why this
corridor* (it is the way out), and *what do I do* (follow the arrow) before
the first coach line has to say anything at all. It is also the reason the
opening corridor can stay as empty as `TUTORIAL-GOALS` demands: a sign is not
an obstacle, an enemy, or a HUD element. It is architecture.

The number goes down. `EXIT ▶ 7`. `EXIT ▶ 6`. The building is being helpful,
and being helpful is what makes it frightening later.

**Act II — roughly doors 11–30. The signs stop agreeing with each other.**

The count stalls. Two doors in a row both say `EXIT ▶ 2`. Then a leg says
`EXIT ▶ 5` and it is not a mistake. Nobody points this out. The player catches
the building lying, on their own, which is worth ten lines of dialogue.

And the corridor starts carrying evidence that it has been walked before:

- a pile of red shards already on the floor when you enter, in the debris the
  shatter system already makes
- a dropped rifle with no rounds left in it
- the same stencilled leg designation twice, four doors apart
- a second voice, scrawled, off the grid, over the top of a stencil:
  **`don't follow the arrows`**

That second voice is the payoff on the coach messages. The player has been
reading unattributed help for twenty minutes and been grateful for it. Now the
same register turns up *inside the world*, on a wall, in handwriting. Nobody
says "the person coaching you is in here with you." They work it out.

**Act III — door 30 and down. The signs were never for you.**

The stencils stop reading as wayfinding and start reading as instrumentation.

```
L-41 · P-19 · SUBJECT 4409 · TRIAL 118 · RESPONSE NOMINAL
```

`TRIAL 118` is the sentence that does the most work in this document, and it
costs one `localStorage` integer. It goes up every run. A player on their
fourth run reads `TRIAL 4` and thinks *fair enough, that's my run counter*. A
player who finds the fragment that quotes a trial number in the hundreds
realises the counter did not start with them.

**And one man in the corridor does not raise his arm.**

He stands there. He does not fire, does not strafe, does not close. You may
shatter him and nothing punishes you for it; you may walk past and nothing
punishes you for that either. The whole combat language of this game is *watch
the arm come back* — so a man who never does is the loudest possible statement
about what these people are, made entirely out of a mechanic that already
exists. That is one beat, no new art, no new text, and it answers *who are
these enemies* better than any memo could.

### 2.2 What is actually going on — four candidates

Ranked by how many of the seven debts in §1.3 they pay.

#### A. The rehearsal — **recommended**

The corridor is a reconstruction of a real building, and you are being run
through it in advance of walking it for real. You volunteered, or something
that felt like volunteering. The men in red are modelled from the staffing
roster.

Pays:

- **why is it white** — *because nobody knew what it looked like.* The
  reconstruction has geometry and no surfaces; the planners had floor plans
  and no photographs. The deeper you go, the less anyone knew, which is
  exactly what the existing difficulty ramp already feels like. This turns the
  entire art direction from a style choice into a plot point at a cost of
  zero.
- **why do they shatter** — they are not modelled to survive being wrong
  about. A figure in a rehearsal has one state and then no states.
- **why does a death rewind me** — the rehearsal is restarted. It is not
  merciful, it is cheap.
- **why does the exit never come** — because the reconstruction ends where the
  planners' knowledge ended, and the section past it is generated. You are
  walking past the edge of what anyone actually knows about the building you
  are about to be sent into.

The dark part is not what was done to you. It is **what you agreed to and
why**, and the last fragment is your own intake recording.

#### B. The training set

You are not a person being trained. You are a controller being trained *to
convergence*, and the corridor is the environment. The coach text is reward
shaping. Time slows when you stand still because the substrate throttles
fidelity to what your decisions require — the freeze is not your power, it is
the simulation being cheap. `TRIAL 118` means 117 previous instances did not
converge.

Pays the time mechanic outright, which nothing else here does, and makes the
amnesia mandatory rather than decorative: an instance starts clean because
memory across trials is contamination.

**Use it as the Act II red herring, not the answer.** It is the reading a
sharp player will reach on their own around door 20, and letting them be
half-right and then wrong is worth more than being right.

#### C. The recording

You are dead. This is your last twenty minutes, replayed by the institution to
find out what you knew, and the exit is real — you simply never reached it.
Each door is another pass over the same evidence; the amnesia is a degraded
recording.

Makes the loop the entire point and pays *why does the exit never come*
perfectly. The cost is stakes: a player who works out that everything already
happened has no reason to keep going. Good structure, weak engine.

#### D. The volunteer

Not a separate ending — the **final beat** of whichever of the above we pick.
The clue trail terminates at your own signature. Recommended as the last
fragment of A.

#### The synthesis I would build

**A as the spine, D as the last beat, B as the trap in the middle.** Doors
1–10 you are escaping. Doors 11–30 you conclude you are software. Doors 30+
you find out you are a person who agreed to this, which is worse.

---

## 3. The channels, cheapest first

Everything below is costed against what is already in the build.

### 3.1 Wall stencils — *the whole of Act I for almost nothing*

`tutorPlaceWorldCue` in `src/main.js` already projects a text plane onto world
geometry and scales it by **width in metres** rather than by a distance curve
— and the comment says so explicitly: *"any words the tool authors are scaled
by their own width rather than by a constant tuned to STAND HERE."* It is
already a general-purpose sign painter. It is used for exactly one string.

Generalise it to a small list of signs per leg, each with a wall, a cell, a
height and a register (stencil / scrawl), and Act I is done:

| Sign | Where | Says |
|---|---|---|
| the exit arrow | approach wall, above the door | `EXIT ▶ 6` |
| the leg designation | beside the door | `L-06 · P-31` |
| the induction stencil | leg 1 only | `INDUCTION` |

That last one is one word and it answers *why is there a tutorial*: because
this is the induction, and the building inducts people. It also retroactively
makes `STAND HERE` — which is already painted on a barrier in the onboarding —
read as something the building put there, rather than as UI.

`P-31` is not invented for this. `composeProtocol` already computes it.

### 3.2 The trial counter — *one integer*

Persisted, incremented per run started, rendered on the title screen and in
Act III stencils. Turns the death screen from a failure into an iteration and
seeds the whole Act III reveal.

### 3.3 The lie — *a lookup table*

The exit countdown is authored per door rather than computed: honest through
door 10, stalling through the teens, incoherent past 30. It must never be
random. A player has to be able to *check*, and randomness cannot be checked.

### 3.4 Fragments — *already specified, now with something to be about*

`TUNNEL_META` §2c already specs one fragment per new personal-record door, and
`docs/PROTOCOLS.md` §8 puts it fifth in the build order. It has been waiting
for content. Twenty or so, in the institution's voice, read on the screen
where reading is the activity — UNLOCKS and the run summary — never on the
headline card. Sample tone in §5.

### 3.5 Found evidence — *reuses two existing systems*

Pre-existing shatter debris at a leg entrance, and a dropped weapon with an
empty magazine. Both systems ship. Neither needs a word of text.

### 3.6 The scrawl — *the second voice*

Same sign painter, different CSS class, placed off the grid and over the top of
stencils. Six or eight of them across the whole depth range. Never more than
four words.

### 3.7 The man who does not fire

One enemy variant with its firing directive removed, appearing once, deep.
Behaviour code exists; this removes some.

### 3.8 The window — *the free one*

`TUNNEL_META` §1 already wants *"a leg with one wall of glass looking out on
the white city."* Here is why it is now the best single beat available:

`src/main.js:529` — *"The city tiles from a 3x3 set of UNIQUE block designs, so
the pattern only repeats every PERIOD metres."*

**The city already repeats.** Look out of the window, walk to the far end of
the leg, look again, and you see the same block. That is not a thing we have
to build. It is a thing we have to stop hiding. The single most convincing
piece of evidence that the world is a reconstruction is a rendering
optimisation we shipped for performance reasons.

### 3.9 Room tone

The SFX are synthesised and there are no audio assets to author. A corridor
ambience on a short, audibly identical loop — short enough to notice — is a
handful of oscillators.

---

## 4. What this answers, literally

| Playtest question | Answered by | When |
|---|---|---|
| why am I here | `EXIT ▶ 8` on the wall in front of you | before the first input |
| why this corridor | `L-01 · SECTOR 1` beside the door | door 1 |
| why is there a tutorial | `INDUCTION` stencilled on leg 1 | door 1 |
| who are these enemies | *Compliant. Armed. The building has many.* — moved out of the menu and onto the world; then the man who does not fire | first meeting; ~door 30 |
| why should I keep playing | the sign is lying and you want to catch it; the blanks in UNLOCKS; a fragment on every personal record | continuous |

The order matters. *What do I do* is answered in the first second. *Why am I
here* is answered last, on purpose, and only to a player who went deep enough
to deserve it.

---

## 5. Sample fragments

Tone target: the existing `blurb` voice in `src/protocols.js`. Flat,
institutional, never explains itself, never says anything a form would not
have room for. The horror is entirely in what is treated as routine.

> **F-01 · INTAKE**
> Subject presents no contraindication. Consent recorded, witnessed, and
> filed. Subject was advised of the duration and did not ask about it.

> **F-04 · MAINTENANCE**
> Sector 3 wayfinding re-sequenced per directive. Signage now reads to the
> notional egress rather than to the actual one. No further action.

> **F-07 · ROSTER**
> Personnel modelled from the current staffing return. Where a likeness could
> not be obtained the entry has been left at default. Default is acceptable.

> **F-09 · SURFACES**
> Interior finishes unavailable below level 12. Geometry retained. Finish
> pass deferred indefinitely; the exercise does not require it.

> **F-12 · TRIAL LOG**
> 117 concluded. Response outside tolerance at the ninth door. Instance
> cleared. 118 initiated on schedule.

> **F-15 · CORRESPONDENCE**
> He keeps writing on the walls. Repainting is not cost-effective at this
> depth. He is not telling them anything they can act on.

> **F-18 · SCOPE**
> Below the reconstructed section the environment is generated. Subjects who
> reach it are past the point the exercise was designed to measure. Continue
> to observe.

> **F-20 · INTAKE (CONT.)**
> Subject asked whether they would remember. Subject was told the truth.
> Consent was not withdrawn.

And the scrawl, for contrast — the same world, the other voice:

> `don't follow the arrows`
> `i counted. it goes back up`
> `the ones who stop are the ones they keep`
> `i'm sorry`

---

## 6. Risks, said out loud

**Amnesia is a cliché.** It is only excusable here because the fiction
*requires* it rather than leaning on it — an instance starts clean by design,
and F-20 says so. If we ever have to hand-wave why the player does not
remember, the premise has failed and it should be cut.

**"It was a simulation" voids stakes.** The mitigation is that the stakes are
outside the sim. What happens in the corridor is rehearsal; what it is a
rehearsal *for* is real, and the person it will be done to is real. If a
player can finish the story and conclude that nothing was at risk, we picked
the wrong ending.

**Story creeping into the teaching slots.** The single most likely failure,
because it is the easiest place to put words. `TUTORIAL-GOALS.md` §3 forbids
it and this document does not relax it. If a story beat can only be delivered
in a cue slot, it does not ship.

**Story creeping into power.** Also forbidden — `TUNNEL_META` §2. A sealed
door costs your time bank and pays a fragment. It never pays a gun.

---

## 7. Build order

1. **The sign painter** — generalise `tutorPlaceWorldCue` to a per-leg sign
   list. Everything else in this document is downstream of it.
2. **Exit arrows and leg designations** — Act I, and four of the five
   playtest questions.
3. **`INDUCTION`** — one word, on leg 1.
4. **The trial counter** — one integer, title screen.
5. **The lie** — the authored countdown table.
6. **Fragments** on personal-record doors, per `TUNNEL_META` §2c.
7. **Found evidence** — pre-placed debris, the empty rifle.
8. **The scrawl** — the second voice.
9. **The man who does not fire.**
10. **The window on the city that rhymes.**

Items 1–3 are the ones the playtest feedback is actually asking for, and they
are the three cheapest things on the list.

---

## 8. What I would deliberately not build

- **A prologue.** The player is in a corridor with no memory; so is the
  player. Explaining that in advance throws away the only piece of narrative
  alignment we get for free.
- **A narrator.** There are three voices already and none of them is
  addressing the player from outside the world.
- **Collectible audio logs.** They require standing still and listening, which
  is a mechanic this game has assigned to something else entirely.
- **A named protagonist.** `SUBJECT 4409` is a better name than any name, and
  it is the building's, which is the point.
- **An ending.** The tunnel is endless by design. The story should run out of
  fragments and leave the player in a corridor that keeps going, because that
  is the honest shape of what they are playing.
