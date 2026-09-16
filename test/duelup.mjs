import { boot, done, OUT } from './lib.mjs';
// THE DOOR-6 HANDOVER, PLAYED RATHER THAN DESCRIBED.
//
// It is the one moment this mode gains a verb. It used to arrive off the back
// of whichever round happened to be fired first in the room: the world stopped,
// a prompt appeared on a button that had not been there a moment before, and
// nothing said what had changed. Now it is seven beats, and this walks them.
//
//   1-2  the gun goes away, NEW UPGRADE / SLOW TIME on a still screen
//   3    the room fills in behind the card
//   4    the card fades, they raise together and fire ONE volley
//   5    TAP TO SLOW TIME, world stopped, the button the only thing that works
//   6    the press buys slow time, and the rounds in the air are ringed
//   7    the pistol comes back, and a body to put it on
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1700);
await page.tap('#startnew'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(1500);

const read = () => page.evaluate(() => {
  const t = window.__ts, m = document.getElementById('duelmeet');
  const s = t.simpleState();
  const pins = [...document.querySelectorAll('#duelpins i')].filter((p) => p.classList.contains('on'));
  return { coach: s.coach, scale: s.timeScale, gun: s.gun, room: t.hall().doorsPassed + 1,
    card: m.classList.contains('on'),
    who: m.querySelector('.who').textContent.trim(),
    what: m.querySelector('.what').textContent.trim(),
    stick: getComputedStyle(m.querySelector('.stk')).display !== 'none',
    pins: pins.length, tap: document.getElementById('dueltap').classList.contains('on'),
    rounds: t.bullets.filter((b) => !b.fromPlayer).length,
    men: t.enemies.filter((e) => e.alive).length,
    aiming: t.enemies.filter((e) => e.alive
      && (e.state === 'aim' || e.state === 'burst')).length };
});

// ---- win rooms 1 to 5, honestly ------------------------------------------
// `warpDoor` moves the room number and not the fight, and the handover fires
// on ARRIVAL — so the only way to see it is to earn the room.
const walked = await page.evaluate(async (want) => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 180000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    if (t.hall().doorsPassed + 1 >= want) break;
    const s = t.simpleState();
    if (s.coach === 'dodge') { t.player.pos.x += 0.06; continue; }
    // ...AND IT ANSWERS THE WALL. Stepping aside for a dodge leaves you off the
    // spine, and the corridor then walks you into the wall beside the doorway
    // — which is the whole reason DRAG TO MOVE exists. A player drags toward
    // the way out; so does this.
    if (s.coach === 'stuck') {
      t.player.pos.x += Math.sign((s.doorX || 0) - t.player.pos.x) * 0.06;
      continue;
    }
    const k = t.enemies.findIndex((e) => e.alive);
    if (k >= 0) t.fireAt(t.enemies[k].pos.x, 1.25, t.enemies[k].pos.z);
  }
  return { room: t.hall().doorsPassed + 1, coach: t.simpleState().coach };
}, 6);
console.log('walked to:       ' + JSON.stringify(walked));
if (walked.room !== 6) bad('never reached the button room: ' + walked.room);
// the card, the gun and the clock are all eased rather than snapped, so a read
// taken on the frame a beat begins is a read of the frame before it
await page.waitForTimeout(450);

// ---- 1-2: the gun is away and the card names the power -------------------
const said = await read();
console.log('on arrival:      ' + JSON.stringify(said));
if (said.coach !== 'up_say' && said.coach !== 'up_meet') {
  bad('arriving in the button room did not start the handover: ' + said.coach);
}
if (said.gun) bad('the pistol is still on screen under the announcement');
if (!said.card) bad('nothing on screen when the power arrived');
if (!/NEW UPGRADE/.test(said.who)) bad('the card does not say what happened: ' + said.who);
if (!/SLOW TIME/.test(said.what)) bad('the card does not name the power: ' + said.what);
if (said.stick) bad('a thumb under an announcement is asking for something');
await page.screenshot({ path: OUT + 'duel-upgrade.png' });

