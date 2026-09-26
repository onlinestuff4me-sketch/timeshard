import { boot, done } from './lib.mjs';
// THE DRONE (docs/ARSENAL.md §8, §12; DRONE in balance.js).
//
// It hovers above head height, holds its distance and never fires; while it
// is up the HUD says MARKED and the others' rounds lead a moving player. A
// round on its hull brings it down. The floor-3 boss (door 23's last leg) is
// the same thing the size of a car: four hits, faster each time, gunners and a
// shotgunner on a loop, and SIGHT streamed into you when he falls.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['drone', 'shotgunner', 'rusher', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'blinker', 'frankenstein', 'kamikaze', 'armored', 'rocketeer']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// ---- one drone and one gunner --------------------------------------------
const setup = await page.evaluate(async () => {
  const t = window.__ts;
  for (const e of t.enemies) e.g.visible = false;
  t.enemies.length = 0; t.game.spawnQueue.length = 0;
  const yaw = t.player.yaw;
  const ahead = (d, side = 0) => ({ x: t.player.pos.x - Math.sin(yaw) * d + Math.cos(yaw) * side,
    z: t.player.pos.z - Math.cos(yaw) * d - Math.sin(yaw) * side });
  const noMark = t.droneMarking();
  t.spawnEnemy('drone', ahead(9));
  const d = t.enemies[t.enemies.length - 1];
  window.__drone = d;
  const t0 = performance.now();
  while (d.state === 'assemble' && performance.now() - t0 < 6000) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
  let aimed = false, minD = 99, maxD = 0;
  const t1 = performance.now();
  while (performance.now() - t1 < 2500) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    if (d.state === 'aim') aimed = true;
    const dd = Math.hypot(d.pos.x - t.player.pos.x, d.pos.z - t.player.pos.z);
    minD = Math.min(minD, dd); maxD = Math.max(maxD, dd);
  }
  return { noMark, marked: t.droneMarking(), hud: t.hudText(), aimed, hover: +(d.hull.position.y).toFixed(2),
    band: [+minD.toFixed(1), +maxD.toFixed(1)] };
});
console.log('spotter:       ' + JSON.stringify(setup));
if (setup.noMark) bad('marked with no drone up');
if (!setup.marked || !/MARKED/.test(setup.hud)) bad('the drone is up and nobody is marked');
if (setup.aimed) bad('the drone aimed a gun');
if (setup.hover < 2.2) bad('the drone is not above head height: ' + setup.hover);
if (setup.band[0] < 5) bad('the drone came in close: ' + setup.band[0] + ' m');

// ---- the lead: a gunner aims ahead of a player on the move ----------------
const lead = await page.evaluate(async () => {
  const t = window.__ts;
  const yaw = t.player.yaw;
  t.spawnEnemy('gunner', { x: t.player.pos.x - Math.sin(yaw) * 12, z: t.player.pos.z - Math.cos(yaw) * 12 });
  const g = t.enemies[t.enemies.length - 1];
  const t0 = performance.now();
  while (g.state === 'assemble' && performance.now() - t0 < 6000) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
  g.speed = 0;
  // the player "moving" sideways at 4 m/s; watch where his next round points
  const side = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  const n0 = t.bullets.length;
  g.fireCd = 0;
  let b = null;
  const t1 = performance.now();
  while (!b && performance.now() - t1 < 6000) {
    t.player.vel.set(side.x * 4, 0, side.z * 4);
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    b = t.bullets.slice(n0).find((x) => !x.fromPlayer);
  }
  t.player.vel.set(0, 0, 0);
  if (!b) return null;
  // how far to the side of the player's current spot the round is headed
  const v = b.vel.clone().normalize();
  const tx = t.player.pos.x - b.pos.x, tz = t.player.pos.z - b.pos.z;
  const along = tx * v.x + tz * v.z;
  const px = b.pos.x + v.x * along, pz = b.pos.z + v.z * along;
  return +((px - t.player.pos.x) * side.x + (pz - t.player.pos.z) * side.z).toFixed(2);
});
console.log('lead:          ' + lead + ' m ahead of a moving player');
if (lead === null) bad('the gunner never fired');
else if (lead < 0.4) bad('with a drone up, the round did not lead the player');

// ---- a round on the hull brings it down, and the mark lifts -----------------
const down = await page.evaluate(async () => {
  const t = window.__ts, d = window.__drone;
  for (const e of t.enemies) if (e !== d) e.fireCd = 1e9;
  t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
  t.fireAt(d.pos.x, d.hull.position.y, d.pos.z);
  const t0 = performance.now();
  while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t0 < 5000) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
  }
  return { alive: t.enemies.includes(d), marked: t.droneMarking() };
});
console.log('shot down:     ' + JSON.stringify(down));
if (down.alive) bad('a round on the hull did not bring it down');
if (down.marked) bad('still marked with the drone down');

// ---- the boss: door 23, four hits, sight --------------------------------
await page.evaluate(() => window.__ts.startPlaytest('drone'));
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
let k = await page.evaluate(() => window.__ts.keeper());
if (!k || k.kind !== 'drone') bad('door 23 does not end in the drone\'s room');
else {
  await page.evaluate(() => { const t = window.__ts, k = t.keeper(); t.player.pos.set(k.seal.x, 0, k.seal.z + 1.5); t.player.yaw = Math.PI; });
  await page.waitForFunction(() => { const k = window.__ts.keeper(); return k && k.started; }, null, { timeout: 8000 }).catch(() => {});
  const fight = await page.evaluate(async () => {
    const t = window.__ts, e = t.keeperEnemy();
    const L = t.hall().legs[t.hall().cur];
    const t0 = performance.now();
    while (e.state === 'assemble' && performance.now() - t0 < 8000) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
    const adds = L.boss.adds.map((a) => a.type);
    const hits = [];
    for (let i = 0; i < 6 && t.enemies.includes(e); i++) {
      for (const a of L.boss.adds) { a.speed = 0; a.fireCd = 1e9; }
      e.speed = 0;   // pinned for the shot: his speed is a phase's, and phases are what this counts
      t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
      t.fireAt(e.pos.x, e.hull.position.y, e.pos.z);
      const t1 = performance.now();
      while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t1 < 5000) {
        await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
      }
      hits.push(t.enemies.includes(e) ? e.hp : 0);
    }
    const t2 = performance.now();
    while (!(t.keeper().reward && t.keeper().reward.given) && performance.now() - t2 < 8000) {
      await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    }
    for (let i = 0; i < 30; i++) await new Promise((r) => requestAnimationFrame(r));
    return { adds, hits, given: !!(t.keeper().reward && t.keeper().reward.given),
      sight: !!t.hall().sightTaken, door: t.keeper().door };
  });
  console.log('the boss:      ' + JSON.stringify(fight));
  if (fight.adds.join() !== 'gunner,gunner,shotgunner') bad('his adds are not two gunners and a shotgunner');
  if (fight.hits.join() !== '3,2,1,0') bad('he should take four hits: ' + fight.hits);
  if (!fight.given || !fight.sight) bad('sight was not given');
  if (!fight.door) bad('the exit did not open');
}

done('drone', errs);
await browser.close();
