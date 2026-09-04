import { boot, done } from './lib.mjs';
// MORE TARGETS, NOT MORE DANGER.
//
// The early doors were measured at one or two bodies met across a whole walked
// door — a corridor with nothing in it — and shattering people is the thing
// players enjoy. The encounter table roughly doubled. The rule that makes that
// free is that the room shares ONE shot clock, so this probe watches the two
// numbers together: bodies met must go UP, rounds per minute must NOT.
//
// Two things had to change for that to hold, and both were found here rather
// than reasoned about. The hold ceiling was a flat timeout, so a fuller room
// leaked shots past the clock (door 8: 13.9 -> 28.9 rounds a minute on the
// same dials). And the clock itself was set to 3s, which a SPARSE room never
// reached — it delivered about 14 — so filling the rooms found a ceiling they
// had never touched. Measured on real legs, walked: a hand-placed man outside
// the corridor never engages and reports a beautifully flat zero.
const SEED = () => { try { const now=Date.now();
  localStorage.setItem('timeshard_taught','1'); localStorage.setItem('ts_deepest_door','20');
  localStorage.setItem('ts_s0_used','1'); localStorage.setItem('ts_s0_mode','hall');
  localStorage.setItem('ts_s0_doors','20'); localStorage.setItem('ts_s0_rdoor','1');
  localStorage.setItem('ts_s0_at',String(now-3e5)); localStorage.setItem('ts_s0_born',String(now-9e6));
  localStorage.setItem('ts_saves',JSON.stringify([{i:0,name:'',num:1,mode:'hall'}]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);
const rows = await page.evaluate(async (doors) => {
  const t = window.__ts, C = 4, out = [];
  for (const door of doors) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 400));
    let shots = 0, bodies = 0, ms = 0, peakAlive = 0;
    const seenBodies = new WeakSet();
    const t0 = performance.now();
    for (let leg = 0; leg < 3; leg++) {
      const L = t.hall().legs[t.hall().cur];
      if (!L || !L.spine) break;
      for (let i = 0; i < L.spine.length; i++) {
        t.player.pos.x = L.spine[i][0] * C;
        t.player.pos.z = L.spine[i][1] * C;
        // hold here a beat so the room gets to take its turns
        const hold = performance.now();
        while (performance.now() - hold < 420) {
          t.player.iframes = 999;
          await new Promise((r) => requestAnimationFrame(r));
          for (const b of t.bullets) if (!b.fromPlayer && !b.__s) { b.__s = true; shots++; }
          const alive = t.enemies.filter((e) => e.alive);
          peakAlive = Math.max(peakAlive, alive.length);
          for (const e of alive) if (!seenBodies.has(e)) { seenBodies.add(e); bodies++; }
        }
      }
      if (L.door && L.door.open) { t.crossDoor(); await new Promise((r) => setTimeout(r, 200)); }
      else break;
    }
    ms = performance.now() - t0;
    out.push({ door, bodies, peakAlive, shots,
      perMin: +(shots / (ms / 60000)).toFixed(1), secs: Math.round(ms / 1000) });
  }
  return out;
}, [1, 2, 3, 4, 5, 6, 8]);
console.log('door   bodies met   most at once   shots fired   shots/min');
for (const r of rows) {
  console.log('  ' + String(r.door).padStart(2) + '      ' + String(r.bodies).padStart(3)
    + '           ' + String(r.peakAlive).padStart(2) + '            '
    + String(r.shots).padStart(3) + '         ' + r.perMin + '   (' + r.secs + 's)');
}
const rate = rows.map((r) => r.perMin);
const bodies = rows.map((r) => r.bodies);
const mean = rate.reduce((a, b) => a + b, 0) / rate.length;
console.log('mean ' + mean.toFixed(1) + ' rounds/min across doors 1-8'
  + '   (it was 12.1 when the doors were near-empty, and 21.5 with the fuller'
  + ' table before the clock was fixed)');
// The bar is the rate a player was ALREADY being shot at, not a number picked
// here: doubling the bodies must not move it.
if (mean > 17) console.log('FAIL the fuller rooms are shooting more, not just standing there: '
  + mean.toFixed(1) + ' rounds/min');
if (Math.max(...bodies) < 3) console.log('FAIL the doors are still near-empty: at most '
  + Math.max(...bodies) + ' bodies met');
if (Math.max(...rate) > 26) console.log('FAIL a door spikes to ' + Math.max(...rate) + ' rounds/min');

done('fire', errs);
await browser.close();
