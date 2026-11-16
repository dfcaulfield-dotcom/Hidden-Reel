// Hidden Reel — a daily film deduction puzzle. No build step, no backend.
// Progress and stats are kept in this browser's localStorage.

const EPOCH = new Date(2026, 10, 14); // local midnight of puzzle No. 1
const DAY = 86400000;
const IMG = 'https://image.tmdb.org/t/p/';
const STORE_KEY = 'hiddenreel:v2';
const COST = { wrong: 2, hint: 5, reveal: 10 };
const LETTERS = 'ABCDE';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids.filter((k) => k != null && k !== false));
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
let puzzles = [], filmIndex = [], peopleIndex = [];
let puzzle, state;
const released = () => Math.max(1, Math.min(dayNumber(), puzzles.length));

// Every answer slot in a puzzle, in display order: f0..f4, p0..pN, link.
function slots(p = puzzle) {
  return [
    ...p.films.map((f, i) => ({ key: `f${i}`, kind: 'film', i, data: f, label: `Film ${LETTERS[i]}` })),
    ...p.people.map((x, i) => ({ key: `p${i}`, kind: 'person', i, data: x, label: `Person ${i + 1}` })),
    { key: 'link', kind: 'link', i: 0, data: p.link, label: 'The missing name' },
  ];
}
const blankState = () => ({ items: Object.fromEntries(slots().map((s) => [s.key, { wrong: [], hint: false, status: 'open' }])), finished: false });
const isDone = (it) => it.status !== 'open';
const itemCost = (it) => it.wrong.length * COST.wrong + (it.status === 'revealed' ? COST.reveal : it.hint ? COST.hint : 0);
const score = (s) => Math.max(0, 100 - Object.values(s.items).reduce((n, it) => n + itemCost(it), 0));

function open(id) {
  puzzle = puzzles[id - 1];
  state = store.results[id] ?? blankState();
  $('puzzle-label').textContent = `No. ${id} · ${fmtDate(dateOf(id))}${id === released() ? '' : ' · archive'}`;
  render();
}

function commit() {
  if (!state.finished && Object.values(state.items).every(isDone)) {
    state.finished = true;
    state.onDay = puzzle.id === dayNumber();
  }
  store.results[puzzle.id] = state;
  save();
}

// ---------- small render helpers ----------
function shape(enumeration) {
  const s = el('span', { className: 'shape' });
  s.setAttribute('aria-label', `${enumeration.split(',').join(', ')} letters`);
  for (const n of enumeration.split(',')) s.append(el('i', {}, ...Array.from({ length: +n }, () => el('b'))));
  return s;
}
const filmChip = (i) => el('span', { className: 'chip', textContent: LETTERS[i] });
const personChip = (i) => el('span', { className: 'chip round', textContent: i + 1 });
const doneClass = (it) => (it.status === 'solved' ? 'done' : it.status === 'revealed' ? 'given-up' : '');
const image = (slot, size) => {
  const path = slot.kind === 'film' ? slot.data.poster : slot.data.profile;
  return path ? `${IMG}${size}${path}` : null;
};
const answerText = (slot) => (slot.kind === 'film' ? `${slot.data.title} (${slot.data.year})` : slot.data.name);
const cellsOf = (slot) => puzzle.cells.filter((c) => (slot.kind === 'film' ? c[0] : c[1]) === slot.i);

