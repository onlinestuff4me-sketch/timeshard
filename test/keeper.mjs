import { boot, done } from './lib.mjs';
// THE KEEPER'S ROOM (docs/ARSENAL.md §10): floor 1's boss, on door 9's last leg.
//
// Walking past the seal shuts it and stands the room up: the Keeper and his
// pair of shotgunners. The pair comes back KEEPER.addsBack after the second
// of them goes. He takes three hits, each one a bait and a punish; each moves
// him on a phase, and phase 3 stops the world with his volley hanging in the
// air. The exit stays shut until he is down, and the pair goes with him.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '40');
  localStorage.setItem('timeshard_slowtaught', '1');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '40'); localStorage.setItem('ts_s0_rdoor', '9');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_s0_carded', JSON.stringify(['blinker', 'shotgunner', 'rusher', 'heavy',
    'shieldbearer', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForFunction(() => window.__ts.game.state === 'play', null, { timeout: 20000 });

const frames = (n) => page.evaluate(async (n) => {
  for (let i = 0; i < n; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    window.__ts.player.iframes = 999;
  }
}, n);
const clearRoom = () => page.evaluate(() => {
  const t = window.__ts;
  t.game.spawnQueue.length = 0;
  for (const e of t.enemies) e.g.visible = false;
  t.enemies.length = 0;
});

// ---- door 9, leg 1 is an ordinary corridor; walk through it --------------
let where = await page.evaluate(() => ({ door: window.__ts.hall().doorsPassed + 1,
  leg: window.__ts.hall().legInDoor, legs: window.__ts.hall().legsThisDoor, k: window.__ts.keeper() }));
