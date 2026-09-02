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

Three rules the code keeps (`modeUnlocked` in the registry, `unlockState` in
`src/main.js`):

* **The number is the player's, not the save's.** It is the deepest tunnel
  door reached across every save, because unlocking belongs to the player the
  same way UNLOCKS does.
* **Tunnel doors only.** Corridor Duel and Stand Still are built on the
  tunnel's legs and cross doors too; counting those would make "REACH DOOR 5
  IN THE TUNNEL" a lie on the one card that says it, and would let the modes
  bought with the climb pay for each other.
* **Anything you have already played stays yours.** These gates were added to
  a game people were already playing. Somebody with twenty City Streets runs
  must not open the app and find it locked behind a tunnel they never touched,
  so any mode with a save in it is unlocked whatever the gate says.

The same four gates are a section of UNLOCKS, counted `n/4`, each locked row
showing how far off it is (`7/10`) — the one section of that screen that is a
to-do list rather than a record, because a door number is something you can go
and reach.

## The selector

Between "I want to play" and playing. PLAY (when there is nothing to continue)
and NEW RUN both open it; **CONTINUE never does** — the whole promise of that
button is one tap back into the run it names.

Three bands, in this order: **the tunnel**, full width with a bigger picture,
because it is the game; **what you played last**, most recent first, so coming
back to a game you are mid-way through is the second thing on the screen; then
**everything else**, in the order it opens.

Every card carries a few seconds of that mode actually being played, because a
name is not an answer to "what is STAND STILL". A locked card keeps its
picture — dimmed — and states its gate: a gate you cannot see is not a goal,
and the picture is the whole reason to want what is behind it. Tapping one
refuses on the card itself, because `showBanner` draws at z-index 10,
underneath this panel.

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
