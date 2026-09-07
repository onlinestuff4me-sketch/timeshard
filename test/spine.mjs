// ---------------------------------------------------------------------------
// HOW FAR ALONG THE PATH HAVE THEY WALKED?
//
// `tutorSpineIx` is what every advance condition and every corridor sign
// reads, and it used to be a nearest-cell search over the whole spine. That
// is right while the player is on the path and silently wrong the moment they
// are not — which the opening sequence's T-junction makes routine, because
// one arm of it is a joke and not the route.
//
// This probe walks a leg shaped like that opening, at real speed, one frame
// at a time, down three differently-shaped dead ends. It runs the OLD rule
// and the NEW one side by side so the failure it exists to prevent stays
// visible rather than becoming a number nobody can explain.
//
// No browser: the measure is pure arithmetic over the leg's own cells, and a
// probe that boots Chromium to check arithmetic is a slow way to be less
// sure.
// ---------------------------------------------------------------------------
import { planToCells, HALL } from '../src/genleg.js';

const C = HALL.cell;
const SPEED = 4.6;            // m/s, the player's top speed (balance.js:854)
const DT = 1 / 60;
const RADIUS = 0.9;           // of a cell — see tutorUpdateSpineIx
const T = 18;                 // the junction cell in the plan below

// The opening: straight, corner, straight, corner, a short hall, then the T.
// `r` steps grid +x, which with the player walking +z is SCREEN LEFT — so the
// spine takes the left arm, which is the one marked THIS WAY.
const MOVES = [['f', 5], ['r', 3], ['f', 3], ['l', 3], ['f', 4], ['r', 4], ['f', 10]];
const { spine } = planToCells(0, 0, MOVES);
const [tx, tz] = spine[T];

const RULES = {
  // the whole path, nearest cell wins
  old: (ix, p) => {
    let best = ix, bd = 1e9;
    for (let i = 0; i < spine.length; i++) {
      const d = Math.hypot(spine[i][0] * C - p.x, spine[i][1] * C - p.z);
      if (d < bd) { bd = d; best = i; }
    }
    return Math.max(ix, best);
  },
  // one cell at a time, and only while standing on it
  now: (ix, p) => {
    const n = Math.min(ix + 1, spine.length - 1);
    const d = Math.hypot(spine[n][0] * C - p.x, spine[n][1] * C - p.z);
    return d <= C * RADIUS ? Math.max(ix, n) : ix;
  },
};

function walk(route, rule) {
  let ix = 0;
  const p = { x: spine[0][0] * C, z: spine[0][1] * C };
  for (const [gx, gz] of route) {
    const ax = gx * C, az = gz * C;
    let guard = 0;
    while (Math.hypot(ax - p.x, az - p.z) > 0.05 && guard++ < 5000) {
      const dx = ax - p.x, dz = az - p.z, m = Math.hypot(dx, dz);
      const s = Math.min(SPEED * DT, m);
      p.x += dx / m * s; p.z += dz / m * s;
      ix = RULES[rule](ix, p);
    }
  }
  return ix;
}

const toT = spine.slice(0, T + 1);
const arm = (f) => { const a = []; f(a); return toT.concat(a); };
const SHAPES = [
  ['turns back toward the spine', arm((a) => {
    for (let k = 1; k <= 3; k++) a.push([tx - k, tz]);
    for (let k = 1; k <= 4; k++) a.push([tx - 3, tz + k]);
    for (let k = 1; k <= 4; k++) a.push([tx - 3 + k, tz + 4]);
  })],
  ['hooks back across it', arm((a) => {
    for (let k = 1; k <= 2; k++) a.push([tx - k, tz]);
    for (let k = 1; k <= 6; k++) a.push([tx - 2, tz + k]);
    for (let k = 1; k <= 5; k++) a.push([tx - 2 + k, tz + 6]);
  })],
  ['turns away from it', arm((a) => {
    for (let k = 1; k <= 3; k++) a.push([tx - k, tz]);
    for (let k = 1; k <= 3; k++) a.push([tx - 3, tz - k]);
    for (let k = 1; k <= 3; k++) a.push([tx - 3 - k, tz - 3]);
  })],
];

let bad = 0;
console.log(`the junction is spine cell ${T}; walking any dead end off it`);
console.log('leaves the player having walked exactly that far.\n');
console.log('  dead end                        old   now');
for (const [name, route] of SHAPES) {
  const o = walk(route, 'old'), n = walk(route, 'now');
  if (n !== T) bad++;
  console.log(`  ${name.padEnd(30)}${String(o).padStart(4)}${String(n).padStart(6)}`
    + `   ${n === T ? '' : `FAIL wanted ${T}`}${o !== T ? `   (old was wrong by ${o - T})` : ''}`);
}

// ...and the route itself still measures end to end, which is the thing the
// guard could plausibly break.
const full = walk(spine, 'now'), want = spine.length - 1;
if (full !== want) bad++;
console.log(`\n  walking the whole route reaches ${full} of ${want}`
  + `${full === want ? '' : '   FAIL'}`);

console.log(`\nerrors: ${bad}`);
process.exit(bad ? 1 : 0);
