# Modes

Five. The list lives in `src/modes.js`, and it is what the mode selector, the
GAMES section of UNLOCKS and every unlock gate are all rendered from — so a
mode cannot exist in one place and not another, and its one-line description
and its gate cannot say two different things in two places
(`docs/PILLARS.md` §7).

**The main game first, then the rest in the order they OPEN.**

| Mode | Opens at | What you do |
|---|---|---|
| **THE TUNNEL** | always | Door to door, deeper each time. The main game. |
| **CORRIDOR DUEL** | door 5 | They come to you. Drag to sidestep, tap them to shatter. |
| **STAND STILL** | door 10 | Time only moves while you do. Stand still and the world waits. |
| **CITY STREETS** | door 15 | Endless waves in the white city — the original arena. |
| **RUSH HOUR** | door 20 | Freeze the crowd, find the one face that matters, walk out. |

`main: true` is what puts the tunnel at the top of every list, and it is also
the game a first launch opens on. One flag, so those two cannot disagree.

`line` is one line. It is the whole description a player gets, so it says what
you DO, not what the mode is about.

## Unlocking

The tunnel is the game: it has the lesson in it, it is the only mode with a
progression to climb, and every other mode is bought with that climb. `doors`
in the registry is how many tunnel doors you have ever passed before a mode
opens, and the tunnel itself has none.

**The order is by how much the mode asks of your hands, not by when it was
built.** A player who has just been taught two thumbs and a time button gets
the two ONE-THUMB modes first — they are a rest, and they teach the dodge on
its own — and the two full-control arena games last, because those ask for
everything the tunnel taught at once, with no doors to pace it.

Three rules the code keeps (`modeUnlocked` in the registry, `deepestDoor` and
`noteDeepestDoor` in `src/main.js`):

* **It is a high-water mark, kept per player, and it only goes up.**
  `ts_deepest_door` is written when a tunnel door is crossed and read by
  nothing else. It is deliberately NOT derived from the saves: a player who
  earns Corridor Duel at door 5 and then deletes that run must not find it
  locked again, and a number recomputed from whatever saves happen to exist
  does exactly that.
* **Tunnel doors only.** Corridor Duel and Stand Still are built on the
  tunnel's legs and cross doors too; counting those would make "REACH DOOR 5
  IN THE TUNNEL" a lie on the one card that says it, and would let the modes
  bought with the climb pay for each other.
* **It counts from the launch that introduced it.** The mark starts at zero
  for everybody. An earlier version also unlocked any mode you had a save in,
  to protect players who had put runs into City Streets before the gates
  existed — there are none, and the clause made "unlocked" mean two different
  things depending on how you got there.

The same four gates are a section of UNLOCKS, counted `n/4`, each locked row
showing how far off it is (`7/10`) — the one section of that screen that is a
to-do list rather than a record, because a door number is something you can go
and reach.

## The selector

Between "I want to play" and playing. PLAY (when there is nothing to continue)
and START NEW RUN both open it; **CONTINUE never does** — the whole promise of
that button is one tap back into the run it names.

**A card is chosen on release, not on touch.** The list scrolls, and a scroll
starts with a finger landing on a card — so acting on `pointerdown` meant a
flick down the list launched whatever it started on, or answered "you have not
unlocked this mode yet" when all the player did was scroll past it. The
landing is remembered and the release decides, by the same net-displacement
test tap-to-fire uses. The list also has to be exempt from the menu's blanket
`preventDefault`, or the browser never scrolls however the CSS is set — with
five cards it overflows by about 430 px, so a third of it was unreachable.

**One vertical list, always in unlock order**, with the tunnel at the top as a
full-width card with a bigger picture because it is the game. Where a mode
sits is something you learn once and it never moves.

**The recency strip is laid on top of that, not carved out of it.** Once a
mode other than the tunnel has been played, a horizontal RECENTLY PLAYED row
appears above the list — the modes you have played, most recent first, as
small picture-and-name shortcuts. The list below still holds all five in the
order it always had.

