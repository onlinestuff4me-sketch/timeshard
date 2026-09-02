import { boot, boxOf, done, OUT } from './lib.mjs';
// The two screens the gates show up on: LOAD GAME (rows name their game) and
// UNLOCKS (games are a section you can see progress toward).
const SEED = () => {
  try {
    const now = Date.now();
    localStorage.setItem('timeshard_taught', '1');
    localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
    localStorage.setItem('ts_s0_doors', '7'); localStorage.setItem('ts_s0_best', '7');
    localStorage.setItem('ts_s0_rdoor', '7'); localStorage.setItem('ts_s0_shat', '96');
    localStorage.setItem('ts_s0_archive', JSON.stringify(['gunner', 'corridor', 'pistol']));
    localStorage.setItem('ts_s0_at', String(now - 5e5));
    localStorage.setItem('ts_s0_born', String(now - 9e6));
    localStorage.setItem('ts_s1_used', '1'); localStorage.setItem('ts_s1_mode', 'duel');
    localStorage.setItem('ts_s1_best', '3'); localStorage.setItem('ts_s1_at', String(now - 2e4));
    localStorage.setItem('ts_s1_born', String(now - 6e5));
    localStorage.setItem('ts_saves', JSON.stringify([
      { i: 0, name: '', num: 1, mode: 'hall' }, { i: 1, name: '', num: 1, mode: 'duel' }]));
  } catch {}
};
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1700);
const bad = (m) => console.log('FAIL ' + m);

// ---- LOAD GAME: every game's runs, each naming its own ------------------
await page.tap('#newrun');
await page.waitForTimeout(600);
if (!(await boxOf(page, '#saves'))) bad('LOAD GAME did not open');
const title = await page.$eval('#saves h3', (n) => n.textContent);
const rows = await page.$$eval('#slotlist .slot', (ns) => ns.map((n) => ({
  name: (n.querySelector('.sname') || {}).textContent || '',
  mode: (n.querySelector('.smode') || {}).textContent || '',
})));
console.log('saves  title="' + title + '"');
for (const r of rows) console.log('  row  ' + r.mode.padEnd(14) + r.name);
if (rows.length !== 2) bad(`LOAD GAME shows ${rows.length} runs, expected both games`);
if (!rows.every((r) => r.mode)) bad('a save row does not name its game');
if (!rows.some((r) => /CORRIDOR DUEL/.test(r.mode))) bad('the duel save is missing or unnamed');
if (!rows.some((r) => /THE TUNNEL/.test(r.mode))) bad('the tunnel save is missing or unnamed');
await page.screenshot({ path: OUT + 'loadgame.png' });
await page.tap('#savesclose');
await page.waitForTimeout(400);

// ---- UNLOCKS: a GAMES section, counted and gated -----------------------
await page.tap('#discover');
await page.waitForTimeout(600);
if (!(await boxOf(page, '#arch'))) bad('UNLOCKS did not open');
const head = await page.$eval('#arch h2', (n) => n.textContent);
if (head !== 'UNLOCKS') bad('the screen is still called ' + head);
const games = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('#archlist .asec')];
  const g = secs.find((s) => /GAMES/.test(s.textContent));
  if (!g) return null;
  const rows = [];
  for (let n = g.nextElementSibling; n && n.classList.contains('arow'); n = n.nextElementSibling) {
    rows.push({ desig: n.querySelector('.adesig').textContent,
      name: (n.querySelector('b') || {}).textContent || '',
      line: (n.querySelector('span') || {}).textContent || '',
      locked: n.classList.contains('locked') });
  }
  return { head: g.textContent, rows };
});
if (!games) { bad('UNLOCKS has no GAMES section'); }
else {
  console.log('games  ' + games.head);
  for (const r of games.rows) console.log('  ' + (r.locked ? 'LOCK' : ' ok ')
    + ' ' + r.desig.padEnd(5) + r.name.padEnd(15) + r.line.slice(0, 34));
  // 7 doors: duel (5) is open, the rest are not
  const open = games.rows.filter((r) => !r.locked).map((r) => r.name);
  if (!open.includes('CORRIDOR DUEL')) bad('CORRIDOR DUEL should be open at 7 doors');
  if (open.length !== 1) bad('expected exactly one open game at 7 doors, got ' + open.join(','));
  for (const r of games.rows.filter((x) => x.locked)) {
    if (!/REACH DOOR/.test(r.line)) bad(`${r.name} does not say what opens it`);
    if (!/^\d+\/\d+$/.test(r.desig)) bad(`${r.name} has no progress figure: ${r.desig}`);
  }
}
await page.screenshot({ path: OUT + 'unlocks.png' });
done('unlocks', errs);
await browser.close();
