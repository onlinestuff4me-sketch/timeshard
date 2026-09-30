import { boot, done } from './lib.mjs';
// THE WAY ARROW, WALKED (playtest 2026-09-30: it pointed back the way you
// came, in a corridor and in a room). Walk each leg's spine facing along it,
// with nobody alive, and at every step compare the bearing the arrow is drawn
// at with the direction the path actually goes next. It may lean into a turn;
// it may never point behind you.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '2');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser', 'blinker', 'frankenstein', 'kamikaze', 'drone', 'spawner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.waitForTimeout(1200);

const out = await page.evaluate(async () => {
  const t = window.__ts, C = 4, rows = [];
  const step = () => new Promise((r) => requestAnimationFrame(r));
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  for (let leg = 0; leg < 4; leg++) {
    const L = t.hall().legs[t.hall().cur];
    const sp = L.spine;
    let worst = 0, at = null, shown = 0, samples = 0;
    for (let i = 0; i < sp.length - 3; i++) {
      t.game.spawnQueue.length = 0; for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
      const [ax, az] = sp[i], [bx, bz] = sp[Math.min(sp.length - 1, i + 2)];
      t.player.pos.x = ax * C; t.player.pos.z = az * C;
      // facing along the path (yaw convention: forward is (-sin, -cos))
      t.player.yaw = Math.atan2(-(bx - ax), -(bz - az));
      for (let f = 0; f < 8; f++) await step();
      const w = t.way();
      samples++;
      if (!w.on || w.world === null) continue;
      shown++;
      const off = Math.abs(wrap(w.world - t.player.yaw)) * 180 / Math.PI;
      if (off > worst) { worst = off; at = { i, of: sp.length, px: +(ax * C).toFixed(1), pz: +(az * C).toFixed(1) }; }
    }
    // ...AND OFF THE SPINE: every floor cell of the leg (rooms, branch lanes,
    // the wide parts), which is where a player actually stands. There the
    // question is not an angle but PROGRESS: the point the needle aims at must
    // never be further back along the route than the route point nearest the
    // player (it may be level with it — a room's exit row runs sideways).
    let worstOff = 0, atOff = null;
    const near = (x, z) => { let bi = 0, bd = 1e9; sp.forEach(([sx, sz], k) => { const d = Math.hypot(sx - x, sz - z); if (d < bd) { bd = d; bi = k; } }); return bi; };
    for (const [cx, cz] of L.cells) {
      const k = near(cx, cz);
      if (k >= sp.length - 3) continue;
      t.game.spawnQueue.length = 0; for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
      t.player.pos.x = cx * C; t.player.pos.z = cz * C;
      const [bx, bz] = sp[Math.min(sp.length - 1, k + 2)];
      t.player.yaw = Math.atan2(-(bx - cx), -(bz - cz));
      for (let f = 0; f < 6; f++) await step();
      const w = t.way();
      if (!w.on || !w.aim) continue;
      const back = k - near(w.aim.x / C, w.aim.z / C);   // spine cells behind the player
      if (back > worstOff) { worstOff = back; atOff = { cell: [cx, cz], nearIx: k, aim: w.aim, of: sp.length }; }
    }
    rows.push({ door: t.hall().doorsPassed + 1, leg: t.hall().legInDoor + 1, samples, shown, worst: Math.round(worst), at,
      worstOff: Math.round(worstOff), atOff });
    t.crossDoor();
    for (let f = 0; f < 20; f++) await step();
  }
  return rows;
});
for (const r of out) console.log(JSON.stringify(r));
for (const r of out) {
  if (r.worst > 100) bad(`door ${r.door} leg ${r.leg}: on the spine the arrow pointed ${r.worst} degrees off the way ahead`);
  if (r.worstOff > 1) bad(`door ${r.door} leg ${r.leg}: off the spine the arrow aimed ${r.worstOff} route cells BEHIND the player at ${JSON.stringify(r.atOff)}`);
}
done('waywalk', errs);
await browser.close();
