import { boot, done } from './lib.mjs';
// SEND LOG AND THE PLAYTEST MENU (src/runlog.js).
//
// A run from the menu is recorded — a kill, a miss, the pause, the death and
// its cause — and saved as it goes. SEND LOG is one tap: the first time it
// queues the report and asks once for this device's GitHub key; after that it
// posts the log to the repo as a `playtest` issue in the background and says
// so. A send that fails waits in an outbox. The title's PLAYTEST menu starts
// straight on the Keeper's leg.
//
// GitHub is never called: `fetch` is replaced in the page and every request
// is recorded, so the probe checks what WOULD have been posted.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'blinker']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {}
  // GitHub, stubbed: record every request, answer as the issues API would
  window.__posts = [];
  window.__offline = false;
  const real = window.fetch;
  window.fetch = async (url, opt) => {
    if (String(url).startsWith('https://api.github.com/')) {
      if (window.__offline) throw new TypeError('Failed to fetch');
      window.__posts.push({ url: String(url), auth: opt.headers.Authorization, body: JSON.parse(opt.body) });
      return { ok: true, status: 201, json: async () => ({ number: 40 + window.__posts.length }) };
    }
    return real(url, opt);
  };
};
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
const toast = () => page.evaluate(() => document.getElementById('logtoast').textContent);
const shown = (id) => page.evaluate((id) => getComputedStyle(document.getElementById(id)).display !== 'none', id);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// a kill and a miss, on a man standing still 9 m ahead
await page.evaluate(async () => {
  const t = window.__ts;
  const shoot = async (dx) => {
    for (const e of t.enemies) e.g.visible = false;
    t.enemies.length = 0; t.game.spawnQueue.length = 0;
    const yaw = t.player.yaw;
    t.spawnEnemy('gunner', { x: t.player.pos.x - Math.sin(yaw) * 9, z: t.player.pos.z - Math.cos(yaw) * 9 });
    const e = t.enemies[t.enemies.length - 1];
    const t0 = performance.now();
    while (e.state === 'assemble' && performance.now() - t0 < 6000) {
      await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    }
    e.speed = 0; e.fireCd = 1e9;
    t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
    t.fireAt(e.pos.x + Math.cos(yaw) * dx, 1.2, e.pos.z - Math.sin(yaw) * dx);
    const t1 = performance.now();
    while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t1 < 8000) {
      await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    }
  };
  await shoot(0);
  await shoot(3);
});

// ---- first SEND LOG, no key yet: queued, and the one-time card ------------
await page.evaluate(() => { document.getElementById('pausebtn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await page.waitForTimeout(300);
await page.tap('#plog');
await page.waitForTimeout(400);
let st = await page.evaluate(() => ({ card: getComputedStyle(document.getElementById('keycard')).display,
  waiting: window.__ts.runlogPending(), posts: window.__posts.length }));
console.log('no key yet:    ' + JSON.stringify(st));
if (st.card !== 'flex') bad('the first SEND LOG did not ask for a key');
if (st.waiting !== 1) bad('the report was not queued before the card opened: ' + st.waiting);
if (st.posts) bad('something was posted with no key');

// ---- the key, once: the queued report goes, in the background ------------
await page.waitForTimeout(500);   // past the card's ghost-tap guard
await page.fill('#keyin', 'github_pat_TESTKEY');
await page.tap('#keysave');
await page.waitForFunction(() => window.__posts.length >= 1, null, { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(200);
let posts = await page.evaluate(() => window.__posts);
console.log('after the key: ' + posts.length + ' post(s), toast "' + await toast() + '"');
if (posts.length !== 1) bad('the queued report was not sent once the key was saved');
else {
  const p = posts[0];
  if (!p.url.endsWith('/repos/onlinestuff4me-sketch/timeshard/issues')) bad('posted to ' + p.url);
  if (p.auth !== 'Bearer github_pat_TESTKEY') bad('not posted with the saved key');
  if (!(p.body.labels || []).includes('playtest')) bad('the issue is not labelled playtest');
  if (!/Kills: gunner 1/.test(p.body.body)) bad('the report does not count the kill');
  if (!/accuracy 50%/.test(p.body.body)) bad('the report does not show 1 hit in 2 shots');
  if (!/ kill /.test(p.body.body) || !/ miss /.test(p.body.body)) bad('the events are not in the report');
}
if (!/LOG SENT/.test(await toast())) bad('no LOG SENT toast');
if (await page.evaluate(() => window.__ts.runlogPending())) bad('the outbox was not emptied');
if (!(await shown('pausemenu'))) bad('the pause menu did not stay up');

// ---- offline: saved, and sent with the next one ---------------------------
await page.evaluate(() => { window.__offline = true; });
await page.waitForTimeout(3100);   // past the one-report-per-tap guard
await page.tap('#plog');
await page.waitForTimeout(600);
st = await page.evaluate(() => ({ waiting: window.__ts.runlogPending(), posts: window.__posts.length }));
console.log('offline:       ' + JSON.stringify(st) + ' toast "' + await toast() + '"');
if (st.waiting !== 1) bad('an offline send was not kept for later');
if (!/WILL SEND/.test(await toast())) bad('an offline send did not say it will send later');
await page.evaluate(() => { window.__offline = false; });
await page.tap('#presume');
await page.waitForTimeout(300);

// ---- the death screen: one tap sends both, and does not start a retry ----
await page.evaluate(() => { window.__ts.player.iframes = 0; window.__ts.die(false); });
await page.waitForFunction(() => getComputedStyle(document.getElementById('logbtn')).display !== 'none',
  null, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(3200);   // past the panic-tap lockout and the send guard
await page.tap('#logbtn');
await page.waitForFunction(() => window.__posts.length >= 3, null, { timeout: 5000 }).catch(() => {});
st = await page.evaluate(() => ({ posts: window.__posts.length, waiting: window.__ts.runlogPending(),
  state: window.__ts.game.state,
  death: /Deaths: door \d+ \(/.test(window.__posts[window.__posts.length - 1]?.body.body || '') }));
console.log('death screen:  ' + JSON.stringify(st));
if (st.posts !== 3) bad('the death screen did not send this run and the waiting one: ' + st.posts);
if (st.waiting) bad('the outbox was not emptied');
if (!st.death) bad('the death is not in the report');
if (st.state !== 'dead') bad('SEND LOG started a retry: ' + st.state);

// ---- PLAYTEST menu: straight onto the Keeper's leg -----------------------
await page.tap('#menubtn');
await page.waitForFunction(() => window.__ts.game.state === 'menu', null, { timeout: 8000 });
await page.waitForTimeout(800);
if (!(await shown('ptlink'))) bad('the title screen has no PLAYTEST button');
await page.tap('#ptlink');
await page.waitForTimeout(600);
if (!(await shown('ptmenu'))) bad('PLAYTEST did not open its menu');
await page.tap('#ptkeeper');
await page.waitForFunction(() => window.__ts.game.state === 'play' || window.__ts.game.state === 'intro',
  null, { timeout: 20000 });
const k = await page.evaluate(() => ({ door: window.__ts.hall().doorsPassed + 1, keeper: !!window.__ts.keeper() }));
console.log('skip to keeper: ' + JSON.stringify(k));
if (k.door !== 9 || !k.keeper) bad('SKIP TO THE KEEPER did not start on his leg');

done('runlog', errs);
await browser.close();
