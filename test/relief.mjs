import { boot, done } from './lib.mjs';
// ARMS FOR THE UNARMED (playtest 2026-10-06; ARMS_RELIEF in balance.js). Out
// of ammo with only the knife, and nobody up but a rusher: two gunners stand
// up where you can see them, and knifing one leaves a pistol. With a gun that
// still has rounds, nobody comes.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '6');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'gunner', 'kamikaze']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
const run = (armed) => page.evaluate(async (armed) => {
  const t = window.__ts;
  const step = async (n) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
  t.game.spawnQueue.length = 0; for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
  t.pickups.length = 0;
  for (const k of Object.keys(t.player.reserve)) t.player.reserve[k] = 0;
  t.player.bag.length = 0;
  if (armed) t.setWeapon('pistol', 1); else t.setWeapon('knife', 0);
  await step(5);
  const yaw = t.player.yaw;
  t.spawnEnemy('rusher', { x: t.player.pos.x - Math.sin(yaw) * 14, z: t.player.pos.z - Math.cos(yaw) * 14 });
  const r = t.enemies[t.enemies.length - 1]; r.speed = 0;
  await step(120);
  const relief = t.enemies.filter((e) => e.relief);
  const out = { types: t.enemies.map((e) => e.type), relief: relief.length,
    dist: relief.map((e) => Math.round(Math.hypot(e.pos.x - t.player.pos.x, e.pos.z - t.player.pos.z))) };
  if (relief.length) {
    for (let f = 0; f < 300 && relief[0].state === 'assemble'; f++) await step(1);
    t.killAt(t.enemies.indexOf(relief[0]));
    await step(3);
    out.dropped = t.pickups.map((p) => p.type);
  }
  return out;
}, armed);
const dry = await run(false);
console.log('knife only vs a rusher: ' + JSON.stringify(dry));
if (dry.relief !== 2) bad('two gunners did not come for a player with only the knife: ' + dry.relief);
if (dry.dist.some((d) => d < 8 || d > 19)) bad('they stood up too near or too far: ' + dry.dist.join());
if (!dry.dropped || !dry.dropped.includes('pistol')) bad('knifing one left no pistol: ' + JSON.stringify(dry.dropped));
const armed = await run(true);
console.log('with a loaded pistol:   ' + JSON.stringify(armed));
if (armed.relief) bad('gunners came for a player who still had rounds');
done('relief', errs);
await browser.close();
