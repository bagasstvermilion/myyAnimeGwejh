import { gradientBorderStyle } from '../lib/gradientBorder'

function getPageWindow(current, lastPage, size = 3) {
  const last = lastPage && lastPage > 0 ? lastPage : current
  if (last <= size) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }
  let start = Math.max(1, current - 1)
  start = Math.min(start, last - size + 1)
  return Array.from({ length: size }, (_, i) => start + i)
}

export default function Pagination({ page, lastPage, hasNextPage, onChange }) {
  const pages = getPageWindow(page, lastPage)

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-full text-sm font-medium text-zinc-900"
      style={gradientBorderStyle()}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="cursor-pointer px-4 py-2 transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Prev
      </button>

      <span className="h-5 w-px bg-zinc-200" />

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="flex cursor-pointer items-center justify-center px-1.5 py-2 transition hover:opacity-70"
        >
          {n === page ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-600 text-white">
              {n}
            </span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center">{n}</span>
          )}
        </button>
      ))}

      <span className="h-5 w-px bg-zinc-200" />

      <button
        type="button"
        disabled={!hasNextPage}
        onClick={() => onChange(page + 1)}
        className="cursor-pointer px-4 py-2 transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
      </button>
    </div>
  )
}
