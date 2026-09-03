// ---------------------------------------------------------------------------
// THE MODE SELECTOR'S PREVIEW CLIPS.
//
//   node tools/rec-previews.mjs            # all five
//   node tools/rec-previews.mjs duel stop  # just these
//
// Drives each mode headlessly, records the viewport, crops the result to 4:3
// centred on the action and writes assets/preview/<mode>.webm — the paths the
// registry in src/modes.js already points at.
//
// WHY BOT-DRIVEN FOOTAGE AT ALL. A card that names a mode does not say what
// STAND STILL is; a few seconds of it being played does. These clips are
// competent rather than thrilling, and they are meant to be REPLACED: drop a
// better file at the same path — real footage, any size, mp4 if you have it
// (change the extension in src/modes.js) — and nothing else has to change.
//
// THE CROP. The game is a 402x874 portrait viewport. A card wants a landscape
// picture, so the clip is the middle 402x302 of it: the horizon sits at y=437
// and this window is 286..588, which puts the horizon dead centre and keeps
// the top of the gun in frame. Change CROP_Y if the camera pitch ever moves.
//
// THE HUD IS SUPPRESSED, by injected CSS rather than by a flag in the game:
// ammo, the crosshair, banners, the stick and the guide are instructions to
// somebody playing, and on a two-inch card they are illegible noise.
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import { existsSync, readdirSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = join(ROOT, 'assets', 'preview');
const TMP = join(ROOT, '.preview-tmp');
const PORT = process.env.TS_PORT || 8321;
const SECS = +(process.env.TS_SECS || 7);      // seconds of PLAY to drive
const KEEP = +(process.env.TS_KEEP || 5);      // seconds kept, so the loop is short
const CROP_Y = 286;

const FF = (() => {
  const r = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(r)) return null;
  for (const d of readdirSync(r).filter((x) => x.startsWith('ffmpeg-'))) {
    const e = join(r, d, 'ffmpeg-linux');
    if (existsSync(e)) return e;
  }
  return null;
})();
const CHROME = (() => {
  if (process.env.TS_CHROME) return process.env.TS_CHROME;
  const r = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!r || !existsSync(r)) return undefined;
  for (const d of readdirSync(r).filter((x) => x.startsWith('chromium-')).sort().reverse()) {
    const e = join(r, d, 'chrome-linux', 'chrome');
    if (existsSync(e)) return e;
  }
  return undefined;
})();
if (!FF) { console.error('no ffmpeg found under PLAYWRIGHT_BROWSERS_PATH'); process.exit(1); }

// A save deep enough that every mode is unlocked and the tunnel resumes into
// a real fight rather than into the opening metronome.
const SEED = () => {
  try {
    localStorage.setItem('timeshard_taught', '1');   // no lesson in a preview
    localStorage.setItem('ts_s0_used', '1');
    localStorage.setItem('ts_s0_mode', 'hall');
    localStorage.setItem('ts_s0_doors', '24');
    localStorage.setItem('ts_s0_best', '24');
    localStorage.setItem('ts_s0_rdoor', '24');
    localStorage.setItem('ts_s0_at', String(Date.now()));
    localStorage.setItem('ts_s0_born', String(Date.now() - 9e5));
    localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
  } catch { /* private mode */ }
};

// Injected BEFORE the run starts, so no frame of the recording has any of it
// in view. `#overlay` is not in here — the menu has to stay tappable — and is
// added separately once the run is up.
//
// TWO EXCEPTIONS FOR THE TUNNEL. `#tint` is the red wash that says time is
// stopped, which is the one thing that mode IS — hiding it makes the tunnel
// preview a clip of a man walking down a corridor. And `#timebtn` has to stay
// tappable to stop time at all; it sits at y≈700, below the 286..588 window
// this crops to, so it is never in frame either way.
const HUD = ['#hud', '#guide', '#timetip', '#stickbase', '#sticknub', '#wayarrow',
  '#banner', '.lbar', '#pausebtn', '#slowmeter', '#reloadbar'];
const hideHud = (mode) => `${HUD.concat(mode === 'hall' ? [] : ['#tint', '#timebtn'])
  .join(', ')} { display:none !important; }`;
const HIDE_MENU = `#overlay, #modesel { display:none !important; }`;

