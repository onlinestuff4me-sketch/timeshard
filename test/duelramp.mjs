import { boot, done } from './lib.mjs';
// NO RETREAT RAMPS ON THREE DIALS, AND ONLY ONE OF THEM MOVES PER ROOM.
//
//   BODIES  how many men, as groups that ascend within the room
//   FIRE    how many shoot together, and how long the room waits after
//   CAST    which types are in the mix
//
// A new type arrives ALONE — gunners fill every other slot — in a room made
// quieter than the one just cleared, so the new thing is the only new thing.
// Two types that have each had a cycle then MEET, for a couple of rooms with
// every other dial held steady, because there the pairing is what is new.
//
// The schedule is walked forward from room 1 rather than solved, so this probe
// reads it out of the running game and checks the shape rather than the
// arithmetic — and then checks that the guns actually do what it says.
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

const N = 24;
const rows = await page.evaluate((n) => {
  const out = [];
  for (let r = 1; r <= n; r++) {
    window.__ts.warpDoor(r);
    const p = window.__ts.simpleState().plan;
    out.push({ r, g: p.groups, n: p.groups.reduce((a, b) => a + b, 0),
      v: p.volley, gap: p.gap, cast: p.cast, fresh: p.fresh, combo: p.combo,
      step: p.step });
  }
  return out;
}, N);

console.log('room  groups     bodies  together  gap    cast');
for (const x of rows) {
  console.log(String(x.r).padStart(4) + '  ' + x.g.join('·').padEnd(9)
    + String(x.n).padStart(6) + String(x.v).padStart(9) + '  ' + String(x.gap).padEnd(5)
    + '  ' + x.cast.join(', ')
    + (x.fresh ? '   <-- NEW: ' + x.fresh : x.combo ? '   <-- COMBINATION' : ''));
}

// ---- the shape of the schedule -------------------------------------------
for (const x of rows) {
  const asc = x.g.every((v, i) => i === 0 || v >= x.g[i - 1]);
  if (!asc) bad('room ' + x.r + ' does not build: ' + x.g.join('·'));
  if (Math.max(...x.g) > 5) bad('room ' + x.r + ' has a group over 5: ' + x.g.join('·'));
  if (x.v > 3) bad('room ' + x.r + ' fires ' + x.v + ' together; three is the ceiling');
  if (x.cast[0] !== 'gunner') bad('room ' + x.r + ' has no gunners filling it');
}
// ONE DIAL PER ROOM. A debut moves the cast and steps the other two back; a
// combination moves nothing. Every other room moves exactly one.
for (let i = 1; i < rows.length; i++) {
  const a = rows[i - 1], b = rows[i];
  const moved = (b.step.bodies !== a.step.bodies ? 1 : 0)
    + (b.step.fire !== a.step.fire ? 1 : 0);
  if (b.fresh) {
    if (b.step.cast !== a.step.cast + 1) bad('room ' + b.r + ' debuts without advancing the cast');
    if (b.cast.length !== 2) {
      bad('room ' + b.r + ' debuts ' + b.fresh + ' alongside ' + b.cast.join(', ')
        + ' — a debut arrives alone');
    }
  } else if (b.combo) {
    if (moved) bad('the combination at room ' + b.r + ' moved another dial');
    if (b.cast.length < 3) bad('the combination at room ' + b.r + ' is not combining anything');
  } else if (moved !== 1) {
    bad('room ' + b.r + ' moved ' + moved + ' dials; exactly one may move');
  }
}
// ...AND THE PEAKS CLIMB. A cycle that ends no higher than the last one is a
// difficulty curve that is a flat line with decoration on it.
const peaks = [];
let cur = null;
for (const x of rows) {
  if (x.fresh && cur) { peaks.push(cur); cur = null; }
  cur = Math.max(cur || 0, x.n);
}
// ...and the LAST one is dropped, because the window ends mid-cycle and a
// cycle judged before it has finished climbing is judged on its start. This
// probe reported "the ramp is flat" on a fourth cycle that was four rooms old.
if (cur !== null && peaks.length) peaks.push(cur);
const whole = peaks.slice(0, -1);
console.log('peak bodies of each complete cycle: ' + whole.join(' -> ')
  + (peaks.length ? '   (room ' + N + ' is mid-cycle at ' + peaks[peaks.length - 1] + ')' : ''));
for (let i = 1; i < whole.length; i++) {
  if (whole[i] <= whole[i - 1]) {
    bad('cycle ' + (i + 1) + ' peaks at ' + whole[i] + ', no higher than the last ('
      + whole[i - 1] + ') — the ramp is flat');
  }
}
// THE RUSHER WAITS FOR THE BUTTON. It does not shoot, it arrives, and in a
// strip with no back the only answer is to stop the world on its way in.
const rusher = rows.find((x) => x.cast.includes('rusher'));
console.log('rusher first appears in room ' + (rusher ? rusher.r : 'never'));
if (!rusher) bad('the rusher never arrives');
else if (rusher.r <= 2) bad('the rusher arrives at room ' + rusher.r + ', before slow time is the player’s');

// ---- and the guns do what the schedule says -------------------------------
const fired = await page.evaluate(async (rooms) => {
  const t = window.__ts, C = 4, out = [];
  for (const room of rooms) {
    t.warpDoor(room);
    await new Promise((r) => setTimeout(r, 600));
    const L = t.hall().legs[t.hall().cur];
    const home = { x: L.spine[0][0] * C, z: L.spine[0][1] * C };
    t.player.pos.x = home.x; t.player.pos.z = home.z;
    const p = t.simpleState().plan;
    const g0 = t.worldClock().gaps.length;
    const w0 = t.worldClock().now;
    while (t.worldClock().now - w0 < 34) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
      t.player.pos.x = home.x; t.player.pos.z = home.z;   // hold your end
    }
    out.push({ room, want: p.volley, gap: p.gap, gaps: t.worldClock().gaps.slice(g0) });
  }
  return out;
}, [4, 10, 24]);   // singles, pairs, and the first room that fires three

console.log('');
for (const r of fired) {
  // a volley is a run of rounds inside the spread; the room's gap follows it
  const groups = [];
  let n = 1;
  for (const g of r.gaps) { if (g <= 0.35) n++; else { groups.push(n); n = 1; } }
  groups.push(n);
  const settled = groups.slice(1);   // the first run starts mid-cycle
  console.log('room ' + String(r.room).padStart(2) + '  schedule says ' + r.want
    + ' together every ' + r.gap + 's  ->  fired ' + (settled.join(', ') || 'nothing'));
  if (!settled.length) { bad('room ' + r.room + ' fired nothing to measure'); continue; }
  const biggest = Math.max(...settled);
  if (biggest > r.want) {
    bad('room ' + r.room + ' fired ' + biggest + ' together where the schedule says ' + r.want);
  }
  if (!settled.some((v) => v === r.want)) {
    bad('room ' + r.room + ' never reached its volley of ' + r.want + ': ' + settled.join(', '));
  }
  const between = r.gaps.filter((g) => g > 0.35);
  const early = between.filter((g) => g < r.gap - 0.3);
  if (early.length) {
    bad('room ' + r.room + ' volleys came ' + early.join(', ') + 's apart, under its '
      + r.gap + 's gap');
  }
}
done('duelramp', errs);
await browser.close();
