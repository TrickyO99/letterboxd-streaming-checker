import { NextRequest, NextResponse } from "next/server";
import { fetchWatchlist, LetterboxdError, WatchlistFilm } from "@/lib/letterboxd";
import { getShowInfo, mapWithConcurrency } from "@/lib/streaming";

export const runtime = "nodejs";

const DEFAULT_MAX_FILMS = 150;
const CONCURRENCY = 4;

type LookupResultFilm = {
  title: string;
  year: number | null;
  url: string | null;
  posterUrl: string | null;
  genres: string[];
  rating: number | null;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing RAPIDAPI_KEY. Add it to .env.local and restart the server." },
      { status: 500 }
    );
  }

  let body: { username?: string; country?: string; services?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const country = (body.country || "fr").trim().toLowerCase();
  const selectedServices = Array.isArray(body.services) ? body.services : [];

  if (!username) {
    return NextResponse.json({ error: "Letterboxd username is required." }, { status: 400 });
  }
  if (selectedServices.length === 0) {
    return NextResponse.json({ error: "Select at least one streaming service." }, { status: 400 });
  }

  let watchlist: WatchlistFilm[];
  try {
    watchlist = await fetchWatchlist(username);
  } catch (err) {
    if (err instanceof LetterboxdError) {
      const status =
        err.code === "USER_NOT_FOUND"
          ? 404
          : err.code === "PRIVATE_PROFILE"
            ? 403
            : err.code === "BLOCKED"
              ? 503
              : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json({ error: "Failed to load Letterboxd watchlist." }, { status: 502 });
  }

  if (watchlist.length === 0) {
    return NextResponse.json({
      totalInWatchlist: 0,
      checkedCount: 0,
      truncated: false,
      notStreaming: [],
      unknown: [],
    });
  }

  const maxFilms = Number(process.env.RAPIDAPI_MAX_LOOKUPS) || DEFAULT_MAX_FILMS;
  const truncated = watchlist.length > maxFilms;
  const filmsToCheck = watchlist.slice(0, maxFilms);
  const selectedSet = new Set(selectedServices);

  const notStreaming: LookupResultFilm[] = [];
  const unknown: LookupResultFilm[] = [];

  await mapWithConcurrency(filmsToCheck, CONCURRENCY, async (film) => {
    const info = await getShowInfo(film.title, film.year, country, apiKey);
    const result: LookupResultFilm = {
      title: film.title,
      year: film.year,
      url: film.url,
      posterUrl: info?.posterUrl ?? null,
      genres: info?.genres ?? [],
      rating: info?.rating ?? null,
    };

    if (info === null) {
      unknown.push(result);
      return;
    }
    const hasSelectedService = info.serviceIds.some((id) => selectedSet.has(id));
    if (!hasSelectedService) {
      notStreaming.push(result);
    }
  });

  return NextResponse.json({
    totalInWatchlist: watchlist.length,
    checkedCount: filmsToCheck.length,
    truncated,
    notStreaming,
    unknown,
  });
}
