import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { gradientBorderStyle } from '../lib/gradientBorder'
import {
  STATUSES,
  getWatchlistEntry,
  removeWatchlistEntry,
  statusLabel,
  upsertWatchlistEntry,
} from '../lib/watchlist'

export default function WatchlistButton({ anime }) {
  const { user } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: entry } = useQuery({
    queryKey: ['watchlist-entry', user?.id, anime.mal_id],
    queryFn: () => getWatchlistEntry(user.id, anime.mal_id),
    enabled: !!user,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['watchlist-entry', user.id, anime.mal_id] })
    queryClient.invalidateQueries({ queryKey: ['watchlist', user.id] })
  }

  const setStatus = useMutation({
    mutationFn: (status) =>
      upsertWatchlistEntry({
        userId: user.id,
        animeId: anime.mal_id,
        title: anime.title_english || anime.title,
        coverImage: anime.images?.webp?.image_url,
        status,
      }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
    },
  })

  const remove = useMutation({
    mutationFn: () => removeWatchlistEntry(user.id, anime.mal_id),
    onSuccess: () => {
      invalidate()
      setOpen(false)
    },
  })

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location }}
        style={gradientBorderStyle()}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:opacity-80"
      >
        + Tambah ke List
      </Link>
    )
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={gradientBorderStyle()}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:opacity-80"
      >
        {entry ? statusLabel(entry.status) : '+ Tambah ke List'}
        {entry ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden>
            <defs>
              <linearGradient id="watchlist-bookmark-gradient" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0" stopColor="#f472b6" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <path
              d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-4-6 4V4z"
              fill="url(#watchlist-bookmark-gradient)"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-zinc-100">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate(s.value)}
              className={`block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                entry?.status === s.value
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {s.label}
            </button>
          ))}

          {entry && (
            <>
              <div className="my-1 h-px bg-zinc-100" />
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
                className="block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hapus dari List
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
