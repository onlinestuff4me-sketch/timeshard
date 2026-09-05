import { boot, done } from './lib.mjs';
import { doorEncounters } from '../src/balance.js';
// MORE TARGETS, NOT MORE DANGER — measured as two questions, because they
// need opposite conditions and answering both in one walk answered neither.
//
// The early doors were measured at one or two bodies met across a whole walked
// door — a corridor with nothing in it — and shattering people is the thing
// players enjoy. The encounter table roughly doubled. The rule that makes that
// free is that the room shares ONE shot clock, so the two numbers have to be
// watched together: bodies met must go UP, rounds per minute must NOT.
//
// WHY TWO PASSES. A leg's door opens on `spawnQueue.length === 0 &&
// enemies.length === 0`, so you cannot see past the first leg of a door
// without clearing it — and you cannot measure how often men shoot at you
// while shattering each one as it arrives. The old probe tried to do both in
// one walk and quietly did neither: it crossed "if the door is open", the door
// never was, and so it broke out after ONE leg and reported the first
// encounter of each door as the whole door. Doors 1 and 8 both came back as
// "2 bodies" where the table deals them 5 and 18. It sat one body from its own
// threshold, so an unchanged build flipped between pass and fail depending on
// how loaded the machine was — the flake was the proxy admitting it could not
// see the thing it was named after.
//
// Pass 1 walks whole doors the way a player does, shattering each man shortly
// after he appears so the way through opens, and counts what the door spent
// against what `doorEncounters` dealt it. Pass 2 walks the first leg of the
// same doors with nobody killed, which is the condition the rate bars below
// were measured under. Measured on real legs, walked: a hand-placed man
// outside the corridor never engages and reports a beautifully flat zero.
const SEED = () => { try { const now=Date.now();
  localStorage.setItem('timeshard_taught','1'); localStorage.setItem('ts_deepest_door','20');
  localStorage.setItem('ts_s0_used','1'); localStorage.setItem('ts_s0_mode','hall');
  localStorage.setItem('ts_s0_doors','20'); localStorage.setItem('ts_s0_rdoor','1');
  localStorage.setItem('ts_s0_at',String(now-3e5)); localStorage.setItem('ts_s0_born',String(now-9e6));
  localStorage.setItem('ts_saves',JSON.stringify([{i:0,name:'',num:1,mode:'hall'}]));
} catch {} };
const DOORS = [1, 3, 5, 8];
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);

// ---- pass 1: how much of the door does the player actually meet? ----------
//
// The movement here is the walker's, not a teleport per cell: quarter-cell
// steps with a beat at each. The corridor releases against progress, and a 4m
// jump is not progress it can see.
const full = await page.evaluate(async (doors) => {
  const t = window.__ts, C = 4, out = [];
  for (const door of doors) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 420));
    const nLegs = t.hall().legsThisDoor || 1;
    let bodies = 0, peak = 0, legs = 0;
    const seen = new WeakSet();
    for (let leg = 1; leg <= nLegs; leg++) {
      const L = t.hall().legs[t.hall().cur];
      if (!L || !L.spine) break;
      legs++;
      let px = L.spine[0][0] * C, pz = L.spine[0][1] * C;
      t.player.pos.x = px; t.player.pos.z = pz;
      const tick = () => {
        t.player.iframes = 999;
        peak = Math.max(peak, t.enemies.filter((e) => e.alive).length);
        for (const e of t.enemies) {
          if (!e.alive || seen.has(e)) continue;
          seen.add(e); bodies++;
          e.__killAt = performance.now() + 700;   // a beat to be seen, then gone
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
          while (performance.now() - hold < 90) {
            await new Promise((r) => requestAnimationFrame(r));
            tick();
          }
        }
        px = tx; pz = tz;
      }
      // ...and stand at the door while the group held for it finishes arriving
      const wait = performance.now();
      while (performance.now() - wait < 4000 && !(L.door && L.door.open)) {
        await new Promise((r) => requestAnimationFrame(r));
        tick();
      }
      if (!(L.door && L.door.open)) break;
      t.crossDoor();
      await new Promise((r) => setTimeout(r, 260));
      if (t.hall().doorsPassed + 1 !== door) break;   // that was the last leg
    }
    out.push({ door, legs, nLegs, bodies, peak });
  }
  return out;
}, DOORS);

