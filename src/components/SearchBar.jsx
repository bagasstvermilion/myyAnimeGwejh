import { useState } from "react";

export default function SearchBar({ onSearch, defaultValue = "" }) {
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(query.trim());
  }

  function handleClear() {
    setQuery("");
    onSearch("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari anime..."
          className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 sm:px-5 sm:py-3 sm:text-base"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Hapus pencarian"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-lg text-violet-600 transition hover:opacity-70"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:opacity-80 sm:px-6 sm:py-3 sm:text-sm"
      >
        Cari
      </button>
    </form>
  );
}
