# The script

`docs/STORY.md` is the world. This is what it says, and where.

---

## 1. The pitch

> You wake up in a white corridor with no memory, and every door is marked
> EXIT. None of them is. Turns out you've been kidnapped into a military
> training programme — except the military didn't build the place, they found
> it. The signs on the walls have been written over to keep you calm, and
> every time you die you remember a bit more of how to read what's underneath.
> `FIRST TO REACH THIS DEPTH` turns out to say `NINTH`. And you start
> wondering what happened to the other eight.

**The word "alien" never appears in the game.** They are *the engineers* —
which is the programme's own file-name for them, and the fact that it is only
a file-name is one of the best beats in the story.

---

## 2. Two layers

**The walls carry the plot. The audio is optional.**

| | **wall text** | **audio** |
|---|---|---|
| **weight** | the spine — cannot be missed | supplementary — skippable |
| **length** | whatever the point needs — see §2.3 | thirty seconds of someone talking |
| **register** | mysterious in meaning, clear in instruction | warm, tired, human |
| **job** | *what is happening and what to do* | *who these people are* |
| **decoded?** | yes — pages rewrite the walls | no |
| **cost** | a string | a recorded voice |

A player who mutes the game gets the whole story. A player who listens gets
the person telling it.

### 2.3 Clarity outranks brevity

**There is no word limit.** A line is as long as it has to be to make its
point on one read, and no longer.

An earlier draft capped these at six words and the compression destroyed
them: `ELEVEN TRIALS` and `HOLD THE MOMENT` were shorter than their meaning.
The test is not *is it short* — it is:

1. **Does a first-time player know what it refers to?** `PROGRESS RECORDED`
   fails: recorded by whom, about what?
2. **Is the instruction unambiguous**, where there is one?
3. **Is every remaining word load-bearing?** Trim only after 1 and 2 pass.

`YOU ARE THE FIRST TO GET THIS FAR` is eight words and it is correct.
`FIRST TO REACH THIS DEPTH` is five and it is not a sentence anybody says.

**Technical consequence:** `tutorPlaceWorldCue` draws one `nowrap` line and
scales it by width in metres. An eight-word sign will be unreadably small at
distance, so the mark painter needs **two or three short lines** rather than
one long one. That is a real change to it and it is the only cost of this
rule.

### 2.1 This retires the transmission leg

Audio no longer needs a guaranteed 69 m of empty corridor, because nothing
load-bearing is in it. It plays over ordinary corridors, **ducks to silence
while an enemy is live, resumes when the leg is clear**, and is always
replayable from the archive.

Twenty-five long empty legs are gone with it.

### 2.2 Decoding rewrites the walls

The signs are the programme's overlay. A page lets the player see through it —
so **the wall itself changes.**

The sign at door 4 said `THE EXIT IS AHEAD`. After its page, that corridor
reads `THE EXIT IS A LIE` — struck-through false word, true word beside it, so
the lie stays visible.

The player does not revisit a corridor inside a run. **They revisit it on the
next one**, which makes a second run a walk back through a building that has
started telling the truth. It is the best argument this design has for
replaying, and it costs one lookup at sign-draw time.

---

## 3. Three voices

| | who | where | how true |
|---|---|---|---|
| **P** | the programme | stencilled signage | deliberately false |
| **S** | **Hale**, the eighth subject | handwriting on walls, and all the audio | honest, and wrong in places |
| **B** | the engineers | stencilled, un-overwritten | true |

### 3.1 Why the programme writes anything

The structure has always carried a signal. The first subjects got it raw —
numbers addressed to nobody, in a place that made no sense — and it broke
them. Several never came back.

**So the programme started writing over it.** A calm procedural voice that
explains things, and the subject holds together. It began as a psychiatric
measure and became the deception it is now.

They are not villains cackling. They are people who found that subjects went
mad hearing the real thing, and papered over it — and have spent eighty years
jamming the only thing that could get anybody out.

### 3.2 What "written over" means

They cannot read the channel. They never could. **All they can do is jam
individual words and substitute their own** — which is why a rewritten sign is
a real sentence with one or two words wrong, and why the true version fits the
same skeleton.

### 3.3 Hale

The eighth subject. Reached the last door, was not released, and spent long
enough inside to work part of it out.

**He is never encrypted, because he never had the key.** His handwriting is
always plain, always sincere, and sometimes wrong — the programme lies, the
engineers tell the truth, and Hale guesses well.

He knows: this is not a simulation, the programme did not build it, subjects
break down without the voice, and there is a word in the files.

He does not know who the engineers are. He assumes contractors.

### 3.4 The word

`ENGINEERS` is the programme's file-name for whoever made the place. The
player meets it through Hale at door 22 and reads it as staff for twelve
doors — until door 34, where the engineers use it about themselves.

No page, no mechanic. A word sitting in plain sight turns over.

---

## 4. The lore, settled

**The place.** Not software. A structure, found in 1947, already running.
Inside it a person can slow time. The programme calls it a simulation because
a training simulator is the only use they have managed to put it to.

**The programme.** Military, secret, eighty years old, trying to repurpose
something it cannot read into a soldier factory.

**The channel.** The engineers' return path, running underneath the
corridors. Being inside the structure is what lets a person receive it — the
same property that lets them slow time.

**The engineers.** Not present. They left the structure running and they
listen. **It is not a weapon and not a prison — it is an examination**, and
anyone who passes gets spoken to.

**The other eight.** All reached the last door. None ever read the channel, so
none passed, and a subject who has spent a year inside and cannot be used is a
liability.

---

## 5. The walls

