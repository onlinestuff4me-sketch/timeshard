// Shared boot for menu probes. Conventions from docs/HANDOFF.md:
// Chromium at 402x874, hasTouch + isMobile, dsf 1, always watch pageerror.
import { chromium } from 'playwright';
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PORT = process.env.TS_PORT || 8321;
// Screenshots go here, never into the repo root. Gitignored.
// NB: this module exports a constant called URL, which shadows the global
// inside it — so this is built from paths rather than `new URL(...)`.
export const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out') + '/';
mkdirSync(OUT, { recursive: true });
export const URL = `http://127.0.0.1:${PORT}/index.html`;
// WHICH CHROMIUM. Playwright normally downloads a build pinned to its own
// version, but a dev container usually ships one already and the two rarely
// agree — `npm i playwright` then fails with "Executable doesn't exist at
// .../chromium_headless_shell-1234". So: an explicit TS_CHROME wins, then
// whatever build is actually sitting in PLAYWRIGHT_BROWSERS_PATH, and only
// if neither exists do we let Playwright look for its own.
function findChrome() {
  if (process.env.TS_CHROME) return process.env.TS_CHROME;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  for (const dir of readdirSync(root).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
    const exe = join(root, dir, 'chrome-linux', 'chrome');
    if (existsSync(exe)) return exe;
  }
  return undefined;
}
export const CHROME = findChrome();

export async function boot({ seed = null } = {}) {
  const errs = [];
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
    ...(CHROME ? { executablePath: CHROME } : {}),
  });
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 874 }, deviceScaleFactor: 1,
    hasTouch: true, isMobile: true,
  });
  // A probe that seeds localStorage must seed it in addInitScript — a page
  // that has already booted has read its saves.
  if (seed) await ctx.addInitScript(seed);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__ts, null, { timeout: 20000 });
  return { browser, ctx, page, errs };
}

export function done(name, errs) {
  console.log(`errors: ${errs.length}`);
  for (const e of errs.slice(0, 8)) console.log('  ' + e);
}

// Is an element on screen and inside the viewport?
export const boxOf = (page, sel) => page.evaluate((s) => {
  const n = document.querySelector(s);
  if (!n) return null;
  const st = getComputedStyle(n);
  if (st.display === 'none' || st.visibility === 'hidden') return null;
  const r = n.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1),
           h: +r.height.toFixed(1), bottom: +r.bottom.toFixed(1), right: +r.right.toFixed(1),
           text: (n.innerText || '').replace(/\s+/g, ' ').trim() };
}, sel);
