// WHAT A DOOR ANNOUNCES.
//
// `PILLARS ARE YOUR ONLY COVER` is gone: the columns are the most visible
// thing in a vault, they are on screen before the banner is, and a card naming
// what the player is already looking at is a card in the way of it. A headline
// earns its place by naming something you could not see for yourself. Every
// other one still has to survive, and no leg may announce a blank.
import { boot, done } from './lib.mjs';

const SEED = () => { try {
  const now = Date.now();
  localStorage.setItem('timeshard_taught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '40');
  localStorage.setItem('ts_s0_at', String(now - 3e5));
  localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };

const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() =>
  document.getElementById('overlay').classList.contains('hidden'), null, { timeout: 20000 });
await page.waitForTimeout(2600);

// ASKED DIRECTLY, FORM BY FORM. Walking forty doors to see which ones happen
// to roll a vault measures the composer's dice, not the headline table — and
// on a run of forty it rolled none.
const seen = await page.evaluate(() => {
  const forms = ['corridor', 'serviceRun', 'vault', 'atrium', 'gauntlet',
    'gallery', 'stairwell', 'spiral'];
  const o = {};
  for (const id of forms) o[id] = window.__ts.legPromise({ form: { id } });
  return o;
});

let bad = 0;
for (const form of Object.keys(seen)) {
  const { any, line } = seen[form];
  const pillars = /PILLAR/i.test(line || '');
  const blank = !String(line || '').trim();
  if (pillars || blank) bad++;
  console.log(`${pillars || blank ? 'FAIL' : 'ok  '} ${form.padEnd(11)}`
    + ` claims:${any ? 'y' : 'n'}  "${line}"`);
}
console.log(`${Object.keys(seen).length} forms, ${bad} announcing PILLARS or a blank  (want 0)`);
if (seen.vault && seen.vault.any) console.log('FAIL the vault still makes a claim');

await browser.close();
done('headline', errs);
