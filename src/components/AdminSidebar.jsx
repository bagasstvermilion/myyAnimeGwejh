import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MENU_ITEMS = [
  {
    to: '/admin/overview',
    label: 'Overview',
    icon: (
      <path
        d="M4 13h6V4H4v9ZM4 20h6v-4H4v4ZM14 20h6v-9h-6v9ZM14 4v4h6V4h-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    to: '/admin/grant-access',
    label: 'Grant Access',
    icon: (
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    to: '/admin/user-report',
    label: 'User Report',
    icon: (
      <path
        d="M9 12h6M9 16h6M9 8h1M4 4h16v16H4V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
]

// admin-only — kept out of MENU_ITEMS so moderators never see or reach it
const ADMIN_ONLY_ITEMS = [
  {
    to: '/admin/private',
    label: 'Private',
    icon: (
      <path
        d="M15.5 7.5a4 4 0 1 0-5.657 5.657L4 19v3h3l6.157-6.157a4 4 0 0 0 2.343.657 4 4 0 0 0 4-4 4 4 0 0 0-4-4Zm2 4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
]

function MenuLink({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-violet-50 text-violet-700'
            : 'text-zinc-600 hover:bg-zinc-100'
        }`
      }
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
        {item.icon}
      </svg>
      <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {item.label}
      </span>
    </NavLink>
  )
}

export default function AdminSidebar() {
  const { role } = useAuth()

  return (
    <nav className="group fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-14 flex-col gap-1 overflow-hidden border-r-2 border-zinc-200 bg-white p-2 transition-[width] duration-300 ease-out hover:w-56 hover:shadow-xl">
      {MENU_ITEMS.map((item) => (
        <MenuLink key={item.to} item={item} />
      ))}

      {role === 'admin' && (
        <>
          <div className="my-2 h-px shrink-0 bg-zinc-300" />
          {ADMIN_ONLY_ITEMS.map((item) => (
            <MenuLink key={item.to} item={item} />
          ))}
        </>
      )}
    </nav>
  )
}
