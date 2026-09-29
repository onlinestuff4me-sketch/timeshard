import { boot, done } from './lib.mjs';
// THE DEBUT CARD (docs/ARSENAL.md §11), in the tunnel.
//
// The first time a save meets a type, the world stops as he finishes
// assembling and the camera turns and zooms to frame him over a dimmed room;
// a panel gives his name, what he does, and a hint only where his weakness is
// not obvious. A touch takes it down and does nothing else. Once
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

// ---- a new type: stopped, named, framed -----------------------------------
let m = await meetOne('rusher');
console.log('rusher:        ' + JSON.stringify(m));
if (!m.on) bad('a rusher this save has never met did not get a card');
if (m.who !== 'RUSHER') bad('the card names ' + m.who);
if (!/charges at you/i.test(m.what)) bad('the card does not say what he does: ' + m.what);
if (!/arm pulls back/i.test(m.hint)) bad('the rusher\'s hint is missing: ' + m.hint);
if (m.shot < 0.95) bad('the camera did not settle on him: ' + m.shot);
if (!(m.fov < 45)) bad('the lens did not close on him: fov ' + m.fov);
if (!m.ndc || Math.abs(m.ndc.x) > 0.1 || m.ndc.y < 0.15 || m.ndc.y > 0.45) bad('he is not framed in the top half: ' + JSON.stringify(m.ndc));
if (m.dim < 0.6) bad('the room was not dimmed: ' + m.dim);
await page.screenshot({ path: 'test/out/meetcard.png' });
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
await page.waitForFunction(() => window.__ts.meet().shot === 0, null, { timeout: 5000 }).catch(() => {});
const back = await page.evaluate(() => ({ shot: window.__ts.meet().shot, fov: window.__ts.meet().fov,
  hidden: document.body.classList.contains('meeting') }));
console.log('camera back:   ' + JSON.stringify(back));
if (back.shot !== 0 || back.fov < 60) bad('the camera did not come back from the card: ' + JSON.stringify(back));
if (back.hidden) bad('the controls stayed hidden after the card');

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

// ---- not until he is in view: a new type behind you waits for you to turn --
const behind = await page.evaluate(async () => {
  const t = window.__ts;
  const step = async (n) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
  for (const e of t.enemies) e.alive = false;
  t.enemies.length = 0;
  // he stands 9 m down the corridor (open floor); the player faces AWAY
  const yaw = t.player.yaw;
  t.spawnEnemy('shotgunner', { x: t.player.pos.x - Math.sin(yaw) * 9, z: t.player.pos.z - Math.cos(yaw) * 9 });
  t.player.yaw = yaw + Math.PI;
  const e = t.enemies[t.enemies.length - 1];
  for (let f = 0; f < 300 && e.state === 'assemble'; f++) await step(1);
  e.speed = 0; e.fireCd = 1e9;
  await step(40);
  const before = t.meet().on;
  t.player.yaw = yaw;   // turn round to face him
  let after = false;
  for (let f = 0; f < 60 && !after; f++) { await step(1); after = t.meet().on; }
  return { before, after, type: t.meet().type };
});
console.log('behind you:    ' + JSON.stringify(behind));
if (behind.before) bad('the card came up for a new type standing behind the player');
if (!behind.after || behind.type !== 'shotgunner') bad('turning to face him did not bring up his card');
await page.waitForTimeout(500);
await page.mouse.click(200, 400);
await page.waitForTimeout(300);

// ---- once per SAVE: a reload remembers ------------------------------------
await page.reload();
await start();
m = await meetOne('rusher');
console.log('after reload:  rusher on=' + m.on + '  carded=' + JSON.stringify(m.carded));
if (m.on) bad('the rusher was carded again after a reload');
if (!m.carded.includes('rusher') || !m.carded.includes('heavy') || !m.carded.includes('shotgunner')) bad('the save did not keep who it has met');

done('meetcard', errs);
await browser.close();
