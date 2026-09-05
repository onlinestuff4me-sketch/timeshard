// HOW FAR FROM "THE WAY OUT" DOES AN ORDINARY WALK POINT?
//
// 1.v wants the needle back when the player turns to face AWAY from the next
// door. The threshold for "away" cannot be guessed: a corridor that turns 90
// degrees means a player walking normally around the corner is briefly facing
// 90 degrees off the next segment, and a mark that fires there is a mark that
// fires constantly. So: walk the legs facing the direction of travel — the
// most innocent thing a player does — and see how big the angle gets.
import { boot, done } from './lib.mjs';
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

const out = await page.evaluate(async (doors) => {
  const t = window.__ts, C = 4;
  const norm = (a) => { while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const rows = [];
  for (const door of doors) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 420));
    for (let leg = 0; leg < 3; leg++) {
      const L = t.hall().legs[t.hall().cur];
      if (!L || !L.spine) break;
      let px = L.spine[0][0] * C, pz = L.spine[0][1] * C;
      t.player.pos.x = px; t.player.pos.z = pz;
      for (let i = 1; i < L.spine.length; i++) {
        const tx = L.spine[i][0] * C, tz = L.spine[i][1] * C;
        // face the way we are walking, which is what a player does
        const heading = Math.atan2(-(tx - px), -(tz - pz));
        for (let k = 1; k <= 4; k++) {
          t.player.pos.x = px + (tx - px) * (k / 4);
          t.player.pos.z = pz + (tz - pz) * (k / 4);
          t.player.yaw = heading;
          const hold = performance.now();
          while (performance.now() - hold < 70) {
            await new Promise((r) => requestAnimationFrame(r));
            t.player.iframes = 999;
            const w = t.way();
            if (!w.target) continue;
            const dx = w.target.x - t.player.pos.x, dz = w.target.z - t.player.pos.z;
            if (Math.hypot(dx, dz) < 0.3) continue;
            const bearing = Math.atan2(-dx, -dz);
            rows.push({ door,
              deg: Math.round(Math.abs(norm(bearing - t.player.yaw)) * 180 / Math.PI),
              men: t.enemies.filter((e) => e.alive).length,
              edge: t.edgeArrowCount() });
          }
        }
        px = tx; pz = tz;
      }
      for (let k = t.enemies.length - 1; k >= 0; k--) t.killAt(k);
      const wait = performance.now();
      while (performance.now() - wait < 3000 && !(L.door && L.door.open)) {
        await new Promise((r) => requestAnimationFrame(r));
        t.player.iframes = 999;
      }
      if (!(L.door && L.door.open)) break;
      t.crossDoor();
      await new Promise((r) => setTimeout(r, 260));
      if (t.hall().doorsPassed + 1 !== door) break;
    }
  }
  return rows;
}, [3, 6, 10]);

const bins = [0, 30, 60, 90, 120, 150, 180];
const hist = (rows, label) => {
  if (!rows.length) { console.log(label + ': nothing sampled'); return; }
  const counts = bins.slice(0, -1).map((lo, i) =>
    rows.filter((r) => r.deg >= lo && r.deg < bins[i + 1]).length);
  const worst = Math.max(...rows.map((r) => r.deg));
  console.log(label + '  (' + rows.length + ' frames, worst ' + worst + ' deg)');
  counts.forEach((c, i) => {
    const pct = (c / rows.length) * 100;
    console.log('   ' + String(bins[i]).padStart(3) + '-' + String(bins[i + 1]).padStart(3)
      + ' deg  ' + String(c).padStart(5) + '  ' + pct.toFixed(1).padStart(5) + '%  '
      + '#'.repeat(Math.round(pct / 2)));
  });
};
console.log('FACING THE WAY YOU ARE WALKING — angle to the way out');
hist(out, 'every frame');
hist(out.filter((r) => r.men > 0), 'with somebody still in the leg');
hist(out.filter((r) => r.men === 0), 'with the leg clear');
console.log('frames with an enemy edge indicator lit: ' + out.filter((r) => r.edge > 0).length);
for (const th of [90, 110, 120, 135, 150]) {
  const n = out.filter((r) => r.deg >= th).length;
  console.log('  a threshold of ' + th + ' deg would fire on ' + n + ' of ' + out.length
    + ' frames (' + ((n / out.length) * 100).toFixed(2) + '%) of an ordinary walk');
}
done('facing', errs);
await browser.close();
