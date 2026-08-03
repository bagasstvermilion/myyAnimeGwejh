import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAnimeById } from "../lib/anilist";
import { gradientBorderStyle } from "../lib/gradientBorder";
import { translateText } from "../lib/translate";
import translateIcon from "../assets/img/translate-icon.png";
import Spinner from "../components/Spinner";
import WatchlistButton from "../components/WatchlistButton";
import PhotoLightbox from "../components/dialog/PhotoLightbox";

const DETAIL_TABS = [
  { key: "deskripsi", label: "Deskripsi" },
  { key: "character", label: "Character" },
];

function tabStyle(active) {
  return gradientBorderStyle(active ? "#f6effc" : "#fafafa");
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-zinc-100 sm:p-4">
      <dt className="text-[10px] uppercase tracking-wide text-zinc-400 sm:text-xs">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-900 sm:text-lg">
        {value ?? "-"}
      </dd>
    </div>
  );
}

export default function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeById(id),
  });

  const [translated, setTranslated] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [tab, setTab] = useState("deskripsi");
  const [characterLimit, setCharacterLimit] = useState(
    window.innerWidth < 640 ? 18 : 24,
  );

  const anime = data?.data;
  const cover =
    anime?.images?.webp?.large_image_url || anime?.images?.webp?.image_url;

  // reset the translation state whenever the user opens a different anime
  useEffect(() => {
    setTranslated(null);
    setTranslateError(false);
  }, [id]);

  // 18 characters on mobile, 24 from sm (640px) up
  useEffect(() => {
    function handleResize() {
      setCharacterLimit(window.innerWidth < 640 ? 18 : 24);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // wait for the hero images to actually finish loading before showing the
  // page, so we never flash the layout with blank/missing image boxes
  useEffect(() => {
    setHeroReady(false);
    const urls = [cover, anime?.banner].filter(Boolean);
    if (urls.length === 0) return;

    let cancelled = false;
    let remaining = urls.length;

    function markLoaded() {
      remaining -= 1;
      if (remaining <= 0 && !cancelled) setHeroReady(true);
    }

    urls.forEach((src) => {
      const img = new Image();
      img.onload = markLoaded;
      img.onerror = markLoaded;
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [cover, anime?.banner]);

  async function handleTranslate() {
    if (translated) {
      setTranslated(null);
      return;
    }

    setIsTranslating(true);
    setTranslateError(false);
    try {
      const result = await translateText(anime.synopsis);
      setTranslated(result);
    } catch {
      setTranslateError(true);
    } finally {
      setIsTranslating(false);
    }
  }

  if (isLoading || (anime && !heroReady)) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
        <Spinner label="Memuat detail anime..." />
      </div>
    );
  }

  if (isError || !anime) {
    return (
      <p className="mx-auto max-w-[1440px] px-4 py-12 text-red-500 sm:px-8 lg:px-14">
        Gagal memuat detail anime.
      </p>
    );
  }

  const studios = anime.studios?.map((s) => s.name).join(", ");

  return (
    <div
      className={`mx-auto max-w-[1440px] px-4 pb-16 sm:px-8 sm:pt-8 lg:px-14 ${
        anime.banner ? "pt-0" : "pt-8"
      }`}
    >
      <div
        className={`mb-6 flex items-center justify-between gap-3 ${anime.banner ? "hidden sm:flex" : ""}`}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={gradientBorderStyle()}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full py-1.5 pl-3 pr-4 text-sm font-medium text-zinc-900 transition hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <defs>
              <linearGradient id="back-chevron-gradient" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0" stopColor="#f472b6" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <path
              d="M15 5l-7 7 7 7"
              stroke="url(#back-chevron-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Kembali
        </button>

        <WatchlistButton anime={anime} />
      </div>

      {/* hero */}
      {anime.banner ? (
        <div>
          {/* mobile: banner strip up top with the cover poster popping over
              its bottom edge, title/meta below — like AniList's own layout.
              -mx-4 bleeds it past the page's own side padding so it goes
              edge-to-edge instead of sitting inside a white margin; no
              rounding/clipping here since it runs flush to the screen edge. */}
          <div className="-mx-4 sm:hidden">
            <div className="relative aspect-[16/9] w-full">
              <img
                src={anime.banner}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/75" />
            </div>
            <div className="flex items-end justify-between gap-3 px-4">
              <button
                type="button"
                onClick={() => setCoverPreviewOpen(true)}
                aria-label="Lihat cover anime"
                className="relative z-10 -mt-20 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-lg"
              >
                <img
                  src={cover}
                  alt={anime.title}
                  draggable={false}
                  className="w-full transition hover:opacity-80"
                />
              </button>
              <WatchlistButton anime={anime} />
            </div>
            <div className="px-4 pt-3">
              {anime.score && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                  ★ {anime.score}
                </span>
              )}
              <h1 className="font-display text-lg font-semibold text-zinc-900">
                {anime.title_english || anime.title}
              </h1>
              <p className="mt-0.5 text-xs text-zinc-400">{anime.title_japanese}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {anime.genres?.map((g) => (
                  <span
                    key={g.mal_id}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* sm+: banner as a full-bleed overlay background behind the info row */}
          <div className="relative hidden overflow-hidden rounded-3xl sm:block">
            <img
              src={anime.banner}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
            <div className="relative flex items-end gap-8 p-10">
              <button
                type="button"
                onClick={() => setCoverPreviewOpen(true)}
                aria-label="Lihat cover anime"
                className="w-52 shrink-0 cursor-pointer"
              >
                <img
                  src={cover}
                  alt={anime.title}
                  draggable={false}
                  className="rounded-2xl shadow-2xl ring-1 ring-white/10 transition hover:opacity-80"
                />
              </button>
              <div className="pb-1">
                {anime.score && (
                  <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-amber-300 backdrop-blur-sm">
                    ★ {anime.score}
                  </span>
                )}
                <h1 className="font-display text-4xl font-semibold text-white">
                  {anime.title_english || anime.title}
                </h1>
                <p className="mt-1 text-sm text-white/50">{anime.title_japanese}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {anime.genres?.map((g) => (
                    <span
                      key={g.mal_id}
                      className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl">
          <img
            src={cover}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.45]"
          />
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:gap-8 sm:p-10">
            <button
              type="button"
              onClick={() => setCoverPreviewOpen(true)}
              aria-label="Lihat cover anime"
              className="w-40 shrink-0 cursor-pointer sm:w-52"
            >
              <img
                src={cover}
                alt={anime.title}
                draggable={false}
                className="rounded-2xl shadow-2xl ring-1 ring-white/10 transition hover:opacity-80"
              />
            </button>
            <div className="pb-1">
              {anime.score && (
                <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-amber-300 backdrop-blur-sm">
                  ★ {anime.score}
                </span>
              )}
              <h1 className="font-display text-2xl font-semibold text-white sm:text-4xl">
                {anime.title_english || anime.title}
              </h1>
              <p className="mt-1 text-sm text-white/50">{anime.title_japanese}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {anime.genres?.map((g) => (
                  <span
                    key={g.mal_id}
                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* stats */}
      <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        <StatCard label="Skor" value={anime.score} />
        <StatCard
          label={anime.type ? `Rank (${anime.type})` : "Rank"}
          value={anime.rank ? `#${anime.rank}` : null}
        />
        <StatCard label="Episode" value={anime.episodes} />
        <StatCard label="Durasi" value={anime.duration} />
        <StatCard label="Status" value={anime.status} />
        <StatCard label="Tipe" value={anime.type} />
      </dl>

      {/* deskripsi / character tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-2 px-2 sm:px-0">
        {DETAIL_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={tabStyle(tab === t.key)}
            className="cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium text-zinc-900 transition hover:opacity-80 sm:px-4 sm:py-1.5 sm:text-sm"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "character" && (
        <div className="mt-6 px-2 sm:px-0">
          {anime.characters?.length ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {anime.characters.slice(0, characterLimit).map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-1.5 text-center">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    draggable={false}
                    className="aspect-[2/3] w-full rounded-xl object-cover ring-1 ring-zinc-100"
                  />
                  <p className="line-clamp-2 text-xs font-medium text-zinc-900">{c.name}</p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">{c.role}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-zinc-400">
              Belum ada data karakter.
            </p>
          )}
        </div>
      )}

      {/* synopsis + metadata */}
      {tab === "deskripsi" && (
      <div className="mt-10 grid gap-10 px-2 sm:px-0 sm:pl-4 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex max-w-2xl items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-zinc-900 sm:text-lg">
              Sinopsis
            </h2>
            {anime.synopsis && (
              <button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating}
                aria-label={translated ? "Lihat teks asli" : "Terjemahkan sinopsis"}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 ${
                  translated ? "bg-violet-50" : ""
                }`}
              >
                {isTranslating ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-violet-600" />
                ) : (
                  <span
                    aria-hidden
                    className="inline-block h-7 w-7 bg-gradient-to-br from-pink-400 to-violet-600"
                    style={{
                      WebkitMaskImage: `url(${translateIcon})`,
                      maskImage: `url(${translateIcon})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                )}
              </button>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-600 sm:text-sm">
            {translated || anime.synopsis || "Belum ada sinopsis."}
          </p>
          {translateError && (
            <p className="mt-2 text-xs text-red-500">
              Gagal menerjemahkan, coba lagi.
            </p>
          )}
        </div>

        <aside className="space-y-4 text-xs sm:text-sm">
          {studios && (
            <div>
              <p className="text-zinc-400">Studio</p>
              <p className="mt-0.5 font-medium text-zinc-900">{studios}</p>
            </div>
          )}
          {anime.source && (
            <div>
              <p className="text-zinc-400">Sumber</p>
              <p className="mt-0.5 font-medium text-zinc-900">{anime.source}</p>
            </div>
          )}
          {anime.aired?.string && (
            <div>
              <p className="text-zinc-400">Tayang</p>
              <p className="mt-0.5 font-medium text-zinc-900">
                {anime.aired.string}
              </p>
            </div>
          )}
        </aside>
      </div>
      )}

      <PhotoLightbox
        open={coverPreviewOpen}
        src={cover}
        onClose={() => setCoverPreviewOpen(false)}
      />
    </div>
  );
}
