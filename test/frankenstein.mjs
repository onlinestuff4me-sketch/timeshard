import { boot, done } from './lib.mjs';
// FRANKENSTEIN AND THE SEEKER (docs/ARSENAL.md §8, §12; FRANK in balance.js).
//
// Only his arms shatter: a body shot clanks off the plate, an arm shot takes
// that arm and its gun, and he fires a PAIR while he has both. An ordinary one
// comes apart with his second arm. The floor-2 boss (door 16's last leg)
// instead opens his chest and rushes; shot then, he goes down, his shards make
// the SEEKER on the floor, and the exit stays shut until it is picked up. The
// seeker hunts the nearest man and bursts; a kamikaze pack cleared without
// arming refills it.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['frankenstein', 'bomber', 'rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'blinker', 'kamikaze']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

const frames = (n) => page.evaluate(async (n) => {
  for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); window.__ts.player.iframes = 999; }
}, n);
// fire at a point on `e` ('body', 'armR', 'armL') and wait for the round to resolve
const shootAt = (where) => page.evaluate(async (where) => {
  const t = window.__ts, e = window.__man;
  t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
  let x = e.pos.x, y = 1.2, z = e.pos.z;
  if (where !== 'body') {
    const v = (where === 'armR' ? e.foreR : e.foreL).localToWorld(e.pos.clone().set(0, 0.02, 0));
    x = v.x; y = v.y; z = v.z;
  }
  t.fireAt(x, y, z);
  const t0 = performance.now();
  while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t0 < 6000) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; e.fireCd = 1e9;
  }
  return { alive: t.enemies.includes(e), arms: [e.armR.visible, e.armL.visible].filter(Boolean).length,
    rushing: !!e.rushing };
}, where);

// ---- an ordinary one: plate, then one arm, a pair, then the second arm -----
await page.evaluate(async () => {
  const t = window.__ts;
  for (const e of t.enemies) e.g.visible = false;
  t.enemies.length = 0; t.game.spawnQueue.length = 0;
  const yaw = t.player.yaw;
  t.spawnEnemy('frankenstein', { x: t.player.pos.x - Math.sin(yaw) * 8, z: t.player.pos.z - Math.cos(yaw) * 8 });
  const e = t.enemies[t.enemies.length - 1];
  window.__man = e;
  const t0 = performance.now();
  while (e.state === 'assemble' && performance.now() - t0 < 6000) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
  }
  e.speed = 0; e.fireCd = 1e9;
});
let r = await shootAt('body');
console.log('body shot:     ' + JSON.stringify(r));
if (!r.alive || r.arms !== 2) bad('a body shot did something other than clank off the plate');
const pair = await page.evaluate(async () => {
  const t = window.__ts, e = window.__man;
  const n0 = t.bullets.filter((b) => !b.fromPlayer).length;
  e.fireCd = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < 4000) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    const n = t.bullets.filter((b) => !b.fromPlayer).length;
    if (n > n0) { await new Promise((r) => requestAnimationFrame(r)); break; }
  }
  e.fireCd = 1e9;
  return t.bullets.filter((b) => !b.fromPlayer).length - n0;
});
console.log('his volley:    ' + pair + ' rounds');
if (pair !== 2) bad('two arms should fire a pair, fired ' + pair);
r = await shootAt('armR');
console.log('right arm:     ' + JSON.stringify(r));
if (!r.alive || r.arms !== 1) bad('the arm shot did not take exactly one arm');
r = await shootAt('armL');
console.log('left arm:      ' + JSON.stringify(r));
if (r.alive) bad('an ordinary one survived losing both arms');

