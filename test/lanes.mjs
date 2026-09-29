import { boot, done } from './lib.mjs';
// CLEAR LANES. A gunner 12 m out aims at the player with another man standing
// dead in his line at 6 m. He must not fire through him: he steps aside,
// arm up, and fires once the lane is clear — measured at the moment the round
// leaves, the man in front is off the line.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '11');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser', 'blinker', 'frankenstein', 'kamikaze', 'drone', 'spawner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.waitForTimeout(1200);

const r = await page.evaluate(async () => {
  const t = window.__ts;
  const step = async (n = 1) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
  t.game.spawnQueue.length = 0; for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
  const yaw = t.player.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const px = t.player.pos.x, pz = t.player.pos.z;
  t.spawnEnemy('gunner', { x: px + fx * 12, z: pz + fz * 12 });
  const a = t.enemies[t.enemies.length - 1];
  t.spawnEnemy('gunner', { x: px + fx * 6, z: pz + fz * 6 });
  const b = t.enemies[t.enemies.length - 1];
  for (let f = 0; f < 400 && (a.state === 'assemble' || b.state === 'assemble'); f++) await step();
  const a0 = { x: a.pos.x, z: a.pos.z };
  b.speed = 0; b.fireCd = 1e9; b.state = 'advance';
  a.speed = 0; a.state = 'aim'; a.stateT = 0; a.fireCd = 0; a.holdFireT = 99;
  const shots0 = t.worldClock().shots;
  let fired = null;
  for (let f = 0; f < 600 && !fired; f++) {
    b.speed = 0; b.fireCd = 1e9; if (b.state === 'aim') b.state = 'advance';
    await step();
    if (t.worldClock().shots > shots0) {
      // where the man in front stands relative to the line the round took
      const lx = t.player.pos.x - a.pos.x, lz = t.player.pos.z - a.pos.z, len = Math.hypot(lx, lz);
      const off = Math.abs((b.pos.x - a.pos.x) * (lz / len) - (b.pos.z - a.pos.z) * (lx / len));
      fired = { off: +off.toFixed(2), moved: +Math.hypot(a.pos.x - a0.x, a.pos.z - a0.z).toFixed(2) };
    }
  }
  return fired;
});
console.log('fired:     ' + JSON.stringify(r));
if (!r) bad('the gunner never fired');
else {
  if (r.off < 0.6) bad('he fired through the man in front: ' + r.off + ' m off the line');
  if (r.moved < 0.4) bad('he did not step aside to clear his lane: moved ' + r.moved + ' m');
}
done('lanes', errs);
await browser.close();
