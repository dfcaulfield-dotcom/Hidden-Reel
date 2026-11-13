#!/usr/bin/env node
// Builds data/puzzles.json from puzzles/source.mjs, looking up a textless
// still for each film on TMDB. Needs a TMDB API Read Access Token:
//   TMDB_TOKEN=eyJ... node scripts/build-puzzles.mjs
// The token is only used here; it never ships with the game.
import { writeFile, readFile } from 'node:fs/promises';
import source from '../puzzles/source.mjs';

const TOKEN = process.env.TMDB_TOKEN || 'set-TMDB_TOKEN';
const OUT = new URL('../data/puzzles.json', import.meta.url);

async function tmdb(path) {
  const res = await fetch('https://api.themoviedb.org/3' + path, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  return res.json();
}

// Deterministic shuffle so rebuilding doesn't reorder options under players.
function shuffle(items, seed) {
  let s = seed >>> 0;
  const rand = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const hash = (str) => [...str].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

let previous = [];
try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
const known = new Map(previous.flatMap((p) => p.films.map((f) => [`${f.title}|${f.year}`, f])));

const puzzles = [];
for (const [i, p] of source.entries()) {
  const films = [];
  for (const [title, year, clue, decoys, why] of p.films) {
    let { tmdbId, image } = known.get(`${title}|${year}`) ?? {};
    if (!image) {
      const { results } = await tmdb(`/search/movie?query=${encodeURIComponent(title)}&include_adult=false`);
      const match = results
        .filter((r) => r.release_date)
        .sort((a, b) =>
          Math.abs(parseInt(a.release_date) - year) - Math.abs(parseInt(b.release_date) - year) ||
          b.popularity - a.popularity)[0];
      if (!match || Math.abs(parseInt(match.release_date) - year) > 1) throw new Error(`No TMDB match for ${title} (${year})`);
      const { backdrops } = await tmdb(`/movie/${match.id}/images?include_image_language=null`);
      const still = backdrops.filter((b) => b.iso_639_1 === null && b.aspect_ratio > 1.7)[0];
      if (!still) throw new Error(`No textless still for ${title}`);
      tmdbId = match.id;
      image = still.file_path;
      console.log(`${title} (${year}) -> ${match.title} [${match.release_date}] ${image}`);
    }
    const options = shuffle([title, ...decoys], hash(title));
    films.push({ title, year, clue, options, answer: options.indexOf(title), why, tmdbId, image });
  }
  const themes = shuffle(p.themes, hash(p.themes[0]));
  puzzles.push({ id: i + 1, themes, theme: themes.indexOf(p.themes[0]), films });
}

await writeFile(OUT, JSON.stringify(puzzles, null, 1) + '\n');
console.log(`Wrote ${puzzles.length} puzzles.`);
