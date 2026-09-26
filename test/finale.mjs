import { boot, done } from './lib.mjs';
// THE FINALE (docs/ARSENAL.md §14; FINALE in balance.js), on door 39.
//
// The Keeper again: a 0.65 s dodge, armored so only his head counts, and a
// rocket or a small kamikaze of his own on his clock. A spawner behind him
// holds the room. Beaten, he hangs 6 s; break the dish while he is down and
// the loop is broken: RUN COMPLETE, and the exit opens. (His dodge itself is
// blinker.mjs's; here it is held off so the armor and the loop can be read.)
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['spawner', 'drone', 'shotgunner', 'rusher', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'blinker', 'frankenstein', 'kamikaze', 'armored', 'rocketeer', 'laser']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
await page.evaluate(() => window.__ts.startPlaytest('finale'));
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });
const k0 = await page.evaluate(() => window.__ts.keeper());
console.log('door 39:       ' + JSON.stringify({ door: await page.evaluate(() => window.__ts.hall().doorsPassed + 1), kind: k0 && k0.kind }));
if (!k0 || k0.kind !== 'finale') { bad('door 39 does not end in the finale'); }
else {
  await page.evaluate(() => { const t = window.__ts, k = t.keeper(); t.player.pos.set(k.seal.x, 0, k.seal.z + 1.5); t.player.yaw = Math.PI; });
  await page.waitForFunction(() => { const k = window.__ts.keeper(); return k && k.started; }, null, { timeout: 8000 }).catch(() => {});
  const r = await page.evaluate(async () => {
    const t = window.__ts, L = t.hall().legs[t.hall().cur], B = L.boss;
    const step = async (n = 1) => { for (let i = 0; i < n; i++) { await new Promise((r) => requestAnimationFrame(r)); t.player.iframes = 999; } };
    const formed = async (e) => { const t0 = performance.now(); while (e.state === 'assemble' && performance.now() - t0 < 8000) await step(); };
    const pin = () => { for (const e of t.enemies) { e.speed = 0; if (e !== B.keeper) e.fireCd = 1e9; } };
    const shoot = async (x, y, z) => {
      t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
      if (B.keeper) B.keeper.blinkReady = 1e12;   // his dodge, held off
      t.fireAt(x, y, z);
      const t0 = performance.now();
      while (t.bullets.some((b) => b.fromPlayer) && performance.now() - t0 < 6000) { pin(); await step(); }
    };
    const waitWorld = async (s) => { const w0 = t.worldClock().now, t0 = performance.now();
      while (t.worldClock().now - w0 < s && performance.now() - t0 < 40000) { pin(); await step(); } };
    const k = B.keeper;
    await formed(k); await formed(B.spawner); for (const a of B.adds) await formed(a);
    const out = { cd: k.blinkCd, hp: k.hp, spawner: !!B.spawner, guards: B.adds.map((a) => a.type).sort().join() };
    // his own volleys arrive on his clock
    k.fireCd = 1e9;
    await waitWorld(5);
    out.volley = t.seekers() > 0 || t.hall().legs[t.hall().cur].boss.keeper.volleyN > 0;
    // his guard walks into the lane (they would be in your way too); cleared
    // by hand here, since this step is about his armor
    for (let i = t.enemies.length - 1; i >= 0; i--) if (t.enemies[i] !== B.spawner && t.enemies[i] !== k) { t.enemies[i].g.visible = false; t.enemies.splice(i, 1); }
    // the armor: a body shot clanks, a head shot counts
    await shoot(k.pos.x, 1.0 * k.g.scale.y, k.pos.z);
    out.afterBody = k.hp;
    out.hps = [];
    for (let i = 0; i < 5 && t.enemies.includes(k); i++) {
      await shoot(k.pos.x, 1.62 * k.g.scale.y, k.pos.z);
      await step(20);   // past the one-hit-per-shell guard
      out.hps.push(t.enemies.includes(k) ? k.hp : 0);
    }
    out.down = !t.enemies.includes(k);
    out.hanging = t.revives();
    // his guard, cleared by hand; then the dish, inside his hang
    for (let i = t.enemies.length - 1; i >= 0; i--) if (t.enemies[i] !== B.spawner) { t.enemies[i].g.visible = false; t.enemies.splice(i, 1); }
    await shoot(B.spawner.pos.x, B.spawner.dishY, B.spawner.pos.z);
    out.dish = !t.enemies.includes(B.spawner);
    const t0 = performance.now();
    while (!(t.keeper().reward && t.keeper().reward.given) && performance.now() - t0 < 12000) await step();
    await step(30);
    out.done = !!t.hall().finaleDone;
    out.banners = t.banners().slice(-4);
    out.door = t.keeper().door;
    out.back = t.enemies.some((e) => e.boss === 'finale');
    return out;
  });
  console.log('the finale:    ' + JSON.stringify(r));
  if (Math.abs(r.cd - 0.65) > 1e-6) bad('his cooldown is ' + r.cd + ', not 0.65');
  if (r.hp !== 3) bad('he should take three head hits');
  if (!r.volley) bad('no rocket or kamikaze of his own in five seconds');
  if (r.guards !== 'armored,bomber,gunner,heavy,shotgunner') bad('his guard is not the five: ' + r.guards);
  if (r.afterBody !== 3) bad('a body shot on the armored Keeper counted');
  if (!r.down) bad('three head shots did not bring him down');
  if (r.hanging < 1) bad('he did not hang under the spawner');
  if (!r.dish) bad('the dish did not break');
  if (r.back) bad('he came back after the dish broke');
  if (!r.done || !r.banners.includes('RUN COMPLETE')) bad('the run did not complete');
  if (!r.door) bad('the exit did not open');
}
done('finale', errs);
await browser.close();
