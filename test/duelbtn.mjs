import { boot, done, OUT } from './lib.mjs';
// THE DUEL'S TIME BUTTON: WHOSE TIME IS IT, AND HOW MUCH IS LEFT?
//
// The mode used to slow itself whenever a round was inbound — a rule the
// player cannot see (inside 1.1s, passing within 2.6m), so from the outside
// the world slowed down at random. Nothing slows itself now: the button is a
// button, on the tunnel's own bank — spend it, kills refill it, it runs dry
// on its own.
//
// WHICH ROOM IT ARRIVES IN IS THE SCHEDULE'S BUSINESS, not this probe's. It
// used to be pinned here as "room 2" and then the ramp moved it to the peak
// of the first cycle, one room before the first new type — because a debut
// says DODGE and the button is what makes dodging survivable. A probe that
// hard-codes a number the design owns reports a design decision as a bug, so
// this one walks until the button is there and says where that was.
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

// ---- ANSWER THE ROOM-1 LESSON, then measure what is left ------------------
// Room 1 teaches two things and stops the world for the first of them, so it
// is no longer a room that runs at full speed from the first frame. What it
// must still be is a room that stops for NOTHING ELSE: the mode used to slow
// itself whenever a round was inbound — inside 1.1s, passing within 2.6m — a
// real rule and an invisible one, which read as the world slowing at random.
// So: answer the lesson the way a player does, then watch.
const room1 = await page.evaluate(async () => {
  const t = window.__ts, C = 4;
  const L = t.hall().legs[t.hall().cur];
  const home = { x: L.spine[0][0] * C, z: L.spine[0][1] * C };
  const taught = { froze: false, gunHeld: false };
  // ...the dodge half: stand until it stops the world, then step aside
  let t0 = performance.now();
  while (performance.now() - t0 < 30000 && t.simpleState().coach !== 'dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x; t.player.pos.z = home.z;
    if (!t.simpleState().gun) taught.gunHeld = true;
  }
  taught.froze = t.simpleState().coach === 'dodge';
  t0 = performance.now();
  while (performance.now() - t0 < 8000 && t.simpleState().coach === 'dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x + 1.6;
  }
  // ...and the shooting half, which is answered by a body coming apart rather
  // than by a trigger pull: a shot that hits nothing is the gesture without
  // its consequence, and the card knows the difference.
  t0 = performance.now();
  while (performance.now() - t0 < 12000 && t.simpleState().coach === 'aim') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const m = t.enemies.find((e) => e.alive);
    if (m) t.fireAt(m.pos.x, 1.25, m.pos.z);
  }
  // NOW measure: with the lesson answered, nothing may move the clock but the
  // player.
  let slowest = 1, rounds = 0;
  const seen = new WeakSet();
  t0 = performance.now();
  while (performance.now() - t0 < 14000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    for (const b of t.bullets) {
      if (!b.fromPlayer && !seen.has(b)) { seen.add(b); rounds++; }
    }
    if (t.simpleState().coach === 'done') slowest = Math.min(slowest, t.simpleState().timeScale);
  }
  return { slowest: +slowest.toFixed(3), rounds, ...taught,
    said: t.simpleState().said, room: t.hall().doorsPassed + 1 };
});
console.log('room 1 lesson: froze=' + room1.froze + ' gun held back=' + room1.gunHeld
  + ' said ' + JSON.stringify(room1.said));
console.log('room 1 after it, ' + room1.rounds + ' rounds fired: slowest world speed '
  + room1.slowest);
if (!room1.froze) bad('the room-1 lesson never stopped the world for its first round');
if (!room1.gunHeld) bad('the pistol was on screen before the lesson handed it over');
if (!room1.rounds) console.log('  (nobody fired — that check measured nothing)');
if (room1.rounds && room1.slowest < 0.9) {
  bad('room 1 still slows itself once the lesson is done: ' + room1.slowest);
}

// ---- walk the run until the button is the player's ------------------------
const arrived = await page.evaluate(async () => {
  const t = window.__ts;
  const up = () => { const b = document.getElementById('timebtn');
    return !!(b.offsetWidth || b.offsetHeight); };
  let guard = 0;
  while (!up() && guard++ < 14) {
    t.crossDoor();
    for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
  }
  // THE COACH'S "BEFORE", READ HERE. It used to be read after the room had
  // been left to run, and a room fires within a second of you arriving in it,
  // so "the coach is up before anybody has fired" was reporting the coach
  // doing its job. The honest moment is the frame the button appears: nothing
  // can have started the lesson yet, because the lesson needs the button.
  const c = document.getElementById('duelcoach');
  const before = { text: c.textContent.trim(), on: c.classList.contains('on'),
    coach: t.simpleState().coach };
  await new Promise((r) => setTimeout(r, 900));
  return { room: t.hall().doorsPassed + 1, rooms: guard, before };
});
const r2 = await look();
console.log('the button arrives in room ' + arrived.room + ': ' + JSON.stringify(r2));
if (arrived.room <= 1) bad('the button is up in room 1, which is the introduction');
if (!r2.btn) bad('the button never arrived, across ' + arrived.rooms + ' rooms');
if (!r2.juice) bad('the button is not wearing its own meter');
if (!r2.meter) bad('the bank meter is not shown');
if (r2.meterH < 10) bad('the meter is the thin tunnel bar, not the big one: ' + r2.meterH + 'px');
await page.screenshot({ path: OUT + 'duel-button.png' });

