import { boot, done, OUT } from './lib.mjs';
// TURN YOUR BACK ON THE DOOR AND THE NEEDLE COMES BACK.
//
// Everywhere else the way-out mark is about an EMPTY corridor — the one time
// "which way now" is a real question. This is the other time: a player facing
// the way they came cannot tell this corridor from the one behind them, and
// they are in that state whether or not somebody is still standing in the room.
//
// The threshold is not a guess. Measured over 1072 frames of ordinary walking
// down doors 3, 6 and 10 — facing the direction of travel — a corridor that
// turns puts you 117 degrees off the next segment just by walking round the
// corner, and a 90 degree rule would have fired on 5.5% of a clean walk. Over
// 120: nothing. So 135, with the release at 105 so it cannot flicker.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '20');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '20'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);

// Stand mid-leg at door 6 with the corridor still owing bodies, so the
// empty-leg rule below cannot be what puts the mark up.
const r = await page.evaluate(async () => {
  const t = window.__ts, C = 4;
  const norm = (a) => { while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI; return a; };
  t.warpDoor(6);
  await new Promise((r) => setTimeout(r, 500));
  const L = t.hall().legs[t.hall().cur];
  const mid = L.spine[Math.min(3, L.spine.length - 1)];
  t.player.pos.x = mid[0] * C; t.player.pos.z = mid[1] * C;

  // THE LEG KEEPS OWING BODIES THROUGHOUT. The empty-leg rule needs BOTH an
  // empty queue and an empty floor, so leaving the queue stocked means any
  // needle seen here can only have come from the new rule — there is no way
  // for the old one to take the credit. `stage` then decides, every frame,
  // whether anybody is actually standing on the floor.
  const settle = async (yaw, ms, stage) => {
    const at = performance.now();
    while (performance.now() - at < ms) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999; t.player.yaw = yaw;
      t.player.pos.x = mid[0] * C; t.player.pos.z = mid[1] * C;
      stage();
    }
    const w = t.way();
    // THE GAME'S OWN BEARING. Deriving one from `target` measures a different
    // number — that is only the furthest of the four lookaheads the bearing
    // blends — and near a corner the two disagree by tens of degrees.
    const deg = w.bearing === null ? null
      : Math.round(Math.abs(norm(w.bearing - t.player.yaw)) * 180 / Math.PI);
    return { on: w.on, back: w.back, edge: w.edge, deg,
      men: t.enemies.filter((e) => e.alive).length, queued: t.game.spawnQueue.length };
  };
  // an empty floor in a corridor that still owes bodies
  const clear = () => { for (let k = t.enemies.length - 1; k >= 0; k--) t.killAt(k); };
  const toward = t.way().bearing;
  const back = toward + Math.PI;
  const out = {};
  out.facing = await settle(toward, 900, clear);
  out.away = await settle(back, 900, clear);
  // still up at 120, because it latched at 135 and lets go at 105
  out.eased = await settle(toward + (120 * Math.PI / 180), 900, clear);
  out.released = await settle(toward + (80 * Math.PI / 180), 900, clear);
  out.awayAgain = await settle(back, 900, clear);
  // ...AND WHEN A MAN IS OFF SCREEN BEHIND YOU, HIS MARK WINS. Same red, same
  // edge of the same screen; two of them meaning two different things is
  // worse than either alone, and his is about somebody who can shoot you.
  // A MAN HAS TO BE DRAWN OUT, AND WALKING IS WHAT DRAWS HIM. The corridor
  // releases against PROGRESS, and this probe stands still on purpose — so
  // waiting where it stands waits forever and the check silently measures an
  // empty room, which is how it first reported a pass it had not earned.
  // Walk up the leg in quarter-cell steps until somebody is out, then come
  // back to the spot and carry on.
  for (let i = 1; i < L.spine.length && !t.enemies.some((e) => e.alive); i++) {
    const tx = L.spine[i][0] * C, tz = L.spine[i][1] * C;
    const fx = L.spine[i - 1][0] * C, fz = L.spine[i - 1][1] * C;
    for (let k = 1; k <= 4 && !t.enemies.some((e) => e.alive); k++) {
      t.player.pos.x = fx + (tx - fx) * (k / 4);
      t.player.pos.z = fz + (tz - fz) * (k / 4);
      const hold = performance.now();
      while (performance.now() - hold < 120 && !t.enemies.some((e) => e.alive)) {
        await new Promise((r) => requestAnimationFrame(r));
        t.player.iframes = 999;
      }
    }
  }
  t.player.pos.x = mid[0] * C; t.player.pos.z = mid[1] * C;
  const behind = () => {
    for (const e of t.enemies) {
      e.pos.x = t.player.pos.x + Math.sin(t.player.yaw) * 11;
      e.pos.z = t.player.pos.z + Math.cos(t.player.yaw) * 11;
      e.g.position.copy(e.pos);
    }
  };
  // ...and TURN ROUND FROM WHERE WE NOW STAND. Walking up the leg to draw the
  // man out moved the path under us: the old heading was only 97 degrees off
  // the new bearing, so the needle was down because the player was not facing
  // away, and the check passed while proving nothing about enemy marks.
  const back2 = t.way().bearing + Math.PI;
  out.withMark = await settle(back2, 2500, behind);
  return out;
});

const say = (k, v) => console.log('  ' + k.padEnd(12) + ' angle ' + String(v.deg).padStart(3)
  + ' deg   needle ' + (v.on ? 'UP  ' : 'down') + '   back=' + v.back
  + '  enemy marks=' + v.edge + '  men=' + v.men + '  queued=' + v.queued);
console.log('standing mid-leg at door 6, corridor still owing bodies:');
for (const k of ['facing', 'away', 'eased', 'released', 'awayAgain', 'withMark']) say(k, r[k]);

if (r.facing.on) bad('the needle is up while the player is facing the way out');
if (!r.away.on) bad('turning your back on the door did not bring the needle back');
if (!r.eased.on) bad('the needle let go at 120 deg — it should latch until 105');
if (r.released.on) bad('the needle did not let go once they turned back');
if (!r.awayAgain.on) bad('it did not come back on a second turn');
// THE SUPPRESSION IS ONLY MEASURED IF BOTH HALVES ARE TRUE AT ONCE: they have
// their back to the door AND a man is marked off screen. Either one missing
// and this row proves nothing, so say so rather than passing on it.
if (!r.withMark.edge || r.withMark.deg < 135) {
  bad('the enemy-mark case measured nothing: ' + r.withMark.deg + ' deg, marks='
    + r.withMark.edge + ' — needed a turned back AND a mark');
} else if (r.withMark.on) {
  bad('the way-out needle is up at the same time as an enemy mark');
}
await page.screenshot({ path: OUT + 'wayback.png' });
done('wayback', errs);
await browser.close();
