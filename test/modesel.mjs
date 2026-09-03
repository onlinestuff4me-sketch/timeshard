import { boot, boxOf, done, OUT } from './lib.mjs';
// THE MODE SELECTOR, from a standing start: no saves, so the big button says
// PLAY and this is a first-time player's first sight of the games.
const { browser, page, errs } = await boot();
await page.waitForTimeout(1600);
const bad = (m) => console.log('FAIL ' + m);

// ---- PLAY opens the selector, with no tutorial question on it -------------
await page.tap('.go');
await page.waitForTimeout(900);
if (!(await boxOf(page, '#modesel'))) bad('PLAY did not open the selector');
if (await boxOf(page, '#mstut')) bad('the PLAY path is showing the tutorial checkbox');

const cards = await page.$$eval('#mslist .mscd', (ns) => ns.map((n) => ({
  mode: n.dataset.mode,
  locked: n.classList.contains('locked'),
  hero: n.classList.contains('hero'),
  key: (n.querySelector('.mskey') || {}).textContent || '',
})));
console.log('cards ' + cards.map((c) => `${c.mode}${c.hero ? '*' : ''}${c.locked ? '(lock)' : ''}`).join(' '));
if (!cards.length) bad('the selector has no cards');
if (!cards[0] || cards[0].mode !== 'hall' || !cards[0].hero) bad('THE TUNNEL is not the hero card at the top');
if (cards[0].locked) bad('THE TUNNEL is locked on a fresh install');
// no strip on a first run: it would be one card pointing at the card below it
if (await boxOf(page, '#mslist .msstrip')) bad('the recency strip is up with nothing played');
const secs = await page.$$eval('#mslist .mssec', (ns) => ns.map((n) => n.textContent));
if (secs.length) bad('a first run has section headings it does not need: ' + secs.join(','));
for (const c of cards.slice(1)) {
  if (!c.locked) bad(`${c.mode} is unlocked with no doors passed`);
  if (!/REACH DOOR \d+ IN THE TUNNEL/.test(c.key)) bad(`${c.mode} does not say what unlocks it: "${c.key}"`);
}
// the locked ones are listed in the order they open
const order = cards.slice(1).map((c) => c.mode).join(',');
if (order !== 'duel,stop,wave,rush') bad('locked modes are not in unlock order: ' + order);
await page.screenshot({ path: OUT + 'sel-play.png' });

// ---- a locked card refuses, in place, and does not start anything --------
await page.tap('#mslist [data-mode="rush"]');
await page.waitForTimeout(400);
const toast = await page.$eval('#mstoast', (n) =>
  (n.classList.contains('on') ? n.textContent : ''));
if (toast && /game/i.test(toast)) bad('the refusal still calls a mode a game: ' + toast);
console.log('locked tap -> "' + toast + '"');
if (!toast) bad('a locked card said nothing when tapped');
if (!(await boxOf(page, '#modesel'))) bad('a locked card closed the selector');
if (await page.evaluate(() => window.__ts.game.state) !== 'menu') bad('a locked card started a run');
await page.screenshot({ path: OUT + 'sel-locked.png' });
// ...and it fades on its own
await page.waitForTimeout(2800);
if (await page.$eval('#mstoast', (n) => n.classList.contains('on'))) bad('the refusal never went away');

// ---- the hero card starts the game --------------------------------------
await page.tap('#mslist [data-mode="hall"]');
await page.waitForTimeout(2600);
const st = await page.evaluate(() => ({ state: window.__ts.game.state, mode: window.__ts.game.mode }));
console.log('tunnel tap -> ' + JSON.stringify(st));
if (st.state === 'menu') bad('the hero card did not start a run');
if (st.mode !== 'hall') bad('the hero card started the wrong game: ' + st.mode);

done('modesel', errs);
await browser.close();
