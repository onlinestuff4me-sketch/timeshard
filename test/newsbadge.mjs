import { boot, boxOf, done, OUT } from './lib.mjs';
// THE NEWS REACHES BOTH DOORS, AND CLEARS WHEN IT HAS BEEN READ.
//
// A gate opens three doors before you die and the next thing you see is a menu
// that looks exactly like the last one. The badge used to count MODES only and
// sit on the archive button only — so finding a weapon said nothing anywhere,
// and the one badge you did get pointed at the page you READ about modes on
// rather than the one you PLAY them from.
//
// SOME MODES AND SOME KIT HAVE OPENED, AND NOBODY HAS LOOKED.
const SEED = () => { try {
  const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '16');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '15'); localStorage.setItem('ts_s0_rdoor', '16');
  localStorage.setItem('ts_s0_at', String(now - 3e5));
  localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_unlocks', JSON.stringify(['gunner', 'rusher', 'shotgun', 'corridor']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
  // nothing has been seen: no ts_seen_modes, no ts_seen_unlocks
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1700);
const badges = () => page.evaluate(() => ({
  unlocks: (document.querySelector('#discover .rnew') || {}).textContent || '',
  newrun: (document.querySelector('#startnew .rnew') || {}).textContent || '',
}));
console.log('badges before looking: ' + JSON.stringify(await badges()));
const b0 = await badges();
if (!b0.unlocks) bad('the UNLOCKS button is not badged');
if (!b0.newrun) bad('the NEW RUN button is not badged when a mode has opened');
await page.screenshot({ path: OUT + 'news-menu.png' });

await page.tap('#discover'); await page.waitForTimeout(600);
const summary = await page.evaluate(() => {
  const n = document.getElementById('unlocknew');
  return n && n.classList.contains('on') ? n.textContent.trim() : '';
});
console.log('summary: "' + summary + '"');
if (!summary) bad('the page does not say what is new');
// ONE HEADER AND A LIST, not a sentence per kind. It used to read
// "1 NEW MODE UNLOCKED \u00b7 2 NEW WEAPONS UNLOCKED \u00b7 ..." — four numbers
// wrapped in twelve words, over three lines on a phone.
if (!/^NEW UNLOCKS: /.test(summary)) bad('the summary is not one headed list: ' + summary);
if (!/\bMODES?\b/.test(summary)) bad('the summary does not count the modes');
if (!/\bWEAPONS?\b/.test(summary)) bad('the summary does not count the kit');
if (/UNLOCKED/.test(summary)) bad('the summary still says UNLOCKED for every kind');
if (summary.length > 64) bad('the summary is not concise: ' + summary.length + ' chars');
const fresh = await page.$$eval('.arow.fresh b', (ns) => ns.map((n) => n.textContent.replace('NEW', '').trim()));
console.log('rows marked NEW: ' + JSON.stringify(fresh));
if (!fresh.length) bad('nothing in the list is marked as new');
const play = await boxOf(page, '#playnew');
console.log('play link: ' + (play ? '"' + play.text + '"' : 'MISSING'));
if (!play) bad('there is no way to go and play the new modes');
await page.screenshot({ path: OUT + 'news-unlocks.png' });

// the link closes the page and opens the mode board
await page.tap('#playnew'); await page.waitForTimeout(1200);
const sel = await boxOf(page, '#modesel');
const panelGone = !(await boxOf(page, '#unlocks'));
console.log('after PLAY: selector ' + (sel ? 'open' : 'CLOSED') + ', archive ' + (panelGone ? 'closed' : 'STILL OPEN'));
if (!sel) bad('PLAY THE NEW MODES did not open the mode board');
if (!panelGone) bad('the archive stayed open behind it');

// ---- ...and the BOARD says what is new on it too -------------------------
// The badge on NEW RUN sends you here; the top of this screen has to name
// what it sent you for, or arriving tells you nothing.
const msum = await page.evaluate(() => {
  const n = document.getElementById('mssum');
  return n ? { text: n.textContent.trim(), news: n.classList.contains('news') } : null;
});
console.log('board summary: ' + JSON.stringify(msum));
if (!msum || !msum.text) bad('the mode board has no summary line');
else {
  if (!msum.news) bad('the board summary is not marked as news when a mode just opened');
  if (!/NEW MODE/.test(msum.text)) bad('the board summary does not say a mode is new');
  // it must NAME it, not just count it: the point of the line is knowing
  // which card to look for
  const named = await page.$$eval('#mslist .mscd .msname', (ns) => ns.map((n) => n.textContent));
  if (!named.some((nm) => msum.text.includes(nm))) {
    bad('the board summary names no mode on the board: ' + msum.text);
  }
  // ...and it is about MODES only. This screen cannot take you to a weapon.
  if (/WEAPON|PROTOCOL|ENEMY|ROOM/.test(msum.text)) {
    bad('the board summary announces things this screen cannot open: ' + msum.text);
  }
}
await page.screenshot({ path: OUT + 'news-board.png' });
await page.tap('#modeselclose'); await page.waitForTimeout(500);

// ...and the badges are gone, and stay gone across a reload
console.log('badges after looking:  ' + JSON.stringify(await badges()));
const b1 = await badges();
if (b1.unlocks || b1.newrun) bad('the badges survived being looked at');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1700);
console.log('badges after reload:   ' + JSON.stringify(await badges()));
const b2 = await badges();
if (b2.unlocks || b2.newrun) bad('the badges came back after a reload');
done('newsbadge', errs);
await browser.close();
