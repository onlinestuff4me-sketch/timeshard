// ---------------------------------------------------------------------------
// SCREENSHOTS OF THE CORRIDOR SIGNS, for review.
//
//   node tools/shot-signs.mjs
//
// Drives the onboarding from the first frame and photographs each sign where
// a player actually meets it. Writes .shots/NN-name.png plus a JSON sidecar
// with what the game says was on screen, so a caption can state a fact rather
// than describe a picture.
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import { existsSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.shots');
const PORT = process.env.TS_PORT || 8399;

const CHROME = (() => {
  const r = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!r || !existsSync(r)) return undefined;
  for (const d of readdirSync(r).filter((x) => x.startsWith('chromium-')).sort().reverse()) {
    const e = join(r, d, 'chrome-linux', 'chrome');
    if (existsSync(e)) return e;
  }
  return undefined;
})();

// A fresh player: no save, onboarding armed. The whole point is lesson 1.
const SEED = () => { try { localStorage.clear(); } catch { /* private */ } };

const shots = [];
async function shoot(page, name, note) {
  const state = await page.evaluate(() => ({
    signs: window.__ts.signs(),
    tutor: window.__ts.tutor(),
    pos: { x: +window.__ts.player.pos.x.toFixed(1), z: +window.__ts.player.pos.z.toFixed(1) },
  }));
  const file = `${String(shots.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: join(OUT, file) });
  shots.push({ file, name, note, ...state });
  const g = state.signs;
  if (process.env.TS_DEBUG) console.log('   list:', JSON.stringify(g.list));
  console.log(`  ${file}  showing=${JSON.stringify(g.showing)} on=${g.onScreen} ` +
    `post=${g.post} cueUp=${g.cueUp} spineIx=${g.spineIx} proj=${JSON.stringify(g.proj)} ` +
    `step=${state.tutor.step}`);
}

// PLACED, NOT WALKED. A screenshot wants an exact frame, and driving the
// floating stick through Playwright's touch emulation is a slow way to arrive
// somewhere approximate. The player is put on a named cell of the leg's own
// spine, facing along the path, which is deterministic and is the same place a
// walking player passes through.
async function standAt(page, ix, lookAhead = 2) {
  await page.evaluate(([i, la]) => {
    const t = window.__ts, L = t.hall() && t.hall().legs[t.hall().cur];
    if (!L || !L.spine) return;
    const C = 4;   // HALL.cell
    const j = Math.max(0, Math.min(L.spine.length - 1, i));
    const k = Math.max(0, Math.min(L.spine.length - 1, j + la));
    const [gx, gz] = L.spine[j], [nx, nz] = L.spine[k];
    t.player.pos.x = gx * C; t.player.pos.z = gz * C;
    const dx = (nx - gx) * C, dz = (nz - gz) * C;
    // FORWARD IS (-sin yaw, -cos yaw) in this game — see the move stick in
    // main.js, `dirX = cosY*sx + -sinY*-sy`. Facing a direction is therefore
    // atan2(-dx, -dz), and getting the sign wrong puts every projection
    // behind the camera, where `project()` returns z > 1 and the painter
    // correctly refuses to draw.
    if (dx || dz) t.player.yaw = Math.atan2(-dx, -dz);
    t.player.pitch = 0;
  }, [ix, lookAhead]);
  // TELEPORTED, NOT WALKED — so resync the spine index the same way a retry
  // does. tutorUpdateSpineIx only ever accepts the next cell along.
  await page.evaluate(() => window.__ts.resyncSpine && window.__ts.resyncSpine());
  await page.waitForTimeout(420);   // a few frames for the projection to settle
}

const run = async () => {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
    ...(CHROME ? { executablePath: CHROME } : {}),
  });
  const ctx = await b.newContext({
    viewport: { width: 402, height: 874 }, deviceScaleFactor: 2,
    hasTouch: true, isMobile: true,
  });
  await ctx.addInitScript(SEED);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__ts, null, { timeout: 20000 });

  // A FIRST RUN HAS NO SAVE ROW. `.go` is PLAY, and with nothing to continue
  // it opens the mode selector rather than starting a run — see the pointer
  // gate in main.js: "PLAY is where a first-time player meets the games."
  await page.tap('.go');
  await page.waitForSelector('#mslist [data-mode="hall"]', { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.tap('#mslist [data-mode="hall"]');
  await page.waitForTimeout(400);
  const start = await page.$('#modesel .pbtn');
  if (start && await start.isVisible()) await start.tap();
  await page.waitForFunction(() =>
    document.getElementById('overlay').classList.contains('hidden'), null, { timeout: 20000 });
  await page.waitForTimeout(1400);

  // The lesson prompts own the frame early, so jump past them to photograph
  // the cell-anchored signs on their own.
  await page.evaluate(() => window.__ts.setTutorStep('exit'));
  await page.waitForTimeout(900);
  await standAt(page, 9, 3);
  await shoot(page, 'placed-sign',
    'A sign anchored to an explicit cell rather than a spine index. This is '
    + 'what a dead-end branch needs: the spine does not go there, so there is '
    + 'no mark to name it.');
  await standAt(page, 21, 3);
  await shoot(page, 'signpost',
    'A signpost: one message, two halves, one wall, one anchor. Both labels '
    + 'scale and move as a single object, so it stays one message.');

  writeFileSync(join(OUT, 'shots.json'), JSON.stringify({ shots, errs }, null, 2));
  if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 4));
  await ctx.close(); await b.close();
};

const { spawn } = await import('node:child_process');
const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
try { await new Promise((r) => setTimeout(r, 900)); await run(); }
finally { srv.kill(); }
