import { boot, done, OUT } from './lib.mjs';
// MEETING A NEW TYPE STOPS THE WORLD.
//
// A debut room exists to introduce one thing, so the first act of that thing —
// its first round, or for the rusher the frame it plants and coils, which is
// the only tell it gives — freezes the world, names it, and says the one rule
// that beats it. Dodging releases it, because dodging is what the card asked
// for and the only control this mode has.
//
// The card is pinned over the silhouette rather than floating mid-screen: the
// name belongs to a body — and the card is ONLY the name. The instruction is
// a thumb crossing the stick the way the player has to go, because this mode
// has one control and a gesture survives a glance where a sentence does not.
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
await page.tap('#startnew');
await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2000);

// which rooms debut which type, straight from the schedule
const debuts = await page.evaluate(() => {
  const out = [];
  for (let r = 1; r <= 24; r++) {
    window.__ts.warpDoor(r);
    const p = window.__ts.simpleState().plan;
    if (p.fresh) out.push({ room: r, type: p.fresh });
  }
  return out;
});
console.log('debut rooms: ' + debuts.map((d) => d.room + '=' + d.type).join(', '));
if (debuts.length < 2) bad('the schedule debuts fewer than two types in 24 rooms');

// ...and the button must already be the player's before any of them
const btnRoom = await page.evaluate(() => {
  for (let r = 1; r <= 24; r++) {
    window.__ts.warpDoor(r);
    if (window.__ts.simpleState().plan && document.getElementById('timebtn')) {
      const on = window.__ts.simpleState().room >= 0;
      if (on && getComputedStyle(document.getElementById('timebtn')).display !== 'none') return r;
    }
  }
  return 99;
});
console.log('the time button first appears in room ' + btnRoom);
if (btnRoom >= debuts[0].room) {
  bad('the button arrives at room ' + btnRoom + ', not before the first debut at '
    + debuts[0].room + ' — a debut says dodge and the button is what makes that possible');
}

// ...and now WALK there, one door at a time.
//
// `warpDoor` moves the room number and nothing else — the fight standing in
// front of you is still the one the last composition built. That is fine for
// reading a schedule and useless for meeting a type, which is a question about
// who is actually released. This probe reported "the debut never freezes" for
// exactly that reason while the game was doing it correctly. So: cross the
// doors, which is what a player does, and every room composes its own wave.
const walkTo = async (room) => page.evaluate(async (want) => {
  const t = window.__ts;
  let guard = 0;
  while (t.hall().doorsPassed + 1 < want && guard++ < 80) {
    t.crossDoor();
    for (let i = 0; i < 4; i++) await new Promise((x) => requestAnimationFrame(x));
    t.player.iframes = 999;
  }
  return t.hall().doorsPassed + 1;
}, room);

