# The story

The world, and how it reaches the player. **The pitch, the beats and every
line of the script are `docs/SCRIPT.md`.**

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

### 3.4 The player never decodes anything

The risk in this whole system is that it becomes homework: here is a key,
now go and apply it. Nobody wants to memorise a cipher between runs.

**So the player never decodes. The game decodes in front of them, and they
watch words appear.** The pad is the mechanism; the reward is the reveal, and
the reveal is legible without remembering a single thing.

### 3.5 One message, concretely

A transmission is **one sentence of six to eight words**. Each word is one
spoken five-digit group. Tone plus groups is 15 seconds.

```js
{ id: 'm07',
  door: 22,                                  // heard here, and opened by this door's page
  text: 'THE DOOR YOU WANT IS NOT MARKED',   // 7 words = 7 groups
  priority: 2 }                              // reveal order when several are owed
```

**A door owes a page only if that door's message was rewritten.** There are
twenty-five transmissions and eleven pages (`SCRIPT.md` §3.1), so most doors
owe nothing and the reveal sequence fires eleven times in a whole playthrough
— rare enough to stay an event.

And a message is never blocks. **The simulation rewrites each transmission
before the player hears it**, so the first version is a complete, sensible,
reassuring sentence and the page replaces one or two words with what was
actually sent — `THE EXIT IS AHEAD` becomes `THE EXIT IS A LIE`. Full scheme
and all ten messages in `docs/SCRIPT.md` §3–4.

This trades against cryptographic purity, deliberately. A real pad decodes
position by position, which gives `M _ E T   T H _ M   A T` — clever to
describe, a chore to read, and worthless to a player who has decoded nothing
yet. **Legibility wins**, and the rewrite scheme means even an undecoded
message is worth reading.

### 3.6 Two channels, two jobs

| | when | what it is | what it does |
|---|---|---|---|
| **The corridor** | walking an empty leg on first entry to its door | **audio-first** — a tone and seven groups of numbers you cannot understand | mystery, atmosphere, 15 s, once |
| **The reveal** | when a page is owed (§4) | **text-first** — the same transmission again, with each word appearing as its group is read | the payoff |

The second one is the good part: **you hear the same numbers you already
heard, and this time each group turns into a word as it is spoken.** Noise
becomes a sentence in real time, and the player does nothing but watch.

### 3.7 The reveal sequence

Not a menu screen. A place.

1. You die. The screen goes red.
2. It fades — not to `YOU DIED`, but to a **short, quiet hallway**. No
   enemies, different light. This is the outside of the simulation.
3. A floating orange mark ahead: **`LISTEN HERE`** — the same grammar as
   `STAND HERE` and `STEP HERE`, so it needs no explaining.
4. You walk to it. The transmission plays, and on the wall the blocks resolve
   into words, one per group, in time with the voice.
5. Any other messages opened by the same payout are listed beneath it,
   already readable.
6. A door: **`EXIT →`**, back to the door you died on.

Fifteen metres, about twenty-five seconds, and it asks the player to walk
rather than to sit and watch.

### 3.8 What stops it becoming a burden

- **It fires only when a page is owed** — at most once per *new door reached*.
  A player grinding door 30 sees it once and then not again until door 31. It
  is exactly as frequent as progress.
- **Everything owed is paid in one sequence.** Never two in a row.
- **Only one message gets the full audio and animation.** The rest open
  silently and are listed as already-readable lines on the same wall.
- **Priority order** decides which one gets the treatment: story-critical
  messages first, then oldest-heard. If a player skips or quits, the next
  sequence picks up where this one stopped.
- **Skippable after the first beat.** On death forty nobody wants ceremony.
- **Nothing is ever only in the sequence.** It is all on the board.

### 3.9 The board

One screen, listing every transmission. Each shows the sentence the player
heard; the decoded ones show it with the rewritten words struck and replaced.
A count at the top: `18 RECEIVED · 4 OF 11 DECODED`.

**This is the reward, not the sequence.** The sequence is the moment; the
board is the thing the player returns to, and it answers "what did I actually
get" without anyone having remembered anything.

It belongs on UNLOCKS (`Q12`, answered) — a screen that already exists,
already means *what this place has shown you*, and **already draws exactly
this**: `renderUnlocks` builds redaction bars sized to the hidden text, with
a `redact` CSS class and a `N OF M RECOVERED` header. The message board is the
same component with different rows.

### 3.10 The audio is eleven files

Ten digit readings and one interval tone. Every message in the game is a
sequence of those. A twenty-message script costs no more to record than a
one-message script.

---

## 4. The pad is a debt, not an event

**Tying the pad to death alone** gates the critical path on skill: a player
who does not die never decodes anything.

**Tying it to the end-of-run screen** loses it when a player dies, sees the
retry screen, and closes the app.

**So the payout is not an event.** Reaching a door **owes** that door's page,
recorded and persisted the moment they walk in. The debt is paid at the first
opportunity, and survives the app being killed.

### 4.1 When the debt is paid

| the player | what happens |
|---|---|
| dies, with a page owed | the red fades into the reveal hallway (§3.7) instead of the death screen |
| closes the app, comes back, presses CONTINUE | the reveal hallway, then the run resumes |
| dies with **nothing** owed | the ordinary death screen. No ceremony. |
| presses RETRY from an ordinary death | nothing. The run has not ended. |

The reveal hallway replaces the death screen rather than being added in front
of it, which is what keeps it from feeling like a tax on dying.

### 4.2 What you get

**Every door owns one page**, and a page opens one message.

- **It cannot be farmed.** A door's page arrives once, and most doors have none.
- **It paces itself against depth**, with no second difficulty curve.
- **It cannot be gated by skill, or lost to a closed app.**
- **Nothing is permanently missable.** Later runs pass the same doors.

