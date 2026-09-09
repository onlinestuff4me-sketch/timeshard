// EXIT SITS ABOVE EVERY DOOR FOR THE WHOLE GAME.
//
// `SCRIPT.md` §6 opens with that sentence, and until this it sat above none:
// the message system was drawn behind `tutorStep !== null`, built only on a
// tutorial crossing, and read its spec from the onboarding's authored legs.
// Three gates, all of them the same mistake — the messages belong to a LEG,
// not to a LESSON.
//
// Four things, and the third is the one that would regress silently:
//   1. a run leg carries a sign, and it is the run's spec rather than a
//      taught leg's
//   2. the sign is on screen when the corridor is clear and the door is ahead
//   3. it survives a crossing — every leg, not just the first
//   4. building it costs nothing a player can feel (PILLARS §8)
import { boot, done } from './lib.mjs';
const { browser, page, errs } = await boot({
  seed: () => { try {
    localStorage.clear();
    localStorage.setItem('timeshard_taught', '1');   // the run, not the lesson
  } catch { /* private */ } },
});
const bad = (m) => { console.log('FAIL ' + m); errs.push(m); };

await page.waitForTimeout(1500);
await page.tap('.go'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="hall"]');
await page.waitForFunction(() => window.__ts.hall && !!window.__ts.hall(), null, { timeout: 30000 });
await page.waitForTimeout(1500);

// ---- 1. the run's own spec, on the run's own leg --------------------------
let g = await page.evaluate(() => window.__ts.signs());
console.log(`  door 1        source=${g.spec.source} door=${g.spec.door} ` +
  `signs=${g.spec.signs} built=${g.list.length} text="${(g.list[0] || {}).text || ''}"`);
if (g.spec.source !== 'run') bad(`a run leg is reading the ${g.spec.source} spec`);
if (!g.list.length) bad('the run leg carries no sign at all');
if (((g.list[0] || {}).text || '') !== 'EXIT') bad(`the sign says "${(g.list[0] || {}).text}", not EXIT`);
if (g.spec.source === 'run' && g.spec.door !== 1) bad(`spec says door ${g.spec.door} on door 1`);

// ---- 2. on screen once the floor is clear and the door is ahead -----------
// The sign stands down while anybody is alive — same rule the needle follows,
// and the reason it does is that being shot at is not a navigation moment. So
// sweep the floor, then stand on the approach looking at the door.
const look = await page.evaluate(async () => {
  const t = window.__ts;
  for (let i = t.enemies.length - 1; i >= 0; i--) t.enemies.splice(i, 1);
  t.game.spawnQueue.length = 0;
  const L = t.hall().legs[t.hall().cur];
  const end = L.spine[L.spine.length - 1], C = 4;
  // a few cells short of the door, facing it
  const from = L.spine[Math.max(0, L.spine.length - 5)];
  t.player.pos.x = from[0] * C; t.player.pos.z = from[1] * C;
  const dx = (end[0] - from[0]) * C, dz = (end[1] - from[1]) * C;
  t.player.yaw = Math.atan2(-dx, -dz);
  t.player.pitch = 0; t.player.iframes = 999;
  for (let f = 0; f < 90; f++) await new Promise((r) => requestAnimationFrame(r));
  const s = t.signs();
  const n = document.getElementById('ts-sign');
  const b = n ? n.getBoundingClientRect() : null;
  return { showing: s.showing, onScreen: s.onScreen,
    box: b ? { x: Math.round(b.x), y: Math.round(b.y),
      w: Math.round(b.width), h: Math.round(b.height) } : null };
});
console.log(`  approaching   showing="${look.showing}" onScreen=${look.onScreen} ` +
  `box=${JSON.stringify(look.box)}`);
if (look.showing !== 'EXIT') bad(`the door's sign is not the one picked: "${look.showing}"`);
if (!look.onScreen) bad('EXIT is not drawn while walking at the door it names');
if (look.box && (look.box.w < 20 || look.box.h < 8)) bad(`drawn at ${look.box.w}x${look.box.h} px`);

// ---- 3. it survives a crossing -------------------------------------------
const after = await page.evaluate(async () => {
  const t = window.__ts;
  const before = t.hall().doorsPassed;
  for (let i = 0; i < 40; i++) {
    t.crossDoor && t.crossDoor();
    await new Promise((r) => requestAnimationFrame(r));
    if (t.hall().doorsPassed > before) break;
  }
  await new Promise((r) => requestAnimationFrame(r));
  const s = t.signs();
  return { doors: t.hall().doorsPassed, source: s.spec.source, door: s.spec.door,
    built: s.list.length, text: (s.list[0] || {}).text || '' };
});
console.log(`  after a door  doorsPassed=${after.doors} source=${after.source} ` +
  `door=${after.door} built=${after.built} text="${after.text}"`);
if (after.doors === 0) console.log('  (could not cross from the harness — skipping 3)');
else {
  if (!after.built) bad('the leg after a crossing carries no sign');
  if (after.text !== 'EXIT') bad(`after a crossing the sign says "${after.text}"`);
  if (after.door !== after.doors + 1) bad(`spec says door ${after.door} at ${after.doors} passed`);
}

