// THE LOOKING LESSON ENDS WHEN THEY HAVE LOOKED.
//
// `corners` runs to the last corner, because that is where the barrier comes
// into view and where `stand` is built to begin. Its PROMPTS must not: the T
// is four cells before it, with Hale's signpost painted across the back wall,
// and a step whose prompts ran to the last corner put DRAG TO MOVE directly
// across THIS WAY — the one-message rule broken at the exact place the player
// is first asked to read the world instead of the screen.
//
// Four things, and the third is the one that regressed on the first attempt:
//   1. the prompts and the divider are up through the corners
//   2. reaching the corner is not enough — they have to turn
//   3. turning retires both, and the divider with them
//   4. arriving already facing (a retry at the junction) never flashes them
import { boot, done } from './lib.mjs';
const { browser, page, errs } = await boot({ seed: () => { try { localStorage.clear(); } catch { /* private */ } } });
const bad = (m) => { console.log('FAIL ' + m); errs.push(m); };

await page.waitForTimeout(1600);
await page.tap('.go'); await page.waitForTimeout(900);
await page.tap('#mslist [data-mode="hall"]');
await page.waitForFunction(() => window.__ts.tutor && __ts.tutor().step !== null,
  null, { timeout: 30000 });
await page.waitForTimeout(1200);

// What is actually painted: the two coach slots and the divider.
const read = () => page.evaluate(() => {
  const g = (id) => { const n = document.getElementById(id);
    return n && n.classList.contains('show') ? (n.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
  const line = document.getElementById('tutorline');
  return { left: g('ts-left'), right: g('ts-right'),
    divider: !!(line && line.classList.contains('on')),
    fired: window.__ts.tutorCues().fired,
    step: window.__ts.tutor().step, spineIx: window.__ts.tutor().spineIx };
});
// Stand on a spine cell of the current leg, looking along the path (or, with
// `look` null, keeping whatever heading is already set).
const standAt = (ix, look) => page.evaluate(([i, la]) => {
  const t = window.__ts, C = 4, L = t.hall().legs[t.hall().cur];
  const j = Math.max(0, Math.min(L.spine.length - 1, i));
  const [gx, gz] = L.spine[j];
  t.player.pos.x = gx * C; t.player.pos.z = gz * C;
  if (la != null) {
    const k = Math.max(0, Math.min(L.spine.length - 1, j + la));
    const [nx, nz] = L.spine[k];
    const dx = (nx - gx) * C, dz = (nz - gz) * C;
    if (dx || dz) t.player.yaw = Math.atan2(-dx, -dz);   // forward = (-sin, -cos)
  }
  t.player.pitch = 0; t.player.vel.set(0, 0, 0);
  t.resyncSpine && t.resyncSpine();
}, [ix, look]);

const marks = await page.evaluate(() => {
  const L = window.__ts.hall().legs[window.__ts.hall().cur];
  return { secondJogEnd: (L.proto.tutorLeg || {}).marks.secondJogEnd,
    finalRun: (L.proto.tutorLeg || {}).marks.finalRun };
});
console.log(`  the corner is spine cell ${marks.secondJogEnd}; the step runs to ${marks.finalRun}`);
const AT = marks.secondJogEnd;

// ---- 1. up through the corners -------------------------------------------
await page.evaluate(() => window.__ts.setTutorStep('corners'));
await standAt(AT - 3, 1);
await page.waitForTimeout(500);
let r = await read();
console.log(`  three cells short   left="${r.left}" right="${r.right}" divider=${r.divider}`);
if (!r.left || !r.right) bad('the coach prompts are missing before the corner');
if (!r.divider) bad('the divider is missing while the prompts are up');

// ---- 2. reaching the corner is not enough --------------------------------
// Standing ON it, still looking back the way they came in.
await standAt(AT, -1);
await page.waitForTimeout(500);
r = await read();
console.log(`  at it, looking back left="${r.left}" right="${r.right}" divider=${r.divider}`);
if (!r.left || !r.right) bad('the prompts left on arrival rather than on the look');

// ---- 3. turning retires them, and the divider with them ------------------
await standAt(AT, 1);
await page.waitForTimeout(500);
r = await read();
console.log(`  turned to the hall  left="${r.left}" right="${r.right}" divider=${r.divider} fired=${JSON.stringify(r.fired)}`);
if (r.left || r.right) bad(`turning did not retire the prompts: "${r.left}" / "${r.right}"`);
if (r.divider) bad('the divider is still up with nothing to divide');
if (!r.fired.includes('faced')) bad('`faced` never fired');
if (r.step !== 'corners') bad(`the step ended too: ${r.step}`);

// ...and they are still gone at the T, which is what this is all for.
await standAt(AT + 3, 1);
await page.waitForTimeout(400);
r = await read();
console.log(`  at the junction     left="${r.left}" right="${r.right}" divider=${r.divider} step=${r.step}`);
if (r.left || r.right) bad('the prompts came back at the junction, over the signpost');

// ---- 4. a retry at the junction must not flash them ----------------------
// The real path, not a simulation of it: die in the dead end, which puts the
// player back on the approach already facing the hallway AND re-enters the
// step — so `enter` fires with the lesson already satisfied. Sampled every
// frame, because one frame of DRAG TO MOVE is a flicker, not a lesson.
const flash = await page.evaluate(async () => {
  const t = window.__ts, C = 4, o = t.hall().legs[t.hall().cur].spine[0];
  const shown = () => ['ts-left', 'ts-right'].some((id) => {
    const n = document.getElementById(id);
    return n && n.classList.contains('show') && (n.textContent || '').trim();
  });
  t.player.pos.x = (o[0] - 2) * C; t.player.pos.z = (o[1] + 11) * C;
  t.player.iframes = 0;
  t.resyncSpine && t.resyncSpine();
  await new Promise((r) => requestAnimationFrame(r));
  const inDead = t.tutor().dead && t.tutor().dead.inDead;
  t.die();
  // through the red and out the other side
  while (!t.player.alive) await new Promise((r) => requestAnimationFrame(r));
  let frames = 0;
  for (let f = 0; f < 120; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    if (shown()) frames++;
  }
  return { inDead, frames, step: t.tutor().step,
    at: { x: +(t.player.pos.x / C).toFixed(1), z: +(t.player.pos.z / C).toFixed(1) },
    fired: t.tutorCues().fired };
});
console.log(`  after a joke death  back at [${flash.at.x}, ${flash.at.z}] step=${flash.step} ` +
  `fired=${JSON.stringify(flash.fired)}`);
console.log(`                      frames with a prompt on screen: ${flash.frames} (want 0)`);
if (!flash.inDead) bad('the probe never got into the dead end, so nothing was tested');
if (flash.frames) bad(`the retry flashed the prompts for ${flash.frames} frames`);

done('faced', errs);
await browser.close();