console.log('start:         ' + JSON.stringify(where));
if (where.door !== 9) bad('the run did not start on door 9');
if (where.k) bad('the Keeper\'s room is the LAST leg of door 9, not the first');
for (let leg = where.leg; leg < where.legs - 1; leg++) {
  for (let i = 0; i < 60; i++) {
    await clearRoom();
    await frames(3);
    if (await page.evaluate(() => { const h = window.__ts.hall(); return h.legs[h.cur].door.open; })) break;
  }
  await page.evaluate(() => {
    const t = window.__ts, h = t.hall(), d = h.legs[h.cur].door;
    t.player.pos.set(d.x, 0, d.z + 1.2);
  });
  await frames(20);
}
let k = await page.evaluate(() => window.__ts.keeper());
console.log('his leg:       ' + JSON.stringify(k));
if (!k) { bad('the last leg of door 9 is not the Keeper\'s room'); }
else {
  if (k.started) bad('the room stood up before the seal shut');
  // let the ordinary corridor-clearing gate have a go at the door: it must not
  await frames(30);
  if ((await page.evaluate(() => window.__ts.keeper())).door) bad('his door opened with nobody in the room');

  // ---- past the seal: it shuts, and the room stands up ----------------------
  await page.evaluate(() => {
    const t = window.__ts, k = t.keeper();
    t.player.pos.set(k.seal.x, 0, k.seal.z + 1.5);
    t.player.yaw = Math.PI;
  });
  await page.waitForFunction(() => { const k = window.__ts.keeper(); return k && k.started; },
    null, { timeout: 8000 }).catch(() => {});
  await page.evaluate(async () => {
    const t = window.__ts, e = t.keeperEnemy();
    const t0 = performance.now();
    while (e && e.state === 'assemble' && performance.now() - t0 < 6000) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
    }
  });
  k = await page.evaluate(() => window.__ts.keeper());
  console.log('sealed:        ' + JSON.stringify({ sealed: k.sealed, started: k.started, hp: k.hp, adds: k.adds, phase: k.phase }));
  if (!k.sealed) bad('the seal did not shut behind the player');
  if (!k.started) bad('the room did not stand up when the seal shut');
  if (k.hp !== 3) bad('he should take three hits, has ' + k.hp);
  if (k.adds !== 2) bad('the pair is not in the room: ' + k.adds);

  // ---- he fires on his own clock: 1.5 s shot to shot in phase 1 ------------
  const gaps = await page.evaluate(async () => {
    const t = window.__ts, L = t.hall().legs[t.hall().cur];
    const out = [];
    let last = t.worldClock().last;
    const t0 = performance.now();
    while (out.length < 4 && performance.now() - t0 < 20000) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
      for (const a of L.boss.adds) { a.speed = 0; a.fireCd = 1e9; if (a.state === 'aim') a.state = 'advance'; }
      const now = t.worldClock().last;
      if (now !== last) { if (last > 0) out.push(+(now - last).toFixed(2)); last = now; }
    }
    return out;
  });
  console.log('his clock:     ' + JSON.stringify(gaps));
  if (gaps.length < 3) bad('he is not firing: ' + gaps.length + ' gaps');
  else if (gaps.slice(1).some((g) => Math.abs(g - 1.5) > 0.15)) bad('phase 1 gaps are not 1.5 s');

  // ---- the pair comes back 3 s after the second one goes -------------------
  const back = await page.evaluate(async () => {
    const t = window.__ts, L = t.hall().legs[t.hall().cur];
    for (const a of L.boss.adds) { const i = t.enemies.indexOf(a); if (i >= 0) { a.g.visible = false; t.enemies.splice(i, 1); } }
    const w0 = t.worldClock().now;
    const t0 = performance.now();
    while (performance.now() - t0 < 8000) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
      if (t.keeper().adds === 2) break;
    }
    return { adds: t.keeper().adds, after: +(t.worldClock().now - w0).toFixed(2) };
  });
  console.log('pair back:     ' + JSON.stringify(back));
  if (back.adds !== 2) bad('the pair never came back');
  else if (back.after < 2.8 || back.after > 3.6) bad('the pair came back after ' + back.after + ' s, not 3');
  // ...and out of the way for the rest of this, so their rounds are not the test
  await page.evaluate(() => {
    const t = window.__ts, L = t.hall().legs[t.hall().cur];
    for (const a of L.boss.adds) { a.speed = 0; a.fireCd = 1e9; }
  });

  // one bait and one punish: the first round is dodged, the second lands
  const baitPunish = () => page.evaluate(async () => {
    const t = window.__ts, e = t.keeperEnemy();
    const shot = () => {
      t.player.fireCd = 0; t.player.mag = 9; t.player.reloadT = 0; t.player.swapT = 0;
      t.fireAt(e.pos.x, 1.2, e.pos.z);
    };
    const wait = async (ms) => {
      const t0 = performance.now();
      while (performance.now() - t0 < ms) {
        await new Promise((r) => requestAnimationFrame(r));
        t.player.iframes = 999;
        const L = t.hall().legs[t.hall().cur];
        for (const a of L.boss.adds) { a.speed = 0; a.fireCd = 1e9; }
      }
    };
    // never mid-stop, and never while he is still spent from last time
    let guard = 0;
    while ((t.keeper().stopping || t.worldClock().now < (e.blinkReady || 0)) && guard++ < 600) await wait(16);
    const hp0 = e.hp, b0 = e.blinks || 0;
    shot();
    const dodged = (e.blinks || 0) === b0 + 1;
    // on game state, not the wall clock: a loaded machine runs slow frames
    const until = async (f, ms) => { const t0 = performance.now(); while (!f() && performance.now() - t0 < ms) await wait(1); };
    await until(() => !e.blink, 3000);                                  // he has landed
    await until(() => !t.bullets.some((b) => b.fromPlayer), 4000);      // the bait is gone
    shot();
    await until(() => !t.bullets.some((b) => b.fromPlayer), 4000);      // the punish resolved
    await wait(50);
    return { dodged, hp0, hp: t.keeper().alive ? e.hp : 0, phase: t.keeper().phase };
  });

  let r = await baitPunish();
  console.log('hit 1:         ' + JSON.stringify(r));
  if (!r.dodged) bad('the bait was not dodged');
  if (r.hp !== 2 || r.phase !== 2) bad('the punish did not move him to phase 2');
  const cd2 = await page.evaluate(() => window.__ts.keeperEnemy().blinkCd);
  if (Math.abs(cd2 - 1.2) > 1e-6) bad('phase 2 blink cooldown is ' + cd2 + ', not 1.2');

  r = await baitPunish();
  console.log('hit 2:         ' + JSON.stringify(r));
  if (r.hp !== 1 || r.phase !== 3) bad('the punish did not move him to phase 3');

  // ---- phase 3: he stops the world, and his volley hangs -------------------
  const stop = await page.evaluate(async () => {
    const t = window.__ts;
    const t0 = performance.now();
    while (!t.keeper().stopping && performance.now() - t0 < 4000) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
    }
    if (!t.keeper().stopping) return { stopped: false };
    const hang = t.bullets.filter((b) => !b.fromPlayer).map((b) => [b, b.pos.clone()]);
    const w0 = t.worldClock().now;
    // only while he holds it: the stop is 1.4 real seconds however slow the frames
    let w1 = 0, moved = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      if (!t.keeper().stopping) break;
      w1 = t.worldClock().now - w0;
      moved = hang.reduce((m, [b, p]) => Math.max(m, b.pos.distanceTo(p)), 0);
    }

    // ...and when it lets go, the volley goes
    const t1 = performance.now();
    while (t.keeper().stopping && performance.now() - t1 < 3000) await new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 10; i++) await new Promise((r) => requestAnimationFrame(r));
    const released = hang.filter(([b, p]) => !t.bullets.includes(b) || b.pos.distanceTo(p) > 0.5).length;
    return { stopped: true, rounds: hang.length, world: +w1.toFixed(4),
      moved: +moved.toFixed(3), released };
  });
  console.log('time stop:     ' + JSON.stringify(stop));
  if (!stop.stopped) bad('phase 3 never stopped the world');
  else {
    if (stop.rounds < 5) bad('the volley has ' + stop.rounds + ' rounds hanging, not 5');
    if (stop.world > 0.005) bad('the world moved ' + stop.world + ' s during his stop');
    if (stop.moved > 0.05) bad('a hanging round moved ' + stop.moved + ' m');
    if (stop.released < stop.rounds) bad('only ' + stop.released + ' of the hanging rounds let go');
  }

  r = await baitPunish();
  console.log('hit 3:         ' + JSON.stringify(r));
  if (r.hp !== 0) bad('the third punish did not shatter him');
  // ---- the reward: his shards hang, stream into you, and the power is yours
  const rw = await page.evaluate(async () => {
    const t = window.__ts;
    await new Promise((r) => requestAnimationFrame(r));
    const k0 = t.keeper();
    const w0 = t.worldClock().now;
    let doorEarly = false, maxLive = 0, unlockedEarly = k0.unlocked;
    const t0 = performance.now();
    while (performance.now() - t0 < 6000) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
      const k = t.keeper();
      if (k.reward) maxLive = Math.max(maxLive, k.reward.live);
      if (k.reward && k.reward.given) break;
      if (k.door) doorEarly = true;
      if (k.unlocked) unlockedEarly = true;
    }
    const k = t.keeper();
    return { pieces: k.reward && k.reward.n, maxLive, given: k.reward && k.reward.given,
      live: k.reward && k.reward.live, world: +(t.worldClock().now - w0).toFixed(4),
      doorEarly, unlockedEarly, unlocked: k.unlocked, taken: k.taken, door: t.hall().doorsPassed + 1 };
  });
  console.log('reward:        ' + JSON.stringify(rw));
  if (!rw.pieces) bad('he left no shards to take');
  if (!rw.given) bad('the reward never completed');
  if (rw.live) bad(rw.live + ' of his shards never reached the player');
  if (rw.world > 0.01) bad('the world moved ' + rw.world + ' s while his shards streamed in');
  if (rw.doorEarly) bad('the exit opened before the power was given');
  if (rw.unlockedEarly) bad('slow time was unlocked before the shards arrived');
  if (!rw.unlocked || !rw.taken) bad('slow time is not unlocked after the Keeper');
  if (rw.door !== 9) bad('this should all happen on door 9, not ' + rw.door);
  await frames(60);
  k = await page.evaluate(() => ({ ...window.__ts.keeper(), n: window.__ts.enemies.length }));
  console.log('after:         ' + JSON.stringify({ done: k.done, adds: k.adds, n: k.n, door: k.door }));
  if (!k.done) bad('the room does not know he is down');
  if (k.adds) bad('the pair outlived him');
  if (!k.door) bad('the exit did not open after the reward');
  // ...and the button works, a door early
  const lock = await page.evaluate(() => { window.__ts.setTimeLocked(true); return window.__ts.slow().locked; });
  if (!lock) bad('the time button does not work after the reward');
  await page.evaluate(() => window.__ts.setTimeLocked(false));
  // ---- on through the exit: door 10, and the power is still yours -----------
  await page.evaluate(() => {
    const t = window.__ts, h = t.hall(), d = h.legs[h.cur].door;
    t.player.pos.set(d.x, 0, d.z + 1.2);
  });
  await frames(30);
  const ten = await page.evaluate(() => ({ door: window.__ts.hall().doorsPassed + 1,
    unlocked: window.__ts.slow() && (window.__ts.setTimeLocked(true), window.__ts.slow().locked) }));
  await page.evaluate(() => window.__ts.setTimeLocked(false));
  console.log('door 10:       ' + JSON.stringify(ten));
  if (ten.door !== 10) bad('the exit did not lead to door 10');
  if (!ten.unlocked) bad('slow time is not usable on door 10');
}

done('keeper', errs);
await browser.close();
