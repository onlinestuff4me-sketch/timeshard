import { boot, done } from './lib.mjs';
// THE WEAPON SWITCHER (docs/ARSENAL.md §13).
//
// You keep the guns you find and swipe the weapon name to change. Three slots:
// the pistol, which never leaves, and the two most recent finds. Each gun keeps
// its own rounds. An empty gun leaves the rotation; with nothing left, the knife.
// And the name is a swipe zone that must never turn the camera or fire.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(1500);

// Walk over `type`: drop it at the player's feet and stand on it.
const walkOver = (type) => page.evaluate(async (type) => {
  const t = window.__ts;
  const at = { x: t.player.pos.x, z: t.player.pos.z + 0.2 };
  t.spawnPickup(at, type);
  const n0 = t.pickups.length;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = at.x; t.player.pos.z = at.z;
  }
  const took = t.pickups.length < n0;
  for (let i = t.pickups.length - 1; i >= 0; i--) t.pickups.length = i;
  return { took, hand: t.player.weapon, bag: t.slots() };
}, type);
const state = () => page.evaluate(() => ({ hand: window.__ts.player.weapon, bag: window.__ts.slots() }));
const wait = (ms) => page.waitForTimeout(ms);

const on = await page.evaluate(() => window.__ts.switcherOn());
if (!on) bad('the switcher is off in the tunnel');
await page.evaluate(() => window.__ts.bagReset());

// ---- a new gun goes into the bag and into your hand ----------------------
let s = await walkOver('shotgun');
console.log('pistol, over a shotgun:   ' + JSON.stringify(s));
if (!s.took || s.hand !== 'shotgun') bad('the shotgun was not taken into the hand');
if (s.bag.map((b) => b.type).join() !== 'shotgun,pistol') bad('bag order is not most-recent-first: ' + s.bag.map((b) => b.type));

// ---- a clip is pistol ammo, and no longer a downgrade or a refusal -------
const clipsBefore = s.bag.find((b) => b.type === 'pistol').clips;
s = await walkOver('clip');
console.log('shotgun, over a clip:     ' + JSON.stringify(s));
if (!s.took) bad('the clip was left on the floor — with a bag it is pistol ammo');
if (s.hand !== 'shotgun') bad('the clip took the shotgun out of the hand');
if (s.bag.find((b) => b.type === 'pistol').clips <= clipsBefore) bad('the clip did not reach the pistol');

// ---- the third slot, then the cap: the oldest find goes, never the pistol
s = await walkOver('burst');
if (s.bag.map((b) => b.type).join() !== 'burst,shotgun,pistol') bad('three slots: ' + s.bag.map((b) => b.type));
s = await walkOver('sniper');
console.log('over the cap:             ' + s.bag.map((b) => b.type).join(' > '));
if (s.bag.length !== 3) bad('the bag is over its three slots: ' + s.bag.length);
if (s.bag.some((b) => b.type === 'shotgun')) bad('the oldest find (the shotgun) was kept');
if (!s.bag.some((b) => b.type === 'pistol')) bad('the pistol was pushed out');

// ---- swaps: each gun keeps its own rounds --------------------------------
await page.evaluate(() => { const p = window.__ts.player; p.mag = 1; });   // the rifle, nearly spent
await wait(300);
await page.evaluate(() => window.__ts.swapWeapon(1));
s = await state();
console.log('swap left:                ' + s.hand);
if (s.hand !== 'burst') bad('swap left did not go to the next gun along: ' + s.hand);
await wait(350);
await page.evaluate(() => window.__ts.swapWeapon(-1));
s = await state();
const rifle = await page.evaluate(() => window.__ts.player.mag);
if (s.hand !== 'sniper') bad('swap right did not come back: ' + s.hand);
if (rifle !== 1) bad('the rifle came back with ' + rifle + ' rounds, not the 1 it left with');

// ---- a swap takes a beat: no trigger for SWITCHER.swapT ------------------
const gated = await page.evaluate(async () => {
  const t = window.__ts;
  t.swapWeapon(1);
  const mag0 = t.player.mag;
  t.player.fireCd = 0;
  t.playerFire();
  return { mag0, mag1: t.player.mag, swapT: t.player.swapT };
});
console.log('fire mid-swap:            ' + JSON.stringify(gated));
if (gated.mag1 !== gated.mag0) bad('a round was fired during the swap');

// ---- an empty gun leaves the rotation, and the hand moves on -------------
await wait(400);
const dry = await page.evaluate(async () => {
  const t = window.__ts;
  const was = t.player.weapon;
  t.player.mag = 0; t.player.clips = 0; t.player.fireCd = 0;
  t.playerFire();
  return { was, hand: t.player.weapon, bag: t.slots().map((b) => b.type) };
});
console.log('run dry:                  ' + JSON.stringify(dry));
if (dry.hand === dry.was) bad('the hand stayed on an empty gun');
if (dry.was !== 'pistol' && dry.bag.includes(dry.was)) bad('the empty ' + dry.was + ' is still in the bag');

// ---- main's rule inside the switcher: a lesser gun goes in the bag, not the hand
await page.evaluate(() => window.__ts.bagReset());
await walkOver('burst');
s = await walkOver('shotgun');
console.log('burst, over a shotgun:    ' + JSON.stringify(s));
if (!s.took) bad('the lesser gun was left on the floor');
if (s.hand !== 'burst') bad('a lesser gun took the better one out of the hand: ' + s.hand);
if (!s.bag.some((b) => b.type === 'shotgun')) bad('the lesser gun did not go into the bag');
if (s.bag[0].type !== 'burst') bad('the gun in the hand is not first in the bag: ' + s.bag.map((b) => b.type));

// ---- THE SWIPE ZONE: a real drag on the name swaps, and turns nothing ------
await wait(400);
const zone = await page.evaluate(() => {
  const z = document.querySelector('#ammo .swapzone');
  if (!z) return null;
  const r = z.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
});
if (!zone) bad('there is no swap zone on the weapon name');
else {
  const before = await page.evaluate(() => ({ hand: window.__ts.player.weapon, yaw: window.__ts.player.yaw,
    pitch: window.__ts.player.pitch, shots: window.__ts.player.mag }));
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 7 }] });
  await touch('touchStart', zone.x, zone.y);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', zone.x - i * 8, zone.y); await wait(16); }
  await touch('touchEnd', zone.x - 64, zone.y);
  await wait(200);
  const after = await page.evaluate(() => ({ hand: window.__ts.player.weapon, yaw: window.__ts.player.yaw,
    pitch: window.__ts.player.pitch, shots: window.__ts.player.mag }));
  console.log('swipe on the name:        ' + before.hand + ' -> ' + after.hand
    + `  yaw ${before.yaw.toFixed(4)} -> ${after.yaw.toFixed(4)}`);
  if (after.hand === before.hand) bad('a swipe on the weapon name did not swap');
  if (Math.abs(after.yaw - before.yaw) > 1e-6 || Math.abs(after.pitch - before.pitch) > 1e-6) {
    bad('a swipe on the weapon name turned the camera');
  }
}
const pills = await page.evaluate(() => [...document.querySelectorAll('#ammo .pill')].map((p) => p.className));
console.log('pills:                    ' + pills.join(' | '));
if (pills.length !== 3) bad('there should be three slot pills, not ' + pills.length);
if (pills.filter((c) => c.includes('on')).length !== 1) bad('exactly one pill should mark the gun in hand');

done('switcher', errs);
await browser.close();
