import { boot, done } from './lib.mjs';
// HOW HOT IS THE ROOM — the numbers a player actually feels, room by room.
//
// The schedule (test/duelramp.mjs) says what the dials are SET to. This says
// what that comes out as in front of somebody standing there: how fast a round
// crosses the gap, how far away it is fired from, and — the one that decides
// whether the time button is a luxury or the answer — HOW MANY ROUNDS ARE IN
// THE AIR AT ONCE.
//
// It exists because "still too easy at doors 6 to 8" was reported twice, and
// both times the schedule looked right on paper. Two guns every four seconds
// over fifteen metres is two dials that read as a ramp and a room that plays
// as a wait.
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

// FIRST, ANSWER THE OPENING LESSON. Room 1 holds every gun in the room while
// TAP HERE TO SHOOT is up — that is the point of it — so a probe that walks
// past it measures a floor of men who are being told not to shoot.
await page.evaluate(async () => {
  const t = window.__ts;
  const t0 = performance.now();
  while (performance.now() - t0 < 30000 && !t.simpleState().taught) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x += 0.06;                        // answers DODGE THIS
    const m = t.enemies.find((e) => e.alive);
    if (m) t.fireAt(m.pos.x, 1.25, m.pos.z);       // ...and TAP HERE TO SHOOT
  }
  // ...AND SPEND ITS SECOND TELLING TOO. The dodge line may be said twice, and
  // the second one stops the world for twelve real seconds in whatever room it
  // lands in. A probe that stands still is exactly the player who earns it, so
  // it would land in the middle of a measurement and quietly halve the room
  // it was measuring. Draw it here, answer it, and the lesson is spent.
  t.warpDoor(2);
  const t1 = performance.now();
  while (performance.now() - t1 < 25000 && t.simpleState().said.dodge < 2) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
  }
  const t2 = performance.now();
  while (performance.now() - t2 < 4000 && t.simpleState().coach === 'dodge') {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x += 0.06;
  }
});

// Stand still on the spine and take it, for a stretch of WORLD seconds — the
// box runs the world at about four fifths of real time, so a wall-clock budget
// silently measures a shorter room than it says. Nothing is killed: the floor
// is the room's own, and killing it leaves an empty one that never refills.
const ROOMS = [4, 5, 6, 8, 15];
const heat = await page.evaluate(async (rooms) => {
  const t = window.__ts, C = 4;
  const out = [];
  for (const r of rooms) {
    t.warpDoor(r);
    await new Promise((x) => setTimeout(x, 700));
    const L = t.hall().legs[t.hall().cur];
    const home = { x: L.spine[0][0] * C, z: L.spine[0][1] * C };
    let air = 0, speeds = [], fired = [], shots = 0;
    const seen = new Set();
    const w0 = t.worldClock().now;
    while (t.worldClock().now - w0 < 46) {
      await new Promise((x) => requestAnimationFrame(x));
      t.player.iframes = 999;
      t.player.pos.x = home.x; t.player.pos.z = home.z;
      // ...AND SHOOT WHAT REACHES YOU. A player who never fires is not a
      // measurement of the room, it is a measurement of a pile-up: men inside
      // a metre and a half switch to melee and STOP SHOOTING, so a stationary
      // probe that lets them arrive ends up standing in a scrum that fires
      // three rounds in forty-six seconds. Room 5 read as the quietest room in
      // the mode for exactly that reason.
      // ...BUT ONLY WHILE THERE ARE MORE COMING. Clearing the floor with an
      // empty queue behind it wins the room, and `warpDoor` moves the room
      // NUMBER and not the fight — so every room after this one measured an
      // empty strip and reported the mode as firing nothing at all.
      if (t.game.spawnQueue.length) {
        const near = t.enemies.findIndex((e) => e.alive
          && Math.hypot(e.pos.x - home.x, e.pos.z - home.z) < 3.2);
        if (near >= 0) t.killAt(near);
      }
      const inc = t.bullets.filter((b) => !b.fromPlayer);
      if (inc.length > air) air = inc.length;
      for (const b of inc) {
        if (seen.has(b.seq)) continue;
        seen.add(b.seq);
        shots++;
        speeds.push(Math.hypot(b.vel.x, b.vel.z));
        fired.push(Math.hypot(b.born.x - home.x, b.born.z - home.z));
      }
    }
    const med = (a) => (a.length ? a.slice().sort((p, q) => p - q)[a.length >> 1] : 0);
    const p = t.simpleState().plan;
    out.push({ r, volley: p.volley, gap: p.gap, shots,
      air,                                   // most rounds in the air at once
      speed: +med(speeds).toFixed(1),
      from: +med(fired).toFixed(1),
      // ...AND THE FURTHEST ANY ROUND WAS FIRED FROM. The median is the room
      // in its steady state, which for a player who never moves and never
      // kills is a floor of men who have all walked to the hold line. This is
      // the other half of the same story: a man's FIRST round comes from
      // wherever he is standing, and it is that number the engage cap is
      // about.
      open: +(fired.length ? Math.max(...fired) : 0).toFixed(1),
      flight: +(med(fired) / Math.max(1e-6, med(speeds))).toFixed(2) });
  }
  return out;
}, ROOMS);

console.log('room  set to        shots  most in air  m/s   opens from  closes to  flight');
for (const h of heat) {
  console.log(String(h.r).padStart(4) + '  ' + (h.volley + ' every ' + h.gap + 's').padEnd(13)
    + String(h.shots).padStart(5) + String(h.air).padStart(13)
    + String(h.speed).padStart(6) + String(h.open).padStart(12) + ' m'
    + String(h.from).padStart(10) + ' m'
    + String(h.flight).padStart(7) + ' s');
}

const at = (r) => heat.find((h) => h.r === r);
// DOOR 5 IS WHERE THE MODE GETS HARD. Three guns firing together, from about
// sixty per cent of the way across the strip, with rounds that cross it in
// well under a second — so that the button arriving at door 6 is the answer
// to a question the player has already been asked.
if (at(5).air < 3) bad('door 5 never has three rounds in the air: ' + at(5).air);
if (at(5).from > 12) bad('door 5 is still fired from ' + at(5).from + ' m');
if (at(5).flight > 1.2) bad('door 5 rounds are in the air ' + at(5).flight + ' s — a stroll');
// ...AND DOOR 6 HOLDS IT. The button is the new thing in that room, so nothing
// else may be.
if (at(6).air < 3) bad('door 6 eased off: ' + at(6).air + ' rounds in the air');
if (at(6).volley !== at(5).volley || at(6).gap !== at(5).gap) {
  bad('door 6 is not the room before it with a button in it');
}
// ...AND THE MODE GOES ON PAST IT. Not room by room — a debut deliberately
// steps the fire dial back, so room 8 is cooler than room 5 and that is the
// sawtooth working — but the TOP of a later cycle has to beat it, or the
// opening is the hardest the game ever gets.
if (at(15).air < at(5).air) bad('the mode is at its hottest in room 5 and never again');
if (at(15).speed <= at(5).speed) bad('rounds stopped getting faster after the opening');
// ...and nobody is plinking from the far wall any more.
if (at(5).from > 12) bad('door 5 rounds are still fired from ' + at(5).from + ' m');
// ...but they still OPEN from range and walk in, which is the thing the player
// watches happen. A room where every round is point blank never closed in.
if (at(5).open < 8) bad('nobody opened from range at door 5: ' + at(5).open + ' m');

done('duelheat', errs);
await browser.close();
