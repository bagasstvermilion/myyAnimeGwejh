import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { removeWatchlistEntry, statusColor, statusLabel } from '../lib/watchlist'

export default function WatchlistCard({ entry }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const remove = useMutation({
    mutationFn: () => removeWatchlistEntry(user.id, entry.anime_id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id] }),
  })

  return (
    <div className="group relative">
      <Link
        to={`/anime/${entry.anime_id}`}
        className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100 transition hover:-translate-y-1 hover:shadow-lg hover:ring-violet-200"
      >
        <div className="aspect-[2/3] overflow-hidden bg-zinc-100">
          <img
            src={entry.cover_image}
            alt={entry.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-zinc-900">
            {entry.title}
          </h3>
          <div className={`mt-auto text-xs font-medium ${statusColor(entry.status)}`}>
            {statusLabel(entry.status)}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          remove.mutate()
        }}
        disabled={remove.isPending}
        aria-label="Hapus dari list"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition hover:bg-black/80 disabled:cursor-not-allowed group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