async function record(mode) {
  const dir = join(TMP, mode);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
    ...(CHROME ? { executablePath: CHROME } : {}),
  });
  const ctx = await b.newContext({
    viewport: { width: 402, height: 874 }, deviceScaleFactor: 1,
    hasTouch: true, isMobile: true,
    recordVideo: { dir, size: { width: 402, height: 874 } },
  });
  await ctx.addInitScript(SEED);
  // WHEN THE RECORDING STARTS. Playwright records the whole life of the
  // context, menu and all, so the trim has to be measured from here rather
  // than guessed — a fixed 2.5s offset produced five clips of the selector.
  const tOpen = Date.now();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__ts, null, { timeout: 20000 });
  await page.addStyleTag({ content: hideHud(mode) });

  // Start the mode the way a player does, so the clip is of the real thing.
  if (mode === 'hall') {
    await page.tap('.go');                       // CONTINUE, into door 24
  } else {
    await page.tap('#startnew');                 // NEW RUN -> the selector
    await page.waitForTimeout(600);
    await page.tap(`#mslist [data-mode="${mode}"]`);
  }
  await page.waitForFunction(() =>
    document.getElementById('overlay').classList.contains('hidden'), null, { timeout: 20000 });
  await page.addStyleTag({ content: HIDE_MENU });
  await page.waitForTimeout(2400);               // let the intro card clear

  // Stay alive and keep the fight in front of the lens.
  await page.evaluate(() => {
    window.__pv = setInterval(() => { if (window.__ts) window.__ts.player.iframes = 999; }, 40);
  });
  const t0 = Date.now();
  const offset = (t0 - tOpen) / 1000;            // where the gameplay begins
  let lastBeat = -1;
  while ((Date.now() - t0) / 1000 < SECS) {
    // KEEP SOMEBODY IN FRAME. A preview of an empty corridor says nothing
    // about the game, and the natural spawn pacing is built to give a PLAYER
    // room to breathe — which on a five-second clip is most of it. Topping
    // the field up uses the mode's own spawn placement, so the bodies stand
    // where that mode would have put them anyway.
    // ...AND IN FRONT OF THE LENS. Left to the mode's own placement they
    // arrive 9-40 m out and, in a corridor that jogs, usually round a corner:
    // five seconds of empty hallway with the occasional ripple. The camera is
    // 42 degrees wide, so a preview has to be STAGED — the body is put where
    // the player is looking, at a readable eleven metres. It behaves like any
    // other from that moment on.
    await page.evaluate(() => {
      const t = window.__ts;
      if (t.enemies.filter((e) => e.alive).length >= 2) return;
      const before = t.enemies.length;
      t.spawnEnemy('gunner');
      const e = t.enemies[t.enemies.length - 1];
      if (!e || t.enemies.length === before) return;
      const V = Object.getPrototypeOf(t.camera.position).constructor;
      const d = t.camera.getWorldDirection(new V());
      const lat = (Math.random() - 0.5) * 3.4;
      const x = t.player.pos.x + d.x * 11 - d.z * lat;
      const z = t.player.pos.z + d.z * 11 + d.x * lat;
      e.pos.set(x, 0, z);
      e.g.position.set(x, 0, z);
    });
    // shoot whatever is closest and on screen
    const tgt = await page.evaluate(() => {
      const t = window.__ts, es = t.enemies.filter((e) => e.alive);
      if (!es.length) return null;
      const p = t.player;
      es.sort((a, c) => Math.hypot(a.pos.x - p.pos.x, a.pos.z - p.pos.z)
                      - Math.hypot(c.pos.x - p.pos.x, c.pos.z - p.pos.z));
      const e = es[0];
      const V = Object.getPrototypeOf(t.camera.position).constructor;
      const v = new V(e.pos.x, 1.25, e.pos.z).project(t.camera);
      if (v.z > 1) return null;
      return { x: (v.x * 0.5 + 0.5) * 402, y: (-v.y * 0.5 + 0.5) * 874 };
    });
    if (tgt && tgt.x > 12 && tgt.x < 390 && tgt.y > 70 && tgt.y < 790) {
      await page.evaluate(async (t) => {
        const o = { pointerId: 5, clientX: t.x, clientY: t.y, bubbles: true, cancelable: true };
        window.dispatchEvent(new PointerEvent('pointerdown', o));
        await new Promise((r) => setTimeout(r, 45));
        window.dispatchEvent(new PointerEvent('pointerup', o));
      }, tgt);
    }
    // STOP TIME, on the mode whose name is about it. Every other beat: press
    // the button, take a shot inside the freeze, let it go. Without this the
    // tunnel's card is indistinguishable from any other corridor shooter.
    if (mode === 'hall') {
      const n = Math.floor((Date.now() - t0) / 900);
      if (n !== lastBeat) {
        lastBeat = n;
        await page.tap('#timebtn').catch(() => {});
      }
    }
    // and move: forward down the corridor, or sideways where forward is not
    // the player's to give (the duel holds one end of its strip)
    const sway = ((Date.now() - t0) / 900) % 2 < 1 ? 1 : -1;
    const dx = mode === 'duel' ? sway * 60 : sway * 26;
    const dy = mode === 'duel' ? 0 : -64;
    await page.mouse.move(150, 640);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(150 + (dx / 6) * i, 640 + (dy / 6) * i);
      await page.waitForTimeout(28);
    }
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(90);
  }
  const st = await page.evaluate(() => {
    clearInterval(window.__pv);
    return { state: window.__ts.game.state, kills: window.__ts.game.kills };
  });
  await ctx.close();
  await b.close();

  const raw = readdirSync(dir).filter((f) => f.endsWith('.webm'))[0];
  if (!raw) throw new Error(`${mode}: playwright wrote no video`);
  const src = join(dir, raw);
  const out = join(OUTDIR, `${mode}.webm`);
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error',
    '-ss', offset.toFixed(2), '-t', String(KEEP), '-i', src,
    '-vf', `crop=402:302:0:${CROP_Y},scale=300:224`,
    '-c:v', 'libvpx', '-b:v', '180k', '-crf', '38', '-r', '15',
    '-auto-alt-ref', '0', '-an', '-y', out]);
  rmSync(dir, { recursive: true, force: true });
  return { mode, ...st, errors: errs.length };
}

mkdirSync(OUTDIR, { recursive: true });
const want = process.argv.slice(2);
const modes = want.length ? want : ['hall', 'duel', 'stop', 'wave', 'rush'];
for (const m of modes) {
  try {
    const r = await record(m);
    console.log(`${m.padEnd(5)} kills=${r.kills} state=${r.state} errors=${r.errors}`);
  } catch (e) {
    console.log(`${m.padEnd(5)} FAILED: ${e.message}`);
  }
}
rmSync(TMP, { recursive: true, force: true });
