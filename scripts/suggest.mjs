#!/usr/bin/env node
// Proposes puzzles from the pool: five films that share one hidden person,
// plus the directors and actors that tie those films together. Only grids
// with exactly one solution within the pool are printed. Copy the JSON line
// of any you like into puzzles/source.json.
//   node scripts/suggest.mjs [seed]
import { loadPool, buildGrid, isUnique, LINK_JOBS } from './lib.mjs';

const pool = await loadPool();
let seed = Number(process.argv[2] ?? 1);
const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const name = (id) => pool.people[id][0];
const TRIES = Number(process.env.TRIES ?? 600);

const links = new Map(); // person -> Map(film id -> job)
const add = (id, film, job) => { if (!links.has(id)) links.set(id, new Map()); if (!links.get(id).has(film.id)) links.get(id).set(film.id, job); };
for (const f of pool.list.slice(0, 2000)) {
  for (const [id, job] of f.crew) add(id, f, LINK_JOBS[job]);
  f.cast.slice(2, 12).forEach(([id]) => add(id, f, 'actor'));
}

const out = [];
for (const [linkId, map] of links) {
  if (map.size < 5) continue;
  const mine = [...map.keys()].map((id) => pool.films.get(id));
  let best = null;
  for (let t = 0; t < TRIES; t++) {
    const pick = [...mine].sort(() => rand() - 0.5).slice(0, 5);
    const dirs = new Map(), cols = new Set();
    let ok = true;
    for (const f of pick) {
      dirs.set(f.directors[0], (dirs.get(f.directors[0]) ?? 0) + 1);
      if (f.collection) { if (cols.has(f.collection)) ok = false; cols.add(f.collection); }
      if (f.dirSet.has(linkId)) ok = false;
    }
    // Variety: at least three directors, no franchise twice, a spread of years.
    if (!ok || Math.max(...dirs.values()) > 2 || dirs.size < 3 || new Set(pick.map((f) => f.year)).size < 4) continue;
    const g = buildGrid(pool, pick.map((f) => f.id), linkId);
    if (!g || !isUnique(pool, g)) continue;
    const score = g.films.reduce((n, f) => n + Math.log(f.votes), 0) + dirs.size * 2 + g.cells.length * 0.3;
    if (!best || score > best.score) best = { score, g };
  }
  if (best) out.push({ linkId, job: [...new Set(best.g.films.map((f) => map.get(f.id)))].join('/'), ...best });
}
out.sort((a, b) => b.score - a.score);
for (const c of out) {
  console.log(`\n# ${name(c.linkId)}, ${c.job}`);
  console.log(JSON.stringify({ link: c.linkId, films: c.g.films.map((f) => f.id) }));
  console.log('  ' + c.g.films.map((f) => `${f.title} (${f.year})`).join(' | '));
  console.log('  ' + c.g.people.map((id, i) => `${name(id)}: ${c.g.cells.filter((x) => x[1] === i).map((x) => 'ABCDE'[x[0]] + '-' + x[2]).join(' ')}`).join(' | '));
}
console.error(`${out.length} candidates`);
