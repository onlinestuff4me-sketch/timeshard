import { boot, done, OUT } from './lib.mjs';
// THE SELECTOR SCROLLS, AND A SCROLL IS NOT A CHOICE.
//
// Five cards with moving pictures on them are roughly twice the height of the
// card that holds them, so a third of the list was unreachable: the menu's
// pointerdown handler called preventDefault on everything, which suppresses
// the scroll `touch-action:pan-y` is asking for. And the same handler acted on
// the card under the finger the moment it landed, so a flick down the list
// launched whatever it started on — or said "you have not unlocked this" when
// all you did was scroll past it.
const { browser, page, errs } = await boot();
await page.waitForTimeout(1600);
const bad = (m) => console.log('FAIL ' + m);

await page.tap('.go');
await page.waitForTimeout(900);

// ---- 1. the list is scrollable, and nothing is suppressing the scroll -----
const geom = await page.evaluate(() => {
  const n = document.getElementById('mslist');
  return { over: n.scrollHeight - n.clientHeight, touch: getComputedStyle(n).touchAction };
});
console.log('list   ' + JSON.stringify(geom));
if (geom.over <= 0) bad('the list does not overflow, so this probe proves nothing');
if (!/pan-y|auto|manipulation/.test(geom.touch)) bad('touch-action forbids panning: ' + geom.touch);
// THE ACTUAL REGRESSION: a pointerdown in the list must not be default-
// prevented, or the browser never scrolls however the CSS is set.
const prevented = await page.evaluate(() => {
  const card = document.querySelector('#mslist .mscd');
  const r = card.getBoundingClientRect();
  const ev = new PointerEvent('pointerdown', { pointerId: 991, clientX: r.x + r.width / 2,
    clientY: r.y + 12, bubbles: true, cancelable: true });
  card.dispatchEvent(ev);
  const was = ev.defaultPrevented;
  window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 991, bubbles: true }));
  return was;
});
console.log('prevented on pointerdown: ' + prevented);
if (prevented) bad('pointerdown inside the list is default-prevented — it cannot scroll');
// ...and it really does move
await page.mouse.move(200, 500);
await page.mouse.wheel(0, 240);
await page.waitForTimeout(350);
const top = await page.evaluate(() => document.getElementById('mslist').scrollTop);
console.log('scrolled to ' + top);
if (top <= 0) bad('the list would not scroll');
await page.evaluate(() => { document.getElementById('mslist').scrollTop = 0; });
await page.waitForTimeout(200);

// ---- 2. dragging a locked card says nothing and starts nothing ------------
const card = await page.evaluate(() => {
  const n = document.querySelector('#mslist [data-mode="duel"]');
  const r = n.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(card.x, card.y);
await page.mouse.down();
for (let i = 1; i <= 7; i++) { await page.mouse.move(card.x, card.y - i * 20); await page.waitForTimeout(18); }
await page.mouse.up();
await page.waitForTimeout(500);
let st = await page.evaluate(() => ({
  toast: document.getElementById('mstoast').classList.contains('on'),
  state: window.__ts.game.state }));
console.log('drag   ' + JSON.stringify(st));
if (st.toast) bad('a scroll gesture triggered the locked message');
if (st.state !== 'menu') bad('a scroll gesture started a run');

// ---- 3. a real tap on a locked card DOES say so ---------------------------
await page.evaluate(() => { document.getElementById('mslist').scrollTop = 0; });
await page.waitForTimeout(250);
const c2 = await page.evaluate(() => {
  const n = document.querySelector('#mslist [data-mode="duel"]');
  const r = n.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(c2.x, c2.y);
await page.mouse.down();
await page.waitForTimeout(60);
await page.mouse.up();
await page.waitForTimeout(450);
st = await page.evaluate(() => ({
  toast: document.getElementById('mstoast').textContent,
  on: document.getElementById('mstoast').classList.contains('on'),
  state: window.__ts.game.state }));
console.log('tap    ' + JSON.stringify(st));
if (!st.on) bad('a real tap on a locked card said nothing');
if (st.state !== 'menu') bad('a locked card started a run');
await page.screenshot({ path: OUT + 'sel-scroll.png' });

// ---- 4. ...and a real tap on an open card starts it ----------------------
const c3 = await page.evaluate(() => {
  const n = document.querySelector('#mslist [data-mode="hall"]');
  const r = n.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(c3.x, c3.y);
await page.mouse.down();
await page.waitForTimeout(60);
await page.mouse.up();
await page.waitForTimeout(2600);
const fin = await page.evaluate(() => ({ state: window.__ts.game.state, mode: window.__ts.game.mode }));
console.log('choose ' + JSON.stringify(fin));
if (fin.state === 'menu') bad('a real tap on THE TUNNEL started nothing');
done('selscroll', errs);
await browser.close();