// ---------- main render ----------
function render() {
  const all = slots();
  const films = all.filter((s) => s.kind === 'film');
  const people = all.filter((s) => s.kind === 'person');
  const it = (s) => state.items[s.key];

  // grid
  const head = el('tr', {}, el('th'), ...people.map((s) => {
    const src = isDone(it(s)) && image(s, 'w185');
    const b = el('button', { type: 'button', className: `head-btn col ${doneClass(it(s))}` },
      src ? el('img', { src, alt: '' }) : personChip(s.i),
      src ? el('small', { textContent: s.i + 1 }) : null);
    b.setAttribute('aria-label', isDone(it(s)) ? `Person ${s.i + 1}: ${s.data.name}` : `Person ${s.i + 1}, unsolved`);
    b.onclick = () => openItem(s.key);
    return el('th', {}, b);
  }));
  const rows = films.map((s) => {
    const b = el('button', { type: 'button', className: `head-btn row ${doneClass(it(s))}` },
      isDone(it(s)) && s.data.poster ? el('img', { src: image(s, 'w92'), alt: '' }) : filmChip(s.i),
      el('small', { textContent: s.data.year }));
    b.setAttribute('aria-label', isDone(it(s)) ? `Film ${LETTERS[s.i]}: ${s.data.title}` : `Film ${LETTERS[s.i]}, ${s.data.year}, unsolved`);
    b.onclick = () => openItem(s.key);
    return el('tr', {}, el('th', {}, b), ...people.map((p) => {
      const role = puzzle.cells.find((c) => c[0] === s.i && c[1] === p.i)?.[2] ?? '';
      const td = el('td', { className: role ? 'lit' : '' },
        role.includes('D') && el('span', { className: 'mark d', textContent: 'D', title: 'Directed' }),
        role.includes('C') && el('span', { className: 'mark a', textContent: 'A', title: 'Acted in' }));
      return td;
    }));
  });
  $('board').replaceChildren(el('thead', {}, head), el('tbody', {}, ...rows));

  // lists
  const row = (s) => {
    const done = isDone(it(s));
    const src = done && image(s, 'w185');
    const chip = s.kind === 'film' ? filmChip(s.i) : s.kind === 'person' ? personChip(s.i) : el('span', { className: 'chip link', textContent: '?' });
    const sub = s.kind === 'film' ? `Released ${s.data.year}`
      : s.kind === 'person' ? `Born ${s.data.born ?? 'unknown'} · ${creditLine(s, false)}`
      : done ? `The ${s.data.job} on all five films` : 'Worked on all five films. Not on the grid.';
    const b = el('button', { type: 'button', className: `item ${doneClass(it(s))}` },
      chip,
      src ? el('img', { src, alt: '', className: s.kind === 'film' ? '' : 'face' }) : null,
      el('span', { className: 'body' },
        el('span', { className: 'main' }, done ? (s.kind === 'film' ? s.data.title : s.data.name) : shape(s.data.enum)),
        el('span', { className: 'sub', textContent: sub })),
      el('span', { className: 'go', textContent: '›' }));
    b.onclick = () => openItem(s.key);
    return el('li', {}, b);
  };
  $('list-films').replaceChildren(...films.map(row));
  $('list-people').replaceChildren(...people.map(row));
  $('list-link').replaceChildren(row(all.at(-1)));

  const solved = all.filter((s) => isDone(it(s))).length;
  $('status').replaceChildren(el('b', { textContent: `${score(state)} points` }), ` · ${solved} of ${all.length} found`);
  $('status').hidden = state.finished;
  renderResults();
}

// "Directed A, B · Acted in C" for a person; "Directed by 1 · With 2, 3" for a film.
function creditLine(slot, withNames) {
  const cells = cellsOf(slot);
  const other = (c) => {
    const i = slot.kind === 'film' ? c[1] : c[0];
    const key = slot.kind === 'film' ? `p${i}` : `f${i}`;
    const label = slot.kind === 'film' ? i + 1 : LETTERS[i];
    const known = withNames && isDone(state.items[key]);
    const data = slot.kind === 'film' ? puzzle.people[i] : puzzle.films[i];
    return known ? `${label} (${data.name ?? data.title})` : label;
  };
  const dir = cells.filter((c) => c[2].includes('D')).map(other);
  const act = cells.filter((c) => c[2].includes('C')).map(other);
  const parts = [];
  if (slot.kind === 'film') {
    if (dir.length) parts.push(`Directed by ${dir.join(', ')}`);
    if (act.length) parts.push(`With ${act.join(', ')}`);
  } else {
    if (dir.length) parts.push(`Directed ${dir.join(', ')}`);
    if (act.length) parts.push(`Acted in ${act.join(', ')}`);
  }
  return parts.join(' · ');
}

// ---------- solve dialog ----------
let openKey = null;
function openItem(key) {
  openKey = key;
  $('item-input').value = '';
  renderItem();
  if (!$('dlg-item').open) $('dlg-item').showModal();
}

