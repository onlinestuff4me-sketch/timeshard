import { boot, boxOf, done, OUT } from './lib.mjs';

const SEED = () => {
  try {
    localStorage.setItem('ts_s0_used', '1');
    localStorage.setItem('ts_s0_mode', 'hall');
    localStorage.setItem('ts_s0_doors', '2');
    localStorage.setItem('ts_s0_best', '2');
    localStorage.setItem('ts_s0_rdoor', '3');
    localStorage.setItem('ts_s0_shat', '15');
    localStorage.setItem('ts_s0_unlocks', JSON.stringify(['gunner', 'corridor', 'pistol']));
    localStorage.setItem('ts_s0_at', String(Date.now()));
    localStorage.setItem('ts_s0_born', String(Date.now() - 9e5));
    // a SECOND run, so OTHER RUNS has something to be about
    localStorage.setItem('ts_s1_used', '1');
    localStorage.setItem('ts_s1_mode', 'hall');
    localStorage.setItem('ts_s1_rdoor', '1');
    localStorage.setItem('ts_s1_at', String(Date.now() - 4e5));
    localStorage.setItem('ts_s1_born', String(Date.now() - 5e5));
    localStorage.setItem('ts_saves', JSON.stringify([
      { i: 0, name: '', num: 1, mode: 'hall' }, { i: 1, name: '', num: 2, mode: 'hall' }]));
    localStorage.setItem('ts_menumode', 'hall');
  } catch {}
};

const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
const bad = (m) => { console.log('FAIL ' + m); };
const W = 402, H = 874;

// ---- 1. the title screen fits, and reads top to bottom ---------------------
const title = await boxOf(page, '#titleblock');
const go = await boxOf(page, '.go');
const run = await boxOf(page, '#runrow');
const nrun = await boxOf(page, '#startnew');
const alt = await boxOf(page, '#altwrap');
const arch = await boxOf(page, '#discover');
const row = await boxOf(page, '#menurow');
for (const [n, b] of [['titleblock', title], ['go', go], ['runrow', run],
                      ['startnew', nrun], ['altwrap', alt], ['menurow', row]]) {
  if (!b) { bad(`${n} not visible on the menu`); continue; }
  if (b.x < 0 || b.right > W) bad(`${n} runs off screen: x=${b.x} right=${b.right}`);
  if (b.y < 0 || b.bottom > H) bad(`${n} runs off screen vertically: y=${b.y} bottom=${b.bottom}`);
}
// THE CORNERS ARE IN THE CORNERS. menurow is absolutely positioned at the top
// now, clear of the column the eye travels down.
const how = await boxOf(page, '#howtolink');
const set = await boxOf(page, '#setlink');
if (how && how.x > 90) bad(`the how-to button is not in the left corner: x=${how.x}`);
if (set && set.right < W - 110) bad(`settings is not in the right corner: right=${set.right}`);
if (title && row && row.bottom > title.y) bad('the corner row runs into the title');
// ...AND THE MIDDLE IS EMPTY, which is the whole point: the corridor shows
// through between the title and the buttons.
const gap = go && title ? go.y - title.bottom : 0;
console.log('breathe  title.bottom=' + (title && title.bottom) + ' go.y=' + (go && go.y)
  + ' gap=' + gap.toFixed(0) + 'px');
if (gap < 90) bad(`only ${gap.toFixed(0)}px of art between the title and the buttons`);
// TAP TARGETS. 44px is what a thumb actually covers, and it is the standard
// for the paired rows — two side-by-side targets are where a miss lands
// between them and does nothing. The tier-3 links at the bottom are a
// deliberate 31px: they are quiet utility, tapped rarely, and they predate
// this change. Asserted at their real size so a regression still shows.
for (const [n, sel, min] of [['CONTINUE', '.go', 44],
                             ['NEW RUN', '#startnew', 44], ['UNLOCKS', '#discover', 44],
                             ['OTHER RUNS', '#newrun', 28],
                             ['HOW TO PLAY', '#howtolink', 38], ['SETTINGS', '#setlink', 38]]) {
  const b = await boxOf(page, sel);
  if (!b) { bad(`${n} missing`); continue; }
  if (b.h < min) bad(`${n} is only ${b.h}px tall (wants ${min})`);
}
console.log('layout   go.h=' + (go && go.h) + ' altwrap=' + (alt && alt.h)
  + ' unlocks="' + (arch && arch.text) + '"');
