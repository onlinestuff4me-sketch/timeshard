# Source masters

The originals. Nothing here is served to a player — the game loads only what
is under `assets/`, and these are kept so a cut can be redone without going
back to the uploader.

## What was made from what

| master | shipped as | how |
|---|---|---|
| `2050 - Electric Boost.mp3` (194s, 320kbps, 7.8MB) | `assets/music/electric-boost.mp3` (81.55s, 112kbps, 1.1MB) | trimmed to the end of bar 32 and re-encoded; the cover art dropped |
| `foley_footstep_vinyl_1.wav` | `assets/sfx/step1.mp3` | leading silence trimmed to the transient, loudness-matched to -20 LUFS, mono |
| `foley_footstep_vinyl_2.wav` | `assets/sfx/step2.mp3` | same — the raw pair were 10dB apart, which walks with a limp |

The music track is **95.000 bpm exactly**, so a bar is 2.526316s and every
loop point in `MUSIC` in `src/main.js` is a bar line. If you re-cut it, the
constraint is that a loop must be a whole number of bars, and the opening
section must be an EVEN number of them because its pattern is two bars long.

Commands, for the next person:

```sh
ffmpeg -i "Timeshard-sfx/2050 - Electric Boost.mp3" -vn -t 81.55 \
  -c:a libmp3lame -b:a 112k -ac 2 -ar 44100 -map_metadata -1 -write_xing 1 \
  assets/music/electric-boost.mp3

ffmpeg -i Timeshard-sfx/foley_footstep_vinyl_1.wav \
  -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0:detection=peak,loudnorm=I=-20:TP=-3:LRA=7" \
  -ac 1 -ar 44100 -c:a libmp3lame -q:a 4 -map_metadata -1 assets/sfx/step1.mp3
```
