import { boot, done } from './lib.mjs';
// THE UPGRADE BEAT, and a boss taking his hits one at a time (playtest
// 2026-09-26, log #7).
//
// A save that has not been taught slow time fights the Keeper with the KNIFE:
// each stab is one hit (it used to kill him outright from any hp, skipping his
// time stop). When he shatters, his shards hang and stream into you; the last
// of them is a white flash; out of it comes NEW UPGRADE / SLOW MOTION with the
// world still stopped; then black, and you are carried through his door onto
// door 10 and up to the slow-time lesson's barrier, its first beat under way.
// Nobody walks.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.removeItem('timeshard_slowtaught');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '9');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['blinker', 'shotgunner', 'rusher', 'heavy',
    'shieldbearer']));
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
});

// ---- through door 9's corridor legs to his seal ----------------------------
for (let i = 0; i < 6 && !(await page.evaluate(() => window.__ts.keeper())); i++) {
  await page.evaluate(async () => {
    const t = window.__ts;
    for (let f = 0; f < 60; f++) {
      t.game.spawnQueue.length = 0; for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
      await window.__step(3);
      const h = t.hall(); if (h.legs[h.cur].door.open) break;
    }
    const h = t.hall(), d = h.legs[h.cur].door;
    t.player.pos.set(d.x, 0, d.z + 1.2);
    await window.__step(20);
  });
}
await page.evaluate(async () => {
  const t = window.__ts, k = t.keeper();
  t.player.pos.set(k.seal.x, 0, k.seal.z + 1.5); t.player.yaw = Math.PI;
  for (let f = 0; f < 400 && !(t.keeper() && t.keeper().started); f++) await window.__step();
  const e = t.keeperEnemy();
  for (let f = 0; f < 600 && e && e.state === 'assemble'; f++) await window.__step();
});

// ---- the knife: one stab, one hit ------------------------------------------
const knife = await page.evaluate(async () => {
  const t = window.__ts, e = t.keeperEnemy();
  const L = t.hall().legs[t.hall().cur];
  const still = () => {
    e.speed = 0; e.fireCd = 1e9;
    for (const a of L.boss.adds) { a.speed = 0; a.fireCd = 1e9; if (a.state === 'aim') a.state = 'advance'; }
  };
  t.setWeapon('knife');
  const hps = [];
  for (let n = 0; n < 3 && t.enemies.includes(e); n++) {
    // never mid-stop, and never inside the last hit's hurt window
    for (let f = 0; f < 600 && (t.keeper().stopping || t.worldClock().now < (e.hurtUntil || 0) + 0.05); f++) { still(); await window.__step(); }
    still();
    t.player.pos.set(e.pos.x, 0, e.pos.z - 1.2);
    t.player.yaw = Math.PI; t.player.pitch = 0;
    await window.__step(2);
    t.player.fireCd = 0;
    t.playerFire();
    await window.__step(2);
    hps.push(t.enemies.includes(e) ? e.hp : 0);
  }
  return { hps, stops: t.keeper() ? t.keeper().phase : null };
});
console.log('knife:         ' + JSON.stringify(knife));
if (knife.hps[0] !== 2) bad('one stab should take one hit, left him on ' + knife.hps[0]);
if (knife.hps.join() !== '2,1,0') bad('three stabs should be three hits: ' + knife.hps.join());

// ---- the beat: flash, the title with the world stopped, then the carry ------
// (a picture of the title for a person to look at: out/upgrade-title.png)
page.waitForFunction(() => window.__ts.upgrade().cls === 'on', null, { timeout: 20000 })
  .then(() => page.waitForTimeout(900)).then(() => page.screenshot({ path: 'test/out/upgrade-title.png' })).catch(() => {});
const beat = await page.evaluate(async () => {
  const t = window.__ts;
  const seen = { flash: false, title: '', black: false };
  let w0 = null, worldDuringTitle = 0;
  const door0 = t.hall().doorsPassed + 1;
  for (let f = 0; f < 1500; f++) {
    await window.__step();
    const u = t.upgrade();
    if (u.cls === 'flash') seen.flash = true;
    if (u.cls === 'on') {
      seen.title = u.text;
      if (w0 === null) w0 = t.worldClock().now;
      worldDuringTitle = t.worldClock().now - w0;
    }
    if (/black/.test(u.cls)) seen.black = true;
    if (seen.black && u.stage === -1 && u.cls === '') break;
  }
  await window.__step(30);
  const tu = t.tutor();
  return { ...seen, world: +worldDuringTitle.toFixed(3), door0, door: t.hall().doorsPassed + 1,
    step: tu.step, bar: tu.bar, at: { x: +t.player.pos.x.toFixed(2), z: +t.player.pos.z.toFixed(2) },
    banners: t.banners().slice(-6) };
});
console.log('the beat:      ' + JSON.stringify(beat));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'test/out/upgrade-arrive.png' });
if (!beat.flash) bad('no white flash as his shards arrived');
if (!/NEW UPGRADE/.test(beat.title) || !/SLOW MOTION/.test(beat.title)) bad('the title does not say NEW UPGRADE / SLOW MOTION: ' + beat.title);
if (beat.world > 0.01) bad('the world moved ' + beat.world + ' s under the title');
if (!beat.black) bad('no black before the carry');
if (beat.door0 !== 9 || beat.door !== 10) bad('not carried from door 9 to door 10: ' + beat.door0 + ' -> ' + beat.door);
if (!beat.bar) bad('the lesson\'s barrier is not up on door 10');
else if (Math.abs(beat.at.z - beat.bar.z) > 3 || Math.abs(beat.at.x - beat.bar.x) > 1.5) bad('not set down at the barrier: ' + JSON.stringify(beat.at) + ' vs ' + JSON.stringify(beat.bar));
if (!beat.step || beat.step === 'slowStand') bad('the lesson did not get past STAND HERE on arrival: ' + beat.step);
if (beat.banners.some((b) => /RED DOOR|THE KEEPER$/.test(b))) bad('an old banner played: ' + beat.banners.join(' | '));

done('upgrade', errs);
await browser.close();
