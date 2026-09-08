import { boot, done, OUT } from './lib.mjs';
// THE ROOM-1 LESSON, played rather than described.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught','1'); localStorage.setItem('ts_deepest_door','40');
  localStorage.setItem('ts_s0_used','1'); localStorage.setItem('ts_s0_mode','hall');
  localStorage.setItem('ts_s0_doors','40'); localStorage.setItem('ts_s0_rdoor','1');
  localStorage.setItem('ts_s0_at',String(now-3e5)); localStorage.setItem('ts_s0_born',String(now-9e6));
  localStorage.setItem('ts_saves',JSON.stringify([{i:0,name:'',num:1,mode:'hall'}]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1700);
await page.tap('#startnew'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(1200);

const read = () => page.evaluate(() => {
  const t = window.__ts, m = document.getElementById('duelmeet');
  const s = t.simpleState();
  const pins = [...document.querySelectorAll('#duelpins i')].filter((p) => p.classList.contains('on'));
  return { coach: s.coach, scale: s.timeScale, said: s.said, gun: s.gun, tap: s.tap,
    card: m.classList.contains('on'), noname: m.classList.contains('noname'),
    what: m.querySelector('.what').textContent.trim(),
    who: m.querySelector('.who').textContent.trim(),
    cue: m.classList.contains('right') ? 'right' : m.classList.contains('left') ? 'left'
      : m.classList.contains('tap') ? 'press' : '',
    stick: getComputedStyle(m.querySelector('.stk')).display !== 'none',
    pins: pins.length, room: t.hall().doorsPassed + 1 };
});

// ---- the gun is not on screen yet ----------------------------------------
const start = await read();
console.log('on arrival:      ' + JSON.stringify(start));
if (start.gun) bad('the pistol is on screen before the lesson has said anything');

// ---- hold still and let the first round come -----------------------------
await page.evaluate(async () => {
  const t = window.__ts, C = 4;
  const L = t.hall().legs[t.hall().cur];
  const home = { x: L.spine[0][0]*C, z: L.spine[0][1]*C };
  window.__home = home;
  t.player.pos.x = home.x; t.player.pos.z = home.z;
  const t0 = performance.now();
  while (performance.now() - t0 < 30000 && t.simpleState().coach !== 'dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x; t.player.pos.z = home.z;
  }
  for (let i = 0; i < 40; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
});
const held = await read();
console.log('first round:     ' + JSON.stringify(held));
await page.screenshot({ path: OUT + 'duel-school-dodge.png' });
if (held.coach !== 'dodge') bad('the first round did not stop the world');
if (held.scale > 0.001) bad('the world did not actually stop: ' + held.scale);
if (!held.card) bad('nothing was said');
if (!held.noname) bad('the lesson card is wearing a name row it has nothing to put in');
if (held.who) bad('the lesson card is naming something: ' + JSON.stringify(held.who));
if (!/^DODGE/.test(held.what)) bad('it does not say dodge: ' + JSON.stringify(held.what));
if (!held.pins) bad('the round it means is not ringed');
if (held.cue !== 'left' && held.cue !== 'right') bad('no thumb direction: ' + held.cue);
if (held.gun) bad('the pistol is on screen during the dodge beat');

// ---- step aside: the pistol arrives with the second half ------------------
await page.evaluate(async () => {
  const t = window.__ts, home = window.__home;
  const t0 = performance.now();
  while (performance.now() - t0 < 6000 && t.simpleState().coach === 'dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x + 1.6;
  }
  for (let i = 0; i < 30; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; }
});
const armed = await read();
console.log('after dodging:   ' + JSON.stringify(armed));
await page.screenshot({ path: OUT + 'duel-school-shoot.png' });
if (armed.coach !== 'aim') bad('dodging did not bring on the shooting half: ' + armed.coach);
if (armed.scale <= 0.001) bad('the shooting half froze the world; the pistol has to ARRIVE');
if (!armed.gun) bad('the pistol never appeared');
if (!/TAP/.test(armed.what)) bad('it does not say tap: ' + JSON.stringify(armed.what));
if (!armed.pins) bad('the man it means is not ringed');
if (!armed.tap) bad('no thumb on the man');
if (armed.cue !== 'press') bad('the card shows a swipe under a TAP instruction: ' + armed.cue);
if (armed.stick) bad('a thumb on the card AND a thumb on the man: two places, one instruction');

// ---- firing puts it away --------------------------------------------------
await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 4000 && t.simpleState().coach === 'aim') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.fire();
  }
  await new Promise((r) => setTimeout(r, 400));
});
const after = await read();
console.log('after shooting:  ' + JSON.stringify(after));
if (after.coach === 'aim') bad('shooting did not answer the card');
if (after.card) bad('the card survived the shot that answered it');
if (after.tap) bad('the thumb survived the shot that answered it');
if (after.said.dodge !== 1 || after.said.shoot !== 1) {
  bad('the lesson has been said the wrong number of times: ' + JSON.stringify(after.said));
}
// ---- ...AND IT IS SAID AGAIN ONLY IF IT WAS NOT TAKEN --------------------
// Stand in the lane of a round and do nothing. That is the one thing that
// earns hearing it twice.
const again = await page.evaluate(async () => {
  const t = window.__ts, home = window.__home;
  const t0 = performance.now();
  while (performance.now() - t0 < 30000 && t.simpleState().coach !== 'dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x; t.player.pos.z = home.z;
  }
  return { coach: t.simpleState().coach, said: t.simpleState().said };
});
console.log('stood still:     ' + JSON.stringify(again));
if (again.coach !== 'dodge') bad('standing in a round\'s lane did not bring the dodge back');
if (again.said.dodge !== 2) bad('the dodge count is ' + again.said.dodge + ', not 2');

