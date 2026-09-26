import { boot, done } from './lib.mjs';
// FLOORS (docs/ARSENAL.md §1): 9/7/7/7/9 doors, the HUD names the floor, a new
// floor is announced on its first door, and that first door out of the
// elevator eases the pressure (WARMUP). Floor 1 has no warm-up: it is the
// opening ramp.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '8');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'blinker']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

const map = await page.evaluate(() => [1, 9, 10, 16, 17, 23, 24, 30, 31, 39, 40]
  .map((d) => { const f = window.__ts.floorOf(d); return `${d}:F${f.floor}${d === f.last ? '*' : ''}`; }).join(' '));
console.log('floors:   ' + map);
if (map !== '1:F1 9:F1* 10:F2 16:F2* 17:F3 23:F3* 24:F4 30:F4* 31:F5 39:F5* 40:F6') bad('the floor map is not 9/7/7/7/9');

const at = () => page.evaluate(() => ({ door: window.__ts.hall().doorsPassed + 1,
  hud: window.__ts.hudText(), warm: window.__ts.warmup(), alive: window.__ts.leg().alive }));
let s = await at();
console.log('door 8:   ' + JSON.stringify(s));
if (!/^F1\b/.test(s.hud)) bad('the HUD does not name floor 1: ' + s.hud);
if (s.warm) bad('door 8 is not a warm-up door');
// on to door 10, a leg at a time
const seen = [];
for (let i = 0; i < 8 && (await page.evaluate(() => window.__ts.hall().doorsPassed + 1)) < 11; i++) {
  await page.evaluate(() => { window.__ts.game.spawnQueue.length = 0; window.__ts.enemies.length = 0; window.__ts.crossDoor(); });
  await page.waitForTimeout(400);
  const now = await at();
  if (now.door === 10 && !seen.some((x) => x.door === 10)) seen.push(now);
  if (now.door === 11 && !seen.some((x) => x.door === 11)) seen.push(now);
}
const d10 = seen.find((x) => x.door === 10), d11 = seen.find((x) => x.door === 11);
console.log('door 10:  ' + JSON.stringify(d10));
console.log('door 11:  ' + JSON.stringify(d11));
if (!d10 || !/^F2\b/.test(d10.hud)) bad('the HUD does not name floor 2 on door 10');
if (!d10 || !d10.warm) bad('door 10 is not the warm-up door');
if (d11 && d11.warm) bad('door 11 is still a warm-up door');
const banners = await page.evaluate(() => window.__ts.banners());
if (!banners.includes('FLOOR 2')) bad('no FLOOR 2 banner: ' + JSON.stringify(banners));

done('floors', errs);
await browser.close();
