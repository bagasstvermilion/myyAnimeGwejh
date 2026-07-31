import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getAnimeById } from "../lib/anilist";
import {
  backfillTotalEpisodes,
  episodeDisplay,
  removeWatchlistEntry,
  statusColor,
  statusLabel,
  updateEpisodeProgress,
} from "../lib/watchlist";

export default function WatchlistCard({ entry }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // older entries were saved before total_episodes existed, so backfill it
  // from AniList once instead of leaving them stuck showing "?" forever
  useEffect(() => {
    if (entry.total_episodes != null) return;

    let cancelled = false;

    getAnimeById(entry.anime_id).then(({ data: anime }) => {
      if (cancelled || anime?.episodes == null) return;

      backfillTotalEpisodes(user.id, entry.anime_id, anime.episodes).then(() => {
        queryClient.setQueryData(["watchlist", user.id], (old) =>
          old?.map((e) =>
            e.anime_id === entry.anime_id
              ? { ...e, total_episodes: anime.episodes }
              : e,
          ),
        );
      });
    });

    return () => {
      cancelled = true;
    };
  }, [entry.anime_id, entry.total_episodes, user.id, queryClient]);

  const remove = useMutation({
    mutationFn: () => removeWatchlistEntry(user.id, entry.anime_id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["watchlist", user.id] }),
  });

  const incrementEpisode = useMutation({
    mutationFn: (nextEpisode) =>
      updateEpisodeProgress(user.id, entry.anime_id, nextEpisode),
    onMutate: async (nextEpisode) => {
      const queryKey = ["watchlist", user.id];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
        old?.map((e) =>
          e.anime_id === entry.anime_id
            ? {
                ...e,
                current_episode: nextEpisode,
                updated_at: new Date().toISOString(),
              }
            : e,
        ),
      );

      return { previous, queryKey };
    },
    onError: (_err, _nextEpisode, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["watchlist", user.id] }),
  });

  function handleIncrement() {
    const list = queryClient.getQueryData(["watchlist", user.id]) ?? [];
    const current =
      list.find((e) => e.anime_id === entry.anime_id)?.current_episode ??
      entry.current_episode ??
      0;
    incrementEpisode.mutate(current + 1);
  }

  const { text: episodeText, showIncrement } = episodeDisplay(entry);
  const atLastEpisode =
    entry.total_episodes != null &&
    entry.current_episode >= entry.total_episodes;

  return (
    <div className="group relative">
      <Link
        to={`/anime/${entry.anime_id}`}
        className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100 transition hover:-translate-y-1 hover:shadow-lg hover:ring-violet-200"
      >
        <div className="aspect-[2/3] overflow-hidden bg-zinc-100">
          <img
            src={entry.cover_image}
            alt={entry.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-zinc-900">
            {entry.title}
          </h3>
          <div className="mt-auto space-y-1.5">
            <div className={`text-xs font-medium ${statusColor(entry.status)}`}>
              {statusLabel(entry.status)}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500">Eps {episodeText}</span>
              {showIncrement && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleIncrement();
                  }}
                  disabled={atLastEpisode}
                  className="cursor-pointer rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +1
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          remove.mutate();
        }}
        disabled={remove.isPending}
        aria-label="Hapus dari list"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition hover:bg-black/80 disabled:cursor-not-allowed group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
