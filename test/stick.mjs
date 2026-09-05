import { boot, done, OUT } from './lib.mjs';
// THE MOVE STICK LEAVES A MARK WHERE THE THUMB LET GO.
//
// It floats — it appears under whichever thumb starts dragging — which is
// comfortable and also invisible: playtesters could not find a control that
// only exists while it is already being used. So the ring stays behind,
// dimmed, with the nub back at its centre.
//
// Three things have to hold, and the middle one is the one that broke first:
// it is there after a drag, it SURVIVES the touchend that takes the last
// finger off the glass (dropAllPointers fires on every single-thumb lift and
// used to wipe it a frame later), and it is gone on a screen that is not this
// run.
const SEED = () => { try { const now = Date.now();
  localStorage.setItem('timeshard_taught', '1'); localStorage.setItem('ts_deepest_door', '6');
  localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
  localStorage.setItem('ts_s0_doors', '3'); localStorage.setItem('ts_s0_rdoor', '3');
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

const stick = () => page.evaluate(() => {
  const b = document.getElementById('stickbase'), n = document.getElementById('sticknub');
  const box = b.getBoundingClientRect();
  return { shown: !!(b.offsetWidth || b.offsetHeight),
    ghost: b.classList.contains('ghost') && n.classList.contains('ghost'),
    x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2),
    nub: (() => { const r = n.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; })() };
});

// ---- nothing before the first drag ----------------------------------------
const before = await stick();
console.log('before any drag: ' + JSON.stringify({ shown: before.shown }));
if (before.shown) bad('the stick is on screen before anybody has dragged');

// ---- drag the left thumb, then let go -------------------------------------
await page.mouse.move(120, 620);
await page.mouse.down();
for (const dx of [8, 20, 34, 46, 54]) { await page.mouse.move(120 + dx, 620 - dx * 0.4); await page.waitForTimeout(30); }
const during = await stick();
console.log('mid-drag:        ' + JSON.stringify(during));
if (!during.shown) bad('the stick is not drawn while it is being used');
if (during.ghost) bad('a live stick is drawn as a ghost');
await page.mouse.up();
await page.waitForTimeout(500);
const after = await stick();
console.log('after letting go: ' + JSON.stringify(after));
if (!after.shown) bad('the stick vanished when the thumb came off');
if (!after.ghost) bad('the mark left behind is not dimmed');
// ...at the origin the stick had, with the nub back in the middle of it
if (Math.hypot(after.x - during.x, after.y - during.y) > 2) {
  bad('the mark is not where the stick was: ' + JSON.stringify([during.x, during.y])
    + ' -> ' + JSON.stringify([after.x, after.y]));
}
if (Math.hypot(after.nub.x - after.x, after.nub.y - after.y) > 2) {
  bad('the nub did not go back to the centre of its ring');
}
await page.screenshot({ path: OUT + 'stick-ghost.png' });

// ---- a second drag moves it, because the stick still floats ---------------
// ON THE LEFT HALF. The role is decided by which side the drag STARTS on —
// x 240 of a 402-wide screen is the LOOK thumb, and a look drag has no stick
// to leave behind, so a probe that drags there measures nothing and blames
// the mark for not moving.
await page.mouse.move(90, 730);
await page.mouse.down();
for (const dx of [10, 24, 40]) { await page.mouse.move(90 + dx, 730 - dx); await page.waitForTimeout(30); }
await page.mouse.up();
await page.waitForTimeout(400);
const moved = await stick();
console.log('after a second drag elsewhere: ' + JSON.stringify({ x: moved.x, y: moved.y, ghost: moved.ghost }));
if (!moved.ghost || !moved.shown) bad('the second drag left no mark');
if (Math.hypot(moved.x - after.x, moved.y - after.y) < 40) {
  bad('the mark did not follow the thumb to its new place');
}

// ---- pause keeps the spot, the menu forgets it ----------------------------
await page.tap('#pausebtn');
await page.waitForTimeout(400);
const paused = await stick();
await page.tap('#presume');
await page.waitForTimeout(500);
const resumed = await stick();
console.log('paused: ' + JSON.stringify({ shown: paused.shown })
  + '   resumed: ' + JSON.stringify({ shown: resumed.shown, x: resumed.x, y: resumed.y }));
if (paused.shown) bad('the stick is drawn over the pause menu');
if (!resumed.shown || Math.hypot(resumed.x - moved.x, resumed.y - moved.y) > 2) {
  bad('pausing lost the spot the thumb was using');
}
done('stick', errs);
await browser.close();
