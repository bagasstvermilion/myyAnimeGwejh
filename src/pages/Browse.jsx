import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  searchAnime,
  getTopAnime,
  getSeasonAnime,
  getUpcomingAnime,
  GENRES,
  FORMATS,
} from "../lib/anilist";
import { gradientBorderStyle } from "../lib/gradientBorder";
import { useMetaTags } from "../lib/useMetaTags";
import SearchBar from "../components/SearchBar";
import AnimeGrid from "../components/AnimeGrid";
import Pagination from "../components/Pagination";
import MultiSelectFilter from "../components/MultiSelectFilter";
import Spinner from "../components/Spinner";

const TABS = [
  {
    key: "top",
    label: "Top Ranking",
    queryName: "top-anime",
    fetcher: getTopAnime,
  },
  {
    key: "season",
    label: "Musim Ini",
    queryName: "season-anime",
    fetcher: getSeasonAnime,
  },
  {
    key: "upcoming",
    label: "Segera Tayang",
    queryName: "upcoming-anime",
    fetcher: getUpcomingAnime,
  },
];

const TOP_SORTS = [
  { value: "score", label: "Rating Tertinggi", anilistSort: "SCORE_DESC" },
  {
    value: "popularity",
    label: "Paling Populer",
    anilistSort: "POPULARITY_DESC",
  },
];

function tabStyle(active) {
  return gradientBorderStyle(active ? "#f6effc" : "#fafafa");
}

function parseList(value) {
  return value ? value.split(",") : [];
}

