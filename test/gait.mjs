// A BODY THAT IS NOT GOING ANYWHERE STANDS STILL.
//
// The walk cycle used to run on `moveSpeed` — what the `advance` state WANTS
// to do, which is non-zero for every body in it. So a body pinned by the
// script, one whose heading is zeroed because it is holding the door approach
// or waiting for the player to enter its room, and one pressed against a wall
// all marched on the spot. It runs on measured displacement now. What must NOT
// stop with the legs: turning to face the player, and raising the gun.
import { boot, done } from './lib.mjs';

// A VIRGIN PROFILE, deliberately: this probe needs the onboarding running, so
// it must not seed `timeshard_taught`. On a fresh install the big button says
// PLAY and opens the mode board, and THE TUNNEL is the hero card — that path
// starts the run with the lesson armed, which is what we are here to watch.
const { browser, page, errs } = await boot();
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="hall"]');
await page.waitForFunction(() =>
  document.getElementById('overlay').classList.contains('hidden'), null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.tutor && __ts.tutor().step !== null,
  null, { timeout: 30000 });

const r = await page.evaluate(async () => {
  const ts = window.__ts;
  const frame = () => new Promise((res) => requestAnimationFrame(res));
  // area 12 of the onboarding: three men the script PINS in place
  ts.setTutorStep('exit');
  for (let k = 0; k < 3; k++) {
    ts.crossDoor();
    for (let i = 0; i < 30; i++) { await frame(); ts.player.iframes = 999; }
  }
  const yaw0 = ts.enemies.map((e) => e.g.rotation.y);
  let leg = 0, arm = 0, turn = 0, moved = 0, gait = 0;
  const states = new Set();
  const where0 = ts.bodies().map((b) => `${b.x},${b.z}`).join('|');
  for (let f = 0; f < 900; f++) {
    await frame(); ts.player.iframes = 999;
    // sidestep, so they have to keep turning to face
    ts.input.stickX = Math.sin(f / 60) > 0 ? 1 : -1; ts.input.stickY = 0;
    ts.enemies.forEach((e, i) => {
      leg = Math.max(leg, Math.abs(e.legL.rotation.x), Math.abs(e.legR.rotation.x));
      arm = Math.max(arm, Math.abs(e.armR.rotation.x));
      gait = Math.max(gait, e.gait || 0);
      turn = Math.max(turn, Math.abs(e.g.rotation.y - (yaw0[i] || 0)));
      states.add(e.state);
    });
    if (ts.bodies().map((b) => `${b.x},${b.z}`).join('|') !== where0) moved++;
  }
  const n = ts.enemies.length;

  // ...and a control: somebody actually walking at the player
  ts.setTutorStep('done');
  for (let i = 0; i < 30; i++) await frame();
  ts.warpDoor(3); ts.crossDoor();
  let wLeg = 0, wGait = 0, wSeen = 0;
  for (let f = 0; f < 900; f++) {
    await frame(); ts.player.iframes = 999;
    ts.input.stickX = 0; ts.input.stickY = 0;
    for (const e of ts.enemies) {
      if (e.state === 'assemble') continue;
      wSeen++;
      wLeg = Math.max(wLeg, Math.abs(e.legL.rotation.x));
      wGait = Math.max(wGait, e.gait || 0);
    }
  }
  return { n, leg, arm, turn, moved, gait, states: [...states], wLeg, wGait, wSeen };
});

console.log(`${r.n} pinned men, 900 frames, player sidestepping`);
console.log(`  states: ${r.states.join(', ')}`);
console.log(`  frames any of them moved:  ${r.moved}   (want 0 — they are pinned)`);
console.log(`  biggest LEG rotation:      ${r.leg.toFixed(4)} rad  (want 0)`);
console.log(`  biggest firing-ARM:        ${r.arm.toFixed(3)} rad  (want > 0.5 — the gun comes up)`);
console.log(`  biggest TURN to track you: ${(r.turn * 57.3).toFixed(0)} deg  (want > 10)`);
if (r.leg > 0.02) console.log('FAIL a stationary body is still walking on the spot');
if (r.arm < 0.5) console.log('FAIL the firing arm no longer comes up');
if (r.turn * 57.3 < 10) console.log('FAIL they no longer turn to face the player');
console.log(`control: a body advancing — ${r.wSeen} frames, peak gait ${r.wGait.toFixed(2)} m/s,`
  + ` biggest leg ${r.wLeg.toFixed(3)} rad  (want a real stride, ~0.6)`);
if (r.wSeen && r.wLeg < 0.4) console.log('FAIL a walking body has lost its stride');
if (r.wGait > 20) console.log('FAIL a placement is being read as a step');
await browser.close();
done('gait', errs);
