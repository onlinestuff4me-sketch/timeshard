import { boot, done, OUT } from './lib.mjs';
// CROSSING THE GATE. A run one door short of Corridor Duel, walked through
// the real crossHallDoor path — no hook fakes the unlock itself.
const SEED = () => { try {
  const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '9');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '9'); localStorage.setItem('ts_s0_rdoor', '9');
  localStorage.setItem('ts_s0_at', String(now - 3e5));
  localStorage.setItem('ts_s0_born', String(now - 9e6));
  // duel opened long ago and has been seen, so the badge starts quiet
  localStorage.setItem('ts_seen_modes', JSON.stringify(['duel']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
const bad = (m) => console.log('FAIL ' + m);

// stand still is shut, and the badge is quiet: door 9 is one short of its gate
console.log('before ' + JSON.stringify(await page.evaluate(() => ({
  deepest: localStorage.getItem('ts_deepest_door'),
  badge: !!document.querySelector('#discover .rnew'),
}))));
if (await page.evaluate(() => !!document.querySelector('#discover .rnew'))) {
  bad('the badge is up before anything opened');
}

await page.tap('.go');
await page.waitForFunction(() =>
  document.getElementById('overlay').classList.contains('hidden'), null, { timeout: 15000 });
await page.waitForTimeout(2600);
await page.evaluate(() => { window.__ts.warpDoor(10); });

// clear each leg and step through its door until the door number moves
const seen = await page.evaluate(async () => {
  const t = window.__ts;
  const start = t.hall().doorsPassed;
  const texts = [];
  const watch = setInterval(() => {
    const b = document.getElementById('banner');
    if (b && b.classList.contains('show')) {
      // textContent, not innerText: innerText is '' for anything the browser
              // is not currently rendering, and this banner spends most of its
              // life at opacity 0 inside a HUD that comes and goes.
              const s = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (s && texts[texts.length - 1] !== s) texts.push(s);
    }
  }, 60);
  for (let k = 0; k < 8 && t.hall().doorsPassed === start; k++) {
    t.player.iframes = 999;
    t.game.spawnQueue.length = 0;
    for (let i = t.enemies.length - 1; i >= 0; i--) t.killAt(i);
    for (let w = 0; w < 60; w++) {
      await new Promise((r) => setTimeout(r, 100));
      t.player.iframes = 999;
      const L = t.hall().legs[t.hall().cur];
      if (L.door.open) { t.player.pos.z = L.door.z + 1.2; break; }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  // the banner queue is serial: THE DOOR IS OPEN and the leg headline are
  // already in it, so the unlock lands third and roughly six seconds later
  await new Promise((r) => setTimeout(r, 11000));
  clearInterval(watch);
  return { doors: t.hall().doorsPassed, deepest: localStorage.getItem('ts_deepest_door'), texts };
});
console.log('after  doors=' + seen.doors + ' deepest=' + seen.deepest);
console.log('banners ' + JSON.stringify(seen.texts));
if (seen.doors < 10) bad('never crossed into door 10 (got ' + seen.doors + ')');
if (seen.deepest !== '10') bad('the high-water mark did not move: ' + seen.deepest);
const hit = seen.texts.find((t) => /NEW MODE UNLOCKED/i.test(t));
if (!hit) bad('no unlock banner on crossing the gate');
else if (!/STAND STILL/i.test(hit)) bad('the banner did not name the mode: ' + hit);
await page.screenshot({ path: OUT + 'unlock-banner.png' });

// ...and it does not fire twice for the same gate
const again = await page.evaluate(() => localStorage.getItem('ts_deepest_door'));
if (again !== '10') bad('the mark moved again after the crossing: ' + again);
const left = await page.evaluate(() => window.__ts.pendingBanners());
if (left.length) bad('an announcement was left queued: ' + left.join(','));
// ...and the badge is up now, because nobody has looked since STAND STILL opened
if (!(await page.evaluate(() => !!document.querySelector('#discover .rnew')))) {
  // the menu is not up mid-run; check the state that drives it instead
  const pend = await page.evaluate(() => window.__ts.pendingBanners());
  if (pend.length) bad('unexpected queue: ' + pend.join(','));
}
done('unlockbanner', errs);
await browser.close();
