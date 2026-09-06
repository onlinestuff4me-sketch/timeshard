# The story

## 1. The premise

You are a soldier. A secret government military programme kidnapped you and
put you inside a simulation built to train time-stopping soldiers.

You have to complete the simulation to get out. It keeps telling you that you
are nearly done. You are not — it was never built to be completed.

The programme does not understand the simulation either. The time-slow
technology is not theirs. They have had it since the 1940s and they have never
worked out what it is.

**The architects are still watching.** They decide whether you are worth
helping.

---

## 2. The opening, beat by beat

1. You wake in a hallway. You do not remember arriving.
2. Signs on the walls: **`EXIT THIS WAY →`**. You follow them.
3. A door ahead, marked **`EXIT`**.
4. A man steps into the corridor between you and it.
5. He fires. The screen says **`DODGE`**. You do. *How did I just do that?*
6. He fires again. You dodge again. *Seriously, how am I doing this?*
7. You look down. You are holding a gun. *Where did that come from?*
8. **`TAP TO SHOOT`**, flashing. If you don't, it becomes **`OR DIE UNTIL YOU
   DO`** — and he shoots you.
9. You shoot him. The door opens. It is not the exit.

**This is the lesson order the game already has.** `TUTORIAL-GOALS` teaches
dodge in lesson 5 and hands the gun over in lesson 6, with the weapon arriving
*"on the same beat as the words that name it."* The story does not need the
tutorial restructured — it needs it narrated.

---

## 3. The voice

You hear numbers. A tone, then a woman reading five-digit groups. You have no
idea what they are or who is sending them.

They are instructions. They are how you get out.

### 3.1 What numbers stations actually are

Shortwave broadcasts, running since roughly the world wars, that transmit
nothing but strings of digits read aloud. The known ones follow a fixed shape:
an **interval signal** — a scrap of music or a tone — then a voice, usually a
woman's, sometimes a child's, reading **five-digit groups**. The Lincolnshire
Poacher opened with bars of the English folk song it is named for and raised
the pitch of the last digit in every group.

### 3.2 What a one-time pad is

A **pad** is a list of random numbers. The sender and the receiver each hold
the same copy, agreed in advance. Nobody else has it.

To send `E`, which is letter number **05**:

| | |
|---|---|
| the letter | `05` |
| the next number on the pad | `+ 17` |
| **what goes out over the radio** | **`22`** |

The receiver hears `22`, subtracts the `17` on their own pad, and gets `05` —
`E`. Anyone else hears `22` and learns nothing, because the pad number was
random: `22` is equally consistent with every letter in the alphabet. There is
no pattern to find and no amount of listening that helps. **This is the one
cipher that is not merely hard to break but impossible without the key.**

Each pad number is used once and then crossed off. Reusing one is the only
thing that breaks the system, which is why a page decodes one message and no
more.

### 3.3 Why that is the right fit here

- **The broadcast can ship complete on day one and still give nothing away.**
  The player really is hearing the finished message from their first run. The
  secret is not withheld by the game; it is withheld by arithmetic.
- **Recovering the pad in pieces gives the message in pieces**, letter by
  letter, because each number decodes exactly one position. §4.1.
- **One page, one message** is why each recovered fragment opens exactly one
  transmission.

And the fiction is already written and true: almost none of these stations has
ever been attributed to anybody — decades of hobbyist logging, a four-CD
public archive in 1997, one 1998 trial that matched broadcasts to specific
agents, and still, officially, nobody sends them. **They have been
transmitting since the forties and no government has ever claimed them,
because they are not from any government.**

### 3.4 Audio only plays in downtime

**Never during a fight, and never in slowed time.** Slow time is used in the
most concentrated moments a player has — reading a round, picking a target,
deciding where to step. Putting story audio there interrupts the thing it is
interrupting for, and it makes delivery unpredictable: a player who freezes
rarely would hear almost nothing.

So there are two channels, and both are quiet moments the game already has.

| | channel | carries | when |
|---|---|---|---|
| **1** | **the corridor** | the transmission — the numbers | walking a hallway between encounters, on first entry to the door it is assigned to |
| **2** | **the way back to the menu** | the cipher — the pad | at the end of a run, before the start screen, with the text on screen |

Nothing plays over combat, nothing competes with a coach line, and nothing
can be missed by playing a particular way.

**This retires the three-tier model** (tone always / body in freeze /
scripted keystones). Keystones existed to guarantee that critical audio was
heard; guaranteed downtime delivery does that for everything, so the tiers
collapse into the two channels above.

### 3.5 The corridor channel, and the leg it needs

The transmission plays while the player walks a hallway, and the way on
appears at the next turn after it finishes.

**Build the leg for top speed. Place the door dynamically.**

- The leg is generated long enough that a player moving flat out cannot reach
  the end before the audio does, plus margin.
- **The exit is not at the end of the leg.** It is positioned at the first
  turn the player reaches *after* the audio finishes. A player who dawdles
  gets a short leg; a player at full stick gets the long one. Neither is made
  to trudge through corridor with nothing left to hear.
- The stretches past that turn are built and simply never walked. Nothing is
  generated at runtime, which is what `PILLARS` §8 requires; only one
  pre-built door object is positioned.

#### The arithmetic, and what it costs

Top speed is **4.6 m/s** (`balance.js:854` — and note there is no
player-controlled sprint; the 6.5 m/s figure is the corridor scripting the
player to a dropped gun). Cells are 4 m.

| transmission | distance to cover | cells |
|---|---|---|
| 15 s | 69 m | 17 |
| 20 s | 92 m | 23 |
| 25 s | 115 m | 29 |

**These are long.** A normal leg is a handful of stretches; twenty-nine cells
is far longer than anything the generator currently builds, and it is all
corridor with nobody in it. That argues for the **short end — 15 seconds** —
which is a tone and six or eight groups. The script has to be written to that
budget rather than trimmed to it afterwards.

### 3.6 Every transmission is replayable

From the archive, at any time, in full.

A decode puzzle you cannot re-listen to is unfair — a player who missed one
group is permanently stuck on that message. It also means the corridor
delivery only has to work *once*, on first entry, which is what makes the
one-off leg length acceptable.

### 3.7 The audio is eleven files

Ten digit readings and one interval tone. Every message in the game is a
sequence of those. A twenty-message script costs no more to record than a
one-message script.

---

## 4. The pad is a debt, not an event

**The problem with tying the pad to death:** a player who does not die does
not get it, and without the pad nothing decodes and the ending is
unreachable. A skill gate on the critical path is a bug.

**The problem with tying it to the end-of-run screen:** a player can die, see
the retry screen, and close the app. They come back to a main menu with
CONTINUE on it, and the payout never happened.

**Both are fixed by not treating the payout as an event at all.**

Reaching a door **owes** the player that door's fragment, recorded and
persisted the moment they walk in. The debt is then paid at the first quiet
moment available, and if the app dies in between, the debt is still there.

### 4.1 When the debt is paid

**On any transition between being in a run and not being in one, in either
direction:**

| the player | what happens |
|---|---|
| dies, chooses MENU | pad screen, then the main menu |
| closes the app on the retry screen, comes back, presses CONTINUE | pad screen, then the run loads |
| quits to the menu any other way | pad screen, then the main menu |
| **presses RETRY** | **nothing. The run has not ended.** |

Paying on the way *into* a resumed run is not an interruption bolted on — it
is the same screen in the same place in the flow, and the player is waiting
on a load anyway. It is also the correct fiction: being put back into the
simulation after a gap is exactly the moment the character would surface.

**RETRY is never interrupted.** It is the highest-frequency action in a
one-hit-kill game, and a story screen in front of it would be intolerable. A
player who dies six times on one door and retries each time simply accrues
the debt and is paid all of it when they finally leave.

### 4.2 It only fires when something is owed

A player who quits and resumes without reaching a new door sees nothing. The
screen exists only when there is a fragment to hand over.

Skippable after a beat, and everything is permanently in the archive, so a
player is never trapped in a screen they have already read.

### 4.3 What you get

**Every door owns one fragment**, paid in order.

- **It cannot be farmed.** Door 1's fragment arrives once.
- **It paces itself against depth.** A deeper run pays more, with no second
  difficulty curve.
- **It cannot be gated by skill, or lost to a closed app.**
- **Nothing is permanently missable.** Later runs pass the same doors.

A long survival streak accrues a backlog and is paid all of it at once, which
makes the end of a good run a bigger event rather than a smaller one.

### 4.4 Partial pad, partial message

Each pad number decodes one position, so holding part of a page gives part of
a message with the rest blank:

```
M _ E T   T H _ M   A T   T H _   _ N D
```

Players read ahead and guess. That hook is not a puzzle layer bolted on top —
it is exactly what the arithmetic in §3.2 does.

### 4.5 It stays inside the meta rule

`TUNNEL_META` §2 says the meta never grants power, only knowledge and access.
The pad is knowledge in the most literal sense available: it changes nothing
anywhere in the game except what the player can read.

---

## 5. The lie, and how it is told

**The simulation announces that it is finishing, and then continues.**

The game already does this once: `TRAINING COMPLETE` fires at the end of the
onboarding and is immediately followed by more corridor. That is not a string
to replace — **it is the first instance of the lie**, and everything after is
the same message with a new number:

> `TRAINING COMPLETE` → `PHASE ONE COMPLETE` → `FINAL ASSESSMENT` →
> `FINAL ASSESSMENT — EXTENDED`

Believed the first time. Doubted by the third.

---

## 6. Why the mechanics are what they are

| the rule | the reason |
|---|---|
| time slows when you stand still | you are the prototype |
| you only hear the numbers in empty corridors | the sim jams the signal wherever it is watching you closely |
| one hit kills you | the simulation is not there to keep you alive |
| one hit kills them | neither are they |
| the doors never end | it was not built to be completed |
| dying teaches you something | it is the only time you are outside the sim |

---

## 7. The clone

The final encounter is a copy of you. It slows time. It dodges your bullets.
It is built so you cannot win.

**It dies in one hit, like everything else.** The problem is landing the hit —
it reads your shots the way you read theirs and steps out of the line. The
pillar does not bend: one hit shatters them, and it always would have, if you
could ever hit it.

The player has to lose to it several times, visibly, watching it sidestep.
Impossible has to be *legible* or it just reads as unfair.

---

## 8. The upgrade, and who gives it

Slow time is unlocked mid-run, on the door where walking out of a round stops
being enough (`TUTORIAL-GOALS` §6). The full stop is not in the programme's
build. The architects add it, because the decoded messages are the test and
finishing them is what proves you are worth it.

`PILLARS` §1 is *time moves when you do*. A complete stop is that rule's
endpoint, and it is the only thing that beats something which survives by
reacting.

Stop time, take the shot, and the simulation breaks.

---

## 9. The ending, and the second run

You meet the architects. You may ask **one question**.

Then the simulation deletes your progress, and if you want to ask a different
one you play it again.

### 9.1 The primer survives the wipe

**Strongest recommendation in this document.** The run is wiped; what you
learned to read is not.

Thematically it is the whole point — knowledge is the one thing they cannot
take back, which is the same rule §4.3 is built on. Practically it is what
makes a second run an invitation instead of a punishment: you already read the
station, so the replay is faster and you are playing it for the answer you
did not pick.

Without this, wiping a finished player's save is the most hostile thing in
the game.

---

## 10. Questions log

Running list. Answered ones stay, with the answer, so the reasoning is not
re-litigated.

### Open

| # | question | why it matters |
|---|---|---|
| **Q1** | **Where does the clone live?** | The tunnel is endless by design. A finale needs a fixed depth. |
| **Q2** | **Does the third act fit inside the depth people reach?** | Slow time unlocks at door 46 on shipped numbers. If the full stop extends it and the clone is the finale, the third act sits past door 46 — deeper than most players get. Either the reveals move shallower or the unlock does. |
| **Q3** | **How many questions at the end, and what are they?** | The ending only works if each answer is worth a whole replay. Three or four, not twenty. |
| **Q4** | **Does the pad survive the ending's wipe?** | Recommended yes (§9.1). Not yet confirmed. |
| **Q5** | **How many transmissions and fragments in total?** | One fragment per door means the count is decided by Q1. |
| **Q6** | **Recorded voice or synthesised?** | Eleven files either way, but a real voice is the whole texture of this device. |
| **Q9** | **Is 15 s enough for a transmission?** | The arithmetic in §3.5 makes this the binding constraint: at 4.6 m/s, 25 s of audio needs 115 m of empty corridor. 15 s needs 69 m, which is still long. A tone and six groups may be too thin to feel like a real broadcast. |
| **Q10** | **What fraction of doors carry a transmission?** | §3.5 proposes one in five. Too many and the long empty leg stops being a change of rhythm. |
| **Q11** | **Can a transmission leg hold enemies at all?** | Specified as empty. Given how long these legs are (§3.5), dead air is a real risk, and one body at the far end after the audio may be the better shape. |
| **Q12** | **Where does the archive live?** | Replay (§3.6) and the decode view need a home. UNLOCKS is the obvious candidate. |
| **Q13** | **Does the pad screen appear before or after the death stats?** | The end-of-run screen already carries the run stats and the retry button. Two screens in sequence, or the pad folded into the one that exists. |
| **Q14** | **What happens if several fragments are owed at once?** | A backlog of six after a long run is six pieces of audio. Played in sequence, summarised as one, or capped per payout — all different feels. |

### Answered

| # | question | answer |
|---|---|---|
| **A1** | When does audio play? | **Superseded.** Not in slowed time — that is the player's most concentrated moment and delivery there is unpredictable. Two downtime channels instead: transmissions in empty corridors, the pad on the way back to the menu (§3.4). |
| **A2** | How often does a pad fragment arrive? | Per door, paid out at the end of a run (§4). |
| **A3** | Can the pad be farmed? | No. Each door's fragment arrives once. |
| **A4** | Can a fragment be permanently missed? | No — and no longer skill-gated either, since every run ends eventually (§4). |
| **A5** | Does the boss break the one-hit pillar? | No (§7). It dies in one hit; the difficulty is landing it. |
| **A6** | Does the pad break the "meta is never power" rule? | No (§4.3). |
| **A7** | What if the player never dies? | They still get the pad. It is keyed to a run *ending*, not to dying (§4). |
| **A8** | Can a player outrun a transmission? | No. The leg is built for top speed up front. There is also no player-controlled sprint — 4.6 m/s is the ceiling (§3.5). |
| **A10** | What if the player closes the app on the retry screen? | Nothing is lost. The fragment is owed the moment the door is entered and persisted; it is paid on the next CONTINUE, before the run loads (§4.1). |
| **A11** | Is RETRY interrupted? | Never. It is the highest-frequency action in the game; the debt simply accrues (§4.1). |
| **A12** | Does a player who dawdles walk a long empty corridor after the audio? | No. The exit is placed at the first turn after the audio ends, not at the end of the built leg (§3.5). |
| **A9** | What if a player missed a group? | Every transmission is replayable in full from the archive (§3.6). |

*(Q7 and Q8 are retired — both were about the death screen's behaviour on a
door whose fragment was already held, and the run-end payout in §4 removes
the case.)*

---

## 11. Changed by this

`docs/TUNNEL_META.md` says the meta never grants power. Kept: the primer is
knowledge, and the full stop is given by the story rather than earned by
grinding.

One earlier line is overruled — that the game should have no ending because
the tunnel is endless. It has one. The endlessness is the antagonist's plan,
not the game's shape.
