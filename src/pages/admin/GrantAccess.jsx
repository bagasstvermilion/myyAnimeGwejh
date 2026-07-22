import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
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
  const { onlineUserIds, broadcastUserBanned } = useAuth();

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  // refetch the list live whenever a new account signs up (see the
  // on_auth_user_created trigger + public.user_events table in Supabase)
  useEffect(() => {
    const channel = supabase
      .channel("user-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_events" },
        () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  const updateRole = useMutation({
    mutationFn: setUserRole,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const manage = useMutation({
    mutationFn: manageUser,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (variables.action === "ban") {
        broadcastUserBanned(variables.userId, {
          reason: variables.reason || undefined,
          duration: BAN_DURATIONS.find((d) => d.value === variables.duration)
            ?.label,
        });
      }
    },
  });

  const [confirmState, setConfirmState] = useState(null);
  const [banDuration, setBanDuration] = useState("7d");
  const [banReason, setBanReason] = useState("");
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
    setBanReason("");
    setConfirmState({ user: u, action: "ban" });
  }

  function confirmAction() {
    manage.mutate({
      userId: confirmState.user.id,
      action: confirmState.action,
      ...(confirmState.action === "ban" && {
        duration: banDuration,
        reason: banReason.trim(),
      }),
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
        <div className="mt-6 w-fit overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
          <div className="grid w-fit grid-cols-[220px_110px_110px_130px_120px_220px_110px] gap-x-2 px-6 py-3 pr-16 text-sm text-zinc-500">
            <div className="text-center font-medium">Email</div>
            <div className="text-center font-medium">Role</div>
            <div className="text-center font-medium">Terdaftar</div>
            <div className="text-center font-medium">Login terakhir</div>
            <div className="text-center font-medium">Status</div>
            <div className="text-center font-medium">Aksi</div>
            <div className="text-center font-medium">Log</div>
          </div>
          <div className="mx-6 border-b-2 border-zinc-200" />

          {users.map((u) => (
            <div
              key={u.id}
              className="grid w-fit grid-cols-[220px_110px_110px_130px_120px_220px_110px] items-center gap-x-2 border-b border-zinc-50 px-6 py-3 pr-16 text-sm last:border-0"
            >
              <div className="truncate text-center text-zinc-900">
                {u.email}
              </div>
              <div className="flex justify-center">
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
              </div>
              <div className="text-center text-zinc-500">
                {formatDate(u.createdAt)}
              </div>
              <div className="text-center text-zinc-500">
                {formatDate(u.lastSignInAt)}
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    onlineUserIds.has(u.id) ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                />
                <span
                  className={`font-display text-sm font-medium ${
                    onlineUserIds.has(u.id)
                      ? "text-emerald-600"
                      : "text-zinc-400"
                  }`}
                >
                  {onlineUserIds.has(u.id) ? "Active" : "Offline"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
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
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setLogUser(u)}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                >
                  Lihat Log
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="px-4 py-8 text-center text-zinc-400">
              Belum ada user yang terdaftar.
            </div>
          )}
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

            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Alasan banned..."
              rows={2}
              className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />

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
