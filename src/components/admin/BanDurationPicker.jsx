import { gradientBorderStyle } from '../../lib/gradientBorder'

export const BAN_DURATIONS = [
  { value: '3d', label: '3 Hari' },
  { value: '7d', label: '7 Hari' },
  { value: '30d', label: '30 Hari' },
  { value: 'permanent', label: 'Permanen' },
]

export default function BanDurationPicker({
  duration,
  onDurationChange,
  reason,
  onReasonChange,
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {BAN_DURATIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onDurationChange(d.value)}
            style={gradientBorderStyle(duration === d.value ? '#f6effc' : '#ffffff')}
            className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:opacity-80"
          >
            {d.label}
          </button>
        ))}
      </div>

      <textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Alasan banned..."
        rows={2}
        className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
    </>
  )
}