function renderItem() {
  const slot = slots().find((s) => s.key === openKey);
  const it = state.items[openKey];
  const done = isDone(it);
  $('item-title').textContent = slot.label;

  $('item-solved').hidden = !done;
  if (done) {
    const src = image(slot, slot.kind === 'film' ? 'w342' : 'w185');
    $('item-image').hidden = !src;
    if (src) $('item-image').src = src;
    $('item-answer').replaceChildren(answerText(slot),
      el('small', { textContent: it.status === 'revealed' ? 'Revealed' : it.wrong.length || it.hint ? 'Solved with help' : 'Solved' }));
  }

  const facts = [];
  const fact = (text, cls = '') => facts.push(el('li', { className: cls }, text));
  if (slot.kind === 'film') {
    fact(`Released in ${slot.data.year}`);
    if (!done) facts.push(el('li', {}, 'Title: ', shape(slot.data.enum)));
    creditLine(slot, true).split(' · ').forEach((t) => fact(t));
  } else if (slot.kind === 'person') {
    fact(`Born in ${slot.data.born ?? 'an unknown year'}`);
    if (!done) facts.push(el('li', {}, 'Name: ', shape(slot.data.enum)));
    creditLine(slot, true).split(' · ').forEach((t) => fact(t));
  } else {
    fact('Worked on all five films, and is not on the grid.');
    fact('Not a director. Could be cast or crew.');
    if (!done) facts.push(el('li', {}, 'Name: ', shape(slot.data.enum)));
    if (done) fact(slot.data.hint);
  }
  if (it.hint && !(done && slot.kind === 'link')) fact(`Hint: ${slot.data.hint}`, 'hint');
  $('item-facts').replaceChildren(...facts);

  $('item-entry').hidden = done;
  if (!done) {
    const index = slot.kind === 'film' ? filmIndex : peopleIndex;
    const byId = new Map(index.map((r) => [r.id, r]));
    $('item-wrong').replaceChildren(...it.wrong.map((id) => el('li', { textContent: byId.get(id)?.label ?? '?' })));
    $('item-input').placeholder = slot.kind === 'film' ? 'Search film titles' : 'Search names';
    $('item-hint').textContent = it.hint ? 'Hint used' : `Hint · −${COST.hint}`;
    $('item-hint').disabled = it.hint;
    $('item-reveal').textContent = `Reveal · −${it.hint ? COST.reveal - COST.hint : COST.reveal}`;
    renderSuggestions();
  }
}

const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
function search(index, q) {
  const tokens = norm(q).split(' ').filter(Boolean);
  if (!tokens.length || norm(q).length < 2) return null;
  const hits = [], rest = [];
  for (const r of index) {
    if (!tokens.every((t) => r.words.some((w) => w.startsWith(t)))) continue;
    (r.norm.startsWith(tokens.join(' ')) ? hits : rest).push(r);
    if (hits.length >= 7) break;
  }
  return [...hits, ...rest].slice(0, 7);
}

function renderSuggestions() {
  const slot = slots().find((s) => s.key === openKey);
  const it = state.items[openKey];
  const found = search(slot.kind === 'film' ? filmIndex : peopleIndex, $('item-input').value);
  const box = $('item-suggest');
  if (!found) return box.replaceChildren();
  const fresh = found.filter((r) => !it.wrong.includes(r.id));
  if (!fresh.length) return box.replaceChildren(el('li', { className: 'none', textContent: 'No matches.' }));
  box.replaceChildren(...fresh.map((r) => {
    const b = el('button', { type: 'button' }, r.name, r.year ? el('small', { textContent: ` (${r.year})` }) : null);
    b.onclick = () => guess(r.id);
    return el('li', {}, b);
  }));
}

function guess(id) {
  const slot = slots().find((s) => s.key === openKey);
  const it = state.items[openKey];
  const right = slot.kind === 'link' ? slot.data.accept.includes(id) : slot.data.id === id;
  if (right) {
    it.status = 'solved';
  } else {
    // Naming something that belongs elsewhere on the grid is still wrong here.
    it.wrong.push(id);
    toast(`Not ${slot.label === 'The missing name' ? 'the missing name' : slot.label}. −${COST.wrong}`);
  }
  $('item-input').value = '';
  commit(); render(); renderItem();
  if (state.finished) finish();
}

