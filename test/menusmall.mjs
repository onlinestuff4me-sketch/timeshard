import { chromium } from 'playwright';
import { URL, CHROME } from './lib.mjs';
// The menu has to survive a small phone: 375x667 is an iPhone SE, and the
// column no longer has a 132px block to absorb the slack.
const SIZES = [[375, 667], [390, 844], [402, 874], [430, 932]];
const errs = [];
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  ...(CHROME ? { executablePath: CHROME } : {}) });
for (const [w, h] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
      localStorage.setItem('ts_s0_doors', '2'); localStorage.setItem('ts_s0_best', '2');
      localStorage.setItem('ts_s0_rdoor', '3'); localStorage.setItem('ts_s0_shat', '15');
      localStorage.setItem('ts_s0_at', String(Date.now()));
      localStorage.setItem('ts_s0_born', String(Date.now() - 9e5));
    } catch {}
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(`${w}x${h} pageerror: ` + e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__ts, null, { timeout: 20000 });
  await page.waitForTimeout(1400);
  const r = await page.evaluate(() => {
    const g = (s) => { const n = document.querySelector(s); if (!n) return null;
      const st = getComputedStyle(n); if (st.display === 'none') return null;
      const b = n.getBoundingClientRect();
      return { x: +b.x.toFixed(1), right: +b.right.toFixed(1), y: +b.y.toFixed(1), bottom: +b.bottom.toFixed(1) }; };
    return { h1: g('h1'), go: g('.go'), run: g('#runrow'), alt: g('#altwrap'), row: g('#menurow'),
             scrollH: document.documentElement.scrollHeight };
  });
  const bad = [];
  for (const k of ['h1', 'go', 'run', 'alt', 'row']) {
    const e = r[k];
    if (!e) { bad.push(`${k} hidden`); continue; }
    if (e.x < 0 || e.right > w) bad.push(`${k} horizontal overflow (${e.x}..${e.right})`);
    if (e.y < 0) bad.push(`${k} clipped off the top (y=${e.y})`);
    if (e.bottom > h) bad.push(`${k} clipped off the bottom (${e.bottom} > ${h})`);
  }
  console.log(`${w}x${h}`.padEnd(9), bad.length ? 'FAIL ' + bad.join('; ')
    : `ok  title.y=${r.h1.y}  menurow.bottom=${r.row.bottom}  slack=${(h - r.row.bottom).toFixed(0)}px`);
  await ctx.close();
}
console.log('errors: ' + errs.length);
for (const e of errs) console.log('  ' + e);
await b.close();
