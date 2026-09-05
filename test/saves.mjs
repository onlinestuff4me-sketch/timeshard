import { boot, boxOf, done, OUT } from './lib.mjs';
// A FULL SAVE LIST: IT HAS TO FIT, IT HAS TO SORT, AND NOTHING GOES WITHOUT
// BEING CHOSEN.
//
// Six saves made a card taller than the phone — the title went up behind the
// address bar and CLOSE went down behind the tab bar, so the page could
// neither be read nor left. And a seventh run used to be made by silently
// recycling "a save that never went anywhere", which is still overwriting a
// file nobody picked: a run started thirty seconds ago is a save at door 1.
//
// SIX SAVES, WHICH IS WHAT A FULL LIST LOOKS LIKE.
const SEED = () => { try {
  const now = Date.now(); const idx = [];
  for (let i = 0; i < 6; i++) {
    localStorage.setItem(`ts_s${i}_used`, '1');
    localStorage.setItem(`ts_s${i}_mode`, 'hall');
    localStorage.setItem(`ts_s${i}_doors`, String([6, 0, 4, 0, 4, 12][i]));
    localStorage.setItem(`ts_s${i}_rdoor`, String([7, 1, 5, 1, 5, 13][i]));
    localStorage.setItem(`ts_s${i}_at`, String(now - [3e5, 1e6, 2e6, 9e6, 4e6, 6e5][i]));
    localStorage.setItem(`ts_s${i}_born`, String(now - 9e6));
    idx.push({ i, name: '', num: i + 1, mode: 'hall' });
  }
  localStorage.setItem('ts_saves', JSON.stringify(idx));
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '13');
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('#newrun');            // OTHER RUNS
await page.waitForTimeout(700);
const card = await boxOf(page, '#saves .htpcard');
const listb = await boxOf(page, '#slotlist');
console.log('card   ' + JSON.stringify(card && { y: card.y, h: card.h, bottom: card.bottom }));
console.log('list   ' + JSON.stringify(listb && { y: listb.y, h: listb.h }));
if (!card) bad('OTHER RUNS did not open the list');
if (card && (card.y < 0 || card.bottom > 874)) bad('the card does not fit: y=' + card.y + ' bottom=' + card.bottom);
const close = await boxOf(page, '#savesclose');
console.log('close  ' + JSON.stringify(close && { y: close.y, bottom: close.bottom }));
if (close && close.bottom > 874) bad('CLOSE is off the bottom of the screen');
const scrolls = await page.evaluate(() => {
  const n = document.getElementById('slotlist');
  return n ? { h: n.clientHeight, scroll: n.scrollHeight, can: n.scrollHeight > n.clientHeight + 2 } : null;
});
console.log('scroll ' + JSON.stringify(scrolls));
if (scrolls && !scrolls.can) bad('the list is not scrollable with six saves in it');
await page.screenshot({ path: OUT + 'saves-full.png' });
// --- sorting -------------------------------------------------------------
const order = () => page.$$eval('#slotlist .slot .smeta', (ns) => ns.map((n) => n.textContent.trim()));
console.log('by recent  ' + JSON.stringify(await order()));
await page.tap('#sortbar .sortb[data-sort="depth"]');
await page.waitForTimeout(400);
console.log('by deepest ' + JSON.stringify(await order()));
await page.tap('#sortbar .sortb[data-sort="depth"]');
await page.waitForTimeout(400);
console.log('reversed   ' + JSON.stringify(await order()));
// --- the full-list flow --------------------------------------------------
await page.tap('#savesclose'); await page.waitForTimeout(400);
await page.tap('#startnew'); await page.waitForTimeout(700);
await page.tap('#mslist [data-mode="hall"]'); await page.waitForTimeout(900);
const ask = await boxOf(page, '#askFull');
console.log('six saves, NEW RUN -> ' + (ask ? 'asks' : 'DID NOT ASK'));
if (!ask) bad('a full list let a new run start anyway');
if (await boxOf(page, '#fullReplace')) bad('the destructive one-tap overwrite is still offered');
await page.tap('#fullList'); await page.waitForTimeout(700);
const tags = await page.$$eval('#slotlist .stag', (ns) => ns.map((n) => n.textContent));
const cks = await page.$$eval('#slotlist .sck', (ns) => ns.length);
console.log('pick mode: ' + cks + ' checkboxes, tags ' + JSON.stringify(tags));
if (cks !== 6) bad('the checkbox column is missing: ' + cks);
if (!tags.includes('LEAST FAR') || !tags.includes('OLDEST')) bad('the worst runs are not called out');
const first = await page.$$eval('#slotlist .slot .smeta', (ns) => ns[0].textContent.trim());
console.log('worst first: ' + first);
await page.screenshot({ path: OUT + 'saves-pick.png' });
// nothing is pre-ticked, and the button says so
const label0 = await page.$eval('#bulkdel', (n) => n.textContent.trim());
console.log('with nothing ticked: "' + label0 + '"');
if (!/SELECT/.test(label0)) bad('the delete button is armed before anything is chosen');
// tick two and delete
await page.tap('#slotlist .slot:nth-child(1)'); await page.waitForTimeout(250);
await page.tap('#slotlist .slot:nth-child(2)'); await page.waitForTimeout(250);
const label2 = await page.$eval('#bulkdel', (n) => n.textContent.trim());
console.log('with two ticked:     "' + label2 + '"');
if (!/2 RUNS/.test(label2)) bad('the button does not count the selection: ' + label2);
await page.tap('#bulkdel'); await page.waitForTimeout(800);
const left = await page.$$eval('#slotlist .slot', (ns) => ns.length);
console.log('after deleting two:  ' + left + ' runs left');
if (left !== 4) bad('bulk delete removed ' + (6 - left) + ' runs, not 2');
if (!(await boxOf(page, '#newsave'))) bad('NEW RUN did not come back once there was room');

done('saves', errs);
await browser.close();
