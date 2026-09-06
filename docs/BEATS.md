# The beat map

Every environmental message in the game, in the order a player meets it,
against three goals:

| | goal | the player's question |
|---|---|---|
| **①** | **go** | where am I going? |
| **②** | **do** | what do I do here? |
| **③** | **why** | what is this place? |

`docs/STORY.md` is the story. `docs/MARKS.md` is the system that paints the
signs. This file is what they say and where they go.

---

## 1. Rules for the words

1. **Plain words only.** No codes, no designations, no institutional jargon. A
   player reads a sign once, at speed, on a phone. If it needs decoding it has
   failed.
2. **The meaning is unsettling, never the wording.** `DO NOT ASSIST THE
   SUBJECT` is five ordinary words and lands instantly. `SUBJECT 4409 · TRIAL
   118` is a puzzle.
3. **Four words or fewer** wherever possible.
4. **A ③ message costs wall space, never screen time.** No cards, no cue
   slots, no pauses.
5. **Every message is ignorable.** A player who reads nothing still reaches
   the door.

---

## 2. The whole vocabulary

Two voices. The building stencils; a person writes by hand.

### The building — orange, stencilled

| message | goal | where |
|---|---|---|
| `EXIT →` | ①③ | corridor walls, before turns |
| `EXIT` | ①③ | above every door |
| `STAND HERE` | ①② | the tutorial mark, the barrier |
| `NO COVER · DO NOT STOP` | ②③ | mouth of a gauntlet |
| `GRINDER · KEEP MOVING` | ②③ | when a grinder is sent |
| `IT SEALS BEHIND YOU` | ②③ | a one-way seal |
| `THEY COME THROUGH THE WALLS` | ②③ | breach walls |
| `TEST IN PROGRESS` | ③ | deep legs |
| `DO NOT ASSIST THE SUBJECT` | ③ | deep legs |
| `THIS IS NOT AN EXIT` | ③ | a deep door |

The four `②③` rows are `LEG_HEADLINES` verbatim. They already exist and they
are already plain — see §5.

### A person — white, handwritten

| message | goal |
|---|---|
| `there is no exit` | ③ |
| `i have been here before` | ③ |
| `don't believe the signs` | ③ |
| `keep going anyway` | ③ |

Ten building strings, four handwritten. That is the whole system.

---

## 3. The hook, in one word

**Every door is marked `EXIT`. None of them is.**

The player walks through a door that says EXIT and arrives in another
corridor with another door that says EXIT. No counter, no code, nothing to
work out. They understand by the third door, and the understanding is the
reason to keep walking.

That is the answer to *why should I keep playing*, and it costs one word
placed above a door that already exists.

---

## 4. The tutorial — first ninety seconds

| # | beat | goals |
|---|---|---|
| 1 | `EXIT →` on the wall, in frame before the player moves | ①③ |
| 2 | `STAND HERE` twenty metres ahead — the target for `DRAG TO MOVE` | ①② |
| 3 | The corridor reconfigures when they arrive | ③ |
| 4 | `EXIT →` on the wall the turn faces — the target for `DRAG TO LOOK` | ①② |
| 5 | `EXIT →` at the second turn | ① |
| 6 | `STAND HERE` on the barrier *(already built)* | ① |
| 7 | `EXIT` above the tutorial's door | ①③ |

Beat 1 answers *why am I here* — I am getting out — before a single input.
Beat 7 is where the lie starts, and it starts quietly: the door says EXIT,
and behind it is another corridor.

Nothing here is new text beyond two strings.

---

## 5. The rest of the run

**Move `LEG_HEADLINES` onto the walls.** They are centre-screen cards shown
for two seconds today. `NO COVER · DO NOT STOP` is a control instruction (②)
displayed over the fight it is about. On a wall it persists, sits where the
player is already looking, and reads as the building rather than the UI.

Keep the words exactly as they are — they are already plain. And keep the two
rows the table deliberately leaves silent (`dimStrips`, `vault`): a sign
telling the player what they can already see is a sign in the way.

Every door gets `EXIT` above it.

---

## 6. Three stages of doubt

| doors | what changes |
|---|---|
| 1 – 10 | every door says `EXIT`. Nothing else. |
| 11 – 25 | the handwriting appears: `there is no exit`, `i have been here before` |
| 25+ | the building's own signs change: `TEST IN PROGRESS`, `DO NOT ASSIST THE SUBJECT`, `THIS IS NOT AN EXIT` |

The handwriting comes before the reveal because it is the player's first
evidence that somebody else has walked this, and it is the payoff on the coach
messages — the same helpful voice, now on a wall, arguing with the signs.

`DO NOT ASSIST THE SUBJECT` answers *who are these enemies* in five words:
they are staff, and they were told not to help you.

---

## 7. Two beats that are not messages

**The man who does not raise his arm.** Deep in, one enemy stands there and
never fires. Shatter him or walk past; neither is punished. The whole combat
language is *watch the arm come back*, so a man who never does it says what
these people are without a word. Built by removing behaviour.

**The window.** `src/main.js:529` — the city already tiles every three blocks.
Put glass in one wall and the same building is visible twice. Free.

---

## 8. Build order

1. `EXIT` above every door — the hook, one string.
2. `EXIT →` and `STAND HERE` in the tutorial — two strings, three beats.
3. `LEG_HEADLINES` onto the walls — no new words, biggest change to the rest
   of the game.
4. The reconfiguration — the only new mechanic here.
5. The handwriting.
6. The deep signs.

---

## 9. Not doing

- Codes, subject numbers, protocol designations, file references on walls.
- Renaming anything the player already reads (`TRAINING COMPLETE` stays).
- Any message longer than five words.
- Anything that pauses, fades in over gameplay, or must be collected.
