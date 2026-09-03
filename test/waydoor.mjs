// THE WAY-OUT NEEDLE'S LAST SECONDS.
//
// Its path ends AT the door, so inside the last few metres every lookahead
// sample clamps to the point the player is walking onto — and a bearing to a
// point under your feet swings a long way for a metre of lateral drift. A
// playtest saw it spin sideways on arrival. It must fade out instead, and it
// must never snap while it is up.
import { boot, done } from './lib.mjs';

// A RUN ALREADY UNDER WAY, so the big button is CONTINUE and one tap is in the
// corridor. A virgin profile opens on the mode board instead.
const SEED = () => { try {
  const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '12');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '12'); localStorage.setItem('ts_s0_rdoor', '12');
  localStorage.setItem('ts_s0_at', String(now - 3e5));
  localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };

const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() =>
  document.getElementById('overlay').classList.contains('hidden'), null, { timeout: 20000 });
await page.waitForTimeout(2600);

const R = await page.evaluate(async () => {
  const ts = window.__ts, C = 4;
  const frame = () => new Promise((res) => requestAnimationFrame(res));
  ts.warpDoor(12);                     // past the onboarding: needle territory
  ts.crossDoor();
  const legStart = ts.hall().cur;
  const L0 = ts.hall().legs[legStart];
  const way = L0.spine.map(([gx, gz]) => [gx * C, gz * C]);
  way.push([L0.door.x, L0.door.z + 2.0]);
  const rows = [];
  let wp = 0, stickX = 0, stickY = -1, lastP = null, still = 0, slide = 0, slideT = 0;
  for (let f = 0; f < 4000; f++) {
    await frame();
    ts.player.iframes = 999;           // an immortal walker: this is about the mark
    while (ts.enemies.length) ts.killAt(0);   // an empty leg is where it shows
    if (ts.hall().cur !== legStart) break;
    const w = ts.way();
    const L = ts.hall().legs[ts.hall().cur];
    rows.push({ f, on: w.on, world: w.world,
      toDoor: +Math.hypot(L.door.x - ts.player.pos.x, L.door.z - ts.player.pos.z).toFixed(1),
      op: +(+getComputedStyle(document.getElementById('wayarrow')).opacity).toFixed(2) });
    const p = ts.player.pos;
    while (wp < way.length - 1 && Math.hypot(way[wp][0] - p.x, way[wp][1] - p.z) < 1.4) wp++;
    ts.player.yaw = Math.atan2(-(way[wp][0] - p.x), -(way[wp][1] - p.z));
    // anti-stick: a leg jogs sideways and a waypoint walker wedges on a wall
    if (lastP && Math.hypot(p.x - lastP.x, p.z - lastP.z) < 0.02) still++; else still = 0;
    lastP = { x: p.x, z: p.z };
    if (slideT > 0) { slideT--; stickX = slide; stickY = -0.35; }
    else if (still > 8) { slide = Math.random() < 0.5 ? -1 : 1; slideT = 16; still = 0; }
    else { stickX = 0; stickY = -1; }
    ts.input.stickX = stickX; ts.input.stickY = stickY;
  }
  return rows;
});

const up = R.filter((x) => x.on);
if (!up.length) {
  console.log('FAIL the needle never came up on a cleared leg');
} else {
  const last = up[up.length - 1];
  let peak = 0, snaps = 0;
  for (let i = 1; i < up.length; i++) {
    if (up[i].world === null || up[i - 1].world === null) continue;
    if (up[i].f !== up[i - 1].f + 1) continue;      // only consecutive frames
    let d = Math.abs(up[i].world - up[i - 1].world);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d > peak) peak = d;
    if (d > 0.35) snaps++;                          // 20 deg in one frame
  }
  const fade = R.filter((x) => !x.on && x.op > 0.02 && x.op < 0.98);
  console.log(`up on ${up.length} of ${R.length} frames`);
  console.log(`retires ${last.toDoor} m from the door  (want > 6 — never at the slab)`);
  console.log(`biggest one-frame turn while up ${(peak * 57.3).toFixed(1)} deg,`
    + ` snaps over 20 deg: ${snaps}  (want 0)`);
  console.log(`frames caught mid-fade: ${fade.length}  (want several — it fades, not cuts)`);
  if (last.toDoor < 6) console.log('FAIL it stayed up to the slab');
  if (snaps) console.log('FAIL it still snaps');
  if (!fade.length) console.log('FAIL it cut rather than faded');
}
await browser.close();
done('waydoor', errs);
