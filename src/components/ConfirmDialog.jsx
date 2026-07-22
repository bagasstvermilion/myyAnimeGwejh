export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  danger = false,
  children,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-100">
        <h3 className="font-display text-lg font-semibold text-zinc-900">
          {title}
        </h3>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-7 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-80 ${
              danger ? 'bg-red-500' : 'bg-zinc-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
