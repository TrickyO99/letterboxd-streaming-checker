"use client";

import { useMemo, useState } from "react";
import { COUNTRIES, getServicesForCountry } from "@/lib/services";

type LookupFilm = {
  title: string;
  year: number | null;
  url: string | null;
  posterUrl: string | null;
  genres: string[];
  rating: number | null;
};

type LookupResponse = {
  totalInWatchlist: number;
  checkedCount: number;
  truncated: boolean;
  notStreaming: LookupFilm[];
  unknown: LookupFilm[];
};

type SortKey = "year-desc" | "year-asc" | "rating-desc" | "rating-asc" | "title";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "year-desc", label: "Release date (newest)" },
  { value: "year-asc", label: "Release date (oldest)" },
  { value: "rating-desc", label: "Rating (highest)" },
  { value: "rating-asc", label: "Rating (lowest)" },
  { value: "title", label: "Name" },
];

function decadeOf(year: number | null): string | null {
  if (year === null) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("fr");
  const [services, setServices] = useState<string[]>(["netflix"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResponse | null>(null);

  const [sortBy, setSortBy] = useState<SortKey>("year-desc");
  const [genreFilter, setGenreFilter] = useState("all");
  const [decadeFilter, setDecadeFilter] = useState("all");

  const availableServices = getServicesForCountry(country);

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    const validIds = new Set(getServicesForCountry(newCountry).map((s) => s.id));
    setServices((prev) => prev.filter((id) => validIds.has(id)));
  }

  function toggleService(id: string) {
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setGenreFilter("all");
    setDecadeFilter("all");

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, country, services }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const genres = useMemo(() => {
    if (!result) return [];
    const set = new Set<string>();
    result.notStreaming.forEach((f) => f.genres.forEach((g) => set.add(g)));
    return [...set].sort();
  }, [result]);

  const decades = useMemo(() => {
    if (!result) return [];
    const set = new Set<string>();
    result.notStreaming.forEach((f) => {
      const d = decadeOf(f.year);
      if (d) set.add(d);
    });
    return [...set].sort();
  }, [result]);

  const filteredFilms = useMemo(() => {
    if (!result) return [];
    let films = result.notStreaming;
    if (genreFilter !== "all") {
      films = films.filter((f) => f.genres.includes(genreFilter));
    }
    if (decadeFilter !== "all") {
      films = films.filter((f) => decadeOf(f.year) === decadeFilter);
    }
    const sorted = [...films];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "year-desc":
          return (b.year ?? -Infinity) - (a.year ?? -Infinity);
        case "year-asc":
          return (a.year ?? Infinity) - (b.year ?? Infinity);
        case "rating-desc":
          return (b.rating ?? -Infinity) - (a.rating ?? -Infinity);
        case "rating-asc":
          return (a.rating ?? Infinity) - (b.rating ?? Infinity);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return sorted;
  }, [result, sortBy, genreFilter, decadeFilter]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Watchlist Gap Finder
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Enter a Letterboxd username to see which watchlist films aren&apos;t on your streaming
              services.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Letterboxd username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. deathproof"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="country" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Region
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Your streaming services
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableServices.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={services.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {loading ? "Checking watchlist..." : "Find the gaps"}
            </button>
          </form>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="flex flex-col gap-6">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Checked {result.checkedCount} of {result.totalInWatchlist} watchlist films.
              {result.truncated && (
                <span> Only the first {result.checkedCount} were checked due to API limits.</span>
              )}
            </div>

            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Not on your services ({filteredFilms.length}
                  {filteredFilms.length !== result.notStreaming.length ? ` of ${result.notStreaming.length}` : ""})
                </h2>

                {result.notStreaming.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          Sort: {o.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="all">All genres</option>
                      {genres.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>

                    <select
                      value={decadeFilter}
                      onChange={(e) => setDecadeFilter(e.target.value)}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="all">All decades</option>
                      {decades.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {result.notStreaming.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  Everything checked is available on your selected services.
                </p>
              ) : filteredFilms.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">No films match these filters.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {filteredFilms.map((film, i) => (
                    <a
                      key={i}
                      href={film.url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex aspect-[2/3] flex-col overflow-hidden rounded-md bg-zinc-200 shadow-sm transition-transform hover:scale-[1.03] dark:bg-zinc-800"
                    >
                      {film.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={film.posterUrl}
                          alt={film.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
                          {film.title}
                        </div>
                      )}
                      {film.rating !== null && (
                        <span className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {film.rating}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-white">
                          {film.title}
                        </p>
                        {film.year && <p className="text-[10px] text-zinc-300">{film.year}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {result.unknown.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Couldn&apos;t verify ({result.unknown.length})
                </h2>
                <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                  {result.unknown.map((film, i) => (
                    <li key={i} className="py-2 text-zinc-800 dark:text-zinc-200">
                      {film.title} {film.year ? `(${film.year})` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
