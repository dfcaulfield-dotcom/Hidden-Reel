// Hidden Reel — daily movie puzzle. No build step, no backend.
// Progress and stats are kept in this browser's localStorage.

const EPOCH = new Date(2026, 10, 9); // local midnight of puzzle #1
const DAY = 86400000;
const IMG = 'https://image.tmdb.org/t/p/';
const STORE_KEY = 'hiddenreel:v1';
const FILM_POINTS = [10, 5]; // first try, second try
const linkValue = (seen) => [40, 40, 40, 34, 28, 22, 16][seen];

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};

// ---------- storage ----------
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { results: {} }; }
  catch { return { results: {} }; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {}
}
const store = load();

// ---------- dates ----------
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const dayNumber = () => Math.round((startOfToday() - EPOCH) / DAY) + 1;
const dateOf = (id) => new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + id - 1);
const fmtDate = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// ---------- state ----------
let puzzles = [];
let puzzle, state, current = 0;
const released = () => Math.max(1, Math.min(dayNumber(), puzzles.length));

const blankState = () => ({ films: puzzle.films.map(() => ({ tries: [], done: false, pts: 0 })), link: null, finished: false });
const seenCount = () => state.films.filter((f) => f.done).length;
const filmResult = (f) => !f.done ? '' : f.pts === 10 ? 'good' : f.pts === 5 ? 'near' : 'bad';
const total = (s) => s.films.reduce((n, f) => n + f.pts, 0) + (s.link?.pts ?? 0);

function open(id) {
  puzzle = puzzles[id - 1];
  state = store.results[id] ?? blankState();
  const firstOpen = state.films.findIndex((f) => !f.done);
  current = firstOpen === -1 ? 0 : firstOpen;
  const isToday = id === released();
  $('puzzle-label').textContent = `No. ${id} · ${fmtDate(dateOf(id))}${isToday ? '' : ' · archive'}`;
  render();
}

function commit() {
  store.results[puzzle.id] = state;
  save();
}

function finishIfDone() {
  if (state.finished || seenCount() < 6 || !state.link) return;
  state.finished = true;
  state.onDay = puzzle.id === dayNumber();
  commit();
}

// ---------- actions ----------
function pickFilm(choice) {
  const film = puzzle.films[current];
  const s = state.films[current];
  if (s.done || s.tries.includes(choice)) return;
  s.tries.push(choice);
  if (choice === film.answer) {
    s.done = true;
    s.pts = FILM_POINTS[s.tries.length - 1];
  } else if (s.tries.length >= 2) {
    s.done = true;
  }
  finishIfDone();
  commit();
  render();
  if (seenCount() === 6 && !state.link) setTimeout(openLink, 1100);
}

