import { useNavigate } from 'react-router-dom'
import warningIcon from '../assets/img/warning.png'

export default function BannedNotice({ details, onClose }) {
  const navigate = useNavigate()

  if (!details) return null

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
          Anda terkena banned oleh admin
        </p>

        {(details.duration || details.reason) && (
          <div className="mt-4 w-full space-y-2 rounded-xl bg-zinc-100 p-4 text-left text-xs">
            {details.duration && (
              <p>
                <span className="font-medium text-zinc-900">Durasi:</span>{' '}
                <span className="text-zinc-600">{details.duration}</span>
              </p>
            )}
            {details.reason && (
              <p>
                <span className="font-medium text-zinc-900">Alasan:</span>{' '}
                <span className="text-zinc-600">{details.reason}</span>
              </p>
            )}
          </div>
        )}

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