function finish() {
  $('dlg-item').close();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('item-input').oninput = renderSuggestions;
$('item-input').onkeydown = (e) => { if (e.key === 'Enter') $('item-suggest').querySelector('button')?.click(); };
$('item-close').onclick = () => $('dlg-item').close();
$('item-hint').onclick = () => { state.items[openKey].hint = true; commit(); render(); renderItem(); };
$('item-reveal').onclick = () => {
  const b = $('item-reveal');
  if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Tap again to reveal'; setTimeout(() => { delete b.dataset.armed; if ($('dlg-item').open) renderItem(); }, 2500); return; }
  delete b.dataset.armed;
  state.items[openKey].status = 'revealed';
  commit(); render(); renderItem();
  if (state.finished) setTimeout(finish, 1200);
};

// ---------- results ----------
const emoji = (it) => (it.status === 'revealed' ? '⬛' : it.wrong.length || it.hint ? '🟨' : '🟩');
function shareGrid(s, p) {
  const all = slots(p);
  const line = (kind) => all.filter((x) => x.kind === kind).map((x) => emoji(s.items[x.key])).join('');
  return `🎬 ${line('film')}\n👤 ${line('person')}\n🔗 ${line('link')}`;
}

function renderResults() {
  $('results').hidden = !state.finished;
  if (!state.finished) return;
  const link = puzzle.link;
  $('res-portrait').hidden = !link.profile;
  if (link.profile) $('res-portrait').src = `${IMG}w185${link.profile}`;
  $('res-portrait').alt = link.name;
  $('res-name').textContent = link.name;
  $('res-job').textContent = link.job === 'actor' ? 'Acts in all five films' : `The ${link.job} on all five films`;
  $('res-stills').replaceChildren(...puzzle.films.map((f) => el('figure', {},
    f.backdrop ? el('img', { src: `${IMG}w780${f.backdrop}`, alt: '', loading: 'lazy' }) : null,
    el('figcaption', { textContent: `${f.title} (${f.year})` }))));
  $('res-score').textContent = score(state);
  $('res-grid').textContent = shareGrid(state, puzzle);
  const more = dayNumber() < puzzles.length;
  $('next-up').textContent = puzzle.id !== released() ? 'From the archive.'
    : more ? `Next puzzle in ${countdown()}.` : 'You\'re all caught up. More puzzles are on the way.';
}

function countdown() {
  const ms = startOfToday().getTime() + DAY - Date.now();
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

// ---------- stats ----------
function stats() {
  const n = released();
  const done = [];
  for (let id = 1; id <= n; id++) if (store.results[id]?.finished) done.push(store.results[id]);
  const scores = done.map(score);
  const streakFrom = (id) => { let k = 0; while (id >= 1 && store.results[id]?.finished && store.results[id].onDay) { k++; id--; } return k; };
  return {
    released: n,
    played: done.length,
    completion: Math.round((done.length / n) * 100),
    average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    best: scores.length ? Math.max(...scores) : 0,
    perfect: scores.filter((s) => s === 100).length,
    streak: streakFrom(n) || streakFrom(n - 1),
  };
}

function openStats() {
  const s = stats();
  const cell = (v, label) => el('div', {}, el('b', { textContent: v }), el('span', { textContent: label }));
  $('stat-grid').replaceChildren(
    cell(`${s.completion}%`, 'Completion'), cell(s.average, 'Average score'), cell(s.streak, 'Day streak'),
    cell(s.played, 'Puzzles finished'), cell(s.best, 'Best score'), cell(s.perfect, 'Perfect solves'));
  $('stat-meter').style.width = `${s.completion}%`;
  $('stat-sub').textContent = `${s.played} of ${s.released} puzzles finished. Stats are saved on this device.`;
  $('dlg-stats').showModal();
}

function openArchive() {
  const items = [];
  for (let id = released(); id >= 1; id--) {
    const r = store.results[id];
    const b = el('button', { type: 'button' },
      el('span', {}, `No. ${id}${id === released() ? ' · today' : ''}`,
        el('small', { textContent: r?.finished ? puzzles[id - 1].link.name : fmtDate(dateOf(id)) })),
      el('span', { className: `tag ${r?.finished ? '' : 'todo'}`, textContent: r?.finished ? `${score(r)}/100` : r ? 'Resume' : 'Play' }));
    b.onclick = () => { $('dlg-archive').close(); open(id); window.scrollTo({ top: 0 }); };
    items.push(el('li', {}, b));
  }
  $('archive-list').replaceChildren(...items);
  $('dlg-archive').showModal();
}

// ---------- share ----------
async function share() {
  const text = `Hidden Reel No. ${puzzle.id}\n${shareGrid(state, puzzle)}\n${score(state)}/100\n${location.origin}${location.pathname}`;
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
  t.textContent = msg;
  try { t.hidePopover(); t.showPopover(); } catch {}
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { try { t.hidePopover(); } catch {} }, 2200);
}

// ---------- boot ----------
$('btn-share').onclick = share;
$('btn-help').onclick = () => $('dlg-help').showModal();
$('btn-stats').onclick = openStats;
$('btn-archive').onclick = openArchive;
for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // tap backdrop to close
}

const getJson = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(url); return r.json(); };
const indexOf = (rows) => rows.map(([id, name, year]) => {
  const n = norm(name);
  return { id, name, year, norm: n, words: n.split(' '), label: year ? `${name} (${year})` : name };
});
try {
  const [p, f, n] = await Promise.all(['puzzles', 'films', 'people'].map((x) => getJson(`data/${x}.json`)));
  puzzles = p; filmIndex = indexOf(f); peopleIndex = indexOf(n);
  $('game').hidden = false;
  open(released());
  if (!store.seenHelp) { store.seenHelp = true; save(); $('dlg-help').showModal(); }
} catch {
  $('load-error').hidden = false;
}
