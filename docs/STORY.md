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

### 3.4 What the player hears, and when

Three tiers, so that the body of a message is something you have to *go and
listen for*, while nothing story-critical can be missed.

| tier | when it plays | why |
|---|---|---|
| **The tone** — the interval signal that opens a transmission | always, at normal speed | you always know a message is being sent, even if you cannot hear a word of it |
| **The groups** — the five-digit body | in slowed time only | the bulk of the script. Caught in pieces, across many freezes |
| **Keystones** — a handful of scripted transmissions | in full, at normal speed, at fixed moments | the beats the story cannot afford to have missed |

The middle tier is the one that ties the fiction to the mechanic: the world is
quiet during a freeze, the player has attention to spare, and the same
technology that slows time is what makes them a receiver. The one moment in
this game already reserved for thinking becomes the moment the story arrives
in.

**Keystones are rare.** Four or five in the whole game — the first
transmission, the slow-time unlock, the clone, the ending. If everything
important plays at normal speed, the freeze stops being where the story lives.

### 3.5 The audio is eleven files

Ten digit readings and one interval tone. Every message in the game is a
sequence of those. A twenty-message script costs no more to record than a
one-message script.

---

## 4. Dying is how you learn to read

**Every door owns one fragment of the pad. You get a door's fragment by dying
on that door**, in the gap between the death and the next attempt at it.

This is the central loop and it is the answer to *why should I keep playing*:
the failure state is the progression system.

### 4.1 Why it is keyed to the door

- **It cannot be farmed.** Dying at door 1 twenty times gives you door 1's
  fragment twenty times. The only way to get more of the pad is to get deeper.
- **It paces itself against depth** without a second difficulty curve. The
  pad fills at exactly the rate the player is actually advancing.
- **Nothing is permanently missable.** Every run passes back through the
  shallow doors, so a fragment skipped by surviving a door can always be
  collected later.
- **The delivery surface already exists.** The death screen carries the run
  stats and `RETRY FROM LAST DOOR`; the fragment goes there, where the player
  is already reading.

### 4.2 Partial pad, partial message

Each pad number decodes one position, so holding part of a page gives part of
a message with the rest blank:

```
M _ E T   T H _ M   A T   T H _   _ N D
```

Players read ahead and guess. That hook is not a puzzle layer bolted on top —
it is exactly what the arithmetic in §3.2 does.

### 4.3 It stays inside the meta rule

`TUNNEL_META` §2 says the meta never grants power, only knowledge and access.
The pad is knowledge in the most literal sense available: it changes nothing
anywhere in the game except what you can read.

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
| the numbers are audible in a freeze | the tech that slows time is what receives them |
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
| **Q1** | **Where does the clone live?** | The tunnel is endless by design. A finale needs a fixed depth, and picking it is a design decision. |
| **Q2** | **Does the third act fit inside the depth people actually reach?** | Slow time unlocks at door 46 on shipped numbers. If the full stop extends it and the clone is the finale, the whole third act sits past door 46 — deeper than most players will ever get. Either the reveals move shallower or the unlock does. |
| **Q3** | **How many questions at the end, and what are they?** | The ending only works if each answer is worth a whole replay. Three or four, not twenty. |
| **Q4** | **Does the pad survive the ending's wipe?** | Recommended yes (§9.1) — knowledge is the thing they cannot take back, and it makes a second run an invitation instead of a punishment. Not yet confirmed. |
| **Q5** | **How many fragments and messages in total?** | Sets the length of the whole arc, and how deep a player must get to finish reading. One fragment per door means the count is decided by Q1. |
| **Q6** | **Recorded voice or synthesised?** | Eleven files either way, but a real voice is the entire texture of this device and a synthesised one may undercut it. |
| **Q7** | **What does the death screen show when the door's fragment is already held?** | Every death after the first on a given door lands on this. Showing it again, showing nothing, or showing the next locked one are all different games. |
| **Q8** | **Does the tutorial door carry a fragment?** | The onboarding is `countsAsDoor: false` and its deaths are lesson retries, not run failures. Probably not — but it is the first place a player will die. |

### Answered

| # | question | answer |
|---|---|---|
| **A1** | When does the station play? | Three tiers (§3.4). The opening tone always, at normal speed. The five-digit body in slowed time only. Four or five scripted keystones in full at normal speed. |
| **A2** | How often does a pad fragment arrive? | Not per death and not per run — **per door**. Each door owns one fragment, released in the gap between dying on that door and retrying it (§4). |
| **A3** | Can the pad be farmed? | No. Dying at door 1 twenty times yields door 1's fragment twenty times; the only way to get more pad is to get deeper. |
| **A4** | Can a fragment be permanently missed? | No. Every run passes back through the shallow doors. |
| **A5** | Does the boss break the one-hit pillar? | No (§7). The clone dies in one hit like everything else; the difficulty is landing it. |
| **A6** | Does the pad break the "meta is never power" rule? | No (§4.3). It changes nothing in the game except what the player can read. |

---

## 11. Changed by this

`docs/TUNNEL_META.md` says the meta never grants power. Kept: the primer is
knowledge, and the full stop is given by the story rather than earned by
grinding.

One earlier line is overruled — that the game should have no ending because
the tunnel is endless. It has one. The endlessness is the antagonist's plan,
not the game's shape.
