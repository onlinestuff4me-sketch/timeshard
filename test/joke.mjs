// THE DEAD END'S MAN, AND THE DEATH THAT IS A JOKE.
//
// One arm of the opening T is a gag: two painted warnings, then somebody with
// his arm already up. Three things have to hold, and none of them is obvious
// from reading the code.
//
//   1. He belongs to the BRANCH, not to the leg. He is placed when the player
//      walks into it and taken away when they walk out — because `cleared`
//      advances on `!enemies.length`, so a man left standing round two
//      corners is a shooting lesson that can never be finished.
//   2. The round cannot be beaten from inside. "Fast" is not the same as
//      "unwinnable": every round in this game is aimed at where you are, so a
//      perfect sideways input beats any finite speed. What settles it is that
//      he does not stop and the corridor is one cell wide.
//   3. Dying down there is not a failure. No card, no button, no run filed —
//      a beat of red and you are back on the approach reading the sign you
//      ignored.
import { boot, done } from './lib.mjs';
const { browser, page, errs } = await boot({ seed: () => { try { localStorage.clear(); } catch { /* private */ } } });
const bad = (m) => { console.log('FAIL ' + m); errs.push(m); };

await page.waitForTimeout(1600);
await page.tap('.go'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="hall"]');
await page.waitForFunction(() => window.__ts.tutor && __ts.tutor().step !== null,
  null, { timeout: 30000 });
await page.waitForTimeout(1200);

// Leg-relative cells, the same coordinates src/tutorial.js authors them in.
const putAt = (dx, dz, yaw) => page.evaluate(([x, z, y]) => {
  const t = window.__ts, C = 4, o = t.hall().legs[t.hall().cur].spine[0];
  t.player.pos.x = (o[0] + x) * C; t.player.pos.z = (o[1] + z) * C;
  if (y != null) { t.player.yaw = y; t.player.pitch = 0; }
  t.player.vel.set(0, 0, 0);
  t.resyncSpine && t.resyncSpine();
}, [dx, dz, yaw]);
const dead = () => page.evaluate(() => window.__ts.tutor().dead);

// ---- 1. he is the branch's, and only while somebody is in it --------------
await putAt(4, 11, null);                     // the good arm
await page.waitForTimeout(400);
if ((await dead()).joker) bad('a man is standing in the dead end with nobody in it');
await putAt(-1, 11, Math.PI / 2);             // one step into the joke
await page.waitForTimeout(400);
if (!(await dead()).joker) bad('walking into the branch did not place him');
await putAt(4, 11, null);
await page.waitForTimeout(400);
if ((await dead()).joker) bad('walking out of the branch left him standing');

// ---- 2. from one cell in, every perfect input dies ------------------------
// Facing him is yaw PI/2 (forward is (-sin yaw, -cos yaw), so this is -x).
// stickY -1 is forward, +1 back; stickX is the sidestep.
const CASES = [['stand', 0, 0], ['run back', 0, 1], ['strafe L', 1, 0], ['strafe R', -1, 0]];
for (const [name, sx, sy] of CASES) {
  // HE HAS TO BE STANDING BEFORE THE CLOCK STARTS. He assembles over a couple
  // of seconds, and a walking player spends twenty metres of branch getting to
  // the corner — so a probe that teleports straight to it measures the swarm
  // rather than the ambush.
  await putAt(-1, 11, Math.PI / 2);
  await page.waitForTimeout(2600);
  const out = await page.evaluate(async ([SX, SY]) => {
    const t = window.__ts, C = 4, o = t.hall().legs[t.hall().cur].spine[0];
    t.player.pos.x = (o[0] - 4) * C; t.player.pos.z = (o[1] + 9) * C;
    t.player.yaw = Math.PI / 2; t.player.pitch = 0;
    t.player.vel.set(0, 0, 0); t.player.iframes = 0;
    t.resyncSpine && t.resyncSpine();
    const t0 = performance.now();
    let fired = null;
    while (performance.now() - t0 < 6000) {
      await new Promise((r) => requestAnimationFrame(r));
      if (t.player.alive) { t.input.stickX = SX; t.input.stickY = SY; }
      const b = t.bullets.find((x) => !x.fromPlayer);
      if (b && fired === null) fired = +((performance.now() - t0) / 1000).toFixed(2);
      if (!t.player.alive) {
        t.input.stickX = t.input.stickY = 0;
        return { hit: +((performance.now() - t0) / 1000).toFixed(2), fired };
      }
    }
    t.input.stickX = t.input.stickY = 0;
    return { hit: null, fired };
  }, [sx, sy]);
  console.log(`  ${name.padEnd(9)} fired ${String(out.fired).padEnd(5)} hit ${out.hit}`);
  if (out.hit === null) bad(`"${name}" escaped the dead end one cell in`);
  await page.waitForTimeout(2600);   // let the joke put them back
}

// ---- 3. the death is a joke, not a retry screen ---------------------------
await putAt(-1, 11, Math.PI / 2);
await page.waitForTimeout(2600);
const end = await page.evaluate(async () => {
  const t = window.__ts, C = 4, o = t.hall().legs[t.hall().cur].spine[0];
  t.player.pos.x = (o[0] - 4) * C; t.player.pos.z = (o[1] + 9) * C;
  t.player.yaw = Math.PI / 2; t.player.pitch = 0; t.player.iframes = 0;
  t.resyncSpine && t.resyncSpine();
  const ov = document.getElementById('overlay');
  let cardSeen = false;
  const t0 = performance.now();
  while (performance.now() - t0 < 6000) {
    await new Promise((r) => requestAnimationFrame(r));
    if (!ov.classList.contains('hidden')) cardSeen = true;
    if (!t.player.alive) continue;
    if (performance.now() - t0 > 3000) break;   // dead, red, and back again
  }
  return {
    cardSeen, alive: t.player.alive,
    back: { x: +(t.player.pos.x / C).toFixed(2), z: +(t.player.pos.z / C).toFixed(2) },
    org: o, yaw: +t.player.yaw.toFixed(2),
    red: +getComputedStyle(document.getElementById('redflash')).opacity,
    dead: t.tutor().dead, step: t.tutor().step,
  };
});
if (end.cardSeen) bad('the joke put up a retry screen');
if (!end.alive) bad('the joke never handed the player back');
if (end.red > 0.01) bad(`the red screen is still up (opacity ${end.red})`);
const rel = { x: end.back.x - end.org[0], z: end.back.z - end.org[1] };
console.log(`  back at leg cell [${rel.x}, ${rel.z}] yaw ${end.yaw} step ${end.step}`);
if (rel.x !== 0 || rel.z !== 9) bad(`put back at [${rel.x}, ${rel.z}], not the junction approach`);
// Facing the signpost is +z, which is yaw PI.
if (Math.abs(Math.abs(end.yaw) - Math.PI) > 0.02) bad(`facing ${end.yaw}, not the signpost`);
if (end.dead.joker) bad('his body followed the player back to the junction');

done('joke', errs);
await browser.close();
