import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, manageUser, setUserRole } from "../../lib/adminUsers";
import Spinner from "../../components/Spinner";
import ConfirmDialog from "../../components/ConfirmDialog";
import LogDialog from "../../components/LogDialog";
import warningIcon from "../../assets/img/warning.png";
import { gradientBorderStyle } from "../../lib/gradientBorder";

const BAN_DURATIONS = [
  { value: "3d", label: "3 Hari" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "permanent", label: "Permanen" },
];

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function GrantAccess() {
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const updateRole = useMutation({
    mutationFn: setUserRole,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const manage = useMutation({
    mutationFn: manageUser,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const [confirmState, setConfirmState] = useState(null);
  const [banDuration, setBanDuration] = useState("7d");
  const [logUser, setLogUser] = useState(null);

  function handleDelete(u) {
    setConfirmState({ user: u, action: "delete" });
  }

  function handleToggleBan(u) {
    if (u.isBanned) {
      manage.mutate({ userId: u.id, action: "unban" });
      return;
    }
    setBanDuration("7d");
    setConfirmState({ user: u, action: "ban" });
  }

  function confirmAction() {
    manage.mutate({
      userId: confirmState.user.id,
      action: confirmState.action,
      ...(confirmState.action === "ban" && { duration: banDuration }),
    });
    setConfirmState(null);
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-zinc-900">
        Grant Access
      </h2>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        Atur siapa aja yang punya akses admin lewat dropdown role di bawah.
      </p>

      {isLoading && <Spinner label="Memuat data user..." />}

      {isError && (
        <p className="mt-6 text-sm text-red-500">
          Gagal memuat data: {error.message}
        </p>
      )}

      {manage.isError && (
        <p className="mt-6 text-sm text-red-500">
          Aksi gagal: {manage.error.message}
        </p>
      )}
      {updateRole.isError && (
        <p className="mt-6 text-sm text-red-500">
          Ubah role gagal: {updateRole.error.message}
        </p>
      )}

      {users && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Terdaftar</th>
                <th className="px-4 py-3 font-medium">Login Terakhir</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
                <th className="px-4 py-3 font-medium">Log</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-50 last:border-0"
                >
                  <td className="px-4 py-3 text-zinc-900">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={updateRole.isPending}
                      onChange={(e) =>
                        updateRole.mutate({
                          userId: u.id,
                          role: e.target.value,
                        })
                      }
                      className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDate(u.lastSignInAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={manage.isPending}
                        onClick={() => handleToggleBan(u)}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          u.isBanned
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {u.isBanned ? "Unban" : "Banned"}
                      </button>
                      <button
                        type="button"
                        disabled={manage.isPending}
                        onClick={() => handleDelete(u)}
                        className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setLogUser(u)}
                      className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                    >
                      Lihat Log
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    Belum ada user yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={
          confirmState?.action === "delete" ? "Hapus akun?" : "Banned akun?"
        }
        message={
          confirmState?.action === "delete"
            ? `Akun ${confirmState.user.email} bakal dihapus permanen. Aksi ini gak bisa dibatalin.`
            : `Pilih berapa lama ${confirmState?.user.email} gak bisa login.`
        }
        confirmLabel={confirmState?.action === "delete" ? "Hapus" : "Banned"}
        danger
        onConfirm={confirmAction}
        onCancel={() => setConfirmState(null)}
      >
        {confirmState?.action === "ban" && (
          <>
            <div className="flex flex-wrap gap-2">
              {BAN_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setBanDuration(d.value)}
                  style={gradientBorderStyle(
                    banDuration === d.value ? "#f6effc" : "#ffffff",
                  )}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:opacity-80"
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span
                aria-hidden
                className="h-4 w-4 shrink-0 bg-red-500"
                style={{
                  WebkitMaskImage: `url(${warningIcon})`,
                  maskImage: `url(${warningIcon})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
              <p className="text-xs font-medium text-red-500">
                Gunakan fitur dengan hati hati!
              </p>
            </div>
          </>
        )}
      </ConfirmDialog>

      <LogDialog
        open={!!logUser}
        email={logUser?.email}
        logs={logUser?.logs ?? []}
        onClose={() => setLogUser(null)}
      />
    </div>
  );
}
