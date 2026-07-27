import { useState } from 'react'

const EVENT_META = {
  signup: { text: 'mendaftar akun baru', color: 'bg-violet-500' },
  login: { text: 'login', color: 'bg-blue-500' },
  role_change: { color: 'bg-amber-500' },
  ban: { text: 'kena banned', color: 'bg-red-500' },
  unban: { text: 'di-unban', color: 'bg-emerald-500' },
  delete: { text: 'akunnya dihapus', color: 'bg-zinc-400' },
}

const ROLE_LABELS = { admin: 'Admin', moderator: 'Moderator', user: 'User' }

function eventText(e) {
  if (e.event_type === 'role_change') {
    return `menjadi ${ROLE_LABELS[e.metadata?.role] ?? 'User'}`
  }
  return EVENT_META[e.event_type]?.text ?? e.event_type
}

function formatRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

function EventRow({ e, emailById, roomy }) {
  const color = EVENT_META[e.event_type]?.color ?? 'bg-zinc-300'
  const email = emailById[e.user_id] ?? 'Akun terhapus'

  return (
    <div
      className={`flex items-center gap-3 text-sm ${
        roomy ? 'rounded-xl px-2 py-2.5 transition hover:bg-zinc-50' : ''
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
      <p className="min-w-0 flex-1 truncate text-zinc-700">
        <span className="font-medium text-zinc-900">{email}</span>{' '}
        {eventText(e)}
      </p>
      <span className="shrink-0 text-xs text-zinc-400">
        {formatRelativeTime(e.created_at)}
      </span>
    </div>
  )
}

export default function ActivityFeed({ events, emailById }) {
  const [showAll, setShowAll] = useState(false)
  const preview = events.slice(0, 5)

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Aktivitas Terbaru
        </p>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="cursor-pointer text-[11px] font-medium text-violet-600 transition hover:opacity-70"
        >
          Lihat Lainnya
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {preview.length === 0 && (
          <p className="text-sm text-zinc-400">Belum ada aktivitas.</p>
        )}
        {preview.map((e) => (
          <EventRow key={e.id} e={e} emailById={emailById} />
        ))}
      </div>

      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl ring-1 ring-zinc-100">
            <h3 className="font-display text-lg font-semibold text-zinc-900">
              Semua Aktivitas
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Histori aktivitas user di myyAnimeGwee.
            </p>

            <div className="mt-5 max-h-[28rem] space-y-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-track]:bg-transparent">
              {events.length === 0 && (
                <p className="text-sm text-zinc-400">Belum ada aktivitas.</p>
              )}
              {events.map((e) => (
                <EventRow key={e.id} e={e} emailById={emailById} roomy />
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="cursor-pointer rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
