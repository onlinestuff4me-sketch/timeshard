import { boot, done } from './lib.mjs';
// NO RETREAT CAN BE FINISHED.
//
// The mode gives the player no forward control on purpose — they come to you,
// and the corridor carries you on once the door opens. That makes the leg's
// release schedule load-bearing in a way it is not in the tunnel: if a body
// never comes out, the door never opens (it waits on an empty queue), and the
// run can neither end nor continue.
//
// That is what shipped. The strip is 6 cells, which splits into a body stretch
// spanning z 0-8 m and a 4-cell approach at 12-24 m; the player stands at z 0
// and never moves, so the only stretch that owes anybody is the one under
// their feet — and a placement needs 9 m of room with a 13 m first-sight
// floor. Every candidate was refused, for ever. Measured: two men out, three
// stuck in the queue, forty seconds of nothing.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '20');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '20'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1700);
await page.tap('#startnew');
await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="duel"]');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(3000);

const r = await page.evaluate(async () => {
  const t = window.__ts;
  let killed = 0, doorsOpened = 0, walkFrames = 0, wasOpen = false;
  let maxZ = 0, stuck = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < 40000) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    for (let k = t.enemies.length - 1; k >= 0; k--) {
      if (t.enemies[k].alive) { t.killAt(k); killed++; }
    }
    const L = t.hall().legs[t.hall().cur];
    const open = !!(L && L.door && L.door.open);
    if (open && !wasOpen) doorsOpened++;
    wasOpen = open;
    if (t.simpleState().walk) walkFrames++;
    maxZ = Math.max(maxZ, t.player.pos.z);
    // the deadlock signature: nobody on the floor, bodies still owed, door shut
    if (!t.enemies.length && t.game.spawnQueue.length && !open) stuck++;
  }
  return { killed, doorsOpened, walkFrames, maxZ: +maxZ.toFixed(1), stuck,
    doors: t.hall().doorsPassed, state: t.game.state };
});
console.log('40 seconds of shattering everything that appears:');
console.log('  bodies shattered:      ' + r.killed);
console.log('  doors opened:          ' + r.doorsOpened);
console.log('  rooms passed:          ' + r.doors);
console.log('  carried forward on:    ' + r.walkFrames + ' frames, reaching z ' + r.maxZ + ' m');
console.log('  frames deadlocked:     ' + r.stuck + '  (floor empty, bodies owed, door shut)');
console.log('  state at the end:      ' + r.state);

// The old build scored 2 / 0 / 0 / 0 m here and sat deadlocked for the lot.
if (r.killed < 8) bad('the wave never fielded its bodies: ' + r.killed + ' shattered in 40s');
if (!r.doorsOpened) bad('the door never opened, so the run cannot continue');
if (!r.walkFrames) bad('the corridor never carried the player forward');
if (r.maxZ < 24) bad('the player never left the first strip: reached z ' + r.maxZ + ' m');
if (r.doors < 1) bad('no room was ever completed');
// a beat of "floor empty, next body coming" is fine; a third of the run is not
if (r.stuck > 900) bad('the run spent ' + r.stuck + ' frames with nothing to do and no way on');
done('duel', errs);
await browser.close();