// ---- the coach: the first round fired stops the world and names the button -
const READ = `() => {
  const c = document.getElementById('duelcoach');
  const t = window.__ts;
  const pins = [...document.querySelectorAll('#duelpins i')]
    .filter((p) => p.classList.contains('on')).length;
  return { text: c.textContent.trim(), on: c.classList.contains('on'),
    atbtn: c.classList.contains('atbtn'), atmeter: c.classList.contains('atmeter'),
    scale: t.simpleState().timeScale, coach: t.simpleState().coach,
    pins, tap: document.getElementById('dueltap').classList.contains('on') };
}`;
const readCoach = () => page.evaluate('(' + READ + ')()');
const before = arrived.before;
// let the room fire at them — nobody is killed, so a round is coming
await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 25000 && t.simpleState().coach !== 'tap') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
  }
  // ...and let the freeze settle to a true stop
  for (let i = 0; i < 40; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
});
const held = await readCoach();
await page.screenshot({ path: OUT + 'duel-coach-tap.png' });
// answer it the way a player does
await page.evaluate(async () => {
  document.getElementById('timebtn').dispatchEvent(new PointerEvent('pointerdown',
    { pointerId: 99, clientX: 340, clientY: 700, bubbles: true }));
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => requestAnimationFrame(r)); window.__ts.player.iframes = 999;
  }
});
const answered = await readCoach();
console.log('coach before:   ' + JSON.stringify(before));
console.log('coach held:     ' + JSON.stringify(held));
console.log('coach answered: ' + JSON.stringify(answered));
if (before.on) bad('the coach is up before anybody has fired');
if (held.coach !== 'tap') bad('the first round fired did not start the button lesson');
if (!held.on || !held.atbtn) bad('the prompt is not on the button');
if (!/TAP TO SLOW/.test(held.text)) bad('the prompt does not say what to do: ' + held.text);
if (held.scale > 0.001) bad('the world did not actually stop: scale ' + held.scale);
if (!answered.on || !answered.atmeter) bad('the meter line did not follow the tap');
if (!/REFILL/.test(answered.text)) bad('the second line is not about refilling: ' + answered.text);
// ...AND IT IS PAIRED WITH THE SHOOTING CUE. The meter line asks the player to
// shatter and says nothing about how, at the one moment the world has slowed
// down to let them. Stopping time and taking a shot are one idea, so both
// halves have to be in frame together.
if (!answered.tap) bad('the button lesson says SHATTER and puts no thumb on anybody');
if (!answered.pins) bad('the button lesson says SHATTER and rings nobody');
if (answered.scale <= 0.001) bad('answering the prompt did not let the world move again');
await page.screenshot({ path: OUT + 'duel-coach.png' });

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
// A BAND, NOT A NUMBER. What matters is that the world genuinely slows and
// that it stays playable: 0.13 shipped once, and at that speed a room-1 round
// takes 23 seconds to cross the strip against a bank that holds ten.
if (spend.slowest > 0.45) bad('pressing the button did not slow the world: ' + spend.slowest);
if (spend.slowest < 0.15) bad('slow time is slower than the meter can pay for: ' + spend.slowest);

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
// ---- and it never hands you a knife you cannot reach anybody with ---------
// There is no forward control here: the drops fall 15-24 m away on the spine
// and the corridor only carries you once the room is CLEAR, which needs the
// gun you just ran out of. So running dry is not a hard beat, it is a room
// that cannot be finished.
const dry2 = await page.evaluate(async () => {
  const t = window.__ts;
  t.player.clips = 0;
  let fired = 0;
  const t0 = performance.now();
  // empty the magazine and keep pulling
  while (performance.now() - t0 < 14000 && fired < 40) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.fire(); fired++;
  }
  await new Promise((r) => setTimeout(r, 2500));
  return { weapon: t.player.weapon, mag: t.player.mag, clips: t.player.clips,
    hud: (document.getElementById('ammo') || {}).textContent || '' };
});
console.log('after emptying the gun: ' + JSON.stringify(dry2));
if (dry2.weapon === 'knife') bad('the duel dropped the player to a knife they cannot reach anybody with');
if (/\+/.test(dry2.hud)) bad('the duel is counting spare clips it does not spend: ' + dry2.hud);

done('duelbtn', errs);
await browser.close();
