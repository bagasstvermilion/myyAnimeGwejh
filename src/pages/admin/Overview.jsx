import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  fetchLoginEvents,
  fetchRecentEvents,
  fetchUsers,
} from "../../lib/adminUsers";
import Spinner from "../../components/Spinner";
import LoginChart from "../../components/LoginChart";
import ActivityFeed from "../../components/ActivityFeed";

function isWithinDays(dateString, days) {
  const diff = Date.now() - new Date(dateString).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-3xl font-semibold ${accent ?? "text-zinc-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function Overview() {
  const { onlineUserIds } = useAuth();
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

  const {
    data: loginEvents,
    isError: isLoginEventsError,
    error: loginEventsError,
  } = useQuery({
    queryKey: ["admin-login-events"],
    queryFn: () => fetchLoginEvents(14),
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["admin-recent-events"],
    queryFn: () => fetchRecentEvents(50),
  });

  // live-refresh both the stat cards and the chart the moment anyone signs
  // up or logs in (same user_events table the Grant Access page listens to)
  useEffect(() => {
    const channel = supabase
      .channel("overview-user-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-login-events"] });
          queryClient.invalidateQueries({ queryKey: ["admin-recent-events"] });
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-zinc-900">
        Overview
      </h2>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        Ringkasan aktivitas user di MyAnimeGwe.
      </p>

      {isLoading && <Spinner label="Memuat data..." />}

      {isError && (
        <p className="mt-6 text-sm text-red-500">
          Gagal memuat data: {error.message}
        </p>
      )}

      {users && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total User" value={users.length} />
            <StatCard
              label="Online Sekarang"
              value={users.filter((u) => onlineUserIds.has(u.id)).length}
              accent="text-emerald-600"
            />
            <StatCard
              label="Total Admin"
              value={users.filter((u) => u.role === "admin").length}
              accent="text-violet-600"
            />
            <StatCard
              label="Total Banned"
              value={users.filter((u) => u.isBanned).length}
              accent="text-red-500"
            />
            <StatCard
              label="User Baru Hari Ini"
              value={users.filter((u) => isWithinDays(u.createdAt, 1)).length}
            />
            <StatCard
              label="User Baru 7 Hari Terakhir"
              value={users.filter((u) => isWithinDays(u.createdAt, 7)).length}
            />
          </div>

          <div>
            {isLoginEventsError && (
              <p className="mb-2 text-xs text-red-500">
                Gagal memuat data login: {loginEventsError.message}
              </p>
            )}
            <LoginChart events={loginEvents ?? []} />
          </div>
        </div>
      )}

      {users && (
        <div className="mt-4 lg:w-1/3 lg:pr-2">
          <ActivityFeed
            events={recentEvents ?? []}
            emailById={Object.fromEntries(users.map((u) => [u.id, u.email]))}
          />
        </div>
      )}
    </div>
  );
}
