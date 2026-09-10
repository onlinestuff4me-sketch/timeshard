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

**Technical consequence, settled:** `tutorPlaceWorldCue` draws one `nowrap`
line scaled by width in metres, which makes an eight-word sign unreadably
small. The mark painter breaks a line into **two or three rows, never more** —
three short rows still read as a sign; four read as a paragraph on a wall.
A line that will not fit in three rows is too long and gets rewritten.

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

**His pattern is set in the tutorial, before the player knows he exists.** The
T-junction at the end of the opening — a red arrow and a short message on a
wall, `THIS WAY` and `NOT THIS WAY` — is his, and he uses the same arrow later
to point at things he found. The building labels places; Hale points at them.
One glyph sorts the two voices by eye and the reveal costs nothing.
See `docs/MARKS.md` §5.4.

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

## 5. Placement is derived, not authored

**No wall line owns a door number.** The script is an *ordered list*; the
doors are computed from the ramp.

This is not tidiness — it is required. `unlockDoor()` in `balance.js` already
works this way, and its comment says so: *"Not a door number — a speed."* The
door slow time arrives on is whatever door the bullet-speed staircase first
reaches `unlockM` on, so **it moves every time the ramp is retuned.** A script
pinned to door 30 breaks the moment somebody changes a tread.

### 5.1 Two anchors

| | |
|---|---|
| **U** | `unlockDoor()` — where slow time arrives. Already derived. |
| **F** | the finale door, where the copy waits. |

Everything else is spaced between them.

| act | span | beats |
|---|---|---|
| **1–3** | door 1 → **U − 1** | 16 |
| **3's last** | **on U** | 1 |
| **4** | end of school → **F − 6** | 5 |
| **5** | the last four doors | 3 |

Spacing inside a span is `range ÷ beats`, with the last beat landing on the
span's final door.

**Corrected while building it.** This table used to give acts 1–2 eleven beats
and act 3 one, which accounts for twenty of the twenty-five: act 3's other
five sit before **U** and appeared in no span at all. It also put act 4's last
beat and act 5's first both on **F − 4**, which is one door carrying two
lines. Act 4 now stops two doors clear of the closing stretch
(`STORY_PACE.tailClear`).

`src/story.js` is the implementation and `test/story.mjs` checks it against
seven different ramps. Every number above is a knob there, because the ramp is
going to move.

**And U is not `unlockDoor(SPEED)`.** There are two unlock doors in the build:
`powerUnlockDoor()` is where the time button is handed over (door 10) and
`unlockDoor(SPEED)` is where rounds get fast (door 46). §5.1 says U is "where
slow time arrives", which is the first — and against it the script does not
fit. See `docs/ROADMAP.md` phase 2; it is an open decision rather than an
arithmetic error.

### 5.2 The one beat that is anchored, not spaced

**`WE ARE THE ENGINEERS` lands on the unlock door itself.**

The programme's jamming fails on exactly the door the player's ability
changes. The builders hand over the power and identify themselves in the same
breath, and it costs nothing because both are derived from the same number.

### 5.3 What this survives

| if the ramp puts the unlock at… | acts 1–2 space at | and the script still fits |
|---|---|---|
| door 46 (today) | every 4 doors | yes |
| door 30 | every 3 doors | yes |
| door 20 | every 2 doors | yes |
| door 12 | every door | tight — see below |

Below about door 12 the beats crowd, and the fix is to cut beats rather than
to compress them. **The ordered list is the thing to protect; the doors are
arithmetic.**

### 5.4 On the difficulty-ramp revision

The Corridor / No Retreat ramp work is in another session and I have not seen
it, so nothing here assumes an outcome. What this document needs from it is
only two numbers — **where the unlock lands, and where the finale sits** — and
§5.1 consumes both without a rewrite.

If that work concludes that The Tunnel should adopt the same shape, the story
needs no edit at all. That is the point of anchoring to `unlockDoor()` rather
than to an integer.

---

## 6. The walls

`EXIT` sits above every door for the whole game. These are the authored lines
between them, in order. **Door numbers below are illustrative** — they show
the shipped ramp, where **U = 46**, and they move with it per §5.
**`(page)`** marks the ten that decode.

### Act 1 · The Test

| door | | reads | after its page |
|---|---|---|---|
| 4 | P | `YOUR SESSION HAS RESUMED` | — |
| 8 | P | `THE EXIT IS JUST AHEAD` **(page)** | `THE EXIT AHEAD IS A LIE` |
| 12 | S | *they write these signs* | — |
| 16 | P | `YOU ARE PERFORMING WELL` | — |
| 20 | P | `EVERY DOOR YOU REACH IS RECORDED` **(page)** | `EVERY TIME YOU DIE IS RECORDED` |
| 24 | S | *this is not a simulation* | — |

