import { boot, done } from './lib.mjs';
// THE PROGRESS PANEL, THE PARRY, AND THE SWITCHER BETWEEN ITS BUTTONS
// (owner's call 2026-09-30: the bottom was cramped, the switcher off centre and
// not plainly pressable, and progress had nowhere of its own to live).
//  - top left, clear of the bottom: TEMPO, STREAK and PARRY rows;
//  - STREAK is the no-misses count, and its level multiplies what a kill pours
//    into the slow-time bank;
//  - a round that passes within PARRY.near of you, then its shooter shattered
//    inside PARRY.window: PERFECT, PARRY.refill seconds back, and at each of
//    PARRY.levels a bigger bank; late, or wide, is not a parry;
//  - a level's banner fits the screen, and flies into its row when it goes;
//  - the gun's name sits dead centre between two round buttons.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '12');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'blinker',
    'sniper', 'bomber', 'frankenstein', 'gunner', 'kamikaze', 'armored', 'drone', 'rocketeer', 'laser', 'spawner']));
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
  // a still man in front of you, who will not shoot on his own
  window.__man = (d = 9) => {
    const yaw = t.player.yaw;
    t.spawnEnemy('gunner', { x: t.player.pos.x - Math.sin(yaw) * d, z: t.player.pos.z - Math.cos(yaw) * d });
    const e = t.enemies[t.enemies.length - 1];
    e.speed = 0; e.fireCd = 1e9;
    return e;
  };
  window.__waitMessages = async () => { for (let f = 0; f < 900 && t.pendingBanners && t.pendingBanners() > 0; f++) await window.__step(); };
});

// ---- the panel: three rows, top left, clear of the bottom -------------------
const panel = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  await window.__step(3);
  const r = document.getElementById('prog').getBoundingClientRect();
  const a = document.getElementById('ammo').getBoundingClientRect();
  return { rows: Object.fromEntries(Object.entries(t.prog()).map(([k, v]) => [k, v.shown])),
    box: { l: r.left, t: r.top, b: r.bottom, w: r.width }, vh: innerHeight, ammoTop: a.top };
});
console.log('panel:     ' + JSON.stringify(panel));
for (const k of ['tempo', 'streak', 'parry']) if (!panel.rows[k]) bad(`no ${k} row on door 12`);
if (panel.box.l > 30 || panel.box.t > panel.vh * 0.2) bad('the panel is not top left: ' + JSON.stringify(panel.box));
if (panel.box.b > panel.ammoTop) bad('the panel runs into the bottom readout');

// ---- the streak buys slow time ------------------------------------------------
const streak = await page.evaluate(async () => {
  const t = window.__ts;
  const gain = async (n) => {
    window.__clear(); t.aimSet(n);
    window.__man(); window.__man(12);   // a second man, so the kill is not the room's last
    t.setSlow(0);
    t.killAt(0);
    const g = t.slow().bank;
    return { g, mul: t.parry().mul };
  };
  const lo = await gain(0), hi = await gain(30);
  // reaching a level is a banner, once
  window.__clear(); t.aimSet(9); const n0 = t.banners().length;
  t.aimHit(); t.aimMiss(); t.aimSet(9); t.aimHit();
  const told = t.banners().slice(n0);
  window.__clear(); t.aimSet(0);
  return { lo, hi, told };
});
console.log('streak:    ' + JSON.stringify(streak));
if (!(streak.lo.g > 0) || Math.abs(streak.hi.g / streak.lo.g - 1.5) > 0.02) bad('streak level 2 should pour 1.5x the slow time of level 0: ' + JSON.stringify(streak));
if (streak.told.length !== 1 || !/STREAK LEVEL 1/.test(streak.told[0])) bad('reaching 10 should say STREAK LEVEL 1 once: ' + JSON.stringify(streak.told));

// ---- the parry ----------------------------------------------------------------
// a round from him, `off` metres wide of you; then shatter him `late` world
// seconds after it went by
const parryTry = (off, late = 0.2) => page.evaluate(async ([off, late]) => {
  const t = window.__ts;
  window.__clear();
  const e = window.__man(8); window.__man(14);
  const n0 = t.parry().n;
  t.setSlow(0);
  const b = t.enemyRound(e.pos.x, e.pos.z, e, off);
  for (let f = 0; f < 240 && t.bullets.includes(b); f++) await window.__step();
  const at = t.worldT();
  for (let f = 0; f < 600 && t.worldT() - at < late; f++) await window.__step();
  const ix = t.enemies.indexOf(e);
  const bank0 = t.slow().bank;
  t.killAt(ix);
  const flash = document.getElementById('flash').innerHTML.length > 0;
  return { grazed: !!b.grazed, parried: t.parry().n - n0, bank: +(t.slow().bank - bank0).toFixed(2), flash, parry: t.parry() };
}, [off, late]);
const close = await parryTry(0.6);
const wide = await parryTry(1.6);
const late = await parryTry(0.6, 2.6);
console.log('parry:     ' + JSON.stringify({ close, wide, late }));
if (!close.grazed || close.parried !== 1) bad('a round 0.6 m wide, then its shooter shattered, is not a parry');
if (close.parried && close.bank < 1.5) bad('a parry did not pour 1.5 s into the bank: ' + close.bank);
if (wide.parried) bad('a round 1.6 m wide counted as a parry');
if (late.parried) bad('a parry landed 2.6 s after the round went by');