// ---- 3-4: the room fills, then ONE volley on cue --------------------------
const volley = await page.evaluate(async () => {
  const t = window.__ts;
  let most = 0, fired = 0, heldWhileSaying = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < 26000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const s = t.simpleState();
    const air = t.bullets.filter((b) => !b.fromPlayer).length;
    if (s.coach === 'up_say' || s.coach === 'up_meet') heldWhileSaying += air;
    if (air > most) most = air;
    if (air > fired) fired = air;
    if (s.coach === 'tap') break;
  }
  return { coach: t.simpleState().coach, most, heldWhileSaying,
    scale: t.simpleState().timeScale };
});
await page.waitForTimeout(350);
console.log('the volley:      ' + JSON.stringify(volley));
if (volley.heldWhileSaying) bad('the room fired while the announcement was still up');
if (volley.coach !== 'tap') bad('the volley never handed over to the prompt: ' + volley.coach);
if (volley.most < 2) bad('the cue produced ' + volley.most + ' rounds, not a volley');

// ---- 5: the world is stopped and the button is the only way on -----------
const held = await read();
console.log('prompt up:       ' + JSON.stringify(held));
if (held.scale > 0.001) bad('the world did not stop for the prompt: ' + held.scale);
const promptText = await page.$eval('#duelcoach', (n) => n.textContent.trim());
if (!/TAP TO SLOW/.test(promptText)) bad('the prompt does not say what to do: ' + promptText);

// ---- 6: the press buys slow time, and the rounds get rings ---------------
await page.evaluate(async () => {
  document.getElementById('timebtn').dispatchEvent(new PointerEvent('pointerdown',
    { pointerId: 99, clientX: 340, clientY: 700, bubbles: true }));
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => requestAnimationFrame(r)); window.__ts.player.iframes = 999;
  }
});
const dodging = await read();
console.log('after the press: ' + JSON.stringify(dodging));
if (dodging.coach !== 'up_dodge') bad('the press did not reach the dodge beat: ' + dodging.coach);
if (!/DODGE/.test(dodging.what)) bad('the card does not say to dodge: ' + dodging.what);
if (!dodging.pins) bad('the rounds it is telling you to dodge are not ringed');
if (!dodging.stick) bad('no thumb saying which way');
// SLOWED, NOT STOPPED. The press bought time; standing in a frozen world is
// not what it bought.
if (dodging.scale < 0.05) bad('the world is still stopped after the press: ' + dodging.scale);
if (dodging.scale > 0.9) bad('the press bought no slow time at all: ' + dodging.scale);
await page.screenshot({ path: OUT + 'duel-upgrade-dodge.png' });

// ---- 7: step aside, and the pistol comes back with something to shoot ----
const shooting = await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 14000 && t.simpleState().coach === 'up_dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x += 0.06;
  }
  await new Promise((r) => setTimeout(r, 400));
  return { coach: t.simpleState().coach };
});
const armed = await read();
console.log('after dodging:   ' + JSON.stringify(armed));
if (armed.coach !== 'up_shoot') bad('stepping aside did not reach the shoot beat: ' + armed.coach);
if (!armed.gun) bad('the pistol did not come back');
if (!/TAP HERE TO SHOOT/.test(armed.what)) bad('the card does not say to shoot: ' + armed.what);
if (!armed.pins) bad('nothing is ringed to shoot at');
if (!armed.tap) bad('no thumb on the man');

// ---- and shattering one ends it ------------------------------------------
const over = await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 14000 && t.simpleState().coach === 'up_shoot') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const m = t.enemies.find((e) => e.alive);
    if (m) t.fireAt(m.pos.x, 1.25, m.pos.z);
  }
  await new Promise((r) => setTimeout(r, 400));
  return { coach: t.simpleState().coach, gun: t.simpleState().gun };
});
console.log('after a shatter: ' + JSON.stringify(over));
if (over.coach === 'up_shoot') bad('shattering a body did not end the handover');
if (!over.gun) bad('the pistol was left put away');
const endCard = await read();
if (endCard.card) bad('the card is still on screen when the sequence is over');

done('duelup', errs);
await browser.close();
