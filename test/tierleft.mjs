import { boot, done } from './lib.mjs';
// THE TIER LEFTOVERS (docs/ARSENAL.md §4).
//   AP rifle: the armored man drops it; its body hits crack his plate, where
//     the burst rifle's spark off; the HUD calls it ARMOR PIERCING RIFLE, and
//     picking one up says so. Each drop is ONE
//     round: two drops picked up, two rounds.
//   Launcher III lobs two shells a pull; rocket II is guided.
//   Bomber III lobs two grenades; rocketeer III fires a pair; the laser's
//   charge is 2.0 s at Mk II and 1.6 s at III; the spawner's hang is 1.5 s at
//   Mk II and 1.2 s at III (its reach 12 m).
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '11');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser', 'blinker', 'frankenstein', 'kamikaze', 'drone', 'spawner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const t = window.__ts;
  window.__step = async (n = 1) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
  window.__clear = () => { for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0; t.game.spawnQueue.length = 0;
    for (let i = t.pickups.length - 1; i >= 0; i--) t.pickups.length = i; };
  window.__put = async (type, d, side = 0, mk = null) => {
    const yaw = t.player.yaw;
    t.forceMk(mk);
    t.spawnEnemy(type, { x: t.player.pos.x - Math.sin(yaw) * d + Math.cos(yaw) * side, z: t.player.pos.z - Math.cos(yaw) * d - Math.sin(yaw) * side });
    t.forceMk(null);
    const e = t.enemies[t.enemies.length - 1];
    for (let f = 0; f < 400 && e.state === 'assemble'; f++) await window.__step();
    e.speed = 0; e.fireCd = 1e9;
    return e;
  };
  window.__shoot = async (x, y, z) => {
    t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
    t.fireAt(x, y, z);
    for (let f = 0; f < 300 && (t.bullets.some((b) => b.fromPlayer) || t.counts().shells); f++) {
      for (const e of t.enemies) e.fireCd = 1e9;
      await window.__step();
    }
  };
});

// ---- the AP rifle against plate, and the burst rifle for comparison --------
const plate = await page.evaluate(async () => {
  const t = window.__ts, out = {};
  for (const w of ['burst', 'ap']) {
    window.__clear();
    t.setWeapon(w, 3, 1);
    const e = await window.__put('armored', 9, 0, 1);
    await window.__shoot(e.pos.x, 1.0, e.pos.z);   // chest height: a body hit
    out[w] = !t.enemies.includes(e);
  }
  out.hud = document.getElementById('ammo').textContent;
  return out;
});
console.log('plate:     ' + JSON.stringify(plate));
if (plate.burst) bad('a burst-rifle body hit killed an armored man');
if (!plate.ap) bad('an AP body hit did not crack the armored man');
if (!/ARMOR PIERCING RIFLE/.test(plate.hud)) bad('the HUD does not say ARMOR PIERCING RIFLE: ' + plate.hud);

// ---- the armored man drops it ---------------------------------------------
const drop = await page.evaluate(async () => {
  const t = window.__ts;
  const seen = new Set();
  for (let n = 0; n < 16 && !seen.has('ap'); n++) {
    window.__clear();
    const e = await window.__put('armored', 8, 0, 1);
    t.killAt(t.enemies.indexOf(e));
    await window.__step(3);
    for (const p of t.pickups) seen.add(p.type);
  }
  return [...seen];
});
console.log('drops:     ' + JSON.stringify(drop));
if (!drop.includes('ap')) bad('sixteen armored men and not one AP rifle');
if (drop.includes('burst')) bad('the armored man still drops the burst rifle');

// ---- one round a drop ------------------------------------------------------
const rounds = await page.evaluate(async () => {
  const t = window.__ts;
  const step = () => new Promise((r) => requestAnimationFrame(r));
  window.__clear();
  t.player.bag.length = 0;
  for (const k of Object.keys(t.player.reserve)) delete t.player.reserve[k];   // the plate test's clips
  t.player.bag.push({ type: 'pistol', mag: 5, mk: 1 });
  t.setWeapon('pistol');
  const take = async () => {
    const at = { x: t.player.pos.x, z: t.player.pos.z + 0.2 };
    t.spawnPickup(at, 'ap');
    for (let i = 0; i < 30; i++) { await step(); t.player.iframes = 999; t.player.pos.x = at.x; t.player.pos.z = at.z; }
  };
  const count = () => { const b = t.slots().find((x) => x.type === 'ap'); return b ? b.mag + b.clips : 0; };
  await take(); const one = count();
  const banner = t.banners().includes('ARMOR PIERCING RIFLE');
  await take(); const two = count();
  t.setWeapon('ap', 1, 1);
  return { one, two, mag: t.wspec().mag, banner };
});
console.log('ap rounds: ' + JSON.stringify(rounds));
if (!rounds.banner) bad('picking up the rifle did not say ARMOR PIERCING RIFLE');
await page.screenshot({ path: 'test/out/ap-hud.png' });
if (rounds.one !== 1) bad('one AP drop gave ' + rounds.one + ' rounds, not 1');
if (rounds.two !== 2) bad('two AP drops gave ' + rounds.two + ' rounds, not 2');

