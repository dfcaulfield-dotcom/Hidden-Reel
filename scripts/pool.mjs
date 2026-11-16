#!/usr/bin/env node
// Downloads the film pool (most-voted films on TMDB, with credits) into
// .cache/pool.json. Puzzles are generated from, and checked against, this pool.
//   TMDB_TOKEN=... node scripts/pool.mjs [pages=150]
import { tmdb, pooled, readJson, writeJson, LINK_JOBS } from './lib.mjs';

const pages = Number(process.argv[2] ?? 150);
const prev = await readJson('.cache/pool.json', { films: [], people: {} });
const have = new Map(prev.films.map((f) => [f.id, f]));
const people = prev.people;

const listed = (await pooled([...Array(pages).keys()], 8, (i) =>
  tmdb(`/discover/movie?sort_by=vote_count.desc&include_adult=false&page=${i + 1}`)))
  .flatMap((r) => r.results);
const ids = listed.map((m) => m.id);
const rating = new Map(listed.map((m) => [m.id, m.vote_average]));

let n = 0;
const films = await pooled([...new Set(ids)], 10, async (id) => {
  if (have.has(id)) return have.get(id);
  const m = await tmdb(`/movie/${id}?append_to_response=credits`);
  if (++n % 250 === 0) console.log(`fetched ${n}`);
  const note = (p) => { people[p.id] = [p.name, p.profile_path ?? null, Math.round(p.popularity * 10) / 10]; return p.id; };
  return {
    id: m.id, title: m.title, year: parseInt(m.release_date) || null, votes: m.vote_count,
    tagline: m.tagline || null, genres: m.genres.map((g) => g.name), runtime: m.runtime,
    poster: m.poster_path, backdrop: m.backdrop_path, collection: m.belongs_to_collection?.id ?? null,
    directors: m.credits.crew.filter((c) => c.job === 'Director').map(note),
    cast: m.credits.cast.sort((a, b) => a.order - b.order).slice(0, 60)
      .map((c, i) => (i < 12 ? [note(c), c.character] : [c.id])),
    crew: m.credits.crew.filter((c) => LINK_JOBS[c.job]).map((c) => [note(c), c.job]),
  };
});

for (const f of films) f.rating = rating.get(f.id) ?? f.rating ?? null;
const out = films.filter((f) => f.year && f.directors.length && f.cast.length >= 4).sort((a, b) => b.votes - a.votes);
await writeJson('.cache/pool.json', { films: out, people });
console.log(`Pool: ${out.length} films, ${Object.keys(people).length} people.`);