await page.evaluate(() => window.__ts.warpDoor(1));
const seen = [];
let shot = false;
for (const d of debuts.slice(0, 3)) {
  const at = await walkTo(d.room);
  if (at !== d.room) bad('could not reach room ' + d.room + ', stopped at ' + at);
  const r = await page.evaluate(async (room) => {
    const t = window.__ts, C = 4;
    await new Promise((x) => setTimeout(x, 700));
    const L = t.hall().legs[t.hall().cur];
    const home = { x: L.spine[0][0] * C, z: L.spine[0][1] * C };
    t.player.pos.x = home.x; t.player.pos.z = home.z;
    const card = () => {
      const c = document.getElementById('duelcoach'), g = document.getElementById('dueldodge');
      const box = c.getBoundingClientRect();
      return { on: c.classList.contains('on'), atman: c.classList.contains('atman'),
        text: c.textContent.trim(),
        cue: g.classList.contains('on')
          ? (g.classList.contains('right') ? 'right' : g.classList.contains('left') ? 'left' : '?')
          : '',
        x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
    };
    // hold your end and wait for the new thing to do its first thing
    const t0 = performance.now();
    while (performance.now() - t0 < 40000 && t.simpleState().coach !== 'meet') {
      await new Promise((x) => requestAnimationFrame(x));
      t.player.iframes = 999;
      t.player.pos.x = home.x; t.player.pos.z = home.z;
    }
    for (let i = 0; i < 40; i++) {
      await new Promise((x) => requestAnimationFrame(x));
      t.player.iframes = 999;
      t.player.pos.x = home.x; t.player.pos.z = home.z;
    }
    const held = { ...card(), scale: t.simpleState().timeScale,
      coach: t.simpleState().coach, meet: t.simpleState().meet };
    // HOLD IT THERE while the picture is taken. The screenshot used to come
    // after the whole loop, so every capture of the debut card was of a
    // screen the card had already left.
    window.__holdMeet = async () => {
      const t2 = performance.now();
      while (performance.now() - t2 < 6000 && window.__ts.simpleState().coach === 'meet') {
        await new Promise((x) => requestAnimationFrame(x));
        window.__ts.player.iframes = 999;
        window.__ts.player.pos.x = home.x; window.__ts.player.pos.z = home.z;
      }
    };
    return { held, home };
  }, d.room);
  if (r.held.coach === 'meet' && !shot) {
    shot = true;
    const hold = page.evaluate(() => window.__holdMeet());
    await page.waitForTimeout(250);
    await page.screenshot({ path: OUT + 'duel-meet.png' });
    await hold.catch(() => {});
  }
  const r2 = await page.evaluate(async (home) => {
    const t = window.__ts;
    const card = () => {
      const c = document.getElementById('duelcoach'), g = document.getElementById('dueldodge');
      return { on: c.classList.contains('on'),
        cue: g.classList.contains('on')
          ? (g.classList.contains('right') ? 'right' : g.classList.contains('left') ? 'left' : '?')
          : '' };
    };
    // ...and dodging is what answers it
    // ...and we go the way the thumb went: screen-right is +x or -x depending
    // on which way the corridor faces, so the cue is converted rather than
    // assumed.
    const wx = (t.simpleState().dir || 1) * Math.cos(t.player.yaw);
    const t1 = performance.now();
    while (performance.now() - t1 < 4000 && t.simpleState().coach === 'meet') {
      await new Promise((x) => requestAnimationFrame(x));
      t.player.iframes = 999;
      t.player.pos.x = home.x + wx * 1.6;
    }
    await new Promise((x) => setTimeout(x, 400));
    return { ...card(), scale: t.simpleState().timeScale,
      coach: t.simpleState().coach };
  }, r.home);
  r.after = r2;
  seen.push({ d, r });
  console.log('room ' + d.room + ' (' + d.type + '):');
  console.log('   held:  ' + JSON.stringify(r.held));
  console.log('   after dodging: coach=' + r.after.coach + ' card '
    + (r.after.on ? 'STILL UP' : 'gone') + ' scale ' + r.after.scale);
  if (r.held.coach !== 'meet') { bad(d.type + ' never stopped the world on its debut'); continue; }
  if (r.held.scale > 0.001) bad(d.type + ' froze but the world kept moving: ' + r.held.scale);
  if (!r.held.on) bad(d.type + ' froze without a card');
  if (!r.held.atman) bad(d.type + '’s card is not pinned to the body it names');
  if (r.held.text.toUpperCase() !== d.type.toUpperCase()) {
    bad(d.type + '’s card says more than its name: ' + JSON.stringify(r.held.text));
  }
  if (r.held.cue !== 'left' && r.held.cue !== 'right') {
    bad(d.type + ' froze without a thumb showing which way to go: '
      + JSON.stringify(r.held.cue));
  }
  if (r.after.on) bad(d.type + '’s card survived the dodge that was supposed to answer it');
  if (r.after.cue) bad(d.type + '’s thumb coach survived the dodge it asked for');
  if (r.after.scale <= 0.001) bad(d.type + ': dodging did not let the world move again');
}
// ...and it is once per type, not once per body
const again = await page.evaluate(async () => {
  const t = window.__ts;
  const before = t.simpleState().met.slice();
  const t0 = performance.now();
  while (performance.now() - t0 < 12000 && t.simpleState().coach !== 'meet') {
    await new Promise((x) => requestAnimationFrame(x));
    t.player.iframes = 999;
  }
  return { before, coach: t.simpleState().coach };
});
console.log('types already met: ' + JSON.stringify(again.before));
if (again.coach === 'meet') bad('a type that has already been introduced froze the world again');
done('duelmeet', errs);
await browser.close();
