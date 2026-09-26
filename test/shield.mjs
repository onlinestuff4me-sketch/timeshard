import { boot, done } from './lib.mjs';
import { TYPE_INTRO } from '../src/balance.js';
// THE SHIELD IN THE DOORWAY.
//
// Playtest: "at door eight we introduce the shield enemy right in the doorway
// so you can't get past him nor can you shoot him." Both halves of that are
// measurable and neither was being measured: how far from the door slab he
// stands, and how much floor is left either side of him there.
//
// A doorway is the one place on a leg where a shielded man is unanswerable.
// The shield only fails if you can outpace his pivot, and outpacing a pivot
// means having somewhere to walk to — in a 4 m corridor cell with a 0.94 m
// body in the middle of it there is 1.5 m of floor either side, which is not
// a flank, it is a squeeze past a man who is already facing you.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '30');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '30'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);

// His own door first, then doors either side of the time button: the slew is
// a PAIR of numbers and the pair is the lesson, so a run that only ever sees
// him before the unlock has measured half of it.
const DOORS = [TYPE_INTRO.shieldbearer, TYPE_INTRO.shieldbearer + 1,
  TYPE_INTRO.shieldbearer + 2, 12, 13, 14];
// THE PAIR FIRST, BEFORE ANY WALKING, and read off the game rather than off a
// man.
//
// The walk above only sees whoever the cast happens to deal it, and on a given
// run that can be nobody past the unlock — so the half of the lesson that is
// about HAVING the power would go unmeasured. Timing a live man needs one to
// exist AND to be turning AND to have survived the frame budget, and the first
// draft of this did all three unreliably: it reported the door-8 rate as the
// door-12 one because a man left over from the walk was still standing.
//
// IT RUNS FIRST BECAUSE THE WALK POISONS IT. Walking through door 10 arms the
// slow-time lesson, and `timeUnlocked()` answers `tutorMay('timebtn')` while a
// lesson is running — so warping back to door 8 afterwards reported the power
// as already in hand and the dial as 0.80 at every door. The game was right
// and the probe was asking it a question about a state it had itself created.
//
// `slewNow()` is the resolved dial for the door the game is actually on, so
// the pair is checked exactly. The live readings in the table above are the
// corroboration: they have to AGREE with it, which is the part that proves
// the dial is the one `updateEnemy` reads.
const pair = await page.evaluate(async (doors) => {
  const t = window.__ts, rows = [];
  for (const door of doors) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 300));
    rows.push({ door, ...t.slewNow() });
  }
  return rows;
}, [8, 9, 12, 16]);

const out = await page.evaluate(async (doors) => {
  const t = window.__ts, C = 4, seenAt = [];
  // ...AND HOW FAST HE SLEWS, in rad/s of WORLD clock, taken off the live men
  // rather than read off the dial. World, not wall: the whole point of the
  // slew being in world time is that bullet time buys you the flank, so a wall
  // measurement would answer a question the game does not ask.
  const slew = {};
  const yawWas = new WeakMap();
  for (const door of doors) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 420));
    const nLegs = t.hall().legsThisDoor || 1;
    const seen = new WeakSet();
    for (let leg = 1; leg <= nLegs; leg++) {
      const L = t.hall().legs[t.hall().cur];
      if (!L || !L.spine) break;
      const nSt = (L.stretches || []).length;
      const appZ = L.approach && L.approach.length ? L.approach[0][1] * C : null;
      let px = L.spine[0][0] * C, pz = L.spine[0][1] * C;
      t.player.pos.x = px; t.player.pos.z = pz;
      const tick = () => {
        t.player.iframes = 999;
        const wNow = t.worldClock().now;
        for (const e of t.enemies) {
          if (e.alive && e.type === 'shieldbearer') {
            const was = yawWas.get(e);
            if (was && wNow > was.w) {
              let d = e.g.rotation.y - was.y;
              d = Math.abs(((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
              const rate = d / (wNow - was.w);
              if (rate > 0.02) slew[door] = Math.max(slew[door] || 0, rate);
            }
            yawWas.set(e, { y: e.g.rotation.y, w: wNow });
          }
        }
        for (const e of t.enemies) {
          if (!e.alive || seen.has(e)) continue;
          seen.add(e);
          if (e.type !== 'shieldbearer') { e.__killAt = performance.now() + 500; continue; }
          // HOW MUCH FLOOR EITHER SIDE OF HIM, at his own z — off the LEG'S OWN
          // CELLS. "Not inside an obstacle" is not "on floor": everywhere
          // outside the level passes that test, so a width measured that way
          // reports the whole world. `L.cells` is the floor this leg has.
          const gz = Math.round(e.pos.z / C);
          const row = L.cells.filter(([, cz]) => cz === gz).map(([cx]) => cx * C).sort((a, b) => a - b);
          let left = 0, right = 0;
          for (const cx of row) {
            if (cx <= e.pos.x) left = Math.max(left, e.pos.x - (cx - C / 2));
            if (cx >= e.pos.x) right = Math.max(right, (cx + C / 2) - e.pos.x);
          }
          if (!row.length) { left = 0; right = 0; }
          seenAt.push({ door, fromDoor: +(L.door.z - e.pos.z).toFixed(1),
            inApproach: appZ !== null && e.pos.z >= appZ - C * 0.5,
            band: (() => { for (let i = 0; i < nSt; i++) {
              if (e.pos.z >= L.stretches[i].z0 - C * 0.5 && e.pos.z <= L.stretches[i].z1 + C * 0.5) return i;
            } return -1; })(),
            lastBand: nSt - 1, isRoom: L.featureStretch,
            side: +Math.min(left, right).toFixed(2), width: +(left + right).toFixed(2) });
          e.__killAt = performance.now() + 2600;
        }
        for (let n = t.enemies.length - 1; n >= 0; n--) {
          const e = t.enemies[n];
          if (e.__killAt && performance.now() > e.__killAt) t.killAt(n);
        }
      };
      for (let i = 0; i < L.spine.length; i++) {
        const tx = L.spine[i][0] * C, tz = L.spine[i][1] * C;
        for (let k = 1; k <= 4; k++) {
          t.player.pos.x = px + (tx - px) * (k / 4);
          t.player.pos.z = pz + (tz - pz) * (k / 4);
          const hold = performance.now();
          while (performance.now() - hold < 80) {
            await new Promise((r) => requestAnimationFrame(r)); tick();
          }
        }
        px = tx; pz = tz;
      }
      let quiet = 0;
      const owed = () => t.game.spawnQueue.length + t.enemies.filter((e) => e.alive).length;
      const guard = performance.now();
      while (!(L.door && L.door.open) && performance.now() - guard < 30000) {
        const before = owed();
        await new Promise((r) => requestAnimationFrame(r)); tick();
        quiet = owed() === before && before > 0 ? quiet + 1 : 0;
        if (owed() === 0 && quiet > 200) break;
        if (quiet > 700) break;
      }
      if (!(L.door && L.door.open)) break;
      t.crossDoor();
      await new Promise((r) => setTimeout(r, 240));
      if (t.hall().doorsPassed + 1 !== door) break;
    }
  }
  return { seenAt, slew };
}, DOORS);

