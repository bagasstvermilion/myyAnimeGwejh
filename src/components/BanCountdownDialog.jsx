import { useEffect, useState } from 'react'
import warningIcon from '../assets/img/warning.png'

const PERMANENT_THRESHOLD_YEARS = 50

function formatRemaining(ms) {
  if (ms <= 0) return '0 detik'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []
  if (days > 0) parts.push(`${days} hari`)
  if (days > 0 || hours > 0) parts.push(`${hours} jam`)
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes} menit`)
  parts.push(`${seconds} detik`)

  return parts.join(' ')
}

export default function BanCountdownDialog({ bannedUntil, duration, reason, onClose }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const untilDate = new Date(bannedUntil)
  const isPermanent =
    untilDate.getFullYear() > new Date().getFullYear() + PERMANENT_THRESHOLD_YEARS
  const remaining = untilDate.getTime() - now

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-zinc-100">
        <span
          aria-hidden
          className="h-16 w-16 bg-red-500"
          style={{
            WebkitMaskImage: `url(${warningIcon})`,
            maskImage: `url(${warningIcon})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
        <h3 className="mt-3 font-display text-3xl font-semibold text-zinc-900">
          Banned
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Akun kamu kena banned, belum bisa login dulu.
        </p>

        <div className="mt-4 w-full space-y-2 rounded-xl bg-zinc-100 p-4 text-left text-xs">
          {duration && (
            <p>
              <span className="font-medium text-zinc-900">Durasi:</span>{' '}
              <span className="text-zinc-600">{duration}</span>
            </p>
          )}
          <p>
            <span className="font-medium text-zinc-900">Sisa waktu:</span>{' '}
            <span className="text-zinc-600">
              {isPermanent ? 'Permanen' : formatRemaining(remaining)}
            </span>
          </p>
          {reason && (
            <p>
              <span className="font-medium text-zinc-900">Alasan:</span>{' '}
              <span className="text-zinc-600">{reason}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 cursor-pointer rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-80"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}
