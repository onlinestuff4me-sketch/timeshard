import { boot, done } from './lib.mjs';
// THE SPAWNER (docs/ARSENAL.md §9, §12; SPAWNER in balance.js).
//
// A man shattered near a live dish hangs for SPAWNER.hang world-seconds and
// stands up again; that kill refunds no bank. Break the dish and what it holds
// stays down. The floor-4 boss holds his six guards; his dish's first break
// hangs HIM and he comes back with the room; the second is the end, and his
// reward is a second life: once, a hit that would shatter you does not.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['spawner', 'drone', 'shotgunner', 'rusher', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'blinker', 'frankenstein', 'kamikaze', 'armored', 'rocketeer']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// helpers in the page
await page.evaluate(() => {
  const t = window.__ts;
  window.__step = (n = 1) => new Promise(async (res) => {
    for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
    res();
  });
  window.__formed = async (e) => { const t0 = performance.now();
    while (e.state === 'assemble' && performance.now() - t0 < 8000) await window.__step(); };
  window.__shoot = async (x, y, z) => {
    t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
    t.fireAt(x, y, z);
    const t0 = performance.now();
    while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t0 < 6000) {
      for (const e of t.enemies) { e.fireCd = 1e9; e.speed = 0; }
      await window.__step();
    }
  };
  window.__waitWorld = async (s) => { const w0 = t.worldClock().now, t0 = performance.now();
    while (t.worldClock().now - w0 < s && performance.now() - t0 < 30000) {
      for (const e of t.enemies) { e.fireCd = 1e9; e.speed = 0; }
      await window.__step();
    } };
});

// ---- an ordinary spawner holds a gunner ----------------------------------
const hold = await page.evaluate(async () => {
  const t = window.__ts;
  for (const e of t.enemies) e.g.visible = false;
  t.enemies.length = 0; t.game.spawnQueue.length = 0;
  const yaw = t.player.yaw;
  const ahead = (d, side = 0) => ({ x: t.player.pos.x - Math.sin(yaw) * d + Math.cos(yaw) * side,
    z: t.player.pos.z - Math.cos(yaw) * d - Math.sin(yaw) * side });
  t.spawnEnemy('spawner', ahead(11, 0.8));
  const s = t.enemies[t.enemies.length - 1];
  t.spawnEnemy('gunner', ahead(7, -0.6));
  const g = t.enemies[t.enemies.length - 1];
  await window.__formed(s); await window.__formed(g);
  window.__sp = s;
  t.setSlow(1);
  await window.__shoot(g.pos.x, 1.2, g.pos.z);
  const r = { gunnerDown: !t.enemies.includes(g), hanging: t.revives(), bank: t.slow().bank };
  await window.__waitWorld(2.3);
  r.back = t.enemies.filter((e) => e.type === 'gunner').length;
  return r;
});
console.log('held:          ' + JSON.stringify(hold));
if (!hold.gunnerDown) bad('the gunner did not go down');
if (hold.hanging !== 1) bad('the gunner is not hanging under the dish');
if (hold.bank > 1.01) bad('a kill under the spawner refunded bank: ' + hold.bank);
if (hold.back !== 1) bad('the gunner did not stand back up after the hang');

// ---- break the dish while he hangs: he stays down --------------------------
const dish = await page.evaluate(async () => {
  const t = window.__ts, s = window.__sp;
  const g = t.enemies.find((e) => e.type === 'gunner');
  await window.__formed(g);
  await window.__shoot(g.pos.x, 1.2, g.pos.z);
  const hanging = t.revives();
  await window.__shoot(s.pos.x, s.dishY, s.pos.z);
  const spawnerDown = !t.enemies.includes(s);
  await window.__waitWorld(2.5);
  return { hanging, spawnerDown, after: t.revives(), gunners: t.enemies.filter((e) => e.type === 'gunner').length };
});
console.log('dish broken:   ' + JSON.stringify(dish));
if (dish.hanging !== 1) bad('the second kill did not hang');
if (!dish.spawnerDown) bad('a round on the dish did not break it');
if (dish.after || dish.gunners) bad('the man it was holding came back after the dish broke');

