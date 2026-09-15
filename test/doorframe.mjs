// ---------------------------------------------------------------------------
// IS THE WALL BESIDE A DOOR ACTUALLY CLOSED?
//
// The exit door's jambs are 0.7 m because the opening is 2 m in a 4 m cell:
// 0.7 reaches from the opening's edge to the cell's SIDE WALL and abuts it
// exactly. That is right whenever the end cell HAS a side wall. It does not
// always: NO RETREAT's rooms are an authored strip widened one cell either
// side for their whole length — the door row included — so the neighbouring
// cell is floor, no side wall is built, and the jamb stops 0.3 m short of
// anything. Measured before the fix: a 0.30 m slot, floor to ceiling, on BOTH
// sides of every door in the mode, and in `stop` too.
//
// The vault's interior doorways had the same class of bug in the other axis:
// its lintel spans y 2.405..2.955 and the ceiling's underside is at 3.0, so a
// 45 mm slot ran the full 2.6 m width of both its doorways.
//
// HOW IT ASKS. Not "is there a box in the doorway plane" — the jambs sit
// centred on the cell boundary while the walls either side sit 0.15 m inside
// it, so the assembly is continuous in z at three different plane positions
// and plane-sampling reports holes that are not there. It shoots a z-ray
// across the boundary at every (x, y) and asks whether ANYTHING stops it.
//
// WHAT IT DUPLICATES, AND WHY. buildHallLeg's wall boxes are rebuilt here
// rather than imported: they live in main.js, which needs THREE and a DOM.
// The duplication is deliberate and small, and it is the reason this probe
// can be arithmetic instead of a screenshot. If the wall boxes in main.js
// change shape, this file has to change with them — `boxesFor` below is the
// only place that knows them.
//
// No browser: the measure is geometry, and a probe that boots Chromium to
// check geometry is a slow way to be less sure.
// ---------------------------------------------------------------------------
import { HALL, genHallLeg } from '../src/genleg.js';
import { LEG, SIMPLE } from '../src/balance.js';

const C = HALL.cell, H = HALL.h, W = HALL.wall;

// NO RETREAT's plan, copied from main.js:simpleLegPlan for the same reason.
function simpleLegPlan(mode) {
  const n = SIMPLE[mode].legCells, w = SIMPLE.legWide;
  const extra = [];
  for (let dz = 0; dz <= n; dz++) {
    for (let dx = -w; dx <= w; dx++) if (dx !== 0) extra.push([dx, dz]);
  }
  return { moves: [['f', n]], extra, approach: 4 };
}

// buildHallLeg's walls, as [cx, cy, cz, w, h, d]. Collision-only boxes are
// left out; this is about what you can SEE through.
function boxesFor(leg, grid) {
  const { cells, doorways, endGx, endGz } = leg;
  const B = [];
  const box = (px, pz, w, d) => B.push([px, H / 2, pz, w, H, d]);
  for (const [gx, gz] of cells) {
    const x = gx * C, z = gz * C;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (grid.has((gx + dx) + ',' + (gz + dz))) continue;
      if (gx === endGx && gz === endGz && dz === 1) continue;   // the doorway
      if (dx !== 0) box(x + dx * (C / 2 - W / 2), z, W, C);
      else box(x, z + dz * (C / 2 - W / 2), C, W);
    }
  }
  const dx0 = endGx * C, dz0 = endGz * C + C / 2 - W / 2;
  for (const s of [-1, 1]) {
    const open = grid.has((endGx + s) + ',' + endGz);
    const outer = open ? C / 2 : C / 2 - W;
    const jw = outer - DOOR_HALF;
    box(dx0 + s * (DOOR_HALF + jw / 2), dz0, jw, W);
  }
  B.push([dx0, 2.8, dz0, 2, 0.6, W]);                     // lintel
  for (const [dgx, dgz, ddz] of (doorways || [])) {
    const ox = dgx * C, oz = dgz * C + ddz * (C / 2);
    const half = LEG.vaultDoorW / 2;
    const jw = C / 2 - W / 2 - half;
    if (jw > 0.05) { box(ox - half - jw / 2, oz, jw, W); box(ox + half + jw / 2, oz, jw, W); }
    B.push([ox, (H + VAULT_TOP) / 2, oz, LEG.vaultDoorW, H - VAULT_TOP, W]);
  }
  return B;
}
const DOOR_HALF = 1;                  // the exit opening is 2 m
const DOOR_TOP = 2.5;                 // ...and 2.5 m tall, under its lintel
const VAULT_TOP = H - 0.695;          // the vault opening's head height

