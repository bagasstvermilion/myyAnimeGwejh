import { deriveNameFromEmail } from '../../lib/avatar'
import { gradientBorderStyle } from '../../lib/gradientBorder'
import RoleSelect from './RoleSelect'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function UserRow({
  user,
  isOnline,
  isFullAdmin,
  rolePending,
  onRoleChange,
  actionPending,
  onToggleBan,
  onDelete,
  onViewLog,
}) {
  return (
    <div className="grid w-fit grid-cols-[220px_150px_110px_110px_130px_120px_220px_110px] items-center gap-x-2 border-b border-zinc-50 px-6 py-3 pr-16 text-sm last:border-0 even:bg-zinc-100">
      <div className="truncate text-center text-zinc-900">{user.email}</div>
      <div className="truncate text-center text-zinc-700">
        {user.name || deriveNameFromEmail(user.email)}
      </div>
      <div className="flex justify-center">
        <RoleSelect
          id={user.id}
          value={user.role}
          disabled={rolePending || !isFullAdmin}
          title={!isFullAdmin ? 'Cuma admin yang bisa ubah role' : undefined}
          onChange={(e) => onRoleChange(e.target.value)}
        />
      </div>
      <div className="text-center text-zinc-500">{formatDate(user.createdAt)}</div>
      <div className="text-center text-zinc-500">{formatDate(user.lastSignInAt)}</div>
      <div className="flex items-center justify-center gap-1.5">
        <span
          aria-hidden
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-zinc-300'
          }`}
        />
        <span
          className={`font-display text-sm font-medium ${
            isOnline ? 'text-emerald-600' : 'text-zinc-400'
          }`}
        >
          {isOnline ? 'Active' : 'Offline'}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={actionPending}
          onClick={onToggleBan}
          className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            user.isBanned
              ? 'text-emerald-600 ring-1 ring-emerald-500 hover:bg-emerald-50'
              : 'text-red-500 ring-1 ring-red-500 hover:bg-red-50'
          }`}
        >
          {user.isBanned ? 'Unban' : 'Banned'}
        </button>
        <button
          type="button"
          disabled={actionPending}
          onClick={onDelete}
          className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-red-500 ring-1 ring-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hapus
        </button>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onViewLog}
          style={gradientBorderStyle('#ffffff')}
          className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:opacity-80"
        >
          Lihat Log
        </button>
      </div>
    </div>
  )
}
