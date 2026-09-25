import { boot, done } from './lib.mjs';
// THE DEBUT CARD (docs/ARSENAL.md §11), in the tunnel.
//
// The first time a save meets a type, the world stops as he finishes
// assembling: a ring on him, his name, what he does, and a hint only where his
// weakness is not obvious. A touch takes it down and does nothing else. Once
// per save — the same type later, or after a reload, is not stopped again —
// and never for the gunner, whose introduction is the onboarding.
const SEED = () => { try { const now = Date.now();
  if (localStorage.getItem('__seeded')) return;       // the reload keeps what the run wrote
  localStorage.setItem('__seeded', '1');
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
const start = async () => {
  await page.waitForTimeout(1600);
  await page.tap('.go');
  await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
    null, { timeout: 20000 });
  await page.waitForTimeout(1200);
};
// put `type` 9 m in front of the player and wait for him to stand up
const meetOne = (type) => page.evaluate(async (type) => {
  const t = window.__ts;
  for (const e of t.enemies) e.alive = false;
  t.enemies.length = 0;
  t.player.iframes = 999;
  const yaw = t.player.yaw;
  t.spawnEnemy(type, { x: t.player.pos.x - Math.sin(yaw) * 9, z: t.player.pos.z - Math.cos(yaw) * 9 });
  const t0 = performance.now();
  while (performance.now() - t0 < 4000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    if (t.meet().on) break;
  }
  const w0 = t.worldClock().now;
  for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r));
  return { ...t.meet(), worldMoved: +(t.worldClock().now - w0).toFixed(4) };
}, type);

await start();

// ---- a new type: stopped, named, ringed -----------------------------------
let m = await meetOne('rusher');
console.log('rusher:        ' + JSON.stringify(m));
if (!m.on) bad('a rusher this save has never met did not get a card');
if (m.who !== 'RUSHER') bad('the card names ' + m.who);
if (!/charges you/i.test(m.what)) bad('the card does not say what he does: ' + m.what);
if (!/arm pulls back/i.test(m.hint)) bad('the rusher\'s hint is missing: ' + m.hint);
if (!m.pin) bad('there is no ring on him');
if (m.worldMoved > 0.002) bad('the world kept moving under the card: ' + m.worldMoved + ' s');

// ---- a touch takes it down, and fires nothing ------------------------------
const mag0 = await page.evaluate(() => window.__ts.player.mag);
await page.waitForTimeout(500);
await page.mouse.click(200, 400);
await page.waitForTimeout(300);
const after = await page.evaluate(() => ({ on: window.__ts.meet().on, mag: window.__ts.player.mag }));
console.log('after a tap:   ' + JSON.stringify(after));
if (after.on) bad('a tap did not take the card down');
if (after.mag !== mag0) bad('the tap that dismissed the card also fired');

// ---- the same type again: no card -----------------------------------------
m = await meetOne('rusher');
console.log('rusher again:  on=' + m.on);
if (m.on) bad('the rusher was carded twice');

// ---- no hint where his weakness is obvious; none at all for the gunner -----
m = await meetOne('heavy');
console.log('heavy:         ' + JSON.stringify({ on: m.on, who: m.who, hint: m.hint }));
if (!m.on) bad('the heavy got no card');
if (m.hint) bad('the heavy should have no hint: ' + m.hint);
await page.waitForTimeout(500);
await page.mouse.click(200, 400);
await page.waitForTimeout(300);
m = await meetOne('gunner');
console.log('gunner:        on=' + m.on);
if (m.on) bad('the gunner got a card; his introduction is the onboarding');

// ---- once per SAVE: a reload remembers ------------------------------------
await page.reload();
await start();
m = await meetOne('rusher');
console.log('after reload:  rusher on=' + m.on + '  carded=' + JSON.stringify(m.carded));
if (m.on) bad('the rusher was carded again after a reload');
if (!m.carded.includes('rusher') || !m.carded.includes('heavy')) bad('the save did not keep who it has met');

done('meetcard', errs);
await browser.close();
