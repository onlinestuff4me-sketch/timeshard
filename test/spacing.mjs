import { boot, done } from './lib.mjs';
// ENCOUNTERS THROUGH THE DOOR (playtest log #10: door 3 walked end to end with
// nobody in it until three gunners by the next door). Walk each leg of a door
// down its spine at a walking pace, stopping to fight whoever is up (each is
// shattered 2 world-seconds after he stands up), and record where along the
// leg the fights happened. A door must be several fights, spread through it,
// with short walks between them — not one at the end.
const DOOR = Number(process.env.TS_DOOR || 3);
const SEED = (door) => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', String(door));
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser', 'blinker', 'frankenstein', 'kamikaze', 'drone', 'spawner', 'gunner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const bad = (m) => console.log('FAIL ' + m);
const results = [];
for (const door of (process.env.TS_DOORS || `${DOOR}`).split(',').map(Number)) {
  const { browser, page, errs } = await boot({ seed: SEED, seedArg: door });
  await page.waitForTimeout(1600);
  await page.tap('.go');
  await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(async (door) => {
    const t = window.__ts, C = 4;
    const step = () => new Promise((res) => requestAnimationFrame(res));
    const legs = [];
    const door0 = t.hall().doorsPassed;
    for (let g = 0; g < 6 && t.hall().doorsPassed === door0; g++) {
      const L = t.hall().legs[t.hall().cur];
      const sp = L.spine;
      const plan = (t.leg().quota || []).slice();
      const fights = [];     // [spine fraction where the first of a group stood up]
      let kills = 0, walked = 0, idleWalk = 0, maxIdle = 0;
      const born = new Map();
      let s = 0;             // distance along the spine, metres
      const segLen = [];
      for (let i = 0; i + 1 < sp.length; i++) segLen.push(Math.hypot(sp[i + 1][0] - sp[i][0], sp[i + 1][1] - sp[i][1]) * C);
      const total = segLen.reduce((a, b) => a + b, 0);
      let w0 = t.worldClock().now, fightOn = false;
      for (let f = 0; f < 20000 && s < total - 2; f++) {
        t.player.iframes = 999;
        const now = t.worldClock().now, dt = Math.min(0.05, now - w0); w0 = now;
        for (const e of t.enemies) if (!born.has(e)) born.set(e, now);
        const up = t.enemies.filter((e) => e.state !== 'assemble');
        if (t.enemies.length) {
          if (!fightOn) { fightOn = true; fights.push(+(s / total).toFixed(2)); }
          idleWalk = 0;
          for (let j = t.enemies.length - 1; j >= 0; j--) {
            const e = t.enemies[j];
            if (e.state !== 'assemble' && now - born.get(e) > 2) { t.killAt(j); kills++; }
          }
        } else {
          fightOn = false;
          const d = 4.2 * dt;   // a walk
          s += d; walked += d; idleWalk += d; maxIdle = Math.max(maxIdle, idleWalk);
          let rem = s, i = 0;
          while (i < segLen.length - 1 && rem > segLen[i]) { rem -= segLen[i]; i++; }
          const k = segLen[i] ? rem / segLen[i] : 0;
          const [ax, az] = sp[i], [bx, bz] = sp[i + 1];
          t.player.pos.x = (ax + (bx - ax) * k) * C; t.player.pos.z = (az + (bz - az) * k) * C;
          t.player.yaw = Math.atan2(-(bx - ax), -(bz - az));
        }
        await step();
      }
      // wait out anybody still to come at the door
      for (let f = 0; f < 600; f++) {
        const now = t.worldClock().now;
        for (const e of t.enemies) if (!born.has(e)) born.set(e, now);
        if (t.enemies.length && !fightOn) { fightOn = true; fights.push(1); }
        for (let j = t.enemies.length - 1; j >= 0; j--) {
          const e = t.enemies[j];
          if (e.state !== 'assemble' && now - born.get(e) > 2) { t.killAt(j); kills++; }
        }
        if (!t.enemies.length && !t.game.spawnQueue.length) break;
        await step();
      }
      legs.push({ plan, planned: plan.reduce((a, b) => a + b, 0), kills, fights, total: Math.round(total), maxIdle: Math.round(maxIdle) });
      t.game.spawnQueue.length = 0; for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
      t.crossDoor();
      for (let f = 0; f < 30; f++) await step();
    }
    return { door, legs };
  }, door);
  console.log('door ' + door + ': ' + JSON.stringify(r.legs));
  results.push(r);
  await browser.close();
  if (errs.length) console.log('errors: ' + errs.join(' | '));
}
for (const r of results) {
  const fights = r.legs.reduce((a, l) => a + l.fights.length, 0);
  const kills = r.legs.reduce((a, l) => a + l.kills, 0);
  const planned = r.legs.reduce((a, l) => a + l.planned, 0);
  if (fights < 3) bad(`door ${r.door}: only ${fights} fights`);
  if (kills < planned * 0.8) bad(`door ${r.door}: met ${kills} of ${planned} planned`);
  for (const l of r.legs) if (l.maxIdle > 40) bad(`door ${r.door}: a ${l.maxIdle} m walk with nobody (leg ${l.total} m)`);
}
done('spacing', []);
