import UserRow from './UserRow'

const COLUMNS = [
  'Email',
  'Name',
  'Role',
  'Terdaftar',
  'Login terakhir',
  'Status',
  'Aksi',
  'Log',
]

export default function UserTable({
  users,
  onlineUserIds,
  isFullAdmin,
  rolePending,
  onRoleChange,
  actionPending,
  onToggleBan,
  onDelete,
  onViewLog,
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="w-fit overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
        <div className="grid w-fit grid-cols-[220px_150px_110px_110px_130px_120px_220px_110px] gap-x-2 px-6 py-3 pr-16 text-sm text-zinc-500">
          {COLUMNS.map((col) => (
            <div key={col} className="text-center font-medium">
              {col}
            </div>
          ))}
        </div>
        <div className="mx-6 border-b-2 border-zinc-200" />

        {users.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            isOnline={onlineUserIds.has(u.id)}
            isFullAdmin={isFullAdmin}
            rolePending={rolePending}
            onRoleChange={(role) => onRoleChange(u.id, role)}
            actionPending={actionPending}
            onToggleBan={() => onToggleBan(u)}
            onDelete={() => onDelete(u)}
            onViewLog={() => onViewLog(u)}
          />
        ))}

        {users.length === 0 && (
          <div className="px-4 py-8 text-center text-zinc-400">
            Belum ada user yang terdaftar.
          </div>
        )}
      </div>
    </div>
  )
}
