// ---------------------------------------------------------------------------
// THE RUN LOG — what happened in a run, kept so a playtest can be reported.
//
// The owner plays on a phone and reports back in words; this is the record
// under the words. main.js calls `ev()` at the moments that matter (a door, a
// death, a kill, a miss, a boss phase) and `tick()` once a frame for the
// frame-rate sample. The log is written to localStorage as it goes, so the
// LAST run is still there after a death, a reload or closing the app.
//
// Getting it out: `send()` posts it to the repo as an issue in the background
// (see below); `text()` is the whole log as plain text, for a harness.
// ---------------------------------------------------------------------------

const KEY = 'ts_runlog_last';
const MAX_EVENTS = 3000;
const REPO = 'onlinestuff4me-sketch/timeshard';

let log = null;          // the run being recorded, or the last one loaded back
let t0 = 0;              // performance.now() at the run's start
let saveDue = 0;
let fps = { frames: 0, since: 0, samples: [] };

const now = () => performance.now();
const r1 = (x) => Math.round(x * 10) / 10;

export function start(meta) {
  t0 = now();
  fps = { frames: 0, since: t0, samples: [] };
  log = {
    v: 1,
    started: new Date().toISOString(),
    meta: {
      ...meta,
      ua: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}`,
    },
    events: [],
    counts: { kills: {}, deaths: [], shots: 0, hits: 0, misses: 0, slow: 0, errors: 0 },
    peak: { door: meta.door || 0, streak: 0, tempo: 0 },
    ended: null,
  };
  save(true);
}

// One event: `kind` and a small object. `w` is the world clock and `d` the
// door, both supplied by the caller through `ctx()` so this module never
// reaches into the game.
let ctx = () => ({});
export function setContext(fn) { ctx = fn; }

export function ev(kind, data = {}) {
  if (!log) return;
  let c = {};
  try { c = ctx() || {}; } catch { /* the game is not up yet */ }
  const e = { t: r1((now() - t0) / 1000), k: kind, ...c, ...data };
  if (log.events.length >= MAX_EVENTS) log.events.splice(0, 500);   // keep the end of a long run
  log.events.push(e);
  const C = log.counts;
  if (kind === 'kill') C.kills[data.type] = (C.kills[data.type] || 0) + 1;
  if (kind === 'death') C.deaths.push({ door: c.d, by: data.by || '?' });
  if (kind === 'hit') C.hits++;
  if (kind === 'miss') C.misses++;
  if (kind === 'slow' && data.on) C.slow++;
  if (kind === 'error') C.errors++;
  if (c.d > log.peak.door) log.peak.door = c.d;
  if (kind === 'hit' && data.n > log.peak.streak) log.peak.streak = data.n;
  if (kind === 'tempo' && data.n > log.peak.tempo) log.peak.tempo = data.n;
  // a death or an end is when somebody reaches for the log: write at once
  save(kind === 'death' || kind === 'end' || kind === 'error');
}

export function end(why) {
  if (!log || log.ended) return;
  ev('end', { why });
  log.ended = new Date().toISOString();
  save(true);
}

// Frame-rate sampling, averaged over 10 s windows of real time.
export function tick() {
  if (!log || log.ended) return;
  fps.frames++;
  const n = now();
  if (n - fps.since >= 10000) {
    const f = Math.round(fps.frames * 1000 / (n - fps.since));
    fps.samples.push(f);
    if (fps.samples.length > 60) fps.samples.shift();
    log.fps = fps.samples.slice();
    fps.frames = 0; fps.since = n;
  }
  if (n >= saveDue) save(true);
}

function save(force) {
  if (!log) return;
  const n = now();
  if (!force && n < saveDue) return;
  saveDue = n + 5000;
  try { localStorage.setItem(KEY, JSON.stringify(log)); } catch { /* full or private */ }
}

// The run in progress if there is one, else the last one on disk.
export function current() {
  if (log) return log;
  try { log = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { log = null; }
  return log;
}

export function summary(L = current()) {
  if (!L) return 'No run recorded yet.';
  const C = L.counts, m = L.meta || {};
  const shots = C.hits + C.misses;
  const acc = shots ? Math.round(100 * C.hits / shots) + '%' : '-';
  const kills = Object.entries(C.kills).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
  const deaths = C.deaths.map((x) => `door ${x.d ?? x.door} (${x.by})`).join(', ') || 'none';
  const fpsAvg = L.fps && L.fps.length
    ? Math.round(L.fps.reduce((a, b) => a + b, 0) / L.fps.length) + ` (low ${Math.min(...L.fps)})` : '-';
  const last = L.events.length ? L.events[L.events.length - 1].t : 0;
  return [
    `Mode ${m.mode || '?'} · build ${m.build || '?'} · started door ${m.door || '?'} · reached door ${L.peak.door}`,
    `Played ${Math.round(last / 60)} min · ended ${L.ended ? 'yes' : 'no (still running or quit)'}`,
    `Deaths: ${deaths}`,
    `Kills: ${kills}`,
    `Shots ${shots}, accuracy ${acc}, best no-miss streak ${L.peak.streak}, best tempo ${L.peak.tempo}`,
    `Slow time used ${C.slow}× · errors ${C.errors} · fps ${fpsAvg}`,
    `Device ${m.screen || '?'} · ${m.ua || '?'}`,
  ].join('\n');
}

function line(e) {
  const skip = new Set(['t', 'k', 'd', 'w']);
  const rest = Object.entries(e).filter(([k]) => !skip.has(k))
    .map(([k, v]) => `${k}=${typeof v === 'number' ? r1(v) : v}`).join(' ');
  return `${String(e.t).padStart(6)}s ${e.d ? 'd' + e.d : '  '} ${e.w !== undefined ? 'w' + r1(e.w) : ''} ${e.k}${rest ? ' ' + rest : ''}`;
}

export function text(note = '') {
  const L = current();
  if (!L) return 'No run recorded yet.';
  return [
    'TIME SHATTER — run log',
    note ? `\nNOTE: ${note}\n` : '',
    summary(L),
    '',
    'EVENTS (seconds since start, door, world clock, event)',
    ...L.events.map(line),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// ONE TAP, IN THE BACKGROUND. The log goes to the repo as an issue labelled
// `playtest`, posted with a GitHub key that lives ONLY in this device's
// storage — the owner pastes it once (a fine-grained token that can create
// issues on this one repo). Nothing in the game's code or the repo holds a
// key: a key in a public repo is revoked by GitHub on sight, and readable by
// anyone who opens the page. A send that fails (offline, a bad key) waits in
// an outbox and goes with the next one.
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'ts_gh_token';
const OUTBOX_KEY = 'ts_log_outbox';
export function hasKey() { try { return !!localStorage.getItem(TOKEN_KEY); } catch { return false; } }
export function setKey(k) {
  try { if (k) localStorage.setItem(TOKEN_KEY, k.trim()); else localStorage.removeItem(TOKEN_KEY); } catch { /* private */ }
}
function outbox() { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; } }
function setOutbox(list) { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(-10))); } catch { /* full */ } }
export function pending() { return outbox().length; }

// The report for the run in hand: a title and a body GitHub will take (the
// body cap is 65,536 characters; the oldest events go first).
function report() {
  const L = current();
  const door = L ? L.peak.door : '?';
  const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const title = `Playtest log: door ${door}, ${(L && L.meta && L.meta.build) || '?'}, ${when}`;
  const head = '```\n' + summary(L) + '\n```\n\n<details><summary>Events</summary>\n\n```\n';
  const tail = '\n```\n</details>\n';
  let lines = L ? L.events.map(line) : [];
  let body = head + lines.join('\n') + tail;
  while (body.length > 60000 && lines.length > 50) {
    lines = lines.slice(Math.ceil(lines.length / 10));
    body = head + '(earlier events left out)\n' + lines.join('\n') + tail;
  }
  return { title, body, labels: ['playtest'] };
}

async function post(item, key) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) { const e = new Error('github ' + res.status); e.status = res.status; throw e; }
  const j = await res.json();
  return j.number;
}

// Queue this run's report and flush the outbox. Resolves to
// { sent, waiting, number?, error? } — never rejects.
export async function send() {
  if (log) { ev('report'); save(true); }
  const list = outbox();
  list.push(report());
  setOutbox(list);
  return flush();
}
export async function flush() {
  let key = null;
  try { key = localStorage.getItem(TOKEN_KEY); } catch { /* private */ }
  if (!key) return { sent: 0, waiting: pending(), error: 'no key' };
  const list = outbox();
  let sent = 0, number = null, error = null;
  while (list.length) {
    try { number = await post(list[0], key); list.shift(); sent++; setOutbox(list); }
    catch (e) { error = e.status === 401 || e.status === 403 || e.status === 404 ? 'bad key' : 'offline'; break; }
  }
  return { sent, waiting: list.length, number, error };
}
