import { boot, done } from './lib.mjs';
// WHAT YOU ARE CARRYING ONLY EVER GETS BETTER BY WALKING — and nothing you
// walk over is ever wasted.
//
// There is no pick-up button: you walk over a thing to take it. That used to
// be a problem the moment the thing on the floor was WORSE than what you had,
// because `clips` was one number belonging to whatever gun was in your hands.
// Crossing a room for the shotgun and then walking over the clip the last
// gunner dropped quietly took the shotgun away, so drops that ranked below
// your weapon had to be DECLINED and left lying there — a rule that said "you
// cannot pick that up" in a game about picking things up.
//
// Playtest: "the most powerful weapon you pick up stays equipped, and the ammo
// for other weapons stays with you for when you run out of the ammo of the
// more powerful weapon." So the reserve is a shelf per weapon and this file
// holds the three promises in that sentence:
//
//   1. the best gun you have found is the one in your hands
//   2. everything you walk over goes in the bag, whatever you are holding
//   3. running one dry reaches for the next thing in the bag, not the blade
//
// In the TUNNEL, not NO RETREAT: the duel reloads off a belt (see startReload
// for why a knife is a dead end in a strip you cannot cross), so it is the one
// mode where the reserve is deliberately not a resource, and measuring the
// reserve there would measure the exception.
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
await page.waitForTimeout(2400);

// Drop `type` at the player's feet, stand on it for a moment, and report what
// happened — to the loadout, to the bag, and to the thing on the floor.
const walkOver = (hold, type, bag) => page.evaluate(async ([hold, type, bag]) => {
  const t = window.__ts;
  t.player.reserve = { ...(bag || {}) };
  t.setWeapon(hold, t.player.reserve[hold] === undefined ? 1 : t.player.reserve[hold]);
  const before = t.bag();
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
  return { before, after: t.bag(), took };
}, [hold, type, bag]);

// ---- 1. THE BEST GUN YOU HAVE FOUND IS THE ONE IN YOUR HANDS -------------
const up = await walkOver('pistol', 'shotgun');
console.log('pistol, over a shotgun:   ' + JSON.stringify(up.after) + '  took=' + up.took);
if (up.after.weapon !== 'shotgun') bad('the shotgun was refused: still ' + up.after.weapon);
if (!up.took) bad('the shotgun was left on the floor');

const down = await walkOver('shotgun', 'pistol', { shotgun: 2 });
console.log('shotgun, over a pistol:   ' + JSON.stringify(down.after) + '  took=' + down.took);
if (down.after.weapon !== 'shotgun') bad('a pistol downgraded the shotgun');

const clipHeld = await walkOver('shotgun', 'clip', { shotgun: 2 });
console.log('shotgun, over a clip:     ' + JSON.stringify(clipHeld.after) + '  took=' + clipHeld.took);
if (clipHeld.after.weapon !== 'shotgun') {
  bad('a pistol clip took the shotgun away: now holding ' + clipHeld.after.weapon);
}
if (clipHeld.after.reserve.shotgun !== clipHeld.before.reserve.shotgun) {
  bad('a pistol clip changed the shotgun shelf');
}

// ---- 2. EVERYTHING GOES IN THE BAG --------------------------------------
// This is the reversal. These two used to be left on the floor on purpose,
// because taking them would have thrown the better gun away. Nothing is
// thrown away now, so leaving them would just be litter the player cannot use.
if (!down.took) bad('the pistol was left on the floor rather than banked');
if (!clipHeld.took) bad('the clip was left on the floor rather than banked');
if (!(down.after.reserve.pistol > (down.before.reserve.pistol || 0))) {
  bad('walking over a pistol added nothing to the pistol shelf: '
    + JSON.stringify(down.after.reserve));
}
if (!(clipHeld.after.reserve.pistol > (clipHeld.before.reserve.pistol || 0))) {
  bad('walking over a clip added nothing to the pistol shelf: '
    + JSON.stringify(clipHeld.after.reserve));
}

const clipOnKnife = await walkOver('knife', 'clip', {});
console.log('knife, over a clip:       ' + JSON.stringify(clipOnKnife.after) + '  took=' + clipOnKnife.took);
if (clipOnKnife.after.weapon !== 'pistol') bad('a clip did not arm a player holding only a knife');
if (!clipOnKnife.took) bad('the clip was left on the floor');

const more = await walkOver('shotgun', 'shotgun', { shotgun: 1 });
console.log('shotgun, over a shotgun:  ' + JSON.stringify(more.after) + '  took=' + more.took);
if (more.after.weapon !== 'shotgun') bad('picking up the same weapon changed it');
if (more.after.reserve.shotgun <= more.before.reserve.shotgun) {
  bad('the same weapon gave no ammo: ' + more.before.reserve.shotgun
    + ' -> ' + more.after.reserve.shotgun);
}

// ---- 3. RUNNING DRY REACHES FOR THE BAG, NOT THE BLADE -------------------
// Emptied by FIRING, not by calling the fallback: the shot that empties the
// magazine is one of the two doors into it, and the other is the reload that
// finds no clip. A probe that calls the function tests the function.
const dry = await page.evaluate(async () => {
  const t = window.__ts;
  t.player.reserve = { pistol: 2 };
  t.setWeapon('shotgun', 0);        // a shotgun with nothing behind it
  const before = t.bag();
  const shots = [];
  for (let i = 0; i < 400 && t.player.weapon === 'shotgun'; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.fireCd = 0;
    t.fireAt ? t.fireAt(t.player.pos.x, 1.4, t.player.pos.z - 30) : t.playerFire();
    shots.push(t.player.mag);
  }
  // let the rack it started finish
  const g = performance.now();
  while (performance.now() - g < 3000 && t.player.mag <= 0) {
    await new Promise((r) => requestAnimationFrame(r));
  }
  return { before, after: t.bag(), fired: shots.length };
});
console.log('shotgun dry, 2 pistol clips in the bag: ' + JSON.stringify(dry.after));
if (dry.after.weapon === 'knife') {
  bad('the blade, with two pistol clips in the bag');
}
if (dry.after.weapon !== 'pistol') {
  bad('running the shotgun dry did not reach for the pistol: ' + dry.after.weapon);
}
if (dry.after.mag <= 0 && dry.after.reloading <= 0) {
  bad('it came up empty and is not racking: ' + JSON.stringify(dry.after));
}

// ---- ...AND THE BLADE IS STILL THERE WHEN THE BAG IS EMPTY --------------
const empty = await page.evaluate(async () => {
  const t = window.__ts;
  t.player.reserve = {};
  t.setWeapon('shotgun', 0);
  for (let i = 0; i < 400 && t.player.weapon === 'shotgun'; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.fireCd = 0;
    t.fireAt ? t.fireAt(t.player.pos.x, 1.4, t.player.pos.z - 30) : t.playerFire();
  }
  return t.bag();
});
console.log('shotgun dry, nothing in the bag:        ' + JSON.stringify(empty));
if (empty.weapon !== 'knife') bad('an empty bag did not end at the knife: ' + empty.weapon);

done('loadout', errs);
await browser.close();