// ---- launcher III: two shells a pull; rocket II: guided --------------------
const guns = await page.evaluate(async () => {
  const t = window.__ts, out = {};
  window.__clear();
  t.setWeapon('launcher', 3, 3);
  t.player.fireCd = 0; t.player.mag = 3; t.player.reloadT = 0; t.player.swapT = 0;
  const yaw = t.player.yaw;
  t.fireAt(t.player.pos.x - Math.sin(yaw) * 10, 1.0, t.player.pos.z - Math.cos(yaw) * 10);
  out.lobs = t.counts().shells;
  for (let f = 0; f < 300 && t.counts().shells; f++) await window.__step();
  // a man 14 m out and 2 m to the side; the rocket leaves dead ahead. How
  // far off its line does it get? (Not "did he die": the rocket's 8 m blast
  // would take him from the floor beside him either way.)
  for (const mk of [1, 2]) {
    window.__clear();
    t.setWeapon('rocket', 3, mk);
    const e = await window.__put('gunner', 14, 2, 1);
    t.player.fireCd = 0; t.player.mag = 3; t.player.reloadT = 0; t.player.swapT = 0;
    const px = t.player.pos.x, pz = t.player.pos.z, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    t.fireAt(px + fx * 20, 1.4, pz + fz * 20);
    let off = 0;
    for (let f = 0; f < 400 && t.counts().shells; f++) {
      e.fireCd = 1e9;
      const a = t.shellAt();
      if (a) off = Math.max(off, Math.abs((a.x - px) * fz - (a.z - pz) * fx));
      await window.__step();
    }
    out['bend' + mk] = +off.toFixed(2);
  }
  return out;
});
console.log('guns:      ' + JSON.stringify(guns));
if (guns.lobs !== 2) bad('launcher III put ' + guns.lobs + ' shells in the air, not 2');
if (guns.bend1 > 0.5) bad('the rocket I bent ' + guns.bend1 + ' m: it should fly straight');
if (guns.bend2 < 1.0) bad('the rocket II bent only ' + guns.bend2 + ' m toward a man off its line');

// ---- the enemies' Mk III: two grenades, a pair of rockets ------------------
const theirs = await page.evaluate(async () => {
  const t = window.__ts, out = {};
  for (const [type, key] of [['bomber', 'grenades'], ['rocketeer', 'missiles']]) {
    window.__clear();
    const e = await window.__put(type, 10, 0, 3);
    const n0 = t.counts()[key];
    e.fireCd = 0; e.state = 'aim'; e.stateT = 99;
    let n = 0;
    for (let f = 0; f < 600 && n === 0; f++) { await window.__step(); n = t.counts()[key] - n0; if (n) break; }
    await window.__step();
    out[type] = t.counts()[key] - n0;
    e.fireCd = 1e9;
  }
  // the laser's charge and the spawner's hang, off the spec at each Mk
  for (const [type, key] of [['laser', 'aimTime'], ['spawner', 'hang']]) {
    out[type] = [];
    for (const mk of [2, 3]) {
      window.__clear();
      const e = await window.__put(type, 14, 0, mk);
      out[type].push((e.spec || {})[key]);
    }
  }
  window.__clear();
  return out;
});
console.log('theirs:    ' + JSON.stringify(theirs));
if (theirs.bomber !== 2) bad('bomber III lobbed ' + theirs.bomber + ' grenades, not 2');
if (theirs.rocketeer !== 2) bad('rocketeer III fired ' + theirs.rocketeer + ' rockets, not 2');
if (theirs.laser.join() !== '2,1.6') bad('laser charge by Mk is ' + theirs.laser.join());
if (theirs.spawner.join() !== '1.5,1.2') bad('spawner hang by Mk is ' + theirs.spawner.join());

done('tierleft', errs);
await browser.close();
