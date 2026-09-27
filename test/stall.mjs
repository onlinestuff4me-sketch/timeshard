import { boot, done } from './lib.mjs';
// A DOOR THAT NEVER OPENS (playtest 2026-09-27: "it says there are still
// enemies left but I don't see any and the door is locked", door 10). Walks
// doors 10-15 forward, the way rooms.mjs walks 1-8, killing everyone it meets,
// and if a leg goes quiet with the door still shut it prints what the leg
// still owes and where every live body is.
const START = Number(process.env.TS_STALL_DOOR || 10), LAST = Number(process.env.TS_STALL_LAST || 15);
const SEED = { content: `(${((start) => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', String(start));
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser', 'blinker', 'frankenstein', 'kamikaze', 'drone', 'spawner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} }).toString()})(${START})` };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.waitForTimeout(1500);

const out = await page.evaluate(async (last) => {
  const t = window.__ts, C = 4, rows = [];
  const step = () => new Promise((r) => requestAnimationFrame(r));
  for (let guardDoor = 0; guardDoor < 12 && t.hall().doorsPassed + 1 <= last; guardDoor++) {
    const L = t.hall().legs[t.hall().cur];
    const door = t.hall().doorsPassed + 1, legIx = t.hall().legInDoor;
    const tick = () => {
      t.player.iframes = 999;
      for (const e of t.enemies) if (e.alive && e.state !== 'assemble' && !e.__killAt) e.__killAt = performance.now() + 400;
      for (let n = t.enemies.length - 1; n >= 0; n--) {
        const e = t.enemies[n];
        if (e.__killAt && performance.now() > e.__killAt && t.enemies[n].state !== 'assemble') t.killAt(n);
      }
    };
    let px = L.spine[0][0] * C, pz = L.spine[0][1] * C;
    for (let i = 0; i < L.spine.length; i++) {
      const tx = L.spine[i][0] * C, tz = L.spine[i][1] * C;
      for (let k = 1; k <= 4; k++) {
        t.player.pos.x = px + (tx - px) * (k / 4); t.player.pos.z = pz + (tz - pz) * (k / 4);
        for (let f = 0; f < 6; f++) { await step(); tick(); }
      }
      px = tx; pz = tz;
    }
    // stand in front of the door facing it
    t.player.pos.x = L.door.x; t.player.pos.z = L.door.z - 2.5; t.player.yaw = Math.PI;
    let f = 0;
    for (; f < 1800 && !L.door.open; f++) { await step(); tick(); }
    const owed = t.game.spawnQueue.length, alive = t.enemies.filter((e) => e.alive);
    const row = { door, leg: legIx + 1, of: t.hall().legsThisDoor, opened: L.door.open, frames: f,
      queue: owed, alive: alive.length, form: t.leg().form };
    if (!L.door.open) {
      row.diag = { leg: t.leg(), doorSeen: !!L.doorSeen, fill: L.fill, quota: L.quota,
        queueTypes: t.game.spawnQueue.map((q) => q.type || q),
        bodies: alive.map((e) => ({ type: e.type, state: e.state, hold: !!e.hold, vis: e.g.visible,
          x: +e.pos.x.toFixed(1), z: +e.pos.z.toFixed(1) })),
        player: { x: +t.player.pos.x.toFixed(1), z: +t.player.pos.z.toFixed(1) },
        doorAt: { x: L.door.x, z: L.door.z }, approach: L.approach };
      rows.push(row);
      break;
    }
    rows.push(row);
    t.crossDoor();
    for (let g = 0; g < 20; g++) await step();
  }
  return rows;
}, LAST);
for (const r of out) console.log(JSON.stringify(r));
const stuck = out.find((r) => !r.opened);
if (stuck) bad(`door ${stuck.door} leg ${stuck.leg} never opened: ${stuck.queue} queued, ${stuck.alive} alive`);
done('stall', errs);
await browser.close();
