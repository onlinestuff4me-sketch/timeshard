import { boot, done } from './lib.mjs';
// THE RUN LOG (src/runlog.js): a playtest report.
//
// A run started from the menu is recorded — doors, kills, misses, the death
// and what caused it — and kept on disk, so the report is still there on the
// death screen. RUN LOG on the pause menu and SEND RUN LOG on the death screen
// open the panel; its GitHub link is a pre-filled issue on the repo, short
// enough to open, carrying the note and the summary.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
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

// ---- the pause menu opens the panel -----------------------------------------
await page.evaluate(() => { document.getElementById('pausebtn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await page.waitForTimeout(300);
const paused = await page.evaluate(() => window.__ts.game.state);
if (paused !== 'paused') bad('the pause button did not pause: ' + paused);
await page.tap('#plog');
await page.waitForTimeout(300);
let p = await page.evaluate(() => ({
  open: getComputedStyle(document.getElementById('logpanel')).display === 'flex',
  sum: document.getElementById('logsum').textContent,
  href: document.getElementById('logsend').getAttribute('href') || '',
}));
console.log('from pause:    open=' + p.open + ' href=' + p.href.slice(0, 70) + '…');
if (!p.open) bad('RUN LOG on the pause menu did not open the panel');
const ghost = await page.evaluate(() => document.getElementById('logstatus').textContent);
if (ghost) bad('the tap that opened the panel also pressed a button in it: ' + ghost);
if (!/Kills: gunner 1/.test(p.sum)) bad('the summary does not count the kill: ' + p.sum);
if (!/accuracy 50%/.test(p.sum)) bad('the summary does not show one hit in two shots: ' + p.sum);
if (!p.href.startsWith('https://github.com/onlinestuff4me-sketch/timeshard/issues/new?')) bad('the send link is not a new issue on the repo');
// typing a note goes into the link
await page.fill('#lognote', 'the second round missed on purpose');
p = await page.evaluate(() => decodeURIComponent(document.getElementById('logsend').getAttribute('href')));
if (!p.includes('the second round missed on purpose')) bad('the note is not in the issue');
if (p.length > 8000) bad('the issue link is too long to open: ' + p.length);
await page.waitForTimeout(500);   // past the panel's ghost-click guard
await page.tap('#logclose');
await page.waitForTimeout(200);
const back = await page.evaluate(() => ({
  panel: getComputedStyle(document.getElementById('logpanel')).display,
  pause: getComputedStyle(document.getElementById('pausemenu')).display }));
if (back.panel !== 'none' || back.pause !== 'flex') bad('closing the panel did not return to the pause menu: ' + JSON.stringify(back));
await page.tap('#presume');
await page.waitForTimeout(300);

// ---- a death is logged with its cause, and the death screen can send it ----
await page.evaluate(() => {
  const t = window.__ts;
  t.player.iframes = 0;
  const b = { by: 'probe' };
  t.die(false);
});
await page.waitForFunction(() => getComputedStyle(document.getElementById('logbtn')).display !== 'none',
  null, { timeout: 8000 }).catch(() => {});
const dead = await page.evaluate(() => {
  const L = JSON.parse(localStorage.getItem('ts_runlog_last') || 'null');
  return { btn: getComputedStyle(document.getElementById('logbtn')).display,
    deaths: L && L.counts.deaths.length, kinds: L ? [...new Set(L.events.map((e) => e.k))] : [] };
});
console.log('after death:   ' + JSON.stringify(dead));
if (dead.btn === 'none') bad('the death screen has no SEND RUN LOG');
if (dead.deaths !== 1) bad('the death is not in the saved log');
for (const k of ['kill', 'hit', 'miss', 'pause', 'death']) if (!dead.kinds.includes(k)) bad('no ' + k + ' event in the log');
await page.waitForTimeout(1100);   // past the death screen's panic-tap lockout
await page.tap('#logbtn');
await page.waitForTimeout(300);
const fromDead = await page.evaluate(() => ({
  open: getComputedStyle(document.getElementById('logpanel')).display === 'flex',
  state: window.__ts.game.state }));
if (!fromDead.open) bad('SEND RUN LOG on the death screen did not open the panel');
if (fromDead.state !== 'dead') bad('tapping SEND RUN LOG started a retry: ' + fromDead.state);

done('runlog', errs);
await browser.close();
