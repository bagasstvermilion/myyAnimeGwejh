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

  const activeTab = TABS.find((t) => t.key === tab);
  const filters = {
    genre: genre.length ? genre : undefined,
    format: format.length ? format : undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: search
      ? ["search", search, page, genre, format]
      : [activeTab.queryName, page, genre, format],
    queryFn: () =>
      search
        ? searchAnime(search, page, filters)
        : activeTab.fetcher(page, filters),
  });

  function updateParams(overrides) {
    const next = {
      tab: overrides.tab ?? tab,
      search: overrides.search ?? search,
      genre: overrides.genre ?? genre,
      format: overrides.format ?? format,
      page: String(overrides.page ?? 1),
    };
    const params = { tab: next.tab, page: next.page };
    if (next.search) params.search = next.search;
    if (next.genre.length) params.genre = next.genre.join(",");
    if (next.format.length) params.format = next.format.join(",");
    setSearchParams(params);
  }

  function handleSearch(query) {
    updateParams({ search: query, page: 1 });
  }

  function selectTab(key) {
    updateParams({ tab: key, search: "", page: 1 });
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

  return (
    <div className="mx-auto max-w-[1440px] px-8 lg:px-14 py-12">
      <div className="mb-4 max-w-xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Browse Anime</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cari judul favorit kamu atau lihat anime paling populer.
        </p>
        <div className="mt-6">
          <SearchBar onSearch={handleSearch} defaultValue={search} />
        </div>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              style={tabStyle(!search && tab === t.key)}
              className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:opacity-80"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
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
  );
}
