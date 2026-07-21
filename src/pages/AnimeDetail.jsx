import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAnimeById } from '../lib/anilist'
import Spinner from '../components/Spinner'

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-zinc-100">
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-900">{value ?? '-'}</dd>
    </div>
  )
}

export default function AnimeDetail() {
  const { id } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['anime', id],
    queryFn: () => getAnimeById(id),
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-8 lg:px-14">
        <Spinner label="Memuat detail anime..." />
      </div>
    )
  }

  if (isError || !data?.data) {
    return (
      <p className="mx-auto max-w-[1440px] px-8 lg:px-14 py-12 text-red-500">
        Gagal memuat detail anime.
      </p>
    )
  }

  const anime = data.data
  const cover = anime.images?.webp?.large_image_url || anime.images?.webp?.image_url
  const studios = anime.studios?.map((s) => s.name).join(', ')

  return (
    <div className="mx-auto max-w-[1440px] px-8 pb-16 pt-8 lg:px-14">
      <Link
        to="/browse"
        className="mb-6 inline-flex items-center gap-1 text-sm text-violet-600 hover:underline"
      >
        &larr; Kembali
      </Link>

      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl">
        <img
          src={cover}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.45]"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:gap-8 sm:p-10">
          <img
            src={cover}
            alt={anime.title}
            className="w-40 shrink-0 rounded-2xl shadow-2xl ring-1 ring-white/10 sm:w-52"
          />
          <div className="pb-1">
            {anime.score && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-amber-300 backdrop-blur-sm">
                ★ {anime.score}
              </span>
            )}
            <h1 className="font-display text-2xl font-semibold text-white sm:text-4xl">
              {anime.title_english || anime.title}
            </h1>
            <p className="mt-1 text-sm text-white/50">{anime.title_japanese}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {anime.genres?.map((g) => (
                <span
                  key={g.mal_id}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* stats */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Skor" value={anime.score} />
        <StatCard label="Rank" value={anime.rank ? `#${anime.rank}` : null} />
        <StatCard label="Episode" value={anime.episodes} />
        <StatCard label="Durasi" value={anime.duration} />
        <StatCard label="Status" value={anime.status} />
        <StatCard label="Tipe" value={anime.type} />
      </dl>

      {/* synopsis + metadata */}
      <div className="mt-10 grid gap-10 pl-4 lg:grid-cols-[1fr_260px]">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900">Sinopsis</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            {anime.synopsis || 'Belum ada sinopsis.'}
          </p>
        </div>

        <aside className="space-y-4 text-sm">
          {studios && (
            <div>
              <p className="text-zinc-400">Studio</p>
              <p className="mt-0.5 font-medium text-zinc-900">{studios}</p>
            </div>
          )}
          {anime.source && (
            <div>
              <p className="text-zinc-400">Sumber</p>
              <p className="mt-0.5 font-medium text-zinc-900">{anime.source}</p>
            </div>
          )}
          {anime.aired?.string && (
            <div>
              <p className="text-zinc-400">Tayang</p>
              <p className="mt-0.5 font-medium text-zinc-900">{anime.aired.string}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
