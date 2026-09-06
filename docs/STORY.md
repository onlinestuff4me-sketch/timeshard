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

Three facts make them the right fit for this game:

**They are decoded with a one-time pad, and are otherwise undecodable.** Not
"hard" — mathematically impossible. Without the pad the digits carry no
information at all.

**A pad page is used once and destroyed.** One key, one message.

**Almost none of them has ever been attributed to anybody.** Decades of
hobbyist logging, a four-CD archive released to the public in 1997, and one
courtroom case in 1998 where prosecutors matched specific broadcasts to
specific agents — and still, officially, nobody sends them.

That last fact is the fiction, already written and true: **the stations have
been transmitting since the forties and no government has ever claimed them,
because they are not from any government.**

### 3.2 What the player hears, and when

**The station is audible only in slowed time.**

The world is quiet during a freeze, the player has attention to spare, and the
same alien technology that slows the world is what makes them a receiver. Stop
the clock and the numbers come through. Let it run and they are gone.

No new system, no interruption, and the one moment in this game that was
already reserved for thinking becomes the moment the story arrives in.

### 3.3 The audio is eleven files

Ten digit readings and one interval tone. Every message in the game is a
sequence of those. A twenty-message script costs no more to record than a
one-message script.

---

## 4. Dying is how you learn to read

Each time you are shot, you wake up, and before the next run you remember
another piece of the primer — the pad that decodes what you have been hearing.

This is the central loop and it is the answer to *why should I keep playing*:
**the failure state is the progression system.**

### 4.1 Partial pad, partial message — which is real cryptography

A one-time pad decodes position by position. Hold three digits of a five-digit
key and you get three of the five characters, with the rest blank:

```
M _ E T   T H _ M   A T   T H _   _ N D
```

Players will read ahead and guess. Guessing ahead is the hook, and it falls
straight out of how the cipher actually works rather than being a puzzle
layer bolted on top.

### 4.2 One fragment per run, not per death

Otherwise the primer can be farmed: die at door one twenty times and read the
whole story in five minutes without playing the game.

One piece per run preserves the design exactly — you died, you learned
something — and cannot outrun the game's own pace.

### 4.3 It stays inside the meta rule

`TUNNEL_META` §2 says the meta never grants power, only knowledge and access.
The primer is knowledge in the most literal sense available: it does not
change a number anywhere in the game, it changes what you can read.

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

## 10. Open questions

**Where does the clone live?** The tunnel is endless by design. A finale needs
a fixed depth, and that is a decision this document cannot make alone.

**Does the act structure fit inside the depth people reach?** Slow time
unlocks at door 46 on the shipped numbers. If the full stop extends it and the
clone is the finale, the third act sits past door 46 — deeper than most players
will ever get. Either the reveals move shallower or the unlock does.

**What are the questions, and how many?** The ending only works if every
answer is worth a whole run. Three or four, not twenty.

**Cost.** Everything here is strings and eleven audio files except the clone,
which is a new enemy carrying the player's own kit — new AI, new fight, new
failure loop. It should be planned as its own workstream.

---

## 11. Changed by this

`docs/TUNNEL_META.md` says the meta never grants power. Kept: the primer is
knowledge, and the full stop is given by the story rather than earned by
grinding.

One earlier line is overruled — that the game should have no ending because
the tunnel is endless. It has one. The endlessness is the antagonist's plan,
not the game's shape.
