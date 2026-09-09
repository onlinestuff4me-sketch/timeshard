import { boot, done, OUT } from './lib.mjs';
// THE GUN ON THE FLOOR.
//
// A shotgunner leaves his shotgun behind, and there is no pick-up button in
// this game: you walk over a thing to take it. NO RETREAT never asks the player
// to go anywhere — the drag is for stepping out of the way of rounds and the
// corridor does the walking — so the one gesture that gets you the gun is the
// one gesture the mode has never used the drag for.
//
// This probe clears the shotgunner's debut room and checks the room says so:
// the world goes heavy but keeps walking, a ring goes on the gun, the
// instruction is one line, and it goes when they have it.
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
  const what = m.querySelector('.what');
  const pins = [...document.querySelectorAll('#duelpins i')].filter((p) => p.classList.contains('on'));
  const wb = what.getBoundingClientRect();
  return { coach: s.coach, scale: s.timeScale, walk: s.walk,
    card: m.classList.contains('on'), what: what.textContent.trim(),
    lines: Math.round(wb.height / parseFloat(getComputedStyle(what).lineHeight || 20)),
    wide: wb.width > window.innerWidth,
    cue: m.classList.contains('right') ? 'right' : m.classList.contains('left') ? 'left' : '',
    stick: getComputedStyle(m.querySelector('.stk')).display !== 'none',
    pins: pins.length, drops: t.pickups.filter((p) => p.type !== 'clip').length,
    weapon: t.player.weapon, room: t.hall().doorsPassed + 1 };
});

// ---- walk to the shotgunner's room, clearing every room on the way -------
// `warpDoor` moves the room NUMBER and not the fight in front of you, so the
// only honest way to arrive at room 8 is to win rooms 1 to 7.
const arrived = await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  let last = -1;
  while (performance.now() - t0 < 150000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const room = t.hall().doorsPassed + 1;
    // the opening lesson wants a sidestep before it hands over the pistol
    if (t.simpleState().coach === 'dodge') { t.player.pos.x += 0.06; continue; }
    if (room >= 8 && t.simpleState().plan.fresh === 'shotgunner') break;
    if (room !== last) { last = room; }
    const k = t.enemies.findIndex((e) => e.alive);
    if (k >= 0) t.killAt(k);
  }
  return { room: t.hall().doorsPassed + 1, fresh: t.simpleState().plan.fresh };
});
console.log('walked to:       ' + JSON.stringify(arrived));
if (arrived.fresh !== 'shotgunner') bad('never reached the shotgunner room: ' + JSON.stringify(arrived));

// ---- clear it, and watch what the room says ------------------------------
const cleared = await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 60000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    if (t.simpleState().coach === 'loot') break;
    const k = t.enemies.findIndex((e) => e.alive);
    if (k >= 0) t.killAt(k);
  }
  // ...and let the world actually get heavy before reading it: the crossing
  // is eased (SIMPLE.duel.ease), not snapped, so the frame the coach turns on
  // is the frame it is still at full speed.
  await new Promise((r) => setTimeout(r, 500));
  return { coach: t.simpleState().coach };
});
const up = await read();
console.log('room cleared:    ' + JSON.stringify(up));
await page.screenshot({ path: OUT + 'duel-loot.png' });
if (up.coach !== 'loot') bad('a cleared room with a gun in it said nothing');
if (!up.drops) bad('the shotgunner debut left no shotgun behind');
if (!/PICK UP SHOTGUN/.test(up.what)) bad('the instruction does not name the gun: ' + up.what);
if (up.lines > 1) bad('the instruction wraps to ' + up.lines + ' lines');
if (up.wide) bad('the instruction runs off the sides');
if (!up.pins) bad('nothing is ringed — "pick up" pointing at nothing');
if (!up.stick) bad('no thumb saying which way to drag');
if (!up.cue) bad('the thumb has no direction');
// IT SLOWS, IT DOES NOT STOP. The corridor has to keep carrying them or the
// drag it is asking for has nothing to be a drag against.
if (up.scale < 0.05) bad('the world stopped: ' + up.scale);
if (up.scale > 0.6) bad('the world did not go heavy at all: ' + up.scale);
if (!up.walk) bad('the corridor stopped walking, so there is nowhere to drag to');

// ---- and it goes when they have it ---------------------------------------
// DRAG ACROSS AND LET THE CORRIDOR DO THE REST, which is the gesture the card
// is asking for: the walk is carrying them forward, so the only thing the
// player supplies is the sideways half. The drop it points at is the game's
// choice, not the probe's — there are usually several on the floor.
const took = await page.evaluate(async () => {
  const t = window.__ts;
  const want = t.simpleState().loot;
  const t0 = performance.now();
  while (performance.now() - t0 < 12000 && t.player.weapon !== 'shotgun') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    if (want) t.player.pos.x = want.x;   // the sideways half of the drag
  }
  await new Promise((r) => setTimeout(r, 600));
  return { weapon: t.player.weapon, coach: t.simpleState().coach, want };
});
const after = await read();
console.log('after taking it: ' + JSON.stringify(took));
if (took.weapon !== 'shotgun') bad('walking over the shotgun did not pick it up: ' + took.weapon);
if (after.coach === 'loot') bad('the card survived the pick-up that answered it');
if (after.card) bad('the card is still on screen');
if (after.scale < 0.9) bad('time did not come back: ' + after.scale);

done('duelloot', errs);
await browser.close();
