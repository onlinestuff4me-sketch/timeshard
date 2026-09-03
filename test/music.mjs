// IS THERE MUSIC, AND CAN A PHONE PLAY IT?
//
// The music was reported missing. It was not missing: it was playing the
// whole time, at -45dBFS, with THIRTY DECIBELS more of its energy below
// 300Hz than above 500Hz. A phone speaker is about 6mm across and reproduces
// almost nothing under 500Hz, so the loudest voice in the track — a 120->44Hz
// sine kick — was the one voice the player's hardware could not make a sound
// with, while the pad sat 23dB under it behind a 750Hz lowpass. On a laptop
// it was a mix. On the only device this game is played on it was silence.
//
// So "is the music playing" is the wrong question and every flag in the audio
// graph answered it yes. This probe taps the signal that reaches the speakers
// and asks the two questions that matter: how loud, and in which bands.
import { boot, done } from './lib.mjs';

// An analyser wired to everything that reaches the destination. It has to be
// installed before the page boots, because the game builds its graph on the
// first gesture and never rebuilds it.
const PROBE = () => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const wrap = (c) => {
    const an = c.createAnalyser();
    an.fftSize = 4096; an.smoothingTimeConstant = 0;
    window.__an = an;
    const t = new Float32Array(an.fftSize);
    const f = new Float32Array(an.frequencyBinCount);
    window.__tap = () => {
      an.getFloatTimeDomainData(t);
      let s = 0, p = 0;
      for (const v of t) { s += v * v; p = Math.max(p, Math.abs(v)); }
      return { rms: Math.sqrt(s / t.length), peak: p };
    };
    // Peak energy per band. Bands, not a single number: a track can be loud
    // and still inaudible if the loudness is where the speaker rolls off.
    window.__bands = () => {
      an.getFloatFrequencyData(f);
      const hz = c.sampleRate / 2 / f.length;
      return [[20, 150], [150, 300], [300, 500], [500, 1000],
              [1000, 2000], [2000, 5000], [5000, 12000]].map(([lo, hi]) => {
        let s = 0, n = 0;
        for (let i = Math.floor(lo / hz); i < Math.min(Math.ceil(hi / hz), f.length); i++) {
          if (f[i] > -200) { s += Math.pow(10, f[i] / 10); n++; }
        }
        return n ? +(10 * Math.log10(s / n)).toFixed(1) : -200;
      });
    };
  };
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (d, ...r) {
    const out = orig.call(this, d, ...r);
    try {
      if (d && d.context && d === d.context.destination && window.__an) orig.call(this, window.__an);
    } catch { /* not a node we can tee */ }
    return out;
  };
  window.AudioContext = function (...a) { const c = new AC(...a); wrap(c); return c; };
  window.AudioContext.prototype = AC.prototype;
  window.webkitAudioContext = window.AudioContext;
};

// past the tutorial and past the slow-time gate, so bullet time is reachable.
// `__probeMuted` decides whether the start screen's sound toggle begins off.
const SEED = () => {
  window.__probeInstall();
  try {
    const now = Date.now();
    localStorage.setItem('timeshard_muted', window.__probeMuted ? '1' : '0');
    localStorage.setItem('timeshard_taught', '1');
    localStorage.setItem('ts_deepest_door', '14');
    localStorage.setItem('ts_s0_used', '1'); localStorage.setItem('ts_s0_mode', 'hall');
    localStorage.setItem('ts_s0_doors', '14'); localStorage.setItem('ts_s0_rdoor', '14');
    localStorage.setItem('ts_s0_at', String(now - 3e5));
    localStorage.setItem('ts_s0_born', String(now - 9e6));
    localStorage.setItem('ts_saves', JSON.stringify([{ i: 0, name: '', num: 1, mode: 'hall' }]));
  } catch { /* private mode */ }
};

const seedFor = (muted) => `
  window.__probeInstall = ${PROBE.toString()};
  window.__probeMuted = ${muted};
  (${SEED.toString()})();
`;
const { browser, page, errs } = await boot({ seed: seedFor(false) });
const bad = (m) => console.log('FAIL ' + m);
const db = (v) => (v > 0 ? +(20 * Math.log10(v)).toFixed(1) : -999);
const listen = (ms) => page.evaluate(async (ms) => {
  const lvl = [], bands = [];
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    if (window.__tap) lvl.push(window.__tap());
    if (window.__bands) bands.push(window.__bands());
    await new Promise((r) => requestAnimationFrame(r));
  }
  if (!lvl.length) return null;
  return {
    rms: lvl.reduce((a, b) => a + b.rms, 0) / lvl.length,
    peak: Math.max(...lvl.map((o) => o.peak)),
    bands: bands.length ? bands[0].map((_, i) => Math.max(...bands.map((b) => b[i]))) : null,
  };
}, ms);

await page.waitForTimeout(1600);
// NOTHING BEFORE A GESTURE, and that is correct — every browser requires one.
if (await page.evaluate(() => !!window.__tap)) bad('an AudioContext was built with no user gesture');

await page.tap('.go');          // CONTINUE: one tap, straight into the run
await page.waitForTimeout(4500);
if (await page.evaluate(() => window.__ts.game.state) === 'menu') bad('CONTINUE did not start a run');

