import { boot, boxOf, done, OUT } from './lib.mjs';
// THE SELECTOR WITH A HISTORY: a deep tunnel save (everything unlocked) and a
// City Streets run played more recently than it.
const SEED = () => {
  try {
    localStorage.setItem('timeshard_taught', '1');
    const now = Date.now();
    localStorage.setItem('ts_s0_used', '1');
    localStorage.setItem('ts_s0_mode', 'hall');
    localStorage.setItem('ts_s0_doors', '24');
    localStorage.setItem('ts_s0_best', '24');
    localStorage.setItem('ts_s0_rdoor', '24');
    localStorage.setItem('ts_s0_shat', '410');
    localStorage.setItem('ts_s0_at', String(now - 6e5));
    localStorage.setItem('ts_s0_born', String(now - 9e6));
    localStorage.setItem('ts_s1_used', '1');
    localStorage.setItem('ts_s1_mode', 'wave');
    localStorage.setItem('ts_s1_best', '7');
    localStorage.setItem('ts_s1_at', String(now - 1e4));
    localStorage.setItem('ts_s1_born', String(now - 8e5));
    localStorage.setItem('ts_saves', JSON.stringify([
      { i: 0, name: '', num: 1, mode: 'hall' },
      { i: 1, name: '', num: 1, mode: 'wave' },
    ]));
  } catch {}
};
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1700);
const bad = (m) => console.log('FAIL ' + m);

// ---- 1. CONTINUE names the most recent run, across games -----------------
const go = await boxOf(page, '.go');
console.log('continue "' + (go && go.text) + '"');
if (!go || !/CONTINUE/.test(go.text)) bad('no CONTINUE with saves present');
if (!/CITY STREETS/.test(go.text)) bad('CONTINUE is not the most recently played run: ' + go.text);

// ---- 2. NEW RUN: the selector, with everything open ----------------------
await page.tap('#startnew');
await page.waitForTimeout(900);
const cards = await page.$$eval('#mslist .mscd', (ns) => ns.map((n) => ({
  mode: n.dataset.mode, locked: n.classList.contains('locked'),
  hero: n.classList.contains('hero'), tag: (n.querySelector('.mstag') || {}).textContent || '',
})));
const secs = await page.$$eval('#mslist .mssec', (ns) => ns.map((n) => n.textContent));
console.log('cards  ' + cards.map((c) => c.mode + (c.locked ? '(lock)' : '')).join(' '));
console.log('bands  ' + JSON.stringify(secs));
if (cards.some((c) => c.locked)) bad('something is still locked at 24 doors');
if (cards[0].mode !== 'hall' || !cards[0].hero) bad('THE TUNNEL is not the hero');
if (cards[1].mode !== 'wave') bad('the most recently played game is not directly under the hero');
if (!secs.some((t) => /PICK UP/.test(t))) bad('no recently-played band');
await page.screenshot({ path: OUT + 'sel-open.png' });

// ---- 3. the clips actually load and run ---------------------------------
await page.waitForTimeout(2200);
const vids = await page.$$eval('#mslist video', (ns) => ns.map((v) => ({
  mode: v.closest('.mscd').dataset.mode, src: (v.src || '').split('/').pop(),
  w: v.videoWidth, h: v.videoHeight, t: +v.currentTime.toFixed(2), paused: v.paused })));
for (const v of vids) console.log('  clip ' + v.mode.padEnd(5) + ' ' + (v.src || '(none)').padEnd(12)
  + ` ${v.w}x${v.h} t=${v.t} ${v.paused ? 'paused' : 'playing'}`);
const onscreen = vids.filter((v) => v.src);
if (!onscreen.length) bad('no preview clip loaded at all');
for (const v of onscreen) {
  if (!v.w || !v.h) bad(`${v.mode}'s clip has no picture (decode failed)`);
  if (v.w && Math.abs(v.w / v.h - 4 / 3) > 0.05) bad(`${v.mode}'s clip is not 4:3: ${v.w}x${v.h}`);
}
if (!onscreen.some((v) => v.t > 0)) bad('no clip ever advanced a frame');

// ---- 4. the tutorial checkbox is honoured -------------------------------
// Ticked, and on THE TUNNEL — the simplified games never run the lesson at
// all, so ticking the box for one of those would prove nothing.
const savesBefore = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('ts_saves') || '[]').length);
await page.tap('#mstutbox');
await page.waitForTimeout(200);
if (!(await page.evaluate(() => document.getElementById('mstutbox').checked))) {
  bad('the tutorial checkbox will not tick');
}
await page.tap('#mslist [data-mode="hall"]');
await page.waitForTimeout(3000);
const st = await page.evaluate(() => ({ state: window.__ts.game.state, mode: window.__ts.game.mode,
  tut: window.__ts.tutorState(),
  saves: JSON.parse(localStorage.getItem('ts_saves') || '[]').length }));
console.log('start  ' + JSON.stringify(st));
if (st.mode !== 'hall') bad('the tapped game did not start: ' + st.mode);
if (st.state === 'menu') bad('tapping a card started nothing');
if (st.tut.step === null) bad('the tutorial was asked for and is not running');
if (st.saves !== savesBefore + 1) {
  bad(`NEW RUN did not make a new save (${savesBefore} -> ${st.saves})`);
}

done('modesel2', errs);
await browser.close();
