const RAPIDAPI_HOST = "streaming-availability.p.rapidapi.com";

type StreamingOption = {
  service?: { id?: string };
  type?: "subscription" | "free" | "addon" | "buy" | "rent";
};

// "buy"/"rent" mean the film is purchasable there, not included with the subscription -
// that's not what "is this on my streaming service" means, so those don't count as available.
const INCLUDED_OPTION_TYPES = new Set(["subscription", "free", "addon"]);

type ShowResult = {
  title?: string;
  releaseYear?: number;
  rating?: number;
  genres?: { id?: string; name?: string }[];
  imageSet?: { verticalPoster?: { w240?: string; w360?: string } };
  streamingOptions?: Record<string, StreamingOption[]>;
};

export type ShowInfo = {
  serviceIds: string[];
  posterUrl: string | null;
  genres: string[];
  rating: number | null;
};

// Cache is per server-instance / dev-session only; it resets on cold start.
const cache = new Map<string, ShowInfo | null>();

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function searchShowByTitle(
  title: string,
  country: string,
  apiKey: string
): Promise<ShowResult[]> {
  const url = `https://${RAPIDAPI_HOST}/shows/search/title?title=${encodeURIComponent(
    title
  )}&country=${encodeURIComponent(country)}&show_type=movie&series_granularity=show`;

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    throw new Error(`Streaming Availability API returned status ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function pickBestMatch(
  results: ShowResult[],
  title: string,
  year: number | null
): ShowResult | null {
  const target = normalizeTitle(title);
  const candidates = results.filter((r) => normalizeTitle(r.title || "") === target);
  const pool = candidates.length > 0 ? candidates : results;

  if (year !== null) {
    const exact = pool.find((r) => r.releaseYear === year);
    if (exact) return exact;
    const near = pool.find((r) => r.releaseYear !== undefined && Math.abs(r.releaseYear - year) <= 1);
    if (near) return near;
  }

  return pool[0] || null;
}

function extractServiceIds(show: ShowResult | null, country: string): string[] {
  if (!show?.streamingOptions) return [];
  const options = show.streamingOptions[country] || [];
  const ids = new Set<string>();
  for (const opt of options) {
    if (opt.service?.id && opt.type && INCLUDED_OPTION_TYPES.has(opt.type)) {
      ids.add(opt.service.id);
    }
  }
  return [...ids];
}

/**
 * Looks up a film's streaming availability plus display metadata (poster,
 * genres, rating) in the given country, or null if the lookup failed
 * (unknown, not "confirmed unavailable").
 */
export async function getShowInfo(
  title: string,
  year: number | null,
  country: string,
  apiKey: string
): Promise<ShowInfo | null> {
  const cacheKey = `${country}::${normalizeTitle(title)}::${year ?? ""}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const results = await searchShowByTitle(title, country, apiKey);
    const match = pickBestMatch(results, title, year);
    const info: ShowInfo = {
      serviceIds: extractServiceIds(match, country),
      posterUrl: match?.imageSet?.verticalPoster?.w240 || match?.imageSet?.verticalPoster?.w360 || null,
      genres: match?.genres?.map((g) => g.name).filter((n): n is string => Boolean(n)) || [],
      rating: match?.rating ?? null,
    };
    cache.set(cacheKey, info);
    return info;
  } catch {
    return null;
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    const current = nextIndex++;
    if (current >= items.length) return;
    results[current] = await worker(items[current], current);
    return runNext();
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(runners);
  return results;
}
