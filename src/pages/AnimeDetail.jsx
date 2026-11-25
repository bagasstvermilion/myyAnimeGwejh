import { useEffect, useRef, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useNavigationType,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAnimeById, getAnimeCharactersPage } from "../lib/anilist";
import { fuzzyFilter } from "../lib/fuzzySearch";
import { gradientBorderStyle } from "../lib/gradientBorder";
import { useMetaTags } from "../lib/useMetaTags";
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

// module-scope so it survives this component unmounting/remounting (e.g.
// navigating to a character's detail page and back) — without it, every
// round trip re-fetched the whole extra cast from scratch, which is what
// was actually running the app into AniList's rate limit
const extraCharactersCache = new Map();

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
  const navigationType = useNavigationType();
  // tab lives in the URL (not local state) so it survives navigating to a
  // character's detail page and back — otherwise the browser-back restores
  // this page fresh and silently resets the tab to "deskripsi"
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "character" ? "character" : "deskripsi";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeById(id),
  });

  const [translated, setTranslated] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  // restore the character search when coming back from a character's
  // detail page (browser back), same as the scroll position below —
  // otherwise reopening this page fresh clears whatever was searched.
  // characterSearchInput is just the text box; characterSearch is the
  // submitted query that actually triggers filtering/fetching (search only
  // runs once the "Cari" button/Enter is pressed, not on every keystroke)
  const [characterSearchInput, setCharacterSearchInput] = useState(() => {
    if (navigationType !== "POP") return "";
    return sessionStorage.getItem(`animeCharSearch:${id}`) || "";
  });
  const [characterSearch, setCharacterSearch] = useState(() => {
    if (navigationType !== "POP") return "";
    const saved = sessionStorage.getItem(`animeCharSearch:${id}`);
    sessionStorage.removeItem(`animeCharSearch:${id}`);
    return saved || "";
  });
  const [characterLimit, setCharacterLimit] = useState(
    window.innerWidth < 640 ? 18 : 24,
  );
  const [extraCharacters, setExtraCharacters] = useState([]);
  const [loadingMoreCharacters, setLoadingMoreCharacters] = useState(false);
  const fetchedExtraCharactersFor = useRef(null);

  const anime = data?.data;

  // the detail query only ships the first 25 cast members. Only bother
  // pulling the rest once the user actually searches (not just on opening
  // the tab) — most visitors never search, and AniList's rate limit is
  // tight enough that prefetching for everyone risks 429s across the app.
  // Requests go out in small concurrent batches rather than one page at a
  // time (much faster than fully sequential) or all-at-once (too bursty
  // for the rate limit), and each batch is appended as it lands so matches
  // show up progressively instead of all at once at the end.
  //
  // Depends on hasSearchQuery (a boolean), NOT characterSearch itself —
  // depending on the raw string re-runs this effect on every keystroke,
  // which tears down (cancels) the in-progress fetch each time before it
  // can finish, permanently stuck on "Memuat karakter lainnya...".
  const hasSearchQuery = characterSearch.trim().length > 0;
  useEffect(() => {
    if (tab !== "character" || !anime?.charactersHasMore || !hasSearchQuery) {
      return;
    }

    // One Piece alone spans 20 pages (500 characters) — cap well above
    // that so search actually covers the whole cast for every real anime;
    // this only fires once per anime, on an actual search, not on every
    // page load, so the extra requests are rare in practice
    const MAX_EXTRA_PAGES = 30;
    const BATCH_SIZE = 4;
    const lastPage = Math.min(
      anime.charactersLastPage || MAX_EXTRA_PAGES + 1,
      MAX_EXTRA_PAGES + 1,
    );
    const allPages = [];
    for (let p = 2; p <= lastPage; p++) allPages.push(p);

    // cache lives at module scope keyed by anime id, and is filled in
    // page-by-page as each request lands (not just when the whole run
    // finishes) — that way, leaving mid-fetch (e.g. opening a character's
    // detail page) doesn't throw away progress: coming back resumes from
    // whatever pages already succeeded instead of starting over
    let entry = extraCharactersCache.get(anime.mal_id);
    if (!entry) {
      entry = { charactersById: new Map(), fetchedPages: new Set() };
      extraCharactersCache.set(anime.mal_id, entry);
    }
    setExtraCharacters(Array.from(entry.charactersById.values()));

    const remainingPages = allPages.filter((p) => !entry.fetchedPages.has(p));
    if (remainingPages.length === 0) {
      setLoadingMoreCharacters(false);
      return;
    }

    if (fetchedExtraCharactersFor.current === anime.mal_id) return;
    fetchedExtraCharactersFor.current = anime.mal_id;

    setLoadingMoreCharacters(true);

    // deliberately not gated on "is this component still mounted": React
    // 18+ safely no-ops a setState call on an unmounted component, and the
    // shared cache entry above means the fetched pages are useful later
    // regardless — so this is left to run to completion in the background
    // even if the user navigates away (e.g. into a character's detail
    // page) partway through, rather than abandoning the remaining pages.
    // (An earlier version aborted on unmount via a `cancelled` flag, but
    // StrictMode's dev-only mount→cleanup→remount cycle flips that flag
    // within the same tick — long before any fetch() resolves — which
    // permanently stopped every fetch after the first batch and left the
    // loading indicator stuck forever.)
    (async () => {
      for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
        const batch = remainingPages.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((page) =>
            getAnimeCharactersPage(anime.mal_id, page)
              .then((result) => {
                entry.fetchedPages.add(page);
                for (const c of result.characters) {
                  entry.charactersById.set(c.id, c);
                }
                setExtraCharacters(Array.from(entry.charactersById.values()));
              })
              .catch(() => {
                // most likely a 429 — leave this page's slot unmarked so
                // it gets retried on a future search instead of being
                // silently treated as covered
              }),
          ),
        );
        // small breather between batches so a big cast (multiple batches)
        // doesn't fire everything within the same second and trip
        // AniList's rate limit
        if (i + BATCH_SIZE < remainingPages.length) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
      setLoadingMoreCharacters(false);
      if (fetchedExtraCharactersFor.current === anime.mal_id) {
        fetchedExtraCharactersFor.current = null;
      }
    })();
  }, [
    tab,
    anime?.mal_id,
    anime?.charactersHasMore,
    anime?.charactersLastPage,
    hasSearchQuery,
  ]);
  const cover =
    anime?.images?.webp?.large_image_url || anime?.images?.webp?.image_url;

  useMetaTags(
    anime ? `${anime.title_english || anime.title} - MyAnimeGwe` : undefined,
    anime?.synopsis ? anime.synopsis.slice(0, 160) : undefined,
  );

  // reset the translation state whenever the user opens a different anime,
  // and scroll to top — React Router doesn't do this on navigation, so
  // without it the page opens wherever the previous page was scrolled to.
  // skipped on POP (browser back/forward); see the heroReady effect below,
  // which restores the saved scroll position instead once there's actually
  // enough content rendered to scroll to
  useEffect(() => {
    setTranslated(null);
    setTranslateError(false);
    if (navigationType !== "POP") window.scrollTo(0, 0);
  }, [id]);

  // runs once the full page (not just the loading spinner) is actually
  // rendered — restoring scroll any earlier has nothing tall enough to
  // scroll to yet, so the position wouldn't stick
  useEffect(() => {
    if (navigationType !== "POP" || !heroReady) return;
    const saved = sessionStorage.getItem(`animeScroll:${id}`);
    if (saved == null) return;
    window.scrollTo(0, Number(saved));
    sessionStorage.removeItem(`animeScroll:${id}`);
  }, [id, heroReady]);

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
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-0 sm:px-8 sm:pt-8 lg:px-14">
      <div className="mb-6 hidden items-center justify-between gap-3 sm:flex">
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={gradientBorderStyle()}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full py-1.5 pl-3 pr-4 text-sm font-medium text-zinc-900 transition hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <defs>
              <linearGradient
                id="back-chevron-gradient"
                x1="0"
                y1="0"
                x2="24"
                y2="24"
              >
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
      <div>
        {/* mobile: banner strip up top with the cover poster popping over
            its bottom edge, title/meta below — like AniList's own layout.
            -mx-4 bleeds it past the page's own side padding so it goes
            edge-to-edge instead of sitting inside a white margin; no
            rounding/clipping here since it runs flush to the screen edge.
            Falls back to a blurred cover as the strip's backdrop when
            there's no banner art yet (common for "Segera Tayang" titles
            that haven't aired) — otherwise mobile silently dropped into
            the desktop hero's reflowed layout instead of this native one. */}
        <div className="-mx-4 sm:hidden">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <img
              src={anime.banner || cover}
              alt=""
              aria-hidden
              draggable={false}
              className={`absolute inset-0 h-full w-full object-cover ${
                anime.banner ? "" : "scale-110 blur-xl brightness-75"
              }`}
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
              <p className="mt-2 text-xs text-zinc-400">
                {anime.title_japanese}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
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

        {/* sm+: banner as a full-bleed overlay background behind the info
            row, or the same blurred-cover treatment as before when there's
            no banner art */}
        <div className="relative hidden overflow-hidden rounded-3xl sm:block">
          <img
            src={anime.banner || cover}
            alt=""
            aria-hidden
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover ${
              anime.banner ? "" : "scale-110 blur-2xl brightness-[0.45]"
            }`}
          />
          {anime.banner && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          )}
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
              <p className="mt-1 text-sm text-white/50">
                {anime.title_japanese}
              </p>
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
            onClick={() =>
              setSearchParams(t.key === "deskripsi" ? {} : { tab: t.key }, {
                replace: true,
              })
            }
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
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCharacterSearch(characterSearchInput.trim());
                }}
                className="mb-5 flex max-w-md gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={characterSearchInput}
                    onChange={(e) => setCharacterSearchInput(e.target.value)}
                    placeholder="Cari karakter..."
                    // iOS Safari auto-zooms the page on focus if an input's
                    // font-size is under 16px — text-base (16px) on mobile
                    // avoids that, text-sm from sm: up keeps it compact on
                    // desktop where the zoom quirk doesn't apply
                    className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 pr-9 text-base text-zinc-900 placeholder-zinc-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:text-sm"
                  />
                  {characterSearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCharacterSearchInput("");
                        setCharacterSearch("");
                      }}
                      aria-label="Hapus pencarian"
                      className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:opacity-70"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:opacity-80 sm:text-sm"
                >
                  Cari
                </button>
              </form>

              {(() => {
                // once "Cari" is pressed, wait for the full-cast fetch to
                // finish before showing anything — no more partial results
                // flickering in while pages are still loading in the
                // background
                if (hasSearchQuery && anime.charactersHasMore && loadingMoreCharacters) {
                  return <Spinner label="Mencari karakter..." />;
                }

                // AniList's character pagination isn't fully stable for
                // casts this large (many minor characters tie on favourite
                // count), so the same character can land on two different
                // pages we fetch — dedupe by id so it never renders twice
                const characterPool = Array.from(
                  new Map(
                    [...anime.characters, ...extraCharacters].map((c) => [
                      c.id,
                      c,
                    ]),
                  ).values(),
                );
                // exact (substring) matches first; only when there are none
                // does it fall back to typo-tolerant matching, so "megumn"
                // or "kazuma sato" still find Megumin / Kazuma Satou
                const exactCharacters = hasSearchQuery
                  ? characterPool.filter((c) =>
                      c.name
                        ?.toLowerCase()
                        .includes(characterSearch.trim().toLowerCase()),
                    )
                  : [];
                const filteredCharacters = !hasSearchQuery
                  ? anime.characters.slice(0, characterLimit)
                  : exactCharacters.length
                    ? exactCharacters
                    : fuzzyFilter(characterSearch, characterPool, (c) => c.name);

                if (!filteredCharacters.length) {
                  return (
                    <p className="py-10 text-center text-sm text-zinc-400">
                      Gak ada karakter yang cocok dengan "{characterSearch}".
                    </p>
                  );
                }

                return (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {filteredCharacters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          // the character page forces its own scroll-to-top
                          // on open, which wipes out where we were scrolled
                          // to here — save it (and the search text) now so
                          // both can be restored on the way back
                          sessionStorage.setItem(
                            `animeScroll:${id}`,
                            String(window.scrollY),
                          );
                          if (characterSearch) {
                            sessionStorage.setItem(
                              `animeCharSearch:${id}`,
                              characterSearch,
                            );
                          }
                          navigate(`/character/${c.id}`);
                        }}
                        className="flex cursor-pointer flex-col items-center gap-1.5 text-center transition hover:opacity-80"
                      >
                        <img
                          src={c.image}
                          alt={c.name}
                          loading="lazy"
                          draggable={false}
                          className="aspect-[2/3] w-full rounded-xl object-cover ring-1 ring-zinc-100"
                        />
                        <p className="line-clamp-2 text-xs font-medium text-zinc-900">
                          {c.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          {c.role}
                        </p>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </>
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
                  aria-label={
                    translated ? "Lihat teks asli" : "Terjemahkan sinopsis"
                  }
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
                <p className="mt-0.5 font-medium text-zinc-900">
                  {anime.source}
                </p>
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
