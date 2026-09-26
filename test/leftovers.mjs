import { boot, done } from './lib.mjs';
// THE SMALL BEATS (docs/ARSENAL.md §1, §11, §12, §9):
//  - a type this save already knows gets a small name tag over him in the
//    tunnel, not a flash across the screen;
//  - with the bag full, the pill a gun on the floor near you would push out
//    dims before you walk over it;
//  - sight at 50 shows faint rings where the next wave stands up, while one
//    is still to come;
//  - crossing into a new floor rides the elevator: the screen goes dark for a
//    beat and names the floor.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '8');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'blinker', 'sniper', 'bomber', 'frankenstein']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.evaluate(() => {
  const t = window.__ts;
  window.__step = async (n = 1) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
  window.__clear = () => { for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0; t.game.spawnQueue.length = 0; };
});

// ---- the name tag over a known rusher --------------------------------------
const tag = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  if (t.game.seenTypes) delete t.game.seenTypes.rusher;
  const yaw = t.player.yaw;
  t.spawnEnemy('rusher', { x: t.player.pos.x - Math.sin(yaw) * 10, z: t.player.pos.z - Math.cos(yaw) * 10 });
  const e = t.enemies[t.enemies.length - 1];
  e.speed = 0; e.fireCd = 1e9;
  let seen = null, card = false;
  const t0 = performance.now();
  while (performance.now() - t0 < 6000 && !seen) {
    await window.__step(); e.speed = 0;
    seen = t.nameTag(); card = card || t.meet().on;
  }
  // and it goes on its own
  const t1 = performance.now();
  while (performance.now() - t1 < 5000 && t.nameTag()) await window.__step();
  return { seen, card, gone: !t.nameTag() };
});
console.log('name tag:  ' + JSON.stringify(tag));
if (!tag.seen || !/RUSHER/i.test(tag.seen)) bad('no name tag over a known rusher: ' + tag.seen);
if (tag.card) bad('a known rusher got the debut card');
if (!tag.gone) bad('the name tag never went');

// ---- the pill a pickup would push out --------------------------------------
const po = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  if (!t.switcherOn()) return { skip: true };
  for (let i = t.pickups.length - 1; i >= 0; i--) t.pickups.length = i;
  t.player.bag.length = 0;
  t.player.bag.push({ type: 'pistol', mag: 5, mk: 1 }, { type: 'shotgun', mag: 2, mk: 1 }, { type: 'burst', mag: 2, mk: 1 });
  await window.__step(3);
  const before = { ix: t.wouldPushOut(), dim: document.querySelectorAll('#ammo .pill.out').length };
  const yaw = t.player.yaw;
  t.spawnPickup({ x: t.player.pos.x - Math.sin(yaw) * 4, z: t.player.pos.z - Math.cos(yaw) * 4 }, 'sniper');
  await window.__step(3);
  const pills = [...document.querySelectorAll('#ammo .pill')].map((p) => p.classList.contains('out'));
  const near = { ix: t.wouldPushOut(), pills };
  for (let i = t.pickups.length - 1; i >= 0; i--) t.pickups.length = i;
  await window.__step(3);
  const after = { ix: t.wouldPushOut(), dim: document.querySelectorAll('#ammo .pill.out').length };
  return { before, near, after };
});
console.log('push-out:  ' + JSON.stringify(po));
if (po.skip) bad('the switcher is off on door 8');
else {
  if (po.before.ix !== -1 || po.before.dim) bad('a pill is dimmed with no pickup near');
  if (po.near.ix !== 2) bad('the gun would not push out the last find: ' + po.near.ix);
  if (po.near.pills.join() !== 'false,false,true') bad('the wrong pill is dimmed: ' + po.near.pills.join());
  if (po.after.ix !== -1 || po.after.dim) bad('the pill stayed dimmed after the pickup went');
}

// ---- sight at 50: the next wave's rings ------------------------------------
const rings = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  t.setSight(true);
  const L = t.hall().legs[t.hall().cur];
  t.aimSet(20); await window.__step(3);
  const low = t.nextRings();
  t.game.spawnQueue.push({ type: 'gunner' });
  t.aimSet(50); await window.__step(3);
  const on = t.nextRings();
  t.game.spawnQueue.length = 0; await window.__step(3);
  const empty = t.nextRings();
  t.aimSet(0); t.setSight(null);
  return { approach: !!(L && L.approach && L.approach.length), low, on, empty };
});
console.log('rings:     ' + JSON.stringify(rings));
if (!rings.approach) bad('this leg has no door approach to mark');
if (rings.low) bad('the rings show below sight 50');
if (!rings.on) bad('no rings at sight 50 with a wave to come');
if (rings.empty) bad('the rings stayed with nothing left to come');

// ---- the elevator into floor 2 ---------------------------------------------
let rode = false;
for (let i = 0; i < 8 && !rode && (await page.evaluate(() => window.__ts.hall().doorsPassed + 1)) < 11; i++) {
  rode = await page.evaluate(async () => {
    const t = window.__ts;
    window.__clear();
    t.crossDoor();
    const el = document.getElementById('elevator');
    let on = false;
    for (let j = 0; j < 10 && !on; j++) { on = el.classList.contains('on') && /FLOOR 2/.test(el.textContent); await window.__step(); }
    return on;
  });
}
const door = await page.evaluate(() => window.__ts.hall().doorsPassed + 1);
console.log('elevator:  ' + JSON.stringify({ rode, door }));
if (!rode) bad('no elevator into floor 2');
if (rode) {
  await page.waitForTimeout(2000);
  if (await page.evaluate(() => document.getElementById('elevator').classList.contains('on'))) bad('the elevator never lifted');
}

done('leftovers', errs);
await browser.close();
