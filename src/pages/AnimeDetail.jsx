import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAnimeById } from '../lib/jikan'

export default function AnimeDetail() {
  const { id } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['anime', id],
    queryFn: () => getAnimeById(id),
  })

  if (isLoading) {
    return <p className="mx-auto max-w-[1440px] px-8 lg:px-14 py-12 text-zinc-400">Memuat...</p>
  }

  if (isError || !data?.data) {
    return (
      <p className="mx-auto max-w-[1440px] px-8 lg:px-14 py-12 text-red-500">
        Gagal memuat detail anime.
      </p>
    )
  }

  const anime = data.data

  return (
    <div className="mx-auto max-w-[1440px] px-8 lg:px-14 py-12">
      <Link to="/browse" className="mb-6 inline-block text-sm text-violet-600 hover:underline">
        &larr; Kembali
      </Link>
      <div className="flex flex-col gap-8 md:flex-row">
        <img
          src={anime.images?.webp?.image_url}
          alt={anime.title}
          className="w-full max-w-xs rounded-2xl shadow-sm"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {anime.title_english || anime.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{anime.title_japanese}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {anime.genres?.map((g) => (
              <span
                key={g.mal_id}
                className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600"
              >
                {g.name}
              </span>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-zinc-400">Skor</dt>
              <dd className="mt-0.5 font-medium text-zinc-900">{anime.score ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Episode</dt>
              <dd className="mt-0.5 font-medium text-zinc-900">{anime.episodes ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Status</dt>
              <dd className="mt-0.5 font-medium text-zinc-900">{anime.status ?? '-'}</dd>
            </div>
          </dl>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-600">
            {anime.synopsis}
          </p>
        </div>
      </div>
    </div>
  )
}