const blocks = (B, x, y, z0, z1) => B.some(([bx, by, bz, w, h, d]) =>
  Math.abs(x - bx) < w / 2 - 1e-9 && Math.abs(y - by) < h / 2 - 1e-9
  && bz + d / 2 > z0 + 1e-9 && bz - d / 2 < z1 - 1e-9);

// Every open sample in the plane, outside the opening itself, collapsed to
// contiguous runs in x so a slot reads as one slot.
function slots(B, edgeZ, cx, openHalf, openTop, span) {
  const open = [];
  for (let x = span[0] + 0.025; x < span[1]; x += 0.05) {
    for (let y = 0.025; y < H; y += 0.05) {
      if (Math.abs(x - cx) < openHalf && y < openTop) continue;
      if (!blocks(B, x, y, edgeZ - C / 2, edgeZ + C / 2)) { open.push(+(x - cx).toFixed(3)); break; }
    }
  }
  const runs = [];
  for (const k of open) {
    const last = runs[runs.length - 1];
    if (last && Math.abs(k - last[1]) < 0.06) last[1] = k; else runs.push([k, k]);
  }
  return runs;
}

const rowSpan = (cells, ...rows) => {
  const xs = cells.filter(([, gz]) => rows.includes(gz)).map(([gx]) => gx);
  return xs.length ? [Math.min(...xs) * C - C / 2, Math.max(...xs) * C + C / 2] : null;
};

let bad = 0;
const report = (label, runs) => {
  if (!runs.length) { console.log(`  ${label.padEnd(34)}closed`); return; }
  bad++;
  for (const [a, b] of runs) {
    console.log(`  ${label.padEnd(34)}FAIL open ${(b - a + 0.05).toFixed(2)} m `
      + `at dx ${a.toFixed(2)}..${b.toFixed(2)}`);
  }
};

// 1. THE SIMPLIFIED MODES, whose door row is widened and so has no side wall.
console.log('the authored strip modes — their door row is floor either side:');
for (const mode of ['duel', 'stop']) {
  if (!SIMPLE[mode] || !SIMPLE[mode].legCells) continue;
  const grid = new Set();
  const leg = genHallLeg(0, 0, { plan: simpleLegPlan(mode) }, grid, new Set());
  const B = boxesFor(leg, grid);
  report(`${mode} exit door`,
    slots(B, leg.endGz * C + C / 2, leg.endGx * C, DOOR_HALF, DOOR_TOP,
      rowSpan(leg.cells, leg.endGz)));
}

// 2. EVERY GENERATED FORM, exit door and any interior doorway it builds.
console.log('\nevery generated form, over 60 legs each:');
for (const id of ['corridor', 'atrium', 'vault', 'gauntlet', 'serviceRun']) {
  let exitBad = 0, inBad = 0, inSeen = 0;
  for (let n = 0; n < 60; n++) {
    const grid = new Set();
    const leg = genHallLeg(0, 0, { form: { id } }, grid, new Set());
    const B = boxesFor(leg, grid);
    const es = rowSpan(leg.cells, leg.endGz);
    if (es && slots(B, leg.endGz * C + C / 2, leg.endGx * C, DOOR_HALF, DOOR_TOP, es).length) exitBad++;
    for (const [dgx, dgz, ddz] of (leg.doorways || [])) {
      const sp = rowSpan(leg.cells, dgz, dgz + ddz);
      if (!sp) continue;
      inSeen++;
      if (slots(B, dgz * C + ddz * (C / 2), dgx * C, LEG.vaultDoorW / 2, VAULT_TOP, sp).length) inBad++;
    }
  }
  if (exitBad) bad++;
  if (inBad) bad++;
  console.log(`  ${id.padEnd(12)} exit ${exitBad ? `FAIL ${exitBad}/60 open` : '60/60 closed'}`
    + (inSeen ? `   interior ${inBad ? `FAIL ${inBad}/${inSeen} open` : `${inSeen}/${inSeen} closed`}` : ''));
}

console.log(`\nerrors: ${bad}`);
process.exit(bad ? 1 : 0);
