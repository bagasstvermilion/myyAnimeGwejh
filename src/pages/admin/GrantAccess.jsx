import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { fetchUsers, manageUser, setUserRole } from "../../lib/adminUsers";
import Spinner from "../../components/Spinner";
import ConfirmDialog from "../../components/dialog/ConfirmDialog";
import LogDialog from "../../components/dialog/LogDialog";
import UserTable from "../../components/admin/UserTable";
import BanDurationPicker, {
  BAN_DURATIONS,
} from "../../components/admin/BanDurationPicker";
import WarningBanner from "../../components/admin/WarningBanner";

export default function GrantAccess() {
  const queryClient = useQueryClient();
  const { onlineUserIds, broadcastUserBanned, role: myRole } = useAuth();
  const isFullAdmin = myRole === "admin";

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
  const [banDuration, setBanDuration] = useState("3d");
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
    setBanDuration("3d");
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
        Kelola akses pengguna, lihat log, delete dan banned akun.
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
        <UserTable
          users={users}
          onlineUserIds={onlineUserIds}
          isFullAdmin={isFullAdmin}
          rolePending={updateRole.isPending}
          onRoleChange={(userId, role) => updateRole.mutate({ userId, role })}
          actionPending={manage.isPending}
          onToggleBan={handleToggleBan}
          onDelete={handleDelete}
          onViewLog={setLogUser}
        />
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
          <BanDurationPicker
            duration={banDuration}
            onDurationChange={setBanDuration}
            reason={banReason}
            onReasonChange={setBanReason}
          />
        )}
        {confirmState && <WarningBanner />}
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
