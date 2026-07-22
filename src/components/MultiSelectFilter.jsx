import { useEffect, useRef, useState } from 'react'
import { gradientBorderStyle } from '../lib/gradientBorder'

export default function MultiSelectFilter({ label, options, selected, onChange }) {
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

  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={gradientBorderStyle(selected.length ? '#f6effc' : '#fafafa')}
        className="flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:opacity-80"
      >
        {label}
        {/* always reserve space for the count so the button doesn't resize
            (and shove the rest of the row around) when a filter is picked */}
        <span className={selected.length ? undefined : 'invisible'}>
          ({selected.length || 1})
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <defs>
            <linearGradient id={`msf-chevron-${label}`} x1="0" y1="0" x2="24" y2="24">
              <stop offset="0" stopColor="#f472b6" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <path
            d="M6 9l6 6 6-6"
            stroke={`url(#msf-chevron-${label})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-zinc-100">
          <div className="grid grid-cols-2 gap-1.5">
            {options.map((opt) => {
              const value = opt.value ?? opt
              const text = opt.label ?? opt
              const active = selected.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(value)}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-gradient-to-br from-pink-400 to-violet-600 text-white'
                      : 'text-zinc-700 ring-1 ring-zinc-200 hover:ring-violet-300'
                  }`}
                >
                  {text}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