console.log('every shieldbearer met, and where he stood:');
console.log(' door   m from the door slab   in the approach   stretch/last   floor either side   corridor width');
for (const r of out.seenAt) {
  console.log('  ' + String(r.door).padStart(3) + '          ' + String(r.fromDoor).padStart(6)
    + '            ' + (r.inApproach ? 'YES' : ' no') + '             ' + r.band + '/' + r.lastBand
    + '                ' + r.side.toFixed(2) + ' m             ' + r.width.toFixed(2) + ' m');
}
const inDoor = out.seenAt.filter((r) => r.inApproach).length;
console.log(`\n${inDoor} of ${out.seenAt.length} stood in the door approach`);
const tight = out.seenAt.filter((r) => r.side < 1.8).length;
console.log(`${tight} of ${out.seenAt.length} left under 1.8 m of floor to squeeze past on either side`);
console.log('\nfastest slew seen, rad/s of WORLD clock (the time button arrives on door 10):');
for (const d of Object.keys(out.slew)) {
  console.log('  door ' + String(d).padStart(2) + '   ' + out.slew[d].toFixed(2)
    + '   (' + (out.slew[d] * 180 / Math.PI).toFixed(0) + ' deg/s)');
}
if (inDoor) bad('a shielded man stood in the door approach');
if (tight) bad('a shielded man was placed with no floor to get round him');
if (!out.seenAt.length) bad('no shielded man was met at all');
// THE PAIR, either side of the unlock. Not a failure when a walk happens not
// to cast one — the cast is weighted, not scripted — but say which half is
// missing rather than printing a table that looks complete.
const doors = Object.keys(out.slew).map(Number);
const pre = doors.filter((d) => d < 10), post = doors.filter((d) => d >= 10);
if (!pre.length) console.log('  (none met before the time button this walk)');
if (!post.length) console.log('  (none met after the time button this walk)');
console.log('\nthe dial the game resolves, by door:');
for (const r of pair) {
  console.log('  door ' + String(r.door).padStart(2) + '   ' + r.rate.toFixed(2)
    + '   (' + (r.rate * 180 / Math.PI).toFixed(0) + ' deg/s)   power in hand: '
    + (r.power ? 'yes' : 'no'));
}
const bef = pair.filter((r) => !r.power), aft = pair.filter((r) => r.power);
if (!bef.length || !aft.length) bad('the walk never straddled the unlock door');
else if (!(aft[0].rate > bef[0].rate + 0.1)) {
  bad(`he does not slew faster once the power is in hand: ${bef[0].rate} -> ${aft[0].rate}`);
}
// ...AND THE LIVE MEN HAVE TO AGREE WITH IT. A dial nothing reads is a
// comment; this is what makes the table above evidence rather than decoration.
for (const d of Object.keys(out.slew)) {
  const want = pair.find((r) => r.door === +d);
  if (want && Math.abs(out.slew[d] - want.rate) > 0.06) {
    bad(`door ${d}: the men slewed at ${out.slew[d].toFixed(2)} where the dial says ${want.rate}`);
  }
}
if (pre.length && post.length) {
  const a = Math.max(...pre.map((d) => out.slew[d]));
  const b = Math.max(...post.map((d) => out.slew[d]));
  console.log(`  before ${a.toFixed(2)}  after ${b.toFixed(2)}`);
  if (b <= a + 0.1) bad(`he does not slew faster once the power is in hand: ${a.toFixed(2)} -> ${b.toFixed(2)}`);
}
done('shield', errs);
await browser.close();
