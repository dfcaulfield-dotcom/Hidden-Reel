// Match Cut — a daily film deduction puzzle. No build step, no backend.
// Progress and stats are kept in this browser's localStorage.

const EPOCH = new Date(2026, 10, 14); // local midnight of puzzle No. 1
const DAY = 86400000;
const IMG = 'https://image.tmdb.org/t/p/';
const STORE_KEY = 'hiddenreel:v4';
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
  selected = null;
  if (wide.matches) pickDefault(); else { $('panel').classList.remove('is-open'); $('scrim').hidden = true; }
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
const image = (slot, size) => {
  const path = slot.kind === 'film' ? slot.data.poster : slot.data.profile;
  return path ? `${IMG}${size}${path}` : null;
};
const answerText = (slot) => (slot.kind === 'film' ? `${slot.data.title} (${slot.data.year})` : slot.data.name);
const cellsOf = (slot) => puzzle.cells.filter((c) => (slot.kind === 'film' ? c[0] : c[1]) === slot.i);
const wide = matchMedia('(min-width: 900px)');
let selected = null;

// ---------- main render ----------
function render() {
  const all = slots();
  const it = (s) => state.items[s.key];
  const stateClass = (s) => `${isDone(it(s)) ? it(s).status : 'open'} ${s.key === selected ? 'selected' : ''}`;

  const card = (s) => {
    const done = isDone(it(s));
    const src = done && image(s, s.kind === 'film' ? 'w342' : 'w185');
    const b = el('button', { type: 'button', className: `card ${stateClass(s)}` });
    b.dataset.key = s.key;
    if (s.kind === 'film') {
      b.append(el('span', { className: 'poster' },
        filmChip(s.i),
        src ? el('img', { src, alt: '' }) : null,
        !src ? el('span', { className: 'year', textContent: s.data.year }) : null,
        !src ? (done ? el('span', { className: 'cap name', textContent: s.data.title }) : shape(s.data.enum)) : null));
      b.setAttribute('aria-label', done ? `Film ${LETTERS[s.i]}: ${s.data.title}, ${s.data.year}` : `Film ${LETTERS[s.i]}, ${s.data.year}, unsolved`);
    } else {
      b.append(el('span', { className: 'face' }, personChip(s.i), src ? el('img', { src, alt: '' }) : '?'),
        done ? el('span', { className: 'cap name', textContent: s.data.name }) : shape(s.data.enum),
        el('span', { className: 'cap', textContent: `b. ${s.data.born ?? '?'}` }));
      b.setAttribute('aria-label', done ? `Person ${s.i + 1}: ${s.data.name}` : `Person ${s.i + 1}, born ${s.data.born}, unsolved`);
    }
    b.onclick = () => select(s.key);
    return b;
  };
  $('films').replaceChildren(...all.filter((s) => s.kind === 'film').map(card));
  $('people').replaceChildren(...all.filter((s) => s.kind === 'person').map(card));

  const link = all.at(-1);
  const linkDone = isDone(it(link));
  const linkSrc = linkDone && image(link, 'w185');
  const lb = el('button', { type: 'button', className: `link-card ${stateClass(link)}` },
    el('span', { className: 'face' }, linkSrc ? el('img', { src: linkSrc, alt: '' }) : '?'),
    el('span', { className: 'body' },
      el('strong', { textContent: linkDone ? link.data.name : 'The missing name' }),
      linkDone ? null : shape(link.data.enum),
      el('span', { className: 'sub', textContent: linkDone ? link.data.role : 'An actor or director credited on all five films, but not shown above.' })));
  lb.onclick = () => select('link');
  $('link-slot').replaceChildren(lb);

  const found = all.filter((s) => isDone(it(s))).length;
  $('status').replaceChildren(el('b', { textContent: `${score(state)} points` }), ` · ${found} of ${all.length} found`);
  $('status').hidden = state.finished;
  renderResults();
  renderPanel();
  requestAnimationFrame(drawWires);
}

