# Reference media

Footage and stills we design against. Not shipped — nothing here is loaded
by the game, and no asset in `games/` or `src/` may reference it.

| File | What it is | What we take from it |
|---|---|---|
| `Superhot-clip1.mp4` | Superhot gameplay capture, 1280×720, 29.5 fps, 17 s | art direction, room architecture, bullet tracers, body shatter, viewmodel framing |

To pull frames for a look:

```bash
ffmpeg -i reference-media/Superhot-clip1.mp4 -vf "fps=2,scale=960:-1" -q:v 2 /tmp/frames/f%03d.png
```
