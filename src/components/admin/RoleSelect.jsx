import { gradientBorderStyle } from '../../lib/gradientBorder'

export default function RoleSelect({ id, value, onChange, disabled, title }) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        title={title}
        onChange={onChange}
        style={gradientBorderStyle('#ffffff')}
        className="cursor-pointer appearance-none rounded-full bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-zinc-700 outline-none transition focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="user">User</option>
        <option value="tester">Tester</option>
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2"
        aria-hidden
      >
        <defs>
          <linearGradient id={`role-chevron-${id}`} x1="0" y1="0" x2="24" y2="24">
            <stop offset="0" stopColor="#f472b6" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <path
          d="M6 9l6 6 6-6"
          stroke={`url(#role-chevron-${id})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