An earlier version promoted whatever you had played into a band of its own and
listed only the remainder underneath. That meant the screen rearranged itself
as you played and no mode had a home: the thing you were looking for moved the
moment you used it. A shortcut on top of a fixed list gives you both.

The strip stays hidden until a second mode has been played, because on a first
run it would be a row with one card in it pointing at the card directly
underneath.

Every card carries a few seconds of that mode actually being played, because a
name is not an answer to "what is STAND STILL". A locked card keeps its
picture — dimmed — and states its gate: a gate you cannot see is not a goal,
and the picture is the whole reason to want what is behind it. Tapping one
refuses on the card itself, because `showBanner` draws at z-index 10,
underneath this panel.

**NEW** marks a mode that has opened and has never been played, and comes off
the moment there is a save in it. **Never the tunnel** — it has been there
since the first launch and was not given to anybody, and a badge on the thing
that was always available says nothing.

### Telling the player something opened

**At the moment it happens.** Crossing the gate puts a card on the screen: the
label small and red over the mode's name, because the name is the news.

It **waits for the screen** rather than firing blind. Corridor Duel's gate is
door 5, which is crossed on the same step that hands over slow motion — and
that door runs the slow-time school, which owns the screen and makes
`showBanner` a no-op for as long as it lasts. Announcing into that is
announcing into nothing, and the first gate a player ever passes is the one
that matters most, so the announcement queues and the frame loop lets it out
when the lesson is over. General on purpose: a lesson on any future door gets
the same treatment without knowing about this.

**And on the title screen afterwards**, in case the moment was missed.

A gate opens in the middle of a run, three doors before you die, and the next
thing you see is a menu that looks exactly like the last one. So the UNLOCKS
button on the title screen carries the same red pill when a mode has opened
that the player has not been shown yet.

Two different NEWs, clearing on two different things:

| | means | clears when |
|---|---|---|
| the badge on UNLOCKS | you have not **looked** since it opened | UNLOCKS is opened |
| NEW on a mode card | you have not **played** it | there is a save in that mode |

**Modes only, not elements.** Elements are filed constantly — every run meets
a room form or a weapon — so badging those would put a badge up after every
single run, which is the same as no badge at all. A mode opening is rare and
worth crossing the room for.

`ts_seen_modes` is what the player has been told. `markModesSeen` writes
*everything currently open* rather than just what was on the badge, so a mode
that opened before this existed does not announce itself later.

The tutorial question is on this screen, on the NEW RUN path only. Choosing
NEW RUN is a decision about starting over and "with the lesson or without" is
part of it; tapping PLAY on a first launch is not a decision about anything,
and the onboarding decides for itself whether it has been played.

### The preview clips

`assets/preview/<mode>.webm`, made by `node tools/rec-previews.mjs` — it
drives each mode headlessly, suppresses the HUD, crops the 402x874 viewport to
the middle 402x302 (which puts the horizon dead centre) and encodes about
40-90 KB each. They are fetched lazily and only play while on screen.

The bodies in them are **staged**: the camera is 42 degrees wide and the
mode's own spawn placement puts people 9-40 m out and usually round a corner,
which is five seconds of empty hallway. The recorder puts one where the player
is looking, at eleven metres, and it behaves normally from then on.

**They are meant to be replaced.** Bot-driven play is competent rather than
thrilling. Drop a better file at the same path — real footage, mp4 if you have
it (change the extension in the registry) — and nothing else has to change.

## The two simplified modes

4 and 5 are prototypes of the same question: **the game currently needs three
things from a player's hands** — a left thumb to move, a right thumb to look,
and a button to buy slow motion — and that is two more than a phone game
should need. So:

> One movement mechanic. Drag to move, tap to shoot. Nothing else.

There is no look axis in either mode, and no time button. What that costs, and
what each mode does about it, is below.

### What replaces looking

Cutting the look stick is easy; deciding where a shot goes is the whole
design. **The shot goes where the thumb went** — a tap fires at the point you
tapped, and a tap within `SIMPLE.tapMagnetPx` of a body takes the body rather
than the wall behind it (`tapAim` in `src/main.js`).

