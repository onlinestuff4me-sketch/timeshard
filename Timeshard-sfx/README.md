# Source masters

The originals. Nothing here is served to a player — the game loads only what
is under `assets/`, and these are kept so a cut can be redone without going
back to the uploader.

## What was made from what

| master | shipped as | how |
|---|---|---|
| `2050 - Electric Boost.mp3` (194s, 320kbps, 7.8MB) | `assets/music/electric-boost.mp3` (81.55s, 112kbps, 1.1MB) | trimmed to the end of bar 32 and re-encoded; the cover art dropped |
| `foley_footstep_vinyl_2.wav` | `assets/sfx/step.mp3` | leading silence trimmed to the transient, loudness-matched to -20 LUFS, mono |
| `foley_footstep_vinyl_1.wav` | *(unused)* | it was not the same floor as its pair; kept in case it is wanted elsewhere |

**There is one footstep sample, not two.** The left foot is the same recording
played a semitone and a half up (`STEP_PITCH` in `src/main.js`), which is what
makes the two feet sound like a pair: the same boot on the same floor. Two
different recordings did not, and one of them did not match the game at all.

## The music's sections

One file, three parts, named so we can talk about them: **INTRO** (bars 0-5,
looped — the menu, a run's opening, the whole tutorial), **DROP** (bar 7 on
its own, the riser; not a section you can be in, just how you get from one to
the other), **DRIVE** (bars 8-31, looped). They are loop points inside a
single buffer rather than three files: three files would mean three decodes,
three sets of encoder padding to fight, and a gap at every join.

The music track is **95.000 bpm exactly**, so a bar is 2.526316s and every
loop point in `MUSIC` in `src/main.js` is a bar line. If you re-cut it, the
constraint is that a loop must be a whole number of bars, and the opening
section must be an EVEN number of them because its pattern is two bars long.

Commands, for the next person:

```sh
ffmpeg -i "Timeshard-sfx/2050 - Electric Boost.mp3" -vn -t 81.55 \
  -c:a libmp3lame -b:a 112k -ac 2 -ar 44100 -map_metadata -1 -write_xing 1 \
  assets/music/electric-boost.mp3

ffmpeg -i Timeshard-sfx/foley_footstep_vinyl_2.wav \
  -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0:detection=peak,loudnorm=I=-20:TP=-3:LRA=7" \
  -ac 1 -ar 44100 -c:a libmp3lame -q:a 4 -map_metadata -1 assets/sfx/step.mp3
```