// ---- 1. there is music, and it is loud enough to be music ------------------
const run = await listen(5000);
if (!run) { bad('no audio reached the speakers at all'); done('music', errs); await browser.close(); process.exit(1); }
console.log('in a run   rms ' + db(run.rms) + ' dB   peak ' + db(run.peak)
  + ' dB (' + run.peak.toFixed(3) + ' linear)');
// -38dB is the floor of "a player would notice this is on". The track sits
// around -29; it used to sit at -45, which is what "we lost the music" was.
if (db(run.rms) < -38) bad('the music is too quiet to hear: ' + db(run.rms) + ' dBFS rms');
if (run.peak > 0.95) bad('the mix is clipping: peak ' + run.peak.toFixed(3));

// ---- 2. ...and it is in the bands a phone can reproduce --------------------
const NAMES = ['20-150', '150-300', '300-500', '500-1k', '1k-2k', '2k-5k', '5k-12k'];
console.log('bands      ' + run.bands.map((v, i) => NAMES[i] + ' ' + v).join('  '));
const phone = Math.max(...run.bands.slice(3));   // 500Hz and up: a phone plays this
const sub = Math.max(...run.bands.slice(0, 2));  // under 300Hz: a phone does not
console.log('phone can play ' + phone + ' dB, cannot play ' + sub + ' dB, skew '
  + (sub - phone).toFixed(1) + ' dB  (was 30.3 when the music was reported missing)');
if (sub - phone > 14) {
  bad('the music is ' + (sub - phone).toFixed(1) + ' dB louder in bands a phone speaker drops');
}

// ---- 3. it survives bullet time without vanishing or clipping --------------
await page.evaluate(() => { window.__ts.setSlow(99); window.__ts.setTimeLocked(true); });
await page.waitForTimeout(1500);
const slow = await listen(3500);
const scale = await page.evaluate(() => window.__ts.slowLook().scale);
console.log('bullet time timeScale ' + scale + '  rms ' + db(slow.rms)
  + ' dB  peak ' + db(slow.peak) + ' dB');
if (scale > 0.5) bad('bullet time never engaged, so this measured nothing');
if (db(slow.rms) < -40) bad('the music falls apart in bullet time: ' + db(slow.rms) + ' dBFS');
if (slow.peak > 0.95) bad('bullet time clips: peak ' + slow.peak.toFixed(3));
await page.evaluate(() => window.__ts.setTimeLocked(false));
await page.waitForTimeout(1200);

// ---- 4. and it is still there after the run ends ---------------------------
await page.tap('#pausebtn');
await page.waitForTimeout(600);
await page.tap('#pendrun');
await page.waitForTimeout(3000);
await page.tap('#menubtn');
await page.waitForTimeout(3000);
const menu = await listen(4000);
console.log('on the menu rms ' + db(menu.rms) + ' dB   peak ' + db(menu.peak) + ' dB');
if (db(menu.rms) < -38) bad('the menu lost its music: ' + db(menu.rms) + ' dBFS rms');

// ---- 5. and the player's own slider still governs it ----------------------
await page.evaluate(() => window.__ts.sfx.setMusicVol(0));
await page.waitForTimeout(1200);
const off = await listen(2500);
console.log('slider at 0 rms ' + db(off.rms) + ' dB');
if (off.rms > 0.001) bad('the music slider no longer silences the music');

await browser.close();

// ---- 6. and turning the sound back ON brings the music with it -------------
//
// Every other sound is made on demand, so unmuting is enough for all of them.
// The music is the one LOOP, started once, and startMusic refuses to start
// while muted — so booting with the toggle off left `musicSrc` null and
// unmuting gave back the whole game EXCEPT the music, on a menu that then sat
// in digital silence. It reappeared only if you started a run, because a run
// flushes and a flush re-seats the loop.
const b2 = await boot({ seed: seedFor(true) });
const listen2 = (ms) => b2.page.evaluate(async (ms) => {
  const l = []; const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    if (window.__tap) l.push(window.__tap());
    await new Promise((r) => requestAnimationFrame(r));
  }
  return l.length ? { rms: l.reduce((a, x) => a + x.rms, 0) / l.length } : { rms: 0 };
}, ms);
await b2.page.waitForTimeout(1600);
if (!(await b2.page.evaluate(() => document.getElementById('sndbtn').classList.contains('muted')))) {
  bad('booting with timeshard_muted did not show the toggle as off');
}
// a gesture that is NOT the toggle, so the graph builds and the music finishes
// rendering while still muted — unmuting during the render would hide this
await b2.page.tap('#titleblock');
await b2.page.waitForTimeout(3000);
if (!(await b2.page.evaluate(() => window.__ts.sfx.isMuted()))) bad('the first tap unmuted the game');
await b2.page.tap('#sndbtn');
await b2.page.waitForTimeout(1800);
const back = await b2.page.evaluate(() => ({
  muted: window.__ts.sfx.isMuted(), music: !!window.__ts.audio().music }));
const un = await listen2(4000);
console.log('unmuted     ' + JSON.stringify(back) + '  menu rms ' + db(un.rms) + ' dB');
if (back.muted) bad('the sound toggle did not turn the sound back on');
if (!back.music) bad('the music loop was never seated when the sound came back');
if (db(un.rms) < -38) bad('sound is back on but the menu has no music: ' + db(un.rms) + ' dBFS');
errs.push(...b2.errs);
await b2.browser.close();

done('music', errs);
