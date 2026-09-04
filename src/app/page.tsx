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
    <div className="relative z-10 min-h-screen flex flex-col">
      <header className="px-4 pt-6 sm:px-8">
        <a
          href="https://odtriki.com"
          className="inline-flex items-center gap-2 font-serif text-sm font-semibold"
          style={{ color: "var(--cream)" }}
        >
          <span aria-hidden className="inline-block h-2 w-2 rounded-[2px]" style={{ background: "var(--orange)" }} />
          Othmane Triki
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <div className="flex flex-col gap-2 text-center">
            <p
              className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--orange-bright)" }}
            >
              <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <rect x="2" y="4" width="18" height="13" rx="2" />
                <polygon points="9,7.5 9,13.5 14.5,10.5" fill="currentColor" stroke="none" />
              </svg>
              Letterboxd, streamable
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--cream)]">
              Watchlist Gap Finder
            </h1>
            <p className="text-[var(--muted)]">
              Enter a Letterboxd username to see which watchlist films aren&apos;t on your streaming
              services.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium text-[var(--cream)]">
                Letterboxd username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. deathproof"
                className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--cream)] outline-none focus:border-primary dark:focus:border-primary-bright"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="country" className="text-sm font-medium text-[var(--cream)]">
                Region
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--cream)] outline-none focus:border-primary dark:focus:border-primary-bright"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-[var(--cream)]">
                Your streaming services
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableServices.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] transition-colors has-[:checked]:border-secondary has-[:checked]:bg-secondary/10 dark:has-[:checked]:border-secondary dark:has-[:checked]:bg-secondary/15"
                  >
                    <input
                      type="checkbox"
                      checked={services.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                      className="accent-primary"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-primary px-4 py-2 font-semibold text-[var(--ink)] transition-colors hover:bg-primary-bright disabled:opacity-50"
            >
              {loading ? "Checking watchlist..." : "Find the gaps"}
            </button>
          </form>

          {error && (
            <div className="rounded-md border border-[var(--danger)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="flex flex-col gap-6">
            <div className="text-sm text-[var(--muted)]">
              Checked {result.checkedCount} of {result.totalInWatchlist} watchlist films.
              {result.truncated && (
                <span> Only the first {result.checkedCount} were checked due to API limits.</span>
              )}
            </div>

            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--cream)]">
                  Not on your services ({filteredFilms.length}
                  {filteredFilms.length !== result.notStreaming.length ? ` of ${result.notStreaming.length}` : ""})
                </h2>

                {result.notStreaming.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-sm text-[var(--cream)] outline-none"
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
                      className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-sm text-[var(--cream)] outline-none"
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
                      className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-sm text-[var(--cream)] outline-none"
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
                <p className="text-[var(--muted)]">
                  Everything checked is available on your selected services.
                </p>
              ) : filteredFilms.length === 0 ? (
                <p className="text-[var(--muted)]">No films match these filters.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {filteredFilms.map((film, i) => (
                    <a
                      key={i}
                      href={film.url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex aspect-[2/3] flex-col overflow-hidden rounded-md bg-[var(--card)] shadow-sm transition-transform hover:scale-[1.03] hover:ring-2 hover:ring-primary-bright"
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
                        <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-[var(--muted)]">
                          {film.title}
                        </div>
                      )}
                      {film.rating !== null && (
                        <span className="absolute right-1 top-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink)]">
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
                <h2 className="text-lg font-semibold text-[var(--cream)]">
                  Couldn&apos;t verify ({result.unknown.length})
                </h2>
                <ul className="flex flex-col divide-y divide-[var(--border)]">
                  {result.unknown.map((film, i) => (
                    <li key={i} className="py-2 text-[var(--cream)]">
                      {film.title} {film.year ? `(${film.year})` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>

      <footer
        className="border-t px-4 py-8 text-center text-sm sm:px-8"
        style={{ borderColor: "var(--border)", color: "var(--muted)", background: "rgba(15,25,90,0.35)" }}
      >
        <a href="https://odtriki.com" className="font-medium hover:text-[var(--orange-bright)]" style={{ color: "var(--cream)" }}>
          odtriki.com
        </a>
        <span aria-hidden className="inline-block mx-2 h-1 w-1 rounded-[1px] align-middle" style={{ background: "var(--orange)" }} />
        one of a few side projects
      </footer>
    </div>
  );
}
