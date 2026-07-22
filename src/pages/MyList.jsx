import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { gradientBorderStyle } from "../lib/gradientBorder";
import { STATUSES, getWatchlist } from "../lib/watchlist";
import Spinner from "../components/Spinner";
import WatchlistCard from "../components/WatchlistCard";
import SearchBar from "../components/SearchBar";
import userLogo from "../assets/img/user-logo.png";

const TABS = [{ value: "all", label: "Semua" }, ...STATUSES];

function tabStyle(active) {
  return gradientBorderStyle(active ? "#f6effc" : "#fafafa");
}

export default function MyList() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const {
    data: watchlist,
    isLoading: isWatchlistLoading,
    isError,
  } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: () => getWatchlist(user.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-8 lg:px-14">
        <Spinner label="Memuat..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col items-center px-8 pb-28 pt-44 text-center lg:px-14">
        <span
          aria-hidden
          className="h-14 w-14 bg-gradient-to-br from-pink-400 to-violet-600"
          style={{
            WebkitMaskImage: `url(${userLogo})`,
            maskImage: `url(${userLogo})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
        <h1 className="mt-2 font-display text-2xl font-semibold text-zinc-900">
          Masuk
        </h1>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Masuk dulu buat lihat & kelola list anime kamu.
        </p>
        <Link
          to="/login"
          state={{ from: location }}
          className="mt-4 cursor-pointer rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-80"
        >
          Login
        </Link>
      </div>
    );
  }

  const filtered = (watchlist ?? [])
    .filter((entry) => tab === "all" || entry.status === tab)
    .filter((entry) =>
      entry.title.toLowerCase().includes(search.trim().toLowerCase()),
    );

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-12 lg:px-14">
      <div className="mb-4 max-w-xl">
        <h1 className="font-display text-2xl font-semibold text-zinc-900">
          My List
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          List anime yang udah kamu simpan.
        </p>
        <div className="mt-6">
          <SearchBar onSearch={setSearch} defaultValue={search} />
        </div>
      </div>

      <div className="mb-12 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            style={tabStyle(tab === t.value)}
            className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:opacity-80"
          >
            {t.label}
          </button>
        ))}
      </div>

      {isWatchlistLoading && <Spinner label="Memuat list kamu..." />}

      {isError && (
        <p className="py-12 text-center text-sm text-red-500">
          Gagal memuat list kamu.
        </p>
      )}

      {!isWatchlistLoading && !isError && filtered.length === 0 && (
        <p className="py-20 text-center text-sm text-zinc-400">
          Belum ada anime di kategori ini. Cari anime di halaman Browse terus
          tambahin ke list.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((entry) => (
            <WatchlistCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
