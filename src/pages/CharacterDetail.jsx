import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCharacterById } from "../lib/anilist";
import { gradientBorderStyle } from "../lib/gradientBorder";
import { useMetaTags } from "../lib/useMetaTags";
import { translateText } from "../lib/translate";
import translateIcon from "../assets/img/translate-icon.png";
import {
  formatBirthday,
  formatFavourites,
  cleanBio,
  extractStats,
} from "../lib/characterInfo";
import { AliasLine, StatRows, BioText } from "../components/CharacterInfoParts";
import Spinner from "../components/Spinner";

// same translate-toggle button as AnimeDetail's Sinopsis section
function TranslateButton({ onClick, isTranslating, translated }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isTranslating}
      aria-label={translated ? "Lihat teks asli" : "Terjemahkan biography"}
      className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 ${
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
  );
}

// same card treatment as AnimeDetail's Skor/Rank/Episode row
function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-zinc-100 sm:p-4">
      <dt className="text-[10px] uppercase tracking-wide text-zinc-400 sm:text-xs">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-900 sm:text-lg">
        {value}
      </dd>
    </div>
  );
}

export default function CharacterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [translated, setTranslated] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);

  // React Router doesn't reset scroll position on navigation — without
  // this, the page opens wherever the previous page happened to be
  // scrolled to instead of at the top. also reset the translation state
  // whenever a different character is opened
  useEffect(() => {
    window.scrollTo(0, 0);
    setTranslated(null);
    setTranslateError(false);
  }, [id]);

  const {
    data: character,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["character", id],
    queryFn: () => getCharacterById(id),
  });

  useMetaTags(
    character ? `${character.name} - MyAnimeGwe` : undefined,
    character?.description ? character.description.slice(0, 160) : undefined,
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
        <Spinner label="Memuat detail karakter..." />
      </div>
    );
  }

  if (isError || !character) {
    return (
      <p className="mx-auto max-w-[1440px] px-4 py-12 text-red-500 sm:px-8 lg:px-14">
        Gagal memuat detail karakter.
      </p>
    );
  }

  const birthday = formatBirthday(character.dateOfBirth);
  const favourites = formatFavourites(character.favourites);
  const { stats: extraStats, rest: bioText } = extractStats(
    character.description,
  );
  const bio = cleanBio(bioText);

  async function handleTranslate() {
    if (translated) {
      setTranslated(null);
      return;
    }

    setIsTranslating(true);
    setTranslateError(false);
    try {
      const result = await translateText(bio);
      setTranslated(result);
    } catch {
      setTranslateError(true);
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] pb-16">
      {/* mobile: banner strip up top with the portrait popping over its
          bottom edge — like AniList's own anime detail layout */}
      <div className="sm:hidden">
        <div className="relative aspect-[2/1] w-full overflow-hidden">
          <img
            src={character.image}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[0.5]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/75" />
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="absolute left-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden
            >
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-end justify-between gap-3 px-4">
          <div className="relative z-10 -mt-16 w-24 shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10">
            <img
              src={character.image}
              alt={character.name}
              draggable={false}
              className="w-full"
            />
          </div>
          {favourites && (
            <span className="mb-1 flex shrink-0 items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-600">
              ♥ {favourites}
            </span>
          )}
        </div>

        <div className="px-4 pb-2 pt-4">
          <h1 className="font-display text-xl font-semibold text-zinc-900">
            {character.name}
          </h1>
          <AliasLine
            character={character}
            showSpoiler={showSpoiler}
            setShowSpoiler={setShowSpoiler}
            className="mt-2 text-xs text-zinc-400"
            spoilerRevealedClassName="text-zinc-400"
            spoilerHiddenClassName="select-none bg-zinc-200 text-transparent"
          />
          <StatRows
            birthday={birthday}
            character={character}
            extraStats={extraStats}
            className="mt-6 space-y-1 px-2 text-xs"
            labelClassName="font-semibold text-zinc-900"
            valueClassName="text-zinc-600"
          />
        </div>
      </div>

      {/* sm+: banner as a full-bleed blurred backdrop behind the info row,
          portrait + info side by side */}
      <div className="hidden px-4 pt-8 sm:block sm:px-8 lg:px-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={gradientBorderStyle()}
          className="mb-4 inline-flex cursor-pointer items-center gap-1 rounded-full py-1.5 pl-3 pr-4 text-sm font-medium text-zinc-900 transition hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <defs>
              <linearGradient
                id="character-back-chevron-gradient"
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
              stroke="url(#character-back-chevron-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Kembali
        </button>

        <div className="relative flex items-end gap-8 overflow-hidden rounded-2xl p-12">
          <img
            src={character.image}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.38]"
          />
          <img
            src={character.image}
            alt={character.name}
            draggable={false}
            className="relative h-64 w-48 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
          />
          <div className="relative min-w-0 flex-1 pb-1">
            {favourites && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-pink-200 backdrop-blur-sm">
                ♥ {favourites}
              </span>
            )}
            <h1 className="font-display text-4xl font-semibold leading-tight text-white">
              {character.name}
            </h1>
            <AliasLine
              character={character}
              showSpoiler={showSpoiler}
              setShowSpoiler={setShowSpoiler}
              className="mt-3 text-sm text-white/50"
            />
          </div>
        </div>

        {(birthday || character.age || character.gender) && (
          <dl className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            {birthday && <InfoCard label="Birthday" value={birthday} />}
            {character.age && <InfoCard label="Age" value={character.age} />}
            {character.gender && (
              <InfoCard label="Gender" value={character.gender} />
            )}
          </dl>
        )}
      </div>

      {/* mobile: just the biography — stats already shown up top */}
      <div className="px-6 pb-6 pt-5 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Biography
          </h2>
          {bio && (
            <TranslateButton
              onClick={handleTranslate}
              isTranslating={isTranslating}
              translated={translated}
            />
          )}
        </div>
        {bio ? (
          <BioText
            text={translated || bio}
            className="mt-4 whitespace-pre-line text-xs leading-relaxed text-zinc-600"
          />
        ) : (
          <p className="mt-4 text-sm text-zinc-400">
            Belum ada deskripsi karakter.
          </p>
        )}
        {translateError && (
          <p className="mt-2 text-xs text-red-500">
            Gagal menerjemahkan, coba lagi.
          </p>
        )}
      </div>

      {/* sm+: biography + stats sidebar, same layout as AnimeDetail's
          synopsis + studio info */}
      <div className="hidden gap-10 px-8 pb-6 pt-8 sm:grid lg:grid-cols-[1fr_260px] lg:px-14">
        <div className="mt-6">
          <div className="flex max-w-2xl items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              Biography
            </h2>
            {bio && (
              <TranslateButton
                onClick={handleTranslate}
                isTranslating={isTranslating}
                translated={translated}
              />
            )}
          </div>
          {bio ? (
            <BioText
              text={translated || bio}
              className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-zinc-600"
            />
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              Belum ada deskripsi karakter.
            </p>
          )}
          {translateError && (
            <p className="mt-2 text-xs text-red-500">
              Gagal menerjemahkan, coba lagi.
            </p>
          )}
        </div>

        <aside className="mt-14">
          <StatRows
            stacked
            birthday={null}
            character={{}}
            extraStats={extraStats}
            className="space-y-4 text-xs sm:text-sm"
            labelClassName="text-zinc-400"
            valueClassName="font-medium text-zinc-900"
          />
        </aside>
      </div>
    </div>
  );
}
