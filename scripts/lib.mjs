// Shared helpers for the puzzle tooling. Needs a TMDB API Read Access Token
// in TMDB_TOKEN. Nothing here ships with the game.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

export const ROOT = new URL('../', import.meta.url);
const TOKEN = process.env.TMDB_TOKEN || 'set-TMDB_TOKEN';

export async function tmdb(path, tries = 4) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch('https://api.themoviedb.org/3' + path, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
      });
      if (res.ok) return await res.json();
      if (res.status !== 429 && res.status < 500) throw Object.assign(new Error(`TMDB ${res.status} for ${path}`), { fatal: true });
      throw new Error(`TMDB ${res.status}`);
    } catch (e) {
      if (e.fatal || i >= tries) throw e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
}

export async function pooled(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

export const readJson = async (rel, fallback) => {
  try { return JSON.parse(await readFile(new URL(rel, ROOT), 'utf8')); } catch { return fallback; }
};
export const writeJson = async (rel, data, pretty = false) => {
  const url = new URL(rel, ROOT);
  await mkdir(new URL('./', url), { recursive: true });
  await writeFile(url, JSON.stringify(data, null, pretty ? 1 : 0) + '\n');
};

// Crew jobs that can be the hidden link, and how the game words them.
export const LINK_JOBS = {
  'Director of Photography': 'cinematographer',
  'Original Music Composer': 'composer',
  Editor: 'editor',
  'Production Design': 'production designer',
  'Costume Design': 'costume designer',
};
export const BILLED = 10; // "cast" in the universe means top-10 billed

// Crossword-style enumeration: "No Country for Old Men" -> "2,7,3,3,3".
export const enumerate = (text) => text.normalize('NFD').replace(/[\u0300-\u036f'’.]/g, '')
  .split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((w) => w.length).join(',');

// Loads the cached film pool and builds lookup indexes.
export async function loadPool() {
  const pool = await readJson('.cache/pool.json');
  if (!pool) throw new Error('No film pool. Run: node scripts/pool.mjs');
  const films = new Map(pool.films.map((f) => [f.id, f]));
  const byYear = new Map();
  for (const f of pool.films) {
    f.dirSet = new Set(f.directors);
    f.castSet = new Set(f.cast.slice(0, BILLED).map((c) => c[0]));
    f.anyCast = new Set(f.cast.map((c) => c[0]));
    f.enum = enumerate(f.title);
    const key = `${f.year}|${f.enum}`;
    if (!byYear.has(key)) byYear.set(key, []);
    byYear.get(key).push(f);
  }
  const penum = {};
  for (const id in pool.people) penum[id] = enumerate(pool.people[id][0]);
  return { films, byYear, people: pool.people, penum, list: pool.films };
}

// Counts the ways to fill a grid.
// spec: { years, enums (film title enumerations), penums (people, optional), cells: [[filmIdx, personIdx, 'D'|'C'|'DC'], ...], nPeople }
// Returns up to `cap` solutions as { films: [ids], people: [[candidate ids]...] }.
export function solve(pool, spec, cap = 3) {
  const { years, enums, penums, cells, nPeople } = spec;
  const byFilm = years.map(() => []);
  for (const [f, p, role] of cells) byFilm[f].push([p, role]);
  // Assign the most connected films first so pruning bites early.
  const order = years.map((_, i) => i).sort((a, b) => byFilm[b].length - byFilm[a].length);
  const done = [];
  const picked = new Array(years.length);
  const used = new Set();
  const cands = new Array(nPeople).fill(null); // null = unconstrained so far

  const roleSet = (film, role) => {
    if (role === 'D') return film.dirSet;
    if (role === 'C') return film.castSet;
    return new Set([...film.dirSet].filter((x) => film.castSet.has(x)));
  };

  (function step(k) {
    if (done.length >= cap) return;
    if (k === order.length) {
      // Each column needs a distinct person; with tiny candidate sets a simple check is enough.
      const sets = cands.map((s) => [...s]);
      const seen = new Set();
      const ok = (function assign(i) {
        if (i === sets.length) return true;
        for (const id of sets[i]) if (!seen.has(id)) { seen.add(id); if (assign(i + 1)) return true; seen.delete(id); }
        return false;
      })(0);
      if (ok) done.push({ films: [...picked], people: sets });
      return;
    }
    const fi = order[k];
    for (const film of pool.byYear.get(`${years[fi]}|${enums[fi]}`) ?? []) {
      if (used.has(film.id)) continue;
      const saved = [];
      let ok = true;
      for (const [p, role] of byFilm[fi]) {
        const rs = roleSet(film, role);
        const next = new Set();
        for (const id of cands[p] ?? rs) if (rs.has(id) && (!penums || pool.penum[id] === penums[p])) next.add(id);
        saved.push([p, cands[p]]);
        cands[p] = next;
        if (!next.size) { ok = false; break; }
      }
      if (ok) { used.add(film.id); picked[fi] = film.id; step(k + 1); used.delete(film.id); }
      for (const [p, prev] of saved.reverse()) cands[p] = prev;
      if (done.length >= cap) return;
    }
  })(0);
  return done;
}

// Builds the grid for five films: the directors and actors credited on at
// least two of them. Returns null if the films don't form one connected web.
export function buildGrid(pool, filmIds, linkId, minPeople = 4) {
  const fs = filmIds.map((id) => pool.films.get(id)).sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
  const count = new Map();
  for (const f of fs) for (const id of new Set([...f.dirSet, ...f.cast.slice(0, 8).map((c) => c[0])])) count.set(id, (count.get(id) ?? 0) + 1);
  let people = [...count].filter(([id, n]) => n >= 2 && id !== linkId).map(([id]) => id);
  if (people.length < minPeople) return null;
  // Keep at most six: most connected, then most popular. Then order them by
  // where their films sit, so the connecting lines cross as little as possible.
  people.sort((a, b) => count.get(b) - count.get(a) || pool.people[b][2] - pool.people[a][2]);
  const centre = (id) => { const at = fs.flatMap((f, i) => (f.dirSet.has(id) || f.anyCast.has(id) ? [i] : [])); return at.reduce((x, y) => x + y, 0) / at.length; };
  people = people.slice(0, 6).sort((a, b) => centre(a) - centre(b) || a - b);
  const cells = [];
  for (const [fi, f] of fs.entries()) for (const [pi, id] of people.entries()) {
    const d = f.dirSet.has(id), c = f.anyCast.has(id);
    if (c && !f.castSet.has(id)) return null; // a bit part would make a misleading blank or cell
    if (d || c) cells.push([fi, pi, (d ? 'D' : '') + (c ? 'C' : '')]);
  }
  const seen = new Set([0]); let grew = true;
  while (grew) { grew = false; for (const [f, p] of cells) for (const [f2, p2] of cells) if (p === p2 && seen.has(f) !== seen.has(f2)) { seen.add(f); seen.add(f2); grew = true; } }
  if (seen.size < fs.length) return null;
  return { films: fs, people, cells };
}

export const gridSpec = (pool, g) => ({
  years: g.films.map((f) => f.year), enums: g.films.map((f) => f.enum),
  penums: g.people.map((id) => pool.penum[id]), cells: g.cells, nPeople: g.people.length,
});
export const isUnique = (pool, g) => {
  const sols = solve(pool, gridSpec(pool, g), 2);
  return sols.length === 1 && sols[0].people.every((s) => s.length === 1);
};
