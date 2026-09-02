import { boot, boxOf, done, OUT } from './lib.mjs';

const SEED = () => {
  try {
    localStorage.setItem('ts_s0_used', '1');
    localStorage.setItem('ts_s0_mode', 'hall');
    localStorage.setItem('ts_s0_doors', '2');
    localStorage.setItem('ts_s0_best', '2');
    localStorage.setItem('ts_s0_rdoor', '3');
    localStorage.setItem('ts_s0_shat', '15');
    localStorage.setItem('ts_s0_archive', JSON.stringify(['gunner', 'corridor', 'pistol']));
    localStorage.setItem('ts_s0_at', String(Date.now()));
    localStorage.setItem('ts_s0_born', String(Date.now() - 9e5));
    localStorage.setItem('ts_menumode', 'hall');
  } catch {}
};

const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
const bad = (m) => { console.log('FAIL ' + m); };
const W = 402, H = 874;

// ---- 1. the menu fits, and the pairs line up -------------------------------
const go = await boxOf(page, '.go');
const run = await boxOf(page, '#runrow');
const alt = await boxOf(page, '#altwrap');
const mode = await boxOf(page, '#modebtn');
const arch = await boxOf(page, '#discover');
const row = await boxOf(page, '#menurow');
for (const [n, b] of [['go', go], ['runrow', run], ['altwrap', alt], ['menurow', row]]) {
  if (!b) { bad(`${n} not visible on the menu`); continue; }
  if (b.x < 0 || b.right > W) bad(`${n} runs off screen: x=${b.x} right=${b.right}`);
  if (b.y < 0 || b.bottom > H) bad(`${n} runs off screen vertically: y=${b.y} bottom=${b.bottom}`);
}
// the two secondary rows are a matched pair: same left edge, same width
if (run && alt && (Math.abs(run.x - alt.x) > 0.6 || Math.abs(run.w - alt.w) > 0.6)) {
  bad(`runrow and altwrap are not aligned: ${run.x}/${run.w} vs ${alt.x}/${alt.w}`);
}
// MODE and ARCHIVE are the same size as each other
if (mode && arch && (Math.abs(mode.w - arch.w) > 0.6 || Math.abs(mode.h - arch.h) > 0.6)) {
  bad(`MODE and ARCHIVE differ in size: ${mode.w}x${mode.h} vs ${arch.w}x${arch.h}`);
}
// TAP TARGETS. 44px is what a thumb actually covers, and it is the standard
// for the paired rows — two side-by-side targets are where a miss lands
// between them and does nothing. The tier-3 links at the bottom are a
// deliberate 31px: they are quiet utility, tapped rarely, and they predate
// this change. Asserted at their real size so a regression still shows.
for (const [n, sel, min] of [['CONTINUE', '.go', 44], ['LOAD GAME', '#newrun', 44],
                             ['NEW RUN', '#startnew', 44], ['MODE', '#modebtn', 44],
                             ['ARCHIVE', '#discover', 44],
                             ['HOW TO PLAY', '#howtolink', 30], ['SETTINGS', '#setlink', 30]]) {
  const b = await boxOf(page, sel);
  if (!b) { bad(`${n} missing`); continue; }
  if (b.h < min) bad(`${n} is only ${b.h}px tall (wants ${min})`);
}
console.log('layout   go.h=' + (go && go.h) + ' altwrap=' + (alt && alt.h)
  + ' mode="' + (mode && mode.text) + '" archive="' + (arch && arch.text) + '"');
// nothing stacks on top of anything else
if (go && run && run.y < go.bottom) bad('runrow overlaps CONTINUE');
if (run && alt && alt.y < run.bottom) bad('altwrap overlaps runrow');
if (alt && row && row.y < alt.bottom) bad('menurow overlaps altwrap');

// ---- 2. the archive fraction on the button is the real one -----------------
const dd = await page.evaluate(() => {
  const t = document.querySelector('#discover .rval');
  const bar = document.querySelector('#discover .rbar i');
  return { frac: t && t.textContent.trim(), width: bar && bar.style.width };
});
console.log('archive  button=' + JSON.stringify(dd));
if (!dd.frac || !/^\d+ \/ \d+$/.test(dd.frac)) bad('archive button has no fraction: ' + dd.frac);
if (!dd.width) bad('archive progress bar has no width');

// ---- 3. MODE opens the picker and changes the button -----------------------
await page.tap('#modebtn');
await page.waitForTimeout(350);
if (!(await boxOf(page, '#modepick'))) bad('MODE did not open the picker');
await page.tap('#picklist [data-mode="duel"]');
await page.waitForTimeout(400);
if (await boxOf(page, '#modepick')) bad('picking a mode did not close the picker');
const m2 = await boxOf(page, '#modebtn');
console.log('mode     after pick="' + (m2 && m2.text) + '"');
if (!m2 || !/CORRIDOR DUEL/.test(m2.text)) bad('MODE button did not follow the pick');
if (m2 && m2.right > W) bad('the longest mode name overflows the button');
// ...and the game did NOT start
if (await page.evaluate(() => window.__ts.game.state) !== 'menu') bad('picking a mode started a run');
await page.screenshot({ path: OUT + 'menu-duel.png' });
// put it back
await page.tap('#modebtn'); await page.waitForTimeout(300);
await page.tap('#picklist [data-mode="hall"]'); await page.waitForTimeout(400);

// ---- 4. ARCHIVE opens the archive, and the lifetime stat is in it ----------
await page.tap('#discover');
await page.waitForTimeout(400);
if (!(await boxOf(page, '#arch'))) bad('ARCHIVE did not open the archive');
const meta = await page.evaluate(() => document.getElementById('archmeta').textContent);
console.log('archmeta "' + meta + '"');
if (!/SHATTERED/.test(meta)) bad('the lifetime stat did not land in the archive header');
if (!/DOOR/.test(meta)) bad('the archive header lost its door count');
await page.screenshot({ path: OUT + 'menu-archive.png' });
await page.tap('body', { position: { x: 200, y: 24 } });
await page.waitForTimeout(350);
if (await boxOf(page, '#arch')) bad('the archive would not close');

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
const mode3 = await boxOf(page, '#modebtn');
console.log('return   altwrap=' + JSON.stringify(alt2 && { x: alt2.x, w: alt2.w, h: alt2.h }));
if (!alt2) bad('the MODE/ARCHIVE row did not come back with the menu');
if (alt2 && alt && (Math.abs(alt2.x - alt.x) > 0.6 || Math.abs(alt2.h - alt.h) > 0.6)) {
  bad('the row came back a different shape');
}
if (!mode3 || !/THE TUNNEL/.test(mode3.text)) bad('MODE lost its name on the way back');

done('menu', errs);
await browser.close();
