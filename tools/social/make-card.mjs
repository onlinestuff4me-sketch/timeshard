// THE LINK-PREVIEW CARD, generated rather than drawn.
//
// Texting the link used to produce a one-line row with the app icon in it,
// because index.html had no og:image at all and Apple's previewer falls back
// to the apple-touch-icon — a small square, which is what makes it choose the
// compact layout. This makes the 1200x630 landscape card that gets the big one.
//
//   node tools/social/make-card.mjs          # writes assets/social/og-card.jpg
//
// Two steps. First it plays the game: warps to a corridor door, finds the
// longest straight run of that leg's spine, stands the player at one end
// facing down it, places three men close enough to read at thumbnail size,
// shatters the nearest and screenshots 260ms into the burst with the HUD
// stripped. Then it composites that frame under the wordmark using
// tools/social/og-card.html and encodes the result.
//
// Needs the repo served at 127.0.0.1:8321 (`python3 -m http.server 8321`).
// Re-run it when the game stops looking like the picture; and when you do,
// change the FILENAME in index.html rather than just the file, because every
// previewer caches these hard.
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
let exe; for (const d of readdirSync(root).filter((x) => x.startsWith('chromium-')).sort().reverse()) {
  const p = join(root, d, 'chrome-linux', 'chrome'); if (existsSync(p)) { exe = p; break; } }
const b = await chromium.launch({ executablePath: exe,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2, hasTouch: true });
await ctx.addInitScript(() => { try {
  const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '14');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '13'); localStorage.setItem('ts_s0_rdoor', '14');
  localStorage.setItem('ts_s0_at', String(now - 3e5));
  localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror: ' + e.message));
await p.goto('http://127.0.0.1:8321/index.html', { waitUntil: 'networkidle' });
await p.waitForFunction(() => !!window.__ts, null, { timeout: 20000 });
await p.waitForTimeout(1800);
// THE WORDMARK IS THE APP'S OWN, not a copy of it. The menu builds SHATTER as
// faceted polygons (buildWordSVG in src/main.js, coloured from TONES) and
// writes it into the title's h1 — so the card lifts that exact markup off the
// running menu rather than re-deriving it here and drifting from it.
const WORDMARK = await p.evaluate(() => {
  const h1 = document.querySelector('#overlay h1');
  const svg = h1 && h1.querySelector('svg');
  return svg ? svg.outerHTML : '';
});
if (!WORDMARK) throw new Error('could not read the faceted wordmark off the menu');
console.log('wordmark: ' + WORDMARK.length + ' bytes of polygons');
await p.tap('.go');
await p.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await p.waitForTimeout(3000);
// stage the shot: a corridor with people in it, time stopped, one man shattering
// THE CORRIDOR IS GENERATED PER RUN, so this cannot take the first thing it
// is given. One draw produced a wide atrium with the men twenty-five metres
// off and no pistol in frame — a true picture of the game and a poor picture
// OF it. So the staging is a search: try doors until one yields a tight
// corridor with a long straight run, stand the men at a fixed distance down
// it, and only accept the frame if the nearest of them is where a poster
// wants him — close enough to read, near enough the centre line to be in shot.
const info = await p.evaluate(async () => {
  const t = window.__ts, C = 4;
  const WANT = { form: 'corridor', straight: 8, near: [6, 15], offDeg: 15 };
  const straightRun = (L) => {
    let best = { i: 0, n: 0 };
    for (let i = 0; i < L.spine.length - 1; i++) {
      const dx = Math.sign(L.spine[i + 1][0] - L.spine[i][0]);
      const dz = Math.sign(L.spine[i + 1][1] - L.spine[i][1]);
      let n = 0;
      for (let k = i; k + 1 < L.spine.length; k++) {
        if (Math.sign(L.spine[k + 1][0] - L.spine[k][0]) !== dx
          || Math.sign(L.spine[k + 1][1] - L.spine[k][1]) !== dz) break;
        n++;
      }
      if (n > best.n) best = { i, n };
    }
    return best;
  };
  const tries = [];
  for (const door of [3, 2, 4, 8, 7, 3, 2, 4]) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 550));
    const L = t.hall().legs[t.hall().cur];
    const form = (L.proto && L.proto.form && L.proto.form.id) || 'corridor';
    const run = straightRun(L);
    tries.push({ door, form, straight: run.n });
    if (form !== WANT.form || run.n < WANT.straight) continue;

    const s0 = L.spine[run.i];
    t.player.pos.x = s0[0] * C; t.player.pos.z = s0[1] * C;
    const ahead = L.spine[Math.min(run.i + run.n, L.spine.length - 1)];
    t.player.yaw = Math.atan2(-(ahead[0] * C - t.player.pos.x), -(ahead[1] * C - t.player.pos.z));
    t.player.pitch = 0;
    t.game.spawnQueue.length = 0;
    for (let i = t.enemies.length - 1; i >= 0; i--) t.killAt(i);
    await new Promise((r) => setTimeout(r, 320));
    const at = (k, off) => {
      const c = L.spine[Math.min(run.i + k, L.spine.length - 1)];
      // the offset is across the corridor, whichever way it runs
      const acrossX = Math.abs(ahead[1] - s0[1]) > Math.abs(ahead[0] - s0[0]) ? off : 0;
      const acrossZ = acrossX ? 0 : off;
      return { x: c[0] * C + acrossX, z: c[1] * C + acrossZ };
    };
    t.spawnEnemy('gunner', at(2, -1.5));
    t.spawnEnemy('gunner', at(3, 1.7));
    t.spawnEnemy('rusher', at(4, -0.3));
    t.setWeapon('pistol');
    await new Promise((r) => setTimeout(r, 1500));
    t.setSlow(99); t.setTimeLocked(true);
    document.body.classList.add('slowmo');
    await new Promise((r) => setTimeout(r, 900));
    if (t.enemies.length) t.killAt(0);
    await new Promise((r) => setTimeout(r, 260));
    t.player.iframes = 999;

    // IS THIS ACTUALLY A PICTURE? The nearest man has to be close enough to
    // read and near enough the centre line to be in frame at all.
    const fx = -Math.sin(t.player.yaw), fz = -Math.cos(t.player.yaw);
    let near = 1e9, off = 180;
    for (const e of t.enemies) {
      if (!e.alive) continue;
      const dx = e.pos.x - t.player.pos.x, dz = e.pos.z - t.player.pos.z;
      const d = Math.hypot(dx, dz);
      const deg = Math.acos(Math.max(-1, Math.min(1, (fx * dx + fz * dz) / (d || 1)))) * 57.3;
      if (d < near) { near = d; off = deg; }
    }
    const ok = near >= WANT.near[0] && near <= WANT.near[1] && off <= WANT.offDeg;
    tries[tries.length - 1] = { door, form, straight: run.n,
      near: +near.toFixed(1), off: +off.toFixed(0), ok };
    if (ok) return { picked: door, near: +near.toFixed(1), off: +off.toFixed(0),
      straight: run.n, tries };
  }
  return { picked: null, tries };
});
if (!info.picked) throw new Error('no corridor framed well enough: '
  + JSON.stringify(info.tries));
