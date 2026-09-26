import { boot, done } from './lib.mjs';
import { doorEncounters } from '../src/balance.js';
// WHERE THE BODIES ACTUALLY STAND — the room, or the corridor on the way to it.
//
// Playtest: "the hallways and rooms feel a bit too empty... more enemies
// should appear in rooms especially, hallways can be tight so we don't have to
// increase volume there." `fire.mjs` already answers "does the door spend what
// the table deals it". This answers the other half, which no probe could see:
// of what a door DOES spend, how much of it is standing in the open space the
// player walks into looking for a fight.
//
// A leg's `featureStretch` is that space — a vault's pillared hall, or a
// chamber widened into an ordinary corridor. Every body is filed by the
// stretch it was STANDING in when first seen, not by where the player was, so
// a man met from the doorway still counts as the room's.
//
// IT WALKS FORWARD FROM DOOR 1 AND NEVER WARPS. `warpDoor` moves the door
// NUMBER and not the fight in front of you, so a probe that warps measures the
// new door's plan against the old door's leg — and the first draft of this
// file did exactly that and reported doors 6 and 8 as empty corridors because
// it was re-walking door 4's spent one.
//
// THE BAND TEST IS THE POOL'S OWN, and the room is asked about FIRST.
//
// Two ways to get this wrong and this file has been both. Testing the bands in
// order with a half-cell of give makes every boundary belong to the EARLIER
// stretch, and the room's staged body is placed at its near edge on purpose —
// so every staged man filed as corridor. Testing the bare band instead files
// the man standing in the room's near doorway as a corridor body, and
// placement adds up to 0.8 m of jitter on top of that.
//
// The room's cells are chosen with `z0 - cell/2 .. z1 + cell/2`, so that is
// what the room IS, and asking about it before the other bands settles the
// overlap the way the placement code already settles it.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '30');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '30'); localStorage.setItem('ts_s0_rdoor', '1');
  localStorage.setItem('ts_s0_at', String(now - 3e5)); localStorage.setItem('ts_s0_born', String(now - 9e6));
  // EVERY TYPE ALREADY MET: a debut card stops the world until a tap, and a
  // walker never taps — it stood at the rusher's first door for the rest of
  // the run. The cards have their own probe (meetcard.mjs).
  localStorage.setItem('ts_s0_carded', JSON.stringify(['rusher', 'shotgunner', 'shieldbearer', 'heavy', 'sniper', 'bomber', 'armored', 'rocketeer', 'laser', 'blinker']));
  localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
} catch {} };
// NOT DOOR 9: its last leg is the Keeper's room (docs/ARSENAL.md §10), a boss
// fight a walker cannot win and that funds no room. keeper.mjs plays it.
const LAST = 8;
const { browser, page, errs } = await boot({ seed: SEED });
const bad = (m) => console.log('FAIL ' + m);
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);

const out = await page.evaluate(async (last) => {
  const t = window.__ts, C = 4, rows = [];
  let refWas = t.sightRefusals(), strayWas = t.roomStrays();
  for (let door = 1; door <= last; door++) {
    const nLegs = t.hall().legsThisDoor || 1;
    let legs = 0, rooms = 0, roomBodies = 0, corridorBodies = 0, doorBodies = 0;
    let roomQuota = 0, alive = 0, gap = 0, roomLeft = 0;
    const seen = new WeakSet();
    for (let leg = 1; leg <= nLegs; leg++) {
      const L = t.hall().legs[t.hall().cur];
      if (!L || !L.spine) break;
      legs++;
      const nSt = (L.stretches || []).length;
      const fs = L.featureStretch >= 0 && L.featureStretch < nSt - 1 ? L.featureStretch : -1;
      const st = fs >= 0 ? L.stretches[fs] : null;
      if (fs >= 0) rooms++;
      alive = Math.max(alive, t.leg().alive); gap = t.leg().gap;
      if (L.quota && fs >= 0) roomQuota += L.quota[fs] || 0;
      let px = L.spine[0][0] * C, pz = L.spine[0][1] * C;
      t.player.pos.x = px; t.player.pos.z = pz;
      const tick = () => {
        t.player.iframes = 999;
        for (const e of t.enemies) {
          if (!e.alive || seen.has(e)) continue;
          seen.add(e);
          const half = C * 0.5;
          if (st && e.pos.z >= st.z0 - half && e.pos.z <= st.z1 + half) roomBodies++;
          else if (nSt > 1 && e.pos.z >= L.stretches[nSt - 1].z0) doorBodies++;
          else corridorBodies++;
          e.__killAt = performance.now() + 550;
        }
        for (let n = t.enemies.length - 1; n >= 0; n--) {
          const e = t.enemies[n];
          if (e.__killAt && performance.now() > e.__killAt) t.killAt(n);
        }
      };
      for (let i = 0; i < L.spine.length; i++) {
        const tx = L.spine[i][0] * C, tz = L.spine[i][1] * C;
        for (let k = 1; k <= 4; k++) {
          t.player.pos.x = px + (tx - px) * (k / 4);
          t.player.pos.z = pz + (tz - pz) * (k / 4);
          const hold = performance.now();
          while (performance.now() - hold < 90) {
            await new Promise((r) => requestAnimationFrame(r)); tick();
          }
        }
        px = tx; pz = tz;
      }
      // ...and stand at the door while what it still owes finishes arriving.
      // A flat wall-clock budget is the trap docs/TESTING.md opens with; this
      // waits on the LEG going quiet, which is the leg's own business.
      let quiet = 0;
      const owed = () => t.game.spawnQueue.length + t.enemies.filter((e) => e.alive).length;
      const guard = performance.now();
      while (!(L.door && L.door.open) && performance.now() - guard < 60000) {
        const before = owed();
        await new Promise((r) => requestAnimationFrame(r)); tick();
        quiet = owed() === before && before > 0 ? quiet + 1 : 0;
        if (owed() === 0 && quiet > 240) break;
        if (quiet > 1200) break;
      }
      if (fs >= 0 && L.fill) roomLeft += L.fill[fs] || 0;
      if (!(L.door && L.door.open)) break;
      t.crossDoor();
      await new Promise((r) => setTimeout(r, 260));
      if (t.hall().doorsPassed + 1 !== door) break;
    }
    const ref = t.sightRefusals() - refWas; refWas = t.sightRefusals();
    const stray = t.roomStrays() - strayWas; strayWas = t.roomStrays();
    rows.push({ door, legs, nLegs, rooms, roomQuota, roomLeft, roomBodies,
      corridorBodies, doorBodies, alive, gap, ref, stray });
  }
  return rows;
}, LAST);

