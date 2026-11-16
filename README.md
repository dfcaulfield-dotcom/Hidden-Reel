# Hidden Reel

A daily film deduction puzzle. Each puzzle shows five films and the directors
and actors who connect them, with every name removed. Lines between them are
real credits. One more actor or director is credited on all five films but
isn't shown: that's the missing name. Work out all of it.

You get each film's year and the shape of its title, and each person's birth
year and the shape of their name. One film is marked as the start and comes
with a free clue. Each answer unlocks whatever it is connected to, and the
missing name unlocks once all five films are found. Every puzzle has exactly
one solution.

## Play locally

It is a static site with no build step. Serve the folder and open it:

    python3 -m http.server 8000

## Scoring

You start with 100 points. A wrong guess costs 2, a hint costs 5 and revealing
an answer costs 10. Solving everything unaided keeps all 100. There is no timer.
Stats (completion %, average, streak) are stored in the browser's localStorage.

## Making puzzles

The scripts need a TMDB API Read Access Token in `TMDB_TOKEN`. It is only used
here and never ships with the game.

1. `node scripts/pool.mjs` downloads the film pool (the roughly 3,000 most-voted
   films on TMDB, with credits) into `.cache/`.
2. `node scripts/suggest.mjs [seed]` prints candidate puzzles that have exactly
   one solution within the pool.
3. Copy the JSON line of the ones you like into `puzzles/source.json`.
4. `node scripts/build-puzzles.mjs` re-checks every puzzle and writes the files
   in `data/` that the game loads.

Puzzle No. 1 is released on the date set by `EPOCH` in `app.js`, and one more
unlocks each day after that.

"Exactly one solution" means within the film pool, where "acted in" means one
of a film's ten top-billed actors.

## Credits

Film data and images from [TMDB](https://www.themoviedb.org/). This product uses
the TMDB API but is not endorsed or certified by TMDB.
