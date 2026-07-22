import { useNavigate } from 'react-router-dom'

export default function BannedNotice({ open, onClose }) {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-zinc-100">
        <h3 className="font-display text-lg font-semibold text-zinc-900">
          Anda terkena banned oleh admin
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Akun kamu udah dikeluarin otomatis dari sesi ini.
        </p>
        <button
          type="button"
          onClick={() => {
            onClose()
            navigate('/')
          }}
          className="mt-6 cursor-pointer rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-80"
        >
          Oke
        </button>
      </div>
    </div>
  )
}
