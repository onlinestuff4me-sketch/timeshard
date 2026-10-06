import { boot, done } from './lib.mjs';
// THE WAY ARROW, OFF THE CENTRE LINE (playtest 2026-10-06, doors 3 and 5:
// the arrow said the way on was behind you, with enemies still to come).
// Walk every floor cell of each leg in the order a player reaches them —
// rooms, branch lanes and the wide parts, not only the spine — and at each
// compare the bearing the game would draw with the way the path really goes
// from there (found by walking the floor, so a wall between two stretches is
// never mistaken for a shortcut). It may lean; it may never point backwards.
const DOORS = (process.env.TS_DOORS || '3,5').split(',').map(Number);
const SEED = (door) => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', String(door));
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'gunner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const bad = (m) => console.log('FAIL ' + m);
for (const door of DOORS) {
  const { browser, page, errs } = await boot({ seed: SEED, seedArg: door });
  await page.waitForTimeout(1600);
  await page.tap('.go');
  await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
  const out = await page.evaluate(async () => {
    const t = window.__ts, C = 4;
    const step = () => new Promise((r) => requestAnimationFrame(r));
    const res = [];
    const door0 = t.hall().doorsPassed;
    for (let g = 0; g < 4 && t.hall().doorsPassed === door0; g++) {
      const L = t.hall().legs[t.hall().cur];
      const sp = L.spine;
      const key = (x, z) => x + ',' + z;
      const floor = new Set(L.cells.map(([x, z]) => key(x, z)));
      // nearest spine index BY WALKING, every floor cell
      const ix = new Map(), q = [];
      sp.forEach(([x, z], i) => { if (!ix.has(key(x, z))) { ix.set(key(x, z), i); q.push([x, z]); } });
      for (let h = 0; h < q.length; h++) {
        const [x, z] = q[h];
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = key(x + dx, z + dz);
          if (floor.has(k) && !ix.has(k)) { ix.set(k, ix.get(key(x, z))); q.push([x + dx, z + dz]); }
        }
      }
      const order = L.cells.slice().sort((a, b) => ix.get(key(...a)) - ix.get(key(...b)));
      let worst = 0, at = null, n = 0;
      for (const [cx, cz] of order) {
        const i = ix.get(key(cx, cz));
        if (i >= sp.length - 4) continue;
        t.game.spawnQueue.length = 0; t.game.spawnQueue.push('gunner');   // a leg still owing
        for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
        t.player.pos.x = cx * C; t.player.pos.z = cz * C;
        const [bx, bz] = sp[Math.min(sp.length - 1, i + 3)];
        // truth: toward the spine 3 cells on (from a room cell, toward where
        // its own spine cell leads)
        const tx = bx * C - t.player.pos.x, tz = bz * C - t.player.pos.z;
        if (Math.hypot(tx, tz) < 2) continue;
        const truth = Math.atan2(-tx, -tz);
        t.player.yaw = truth;
        await step(); await step();
        const b = t.way().bearing;
        if (b === null) continue;
        n++;
        let d = b - truth; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const deg = Math.abs(d) * 180 / Math.PI;
        if (deg > worst) { worst = deg; at = { cell: [cx, cz], spineIx: i, of: sp.length, onSpine: sp.some(([x, z]) => x === cx && z === cz) }; }
      }
      res.push({ leg: g, form: t.leg().form, n, worst: Math.round(worst), at });
      t.game.spawnQueue.length = 0;
      t.crossDoor();
      for (let f = 0; f < 30; f++) await step();
    }
    return res;
  });
  console.log('door ' + door + ': ' + JSON.stringify(out));
  for (const r of out) if (r.worst > 100) bad(`door ${door} leg ${r.leg}: the arrow pointed ${r.worst} deg off the way on, at ${JSON.stringify(r.at)}`);
  await browser.close();
  if (errs.length) console.log('errors: ' + errs.slice(0, 3).join(' | '));
}
done('wayroom', []);
