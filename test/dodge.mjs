// DODGE THE BULLET IS ABOUT A BULLET THAT IS GOING TO HIT YOU.
//
// It used to be said about any round that had flown far enough, so a player
// who stepped aside early was told to dodge a round already sailing down the
// far side of the corridor — and then the words STAYED, because the only
// thing that retired them was stepping sideways AGAIN from wherever they
// happened to be when it froze. Somebody who dodged in good time could not
// satisfy that without dodging twice, for a round that was never a threat.
//
// Three cases, and the middle one is the one that regressed: a player in the
// lane must still be taught, a player already clear must be left alone, and
// stepping out must end it.
import { boot, done } from './lib.mjs';
const { browser, page, errs } = await boot();
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="hall"]');
await page.waitForFunction(() => window.__ts.tutor && __ts.tutor().step !== null,
  null, { timeout: 30000 });

// the same question the game asks: project the round and measure how wide of
// the player it passes
const LANE = `(b, p) => {
  const vx = b.vel.x, vz = b.vel.z, s2 = vx * vx + vz * vz;
  if (s2 < 1e-6) return -1;
  const dx = p.pos.x - b.pos.x, dz = p.pos.z - b.pos.z;
  const k = (dx * vx + dz * vz) / s2;
  return k <= 0 ? -1 : Math.hypot(dx - vx * k, dz - vz * k);
}`;

// ---- 1. a player who stands in the firing line is taught -------------------
const stand = await page.evaluate(async (LANE) => {
  const lane = eval(LANE);
  const t = window.__ts;
  t.setTutorStep('dodge');
  for (let i = 0; i < 60; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
  let shown = 0, threatened = 0;
  for (let f = 0; f < 900; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999; t.input.stickX = 0; t.input.stickY = 0;
    const n = document.getElementById('ts-dodge');
    if (n && n.classList.contains('show')) shown++;
    const b = t.bullets.find((x) => !x.fromPlayer);
    if (b) { const m = lane(b, t.player); if (m >= 0 && m <= 0.75) threatened++; }
  }
  return { shown, threatened };
}, LANE);
console.log('stands in the lane   rounds aimed at them ' + stand.threatened
  + ' frames, DODGE up ' + stand.shown);
if (stand.shown < 20) bad('the dodge lesson never fires for a player who needs it');

// ---- 2. a player who steps clear early is NOT told to dodge ---------------
const clear = await page.evaluate(async (LANE) => {
  const lane = eval(LANE);
  const t = window.__ts;
  t.setTutorStep('dodge');
  for (let i = 0; i < 60; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
  let wide = 0, shownWide = 0;
  for (let f = 0; f < 900; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999; t.input.stickX = 0; t.input.stickY = 0;
    const b = t.bullets.find((x) => !x.fromPlayer);
    if (b) t.player.pos.x += 0.16;         // step aside the instant one exists
    const n = document.getElementById('ts-dodge');
    const up = !!(n && n.classList.contains('show'));
    if (b) { const m = lane(b, t.player); if (m > 1.2) { wide++; if (up) shownWide++; } }
  }
  return { wide, shownWide };
}, LANE);
console.log('steps clear early    round over 1.2 m wide for ' + clear.wide
  + ' frames, DODGE up for ' + clear.shownWide + ' of them');
if (clear.shownWide > 30) bad('DODGE is shown for a round that is going to miss');

// ---- 3. ...and stepping out of the lane ends it ---------------------------
const ends = await page.evaluate(async () => {
  const t = window.__ts;
  t.setTutorStep('dodge');
  for (let i = 0; i < 60; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
  const up = () => { const n = document.getElementById('ts-dodge');
    return !!(n && n.classList.contains('show')); };
  let w = 0;
  while (!up() && w < 1400) { await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999; t.input.stickX = 0; t.input.stickY = 0; w++; }
  if (!up()) return { appeared: false };
  for (let f = 0; f < 240; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999; t.player.pos.x += 0.05;
    if (!up()) return { appeared: true, frames: f };
  }
  return { appeared: true, frames: 240 };
});
console.log('steps out mid-round  ' + JSON.stringify(ends));
if (!ends.appeared) bad('the prompt never appeared to be cleared');
if (ends.frames >= 240) bad('DODGE never goes away after stepping aside');

// ---- 4. ...AND THE LESSON STILL FINISHES ---------------------------------
//
// The risk in "say nothing about a round that will miss" is saying nothing
// about a round that then also never counts. A player who dodges every round
// early must still clear all three and move on to the shooting lesson.
const prog = await page.evaluate(async () => {
  const t = window.__ts;
  t.setTutorStep('dodge');
  for (let i = 0; i < 60; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
  const start = t.tutor().step;
  // THE CORRIDOR IS NOT AT x=0 — this leg sits out around x=24 — and stepping
  // aside ONCE is not dodging three rounds: the man fires the next one at
  // wherever you are standing now. Sweep, from wherever the lesson put us.
  const home = t.player.pos.x;
  for (let f = 0; f < 3000 && t.tutor().step === start; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home + Math.sin(f / 26) * 2.2;
  }
  return { start, ended: t.tutor().step, dodged: t.tutor().dodged };
});
console.log('dodging early every round: ' + JSON.stringify(prog));
if (prog.ended === prog.start) bad('a player who dodges early is stuck at the barrier');
if (prog.dodged < 3) bad('early dodges are not being counted: ' + prog.dodged);

// ---- 5. AIMING IS FACING. A player who only ever taps is told so ----------
//
// There is no aim control in this game: you aim by turning, which is the same
// drag that walks you. TAP ANYWHERE TO SHOOT retires on the first shot, and a
// player who had not connected the two was left with a blank screen and a miss.
const read = () => page.evaluate(() => {
  const g = (id) => { const n = document.getElementById(id);
    return n && n.classList.contains('show') ? (n.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
  return { left: g('ts-left'), right: g('ts-right'), mid: g('ts-mid') };
});
await page.evaluate(async () => {
  const t = window.__ts;
  t.setTutorStep('shoot');
  for (let i = 0; i < 90; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
});
const entered = await read();
console.log('shoot step, on entry ' + JSON.stringify(entered));
if (!/TAP ANYWHERE/.test(entered.mid)) bad('the shooting lesson lost its own prompt');
if (entered.left || entered.right) bad('the drag reminders are up before a shot was fired');
for (let k = 0; k < 3; k++) {
  await page.tap('body', { position: { x: 300, y: 300 } });
  await page.waitForTimeout(400);
}
const tapped = await read();
console.log('after 3 taps, no drag ' + JSON.stringify(tapped));
if (!/DRAG TO MOVE/.test(tapped.left)) bad('DRAG TO MOVE did not come back for a player who only taps');
if (!/DRAG TO LOOK/.test(tapped.right)) bad('DRAG TO LOOK did not come back');
await page.evaluate(async () => {
  const t = window.__ts;
  for (let f = 0; f < 90; f++) { t.player.yaw += 0.02;
    await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
});
await page.waitForTimeout(900);
const dragged = await read();
console.log('after dragging       ' + JSON.stringify(dragged));
if (/DRAG TO/.test(dragged.left + dragged.right)) bad('the drag reminders did not retire once they dragged');

done('dodge', errs);
await browser.close();
