# The story

## 1. The premise

You are kidnapped and put inside a military simulation built to train the
next generation of time-stopping soldiers.

You have to complete the simulation to get out of it. It keeps telling you
that you are nearly done. You are not.

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
dodge in lesson 5 and hands over the gun in lesson 6, with the weapon arriving
*"on the same beat as the words that name it."* The story does not need the
tutorial restructured — it needs the tutorial narrated.

The one change: the door marked `EXIT` must be **visible past the barrier**
before the man appears. Seeing the goal, then something in the way of it, then
somebody in the way of it, is the escalation the sequence runs on.

---

## 3. What the player finds out, and when

| | they learn |
|---|---|
| **Opening** | there is an exit, and something is between them and it |
| **Early doors** | the exit is always the next door, and it never is |
| **Middle** | this is a simulation, and they are the subject of it |
| **Late** | it is a training programme for time-stopping soldiers, and they are the prototype |
| **The end** | it was never built to be completed |

---

## 4. The lie, and how it is told

**The simulation announces that it is finishing, and then continues.**

That is the whole device, it is repeatable, and the game already does it once:
`TRAINING COMPLETE` fires at the end of the onboarding and is immediately
followed by more corridor.

So `TRAINING COMPLETE` is not a UI string to be replaced — **it is the first
instance of the lie**, and everything after it is the same message wearing a
new number:

> `TRAINING COMPLETE`
> `PHASE ONE COMPLETE`
> `FINAL ASSESSMENT`
> `FINAL ASSESSMENT — EXTENDED`

Each one is followed by another door. The player believes the first, doubts
the third, and by the fourth understands they are not being let out.

---

## 5. Why the mechanics are what they are

The premise explains four rules the player already feels, which is what makes
it worth having:

| the rule | the reason |
|---|---|
| time slows when you stand still | you are a prototype time-stopping soldier |
| one hit kills you | the simulation is not there to keep you alive |
| one hit kills them | neither are they |
| the doors never end | it is not built to be completed |

The first row is the one that matters. The game's central mechanic has had no
in-world explanation, and now it has the only one it needs.

---

## 6. The clone

The final encounter is a copy of you. It slows time. It dodges your bullets.
It is built so you cannot win.

**It dies in one hit, like everything else in this game.** The problem is
landing the hit — it reads your shots the way you read theirs, and steps out
of the line. Nothing about the pillar changes: one hit shatters them, and it
always would have, if you could ever hit it.

The player has to lose to it several times, visibly, watching it sidestep.
Impossible has to be *legible* or it just reads as unfair.

---

## 7. The secret is the core rule taken to its limit

Slow time is unlocked mid-run, on the door where walking out of a round stops
being enough (`TUTORIAL-GOALS` §6). It has a second setting nobody is told
about: **held long enough, without moving at all, it stops time completely.**

`PILLARS` §1 is *time moves when you do*. Standing absolutely still — longer
than the game has ever asked anyone to stand still — is the one input a player
has never tried, and the full stop is that rule's logical endpoint. It is
discovered rather than granted, and it is the only thing that beats something
which survives by reacting.

Stop time, take the shot, and the simulation breaks. That is the way out.

### One hint, placed early

The single place in this game where an oblique message earns its keep, because
it is a puzzle hint rather than lore. It is walked past long before it means
anything, and it is the same plain register as everything else:

> `THE PROTOTYPE STOPS. IT DOES NOT SLOW.`

---

## 8. Open questions

**Where does the clone live?** The tunnel is endless by design. The finale
needs a fixed depth, and that is a design decision this document cannot make
on its own.

**Does the act structure fit inside the depth people actually reach?** Slow
time unlocks at door 46 on the shipped numbers. If the secret extends slow
time, and the clone is the finale, the whole third act sits past door 46 —
deeper than most players will ever get. Either the reveals move shallower or
the unlock does.

**How much does the clone cost?** Everything else in this document is signs
and strings. The clone is a new enemy with the player's own kit — new AI, new
fight design, new failure loop. It is the only large build here and it should
be planned as its own workstream, not as the last item on a text list.

---

## 9. Changed by this

`docs/TUNNEL_META.md` says the meta should never grant power, and this
document keeps that: the secret is not an upgrade, it is a thing you find out.

It also overrules one line written earlier — that the game should have no
ending, because the tunnel is endless. It has one. The endlessness is the
antagonist's plan, not the game's shape.
