import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAnime, getTopAnime } from "../lib/jikan";
import SearchBar from "../components/SearchBar";
import AnimeGrid from "../components/AnimeGrid";
import Spinner from "../components/Spinner";

export default function Browse() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: search ? ["search", search] : ["top-anime"],
    queryFn: () => (search ? searchAnime(search) : getTopAnime()),
  });

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
      </div>

      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-400">
        {search ? `Hasil untuk "${search}"` : "Top Anime"}
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

      <AnimeGrid animeList={data?.data} />
    </div>
  );
}
