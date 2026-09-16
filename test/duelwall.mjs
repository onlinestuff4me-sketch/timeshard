import { boot, done, OUT } from './lib.mjs';
// WEDGED ON THE WALL BESIDE A DOOR.
//
// There is no forward control in this mode: the corridor carries you out once
// the room is dead. Step aside for a round near the end of a fight and it
// carries you into the wall NEXT to the doorway instead — and then there is
// nothing to press, and no reason to think the drag is what gets you out,
// because the drag has been for sidestepping rounds all game and never for
// going anywhere. The walk simply stops looking like it is doing anything.
//
// So the room says which way, and finishes the job once they have turned
// toward it.
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
  return { coach: s.coach, walk: s.walk, stuckT: s.stuckT, room: t.hall().doorsPassed + 1,
    card: m.classList.contains('on'), what: m.querySelector('.what').textContent.trim(),
    cue: m.classList.contains('right') ? 'right' : m.classList.contains('left') ? 'left' : '',
    stick: getComputedStyle(m.querySelector('.stk')).display !== 'none',
    x: +t.player.pos.x.toFixed(2), z: +t.player.pos.z.toFixed(2),
    doorX: s.doorX, doorZ: s.doorZ };
});

// ---- win room 1, then wedge yourself on the way out ----------------------
// Held OFF THE SPINE while the corridor pushes: that is what stepping aside
// for a late round leaves you doing, and the wall does the rest.
const wedged = await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  let off = 0;
  while (performance.now() - t0 < 90000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const s = t.simpleState();
    if (s.coach === 'dodge') { t.player.pos.x += 0.06; continue; }
    if (s.walk) {
      // three metres off the doorway's centre, which is where a sidestep near
      // the end of a fight leaves you
      off = (s.doorX || 0) + 3;
      t.player.pos.x = off;
      if (s.coach === 'stuck') break;
      continue;
    }
    const k = t.enemies.findIndex((e) => e.alive);
    if (k >= 0) t.fireAt(t.enemies[k].pos.x, 1.25, t.enemies[k].pos.z);
  }
  return { coach: t.simpleState().coach, heldAt: +off.toFixed(2) };
});
const up = await read();
console.log('held off the spine: ' + JSON.stringify(wedged));
console.log('while wedged:       ' + JSON.stringify(up));
await page.screenshot({ path: OUT + 'duel-wall.png' });
if (up.coach !== 'stuck') bad('the corridor pushed into a wall and said nothing: ' + up.coach);
if (!up.card) bad('no card while wedged');
if (!/DRAG TO MOVE/.test(up.what)) bad('the card does not say what to do: ' + up.what);
if (!up.stick) bad('no thumb under an instruction to drag');
// ...AND IT POINTS THE RIGHT WAY. Held to the door's right, the way out is
// left; a thumb travelling the wrong way is worse than no thumb at all.
if (up.cue !== 'left') bad('the thumb points ' + (up.cue || 'nowhere') + ', not back toward the door');
// it must not fire while the walk is genuinely working
if (up.z > up.doorZ) bad('it called a player who was through the door stuck');

// ---- drag toward it, and the room lets you out ---------------------------
const through = await page.evaluate(async (want) => {
  const t = window.__ts;
  const t0 = performance.now();
  const from = t.hall().doorsPassed + 1;
  while (performance.now() - t0 < 12000 && t.hall().doorsPassed + 1 === from) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const s = t.simpleState();
    t.player.pos.x += Math.sign((s.doorX || 0) - t.player.pos.x) * 0.08;
  }
  return { from, room: t.hall().doorsPassed + 1, coach: t.simpleState().coach };
});
console.log('after dragging:     ' + JSON.stringify(through));
if (through.room <= through.from) bad('dragging toward the door did not get them through');
const after = await read();
if (after.coach === 'stuck') bad('the card is still up in the next room');
if (after.card) bad('the card outlived the problem it was about');

// ---- ...AND IT DOES NOT FIRE ON A PLAYER WHO IS SIMPLY WALKING -----------
// The whole thing keys off PROGRESS, so somebody being carried out normally
// must never see it.
const clean = await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  let seen = 0, walked = 0;
  while (performance.now() - t0 < 45000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const s = t.simpleState();
    if (s.coach === 'stuck') seen++;
    if (s.walk) walked++;
    if (s.coach === 'dodge') { t.player.pos.x += 0.06; continue; }
    // stay on the spine, which is where the corridor is taking you anyway
    if (s.walk) { t.player.pos.x += Math.sign((s.doorX || 0) - t.player.pos.x) * 0.05; continue; }
    const k = t.enemies.findIndex((e) => e.alive);
    if (k >= 0) t.fireAt(t.enemies[k].pos.x, 1.25, t.enemies[k].pos.z);
  }
  return { seen, walked, room: t.hall().doorsPassed + 1 };
});
console.log('walking normally:   ' + JSON.stringify(clean));
if (!clean.walked) bad('the probe never walked, so that check measured nothing');
if (clean.seen) bad('DRAG TO MOVE fired on ' + clean.seen + ' frames of an ordinary walk');

done('duelwall', errs);
await browser.close();