export default function Browse() {
  // tab/search/page/genre/format all live in the URL (not local state) so
  // they survive navigating to an anime's detail page and back — otherwise
  // Browse remounts fresh and silently resets everything
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const rawTab = searchParams.get("tab");
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab : "top";
  const page = Number(searchParams.get("page")) || 1;
  const genre = parseList(searchParams.get("genre"));
  const format = parseList(searchParams.get("format"));
  const rawTopSort = searchParams.get("sort");
  const topSort = TOP_SORTS.some((s) => s.value === rawTopSort)
    ? rawTopSort
    : "score";

  const activeTab = TABS.find((t) => t.key === tab);
  const filters = {
    genre: genre.length ? genre : undefined,
    format: format.length ? format : undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: search
      ? ["search", search, page, genre, format]
      : tab === "top"
        ? [activeTab.queryName, page, genre, format, topSort]
        : [activeTab.queryName, page, genre, format],
    queryFn: () =>
      search
        ? searchAnime(search, page, filters)
        : tab === "top"
          ? getTopAnime(page, {
              ...filters,
              sort: TOP_SORTS.find((s) => s.value === topSort).anilistSort,
            })
          : activeTab.fetcher(page, filters),
  });

  // remembers the results area's last rendered height so it can hold that
  // height while the next filter/page loads — the grid still collapses to
  // the spinner like before, but the page itself no longer gets shorter
  // mid-load, which is what was yanking the scroll position around
  const resultsRef = useRef(null);
  const [minResultsHeight, setMinResultsHeight] = useState(0);

  useEffect(() => {
    if (!isLoading && resultsRef.current) {
      setMinResultsHeight(resultsRef.current.offsetHeight);
    }
  }, [data, isLoading]);

  const [topSortOpen, setTopSortOpen] = useState(false);
  const topSortRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (topSortRef.current && !topSortRef.current.contains(e.target)) {
        setTopSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateParams(overrides) {
    const next = {
      tab: overrides.tab ?? tab,
      search: overrides.search ?? search,
      genre: overrides.genre ?? genre,
      format: overrides.format ?? format,
      sort: overrides.sort ?? topSort,
      page: String(overrides.page ?? 1),
    };
    const params = { tab: next.tab, page: next.page };
    if (next.search) params.search = next.search;
    if (next.genre.length) params.genre = next.genre.join(",");
    if (next.format.length) params.format = next.format.join(",");
    if (next.tab === "top" && next.sort !== "score") params.sort = next.sort;
    setSearchParams(params);
  }

  function handleSearch(query) {
    updateParams({ search: query, page: 1 });
  }

  function selectTab(key) {
    updateParams({ tab: key, search: "", page: 1 });
  }

  function selectTopSort(value) {
    updateParams({ tab: "top", search: "", page: 1, sort: value });
    setTopSortOpen(false);
  }

  function selectGenre(values) {
    updateParams({ genre: values, page: 1 });
  }

  function selectFormat(values) {
    updateParams({ format: values, page: 1 });
  }

  function clearFilters() {
    updateParams({ genre: [], format: [], page: 1 });
  }

  function goToPage(nextPage) {
    updateParams({ page: nextPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const heading = search ? `Hasil untuk "${search}"` : activeTab.label;
  const hasFilters = genre.length > 0 || format.length > 0;

  useMetaTags(
    search
      ? `Hasil untuk "${search}" - MyAnimeGwe`
      : `Browse Anime - ${activeTab.label} - MyAnimeGwe`,
    "Cari judul anime favorit kamu atau lihat anime paling populer, musim ini, dan yang akan tayang.",
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-14">
      <div className="mb-4 max-w-xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Browse Anime</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cari judul favorit kamu atau lihat anime paling populer.
        </p>
        <div className="mt-6">
          <SearchBar onSearch={handleSearch} defaultValue={search} />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
          {TABS.map((t) =>
            t.key === "top" ? (
              <div key={t.key} ref={topSortRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setTopSortOpen((o) => !o)}
                  style={tabStyle(!search && tab === "top")}
                  className="flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-zinc-900 transition hover:opacity-80 sm:px-4 sm:py-1.5 sm:text-sm"
                >
                  {t.label}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`h-3.5 w-3.5 transition-transform ${topSortOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    <defs>
                      <linearGradient
                        id="top-sort-chevron"
                        x1="0"
                        y1="0"
                        x2="24"
                        y2="24"
                      >
                        <stop offset="0" stopColor="#f472b6" />
                        <stop offset="1" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="url(#top-sort-chevron)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {topSortOpen && (
                  <>
                    {/* mobile: centered modal — the tab row scrolls
                        horizontally (overflow-x-auto), which forces
                        overflow-y to clip too, so an anchored dropdown
                        gets cut off/squeezed there instead of floating
                        below the button */}
                    <div
                      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 sm:hidden"
                      onClick={() => setTopSortOpen(false)}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl ring-1 ring-zinc-100"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-zinc-900">
                            {t.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setTopSortOpen(false)}
                            aria-label="Tutup"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {TOP_SORTS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => selectTopSort(opt.value)}
                              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                                !search &&
                                tab === "top" &&
                                topSort === opt.value
                                  ? "bg-[#f6effc] font-medium text-zinc-900"
                                  : "text-zinc-600 hover:bg-zinc-50"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* sm+: anchored dropdown */}
                    <div className="absolute z-20 mt-2 hidden w-44 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-zinc-100 sm:block">
                      {TOP_SORTS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => selectTopSort(opt.value)}
                          className={`block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm transition ${
                            !search && tab === "top" && topSort === opt.value
                              ? "bg-[#f6effc] font-medium text-zinc-900"
                              : "text-zinc-600 hover:bg-zinc-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTab(t.key)}
                style={tabStyle(!search && tab === t.key)}
                className="shrink-0 cursor-pointer rounded-full px-3 py-2 text-xs font-medium text-zinc-900 transition hover:opacity-80 sm:px-4 sm:py-1.5 sm:text-sm"
              >
                {t.label}
              </button>
            ),
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter
            label="Genre"
            options={GENRES}
            selected={genre}
            onChange={selectGenre}
          />
          <MultiSelectFilter
            label="Tipe"
            options={FORMATS}
            selected={format}
            onChange={selectFormat}
          />
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            aria-label="Hapus filter"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:opacity-70"
          >
            <span
              className={
                hasFilters
                  ? "bg-gradient-to-br from-pink-400 to-violet-600 bg-clip-text text-transparent"
                  : "text-zinc-300"
              }
            >
              ✕
            </span>
          </button>
        </div>
      </div>

      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-400">
        {heading}
      </h2>

      <div ref={resultsRef} style={{ minHeight: minResultsHeight }}>
        {isLoading && <Spinner />}
        {isError && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-red-500">Gagal memuat data server.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
            >
              Coba lagi
            </button>
          </div>
        )}

        <AnimeGrid
          animeList={data?.data}
          showRank={!search && tab === "top"}
          rankOffset={(page - 1) * 24}
          rankIcon={topSort === "score" ? "⭐" : "❤️"}
        />

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              page={page}
              lastPage={data?.pageInfo?.lastPage}
              hasNextPage={data?.pageInfo?.hasNextPage}
              onChange={goToPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
