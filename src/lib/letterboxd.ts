import * as cheerio from "cheerio";

export type WatchlistFilm = {
  title: string;
  year: number | null;
  slug: string;
  url: string | null;
};

export class LetterboxdError extends Error {
  code: "USER_NOT_FOUND" | "PRIVATE_PROFILE" | "FETCH_FAILED" | "BLOCKED";
  constructor(
    code: "USER_NOT_FOUND" | "PRIVATE_PROFILE" | "FETCH_FAILED" | "BLOCKED",
    message: string
  ) {
    super(message);
    this.code = code;
  }
}

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const MAX_PAGES = 60; // ~1680 films safety cap
const MAX_FETCH_RETRIES = 2;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: REQUEST_HEADERS });
    } catch {
      throw new LetterboxdError("FETCH_FAILED", "Could not reach Letterboxd.");
    }
    // 403/429 from Cloudflare's bot protection are often transient - back off and retry.
    if ((res.status === 403 || res.status === 429) && attempt < MAX_FETCH_RETRIES) {
      lastRes = res;
      await delay(800 * (attempt + 1));
      continue;
    }
    return res;
  }
  return lastRes as Response;
}

function parseTitleYear(itemName: string): { title: string; year: number | null } {
  const match = itemName.match(/^(.*)\s\((\d{4})\)$/);
  if (match) {
    return { title: match[1], year: parseInt(match[2], 10) };
  }
  return { title: itemName, year: null };
}

export async function fetchWatchlist(username: string): Promise<WatchlistFilm[]> {
  const films: WatchlistFilm[] = [];
  const seenSlugs = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://letterboxd.com/${encodeURIComponent(username)}/watchlist/page/${page}/`;
    const res = await fetchWithRetry(url);

    if (page === 1 && res.status === 404) {
      throw new LetterboxdError("USER_NOT_FOUND", `No Letterboxd account found for "${username}".`);
    }
    if (res.status === 403 || res.status === 429) {
      throw new LetterboxdError(
        "BLOCKED",
        `Letterboxd returned an error (${res.status}) while loading "${username}". It may be temporarily blocking requests - try again in a moment.`
      );
    }
    if (!res.ok) {
      throw new LetterboxdError("FETCH_FAILED", `Letterboxd returned status ${res.status}.`);
    }

    const html = await res.text();

    if (page === 1 && /sign in to letterboxd|this profile is private/i.test(html)) {
      throw new LetterboxdError(
        "PRIVATE_PROFILE",
        `This account's watchlist is private and can't be read.`
      );
    }

    const $ = cheerio.load(html);
    const items = $(".react-component[data-item-name]");
    if (items.length === 0) break;

    items.each((_, el) => {
      const name = $(el).attr("data-item-name") || "";
      const slug = $(el).attr("data-item-slug") || "";
      const link = $(el).attr("data-item-link") || "";
      if (!slug || seenSlugs.has(slug)) return;
      seenSlugs.add(slug);
      const { title, year } = parseTitleYear(name);
      films.push({
        title,
        year,
        slug,
        url: link ? `https://letterboxd.com${link}` : null,
      });
    });

    if (page < MAX_PAGES) await delay(250);
  }

  return films;
}
