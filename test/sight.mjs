import { boot, done } from './lib.mjs';
// THE NO-MISSES STREAK AND SIGHT (docs/ARSENAL.md §12), in the tunnel.
//
// A shot is one trigger pull, however many pellets: a hit if it shatters
// anyone, a miss if all its rounds end without doing so (a wall, plate, armor).
// Each tier (10, 30, 50) forgives one miss; the second in the same tier drops
// to the floor below. Sight is a power (the drone boss's): before it is owned
// the streak counts and nothing shows; once owned, enemies show through walls,
// fainter to sharper by tier.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['armored', 'rusher', 'shotgunner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// ---- the forgiveness rule, exactly as written ------------------------------
const walk = await page.evaluate(() => {
  const t = window.__ts, out = [];
  t.aimSet(43);
  t.aimMiss(); out.push(t.aim().n);                       // 30
  t.aimHit(); t.aimHit(); out.push(t.aim().n);            // 32
  t.aimMiss(); out.push(t.aim().n);                       // 10
  t.aimHit(); t.aimHit(); out.push(t.aim().n);            // 12
  t.aimMiss(); out.push(t.aim().n);                       // 10
  for (let i = 0; i < 4; i++) t.aimHit(); out.push(t.aim().n);   // 14
  t.aimMiss(); out.push(t.aim().n);                       // 0
  return out;
});
console.log('43 miss ...:   ' + walk.join(' -> '));
if (walk.join(',') !== '30,32,10,12,10,14,0') bad('the forgiveness rule gives ' + walk.join(','));

// ---- real rounds -----------------------------------------------------------
// one man, `type`, 9 m ahead, standing still and holding his fire
const stand = (type) => page.evaluate(async (type) => {
  const t = window.__ts;
  for (const e of t.enemies) e.g.visible = false;
  t.enemies.length = 0;
  t.game.spawnQueue.length = 0;
  const yaw = t.player.yaw;
  t.spawnEnemy(type, { x: t.player.pos.x - Math.sin(yaw) * 9, z: t.player.pos.z - Math.cos(yaw) * 9 });
  const e = t.enemies[t.enemies.length - 1];
  window.__man = e;
  const t0 = performance.now();
  while (e.state === 'assemble' && performance.now() - t0 < 6000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
  }
  e.speed = 0; e.fireCd = 1e9;
}, type);
// fire at his (dx, y) and wait until every round of it is gone
const fire = (dx, y) => page.evaluate(async ([dx, y]) => {
  const t = window.__ts, e = window.__man;
  t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
  const yaw = t.player.yaw;
  t.fireAt(e.pos.x + Math.cos(yaw) * dx, y, e.pos.z - Math.sin(yaw) * dx);
  const t0 = performance.now();
  while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t0 < 8000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999; if (e) e.fireCd = 1e9;
  }
  return t.aim();
}, [dx, y]);

await page.evaluate(() => window.__ts.aimSet(0));
await stand('gunner');
let a = await fire(0, 1.2);
console.log('a kill:        n=' + a.n);
if (a.n !== 1) bad('a round that shattered him did not count: n=' + a.n);
await stand('gunner');
a = await fire(3, 1.2);
console.log('into the wall: n=' + a.n);
if (a.n !== 0) bad('a round into the wall did not break the streak: n=' + a.n);

// armor is a miss: the round sparks off him and shatters no one
await page.evaluate(() => window.__ts.aimSet(12));
await stand('armored');
a = await fire(0, 1.0);
console.log('armored body:  n=' + a.n);
if (a.n !== 10) bad('a body shot on armor should drop 12 to 10, got ' + a.n);

// a shotgun shell is ONE shot: six pellets on him count once
await page.evaluate(() => { window.__ts.aimSet(5); window.__ts.setWeapon('shotgun', 3); });
await stand('gunner');
a = await fire(0, 1.2);
console.log('shotgun kill:  n=' + a.n);
if (a.n !== 6) bad('a shell that shattered him should add exactly one, got n=' + a.n);
await page.evaluate(() => window.__ts.setWeapon('pistol', 3));

// ---- sight: nothing until it is owned, then by tier ------------------------
const look = (n) => page.evaluate(async (n) => {
  const t = window.__ts;
  t.aimSet(n);
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
  return t.aim().ghost;
}, n);
await stand('gunner');
const ghosts = await page.evaluate(() => {
  let n = 0;
  window.__man.g.traverse((m) => { if (m.isMesh && m.userData.noGhost && m.renderOrder === 5) n++; });
  return n;
});
if (!ghosts) bad('an enemy has no see-through twin to show');
let g = await look(35);
if (g) bad('sight shows at 35 before the power is owned: ' + g);
await page.evaluate(() => window.__ts.setSight(true));
const byTier = [];
for (const n of [5, 10, 35, 55]) byTier.push(await look(n));
console.log('sight by n:    5,10,35,55 -> ' + byTier.join(', '));
if (byTier[0] !== 0) bad('under 10 nothing should show');
if (!(byTier[1] > 0 && byTier[1] < byTier[2] && byTier[2] < byTier[3])) bad('sight does not sharpen by tier');
await page.evaluate(() => window.__ts.setSight(false));

done('sight', errs);
await browser.close();