// ---- the boss room on door 16 ----------------------------------------------
await page.evaluate(() => window.__ts.startPlaytest('frankenstein'));
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
let k = await page.evaluate(() => window.__ts.keeper());
console.log('door 16:       ' + JSON.stringify({ door: await page.evaluate(() => window.__ts.hall().doorsPassed + 1), kind: k && k.kind }));
if (!k || k.kind !== 'frankenstein') bad('door 16 does not end in Frankenstein\'s room');
else {
  await page.evaluate(() => { const t = window.__ts, k = t.keeper(); t.player.pos.set(k.seal.x, 0, k.seal.z + 1.5); t.player.yaw = Math.PI; });
  await page.waitForFunction(() => { const k = window.__ts.keeper(); return k && k.started; }, null, { timeout: 8000 }).catch(() => {});
  const room = await page.evaluate(async () => {
    const t = window.__ts, e = t.keeperEnemy();
    window.__man = e;
    const t0 = performance.now();
    while (e.state === 'assemble' && performance.now() - t0 < 8000) {
      await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
    }
    const L = t.hall().legs[t.hall().cur];
    for (const a of L.boss.adds) { a.speed = 0; a.fireCd = 1e9; }
    e.fireCd = 1e9;
    return { adds: L.boss.adds.map((a) => a.type), boss: e.boss };
  });
  console.log('the room:      ' + JSON.stringify(room));
  if (room.adds.join() !== 'bomber,bomber') bad('his adds are not the two bombers');
  r = await shootAt('armR'); r = await shootAt('armL');
  console.log('both arms:     ' + JSON.stringify(r));
  if (!r.rushing) bad('the boss did not open up and rush after losing both arms');
  if (!r.alive) bad('the boss came apart instead of rushing');
  r = await shootAt('body');
  console.log('shot rushing:  ' + JSON.stringify(r));
  if (r.alive) bad('a shot on his open chest did not stop the rush');
  // the reward: the seeker forms on the floor, and the door waits for it
  await page.waitForFunction(() => { const k = window.__ts.keeper(); return k && k.done; }, null, { timeout: 5000 }).catch(() => {});
  const rw = await page.evaluate(async () => {
    const t = window.__ts;
    const t0 = performance.now();
    let p = null;
    while (performance.now() - t0 < 8000 && !p) {
      await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
      p = t.pickups.find((x) => x.type === 'seeker');
    }
    for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r));
    const doorBefore = t.keeper().door;
    if (p) {
      for (let i = 0; i < 60 && t.pickups.includes(p); i++) {
        t.player.pos.set(p.g.position.x, 0, p.g.position.z);
        await new Promise((r) => requestAnimationFrame(r));
      }
    }
    for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r));
    return { pickup: !!p, doorBefore, doorAfter: t.keeper().door, hand: t.player.weapon,
      mag: t.player.mag, given: t.keeper().reward && t.keeper().reward.given };
  });
  console.log('the reward:    ' + JSON.stringify(rw));
  if (!rw.pickup) bad('no seeker formed on the floor');
  if (rw.doorBefore) bad('the exit opened before the seeker was taken');
  if (rw.hand !== 'seeker' || rw.mag !== 1) bad('the seeker is not in the hand, loaded');
  if (!rw.doorAfter) bad('the exit did not open once the seeker was taken');
}

// ---- the seeker hunts, and a clean kamikaze pack refills it ----------------
const hunt = await page.evaluate(async () => {
  const t = window.__ts;
  for (const e of t.enemies) e.g.visible = false;
  t.enemies.length = 0; t.game.spawnQueue.length = 0;
  const yaw = t.player.yaw;
  // off to the side: the seeker has to turn to find him
  t.spawnEnemy('gunner', { x: t.player.pos.x - Math.sin(yaw) * 10 + 2.5, z: t.player.pos.z - Math.cos(yaw) * 10 });
  const g = t.enemies[t.enemies.length - 1];
  const t0 = performance.now();
  while (g.state === 'assemble' && performance.now() - t0 < 6000) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
  g.speed = 0; g.fireCd = 1e9;
  t.player.fireCd = 0; t.player.swapT = 0;
  t.fireAt(t.player.pos.x - Math.sin(yaw) * 10, 1.2, t.player.pos.z - Math.cos(yaw) * 10);
  const t1 = performance.now();
  while ((t.seekers() || t.enemies.includes(g)) && performance.now() - t1 < 6000) {
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999;
  }
  const after = { killed: !t.enemies.includes(g), mag: t.player.mag };
  t.seekerRefill();
  return { ...after, refilled: t.player.weapon === 'seeker' ? t.player.mag : t.slots().find((b) => b.type === 'seeker')?.mag };
});
console.log('the seeker:    ' + JSON.stringify(hunt));
if (!hunt.killed) bad('the seeker did not hunt down the man off to the side');
if (hunt.refilled !== 1) bad('a refill did not give one seeker back');

done('frankenstein', errs);
await browser.close();
