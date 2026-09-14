import { boot, done, OUT } from './lib.mjs';
// THE RUSHER HOLDS ITS DISTANCE, BREAKS IT TO ATTACK, AND BACKS OFF AGAIN.
//
// There is no look control in this mode, so a man standing on you cannot be
// answered — you cannot turn to him and you cannot step round him. That rule
// applies to the rusher too, with the one obvious exception: its whole act is
// arriving, so it charges. What it must not do is stay there afterwards, claws
// down, inside the distance everybody else has to respect.
//
// So the cycle this checks is: hold at the stand-off, coil, charge through it,
// and walk back out to it before coiling again.
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

// A rusher on its own, so the trace is one man's cycle rather than a crowd's.
// The room is given to it directly: what is being checked is a type's
// behaviour, not the schedule that eventually deals it.
const run = await page.evaluate(async () => {
  const t = window.__ts, C = 4;
  const MIN = t.duelMinM();
  // answer the opening lesson first — it holds the room's fire and freezes
  const t0 = performance.now();
  while (performance.now() - t0 < 30000 && !t.simpleState().taught) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x += 0.06;
    const m = t.enemies.find((e) => e.alive);
    if (m) t.fireAt(m.pos.x, 1.25, m.pos.z);
  }
  for (let k = t.enemies.length - 1; k >= 0; k--) t.killAt(k);
  t.game.spawnQueue.length = 0;
  const L = t.hall().legs[t.hall().cur];
  const home = { x: L.spine[0][0] * C, z: L.spine[0][1] * C };
  t.player.pos.x = home.x; t.player.pos.z = home.z;
  for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r));
  t.spawnEnemy('rusher');

  // Trace it. Standing still on purpose: the charge commits to where you WERE,
  // so a probe that dodges never sees one land and never sees the retreat.
  const trace = [];
  const t1 = performance.now();
  while (performance.now() - t1 < 60000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    t.player.pos.x = home.x; t.player.pos.z = home.z;
    t.game.spawnQueue.length = 0;
    const e = t.enemies.find((x) => x.alive && x.type === 'rusher');
    if (!e) break;
    trace.push({ st: e.state, at: performance.now(),
      d: +Math.hypot(e.pos.x - home.x, e.pos.z - home.z).toFixed(2) });
  }
  return { MIN, trace, hits: t.game.hits || 0 };
});

const MIN = run.MIN;
const tr = run.trace;
console.log(`stand-off ${MIN} m, ${tr.length} frames traced`);
if (!tr.length) { bad('the rusher never appeared'); done('duelrush', errs); await browser.close(); }

// ---- what states did it go through, and how near was it in each? ---------
const byState = {};
for (const f of tr) {
  const b = byState[f.st] || (byState[f.st] = { n: 0, min: 1e9, max: 0 });
  b.n++; b.min = Math.min(b.min, f.d); b.max = Math.max(b.max, f.d);
}
console.log('');
console.log('state        frames   nearest   furthest');
for (const [k, v] of Object.entries(byState)) {
  console.log(k.padEnd(12) + String(v.n).padStart(6)
    + v.min.toFixed(2).padStart(10) + v.max.toFixed(2).padStart(11));
}

// IT MUST ACTUALLY CHARGE. A stand-off the rusher cannot break is a rusher
// that has stopped being a rusher.
const charges = tr.filter((f, i) => f.st === 'lunge' && (i === 0 || tr[i - 1].st !== 'lunge'));
console.log('');
console.log('charges: ' + charges.length);
if (!charges.length) bad('the rusher never charged — it has been fenced out of its own attack');
if (!byState.windup) bad('the rusher never coiled: no tell, nothing to read');

// ...AND IT MUST GET THERE. A charge that stops short is a telegraph with no
// consequence, and the player learns to ignore it.
const reached = Math.min(...tr.filter((f) => f.st === 'lunge' || f.st === 'lungerest')
  .map((f) => f.d).concat([99]));
console.log('closest the charge got: ' + reached.toFixed(2) + ' m');
if (reached > 2.0) bad('the charge stopped ' + reached.toFixed(2) + ' m out — it never arrives');

// ...AND IT MUST NOT STAY THERE. It has to pass THROUGH the inside of the
// stand-off on its way in and out, so counting frames spent there proves
// nothing — the question is whether any single visit LASTS. Measured in
// seconds, not frames: a charge plus the rest plus the walk back is one visit,
// and it is the length of that visit the player feels as "I could not get away
// from him".
let run0 = null, longest = 0;
for (const f of tr) {
  const inside = f.d < MIN - 1.5;
  if (inside && run0 === null) run0 = f.at;
  if (!inside && run0 !== null) { longest = Math.max(longest, f.at - run0); run0 = null; }
}
if (run0 !== null) longest = Math.max(longest, tr[tr.length - 1].at - run0);
console.log('longest unbroken visit inside the stand-off: ' + (longest / 1000).toFixed(2) + ' s');
if (longest > 2600) {
  bad('it stayed inside the stand-off for ' + (longest / 1000).toFixed(2)
    + ' s — that is not an attack, that is standing on you');
}

// ...AND BETWEEN CHARGES IT IS BACK OUT AT ITS LINE. Take the distance at each
// windup: that is where it chose to coil from.
const coils = tr.filter((f, i) => f.st === 'windup' && (i === 0 || tr[i - 1].st !== 'windup'));
console.log('coiled from: ' + coils.map((f) => f.d.toFixed(2)).join(', ') + ' m');
for (const c of coils) {
  if (c.d < MIN - 1.2) {
    bad('it coiled from ' + c.d.toFixed(2) + ' m, inside the ' + MIN + ' m stand-off — '
      + 'it charged again without backing off first');
  }
}
if (coils.length < 2) {
  console.log('  (only one coil seen — the retreat between charges was not exercised)');
}
await page.screenshot({ path: OUT + 'duel-rush.png' });

done('duelrush', errs);
await browser.close();
