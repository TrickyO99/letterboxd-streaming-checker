# Watchlist Gap Finder

Enter a public Letterboxd username and see which films on their watchlist aren't available on
the streaming services you pick.

## How it works

- **Letterboxd data**: Letterboxd has no public watchlist API, so [`src/lib/letterboxd.ts`](src/lib/letterboxd.ts)
  scrapes the public watchlist pages (`https://letterboxd.com/<user>/watchlist/page/N/`), reading
  the title/year/slug straight out of each poster's `data-item-*` attributes. Only works for
  public profiles.
- **Streaming availability**: [`src/lib/streaming.ts`](src/lib/streaming.ts) calls the
  [Streaming Availability API](https://rapidapi.com/movieofthenight/api/streaming-availability)
  on RapidAPI, searching by title and matching by release year.
- The two are combined in [`src/app/api/lookup/route.ts`](src/app/api/lookup/route.ts).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Get a RapidAPI key for the **Streaming Availability API** (movieofthenight) — it has a free
   tier: https://rapidapi.com/movieofthenight/api/streaming-availability
3. Copy `.env.local.example` to `.env.local` and paste your key in:
   ```bash
   cp .env.local.example .env.local
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000, enter a public Letterboxd username, pick a region and your
   streaming services, and submit.

## Known limitations

- **Free-tier API quota**: the Streaming Availability API's free plan allows a limited number of
  requests per month, and this app makes one request per watchlist film. By default only the
  first 150 films in a watchlist are checked per lookup — change this with `RAPIDAPI_MAX_LOOKUPS`
  in `.env.local`. Films beyond the cap, or where the lookup fails, are excluded from the "not
  streaming" list (they show up as "couldn't verify" instead) rather than being reported as
  unavailable.
- **Private watchlists**: private profiles can't be scraped and return an error. Detection of
  "private" vs. "empty" watchlist is heuristic and may need adjusting if Letterboxd changes their
  markup.
- **Title matching**: films are matched between Letterboxd and the streaming API by normalized
  title + release year (±1 year tolerance). Very obscure titles, re-releases, or films with
  significantly different regional titles may mismatch or fail to match.
- **Service IDs**: the checkbox list in [`src/lib/services.ts`](src/lib/services.ts) covers the
  major global services. If you need one that isn't listed, check the service `id` values
  returned in the Streaming Availability API docs and add it there.
- **Long watchlists / serverless timeouts**: lookups run with limited concurrency to be polite to
  both Letterboxd and the RapidAPI free tier. Very large watchlists may take a while or hit
  serverless function time limits if deployed as-is (the API route sets `maxDuration = 60`).
