import { boot, done } from './lib.mjs';
// THE GAUNTLET (docs/ARSENAL.md §1): the floor's exam, on the leg before the
// boss. On door 9 (two legs) it is leg 1, and the Keeper's room is leg 2.
// Walking past the seal shuts it and stands up wave 1 (3 men, the floor's
// newest type among them); the HUD says WAVE 1/3; each wave comes when the
// last is down (wave 2 with men on the near flanks, wave 3 with two of the
// newest type); the door stays shut until all three are, then opens onto
// the Keeper's leg.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '9');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'blinker']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.evaluate(() => {
  const t = window.__ts;
  window.__step = async (n = 1) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
});

const out = await page.evaluate(async () => {
  const t = window.__ts, r = { waves: [] };
  const g0 = t.gauntlet();
  r.leg = { legIn: t.hall().legInDoor, legs: t.hall().legsThisDoor, armed: !!g0, keeper: !!t.keeper() };
  if (!g0) return r;
  // before the seal: nothing stands, and the door holds
  await window.__step(30);
  r.before = { wave: t.gauntlet().wave, door: t.gauntlet().door, enemies: t.enemies.length };
  t.player.pos.set(g0.sealX, 0, g0.sealZ + 1.5); t.player.yaw = Math.PI;
  for (let w = 0; w < 3; w++) {
    let G = t.gauntlet();
    for (let f = 0; f < 600 && G.wave < w; f++) { await window.__step(); G = t.gauntlet(); }
    // wait for them to stand up, keep them still
    for (let f = 0; f < 400 && t.enemies.some((e) => e.state === 'assemble'); f++) await window.__step();
    const men = t.enemies.slice();
    for (const e of men) { e.speed = 0; e.fireCd = 1e9; }
    const types = men.map((e) => e.type);
    // the near corners stand ~8 m past the seal; everyone else 24 m and more
    const flank = men.some((e) => e.pos.z - g0.sealZ < 12);
    // the exit arrow stays off in a fight — even turned away from the way out
    const yaw0 = t.player.yaw; t.player.yaw = yaw0 + Math.PI; await window.__step(20);
    const way = t.way().on; t.player.yaw = yaw0; await window.__step(2);
    r.waves.push({ wave: G.wave + 1, n: men.length, types: types.join(' '), way,
      hud: t.hudText(), door: t.gauntlet().door, flank });
    for (let i = t.enemies.length - 1; i >= 0; i--) t.killAt(i);
    await window.__step(5);
  }
  for (let f = 0; f < 300 && !t.gauntlet().door; f++) await window.__step();
  r.end = { done: t.gauntlet().done, door: t.gauntlet().door };
  // through it: the Keeper's room
  const h = t.hall(), d = h.legs[h.cur].door;
  t.player.pos.set(d.x, 0, d.z + 1.2);
  await window.__step(20);
  r.next = { keeper: !!t.keeper(), door: t.hall().doorsPassed + 1 };
  return r;
});
console.log('leg:       ' + JSON.stringify(out.leg));
console.log('before:    ' + JSON.stringify(out.before));
for (const w of out.waves) console.log('wave ' + w.wave + ':    ' + JSON.stringify(w));
console.log('end:       ' + JSON.stringify(out.end) + '  next: ' + JSON.stringify(out.next));
if (!out.leg.armed) bad('door 9 leg 1 is not a gauntlet');
else {
  if (out.before.wave !== -1 || out.before.door || out.before.enemies) bad('the gauntlet stood up, or opened, before the seal shut');
  const want = [3, 4, 5];
  out.waves.forEach((w, i) => {
    if (w.n !== want[i]) bad(`wave ${i + 1} has ${w.n} men, not ${want[i]}`);
    if (!new RegExp(`WAVE ${i + 1}/3`).test(w.hud)) bad(`the HUD does not say WAVE ${i + 1}/3: ${w.hud}`);
    if (w.door) bad(`the door opened during wave ${i + 1}`);
    if (w.way) bad(`the exit arrow showed during wave ${i + 1}`);
  });
  // the floor's newest type (door 9: the shieldbearer) once per wave, twice in
  // the last; the rest a mix of the others
  const count = (w) => w.types.split(' ').filter((x) => x === 'shieldbearer').length;
  out.waves.forEach((w, i) => {
    const want = i === 2 ? 2 : 1;
    if (count(w) !== want) bad(`wave ${i + 1} has ${count(w)} of the newest type, not ${want}: ${w.types}`);
  });
  if (out.waves[0] && out.waves[0].flank) bad('wave 1 already stood on the near flanks');
  if (out.waves[1] && !out.waves[1].flank) bad('wave 2 put nobody on the near flanks');
  if (!out.end.done || !out.end.door) bad('the door did not open after the third wave');
  if (!out.next.keeper || out.next.door !== 9) bad('the gauntlet did not lead into the Keeper\'s room');
}
done('gauntlet', errs);
await browser.close();