// ...and NEVER a third time. Twice is the ceiling.
const third = await page.evaluate(async () => {
  const t = window.__ts, home = window.__home;
  let t0 = performance.now();
  while (performance.now() - t0 < 6000 && t.simpleState().coach === 'dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x + 1.6;
  }
  t0 = performance.now();
  while (performance.now() - t0 < 25000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x; t.player.pos.z = home.z;   // stand in it again
  }
  return { coach: t.simpleState().coach, said: t.simpleState().said };
});
console.log('stood still x3:  ' + JSON.stringify(third));
if (third.said.dodge > 2) bad('the lesson is nagging: dodge said ' + third.said.dodge + ' times');
if (third.coach === 'dodge') bad('a third round stopped the world again');

// ---- a room crossed with nothing shattered brings the trigger back -------
// ...which by now it already has: the room the shooting half was answered in
// was cleared, the corridor carried us through, and the room after it went by
// with nothing shattered in it. That is the rule, and `said.shoot` at 2 is it
// having fired. What is left to prove is the CEILING — that two more rooms of
// shattering nothing do not produce a third telling.
const ceiling = await page.evaluate(async () => {
  const t = window.__ts, C = 4;
  for (let pass = 0; pass < 2; pass++) {
    for (let k = t.enemies.length - 1; k >= 0; k--) t.killAt(k);
    t.crossDoor();
    for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r));
    const L = t.hall().legs[t.hall().cur];
    const home = { x: L.spine[0][0] * C, z: L.spine[0][1] * C };
    t.player.pos.x = home.x; t.player.pos.z = home.z;
    const t0 = performance.now();
    while (performance.now() - t0 < 9000) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
      t.player.pos.x = home.x; t.player.pos.z = home.z;
    }
  }
  return { coach: t.simpleState().coach, said: t.simpleState().said,
    room: t.hall().doorsPassed + 1 };
});
console.log('two more rooms:  ' + JSON.stringify(ceiling));
if (ceiling.said.shoot !== 2) {
  bad('the shoot count is ' + ceiling.said.shoot + ', and two is the ceiling');
}
if (ceiling.said.dodge > 2) bad('the dodge count is ' + ceiling.said.dodge);
if (ceiling.coach === 'aim' || ceiling.coach === 'dodge') {
  bad('the lesson is still talking in room ' + ceiling.room);
}

done('duelschool', errs);
await browser.close();
