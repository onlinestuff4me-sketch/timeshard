import { boot, done } from './lib.mjs';
import { writeFileSync } from 'node:fs';
// THE WALKER THAT MAKES THE CORRIDOR DUEL PLANS.
//
// Not an assertion — a capture, the duel's answer to walk.mjs. Rooms 1-12,
// each one stood in from the first frame to the last body, recording the
// strip, where every man was standing when he was first seen, what he was,
// how long after the room started he arrived, and the difficulty dials the
// room was running on. The output is the data behind docs/DUEL.md and the
// published plan page.
//
//     OUT_JSON=/tmp/duelwalk.json node test/duelwalk.mjs
//
// `runall.sh` skips it — it takes minutes and asserts nothing.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1700);
await page.tap('#startnew');
await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);

const ROOMS = Number(process.env.ROOMS || 12);
const rooms = await page.evaluate(async (N) => {
  const t = window.__ts, C = 4, out = [];
  for (let room = 1; room <= N; room++) {
    t.warpDoor(room);
    await new Promise((r) => setTimeout(r, 600));
    const L = t.hall().legs[t.hall().cur];
    if (!L || !L.spine) break;
    const home = { x: L.spine[0][0] * C, z: L.spine[0][1] * C };
    t.player.pos.x = home.x; t.player.pos.z = home.z;
    const d = t.diff();
    const rec = {
      room,
      cells: L.cells.map(([a, b]) => [a, b]),
      spine: L.spine.map(([a, b]) => [a, b]),
      door: L.door ? { x: +(L.door.x / C).toFixed(2), z: +(L.door.z / C + 0.5).toFixed(2) } : null,
      quota: (L.quota || []).slice(),
      stretches: (L.stretches || []).map((s) => ({ z0: s.z0, z1: s.z1, n: s.cells.length })),
      maxAlive: t.leg().alive || null,
      dials: { bullet: +d.speed.toFixed(2), aim: +d.aim.toFixed(3), t: +d.t.toFixed(3) },
      gap: t.leg().gap != null ? +t.leg().gap.toFixed(2) : null,
      men: [], peak: 0,
    };
    const seen = new WeakSet();
    const t0 = performance.now();
    let quiet = 0;
    while (performance.now() - t0 < 32000) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
      t.player.pos.x = home.x; t.player.pos.z = home.z;   // hold your end
      const alive = t.enemies.filter((e) => e.alive);
      rec.peak = Math.max(rec.peak, alive.length);
      for (const e of alive) {
        if (seen.has(e)) continue;
        seen.add(e);
        rec.men.push({ x: +e.pos.x.toFixed(2), z: +e.pos.z.toFixed(2), t: e.type,
          at: +((performance.now() - t0) / 1000).toFixed(1),
          m: +Math.hypot(e.pos.x - home.x, e.pos.z - home.z).toFixed(1) });
        e.__killAt = performance.now() + 900;
      }
      for (let n = t.enemies.length - 1; n >= 0; n--) {
        const e = t.enemies[n];
        if (e.__killAt && performance.now() > e.__killAt) t.killAt(n);
      }
      if (!t.enemies.length && !t.game.spawnQueue.length) { quiet++; if (quiet > 90) break; }
      else quiet = 0;
    }
    rec.total = rec.men.length;
    rec.home = { x: +home.x.toFixed(2), z: +home.z.toFixed(2) };
    out.push(rec);
    // step through the open door to the next room
    const L2 = t.hall().legs[t.hall().cur];
    if (L2 && L2.door && L2.door.open) { t.crossDoor(); await new Promise((r) => setTimeout(r, 300)); }
  }
  return out;
}, ROOMS);

console.log('room  strip      men  peak  types                        arrivals (s)');
for (const r of rooms) {
  const kinds = {};
  for (const m of r.men) kinds[m.t] = (kinds[m.t] || 0) + 1;
  const zs = r.spine.map((p) => p[1]);
  console.log('  ' + String(r.room).padStart(2)
    + '   ' + String((Math.max(...zs) - Math.min(...zs)) * 4 + 'm').padStart(5)
    + '   ' + String(r.total).padStart(4) + String(r.peak).padStart(6)
    + '  ' + Object.entries(kinds).map(([k, v]) => v + '×' + k).join(' ').padEnd(28)
    + '  ' + r.men.map((m) => m.at).join(' '));
}
writeFileSync(process.env.OUT_JSON || '/tmp/duelwalk.json', JSON.stringify(rooms));
console.log('wrote ' + (process.env.OUT_JSON || '/tmp/duelwalk.json'));
done('duelwalk', errs);
await browser.close();
