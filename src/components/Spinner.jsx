export default function Spinner({ label = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-400">
      <div
        role="status"
        aria-label="Loading"
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-zinc-200 border-t-violet-600"
      />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}