The first line reads as interface. The third turns it into a character in four words.

### Act 2 · The Others

| door | | reads | after its page |
|---|---|---|---|
| 28 | P | `YOU ARE THE FIRST TO GET THIS FAR` **(page)** | `YOU ARE THE NINTH TO GET THIS FAR` |
| 32 | S | *i was the eighth* | — |
| 34 | P | `ALL SUBJECTS ARE RELEASED WHEN THEY FINISH` **(page)** | `ALL SUBJECTS ARE ERASED WHEN THEY FINISH` |
| 36 | S | *i never got out* | — |
| 38 | S | *their files call them ENGINEERS* | — |

*i was the eighth* lands one beat after the player learns they are ninth,
which is when a name means something.

### Act 3 · The Anomaly

| door | | reads | after its page |
|---|---|---|---|
| 40 | S | *they did not build this place* | — |
| 42 | P | `THIS SIMULATION WAS BUILT IN 1947` **(page)** | `THIS PLACE WAS FOUND IN 1947` |
| 44 | S | *no engineer is on the payroll · i checked* | — |
| 45 | P | `THIS CHANNEL IS MONITORED FOR YOUR SAFETY` **(page)** | `THIS CHANNEL IS REWRITTEN FOR YOUR SAFETY` |
| 45 | S | *i could never read the numbers · you might* | — |
| **U** | **B** | `WE ARE THE ENGINEERS · THAT IS THEIR WORD` | — |

The 1947 line swaps two words and both matter: not a simulation, and not built.

**This is the best beat in the script**, and §5.2 pins it to the unlock door. Clean, no page, and it turns over
a word the player has read as staff since door 22 — one the programme has
used in its own filing for eighty years without knowing what it meant.

### Act 4 · The Watchers

| door | | reads | after its page |
|---|---|---|---|
| 58 | B | `WE LEFT THIS PLACE RUNNING AND WALKED AWAY` | — |
| 62 | B | `IT IS NOT A WEAPON · IT IS A TEST` | — |
| 66 | P | `ELEVEN PEOPLE HAVE BEEN THROUGH THIS PLACE` **(page)** | `ELEVEN THOUSAND HAVE BEEN THROUGH THIS PLACE` |
| 70 | P | `YOU WILL BE SENT HOME WHEN YOU FINISH` **(page)** | `NO ONE WILL BE SENT HOME WHEN THEY FINISH` |
| 74 | B | `PASS THE TEST AND WE WILL SPEAK WITH YOU` | — |

`ELEVEN` reads as believable — eight before the player, plus a few
— until one jammed word turns it into a number that predates the programme.
`PASS THE TEST` is the only promise anybody makes, and it is the one that is true.

### Act 5 · The Copy

| door | | reads | after its page |
|---|---|---|---|
| **F−4** | P | `THE LAST DOOR OPENS WHEN YOU ARE READY` **(page)** | `THE LAST DOOR OPENS WHEN YOU ARE COPIED` |
| **F−2** | S | *i died behind the last door* | — |
| **F** | P | `HOLD STILL AND TIME WILL SLOW FOR YOU` **(page)** | `HOLD PERFECTLY STILL AND TIME WILL STOP` |

The last line is the win condition in plain words, and both versions are true
instructions — the false one just stops one step short of the thing that
wins.

---

## 7. Hale's logs

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

## 8. What this costs

**One recorded voice**, Hale's, ten logs of ordinary speech. The numbers
station can be synthesised — ten digits and a tone — because nothing depends
on hearing it.

**The depth problem is retired.** The script no longer cares where the unlock
lands (§5), so the ramp can be retuned without touching a line of it.

---

## 9. Open

- **The ending's questions.** Three or four, each worth a replay. *Who am I ·
  what happened to Hale · what is outside · why me.*
- **Five more logs.**
- **Does the rewritten wall need the false word visible?** Struck through
  keeps the drama and doubles the text on a phone screen.
- **Three lines were tightened.** §3.2 says the programme can only jam
  individual words, so a rewrite is a real sentence with one or two wrong.
  Three of the ten replaced most of the sentence; they now keep six or seven
  words of it, and all ten keep a majority. `test/story.mjs` prints both
  versions of every one, and `src/story.js` records what each used to say.
