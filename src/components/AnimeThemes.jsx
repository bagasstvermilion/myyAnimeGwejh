import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnimeThemes } from "../lib/animethemes";
import { gradientBorderStyle } from "../lib/gradientBorder";
import Spinner from "./Spinner";

const SECTIONS = [
  { type: "OP", label: "Opening" },
  { type: "ED", label: "Ending" },
  { type: "IN", label: "Insert Song" },
];

const CARD_BORDER = { border: "1.5px solid #f4f4f5", background: "#ffffff" };

// same censor look as the spoiler names on the character page (AliasLine
// in CharacterInfoParts): a grey bar over transparent text
const SPOILER_HIDDEN = "select-none rounded bg-zinc-200 text-transparent";
const SPOILER_TITLE = "Spoiler! Klik untuk reveal";

// "previous" restarts the current song first if it's this far in, like
// most music players
const RESTART_THRESHOLD = 3;

// AnimeThemes' media server rate-limits per IP (2-3 quick requests, then
// 503s for a few seconds) and the browser reports that as a plain load
// error — so a failed video is retried after these waits before giving up
const RETRY_DELAYS = [2000, 5000, 10000];

// a slow server doesn't raise any error: Chrome fires "playing" right away
// and then sits on the first frame while it fetches the file's index from
// the end and the first chunk (a few serial requests, ~1s or more each),
// without even a "waiting" event. So the player watches the clock itself:
// time frozen while the browser is still downloading means it's loading.
// The overlay goes the moment the clock moves again.
const STALL_TICK_MS = 200;
const STALL_SHOW_MS = 800; // frozen this long → show the loading overlay
const STALL_SLOW_MS = 6000; // frozen this long in all → say the server is slow
const STALL_CLEAR_MS = 1200; // smooth playback this long → that total resets
const STALL_RETRY_MS = 20000; // frozen this long in one go → reload the video

// what happens when a song finishes — one button cycles through these:
// stop (grey shuffle) → shuffle (violet) → repeat this song → stop
const PLAY_MODES = {
  off: {
    next: "shuffle",
    icon: "shuffle",
    active: false,
    label: "Berhenti setelah lagu selesai",
  },
  shuffle: {
    next: "repeat",
    icon: "shuffle",
    active: true,
    label: "Acak: lanjut ke lagu acak setelah selesai",
  },
  repeat: {
    next: "off",
    icon: "repeatOne",
    active: true,
    label: "Ulangi lagu ini",
  },
};

// the whole tab is one screen-sized panel with the song list scrolling
// inside it (desktop: list left, player right; phones: player on top, list
// below) — AnimeDetail's "Sinema" button scrolls it up under the navbar so
// the tabs above and footer below are out of view.
// --navbar-height is published by Navbar.
const PANEL_STYLE = {
  "--themes-panel-h": "calc(100dvh - var(--navbar-height, 73px) - 2rem)",
};

function artistLine(artists) {
  return artists
    .map((a) => (a.as ? `${a.name} (sebagai ${a.as})` : a.name))
    .join(", ");
}

// AnimeThemes lists exact episodes ("2-3, 6, 8-9, 12, 14, 17, 19") — the
// card only has room for the overall span ("Eps 2–19")
function episodeSpan(episodes) {
  const numbers = (episodes.match(/\d+/g) ?? []).map(Number);
  if (!numbers.length) return `Eps ${episodes}`;
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `Eps ${first}` : `Eps ${first}–${last}`;
}

// the video's length once the browser knows it, else 0. Safari (iPhone)
// sometimes hasn't worked out a WebM's length yet at "loadedmetadata"
// (NaN/Infinity there) and only reports it later — so the player re-reads
// it on durationchange and timeupdate too. AnimeThemes' API doesn't list
// lengths, so the browser is the only source.
function knownDuration(video) {
  const d = video.duration;
  return Number.isFinite(d) && d > 0 ? d : 0;
}

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