This is aim assist on the *shot*, not on the camera, so §4 is untouched: the
camera cannot move on its own in these modes because there is nothing left
that moves it. The crosshair is hidden for the same reason — with no look
axis it points down the corridor rather than at anything, and a sight that is
not where your shot lands is worse than no sight.

The corridor is therefore always a **straight strip, three cells wide**: the
camera never turns, so a corner would be a wall you cannot see round, and one
cell of corridor minus its walls is not a dodge, it is a flinch.

### What replaces the time bank

`docs/PILLARS.md` §1 forbids a mechanic that stops time for free, and a mode
with no bank cannot charge for it in seconds. **This is the fence these two
modes lean on, and it was a deliberate decision, not an oversight.** Each pays
for time in a different currency, and which currency is the better game is the
thing the prototypes exist to find out:

**CORRIDOR DUEL — time is not yours at all.**
The world drops to `SIMPLE.duel.slow` on its own whenever an enemy round is
in the air and on its way to you (closing, arriving inside `lead` seconds,
passing within `miss` metres — see `roundInbound`), and comes back the moment
the air is clear. Slow motion is a window the enemy opens, never a resource
you hold, so there is nothing to hoard and nothing to price. You never
advance: they come to you, you sidestep, and when the strip is clear the
corridor itself marches you to the open door.

**STAND STILL — time is yours, and it costs movement.**
The world runs at your thumb's speed: still is `SIMPLE.stop.still`, full drag
is full speed. Standing still stops the world, which is exactly the thing §1
warns about — so **every shot buys the world a slice of full-speed time**
(`SIMPLE.stop.shotTime`). Without it a player could stand in one spot and
empty a magazine into a frozen room at no cost, which is not a game. With it,
the bullets you did not dodge get closer while you take your shots, and the
price of a decision is paid in the only currency left.

### What they keep

Both are built **on** the tunnel — same corridor generator, same doors, same
checkpoints, same spawn pacing, same scarcity, same one-hit-kills. `inHall()`
is the test every one of those systems asks ("am I in a corridor?"), as
distinct from `game.mode`, which says *which* corridor game and therefore who
owns time and what a thumb on the glass means. A simplified mode is the
tunnel with rules **removed**, so it inherits by default and states its
differences, and a change to corridor behaviour cannot reach one and miss the
others.

The four beats (§3) are the thing being tested and are deliberately intact:
see him → watch the round leave → step out of it → shatter him. Every beat
survives; only the input for each one shrinks.

### What they deliberately drop

- **The onboarding.** It teaches a left thumb, a right thumb and a time
  button, and these modes have none of the three.
- **Conditions and measures.** Every one of them is a rule stated in a system
  these modes have taken away — a blackout you cannot look around in, a
  grinder you cannot outrun when the corridor decides your pace.
- **Leg headlines.** Every leg is the same shape here, so "TIGHT TURNS" and
  the rest are lies; the door number is the only true thing left to say.
- **Rushers, in the duel only.** You hold one end of a strip and cannot give
  ground, so an enemy whose answer is "retreat" is unanswerable — it would
  simply arrive. In the duel everything that closes becomes something that
  fires.

### Open questions for playtesting

1. **Is the duel's automatic slow legible?** It is meant to read as *the
   enemy firing slows the world*. If it reads as random, `lead`/`miss` are
   the dials — too generous and the mode is permanently in slow motion with
   nothing to contrast against.
2. **Is stand still's shot cost felt, or just endured?** `shotTime` is the only
   thing stopping the mode from being a shooting gallery.
3. **Does the duel's march to the door outstay its welcome?** It is ~3.5 s of
   corridor with nothing to do. Shorten `duel.legCells` before raising
   `walkSpeed` — the strip's length is also the range the fight opens at.
4. **Is tap-to-shoot precise enough on a real thumb?** `tapMagnetPx` is
   currently 64.