// ---- 4. PILLARS 8: building it costs nothing a player can feel ------------
const cost = await page.evaluate(async () => {
  const t = window.__ts;
  const runs = [];
  for (let i = 0; i < 30; i++) {
    const a = performance.now();
    t.rebuildSigns();
    runs.push(performance.now() - a);
  }
  runs.sort((x, y) => x - y);
  return { median: +runs[15].toFixed(3), worst: +runs[runs.length - 1].toFixed(3),
    render: t.render() };
});
console.log(`  build cost    median ${cost.median} ms · worst ${cost.worst} ms ` +
  `· ${cost.render.calls} draw calls`);
// A frame is 16.7 ms. A tenth of one is inaudible; anything near a whole frame
// is a hitch on the crossing, which is exactly where a player is moving.
if (cost.worst > 4) bad(`building a leg's signs costs ${cost.worst} ms — a visible hitch`);

// ---- 5. and the headline stands down for it (Q-B) -------------------------
//
// `DOOR 7` on the glass and `EXIT` on the door at the end of it are the same
// sentence twice, and the one in the room is the one to keep. Only the bare
// fallback stands down: a leg that PROMISES something — TIGHT TURNS, NO COVER
// · DO NOT STOP — is making a claim about the corridor that no wall sign
// makes, so it still says it.
const head = await page.evaluate(() => {
  const t = window.__ts;
  const proto = t.hall().legs[t.hall().cur].proto;
  const p = t.legPromise(proto);
  return { promises: p.any, line: p.line, hasSign: t.signs().hasSign };
});
const stands = head.promises || !head.hasSign;
console.log(`  headline      "${head.line}" promises=${head.promises} ` +
  `hasSign=${head.hasSign} → ${stands ? 'shown' : 'stands down'}`);
if (!head.hasSign) bad('the leg has no sign, so the headline rule is untested');
if (!head.promises && stands) bad('a plain leg shows DOOR N over its own EXIT sign');
if (head.promises && !stands) bad('a leg that promises something was silenced');

// ---- 6. the needle hands the corridor over to the sign --------------------
//
// Both answer "which way now". The needle carries it while the door is a red
// rectangle in the distance; `EXIT` takes over as it becomes readable, and
// the needle retires. But only for THAT question: a player who has turned
// their back cannot read a sign behind them, so the needle still answers
// there even after the sign has been seen.
const hand = await page.evaluate(async () => {
  const t = window.__ts, C = 4;
  const frames = (n) => new Promise((done) => {
    let i = 0;
    const step = () => (++i >= n ? done() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });
  for (let i = t.enemies.length - 1; i >= 0; i--) t.enemies.splice(i, 1);
  t.game.spawnQueue.length = 0;
  const L = t.hall().legs[t.hall().cur];
  const end = L.spine[L.spine.length - 1];
  const from = L.spine[Math.max(0, L.spine.length - 6)];
  const face = () => {
    const dx = (end[0] - from[0]) * C, dz = (end[1] - from[1]) * C;
    if (dx || dz) t.player.yaw = Math.atan2(-dx, -dz);
  };
  t.player.pos.x = from[0] * C; t.player.pos.z = from[1] * C;
  face();
  t.player.iframes = 999;
  await frames(70);                    // let the clear-leg debounce settle

  // (a) the sign not yet read: looking at the FLOOR, so it is off-frame
  // vertically while the player is still facing down the corridor — which is
  // not the turned-your-back case.
  // PITCH FIRST, THEN CLEAR. The camera takes the player's pitch in the
  // render loop, so clearing the latch in the same tick as the turn left one
  // frame where the sign was still projected on the OLD camera — it latched
  // again immediately and the probe measured its own race.
  t.player.pitch = -1.1;
  await frames(10);
  t.rebuildSigns();                    // clears the per-leg latch
  await frames(20);
  const before = { needle: t.way().on, seen: t.tutor().signSeen,
    sign: t.signs().onScreen };

  // (b) look up: the sign comes into frame and the needle stands down
  t.player.pitch = 0;
  await frames(30);
  const after = { needle: t.way().on, seen: t.tutor().signSeen,
    sign: t.signs().onScreen };

  // (c) turn around: a sign behind you answers nothing, so the needle is back
  t.player.yaw += Math.PI;
  await frames(40);
  const back = { needle: t.way().on, seen: t.tutor().signSeen,
    sign: t.signs().onScreen };
  t.player.pitch = 0; face();
  return { before, after, back };
});
const fmt = (o) => `needle=${o.needle} sign=${o.sign} seen=${o.seen}`;
console.log(`  sign unread   ${fmt(hand.before)}`);
console.log(`  sign in frame ${fmt(hand.after)}`);
console.log(`  back turned   ${fmt(hand.back)}`);
if (!hand.before.needle) bad('the needle is not carrying the corridor before the sign is read');
if (hand.before.sign) bad('the probe never got the sign off screen, so nothing was tested');
if (!hand.after.sign) bad('the sign did not come into frame');
if (hand.after.needle) bad('the needle did not retire for the sign');
if (!hand.back.needle) bad('turning your back left you with neither mark');

done('exitsign', errs);
await browser.close();
