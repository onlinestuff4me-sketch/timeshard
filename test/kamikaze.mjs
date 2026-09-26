import { boot, done } from './lib.mjs';
// THE KAMIKAZE (docs/ARSENAL.md §8, KAMI in balance.js). He carries no gun and
// never aims. A pack sets off KAMI.gap apart. He arms KAMI.r from you and
// bursts KAMI.fuse later, taking you with him if you are still inside KAMI.r.
// Shot, he pops anyway: his friends inside KAMI.r go with him, you do not.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['kamikaze', 'rusher']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// put `types` in a row `dist` m ahead, `apart` m apart across the corridor, and wait for them
const place = (types, dist, apart = 0) => page.evaluate(async ([types, dist, apart]) => {
  const t = window.__ts;
  for (const e of t.enemies) e.g.visible = false;
  t.enemies.length = 0; t.game.spawnQueue.length = 0;
  const yaw = t.player.yaw, out = [];
  types.forEach((ty, i) => {
    const off = (i - (types.length - 1) / 2) * apart;
    t.spawnEnemy(ty, { x: t.player.pos.x - Math.sin(yaw) * dist + Math.cos(yaw) * off,
      z: t.player.pos.z - Math.cos(yaw) * dist - Math.sin(yaw) * off });
    out.push(t.enemies[t.enemies.length - 1]);
  });
  window.__row = out;
  const t0 = performance.now();
  while (out.some((e) => e.state === 'assemble') && performance.now() - t0 < 8000) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
  }
}, [types, dist, apart]);

// ---- a pack sets off one by one, and nobody in it ever aims ---------------
await place(['kamikaze', 'kamikaze', 'kamikaze'], 14, 0.9);
const pack = await page.evaluate(async () => {
  const t = window.__ts, row = window.__row;
  let aimed = false;
  const t0 = performance.now();
  while (performance.now() - t0 < 1500) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    if (row.some((e) => e.state === 'aim' || e.state === 'burst')) aimed = true;
  }
  const go = row.map((e) => e.kGo).sort((a, b) => a - b);
  return { gaps: go.slice(1).map((g, i) => +(g - go[i]).toFixed(2)), aimed };
});
console.log('pack:          ' + JSON.stringify(pack));
if (pack.gaps.some((g) => Math.abs(g - 0.35) > 0.02)) bad('the pack did not set off 0.35 s apart');
if (pack.aimed) bad('a kamikaze aimed a gun');

// ---- left alone, he arms and his burst takes you ---------------------------
await place(['kamikaze'], 8);
const boom = await page.evaluate(async () => {
  const t = window.__ts, e = window.__row[0];
  let armedAt = null, dist = null;
  const t0 = performance.now();
  while (performance.now() - t0 < 12000 && t.player.alive) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 0;
    if (e.state === 'fuse' && armedAt === null) {
      armedAt = t.worldClock().now;
      dist = +Math.hypot(e.pos.x - t.player.pos.x, e.pos.z - t.player.pos.z).toFixed(2);
    }
  }
  return { armedAt: armedAt !== null, dist, alive: t.player.alive,
    fuse: armedAt !== null ? +(t.worldClock().now - armedAt).toFixed(2) : null };
});
console.log('left alone:    ' + JSON.stringify(boom));
if (!boom.armedAt) bad('he never armed');
if (boom.dist !== null && boom.dist > 3.6) bad('he armed from ' + boom.dist + ' m, not 3.5');
if (boom.alive) bad('his burst did not take the player');

// ---- a fresh run for the rest --------------------------------------------
await page.waitForTimeout(1500);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// ---- shot beside a friend: both go, and you do not -------------------------
await place(['kamikaze', 'gunner'], 9, 1.6);
const shot = await page.evaluate(async () => {
  const t = window.__ts, [k, g] = window.__row;
  g.fireCd = 1e9; g.speed = 0; k.speed = 0;
  t.player.iframes = 0; t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
  t.fireAt(k.pos.x, 1.2, k.pos.z);
  const t0 = performance.now();
  while (performance.now() - t0 < 3000 && (t.enemies.includes(k) || t.enemies.includes(g))) {
    await new Promise((r) => requestAnimationFrame(r));
    g.fireCd = 1e9;
  }
  for (let i = 0; i < 10; i++) await new Promise((r) => requestAnimationFrame(r));
  return { kamikaze: t.enemies.includes(k), friend: t.enemies.includes(g), alive: t.player.alive };
});
console.log('shot:          ' + JSON.stringify(shot));
if (shot.kamikaze) bad('the round did not shatter him');
if (shot.friend) bad('his pop did not take the friend beside him');
if (!shot.alive) bad('a shot kamikaze killed the player');

done('kamikaze', errs);
await browser.close();
