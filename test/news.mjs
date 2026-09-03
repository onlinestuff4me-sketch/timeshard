import { boot, boxOf, done, OUT } from './lib.mjs';
// A save deep enough that CORRIDOR DUEL has opened, and nothing has been told
// to the player about it yet.
const SEED = () => { try {
  const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '6'); localStorage.setItem('ts_s0_best', '6');
  localStorage.setItem('ts_s0_rdoor', '6'); localStorage.setItem('ts_s0_at', String(now - 3e5));
  localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1700);
const bad = (m) => console.log('FAIL ' + m);
const badge = () => page.evaluate(() => {
  const n = document.querySelector('#discover .rnew');
  return n ? n.textContent : null;
});

// ---- the badge is up, because a mode opened and nobody has looked --------
console.log('badge  ' + JSON.stringify(await badge()));
if (await badge() !== 'NEW') bad('no NEW badge with an unshown unlock');
const b = await boxOf(page, '#discover .rnew');
if (b && (b.x < 0 || b.right > 402 || b.y < 0)) bad('the badge is off screen');
await page.screenshot({ path: OUT + 'news-badge.png' });

// ---- opening UNLOCKS is being told --------------------------------------
await page.tap('#discover');
await page.waitForTimeout(600);
if (!(await boxOf(page, '#unlocks'))) bad('UNLOCKS did not open');
await page.tap('body', { position: { x: 200, y: 24 } });
await page.waitForTimeout(500);
console.log('after  ' + JSON.stringify(await badge()));
if (await badge() !== null) bad('the badge survived being looked at');
// ...and it stays cleared across a relaunch
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__ts, null, { timeout: 20000 });
await page.waitForTimeout(1500);
console.log('reload ' + JSON.stringify(await badge()));
if (await badge() !== null) bad('the badge came back after a relaunch');

// ---- the tunnel never wears NEW -----------------------------------------
await page.tap('#startnew');
await page.waitForTimeout(800);
const cards = await page.$$eval('#mslist .mscd', (ns) => ns.map((n) => ({
  mode: n.dataset.mode, tag: (n.querySelector('.mstag') || {}).textContent || '' })));
console.log('cards  ' + cards.map((c) => c.mode + (c.tag ? '[' + c.tag + ']' : '')).join(' '));
const tunnel = cards.find((c) => c.mode === 'hall');
if (tunnel && tunnel.tag) bad('THE TUNNEL is wearing a ' + tunnel.tag + ' badge');
const duel = cards.find((c) => c.mode === 'duel');
if (!duel || duel.tag !== 'NEW') bad('CORRIDOR DUEL is open and unplayed but not marked NEW');
done('news', errs);
await browser.close();
