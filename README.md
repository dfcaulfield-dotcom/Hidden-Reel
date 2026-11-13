# Hidden Reel

A daily movie puzzle. Six blurred film frames, each with a trivia clue. Name the
films to bring them into focus, then work out the hidden link all six share.

## Play locally

It is a static site with no build step. Serve the folder and open it:

    python3 -m http.server 8000

## Scoring

- Each film: 10 points on the first try, 5 on the second.
- The link: one guess, worth 40 points after one or two films, then 34, 28, 22
  and 16 as more films are revealed.
- Stats (completion %, average, streak) are stored in the browser's localStorage.

## Adding puzzles

1. Add a puzzle to `puzzles/source.mjs` (the format is described at the top).
2. Run `TMDB_TOKEN=<your API Read Access Token> node scripts/build-puzzles.mjs`
   to look up stills and regenerate `data/puzzles.json`.

Puzzle 1 is released on the date set by `EPOCH` in `app.js`, and one more
unlocks each day after that. The TMDB token is only used by the build script
and is never shipped with the game.

## Credits

Film stills from [TMDB](https://www.themoviedb.org/). This product uses the TMDB
API but is not endorsed or certified by TMDB.