// Draws a line for every credit, between the film card and the person's portrait.
function drawWires() {
  const svg = $('wires'), board = $('board');
  if (!puzzle || !board.offsetWidth) return;
  const box = board.getBoundingClientRect();
  const rect = (sel) => { const r = board.querySelector(sel).getBoundingClientRect(); return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height }; };
  const vertical = wide.matches; // films above people on wide screens, side by side on phones
  const NS = 'http://www.w3.org/2000/svg';
  // Fan the lines out along each card's edge, ordered by where they are heading.
  const slotOf = (list, key, other) => {
    const mine = list.filter((c) => c[key] === list.current[key]).sort((x, y) => x[other] - y[other]);
    return mine.indexOf(list.current) - (mine.length - 1) / 2;
  };
  const paths = [];
  for (const c of puzzle.cells) {
    const f = rect(`[data-key="f${c[0]}"] .poster`), p = rect(`[data-key="p${c[1]}"] .face`);
    const cells = Object.assign([...puzzle.cells], { current: c });
    const fo = slotOf(cells, 0, 1) * 9, po = slotOf(cells, 1, 0) * 9;
    const roles = [c[2].includes('D') && 'd', c[2].includes('C') && 'a'].filter(Boolean);
    roles.forEach((role, k) => {
      const shift = (k - (roles.length - 1) / 2) * 5;
      let d;
      if (vertical) {
        const x1 = f.x + f.w / 2 + fo + shift, y1 = f.y + f.h, x2 = p.x + p.w / 2 + po + shift, y2 = p.y;
        const m = (y1 + y2) / 2;
        d = `M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}`;
      } else {
        const x1 = f.x + f.w, y1 = f.y + f.h / 2 + fo + shift, x2 = p.x, y2 = p.y + p.h / 2 + po + shift;
        const m = (x1 + x2) / 2;
        d = `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;
      }
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      const on = selected === `f${c[0]}` || selected === `p${c[1]}`;
      path.setAttribute('class', `${role} ${on ? 'on' : ''}`);
      paths.push(path);
    });
  }
  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  svg.setAttribute('class', selected && selected !== 'link' ? 'focus' : '');
  svg.replaceChildren(...paths);
}
new ResizeObserver(() => drawWires()).observe($('board'));

// "Directed A, B · Acted in C" for a person; "Directed by 1 · With 2, 3" for a film.
function creditLine(slot) {
  const cells = cellsOf(slot);
  const other = (c) => {
    const i = slot.kind === 'film' ? c[1] : c[0];
    const key = slot.kind === 'film' ? `p${i}` : `f${i}`;
    const label = slot.kind === 'film' ? `person ${i + 1}` : `film ${LETTERS[i]}`;
    const data = slot.kind === 'film' ? puzzle.people[i] : puzzle.films[i];
    return isDone(state.items[key]) ? (data.name ?? data.title) : label;
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
  return parts;
}

// ---------- solve panel ----------
function select(key) {
  selected = key;
  $('item-input').value = '';
  $('panel').classList.add('is-open');
  $('scrim').hidden = false;
  render();
  $('panel').scrollTop = 0;
}
function closePanel() {
  $('panel').classList.remove('is-open');
  $('scrim').hidden = true;
  if (!wide.matches) { selected = null; render(); }
}

function renderPanel() {
  const slot = slots().find((s) => s.key === selected);
  if (!slot) return;
  const it = state.items[selected];
  const done = isDone(it);
  $('item-title').textContent = slot.label;

  $('item-solved').hidden = !done;
  if (done) {
    const src = image(slot, slot.kind === 'film' ? 'w342' : 'w185');
    $('item-image').hidden = !src;
    $('item-image').className = slot.kind === 'film' ? '' : 'round';
    if (src) $('item-image').src = src;
    $('item-answer').replaceChildren(answerText(slot),
      el('small', { textContent: it.status === 'revealed' ? 'Revealed' : it.wrong.length || it.hint ? 'Solved with help' : 'Solved' }));
  }

  const facts = [];
  const fact = (text, cls = '') => facts.push(el('li', { className: cls }, text));
  if (slot.kind === 'film') {
    fact(`Released in ${slot.data.year}`);
    if (!done) facts.push(el('li', {}, 'Title: ', shape(slot.data.enum)));
    creditLine(slot).forEach((t) => fact(t));
  } else if (slot.kind === 'person') {
    fact(`Born in ${slot.data.born ?? 'an unknown year'}`);
    if (!done) facts.push(el('li', {}, 'Name: ', shape(slot.data.enum)));
    creditLine(slot).forEach((t) => fact(t));
  } else {
    fact(done ? slot.data.role : 'An actor or director credited on all five films.');
    fact('Not one of the numbered people.');
    if (!done) facts.push(el('li', {}, 'Name: ', shape(slot.data.enum)));
  }
  if (it.hint) fact(`Hint: ${slot.data.hint}`, 'hint');
  $('item-facts').replaceChildren(...facts);

  $('item-entry').hidden = done;
  if (!done) {
    const index = slot.kind === 'film' ? filmIndex : peopleIndex;
    const byId = new Map(index.map((r) => [r.id, r]));
    $('item-wrong').replaceChildren(...it.wrong.map((id) => el('li', { textContent: byId.get(id)?.label ?? '?' })));
    $('item-input').placeholder = slot.kind === 'film' ? 'Search film titles' : 'Search names';
    $('item-hint').textContent = it.hint ? 'Hint used' : `Hint · −${COST.hint}`;
    $('item-hint').disabled = it.hint;
    const armed = $('item-reveal').dataset.armed === selected;
    $('item-reveal').textContent = armed ? 'Tap again to reveal' : `Reveal · −${it.hint ? COST.reveal - COST.hint : COST.reveal}`;
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
  const slot = slots().find((s) => s.key === selected);
  const it = state.items[selected];
  const found = search(slot.kind === 'film' ? filmIndex : peopleIndex, $('item-input').value);
  const box = $('item-suggest');
  if (!found) return box.replaceChildren();
  const fresh = found.filter((r) => !it.wrong.includes(r.id));
  if (!fresh.length) return box.replaceChildren(el('li', { className: 'none', textContent: 'No matches.' }));
  box.replaceChildren(...fresh.map((r) => {
    const b = el('button', { type: 'button', textContent: r.name });
    b.onclick = () => guess(r);
    return el('li', {}, b);
  }));
}

function guess(pick) {
  const slot = slots().find((s) => s.key === selected);
  const it = state.items[selected];
  if (isDone(it)) return;
  // Films are guessed by title alone, so a remake and its original count as the same guess.
  const right = (slot.kind === 'link' ? slot.data.accept : [slot.data.id]).some((id) => pick.ids.includes(id));
  if (right) it.status = 'solved';
  else { it.wrong.push(pick.id); toast(`Not ${slot.kind === 'link' ? 'the missing name' : slot.label}. −${COST.wrong}`); }
  $('item-input').value = '';
  const was = state.finished;
  commit(); render();
  if (state.finished && !was) finish();
}

function finish() {
  if (!wide.matches) setTimeout(() => { closePanel(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 1400);
}

$('item-input').oninput = renderSuggestions;
$('item-input').onkeydown = (e) => { if (e.key === 'Enter') $('item-suggest').querySelector('button')?.click(); };
$('item-close').onclick = closePanel;
$('scrim').onclick = closePanel;
$('item-hint').onclick = () => { state.items[selected].hint = true; commit(); render(); };
$('item-reveal').onclick = () => {
  const b = $('item-reveal');
  if (b.dataset.armed !== selected) {
    b.dataset.armed = selected; renderPanel();
    setTimeout(() => { if (b.dataset.armed) { delete b.dataset.armed; renderPanel(); } }, 2500);
    return;
  }
  delete b.dataset.armed;
  state.items[selected].status = 'revealed';
  const was = state.finished;
  commit(); render();
  if (state.finished && !was) finish();
};
wide.addEventListener('change', () => { if (wide.matches && !selected) pickDefault(); render(); });

// On wide screens the panel is always showing, so point it at the next thing to solve.
function pickDefault() {
  const next = slots().find((s) => !isDone(state.items[s.key])) ?? slots().at(-1);
  selected = next.key;
}

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
  $('res-job').textContent = link.role;
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
  const text = `Match Cut No. ${puzzle.id}\n${shareGrid(state, puzzle)}\n${score(state)}/100\n${location.origin}${location.pathname}`;
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
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wide.matches) closePanel(); });
for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // tap backdrop to close
}

const getJson = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(url); return r.json(); };
// Search entries, one per distinct title or name (years are deliberately left out).
const indexOf = (rows) => {
  const seen = new Map();
  for (const [id, name] of rows) {
    const n = norm(name);
    if (seen.has(n)) seen.get(n).ids.push(id);
    else seen.set(n, { id, ids: [id], name, norm: n, words: n.split(' '), label: name });
  }
  return [...seen.values()];
};
try {
  const [p, f, n] = await Promise.all(['puzzles', 'films', 'people'].map((x) => getJson(`data/${x}.json`)));
  puzzles = p; filmIndex = indexOf(f); peopleIndex = indexOf(n);
  $('game').hidden = false;
  open(released());
  if (!store.seenHelp) { store.seenHelp = true; save(); $('dlg-help').showModal(); }
} catch {
  $('load-error').hidden = false;
}
