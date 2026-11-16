#!/usr/bin/env node
// Proposes puzzles from the pool: five films that share one hidden actor or
// director, plus the directors and actors that tie those films together.
// Only grids with exactly one solution within the pool are printed. Copy the
// JSON line of any you like into puzzles/source.json.
//   node scripts/suggest.mjs [seed]
import { loadPool, buildGrid, isUnique } from './lib.mjs';

const pool = await loadPool();
let seed = Number(process.argv[2] ?? 1);
const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const name = (id) => pool.people[id][0];
const TRIES = Number(process.env.TRIES ?? 400);

const links = new Map(); // person -> Set(film ids they directed or are billed in)
const add = (id, film) => { if (!links.has(id)) links.set(id, new Set()); links.get(id).add(film.id); };
for (const f of pool.list.slice(0, 2000)) {
  f.directors.forEach((id) => add(id, f));
  f.cast.slice(0, 12).forEach(([id]) => add(id, f));
}

const keys = new Map();
const keyOf = (f) => keys.get(f.id) ?? keys.set(f.id, new Set([...f.directors, ...f.cast.slice(0, 8).map((c) => c[0])])).get(f.id);

const out = [];
for (const [linkId, set] of links) {
  if (set.size < 5) continue;
  const mine = [...set].map((id) => pool.films.get(id));
  let best = null;
  for (let t = 0; t < TRIES; t++) {
    // Grow the set one film at a time, each sharing a director or lead actor
    // with a film already chosen, so the five are likely to form one web.
    const pick = [mine[Math.floor(rand() * mine.length)]];
    while (pick.length < 5) {
      const have = new Set(pick.flatMap((f) => [...keyOf(f)]));
      const next = mine.filter((f) => !pick.includes(f) && [...keyOf(f)].some((id) => id !== linkId && have.has(id)));
      if (!next.length) break;
      pick.push(next[Math.floor(rand() * next.length)]);
    }
    if (pick.length < 5) continue;
    const dirs = new Map(), cols = new Set();
    let ok = true;
    for (const f of pick) {
      dirs.set(f.directors[0], (dirs.get(f.directors[0]) ?? 0) + 1);
      if (f.collection) { if (cols.has(f.collection)) ok = false; cols.add(f.collection); }
    }
    // Variety: at least three directors, no franchise twice, a spread of years.
    if (!ok || Math.max(...dirs.values()) > 2 || dirs.size < 3 || new Set(pick.map((f) => f.year)).size < 4) continue;
    const g = buildGrid(pool, pick.map((f) => f.id), linkId);
    if (!g || !isUnique(pool, g)) continue;
    const score = g.films.reduce((n, f) => n + Math.log(f.votes), 0) + dirs.size * 2 + g.cells.length * 0.3;
    if (!best || score > best.score) best = { score, g };
  }
  if (best) out.push({ linkId, ...best, directed: best.g.films.filter((f) => f.dirSet.has(linkId)).length });
}
out.sort((a, b) => b.score - a.score);
for (const c of out) {
  console.log(`\n# ${name(c.linkId)}${c.directed ? `, directed ${c.directed}` : ''}`);
  console.log(JSON.stringify({ link: c.linkId, films: c.g.films.map((f) => f.id) }));
  console.log('  ' + c.g.films.map((f) => `${f.title} (${f.year})`).join(' | '));
  console.log('  ' + c.g.people.map((id, i) => `${name(id)}: ${c.g.cells.filter((x) => x[1] === i).map((x) => 'ABCDE'[x[0]] + '-' + x[2]).join(' ')}`).join(' | '));
}
console.error(`${out.length} candidates`);
