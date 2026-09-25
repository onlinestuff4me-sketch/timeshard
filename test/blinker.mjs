import { boot, done } from './lib.mjs';
// THE BLINKER (docs/ARSENAL.md §10), in the tunnel.
//
// He reads the trigger, not the round: the frame a lane passes near him he
// blinks sideways, square to the shot, and the round lands where he stood.
// Then he is spent for BLINKER.cd world-seconds with his chest burning white,
// and a second round in that window kills him. A shot that was never near
// him does not move him, and once the window closes he dodges again.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['blinker']));   // no card in the way
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

// a blinker 10 m ahead, standing up, pinned in place and holding his fire
const stand = () => page.evaluate(async () => {
  const t = window.__ts;
  for (const e of t.enemies) e.alive = false;
  t.enemies.length = 0;
  t.player.iframes = 999;
  const yaw = t.player.yaw;
  t.spawnEnemy('blinker', { x: t.player.pos.x - Math.sin(yaw) * 10, z: t.player.pos.z - Math.cos(yaw) * 10 });
  const e = t.enemies[t.enemies.length - 1];
  window.__blk = e;
  const t0 = performance.now();
  while (e.state === 'assemble' && performance.now() - t0 < 5000) {
    await new Promise((r) => requestAnimationFrame(r));
  }
  e.speed = 0; e.fireCd = 99;
  return { state: e.state, x: e.pos.x, z: e.pos.z };
});
// fire at (x, 1.2, z) + a sideways offset, then watch for `ms`
const shoot = (off, ms) => page.evaluate(async ([off, ms]) => {
  const t = window.__ts;
  const e = window.__blk;
  t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
  const yaw = t.player.yaw;
  const x0 = e.pos.x, z0 = e.pos.z;
  t.fireAt(e.pos.x + Math.cos(yaw) * off, 1.2, e.pos.z - Math.sin(yaw) * off);
  const at = { blinks: e.blinks || 0, white: e.chest.material.type === 'MeshBasicMaterial' };
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999; e.fireCd = 99;
  }
  return { ...at, moved: +Math.hypot(e.pos.x - x0, e.pos.z - z0).toFixed(2), alive: t.enemies.includes(e) };
}, [off, ms]);

let s = await stand();
if (s.state === 'assemble') bad('the blinker never stood up');

// ---- a shot at him: he is gone before it arrives, and spent -------------
let r = await shoot(0, 600);
console.log('shot at him:   ' + JSON.stringify(r));
if (r.blinks !== 1) bad('he did not blink on the trigger pull');
if (!r.white) bad('his chest is not burning white while spent');
if (r.moved < 0.85) bad('he only moved ' + r.moved + ' m');
if (!r.alive) bad('the first round killed him: the blink did not clear the lane');

// ---- the second round, inside his window, lands --------------------------
r = await shoot(0, 900);
console.log('second round:  ' + JSON.stringify(r));
if (r.blinks !== 1) bad('he blinked again while spent');
if (r.alive) bad('the second round in his window did not kill him');

// ---- a shot wide of him does not move him --------------------------------
s = await stand();
r = await shoot(3, 400);
console.log('wide shot:     ' + JSON.stringify(r));
if (r.blinks) bad('a shot 3 m wide made him blink');
if (!r.alive) bad('a shot 3 m wide killed him');

// ---- the window closes: after the cooldown he dodges again --------------
r = await shoot(0, 400);
if (r.blinks !== 1 || !r.alive) bad('the first dodge failed: ' + JSON.stringify(r));
const back = await page.evaluate(async () => {
  const t = window.__ts;
  const e = window.__blk;
  const t0 = performance.now();
  while (performance.now() - t0 < 2200) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999; e.fireCd = 99;
  }
  return { white: e.chest.material.type === 'MeshBasicMaterial' };
});
if (back.white) bad('his chest is still white after the cooldown');
r = await shoot(0, 600);
console.log('after the cd:  ' + JSON.stringify(r));
if (r.blinks !== 2) bad('he did not dodge again once his window closed');
if (!r.alive) bad('he was hit after his window closed');

done('blinker', errs);
await browser.close();
