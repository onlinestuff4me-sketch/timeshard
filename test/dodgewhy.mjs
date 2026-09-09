import { boot, done, OUT } from './lib.mjs';
// WHY THE DODGE COACH SPOKE. The complaint this beat attracts is always the
// same — "it told me to dodge something that was never going to hit me" — and
// it is a claim about three numbers, not an impression. This probe plays the
// opening rooms as a player who ACTUALLY DODGES: it watches every incoming
// round and steps out of its lane the moment it is in the air. A telling is
// then only correct if, at the frame it fired, the round was still on its way
// to within the lane.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught','1'); localStorage.setItem('ts_deepest_door','40');
  localStorage.setItem('ts_s0_used','1'); localStorage.setItem('ts_s0_mode','hall');
  localStorage.setItem('ts_s0_doors','40'); localStorage.setItem('ts_s0_rdoor','1');
  localStorage.setItem('ts_s0_at',String(now-3e5)); localStorage.setItem('ts_s0_born',String(now-9e6));
  localStorage.setItem('ts_saves',JSON.stringify([{i:0,name:'',num:1,mode:'hall'}]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1700);
await page.tap('#startnew'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(1200);

// ---- A PLAYER WHO DODGES ------------------------------------------------
// Every frame: find the incoming round that comes closest to us, and if it is
// going to come inside a metre, step across its line. Clear the room by
// shooting, so the run walks forward through the doors under its own power.
const played = await page.evaluate(async (SECS) => {
  const t = window.__ts;
  const t0 = performance.now();
  let lastShot = 0;
  const seen = [];
  while (performance.now() - t0 < SECS * 1000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;                    // the point is the coach, not dying
    // step out of the lane of anything on its way to us
    let worst = null, worstMiss = 1e9;
    for (const b of t.bullets) {
      if (b.fromPlayer) continue;
      const vx = b.vel.x, vz = b.vel.z, sp2 = vx*vx + vz*vz;
      if (sp2 < 1e-6) continue;
      const dx = t.player.pos.x - b.pos.x, dz = t.player.pos.z - b.pos.z;
      const tt = (dx*vx + dz*vz) / sp2;
      if (tt <= 0) continue;
      const miss = Math.hypot(dx - vx*tt, dz - vz*tt);
      if (miss < worstMiss) { worstMiss = miss; worst = b; }
    }
    // ...THROUGH THE STICK, at a thumb's speed, not by teleporting. A probe
    // that jumps 0.22 m a frame is moving at thirteen metres a second and is
    // never IN the lane on the frame the coach looks — which proves nothing
    // about a player, who is mid-drag at that moment. The whole complaint is
    // about that middle.
    if (worst && worstMiss < 1.6) {
      const vx = worst.vel.x, vz = worst.vel.z, sp = Math.hypot(vx, vz) || 1;
      const nx = -vz / sp;
      const side = ((t.player.pos.x - worst.pos.x) * nx) >= 0 ? 1 : -1;
      t.input.stickX = side; t.input.stickY = 0;
    } else { t.input.stickX = 0; t.input.stickY = 0; }
    // ...and clear the room, so the doors keep coming. Slowly: the point of
    // the probe is the rounds in the air, so the men get time to fire before
    // they go down.
    const now = performance.now();
    if (now - lastShot > 2600) {
      const k = t.enemies.findIndex((e) => e.alive);
      if (k >= 0) { t.killAt(k); lastShot = now; }
    }
    const s = t.simpleState();
    if (s.saidWhy.length > seen.length) seen.push(...s.saidWhy.slice(seen.length));
  }
  const s = t.simpleState();
  return { why: s.saidWhy, said: s.said, room: t.hall().doorsPassed + 1 };
}, 70);

console.log('rooms reached:   ' + played.room);
console.log('said:            ' + JSON.stringify(played.said));
for (const w of played.why) console.log('  telling ' + JSON.stringify(w));
if (!played.why.length) bad('nothing taught at all in seventy seconds — the probe learnt nothing');

// THE LANE IS 0.75 m (TUTOR.dodgeLaneM), measured with BOTH of them moving:
// a round that is going to pass wider than that, given the drag the player is
// already in the middle of, is not a round they are failing to answer.
for (const w of played.why) {
  if (w.miss > 0.75) bad('taught a round that misses by ' + w.miss + ' m: ' + JSON.stringify(w));
}
// ...AND NEVER WITH NO TIME LEFT IN IT. `teach.warnS` is 0.7 s. This is what
// went wrong in the shipped build: the repeat fired 0.40 s before the round
// arrived, which is the result being read out rather than a warning.
for (const w of played.why) {
  if (w.eta < 0.7) bad('taught with only ' + w.eta + ' s left: ' + JSON.stringify(w));
}
// ...AND A PLAYER WHO DODGES IS NOT CORRECTED. The second telling has to be
// earned by missing one; this probe steps out of every lane it is put in, so
// the introduction is the only line it should ever hear.
if (played.said.dodge > 1) {
  bad('a player who dodged everything was still told ' + played.said.dodge + ' times');
}
await page.screenshot({ path: OUT + 'dodgewhy.png' });

done('dodgewhy', errs);
await browser.close();
