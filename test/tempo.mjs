import { boot, done } from './lib.mjs';
// THE TEMPO STREAK (docs/ARSENAL.md §12; TEMPO in balance.js).
//
// Kills in quick succession shorten reloads and swaps: x0.75 at 5, x0.5 at
// 10, x0.25 at 15, and at 20 no reload at all. Any break is zero. The window
// only runs while someone is alive to shoot, so a cleared room never breaks it.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// Drive the streak directly: `kills` kills, each `gap` world-seconds apart,
// with a man alive the whole time (the clock only runs while one is).
const streak = (kills, gap) => page.evaluate(([kills, gap]) => {
  const t = window.__ts;
  t.bagReset();
  if (!t.enemies.length) t.spawnEnemy('gunner', { x: 0, z: -30 });
  for (let i = 0; i < kills; i++) { t.tempoTick(gap); t.tempoKill(); }
  return t.tempo();
}, [kills, gap]);

for (const [k, want] of [[4, 1], [5, 0.75], [10, 0.5], [15, 0.25], [20, 0]]) {
  const s = await streak(k, 1.0);
  console.log(`${String(k).padStart(2)} kills in tempo: x${s.mul}`);
  if (s.mul !== want) bad(`${k} kills should be x${want}, got x${s.mul}`);
}

// ---- each level is celebrated once a run, and the HUD says what it buys ----
const told = await page.evaluate(() => {
  const t = window.__ts;
  const lv = () => t.banners().filter((b) => /TEMPO LEVEL/.test(b));
  const n0 = lv().length;
  t.bagReset();
  if (!t.enemies.length) t.spawnEnemy('gunner', { x: 0, z: -30 });
  for (let i = 0; i < 10; i++) { t.tempoTick(1); t.tempoKill(); }
  const run1 = lv().slice(n0);
  const hud = document.getElementById('ammo').textContent;
  // broken and rebuilt to 5 in the SAME run: already celebrated
  t.tempoTick(5);
  for (let i = 0; i < 5; i++) { t.tempoTick(1); t.tempoKill(); }
  const again = lv().length - n0 - run1.length;
  return { run1, again, hud };
});
console.log('tempo told:  ' + JSON.stringify(told));
// a picture of the banner for a person: out/tempo-level.png
await page.waitForFunction(() => /TEMPO LEVEL/.test(document.getElementById('banner').innerHTML)
  && document.getElementById('banner').classList.contains('show'), null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(700);
await page.screenshot({ path: 'test/out/tempo-level.png' });
if (told.run1.length !== 2 || !/TEMPO LEVEL 5/.test(told.run1[0]) || !/TEMPO LEVEL 10/.test(told.run1[1])) {
  bad('reaching 5 and then 10 should celebrate TEMPO LEVEL 5 and TEMPO LEVEL 10: ' + JSON.stringify(told.run1));
}
if (told.run1[0] && !/QUICK KILLS = FASTER RELOADS/.test(told.run1[0])) bad('the level banner does not say what it buys: ' + told.run1[0]);
if (told.again) bad('a level was celebrated twice in one run');
if (!/TEMPO \d+ · FASTER RELOAD/.test(told.hud)) bad('the HUD does not say what tempo buys: ' + told.hud);

// ---- any break is zero ---------------------------------------------------
const broke = await page.evaluate(() => {
  const t = window.__ts;
  t.tempoTick(3.5);            // past the window, with a man still up
  return t.tempo();
});
console.log('after a 3.5 s gap:  n=' + broke.n);
if (broke.n !== 0) bad('a break did not drop the streak to zero: ' + broke.n);

// ---- a cleared room pauses the window ------------------------------------
const paused = await page.evaluate(() => {
  const t = window.__ts;
  t.bagReset();
  t.spawnEnemy('gunner', { x: 0, z: -30 });
  for (let i = 0; i < 6; i++) { t.tempoTick(1); t.tempoKill(); }
  const saved = t.enemies.splice(0);   // the room is clear
  t.tempoTick(10);                     // a long walk to the next door
  const n = t.tempo().n;
  t.enemies.push(...saved);
  return n;
});
console.log('after a 10 s walk through a cleared room: n=' + paused);
if (paused !== 6) bad('the walk between rooms broke the streak: ' + paused);

// ---- the reload really is shorter, and at 20 it is instant ----------------
const reload = await page.evaluate(async () => {
  const t = window.__ts;
  const out = {};
  for (const [k, gap] of [[0, 1], [10, 1], [20, 1]]) {
    t.bagReset();
    if (!t.enemies.length) t.spawnEnemy('gunner', { x: 0, z: -30 });
    for (let i = 0; i < k; i++) { t.tempoTick(gap); t.tempoKill(); }
    t.player.mag = 0; t.player.clips = 2;
    t.startReload();
    out[k] = { reloadT: +t.player.reloadT.toFixed(3), mag: t.player.mag };
  }
  return out;
});
console.log('reload at 0 / 10 / 20: ' + JSON.stringify(reload));
if (!(reload[10].reloadT < reload[0].reloadT * 0.51)) bad('10 in tempo did not halve the reload');
if (reload[20].reloadT !== 0 || reload[20].mag <= 0) bad('20 in tempo still waited to reload');

done('tempo', errs);
await browser.close();
