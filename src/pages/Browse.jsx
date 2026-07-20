import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchAnime, getTopAnime } from '../lib/jikan'
import SearchBar from '../components/SearchBar'
import AnimeGrid from '../components/AnimeGrid'

export default function Browse() {
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: search ? ['search', search] : ['top-anime'],
    queryFn: () => (search ? searchAnime(search) : getTopAnime()),
  })

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
        {search ? `Hasil untuk "${search}"` : 'Top Anime'}
      </h2>

      {isLoading && <p className="text-zinc-400">Memuat...</p>}
      {isError && (
        <p className="text-red-500">
          Gagal memuat data, coba lagi sebentar (Jikan API punya rate limit).
        </p>
      )}

      <AnimeGrid animeList={data?.data} />
    </div>
  )
}