console.log('staged: ' + JSON.stringify(info));
// strip the HUD — this is a poster, not a screenshot of a UI
await p.evaluate(() => {
  for (const id of ['hud', 'pausebtn', 'timebtn', 'slowmeter', 'ammo', 'wayarrow',
    'stickL', 'stickR', 'crosshair', 'tslot', 'banner', 'msg', 'sndbtn']) {
    const n = document.getElementById(id); if (n) n.style.display = 'none';
  }
  for (const sel of ['.tslot', '#hudwrap', '#gunlabel', '#pips', '#topbar', '#hudtop',
    '#hudbot', '.stick', '#dodgehand', '#ts-dodge', '#ts-left', '#ts-right', '#ts-mid']) {
    for (const n of document.querySelectorAll(sel)) n.style.display = 'none';
  }
});
await p.waitForTimeout(400);
await p.screenshot({ path: HERE + '/frame.png' });
await b.close();

// ---- 2. composite the frame under the wordmark --------------------------
const b2 = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const p2 = await b2.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p2.goto('file://' + join(HERE, 'og-card.html'), { waitUntil: 'networkidle' });
await p2.evaluate((svg) => {
  const slot = document.getElementById('mark');
  if (slot) slot.innerHTML = svg;
}, WORDMARK);
await p2.waitForTimeout(1200);
await p2.screenshot({ path: join(HERE, 'og-card.png') });
await b2.close();
// THE FILENAME IS VERSIONED, and that is not tidiness — every previewer
// caches these hard and Apple will keep serving a stale card for days, so a
// replaced picture has to arrive at a NEW url. Bump this and the four
// og:image / twitter:image tags in index.html together.
const OUT = 'og-card-v2.jpg';
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', join(HERE, 'og-card.png'),
  '-q:v', '3', join(REPO, 'assets', 'social', OUT)]);
console.log('wrote assets/social/' + OUT
  + '  — bump the name in index.html when the picture changes');
