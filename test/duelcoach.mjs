// ---------------------------------------------------------------------------
// THREE THINGS THE OPENING OF NO RETREAT SAYS, AND WHEN IT SAYS THEM.
//
// All three came out of a playtest, and all three are about a message being
// on screen at a moment that makes it unreadable or untrue.
//
//   1. STARTING SIMULATION used to have no clock: it held until the first
//      round was fired. The men walk on and aim underneath it, and on a
//      portrait phone it lands in the same band of pixels as the door's own
//      EXIT sign — two messages in one place. It is two seconds now.
//
//   2. TAP TO SLOW TIME arrives with the world stopped and an arrow on the
//      button. You shoot in this mode by tapping ANYWHERE, so every tap that
//      missed the button fired the pistol into a frozen room instead. The
//      trigger is held for the length of that one card.
//
//   3. SHATTERING REFILLS YOUR METER used to be said one frame after the
//      button was first pressed, with the bank still full and nothing spent.
//      It waits for the bank to have run low and been paid back, so it names
//      something the player has just watched happen.
//
// See duelOpenCard, duelHoldsFire and duelMeterLine.
// ---------------------------------------------------------------------------
import { boot, done, OUT } from './lib.mjs';

const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '20');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '20'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };

const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => { console.log('FAIL ' + m); };
await page.waitForTimeout(1700);
await page.tap('#startnew');
await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });

// ---- 1. the opening card is a two-second card -----------------------------
// Sampled from the frame the room starts, so the number reported is how long
// it was actually readable rather than what the dial says.
const card = await page.evaluate(async () => {
  const t = window.__ts;
  const b = document.getElementById('banner');
  const up = () => b.classList.contains('show');
  const t0 = performance.now();
  let seen = false, downAt = null, shotsAt = null;
  while (performance.now() - t0 < 7000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;          // this is about a card, not about dying
    if (up()) seen = true;
    else if (seen && downAt === null) {
      downAt = +((performance.now() - t0) / 1000).toFixed(2);
      shotsAt = t.worldClock ? t.worldClock().shots : null;
      break;
    }
  }
  return { seen, downAt, shotsAt, text: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) };
});
console.log(`the opening card: up ${card.seen}, down at ${card.downAt}s`
  + `  (${card.shotsAt === 0 ? 'its own clock — nobody had fired'
    : `${card.shotsAt} round(s) had flown, so a shot may have closed it`})`);
if (!card.seen) bad('the opening card never appeared at all');
// 2 s of card plus the fade; anything past 3 is the old no-clock behaviour.
if (card.downAt === null || card.downAt > 3) {
  bad('the opening card is still up at ' + (card.downAt === null ? '7+' : card.downAt) + 's');
}

// ---- walk to the room the button arrives in -------------------------------
await page.evaluate(async () => {
  const t = window.__ts;
  const up = () => { const b = document.getElementById('timebtn');
    return !!(b.offsetWidth || b.offsetHeight); };
  let guard = 0;
  while (!up() && guard++ < 14) {
    t.crossDoor();
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
  }
});
// ...and let the room fire, which is what raises the button's card
await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 25000 && t.simpleState().coach !== 'tap') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
  }
  for (let i = 0; i < 40; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
});

// ---- 2. while that card is up, a tap is not a trigger pull ----------------
const held = await page.evaluate(() => ({ coach: window.__ts.simpleState().coach,
  holds: window.__ts.simpleState().holdsFire, mag: window.__ts.player.mag }));
await page.touchscreen.tap(200, 300);   // anywhere that is not the button
await page.touchscreen.tap(120, 420);
await page.waitForTimeout(400);
const after = await page.evaluate(() => ({ coach: window.__ts.simpleState().coach,
  mag: window.__ts.player.mag }));
console.log(`taps during TAP TO SLOW TIME: coach ${held.coach}, holdsFire ${held.holds}, `
  + `magazine ${held.mag} -> ${after.mag}`);
if (held.coach !== 'tap') bad('the button lesson never came up; nothing to check');
if (!held.holds) bad('the trigger is not held while the button card is up');
if (after.mag < held.mag) bad(`two taps fired ${held.mag - after.mag} round(s) into the frozen room`);
await page.screenshot({ path: OUT + 'duelcoach-held.png' });

// answer it the way a player does, and the trigger comes back
await page.evaluate(async () => {
  const t = window.__ts;
  document.getElementById('timebtn').dispatchEvent(new PointerEvent('pointerdown',
    { pointerId: 99, clientX: 340, clientY: 700, bubbles: true }));
  for (let i = 0; i < 240; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    if (!t.simpleState().pairShot && i > 60) break;
  }
});
const freed = await page.evaluate(() => ({ coach: window.__ts.simpleState().coach,
  holds: window.__ts.simpleState().holdsFire }));
console.log(`after pressing it: coach ${freed.coach}, holdsFire ${freed.holds}`);
if (freed.holds) bad('the trigger is still held after the button was pressed');

// ---- 3. the meter line waits for the loop it describes --------------------
const early = await page.evaluate(() => {
  const c = document.getElementById('duelcoach');
  return { text: c.textContent.trim(), said: window.__ts.simpleState().meterSaid };
});
if (/REFILL/.test(early.text) || early.said) {
  bad('the refill line was said before the bank had been spent: ' + early.text);
}
// run the bank down, then pay it back with three men
const meter = await page.evaluate(async () => {
  const t = window.__ts;
  // let time run again first: the line is a caption on a fight, and a probe
  // that leaves the world locked at 0.3 cannot tell whether it stopped it.
  t.setTimeLocked(false);
  t.setSlow(1.0);                       // under SLOWMO.low (2.5), not empty
  for (let i = 0; i < 20; i++) await new Promise((r) => requestAnimationFrame(r));
  const ranLow = t.simpleState().ranLow;
  let killed = 0;
  const c = document.getElementById('duelcoach');
  // READ IT ON THE FRAME IT IS RAISED. The kills that pay the bank back are
  // also the kills that empty the room, and an empty room opens a door and
  // resets the coach — so a snapshot taken a second later is a snapshot of
  // the next room, and reports the line as never having been said.
  let shot = null;
  const t0 = performance.now();
  while (performance.now() - t0 < 25000 && !shot) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    if (killed < 3) {
      for (let k = t.enemies.length - 1; k >= 0 && killed < 3; k--) {
        if (t.enemies[k].alive) { t.killAt(k); killed++; }
      }
    }
    if (t.simpleState().meterSaid) {
      shot = { text: c.textContent.trim(), on: c.classList.contains('on'),
        atbtn: c.classList.contains('atbtn'), scale: t.simpleState().timeScale };
    }
  }
  return { ranLow, killed, said: !!shot, ...(shot || { text: '', on: false, atbtn: false, scale: null }) };
});
console.log(`the meter line: bank ran low ${meter.ranLow}, ${meter.killed} shattered`
  + ` -> "${meter.text}" on=${meter.on} atButton=${meter.atbtn} worldSpeed=${meter.scale}`);
if (!meter.ranLow) bad('the bank never registered as low, so the beat could not arm');
if (!meter.said) bad('three shatters on a low bank did not raise the refill line');
if (!meter.on) bad('the refill line is not on screen');
if (!meter.atbtn) bad('the refill line does not point at the button');
if (!/REFILL/.test(meter.text)) bad('the line is not about refilling: ' + meter.text);
// ...and it is a caption, not a lesson: nothing stops for it.
if (meter.scale <= 0.5) bad('the refill line stopped the world: scale ' + meter.scale);
await page.screenshot({ path: OUT + 'duelcoach-meter.png' });

done('duelcoach', errs);
await browser.close();