function pickLink(choice) {
  if (state.link) return;
  const at = seenCount();
  state.link = { pick: choice, at, pts: choice === puzzle.theme ? linkValue(at) : 0 };
  finishIfDone();
  commit();
  $('dlg-link').close();
  toast(state.link.pts ? `That's the link! +${state.link.pts}` : 'Not the link');
  render();
  if (state.finished) $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function nextFilm() {
  for (let i = 1; i <= 6; i++) {
    const j = (current + i) % 6;
    if (!state.films[j].done) { current = j; break; }
  }
  render();
}

// ---------- rendering ----------
function render() {
  const film = puzzle.films[current];
  const s = state.films[current];

  const still = $('still');
  const src = `${IMG}w780${film.image}`;
  if (still.dataset.src !== src) {
    // Swap frames without animating the blur, so a new film never flashes in focus.
    still.style.transition = 'none';
    still.dataset.src = still.src = src;
    $('frame').dataset.focus = s.done ? 2 : s.tries.length;
    void still.offsetWidth;
    still.style.transition = '';
  } else {
    $('frame').dataset.focus = s.done ? 2 : s.tries.length;
  }
  still.alt = s.done ? `Still from ${film.title}` : 'Blurred film still';
  $('frame-tag').textContent = `Film ${current + 1} of 6`;

  const reveal = $('reveal');
  reveal.hidden = !s.done;
  if (s.done) {
    reveal.dataset.result = filmResult(s);
    $('reveal-title').textContent = `${film.title} (${film.year})`;
    $('reveal-note').textContent = s.pts === 10 ? 'First try · +10' : s.pts === 5 ? 'Second try · +5' : 'Missed · +0';
  }
  $('clue').textContent = film.clue;

  $('options').replaceChildren(...film.options.map((title, i) => {
    const b = el('button', { type: 'button', textContent: title });
    const tried = s.tries.includes(i);
    if (s.done && i === film.answer) b.className = 'right';
    else if (tried) b.className = 'wrong';
    b.disabled = s.done || tried;
    b.onclick = () => pickFilm(i);
    return b;
  }));

  const left = 6 - seenCount();
  $('btn-next').hidden = !s.done || left === 0;

  $('strip').replaceChildren(...puzzle.films.map((f, i) => {
    const fs = state.films[i];
    const b = el('button', { type: 'button', className: `${fs.done ? 'done' : ''} ${filmResult(fs)}` },
      el('img', { src: `${IMG}w300${f.image}`, alt: '', draggable: false }),
      el('b', { textContent: i + 1 }));
    b.setAttribute('aria-label', fs.done ? `Film ${i + 1}: ${f.title}` : `Film ${i + 1}, not yet revealed`);
    b.setAttribute('aria-current', i === current);
    b.onclick = () => { current = i; render(); };
    return b;
  }));

  const seen = seenCount();
  $('link-bar').hidden = !!state.link;
  $('btn-link').disabled = seen === 0;
  $('link-hint').textContent = seen === 0
    ? 'Reveal a film first. One guess only.'
    : `One guess only. Worth ${linkValue(seen)} points right now.`;

  renderResults();
}

function shareGrid(s) {
  return s.films.map((f) => (f.pts === 10 ? '🟩' : f.pts === 5 ? '🟨' : '⬛')).join('');
}
function linkLine(s) {
  return s.link.pts ? `Link found after ${s.link.at} film${s.link.at === 1 ? '' : 's'}` : 'Link missed';
}

function renderResults() {
  const box = $('results');
  box.hidden = !state.finished;
  if (!state.finished) return;
  $('res-theme').textContent = puzzle.themes[puzzle.theme];
  $('res-score').textContent = total(state);
  $('res-grid').textContent = shareGrid(state);
  $('res-link').textContent = `${linkLine(state)} · +${state.link.pts}`;
  $('res-why').replaceChildren(...puzzle.films.map((f) =>
    el('li', {}, el('b', { textContent: `${f.title} (${f.year})` }), f.why)));
  const more = dayNumber() < puzzles.length;
  $('next-up').textContent = puzzle.id !== released()
    ? 'From the archive.'
    : more ? `Next puzzle in ${countdown()}.` : 'You\'re all caught up. More puzzles are on the way.';
}

function countdown() {
  const ms = startOfToday().getTime() + DAY - Date.now();
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

// ---------- link dialog ----------
function openLink() {
  if (state.link || seenCount() === 0) return;
  const seen = seenCount();
  $('link-sub').textContent = `You've revealed ${seen} of 6 films. One guess, worth ${linkValue(seen)} points now.`;
  $('link-options').replaceChildren(...puzzle.themes.map((t, i) => {
    const b = el('button', { type: 'button', textContent: t });
    b.onclick = () => pickLink(i);
    return b;
  }));
  $('dlg-link').showModal();
}

// ---------- stats ----------
function stats() {
  const n = released();
  const done = [];
  for (let id = 1; id <= n; id++) if (store.results[id]?.finished) done.push(store.results[id]);
  const scores = done.map(total);
  const streakFrom = (id) => { let k = 0; while (id >= 1 && store.results[id]?.finished && store.results[id].onDay) { k++; id--; } return k; };
  const today = released();
  const streak = streakFrom(today) || streakFrom(today - 1);
  return {
    released: n,
    played: done.length,
    completion: Math.round((done.length / n) * 100),
    average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    best: scores.length ? Math.max(...scores) : 0,
    links: done.length ? Math.round((done.filter((s) => s.link.pts).length / done.length) * 100) : 0,
    streak,
  };
}

function openStats() {
  const s = stats();
  const cell = (v, label) => el('div', {}, el('b', { textContent: v }), el('span', { textContent: label }));
  $('stat-grid').replaceChildren(
    cell(`${s.completion}%`, 'Completion'), cell(s.average, 'Average score'), cell(s.streak, 'Day streak'),
    cell(s.played, 'Puzzles played'), cell(s.best, 'Best score'), cell(`${s.links}%`, 'Links found'));
  $('stat-meter').style.width = `${s.completion}%`;
  $('stat-sub').textContent = `${s.played} of ${s.released} puzzles completed. Stats are saved on this device.`;
  $('dlg-stats').showModal();
}

function openArchive() {
  const items = [];
  for (let id = released(); id >= 1; id--) {
    const r = store.results[id];
    const started = r && !r.finished;
    const b = el('button', { type: 'button' },
      el('span', {}, `No. ${id}${id === released() ? ' · today' : ''}`,
        el('small', { textContent: r?.finished ? puzzles[id - 1].themes[puzzles[id - 1].theme] : fmtDate(dateOf(id)) })),
      el('span', { className: `tag ${r?.finished ? '' : 'todo'}`, textContent: r?.finished ? `${total(r)}/100` : started ? 'Resume' : 'Play' }));
    b.onclick = () => { $('dlg-archive').close(); open(id); window.scrollTo({ top: 0 }); };
    items.push(el('li', {}, b));
  }
  $('archive-list').replaceChildren(...items);
  $('dlg-archive').showModal();
}

// ---------- share ----------
async function share() {
  const text = `Hidden Reel No. ${puzzle.id}\n🎬 ${shareGrid(state)}\n🔗 ${linkLine(state)}\n${total(state)}/100\n${location.origin}${location.pathname}`;
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    toast('Result copied');
  } catch (e) {
    if (e?.name !== 'AbortError') toast('Couldn\'t share. Try again.');
  }
}

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2200);
}

// ---------- boot ----------
$('btn-next').onclick = nextFilm;
$('btn-link').onclick = openLink;
$('btn-share').onclick = share;
$('btn-help').onclick = () => $('dlg-help').showModal();
$('btn-stats').onclick = openStats;
$('btn-archive').onclick = openArchive;
for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // tap backdrop to close
}

try {
  puzzles = await (await fetch('data/puzzles.json')).json();
  $('game').hidden = false;
  open(released());
  if (!store.seenHelp) { store.seenHelp = true; save(); $('dlg-help').showModal(); }
} catch {
  $('load-error').hidden = false;
}
