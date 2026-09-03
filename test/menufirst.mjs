import { boot, boxOf, done, OUT } from './lib.mjs';
// NO SAVES AT ALL — a player's very first sight of the game.
const { browser, page, errs } = await boot();
await page.waitForTimeout(1600);
const bad = (m) => console.log('FAIL ' + m);

const go = await boxOf(page, '.go');
const run = await boxOf(page, '#runrow');
const alt = await boxOf(page, '#altwrap');
const unl = await boxOf(page, '#discover');
console.log('first    go="' + (go && go.text) + '" runrow=' + (run ? 'shown' : 'hidden')
  + ' unlocks="' + (unl && unl.text) + '"');
if (!go || !/PLAY/.test(go.text)) bad('first run should offer PLAY, got: ' + (go && go.text));
if (/CONTINUE/.test((go && go.text) || '')) bad('first run offers CONTINUE with nothing to continue');
if (run) bad('LOAD GAME / NEW RUN are up with no saves to load');
if (!alt) bad('the MODE/ARCHIVE row is missing on a first run');
if (!unl || !/0 \/ /.test(unl.text)) bad('a fresh UNLOCKS should read 0 / N, got: ' + (unl && unl.text));
const w = await page.evaluate(() => document.querySelector('#discover .rbar i').style.width);
if (w !== '0%') bad('a fresh progress bar should be empty, got ' + w);
// with runrow gone the row must not collide with what is above it
if (go && alt && alt.y < go.bottom) bad('altwrap overlaps CONTINUE when runrow is hidden');
await page.screenshot({ path: OUT + 'menu-first.png' });
done('menufirst', errs);
await browser.close();
