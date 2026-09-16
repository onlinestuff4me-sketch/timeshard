import { boot, done } from './lib.mjs';
// WHAT YOU ARE CARRYING ONLY EVER GETS BETTER BY WALKING.
//
// There is no pick-up button: you walk over a thing to take it. That is fine
// until the thing on the floor is WORSE than what you have — and `setWeapon`
// on a pistol clip is a SWAP when you are not already holding the pistol, so
// crossing a room for the shotgun and then walking over the clip the last
// gunner dropped quietly took the shotgun away again.
//
// The order weapons are introduced is the order they rank, read off the
// WEAPONS registry rather than typed beside it.
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
await page.tap('#startnew'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(1200);

// Drop `type` at the player's feet, stand on it for a moment, and report what
// happened — to the loadout, and to the thing on the floor.
const walkOver = (hold, type) => page.evaluate(async ([hold, type]) => {
  const t = window.__ts;
  t.setWeapon(hold, 1);
  const before = { weapon: t.player.weapon, clips: t.player.clips };
  const at = { x: t.player.pos.x, z: t.player.pos.z + 0.2 };
  t.spawnPickup(at, type);
  const n0 = t.pickups.length;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = at.x; t.player.pos.z = at.z;
  }
  const took = t.pickups.length < n0;
  // ...and clear whatever is left, so one case cannot seed the next
  for (let i = t.pickups.length - 1; i >= 0; i--) t.pickups.length = i;
  return { before, weapon: t.player.weapon, clips: t.player.clips, took };
}, [hold, type]);

// ---- the case that was reported -----------------------------------------
const clipOnShotgun = await walkOver('shotgun', 'clip');
console.log('shotgun, over a clip:    ' + JSON.stringify(clipOnShotgun));
if (clipOnShotgun.weapon !== 'shotgun') {
  bad('a pistol clip took the shotgun away: now holding ' + clipOnShotgun.weapon);
}
if (clipOnShotgun.took) bad('the clip was consumed — it should still be on the floor');

// ---- ...and the same thing one rung further apart ------------------------
const pistolOnShotgun = await walkOver('shotgun', 'pistol');
console.log('shotgun, over a pistol:  ' + JSON.stringify(pistolOnShotgun));
if (pistolOnShotgun.weapon !== 'shotgun') bad('a pistol downgraded the shotgun');
if (pistolOnShotgun.took) bad('the pistol was consumed rather than left');

// ---- AN UPGRADE IS STILL AN UPGRADE --------------------------------------
// The rule is "never worse", not "never change": the whole point of a drop is
// that crossing the room for it is worth doing.
const shotgunOnPistol = await walkOver('pistol', 'shotgun');
console.log('pistol, over a shotgun:  ' + JSON.stringify(shotgunOnPistol));
if (shotgunOnPistol.weapon !== 'shotgun') bad('the shotgun was refused: still ' + shotgunOnPistol.weapon);
if (!shotgunOnPistol.took) bad('the shotgun was left on the floor');

const clipOnKnife = await walkOver('knife', 'clip');
console.log('knife, over a clip:      ' + JSON.stringify(clipOnKnife));
if (clipOnKnife.weapon !== 'pistol') bad('a clip did not arm a player holding only a knife');
if (!clipOnKnife.took) bad('the clip was left on the floor');

// ---- THE SAME WEAPON IS AMMO, NOT A DOWNGRADE ---------------------------
const more = await walkOver('shotgun', 'shotgun');
console.log('shotgun, over a shotgun: ' + JSON.stringify(more));
if (more.weapon !== 'shotgun') bad('picking up the same weapon changed it');
if (more.clips <= more.before.clips) {
  bad('the same weapon gave no ammo: ' + more.before.clips + ' -> ' + more.clips);
}
if (!more.took) bad('the spare was left on the floor');

done('loadout', errs);
await browser.close();
