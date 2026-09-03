import { boot, done } from './lib.mjs';
// THE COLLIDING GATE. Corridor Duel opens on door 5, which is crossed on the
// same step that hands over slow motion — and that door runs the slow-time
// school, which owns the screen. The announcement must be HELD, not dropped.
const SEED = () => { try {
  const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '4');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '4'); localStorage.setItem('ts_s0_rdoor', '4');
  localStorage.setItem('ts_s0_at', String(now - 3e5));
  localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
const bad = (m) => console.log('FAIL ' + m);

await page.tap('.go');
await page.waitForFunction(() =>
  document.getElementById('overlay').classList.contains('hidden'), null, { timeout: 15000 });
await page.waitForTimeout(2600);
await page.evaluate(() => { window.__ts.warpDoor(5); });
const r = await page.evaluate(async () => {
  const t = window.__ts;
  const start = t.hall().doorsPassed;
  for (let k = 0; k < 8 && t.hall().doorsPassed === start; k++) {
    t.player.iframes = 999; t.game.spawnQueue.length = 0;
    for (let i = t.enemies.length - 1; i >= 0; i--) t.killAt(i);
    for (let w = 0; w < 60; w++) {
      await new Promise((r) => setTimeout(r, 100));
      t.player.iframes = 999;
      const L = t.hall().legs[t.hall().cur];
      if (L.door.open) { t.player.pos.z = L.door.z + 1.2; break; }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  await new Promise((r) => setTimeout(r, 2500));
  return { doors: t.hall().doorsPassed, deepest: localStorage.getItem('ts_deepest_door'),
           tutor: t.tutorState().step, queued: t.pendingBanners() };
});
console.log('door5  ' + JSON.stringify(r));
if (r.doors < 5) bad('never crossed into door 5');
if (r.deepest !== '5') bad('the gate did not open: ' + r.deepest);
// The school is standing on this door, so the announcement is waiting rather
// than gone. If some future change takes the school off door 5 it will have
// been shown instead, and the queue is empty — both are correct.
if (r.tutor !== null && !r.queued.includes('duel')) {
  bad('the school owns the screen and the announcement was dropped, not held');
}
if (r.tutor === null && r.queued.length) {
  bad('nothing owns the screen but the announcement is still waiting');
}
done('unlockdefer', errs);
await browser.close();
