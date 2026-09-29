import { boot, done } from './lib.mjs';
// THE MK ON THE CHEST (docs/ARSENAL.md §4). Mk I wears nothing; Mk II has
// II printed on his chest, Mk III has III.
// Pictures for a person: out/tiermark-gunner.png, out/tiermark-armored.png.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '11');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser', 'blinker', 'frankenstein', 'kamikaze', 'drone', 'spawner']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.waitForTimeout(1500);

const lineUp = (type) => page.evaluate(async (type) => {
  const t = window.__ts;
  const step = () => new Promise((r) => requestAnimationFrame(r));
  t.game.spawnQueue.length = 0; for (const e of t.enemies) e.g.visible = false; t.enemies.length = 0;
  const yaw = t.player.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const men = [];
  for (const mk of [1, 2, 3]) {
    t.forceMk(mk);
    const side = (mk - 2) * 1.3;
    t.spawnEnemy(type, { x: t.player.pos.x + fx * 5.5 + rx * side, z: t.player.pos.z + fz * 5.5 + rz * side });
    men.push(t.enemies[t.enemies.length - 1]);
  }
  t.forceMk(null);
  for (let f = 0; f < 400 && men.some((e) => e.state === 'assemble'); f++) { await step(); t.player.iframes = 999; }
  for (let f = 0; f < 30; f++) {
    for (const e of men) { e.speed = 0; e.fireCd = 1e9; e.state = 'advance'; }
    t.player.iframes = 999; await step();
  }
  const marks = (e) => { let n = 0; e.g.traverse((o) => { if (o.userData && o.userData.mkMark) n = o.userData.mkMark; }); return n; };
  return men.map((e) => ({ mk: e.mk, marks: marks(e) }));
}, type);

for (const type of ['gunner', 'armored']) {
  const r = await lineUp(type);
  console.log(type.padEnd(8) + ' ' + JSON.stringify(r));
  await page.screenshot({ path: `test/out/tiermark-${type}.png` });
  const want = [0, 2, 3];   // the numeral he wears, 0 for none
  r.forEach((m, i) => {
    if (m.mk !== i + 1) bad(`${type}: the ${i + 1}th man is Mk ${m.mk}`);
    if (m.marks !== want[i]) bad(`${type} Mk ${i + 1} wears ${m.marks || 'no'} numeral, not ${want[i]}`);
  });
}
done('tiermark', errs);
await browser.close();
