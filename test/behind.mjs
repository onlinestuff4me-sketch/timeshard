import { boot, done } from './lib.mjs';
// NOBODY APPEARS BEHIND YOU, AND IF THEY DID YOU WOULD BE TOLD.
//
// Measured against the PATH, not the camera: the player can spin on the spot,
// so "behind" has to mean behind the direction the corridor is taking them.
// A body released at a lower spine index than the player is corridor they have
// already walked.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught','1'); localStorage.setItem('ts_deepest_door','20');
  localStorage.setItem('ts_s0_used','1'); localStorage.setItem('ts_s0_mode','hall');
  localStorage.setItem('ts_s0_doors','20'); localStorage.setItem('ts_s0_rdoor','1');
  localStorage.setItem('ts_s0_at',String(now-3e5)); localStorage.setItem('ts_s0_born',String(now-9e6));
  localStorage.setItem('ts_saves',JSON.stringify([{i:0,name:'',num:1,mode:'hall'}]));
} catch {} };
const { browser, page, errs } = await boot({ seed: SEED });
await page.waitForTimeout(1600);
await page.tap('.go');
await page.waitForFunction(() => document.getElementById('overlay').classList.contains('hidden'),
  null, { timeout: 20000 });
await page.waitForTimeout(2600);

const out = await page.evaluate(async () => {
  const t = window.__ts, rows = [];
  const C = 4;
  const ixOf = (L, x, z) => {
    let best = -1, bd = Infinity;
    for (let i = 0; i < L.spine.length; i++) {
      const d = Math.hypot(L.spine[i][0] * C - x, L.spine[i][1] * C - z);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  for (let door = 1; door <= 15; door++) {
    t.warpDoor(door);
    await new Promise((r) => setTimeout(r, 260));
    for (let leg = 0; leg < 3; leg++) {
      const L = t.hall().legs[t.hall().cur];
      if (!L || !L.spine) break;
      const seen = new WeakSet();
      // walk the spine in steps, letting the corridor release as we go
      for (let i = 0; i < L.spine.length; i += 1) {
        t.player.pos.x = L.spine[i][0] * C;
        t.player.pos.z = L.spine[i][1] * C;
        t.player.iframes = 999;
        await new Promise((r) => setTimeout(r, 34));
        const mi = ixOf(L, t.player.pos.x, t.player.pos.z);
        for (const e of t.enemies) {
          if (!e.alive || seen.has(e)) continue;
          seen.add(e);
          const ei = ixOf(L, e.pos.x, e.pos.z);
          rows.push({ door, ahead: ei - mi,
            m: +Math.hypot(e.pos.x - t.player.pos.x, e.pos.z - t.player.pos.z).toFixed(1) });
        }
        for (let k = t.enemies.length - 1; k >= 0; k--) t.killAt(k);
      }
      if (L.door && L.door.open) { t.crossDoor(); await new Promise((r) => setTimeout(r, 200)); }
      else break;
    }
  }
  return rows;
});
const behind = out.filter((r) => r.ahead < 0);
console.log('bodies released and measured: ' + out.length);
console.log('  ahead of the player on the path: ' + out.filter((r) => r.ahead > 0).length);
console.log('  level with them (same cell):     ' + out.filter((r) => r.ahead === 0).length);
console.log('  BEHIND them on the path:         ' + behind.length);
if (behind.length) {
  const byDoor = {};
  for (const r of behind) byDoor[r.door] = (byDoor[r.door] || 0) + 1;
  console.log('  by door: ' + JSON.stringify(byDoor));
  for (const r of behind.slice(0, 8)) console.log(`    door ${r.door}: ${r.ahead} cells behind, ${r.m} m away`);
  console.log('FAIL bodies are being released behind the player');
}
// ---- ...AND THE MARK IS BACK ON, once the lesson is over -----------------
//
// The per-enemy edge marks were off for the whole of `beingLed()` — the
// onboarding AND the first eight doors — on the reasoning that the opening
// meets one man at a time. The encounter table outgrew that: door 5 puts three
// up at once. A body you cannot see is the case a mark exists for.
const marks = await page.evaluate(async () => {
  const t = window.__ts;
  const C = 4;
  t.warpDoor(3);
  await new Promise((r) => setTimeout(r, 500));
  // WALK UNTIL SOMEBODY IS ACTUALLY OUT, and keep walking. A warp alone
  // releases nobody, so a probe that only warps measures an empty room — and
  // ONE pass of the spine is not enough either: the release is paced, so a
  // single sweep sometimes reaches the door before the corridor has let
  // anyone go, and the check then reports "nothing to measure" on a build
  // where nothing is wrong. Cross into the next leg and carry on.
  //
  // WALK IT, DO NOT TELEPORT IT. This used to jump a whole 4m cell every
  // 70ms — about fifteen times a running pace — and the corridor releases
  // against PROGRESS, which is not something it can see happening at that
  // speed. So on a slow machine the sweep reached the end of the leg with
  // nobody out and the probe reported "nothing to measure" on a build where
  // nothing was wrong. Quarter-cell steps with a beat at each, the same
  // movement the map walker uses. (The door will not open either while the
  // leg still has men queued for it — see openHallDoor — so crossing on is
  // a fallback, not the plan.)
  const alive = () => t.enemies.some((e) => e.alive);
  for (let leg = 0; leg < 4 && !alive(); leg++) {
    const L = t.hall().legs[t.hall().cur];
    if (!L || !L.spine) break;
    let px = L.spine[0][0] * C, pz = L.spine[0][1] * C;
    t.player.pos.x = px; t.player.pos.z = pz;
    for (let i = 0; i < L.spine.length && !alive(); i++) {
      const tx = L.spine[i][0] * C, tz = L.spine[i][1] * C;
      for (let k = 1; k <= 4 && !alive(); k++) {
        t.player.pos.x = px + (tx - px) * (k / 4);
        t.player.pos.z = pz + (tz - pz) * (k / 4);
        const hold = performance.now();
        while (performance.now() - hold < 90 && !alive()) {
          await new Promise((r) => requestAnimationFrame(r));
          t.player.iframes = 999;
        }
      }
      px = tx; pz = tz;
    }
    // ...and stand at the end while the group held for the door arrives
    const wait = performance.now();
    while (performance.now() - wait < 3000 && !alive()) {
      await new Promise((r) => requestAnimationFrame(r));
      t.player.iframes = 999;
    }
    if (!alive() && L.door && L.door.open) {
      t.crossDoor();
      await new Promise((r) => setTimeout(r, 240));
    }
  }
  let armed = 0, saw = 0;
  for (let f = 0; f < 260; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    t.player.iframes = 999;
    const e = t.enemies.find((x) => x.alive);
    if (!e) continue;
    // stand with our back to him and hold it there
    t.player.yaw = Math.atan2(-(e.pos.x - t.player.pos.x), -(e.pos.z - t.player.pos.z)) + Math.PI;
    armed++;
    if (e.edgeArrow) saw++;
  }
  return { armed, saw, door: t.hall().doorsPassed + 1 };
});
console.log('edge marks at door ' + marks.door + ': a body stood behind for '
  + marks.armed + ' frames, the arrow lit on ' + marks.saw);
if (!marks.armed) console.log('FAIL no body to stand in front of — this measured nothing');
if (marks.armed && marks.saw === 0) {
  console.log('FAIL nothing marks a body standing behind the player in the main game');
}

done('behind', errs);
await browser.close();
