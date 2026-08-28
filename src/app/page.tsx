"use client";

import { useState } from "react";
import { COUNTRIES, STREAMING_SERVICES } from "@/lib/services";

type LookupFilm = {
  title: string;
  year: number | null;
  url: string | null;
};

type LookupResponse = {
  totalInWatchlist: number;
  checkedCount: number;
  truncated: boolean;
  notStreaming: LookupFilm[];
  unknown: LookupFilm[];
};

export default function Home() {
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("us");
  const [services, setServices] = useState<string[]>(["netflix"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResponse | null>(null);

  function toggleService(id: string) {
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
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
              onChange={(e) => setCountry(e.target.value)}
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
              {STREAMING_SERVICES.map((s) => (
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

        {result && (
          <div className="flex flex-col gap-6">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Checked {result.checkedCount} of {result.totalInWatchlist} watchlist films.
              {result.truncated && (
                <span> Only the first {result.checkedCount} were checked due to API limits.</span>
              )}
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Not on your services ({result.notStreaming.length})
              </h2>
              {result.notStreaming.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  Everything checked is available on your selected services.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                  {result.notStreaming.map((film, i) => (
                    <li key={i} className="flex items-center justify-between py-2">
                      <span className="text-zinc-800 dark:text-zinc-200">
                        {film.title} {film.year ? `(${film.year})` : ""}
                      </span>
                      {film.url && (
                        <a
                          href={film.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          Letterboxd
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
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
