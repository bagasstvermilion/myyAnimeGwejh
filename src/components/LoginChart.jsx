import { useRef, useState } from 'react'

const DAYS_SHOWN = 14
const TOP_PADDING_PCT = 12 // keep the peak from touching the top edge

function getLastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString()
}

export default function LoginChart({ events }) {
  const containerRef = useRef(null)
  const [hovered, setHovered] = useState(null)

  const days = getLastNDays(DAYS_SHOWN)
  const counts = days.map(
    (day) => events.filter((e) => isSameDay(new Date(e.created_at), day)).length,
  )
  const max = Math.max(...counts, 1)

  const points = counts.map((count, i) => ({
    x: (i / (DAYS_SHOWN - 1)) * 100,
    y: 100 - TOP_PADDING_PCT - (count / max) * (100 - TOP_PADDING_PCT),
    count,
    day: days[i],
  }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
  const areaPath = `${linePath} L 100 100 L 0 100 Z`

  function handleMouseMove(e) {
    const rect = containerRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const index = Math.round(ratio * (DAYS_SHOWN - 1))
    setHovered(Math.min(DAYS_SHOWN - 1, Math.max(0, index)))
  }

  const active = hovered !== null ? points[hovered] : null

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Login {DAYS_SHOWN} Hari Terakhir
      </p>

      <div
        ref={containerRef}
        className="relative mt-4 flex-1"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {/* recessive baseline */}
          <line x1="0" y1="100" x2="100" y2="100" stroke="#f4f4f5" strokeWidth="1" />

          <defs>
            <linearGradient id="login-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7c3aed" stopOpacity="0.18" />
              <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#login-area)" stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {active && (
            <line
              x1={active.x}
              y1="0"
              x2={active.x}
              y2="100"
              stroke="#e4e4e7"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* markers as plain divs so they stay perfectly round regardless of
            the SVG's non-uniform scale */}
        {points.map((p, i) => (
          <div
            key={i}
            className={`absolute rounded-full border-2 border-white bg-violet-600 transition-all ${
              hovered === i ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'
            }`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {active && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white"
            style={{ left: `${active.x}%`, top: `${active.y}%`, marginTop: -8 }}
          >
            {active.count} login &middot;{' '}
            {active.day.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        )}
      </div>

      <div className="mt-2 flex text-[10px] text-zinc-400">
        {days.map((day, i) => (
          <div key={i} className="flex-1 text-center">
            {i % 2 === 0 ? day.getDate() : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