console.log('door  legs  w/room   room quota  unspent   IN ROOM   corridor   at door   max alive   clock   refusals  strays');
let roomT = 0, corrT = 0, doorT = 0, leftT = 0;
for (const r of out) {
  roomT += r.roomBodies; corrT += r.corridorBodies; doorT += r.doorBodies; leftT += r.roomLeft;
  console.log(' ' + String(r.door).padStart(3) + '   ' + r.legs + '/' + r.nLegs
    + '      ' + String(r.rooms).padStart(2) + '        ' + String(r.roomQuota).padStart(3)
    + '       ' + String(r.roomLeft).padStart(2)
    + '        ' + String(r.roomBodies).padStart(3) + '       ' + String(r.corridorBodies).padStart(3)
    + '       ' + String(r.doorBodies).padStart(3)
    + '        ' + String(r.alive).padStart(2) + '      ' + r.gap.toFixed(2) + 's       '
    + String(r.ref).padStart(3) + '     ' + String(r.stray).padStart(3));
}
const all = roomT + corrT + doorT;
console.log(`\nof ${all} bodies met: ${roomT} in rooms (${Math.round(roomT / all * 100)}%), `
  + `${corrT} in corridors (${Math.round(corrT / all * 100)}%), `
  + `${doorT} at doors (${Math.round(doorT / all * 100)}%)`);
console.log('dealt by the table: ' + out.map((r) =>
  `${r.door}:${doorEncounters(r.door).reduce((a, b) => a + b, 0)}`).join('  '));
const dealt = out.reduce((a, r) => a + doorEncounters(r.door).reduce((x, y) => x + y, 0), 0);
console.log(`met ${all} of the ${dealt} bodies those doors deal (${Math.round(all / dealt * 100)}%)`);
// WHAT THIS FILE ACTUALLY GUARDS.
//
// Not the SHARE. A room seats about five and the door approach seats about
// six, so once both grew the proportion standing in rooms stayed near a fifth
// however many more men are in them — the share is a ratio of two things that
// both moved, and failing on it would be failing on arithmetic rather than on
// a defect. It is printed because it is the shape of a leg and worth watching.
//
// These three are defects:
//   1. a room funded and left EMPTY — the share paid back as silence, which is
//      the door-4 case this file was written for
//   2. room-owed men standing outside the room — the plan delivered on paper
//      and an empty room in the game
//   3. a leg that never opens — more bodies than the corridor has room for is
//      not more fight, it is a run that cannot continue
if (leftT > out.length) bad(`${leftT} bodies were owed to rooms and never placed`);
const funded = out.filter((r) => r.roomQuota > 0);
const barren = funded.filter((r) => r.roomBodies === 0);
if (barren.length > funded.length / 2) {
  bad(`${barren.length} of ${funded.length} funded rooms stood empty: doors `
    + barren.map((r) => r.door).join(', '));
}
const strayT = out.reduce((a, r) => a + r.stray, 0);
if (strayT > roomT) bad(`${strayT} room-owed men stood outside the room, against ${roomT} inside it`);
for (const r of out) {
  if (r.legs < r.nLegs) bad(`door ${r.door} never opened past leg ${r.legs} of ${r.nLegs}`);
}
done('rooms', errs);
await browser.close();
