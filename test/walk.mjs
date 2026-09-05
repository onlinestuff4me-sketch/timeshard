import { boot, done } from './lib.mjs';
import { writeFileSync } from 'node:fs';
// THE WALKER THAT MAKES THE FLOOR PLANS.
//
// Not an assertion — a capture. Doors 1-5, every leg, walked from entry to
// door, killing each body 0.7s after it appears, recording the geometry, the
// plan and the metres walked when each man showed up. The output is the data
// behind docs/MAPS.md and the published floor-plan page:
//
//     OUT_JSON=/tmp/walk-a.json node test/walk.mjs
//
// It lives in the repo because the last capture was scratchpad-only, so when
// the encounter table moved there was no way to re-draw the maps without
// writing this again from nothing. `runall.sh` skips it — see the guard at the
// bottom of that script — because it takes minutes and asserts nothing.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '20');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '20'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);

const legs = await page.evaluate(async () => {
  const t = window.__ts, C = 4, out = [];
  const legOf = (L, door, leg, legs) => ({
    door, leg, legs,
    form: (L.proto && L.proto.form && L.proto.form.id) || 'corridor',
    cells: L.cells.map(([a, b]) => [a, b]),
    spine: L.spine.map(([a, b]) => [a, b]),
    door_at: [L.door ? +(L.door.x / C).toFixed(2) : 0, L.door ? +(L.door.z / C + 0.5).toFixed(2) : 0],
    // the pillars a player gets behind, as boxes on the plan
    cover: (L.pillars || []).map(([gx, gz]) =>
      [gx * C - 0.34, gz * C - 0.34, gx * C + 0.34, gz * C + 0.34]),
    quota: (L.quota || []).slice(),
    men: [],
  });
  for (let door = 1; door <= 5; door++) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 420));
    const nLegs = t.hall().legsThisDoor || 1;
    for (let leg = 1; leg <= nLegs; leg++) {
      const L = t.hall().legs[t.hall().cur];
      if (!L || !L.spine) break;
      const rec = legOf(L, door, leg, nLegs);
      const seen = new WeakSet();
      let walked = 0;
      let px = L.spine[0][0] * C, pz = L.spine[0][1] * C;
      t.player.pos.x = px; t.player.pos.z = pz;
      // walk the spine in half-cell steps, holding at each so the corridor
      // gets its chance to release
      for (let i = 0; i < L.spine.length; i++) {
        const tx = L.spine[i][0] * C, tz = L.spine[i][1] * C;
        const steps = 4;
        for (let k = 1; k <= steps; k++) {
          const nx = px + (tx - px) * (k / steps), nz = pz + (tz - pz) * (k / steps);
          walked += Math.hypot(nx - t.player.pos.x, nz - t.player.pos.z);
          t.player.pos.x = nx; t.player.pos.z = nz;
          t.player.iframes = 999;
          const hold = performance.now();
          while (performance.now() - hold < 90) {
            await new Promise((r) => requestAnimationFrame(r));
            t.player.iframes = 999;
            for (const e of t.enemies) {
              if (!e.alive || seen.has(e)) continue;
              seen.add(e);
              rec.men.push({ x: +e.pos.x.toFixed(2), z: +e.pos.z.toFixed(2),
                t: e.type, at: +walked.toFixed(1) });
              e.__killAt = performance.now() + 700;
            }
            for (let n = t.enemies.length - 1; n >= 0; n--) {
              const e = t.enemies[n];
              if (e.__killAt && performance.now() > e.__killAt) t.killAt(n);
            }
          }
        }
        px = tx; pz = tz;
      }
      // ...and let the door group finish arriving
      const wait = performance.now();
      while (performance.now() - wait < 2600) {
        await new Promise((r) => requestAnimationFrame(r));
        t.player.iframes = 999;
        for (const e of t.enemies) {
          if (!e.alive || seen.has(e)) continue;
          seen.add(e);
          rec.men.push({ x: +e.pos.x.toFixed(2), z: +e.pos.z.toFixed(2),
            t: e.type, at: +walked.toFixed(1) });
        }
        for (let n = t.enemies.length - 1; n >= 0; n--) t.killAt(n);
      }
      rec.path = +walked.toFixed(0);
      let last = 0;
      for (const m of rec.men) { m.gap = +(m.at - last).toFixed(1); last = m.at; }
      rec.tail = +(walked - last).toFixed(1);
      out.push(rec);
      if (L.door && L.door.open) { t.crossDoor(); await new Promise((r) => setTimeout(r, 260)); }
      else break;
    }
  }
  return out;
});
console.log('legs walked: ' + legs.length);
for (const L of legs) {
  console.log(`  door ${L.door} leg ${L.leg}/${L.legs}  ${L.form.padEnd(11)}`
    + ` ${String(L.path).padStart(3)} m  ${String(L.men.length).padStart(2)} men`
    + `  tail ${String(Math.round(L.tail)).padStart(3)} m  quota ${JSON.stringify(L.quota)}`);
}
writeFileSync(process.env.OUT_JSON || '/tmp/walk.json', JSON.stringify(legs));
done('walk', errs);
await browser.close();
