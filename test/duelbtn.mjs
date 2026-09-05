import { boot, done, OUT } from './lib.mjs';
// THE DUEL'S TIME BUTTON: WHOSE TIME IS IT, AND HOW MUCH IS LEFT?
//
// The mode used to slow itself whenever a round was inbound — a rule the
// player cannot see (inside 1.1s, passing within 2.6m), so from the outside
// the world slowed down at random. Room 1 keeps that as a demonstration; from
// room 2 it is a button on the tunnel's own bank: spend it, kills refill it,
// it runs dry on its own.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '20');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '20'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1700);
await page.tap('#startnew');
await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(3000);

const look = () => page.evaluate(() => {
  const b = document.getElementById('timebtn'), m = document.getElementById('slowmeter');
  const cs = getComputedStyle(b);
  return { room: window.__ts.hall().doorsPassed + 1,
    btn: !!(b.offsetWidth || b.offsetHeight),
    juice: b.classList.contains('juice'), full: b.classList.contains('full'),
    low: b.classList.contains('lowjuice'), locked: b.classList.contains('locked'),
    pct: cs.getPropertyValue('--juice').trim(),
    meter: !!(m.offsetWidth || m.offsetHeight),
    meterH: m.getBoundingClientRect().height,
  };
});

// ---- room 1 is the introduction: no button --------------------------------
const r1 = await look();
console.log('room 1: ' + JSON.stringify(r1));
if (r1.btn) bad('the button is up in room 1, which is the introduction');

// ---- walk the run to room 2 ----------------------------------------------
await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 30000 && t.hall().doorsPassed < 1) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    for (let k = t.enemies.length - 1; k >= 0; k--) if (t.enemies[k].alive) t.killAt(k);
  }
  await new Promise((r) => setTimeout(r, 800));
});
const r2 = await look();
console.log('room 2: ' + JSON.stringify(r2));
if (r2.room < 2) bad('never reached room 2 (got ' + r2.room + ')');
if (!r2.btn) bad('the button did not arrive in room 2');
if (!r2.juice) bad('the button is not wearing its own meter');
if (!r2.meter) bad('the bank meter is not shown');
if (r2.meterH < 10) bad('the meter is the thin tunnel bar, not the big one: ' + r2.meterH + 'px');
await page.screenshot({ path: OUT + 'duel-button.png' });

// ---- spend it: it drains while in use, and time really does slow ----------
const spend = await page.evaluate(async () => {
  const t = window.__ts;
  const read = () => ({ bank: t.slow().bank, scale: t.simpleState().timeScale,
    locked: t.slow().locked });
  for (let k = t.enemies.length - 1; k >= 0; k--) if (t.enemies[k].alive) t.killAt(k);
  await new Promise((r) => setTimeout(r, 400));
  const before = read();
  t.setTimeLocked(true);
  const scales = [];
  const t0 = performance.now();
  while (performance.now() - t0 < 2500) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    scales.push(t.simpleState().timeScale);
  }
  const during = read();
  t.setTimeLocked(false);
  await new Promise((r) => setTimeout(r, 600));
  return { before, during, after: read(), slowest: Math.min(...scales) };
});
console.log('spending: bank ' + spend.before.bank + ' -> ' + spend.during.bank
  + '   slowest world speed seen ' + spend.slowest.toFixed(3));
if (spend.during.bank >= spend.before.bank) {
  bad('the bank did not drain while slow time was on');
}
if (spend.slowest > 0.3) bad('pressing the button did not slow the world: ' + spend.slowest);

// ---- shattering puts it back ---------------------------------------------
const refill = await page.evaluate(async () => {
  const t = window.__ts;
  const low = t.slow().bank;
  let killed = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < 20000 && killed < 3) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    for (let k = t.enemies.length - 1; k >= 0; k--) {
      if (t.enemies[k].alive) { t.killAt(k); killed++; }
    }
  }
  await new Promise((r) => setTimeout(r, 400));
  return { low, high: t.slow().bank, killed };
});
console.log('refill: bank ' + refill.low + ' -> ' + refill.high
  + ' after ' + refill.killed + ' kills');
if (refill.killed && refill.high <= refill.low) {
  bad('shattering did not put anything back in the bank');
}

// ---- run it dry: it lets go on its own ------------------------------------
const dry = await page.evaluate(async () => {
  const t = window.__ts;
  t.setSlow(1.0);
  t.setTimeLocked(true);
  const t0 = performance.now();
  while (performance.now() - t0 < 9000 && t.slow().locked) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.game.spawnQueue.length = 0;
    for (let k = t.enemies.length - 1; k >= 0; k--) t.killAt(k);
  }
  const b = document.getElementById('timebtn');
  return { locked: t.slow().locked, bank: t.slow().bank,
    low: b.classList.contains('lowjuice'), empty: b.classList.contains('empty') };
});
console.log('run dry: ' + JSON.stringify(dry));
await page.screenshot({ path: OUT + 'duel-button-empty.png' });
// ...and half full, which is the state the gradient has to actually draw
const half = await page.evaluate(async () => {
  const t = window.__ts;
  t.setSlow(t.slow().cap * 0.45);
  await new Promise((r) => requestAnimationFrame(r));
  const b = document.getElementById('timebtn');
  return { pct: getComputedStyle(b).getPropertyValue('--juice').trim(),
    low: b.classList.contains('lowjuice'), full: b.classList.contains('full') };
});
console.log('half full: ' + JSON.stringify(half));
if (half.full) bad('a half-full button is claiming to be full');
await page.screenshot({ path: OUT + 'duel-button-half.png' });
if (dry.locked) bad('the bank emptied and slow time did not let go on its own');
if (!dry.low) bad('an empty button is not showing itself as empty');
done('duelbtn', errs);
await browser.close();