### 4.3 It stays inside the meta rule

`TUNNEL_META` §2 says the meta never grants power, only knowledge and access.
The pad changes nothing anywhere in the game except what the player can read.

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
| **Q2b** | **Does `SPEED.unlockM` move from door 46 to ~30?** | `SCRIPT.md` §5 puts the last message at 49 and the clone at 50, which leaves four doors for the school, the discovery of the full stop and the finale. Not enough room. Moving the unlock is a balance decision, not a story one. |
| **Q2** | **Is door 50 reachable by enough players?** | The whole arc now lands there (`SCRIPT.md` §5). If most players stop at door 20 the back half of the script is never read, and the fix is either a shorter arc or a shallower ramp. |
| **Q3** | **How many questions at the end, and what are they?** | Each answer must be worth a whole replay. Three or four. |
| **Q4** | **Does the pad survive the ending's wipe?** | Recommended yes (§9.1). Not confirmed. |
| **Q18** | **Does T25 need to exist?** | It is the win condition in plain words. If the full stop is discoverable without it, T25 is a safety net; if not, the ending is gated on a page a player may never have collected. |
| **Q20** | **Do twenty-five empty legs read as dead time?** | The pacing cost of the drip (`SCRIPT.md` §6). If they do, the fix is fewer and longer transmissions, not more and shorter. |
| **Q6** | **Recorded voice or synthesised?** | Eleven files either way, but the voice is the texture of the device. |
| **Q15** | **Does the reveal hallway need its own art?** | It is meant to read as outside the simulation. Different light on the existing corridor may be enough, or it may need to look like nothing else in the game. |
| **Q16** | **What does the very first reveal do?** | The player has no idea what a transmission is yet. The first one has to teach the whole system — that these are messages, that they are being decoded, that there are more — without a tutorial. |
| **Q19** | **What are the ending's questions?** | Three or four, each worth a replay, each answered in one sentence in the messages' register (`SCRIPT.md` §6). |

### Answered

| # | question | answer |
|---|---|---|
| **A1** | When does audio play? | **Superseded.** Never in slowed time. Two downtime channels: transmissions in empty corridors, reveals in the post-death hallway (§3.6). |
| **A2** | How often does a page arrive? | One per door, paid when the debt is settled (§4). |
| **A3** | Can the pad be farmed? | No. Each door's page arrives once. |
| **A4** | Can it be permanently missed? | No, and not skill-gated either (§4). |
| **A5** | Does the boss break the one-hit pillar? | No (§7). |
| **A6** | Does the pad break "meta is never power"? | No (§4.3). |
| **A7** | What if the player never dies? | Still paid — the debt settles on any exit from a run (§4.1). |
| **A8** | Can a player outrun a transmission? | No. The leg is built for top speed, and there is no player sprint — 4.6 m/s is the ceiling (§3.5). |
| **A9** | What if a group was missed? | Everything is on the board, permanently (§3.9). |
| **A10** | App closed on the retry screen? | Nothing lost. Paid on the next CONTINUE (§4.1). |
| **A11** | Is RETRY interrupted? | Never (§4.1). |
| **A12** | Long empty walk after the audio? | No. The exit is placed at the first turn after it ends (§3.5). |
| **A13** | How long is a transmission? | **15 seconds.** 69 m of corridor, no enemies, a door at the end (§3.5). |
| **A14** | Does the player have to remember the cipher? | **No.** The player never decodes. The game decodes in front of them and they watch words appear (§3.4). |
| **A15** | Several pages owed at once? | One sequence, never two in a row. One message gets the full audio and animation by priority; the rest open silently and are listed as readable. Skipping resumes where it stopped (§3.8). |
| **A16** | Is it all audio? | No. The corridor is audio-first, the reveal is text-first with audio underneath (§3.6). |
| **A17** | Where does the board live? | UNLOCKS — which already renders redaction bars sized to hidden text and an `N OF M` header (§3.9). |
| **A18** | Won't the reveal get tiresome? | It fires at most once per new door reached, and replaces the death screen rather than being added to it (§3.8, §4.1). |
| **A19** | Where does the clone live? | **Door 50.** Ten messages, one every five doors, last at 49 (`SCRIPT.md` §5). |
| **A20** | How many messages? | **Twenty-five**, one every two doors, doors 2–50 (`SCRIPT.md` §5). |
| **A23** | Is every message a lie? | No — **fourteen are true as heard.** Pages exist only for the eleven rewritten ones, so every reveal changes something and the channel earns trust before it is used against the player (`SCRIPT.md` §3.1). |
| **A24** | Who rewrites the messages, and why? | The programme's engineers. They have never been able to decode the channel, so they overwrite it with reassuring copy. People, not a machine (`SCRIPT.md` §3, §4). |
| **A25** | Why was the place built? | It is an examination left running. Anyone who passes gets spoken to; the programme mistook an entrance exam for a treadmill (`SCRIPT.md` §4). |
| **A21** | How are messages obscured without being confusing? | The simulation rewrites them. The heard version is a complete reassuring sentence; the page replaces one or two words with the truth (`SCRIPT.md` §3). |
| **A22** | Does the story get too strange? | The word "alien" never appears. They are *the ones who built it*, and everything else is the player's inference (`SCRIPT.md` §1.1). |

---

## 11. Changed by this

`docs/TUNNEL_META.md` says the meta never grants power. Kept: the primer is
knowledge, and the full stop is given by the story rather than earned by
grinding.

One earlier line is overruled — that the game should have no ending because
the tunnel is endless. It has one. The endlessness is the antagonist's plan,
not the game's shape.