// nothing stacks on top of anything else, in the order they are read
if (go && run && run.y < go.bottom) bad('OTHER RUNS overlaps CONTINUE');
if (run && nrun && nrun.y < run.bottom) bad('NEW RUN overlaps OTHER RUNS');
if (nrun && alt && alt.y < nrun.bottom) bad('UNLOCKS overlaps NEW RUN');

// ---- 2. the unlocks fraction on the button is the real one -----------------
const dd = await page.evaluate(() => {
  const t = document.querySelector('#discover .rval');
  const bar = document.querySelector('#discover .rbar i');
  return { frac: t && t.textContent.trim(), width: bar && bar.style.width };
});
console.log('unlocks  button=' + JSON.stringify(dd));
if (!dd.frac || !/^\d+ \/ \d+$/.test(dd.frac)) bad('UNLOCKS button has no fraction: ' + dd.frac);
if (!dd.width) bad('the UNLOCKS progress bar has no width');

// ---- 3. NEW RUN opens the selector, with the tutorial question on it ------
await page.tap('#startnew');
await page.waitForTimeout(700);
if (!(await boxOf(page, '#modesel'))) bad('NEW RUN did not open the selector');
const tut = await boxOf(page, '#mstut');
console.log('newrun   selector open, tutorial checkbox=' + (tut ? 'shown' : 'MISSING'));
if (!tut) bad('the NEW RUN path is not asking about the tutorial');
if (await page.evaluate(() => document.getElementById('mstutbox').checked)) {
  bad('the tutorial checkbox is ticked by default');
}
await page.screenshot({ path: OUT + 'menu-newrun.png' });
// BACK leaves everything as it was
await page.tap('#modeselclose');
await page.waitForTimeout(400);
if (await boxOf(page, '#modesel')) bad('BACK did not close the selector');
if (await page.evaluate(() => window.__ts.game.state) !== 'menu') bad('BACK started a run');

// ---- 4. UNLOCKS opens, and the lifetime stat is in it ---------------------
await page.tap('#discover');
await page.waitForTimeout(400);
if (!(await boxOf(page, '#unlocks'))) bad('the UNLOCKS button did not open UNLOCKS');
const meta = await page.evaluate(() => document.getElementById('unlockmeta').textContent);
console.log('unlockmeta "' + meta + '"');
if (!/SHATTERED/.test(meta)) bad('the lifetime stat did not land in the UNLOCKS header');
if (!/DOOR/.test(meta)) bad('the UNLOCKS header lost its door count');
await page.screenshot({ path: OUT + 'menu-unlocks.png' });
await page.tap('body', { position: { x: 200, y: 24 } });
await page.waitForTimeout(350);
if (await boxOf(page, '#unlocks')) bad('UNLOCKS would not close');

// ---- 5. CONTINUE still starts the run it names -----------------------------
await page.tap('.go');
await page.waitForTimeout(2500);
const st = await page.evaluate(() => ({ state: window.__ts.game.state, mode: window.__ts.game.mode }));
console.log('continue ' + JSON.stringify(st));
if (st.state === 'menu') bad('CONTINUE did not start anything');
if (st.mode !== 'hall') bad('CONTINUE started the wrong mode: ' + st.mode);

// ---- 6. back to the menu: the pair comes back, laid out the same ----------
// the real exit, not a poked state flag: pause -> END RUN -> the ended card
await page.tap('#pausebtn');
await page.waitForTimeout(400);
await page.tap('#pendrun');
await page.waitForTimeout(1800);
const deadAlt = await boxOf(page, '#altwrap');
if (deadAlt) bad('the MODE/ARCHIVE row is still up on the death screen');
await page.tap('#menubtn');
await page.waitForTimeout(1200);
const alt2 = await boxOf(page, '#altwrap');
console.log('return   altwrap=' + JSON.stringify(alt2 && { x: alt2.x, w: alt2.w, h: alt2.h }));
if (!alt2) bad('the UNLOCKS row did not come back with the menu');
if (alt2 && alt && (Math.abs(alt2.x - alt.x) > 0.6 || Math.abs(alt2.h - alt.h) > 0.6)) {
  bad('the row came back a different shape');
}
if (alt2 && !/UNLOCKS/.test(alt2.text)) bad('UNLOCKS lost its label on the way back');

done('menu', errs);
await browser.close();
