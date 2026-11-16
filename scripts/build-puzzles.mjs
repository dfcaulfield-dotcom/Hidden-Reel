#!/usr/bin/env node
// Turns puzzles/source.json into the files the game loads:
//   data/puzzles.json  the puzzles
//   data/films.json    film titles for the answer search
//   data/people.json   people names for the answer search
// Every puzzle is re-checked to have exactly one solution within the pool.
//   TMDB_TOKEN=... node scripts/build-puzzles.mjs
import { loadPool, buildGrid, isUnique, tmdb, pooled, readJson, writeJson, enumerate } from './lib.mjs';

const pool = await loadPool();
const source = await readJson('puzzles/source.json');
const prev = new Map((await readJson('.cache/persons.json', [])).map((p) => [p.id, p]));
const person = async (id) => {
  if (!prev.has(id)) {
    const p = await tmdb(`/person/${id}`);
    prev.set(id, { id, name: p.name, born: parseInt(p.birthday) || null, profile: p.profile_path });
  }
  return prev.get(id);
};

const words = (t) => t.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
function filmHint(f) {
  const base = `${f.genres.slice(0, 3).join(', ')} · ${f.runtime} min`;
  const leaks = f.tagline && words(f.title).some((w) => f.tagline.toLowerCase().includes(w));
  return f.tagline && !leaks ? `${base}. Tagline: “${f.tagline.trim()}”` : `${base}.`;
}
// The free clue on the starting film: genre, tagline and the two lead characters.
function starterClue(f) {
  const leaks = (text) => words(f.title).some((w) => text.toLowerCase().includes(w));
  const chars = f.cast.slice(0, 4).map((c) => (c[1] ?? '').replace(/\(.*?\)/g, '').split(' / ').map((x) => x.trim()).find((x) => x && !leaks(x))).filter(Boolean).slice(0, 2);
  return `${filmHint(f)}${chars.length ? ` Lead characters: ${chars.join(' and ')}.` : ''}`;
}
function personHint(id, grid) {
  const inGrid = new Set(grid.films.map((f) => f.id));
  for (const f of pool.list) {
    if (inGrid.has(f.id)) continue;
    if (f.dirSet.has(id)) return `Also directed ${f.title} (${f.year}).`;
    if (f.cast.slice(0, 5).some((c) => c[0] === id)) return `Also starred in ${f.title} (${f.year}).`;
  }
  return 'No other well-known credit in our film pool.';
}

const puzzles = [];
for (const [i, src] of source.entries()) {
  const g = buildGrid(pool, src.films, src.link);
  if (!g) throw new Error(`Puzzle ${i + 1}: films don't form a connected grid`);
  if (!isUnique(pool, g)) throw new Error(`Puzzle ${i + 1}: more than one solution`);

  // The missing name: an actor or director credited on all five films and absent from the grid.
  const directed = g.films.filter((f) => f.dirSet.has(src.link));
  if (!g.films.every((f) => f.dirSet.has(src.link) || f.anyCast.has(src.link))) throw new Error(`Puzzle ${i + 1}: link is not on all five films`);
  const everyone = (f) => new Set([...f.dirSet, ...f.anyCast]);
  const also = [...everyone(g.films[0])].filter((id) => id !== src.link && !g.people.includes(id) && g.films.every((f) => everyone(f).has(id)));
  const acts = g.films.filter((f) => f.anyCast.has(src.link)).length;
  const role = !directed.length ? 'Acts in all five films'
    : acts === 5 ? `Acts in all five films, and directed ${directed.map((f) => f.title).join(' and ')}`
    : `Directed ${directed.map((f) => f.title).join(' and ')}, and acts in the other${acts > 1 ? 's' : ''}`;

  // The starting film: the best known of the five, with a free clue.
  const start = g.films.indexOf(g.films.reduce((a, f) => (f.votes > a.votes ? f : a)));

  const link = await person(src.link);
  const people = await pooled(g.people, 4, person);
  puzzles.push({
    id: i + 1,
    start,
    films: g.films.map((f, fi) => ({ id: f.id, title: f.title, year: f.year, enum: f.enum, poster: f.poster, backdrop: f.backdrop, hint: fi === start ? starterClue(f) : filmHint(f) })),
    people: people.map((p) => ({ ...p, enum: enumerate(p.name), hint: personHint(p.id, g) })),
    cells: g.cells,
    link: { ...link, enum: enumerate(link.name), role, accept: [src.link, ...also], hint: `Born in ${link.born}. ${personHint(src.link, g)}` },
  });
  console.log(`${i + 1}. ${link.name} | start: ${g.films[start].title} | ${puzzles.at(-1).films[start].hint}${also.length ? ' also: ' + also.map((id) => pool.people[id][0]).join(', ') : ''}`);
}
await writeJson('.cache/persons.json', [...prev.values()]);
await writeJson('data/puzzles.json', puzzles, true);

// Answer search lists. People: anyone with two or more credits in the pool, plus every answer.
const credits = new Map();
for (const f of pool.list) for (const id of new Set([...f.directors, ...f.cast.slice(0, 12).map((c) => c[0]), ...f.crew.map((c) => c[0])])) credits.set(id, (credits.get(id) ?? 0) + 1);
const answers = new Set(puzzles.flatMap((p) => [...p.people.map((x) => x.id), ...p.link.accept]));
const names = [...credits].filter(([id, n]) => n >= 2 || answers.has(id))
  .sort((a, b) => b[1] - a[1]).map(([id]) => [id, pool.people[id][0]]);
await writeJson('data/people.json', names);
await writeJson('data/films.json', pool.list.map((f) => [f.id, f.title, f.year]));
console.log(`Wrote ${puzzles.length} puzzles, ${pool.list.length} films, ${names.length} people.`);