// ...three of them is PARRY LEVEL 1: a bigger bank, and the title flies home
const lvl = await page.evaluate(async () => {
  const t = window.__ts;
  const f0 = t.flights(), n0 = t.banners().length;
  return { f0, n0 };
});
await parryTry(0.5); await parryTry(0.5);
const lvl2 = await page.evaluate(async ([f0, n0]) => {
  const t = window.__ts;
  const told = t.banners().slice(n0).filter((b) => /PARRY LEVEL/.test(b));
  // the banner's title fits the screen
  let fit = null;
  for (let f = 0; f < 900 && !fit; f++) {
    await window.__step();
    const b = document.getElementById('banner');
    const tl = b.querySelector('.tlevel');
    if (b.classList.contains('show') && tl && /PARRY/.test(tl.textContent)) {
      const r = tl.getBoundingClientRect(), s = b.querySelector('small').getBoundingClientRect();
      fit = { l: r.left, r: r.right, sl: s.left, sr: s.right, vw: innerWidth };
    }
  }
  let flew = false;
  for (let f = 0; f < 900 && !flew; f++) { await window.__step(); flew = t.flights() > f0; }
  await window.__step(60);
  return { told, fit, flew, parry: t.parry(), row: t.prog().parry };
}, [lvl.f0, lvl.n0]);
console.log('parry lv:  ' + JSON.stringify(lvl2));
await page.screenshot({ path: 'test/out/progress-panel.png' });
if (lvl2.parry.level !== 1 || lvl2.parry.cap !== 12) bad('three parries should be level 1 with a 12 s bank: ' + JSON.stringify(lvl2.parry));
if (lvl2.told.length !== 1) bad('PARRY LEVEL 1 was not announced once: ' + JSON.stringify(lvl2.told));
if (!lvl2.fit) bad('never saw the PARRY LEVEL banner');
else if (lvl2.fit.l < 0 || lvl2.fit.r > lvl2.fit.vw || lvl2.fit.sl < 0 || lvl2.fit.sr > lvl2.fit.vw) bad('the level banner runs off the screen: ' + JSON.stringify(lvl2.fit));
if (!lvl2.flew) bad('the level title did not fly into its row');
if (!/BANK \+2s/.test(lvl2.row.text)) bad('the parry row does not say what its level buys: ' + lvl2.row.text);

// ---- the switcher: the name dead centre between two round buttons -----------
const sw = await page.evaluate(async () => {
  const t = window.__ts;
  window.__clear();
  t.player.bag.length = 0;
  t.player.bag.push({ type: 'pistol', mag: 5, mk: 1 }, { type: 'shotgun', mag: 2, mk: 1 });
  t.setWeapon('pistol');
  await window.__step(3);
  const rect = (q) => { const r = document.querySelector(q).getBoundingClientRect(); return { cx: (r.left + r.right) / 2, w: r.width, h: r.height }; };
  const btns = [...document.querySelectorAll('#ammo .sw')].map((b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, cx: (r.left + r.right) / 2 }; });
  return { vw: innerWidth, line: rect('#ammo .line'), pills: rect('#ammo .pills'), btns,
    tempoOnAmmo: /TEMPO/.test(document.getElementById('ammo').textContent) };
});
console.log('switcher:  ' + JSON.stringify(sw));
await page.screenshot({ path: 'test/out/progress-switcher.png' });
if (sw.btns.length !== 2) bad('not two buttons beside the name');
else {
  if (sw.btns.some((b) => b.w < 30 || b.h < 30)) bad('the buttons are too small to press: ' + JSON.stringify(sw.btns));
  if (Math.abs((sw.btns[0].cx + sw.btns[1].cx) / 2 - sw.vw / 2) > 3) bad('the buttons are not either side of the centre');
}
if (Math.abs(sw.line.cx - sw.vw / 2) > 3) bad('the gun name is not centred: ' + sw.line.cx);
if (Math.abs(sw.pills.cx - sw.vw / 2) > 3) bad('the slot dots are not centred: ' + sw.pills.cx);
if (sw.tempoOnAmmo) bad('tempo is still on the bottom readout');

done('progress', errs);
await browser.close();
