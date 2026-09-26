import { boot, done } from './lib.mjs';
// THE TIER LADDER (docs/ARSENAL.md §4; TIER_AT, ENEMY_MK, WEAPON_MK).
//
// A run on door 21 meets the gunner's Mk II: he fires in pairs, the first of
// his Mk always drops his weapon, and it is a Mk II pistol — pierce, and a
// chance to break their rounds in the air. Walking over it upgrades the pistol
// you carry where it sits. The door a tier arrives carries a line for it under
// the door number. A staggering weapon's kill knocks a neighbour off his aim.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '21');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'blinker', 'frankenstein', 'kamikaze', 'armored', 'rocketeer', 'drone', 'spawner', 'laser']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.evaluate(() => {
  const t = window.__ts;
  window.__step = async (n = 1) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
  window.__clear = () => { for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0; t.game.spawnQueue.length = 0; };
  window.__put = async (type, d, side = 0) => {
    const yaw = t.player.yaw;
    t.spawnEnemy(type, { x: t.player.pos.x - Math.sin(yaw) * d + Math.cos(yaw) * side, z: t.player.pos.z - Math.cos(yaw) * d - Math.sin(yaw) * side });
    const e = t.enemies[t.enemies.length - 1];
    const t0 = performance.now();
    while (e.state === 'assemble' && performance.now() - t0 < 6000) await window.__step();
    e.speed = 0; e.fireCd = 1e9;
    return e;
  };
  window.__fireAt = async (x, y, z) => {
    t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
    t.fireAt(x, y, z);
    const t0 = performance.now();
    while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t0 < 6000) {
      for (const e of t.enemies) if (e.state !== 'aim') e.fireCd = 1e9;
      await window.__step();
    }
  };
});

// ---- door 21: gunner Mk II fires pairs --------------------------------------
const g = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  const e = await window.__put('gunner', 9);
  const n0 = t.bullets.filter((b) => !b.fromPlayer).length;
  e.fireCd = 0;
  const t0 = performance.now();
  let n = 0;
  while (performance.now() - t0 < 5000) {
    await window.__step();
    n = t.bullets.filter((b) => !b.fromPlayer).length - n0;
    if (n > 0) { await window.__step(); n = t.bullets.filter((b) => !b.fromPlayer).length - n0; break; }
  }
  e.fireCd = 1e9;
  window.__g = e;
  return { mk: e.mk, pairs: !!e.spec.pairs, rounds: n, line: t.tierLine(21) };
});
console.log('gunner Mk II:  ' + JSON.stringify(g));
if (g.mk !== 2) bad('a gunner on door 21 is not Mk II');
if (g.rounds !== 2) bad('Mk II should fire a pair, fired ' + g.rounds);
if (!/GUNNER MK II/.test(g.line) || !/FIRES IN PAIRS/.test(g.line)) bad('no tier line for door 21: ' + g.line);

// ---- his first kill drops a Mk II pistol; walking over it upgrades yours ---
const up = await page.evaluate(async () => {
  const t = window.__ts, e = window.__g;
  await window.__fireAt(e.pos.x, 1.2, e.pos.z);
  await window.__step(5);
  const p = t.pickups.find((x) => x.type === 'pistol');
  const drop = p ? { mk: p.mk } : null;
  if (p) {
    for (let i = 0; i < 60 && t.pickups.includes(p); i++) { t.player.pos.set(p.g.position.x, 0, p.g.position.z); await window.__step(); }
  }
  await window.__step(5);
  return { drop, hand: t.player.weapon, spec: t.wspec(), hud: document.getElementById('ammo').textContent };
});
console.log('the drop:      ' + JSON.stringify({ drop: up.drop, hand: up.hand, mk: up.spec.mk, pierce: up.spec.pierce, shatter: up.spec.shatter, hud: up.hud.slice(0, 20) }));
if (!up.drop || up.drop.mk !== 2) bad('the first Mk II gunner did not drop a Mk II pistol');
if (up.spec.mk !== 2 || up.spec.pierce !== 2 || up.spec.shatter !== 0.5) bad('the pistol was not upgraded to Mk II');
if (!/PISTOL II/.test(up.hud)) bad('the HUD does not say PISTOL II: ' + up.hud);

// ---- shatter: a Mk II round breaks theirs in the air, about half the time --
const sh = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  let broke = 0, tries = 0;
  for (let k = 0; k < 12; k++) {
    // one of theirs, 6 m ahead, flying at the player; ours fired straight down its line
    const yaw = t.player.yaw;
    const f = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const theirs = t.enemyRound(t.player.pos.x + f.x * 12, t.player.pos.z + f.z * 12);
    await window.__step(2);
    tries++;
    t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
    t.fireAt(theirs.pos.x, theirs.pos.y, theirs.pos.z);
    const t1 = performance.now();
    while (t.bullets.some((b) => b.fromPlayer) && t.bullets.includes(theirs) && performance.now() - t1 < 4000) await window.__step();
    if (!t.bullets.includes(theirs)) broke++;
    await window.__step(30);
    window.__clear();
    for (let i = t.bullets.length - 1; i >= 0; i--) if (!t.bullets[i].fromPlayer) t.bullets.splice(i, 1);
  }
  return { broke, tries };
});
console.log('shatter:       ' + JSON.stringify(sh));
if (sh.tries < 6) bad('too few rounds to measure shatter: ' + sh.tries);
else if (sh.broke < 1 || sh.broke === sh.tries) bad('shatter should break some rounds and not all: ' + sh.broke + '/' + sh.tries);

// ---- stagger: a Mk II shotgun kill knocks the man beside it off his aim ----
const st = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  t.setWeapon('shotgun', 3, 2);
  const target = await window.__put('gunner', 8);
  const other = await window.__put('gunner', 8, 2.2);
  other.state = 'aim'; other.stateT = 0; other.fireCd = 0; other.holdFireT = 0;
  await window.__fireAt(target.pos.x, 1.2, target.pos.z);
  return { mk: t.wspec().mk, stagger: !!t.wspec().stagger, targetDown: !t.enemies.includes(target),
    weapon: t.player.weapon, mag: t.player.mag, swapT: t.player.swapT, reloadT: t.player.reloadT,
    otherState: other.state, otherAlive: t.enemies.includes(other) };
});
console.log('stagger:       ' + JSON.stringify(st));
if (!st.stagger) bad('the Mk II shotgun does not stagger');
if (!st.targetDown) bad('the shell did not kill its target');
if (st.otherAlive && st.otherState === 'aim') bad('the man beside the kill kept his aim');

done('tiers', errs);
await browser.close();