console.log('door   legs   dealt   bodies met   most at once');
for (const r of full) {
  r.dealt = doorEncounters(r.door).reduce((a, b) => a + b, 0);
  console.log('  ' + String(r.door).padStart(2) + '    ' + r.legs + '/' + r.nLegs
    + '     ' + String(r.dealt).padStart(3) + '        ' + String(r.bodies).padStart(3)
    + '           ' + String(r.peak).padStart(2));
}
const met = full.reduce((a, r) => a + r.bodies, 0);
const dealt = full.reduce((a, r) => a + r.dealt, 0);
console.log('met ' + met + ' of the ' + dealt + ' bodies the table deals these doors ('
  + Math.round((met / dealt) * 100) + '%)');

// ---- pass 2: how often is the player shot at? -----------------------------
const rows = await page.evaluate(async (doors) => {
  const t = window.__ts, C = 4, out = [];
  for (const door of doors) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 400));
    let shots = 0, bodies = 0, peakAlive = 0;
    const seenBodies = new WeakSet();
    const t0 = performance.now();
    // ...AND THE WORLD CLOCK, WHICH IS THE ONE THE GAP IS KEPT IN. `shotGap`
    // spaces rounds in world seconds; a loaded machine advances that clock
    // more slowly than the wall, so rounds-per-wall-minute reads high for a
    // room that is obeying the rule exactly. This probe failed at 30.9 under
    // the full suite and passed at 9.4 on the same commit run alone, which is
    // the denominator moving, not the game.
    const w0 = t.worldClock().now;
    const L = t.hall().legs[t.hall().cur];
    if (L && L.spine) {
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
    }
    const ms = performance.now() - t0;
    const wsec = Math.max(0.001, t.worldClock().now - w0);
    out.push({ door, bodies, peakAlive, shots,
      perMin: +(shots / (wsec / 60)).toFixed(1),
      wallMin: +(shots / (ms / 60000)).toFixed(1),
      secs: Math.round(ms / 1000), wsec: +wsec.toFixed(1) });
  }
  return out;
}, DOORS);

console.log('');
console.log('first leg, nobody killed —   bodies   most at once   shots   per world min   (per wall min)');
for (const r of rows) {
  console.log('  door ' + String(r.door).padStart(2) + '                    '
    + String(r.bodies).padStart(3) + '           ' + String(r.peakAlive).padStart(2)
    + '        ' + String(r.shots).padStart(3) + '        ' + String(r.perMin).padStart(6)
    + '         (' + r.wallMin + ')   ' + r.wsec + 's of world in ' + r.secs + 's of wall');
}
const rate = rows.map((r) => r.perMin);
const mean = rate.reduce((a, b) => a + b, 0) / rate.length;
console.log('mean ' + mean.toFixed(1) + ' rounds/min'
  + '   (it was 12.1 when the doors were near-empty, and 21.5 with the fuller'
  + ' table before the clock was fixed)');

// The bar is the rate a player was ALREADY being shot at, not a number picked
// here: doubling the bodies must not move it.
if (mean > 17) console.log('FAIL the fuller rooms are shooting more, not just standing there: '
  + mean.toFixed(1) + ' rounds/min');
if (Math.max(...rate) > 26) console.log('FAIL a door spikes to ' + Math.max(...rate) + ' rounds/min');
// A WALKED DOOR SPENDS MOST OF WHAT IT WAS DEALT. Not all of it — the last
// group is held for the door and a walk that clears its way out can be through
// before the tail is out of the floor. Well under this is the encounters being
// planned and not spent, which is the exact thing the player reported as "the
// hallways are empty".
if (met < dealt * 0.6) console.log('FAIL the doors are not spending what they are dealt: met '
  + met + ' of ' + dealt);
for (const r of full) {
  if (r.legs < r.nLegs) console.log('FAIL door ' + r.door + ' never opened past leg '
    + r.legs + ' of ' + r.nLegs);
  if (r.bodies < 3) console.log('FAIL door ' + r.door + ' is near-empty: ' + r.bodies
    + ' bodies met across ' + r.legs + ' legs, ' + r.dealt + ' dealt');
}

done('fire', errs);
await browser.close();