// ---- the boss --------------------------------------------------------------
await page.evaluate(() => window.__ts.startPlaytest('spawner'));
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.evaluate(() => {   // the page reloaded its run, not its helpers: re-arm them
  const t = window.__ts; t.player.iframes = 999;
});
let k = await page.evaluate(() => window.__ts.keeper());
if (!k || k.kind !== 'spawner') bad('door 30 does not end in the spawner\'s room');
else {
  await page.evaluate(() => { const t = window.__ts, k = t.keeper(); t.player.pos.set(k.seal.x, 0, k.seal.z + 1.5); t.player.yaw = Math.PI; });
  await page.waitForFunction(() => { const k = window.__ts.keeper(); return k && k.started; }, null, { timeout: 8000 }).catch(() => {});
  const boss = await page.evaluate(async () => {
    const t = window.__ts, s = t.keeperEnemy();
    const L = t.hall().legs[t.hall().cur];
    await window.__formed(s);
    for (const a of L.boss.adds) await window.__formed(a);
    const guards = L.boss.adds.map((a) => a.type).sort().join();
    // one guard down: he hangs
    const g = L.boss.adds.find((a) => a.type === 'bomber');   // the one with a clear lane
    await window.__shoot(g.pos.x, 1.2, g.pos.z);
    const hung = t.revives();
    // the dish, once: the boss hangs, the guard stays down, the room comes back
    await window.__shoot(s.pos.x, s.dishY, s.pos.z);
    const first = { alive: t.enemies.includes(s), hanging: !!s.hanging, revives: t.revives() };
    await window.__waitWorld(4.6);
    const reformed = { hanging: !!s.hanging, guards: t.enemies.filter((e) => e !== s && e.type !== 'spawner').length };
    for (const a of t.enemies) if (a !== s) await window.__formed(a);
    // the lane to the dish, cleared by hand: this step is about the dish
    for (let i = t.enemies.length - 1; i >= 0; i--) if (t.enemies[i] !== s) { t.enemies[i].g.visible = false; t.enemies.splice(i, 1); }
    const n0 = t.enemies.length, clank0 = s.usedLife;
    await window.__shoot(s.pos.x, s.dishY, s.pos.z);
    const second = { alive: t.enemies.includes(s), lost: n0 - t.enemies.length, used: clank0,
      dist: +Math.hypot(s.pos.x - t.player.pos.x, s.pos.z - t.player.pos.z).toFixed(1), dishY: s.dishY, vis: s.g.visible };
    const t0 = performance.now();
    while (!(t.keeper().reward && t.keeper().reward.given) && performance.now() - t0 < 8000) await window.__step();
    await window.__step(30);
    return { guards, hung, first, reformed, second, secondLife: !!t.hall().secondLife, hud: t.hudText(),
      door: t.keeper().door };
  });
  console.log('the boss:      ' + JSON.stringify(boss));
  if (boss.guards !== 'armored,blinker,bomber,gunner,heavy,shotgunner') bad('his guard is not the six: ' + boss.guards);
  if (boss.hung !== 1) bad('a guard shattered in his room did not hang');
  if (!boss.first.alive || !boss.first.hanging) bad('the first break did not hang him');
  if (boss.first.revives) bad('his guard came back while he was reforming');
  if (boss.reformed.hanging || boss.reformed.guards !== 6) bad('he did not reform with the whole room: ' + JSON.stringify(boss.reformed));
  if (boss.second.alive) bad('the second break did not end him');
  if (!boss.secondLife) bad('the second life was not given');
  if (!/2ND LIFE/.test(boss.hud)) bad('the HUD does not show the second life');
  if (!boss.door) bad('the exit did not open');
  // ...and it works, once
  const life = await page.evaluate(async () => {
    const t = window.__ts;
    t.player.iframes = 0;
    t.die(false);
    const first = t.player.alive;
    await window.__step(20);
    t.player.iframes = 0;
    t.die(false);
    return { first, second: t.player.alive };
  });
  console.log('second life:   ' + JSON.stringify(life));
  if (!life.first) bad('the second life did not save the first killing hit');
  if (life.second) bad('the second life saved a second hit');
}

done('spawner', errs);
await browser.close();
