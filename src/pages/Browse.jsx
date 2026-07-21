import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAnime, getTopAnime, getSeasonAnime } from "../lib/anilist";
import SearchBar from "../components/SearchBar";
import AnimeGrid from "../components/AnimeGrid";
import Spinner from "../components/Spinner";

const TABS = [
  { key: "top", label: "Top Ranking" },
  { key: "season", label: "Musim Ini" },
];

// thin gradient border (matches the sakura logo's pink -> violet), with a
// transparent-looking fill — the inner layer just matches the page
// background so it reads as "see-through" rather than a solid pill
function tabStyle(active) {
  const innerFill = active ? "#f6effc" : "#fafafa";
  return {
    border: "1.5px solid transparent",
    backgroundImage: `linear-gradient(${innerFill}, ${innerFill}), linear-gradient(135deg, #f472b6, #7c3aed)`,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
  };
}

export default function Browse() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("top");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: search ? ["search", search] : [tab === "season" ? "season-anime" : "top-anime"],
    queryFn: () => {
      if (search) return searchAnime(search);
      return tab === "season" ? getSeasonAnime() : getTopAnime();
    },
  });

  function selectTab(key) {
    setSearch("");
    setTab(key);
  }

  const heading = search
    ? `Hasil untuk "${search}"`
    : TABS.find((t) => t.key === tab)?.label;

  return (
    <div className="mx-auto max-w-[1440px] px-8 lg:px-14 py-12">
      <div className="mb-10 max-w-xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Browse Anime</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cari judul favorit kamu atau lihat anime paling populer.
        </p>
        <div className="mt-6">
          <SearchBar onSearch={setSearch} />
        </div>

        <div className="mt-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              style={tabStyle(!search && tab === t.key)}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-900 transition"
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

      <AnimeGrid animeList={data?.data} showRank={!search && tab === "top"} />
    </div>
  );
}