function PlayIcon({ playing, className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-violet-600`} aria-hidden>
      {playing ? (
        <>
          <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
          <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
        </>
      ) : (
        <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
      )}
    </svg>
  );
}

// stroke icons for the control row
function ControlIcon({ name, className = "h-5 w-5" }) {
  const paths = {
    shuffle: (
      <>
        <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
        <path d="m18 2 4 4-4 4" />
        <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
        <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
        <path d="m18 14 4 4-4 4" />
      </>
    ),
    repeatOne: (
      <>
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        <path d="M11 10h1v4" />
      </>
    ),
    prev: (
      <>
        <path d="M19 20 9 12l10-8z" />
        <path d="M5 19V5" />
      </>
    ),
    next: (
      <>
        <path d="m5 4 10 8-10 8z" />
        <path d="M19 5v14" />
      </>
    ),
    volume: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 5a10 10 0 0 1 0 14" />
      </>
    ),
    muted: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4z" />
        <path d="m22 9-6 6" />
        <path d="m16 9 6 6" />
      </>
    ),
    fullscreen: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

function ThemeCard({ theme, entry, active, playing, hidden, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={playing ? `Jeda ${theme.slug}` : `Putar ${theme.slug}`}
      aria-current={active ? "true" : undefined}
      title={hidden ? SPOILER_TITLE : undefined}
      style={active ? gradientBorderStyle("#f6effc") : CARD_BORDER}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left shadow-sm transition hover:opacity-85"
    >
      <span
        style={gradientBorderStyle("#ffffff")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      >
        <PlayIcon playing={playing} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-900">
          <span className="mr-1.5 text-xs font-semibold text-violet-600">
            {theme.slug}
          </span>
          <span className={hidden ? `px-1 ${SPOILER_HIDDEN}` : ""}>
            {theme.title}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500">
          {artistLine(theme.artists) || "-"}
        </span>
      </span>
      {/* compact episode span; the exact list is in the tooltip */}
      {entry.episodes && (
        <span
          title={`Episode ${entry.episodes}`}
          className="shrink-0 text-right text-xs tabular-nums text-zinc-400"
        >
          {episodeSpan(entry.episodes)}
        </span>
      )}
    </button>
  );
}

// `ref` (a plain prop in React 19) points at the full-height panel, so the
// page can scroll it into place
export default function AnimeThemes({ anilistId, ref }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["animethemes", anilistId],
    queryFn: () => getAnimeThemes(anilistId),
    // OP/ED lists barely ever change — no need to re-ask every 5 minutes
    staleTime: 1000 * 60 * 60,
  });

  // { themeId, entryId } loaded in the player; null = nothing picked yet,
  // in which case the first song is loaded (but not played)
  const [selected, setSelected] = useState(null);
  // flips once the user plays anything — from then on picking another song
  // starts it right away
  const [engaged, setEngaged] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playMode, setPlayMode] = useState("off"); // key of PLAY_MODES
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failedEntryId, setFailedEntryId] = useState(null);
  // true while waiting to retry a video the server turned away
  const [retrying, setRetrying] = useState(false);
  // 0 = fine, 1 = loading, 2 = loading for a long while (see STALL_*)
  const [stall, setStall] = useState(0);
  // progress-bar position while it's being dragged (null otherwise)
  const [scrubTime, setScrubTime] = useState(null);
  // spoiler-flagged songs stay blurred until picked
  const [revealed, setRevealed] = useState(() => new Set());
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const retryRef = useRef({ entryId: null, attempts: 0 });
  const retryTimerRef = useRef(null);
  // where to pick back up after a retry reloads the video mid-song
  const resumeAtRef = useRef(0);

  // don't fire a pending retry after the tab has been closed
  useEffect(() => () => clearTimeout(retryTimerRef.current), []);

  // the custom controls below the video replace the browser's own — but in
  // fullscreen those are out of reach, so the native ones come back there
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement === videoRef.current);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // stall watch (see STALL_*). "Wants to play" = playing, or a freshly
  // picked song waiting for autoplay; it only counts as loading while the
  // browser is actually fetching, so a video that's just waiting for a tap
  // (e.g. iOS blocking autoplay) doesn't get a spinner
  useEffect(() => {
    let video = null;
    let last = 0;
    let frozenMs = 0; // stuck on one frame (any movement resets it)
    let smoothMs = 0; // playing without a hitch since the last freeze
    let waitedMs = 0; // frozen time in all, across short bursts of playback
    const timer = setInterval(() => {
      // background tabs throttle timers and may hold muted video back
      if (document.hidden) return;
      const v = videoRef.current;
      if (v !== video) {
        video = v;
        last = v?.currentTime ?? 0;
        frozenMs = smoothMs = waitedMs = 0;
      }
      if (!v) {
        setStall(0);
        return;
      }

      const advanced = v.currentTime - last;
      last = v.currentTime;
      const wantsToPlay =
        !v.paused ||
        (v.autoplay && v.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA);
      const fetching = v.networkState === HTMLMediaElement.NETWORK_LOADING;
      // Chrome nudges the clock by a hair (even backwards) while buffering,
      // so tiny changes count as standing still; a tick of real playback
      // moves it ~0.2s
      const still = Math.abs(advanced) < 0.05;
      const stuck = still && wantsToPlay && fetching;
      // normal playback, not a seek jump
      const moving = advanced >= 0.05 && advanced < 1;

      frozenMs = stuck ? frozenMs + STALL_TICK_MS : 0;
      smoothMs = moving ? smoothMs + STALL_TICK_MS : 0;
      // the server is answering again
      if (moving) retryRef.current.attempts = 0;

      // on a slow connection playback creeps along in short bursts — the
      // frozen time adds up across those, so the "slow server" text doesn't
      // start over at every burst; only smooth playback clears it
      if (!wantsToPlay || (!stuck && !moving) || smoothMs >= STALL_CLEAR_MS) {
        waitedMs = 0;
      } else if (stuck) {
        waitedMs += STALL_TICK_MS;
      }

      if (frozenMs >= STALL_RETRY_MS) {
        frozenMs = waitedMs = 0;
        // hand it to the same retry path as a failed load (onError)
        v.dispatchEvent(new Event("error"));
      }
      setStall(
        frozenMs < STALL_SHOW_MS ? 0 : waitedMs >= STALL_SLOW_MS ? 2 : 1,
      );
    }, STALL_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // loading and the song list render inside a full-height shell, so the
  // page is already tall enough to scroll the panel into place while still
  // loading; the error/empty messages don't need the height
  const shell = (children, { full = false } = {}) => (
    <div
      ref={ref}
      style={PANEL_STYLE}
      className={`scroll-mt-[calc(var(--navbar-height,73px)_+_1rem)] ${
        full ? "min-h-[var(--themes-panel-h)]" : ""
      }`}
    >
      {children}
    </div>
  );

  if (isLoading) {
    return shell(<Spinner label="Memuat lagu..." />, { full: true });
  }

  if (isError) {
    return shell(
      <div className="flex flex-col items-center gap-2 py-10">
        <p className="text-sm text-red-500">Gagal memuat daftar lagu.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="cursor-pointer rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
        >
          Coba lagi
        </button>
      </div>,
    );
  }

  const themes = data?.themes ?? [];

  if (!themes.length) {
    return shell(
      <p className="py-10 text-center text-sm text-zinc-400">
        Belum ada data opening/ending untuk anime ini.
      </p>,
    );
  }

  // before anything's picked, preload the first song that isn't a spoiler
  const currentTheme =
    themes.find((t) => t.id === selected?.themeId) ??
    themes.find((t) => !t.entries[0].spoiler) ??
    themes[0];
  const currentEntry =
    currentTheme.entries.find((e) => e.id === selected?.entryId) ??
    currentTheme.entries[0];
  const currentIndex = themes.indexOf(currentTheme);
  const duration = mediaDuration || 0;

  // AnimeThemes flags spoiler/NSFW per version (e.g. only one of Toradora's
  // four "Orange" cuts is a spoiler)
  function isHidden(theme, entry) {
    return entry.spoiler && !revealed.has(theme.id);
  }

  function reveal(themeId) {
    setRevealed((prev) => new Set(prev).add(themeId));
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function select(theme, entry, { scroll = true } = {}) {
    reveal(theme.id);
    setFailedEntryId(null);
    setSelected({ themeId: theme.id, entryId: entry.id });

    if (entry.id === currentEntry.id) {
      // same video already loaded — act as play/pause
      togglePlayback();
      return;
    }

    setEngaged(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setMediaDuration(0);
    // a pending retry belongs to the old video
    clearTimeout(retryTimerRef.current);
    setRetrying(false);
    resumeAtRef.current = 0;
    // on phones the player sits above the list — bring it (and with it the
    // whole panel) up under the navbar, same as the cinema button
    if (scroll && window.matchMedia("(max-width: 1023px)").matches) {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function restart() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  function goNext() {
    if (playMode === "shuffle" && themes.length > 1) {
      const others = themes.filter((t) => t.id !== currentTheme.id);
      const pick = others[Math.floor(Math.random() * others.length)];
      select(pick, pick.entries[0], { scroll: false });
      return;
    }
    const next = themes[currentIndex + 1];
    if (next) select(next, next.entries[0], { scroll: false });
    else if (themes.length === 1) restart();
  }

  function goPrev() {
    const prev = themes[currentIndex - 1];
    if (currentTime > RESTART_THRESHOLD || !prev) {
      restart();
      return;
    }
    select(prev, prev.entries[0], { scroll: false });
  }

  function handleEnded() {
    setIsPlaying(false);
    // "off" just stops; "shuffle" moves on to a random song. ("repeat" never
    // gets here — the video's own `loop` replays it.)
    if (playMode === "shuffle") goNext();
  }

  function handleVideoError(e) {
    const entryId = currentEntry.id;
    const state = retryRef.current;
    if (state.entryId !== entryId) {
      retryRef.current = { entryId, attempts: 0 };
    }

    if (retryRef.current.attempts >= RETRY_DELAYS.length) {
      setRetrying(false);
      setFailedEntryId(entryId);
      return;
    }

    const delay = RETRY_DELAYS[retryRef.current.attempts++];
    resumeAtRef.current = e.currentTarget.currentTime || resumeAtRef.current;
    setRetrying(true);
    setIsPlaying(false);
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      // the user may have moved on to another song in the meantime
      if (!video || retryRef.current.entryId !== entryId) return;
      video.load();
      if (engaged) video.play().catch(() => {});
    }, delay);
  }

  // the "Coba lagi" button after every automatic retry has failed
  function retryNow() {
    retryRef.current = { entryId: currentEntry.id, attempts: 0 };
    setFailedEntryId(null);
  }

  function toggleMute() {
    const next = !muted;
    if (videoRef.current) videoRef.current.muted = next;
    setMuted(next);
  }

  function seek(seconds) {
    if (videoRef.current) videoRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  }

  function enterFullscreen() {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
    // iOS Safari only supports fullscreen on the video element this way
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  }

  const currentHidden = isHidden(currentTheme, currentEntry);
  const failed = failedEntryId === currentEntry.id;

  return shell(
    <div className="grid h-[var(--themes-panel-h)] min-h-[420px] grid-rows-[auto_minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
      {/* player — first on mobile; on desktop it's centred in the space to
          the right of the list. Capped at 760px wide, and on short screens
          narrowed further so video + controls (~150px) still fit the panel */}
      <div
        ref={playerRef}
        className="w-full max-w-[760px] scroll-mt-[calc(var(--navbar-height,73px)_+_1rem)] lg:col-start-2 lg:row-start-1 lg:max-w-[min(760px,calc((var(--themes-panel-h)_-_150px)_*_16_/_9))] lg:self-start lg:justify-self-center"
      >
        <div className="group relative overflow-hidden rounded-2xl bg-black shadow-md">
          {failed ? (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="max-w-sm text-sm text-white/80">
                Server video lagi sibuk, jadi videonya belum bisa dimuat.
                Tunggu sebentar lalu coba lagi.
              </p>
              <button
                type="button"
                onClick={retryNow}
                className="cursor-pointer rounded-full bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:opacity-80"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                key={currentEntry.id}
                src={currentEntry.videoUrl}
                controls={isFullscreen}
                autoPlay={engaged}
                loop={playMode === "repeat"}
                muted={muted}
                playsInline
                preload="metadata"
                // in fullscreen the native controls already toggle on click —
                // handling it here too would undo their toggle
                onClick={isFullscreen ? undefined : togglePlayback}
                onPlay={() => {
                  setIsPlaying(true);
                  setEngaged(true);
                  reveal(currentTheme.id);
                }}
                onPause={() => setIsPlaying(false)}
                onEnded={handleEnded}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  video.muted = muted;
                  if (resumeAtRef.current) {
                    video.currentTime = resumeAtRef.current;
                    resumeAtRef.current = 0;
                  }
                  setRetrying(false);
                  setMediaDuration(knownDuration(video));
                }}
                onDurationChange={(e) =>
                  setMediaDuration(knownDuration(e.currentTarget))
                }
                // (the retry count resets in the stall watch once time really
                // moves — "playing" fires before any data has arrived)
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  setCurrentTime(video.currentTime);
                  // last resort if no event carried the length
                  if (!mediaDuration) setMediaDuration(knownDuration(video));
                }}
                onError={handleVideoError}
                className="aspect-video w-full cursor-pointer"
              />
              {(retrying || stall > 0) && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 px-6 text-center text-sm text-white/80">
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  {retrying
                    ? "Menunggu server video…"
                    : stall > 1
                      ? "Server video lagi lambat, tunggu sebentar…"
                      : "Memuat video…"}
                </div>
              )}
              <button
                type="button"
                onClick={enterFullscreen}
                aria-label="Layar penuh"
                className="absolute bottom-2.5 right-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-70 transition hover:bg-black/60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ControlIcon name="fullscreen" className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* song info */}
        <div className="mt-3 text-center">
          {currentHidden ? (
            <button
              type="button"
              onClick={() => reveal(currentTheme.id)}
              title={SPOILER_TITLE}
              aria-label="Tampilkan judul lagu (spoiler)"
              className="cursor-pointer font-display text-base font-semibold leading-tight sm:text-lg"
            >
              <span className={`px-1 ${SPOILER_HIDDEN}`}>
                {currentTheme.title}
              </span>
            </button>
          ) : (
            <p className="font-display text-base font-semibold leading-tight text-zinc-900 sm:text-lg">
              {currentTheme.title}
            </p>
          )}
          {currentTheme.artists.length > 0 && (
            <p className="mt-0.5 text-xs leading-tight text-zinc-500 sm:text-sm">
              {artistLine(currentTheme.artists)}
            </p>
          )}
        </div>

        {/* progress */}
        <div className="mt-3.5 flex items-center gap-3 text-xs tabular-nums text-zinc-500">
          <span className="w-10 text-left">
            {formatDuration(scrubTime ?? currentTime)}
          </span>
          {/* while dragging only the readout moves; the actual seek (a new
              request to the rate-limited media server) happens once, on
              release. Keyboard arrows still seek straight away. */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={scrubTime ?? Math.min(currentTime, duration || 0)}
            onPointerDown={() => setScrubTime(currentTime)}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (scrubTime != null) setScrubTime(value);
              else seek(value);
            }}
            onPointerUp={(e) => {
              if (scrubTime == null) return;
              seek(Number(e.currentTarget.value));
              setScrubTime(null);
            }}
            onPointerCancel={() => setScrubTime(null)}
            disabled={!duration || failed}
            aria-label="Posisi video"
            className="h-1.5 flex-1 cursor-pointer accent-violet-600 disabled:cursor-not-allowed"
          />
          <span className="w-10 text-right">{formatDuration(duration)}</span>
        </div>

        {/* controls — three columns so play stays dead centre */}
        <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center px-1">
          <button
            type="button"
            onClick={() => setPlayMode((m) => PLAY_MODES[m].next)}
            aria-label={PLAY_MODES[playMode].label}
            title={PLAY_MODES[playMode].label}
            className={`relative flex h-9 w-9 cursor-pointer items-center justify-center justify-self-start rounded-full transition hover:bg-zinc-100 ${
              PLAY_MODES[playMode].active ? "text-violet-600" : "text-zinc-500"
            }`}
          >
            <ControlIcon name={PLAY_MODES[playMode].icon} />
            {PLAY_MODES[playMode].active && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-violet-600" />
            )}
          </button>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Lagu sebelumnya"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-violet-600"
            >
              <ControlIcon name="prev" />
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              disabled={failed}
              aria-label={isPlaying ? "Jeda" : "Putar"}
              style={gradientBorderStyle("#ffffff")}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full shadow-sm transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlayIcon
                playing={isPlaying}
                className={`h-6 w-6 ${isPlaying ? "" : "ml-0.5"}`}
              />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Lagu berikutnya"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-violet-600"
            >
              <ControlIcon name="next" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Nyalakan suara" : "Matikan suara"}
            className="flex h-9 w-9 cursor-pointer items-center justify-center justify-self-end rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-violet-600"
          >
            <ControlIcon name={muted ? "muted" : "volume"} />
          </button>
        </div>
      </div>

      {/* song list — below the player on phones, left-hand column on
          desktop; either way it scrolls inside the panel, and
          overscroll-contain stops a flick at its end from scrolling the
          page on to the footer. The negative margin / padding pairs keep
          the cards' shadows from being clipped by the scroll container,
          and the wider right pair leaves a gap between the cards and the
          scrollbar while the cards still line up with the player */}
      <div className="-my-1 -ml-1 -mr-3 min-h-0 space-y-6 overflow-y-auto overscroll-contain py-1 pl-1 pr-3 [scrollbar-color:#ddd6fe_transparent] [scrollbar-width:thin] lg:col-start-1 lg:row-start-1">
        {SECTIONS.map((section) => {
          const list = themes.filter((t) => t.type === section.type);
          if (!list.length) return null;

          return (
            <section key={section.type}>
              <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                {section.label}
              </h3>
              <ul className="space-y-2.5">
                {list.map((theme) => {
                  const active = theme.id === currentTheme.id;
                  // keep the chosen version when re-clicking the active song
                  const entry = active ? currentEntry : theme.entries[0];

                  return (
                    <li key={theme.id}>
                      <ThemeCard
                        theme={theme}
                        entry={entry}
                        active={active}
                        playing={active && isPlaying}
                        hidden={isHidden(theme, entry)}
                        onSelect={() => select(theme, entry)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