`EXIT` sits above every door for the whole game. These are the authored lines
between them, one every two doors. **`(page)`** marks the ten that decode.

### Act 1 · The Test

| door | | reads | after its page |
|---|---|---|---|
| 2 | P | `YOUR SESSION HAS RESUMED` | — |
| 4 | P | `THE EXIT IS JUST AHEAD` **(page)** | `THE EXIT AHEAD IS A LIE` |
| 6 | S | *they write these signs* | — |
| 8 | P | `YOU ARE PERFORMING WELL` | — |
| 10 | P | `EVERY DOOR YOU REACH IS RECORDED` **(page)** | `EVERY TIME YOU DIE IS RECORDED` |
| 12 | S | *this is not a simulation* | — |

Door 2 reads as interface. Door 6 turns it into a character in four words.

### Act 2 · The Others

| door | | reads | after its page |
|---|---|---|---|
| 14 | P | `YOU ARE THE FIRST TO GET THIS FAR` **(page)** | `YOU ARE THE NINTH TO GET THIS FAR` |
| 16 | S | *i was the eighth* | — |
| 18 | P | `ALL SUBJECTS ARE RELEASED WHEN THEY FINISH` **(page)** | `ALL SUBJECTS ARE ERASED WHEN THEY FINISH` |
| 20 | S | *i never got out* | — |
| 22 | S | *their files call them ENGINEERS* | — |

Door 16 lands two doors after the player learns they are ninth, which is when
a name means something.

### Act 3 · The Anomaly

| door | | reads | after its page |
|---|---|---|---|
| 24 | S | *they did not build this place* | — |
| 26 | P | `THIS SIMULATION WAS BUILT IN 1947` **(page)** | `THIS PLACE WAS FOUND IN 1947` |
| 28 | S | *no engineer is on the payroll · i checked* | — |
| 30 | P | `THIS CHANNEL IS MONITORED FOR YOUR SAFETY` **(page)** | `THIS CHANNEL IS WRITTEN OVER BY THE PROGRAMME` |
| 32 | S | *i could never read the numbers · you might* | — |
| 34 | **B** | `WE ARE THE ENGINEERS · THAT IS THEIR WORD` | — |

Door 26 swaps two words and both matter: not a simulation, and not built.

**Door 34 is the best beat in the script.** Clean, no page, and it turns over
a word the player has read as staff since door 22 — one the programme has
used in its own filing for eighty years without knowing what it meant.

### Act 4 · The Watchers

| door | | reads | after its page |
|---|---|---|---|
| 36 | B | `WE LEFT THIS PLACE RUNNING AND WALKED AWAY` | — |
| 38 | B | `IT IS NOT A WEAPON · IT IS A TEST` | — |
| 40 | P | `ELEVEN PEOPLE HAVE BEEN THROUGH THIS PLACE` **(page)** | `ELEVEN THOUSAND HAVE BEEN THROUGH THIS PLACE` |
| 42 | P | `YOU WILL BE SENT HOME WHEN YOU FINISH` **(page)** | `NO ONE HAS EVER BEEN SENT HOME` |
| 44 | B | `PASS THE TEST AND WE WILL SPEAK WITH YOU` | — |

Door 40's `ELEVEN` reads as believable — eight before the player, plus a few
— until one jammed word turns it into a number that predates the programme.
Door 44 is the only promise anybody makes, and it is the one that is true.

### Act 5 · The Copy

| door | | reads | after its page |
|---|---|---|---|
| 46 | P | `THE LAST DOOR OPENS WHEN YOU ARE READY` **(page)** | `THE LAST DOOR HOLDS SOMETHING WEARING YOUR FACE` |
| 48 | S | *i died behind the last door* | — |
| 50 | P | `HOLD STILL AND TIME WILL SLOW FOR YOU` **(page)** | `HOLD PERFECTLY STILL AND TIME WILL STOP` |

Door 50 is the win condition in plain words, and both versions are true
instructions — the false one just stops one step short of the thing that
wins.

---

## 6. Hale's logs

Ten, optional, spread across the run. Nothing here is required to finish the
game or to understand it. This is where he becomes a person.

> **L1** — *"They talk to you so you don't lose your mind. The first ones in
> here heard nothing at all and it broke them. So they gave us a voice. It's
> a kind thing to do, if you don't think about it too long."*

> **L3** — *"The men in the corridors aren't people. I checked, more than
> once, in ways I'm not going to describe. Don't carry it."*

> **L5** — *"I counted doors for a while. Then I counted days. Then I
> stopped counting, and that was the worst week."*

> **L7** — *"There's a word in their paperwork. Engineers. Nobody by that
> name draws a salary here. I've been through every file I could reach and
> the engineers are not on the payroll."*

> **L9** — *"I could never read the numbers. Eleven months and I never got
> one line of it. If you can, don't tell them. Don't tell anyone. Just keep
> going and don't tell them."*

Five more to write. The rule: **a log never carries a fact the walls need.**
If a player skips every one, they lose the man and none of the plot.

---

## 7. What this costs

**One recorded voice**, Hale's, ten logs of ordinary speech. The numbers
station can be synthesised — ten digits and a tone — because nothing depends
on hearing it.

**The depth problem is unchanged.** Slow time unlocks at door 46 and Act 5
needs the school, the discovery of the full stop and the finale. The unlock
wants to move to roughly **door 30** — `SPEED.unlockM` in `balance.js`.

---

## 8. Open

- **The ending's questions.** Three or four, each worth a replay. *Who am I ·
  what happened to Hale · what is outside · why me.*
- **Five more logs.**
- **Does the rewritten wall need the false word visible?** Struck through
  keeps the drama and doubles the text on a phone screen.
