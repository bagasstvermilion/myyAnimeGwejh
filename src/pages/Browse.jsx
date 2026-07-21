import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  searchAnime,
  getTopAnime,
  getSeasonAnime,
  getUpcomingAnime,
} from "../lib/anilist";
import { gradientBorderStyle } from "../lib/gradientBorder";
import SearchBar from "../components/SearchBar";
import AnimeGrid from "../components/AnimeGrid";
import Pagination from "../components/Pagination";
import Spinner from "../components/Spinner";

const TABS = [
  { key: "top", label: "Top Ranking", queryName: "top-anime", fetcher: getTopAnime },
  { key: "season", label: "Musim Ini", queryName: "season-anime", fetcher: getSeasonAnime },
  { key: "upcoming", label: "Segera Tayang", queryName: "upcoming-anime", fetcher: getUpcomingAnime },
];

function tabStyle(active) {
  return gradientBorderStyle(active ? "#f6effc" : "#fafafa");
}

export default function Browse() {
  // tab/search/page all live in the URL (not local state) so they survive
  // navigating to an anime's detail page and back — otherwise Browse
  // remounts fresh and silently resets to page 1 / the "top" tab
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const rawTab = searchParams.get("tab");
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab : "top";
  const page = Number(searchParams.get("page")) || 1;

  const activeTab = TABS.find((t) => t.key === tab);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: search ? ["search", search, page] : [activeTab.queryName, page],
    queryFn: () => (search ? searchAnime(search, page) : activeTab.fetcher(page)),
  });

  function updateParams({ tab: nextTab = tab, search: nextSearch = search, page: nextPage = 1 }) {
    const params = { tab: nextTab, page: String(nextPage) };
    if (nextSearch) params.search = nextSearch;
    setSearchParams(params);
  }

  function handleSearch(query) {
    updateParams({ search: query, page: 1 });
  }

  function selectTab(key) {
    updateParams({ tab: key, search: "", page: 1 });
  }

  function goToPage(nextPage) {
    updateParams({ page: nextPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const heading = search ? `Hasil untuk "${search}"` : activeTab.label;

  return (
    <div className="mx-auto max-w-[1440px] px-8 lg:px-14 py-12">
      <div className="mb-10 max-w-xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Browse Anime</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cari judul favorit kamu atau lihat anime paling populer.
        </p>
        <div className="mt-6">
          <SearchBar onSearch={handleSearch} defaultValue={search} />
        </div>

        <div className="mt-4 flex gap-2">
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
