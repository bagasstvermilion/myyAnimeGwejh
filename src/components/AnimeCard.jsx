import { Link } from 'react-router-dom'

export default function AnimeCard({ anime, rank }) {
  const title = anime.title_english || anime.title
  const image = anime.images?.webp?.image_url || anime.images?.jpg?.image_url

  return (
    <div className="group relative">
      <Link
        to={`/anime/${anime.mal_id}`}
        className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100 transition hover:-translate-y-1 hover:shadow-lg hover:ring-violet-200"
      >
        <div className="aspect-[2/3] overflow-hidden bg-zinc-100">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 text-sm font-medium text-zinc-900">
            {title}
          </h3>
          <div className="mt-auto flex items-center gap-2 text-xs text-zinc-400">
            {anime.score && (
              <span className="flex items-center gap-1 font-medium text-amber-500">
                ★ {anime.score}
              </span>
            )}
            {anime.type && <span>{anime.type}</span>}
          </div>
        </div>
      </Link>

      {rank && (
        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
          #{rank}
        </span>
      )}
    </div>
  )
}
