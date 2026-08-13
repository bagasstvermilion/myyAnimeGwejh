import { useState } from "react";
import { parseBioSegments } from "../lib/characterInfo";

// renders text that may contain ~!spoiler!~ segments as plain text mixed
// with click-to-reveal blurred spans — shared by BioText and StatRows so
// spoiler-tagged stat values (Affiliations, etc.) get the same treatment
// as spoiler text in the bio itself, instead of leaking the raw markers
function SpoilerSegments({
  text,
  spoilerRevealedClassName = "",
  spoilerHiddenClassName = "select-none bg-zinc-200 text-transparent",
  // BioText wants each spoiler tag to read as its own paragraph (block +
  // margin) since a bio can have several unrelated ones back to back.
  // StatRows wants the opposite: "Label: " and a short spoiler value
  // belong on the same line, so it passes inline to skip the block wrap
  inline = false,
}) {
  const [revealed, setRevealed] = useState(() => new Set());
  const segments = parseBioSegments(text);

  function toggle(i) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return segments.map((seg, i) => {
    if (!seg.spoiler) return <span key={i}>{seg.text}</span>;

    const clickable = (
      <span
        role="button"
        tabIndex={0}
        onClick={() => toggle(i)}
        title={revealed.has(i) ? undefined : "Spoiler! Klik untuk reveal"}
        className={
          revealed.has(i)
            ? `cursor-pointer transition ${spoilerRevealedClassName}`
            : `cursor-pointer rounded px-1 transition [-webkit-box-decoration-break:clone] [box-decoration-break:clone] ${spoilerHiddenClassName}`
        }
      >
        {seg.text}
      </span>
    );

    if (inline) return <span key={i}>{clickable}</span>;

    // block+margin so this spoiler tag reads as its own paragraph,
    // separate from whatever spoiler segment comes next — box-decoration
    // on the inner span still gives a tag spanning multiple lines (AniList
    // grouping "True Devil Fruit" + "...Type" under one tag) one blurred
    // box PER visual line instead of a single merged rectangle
    return (
      <span
        key={i}
        className={`block first:mt-0 ${revealed.has(i) ? "" : "mt-2"}`}
      >
        {clickable}
      </span>
    );
  });
}

export function BioText({
  text,
  className,
  spoilerRevealedClassName,
  spoilerHiddenClassName,
}) {
  if (!text) return null;

  return (
    <p className={className}>
      <SpoilerSegments
        text={text}
        spoilerRevealedClassName={spoilerRevealedClassName}
        spoilerHiddenClassName={spoilerHiddenClassName}
      />
    </p>
  );
}

export function AliasLine({
  character,
  showSpoiler,
  setShowSpoiler,
  className,
  spoilerRevealedClassName = "text-white/50",
  spoilerHiddenClassName = "select-none bg-white/25 text-transparent",
}) {
  if (
    !character.nativeName &&
    !character.alternative?.length &&
    !character.alternativeSpoiler?.length
  ) {
    return null;
  }

  return (
    <p className={className}>
      {[character.nativeName, ...(character.alternative ?? [])]
        .filter(Boolean)
        .join(", ")}
      {character.alternativeSpoiler?.length > 0 && (
        <>
          {character.nativeName || character.alternative?.length ? ", " : ""}
          <span
            role="button"
            tabIndex={0}
            onClick={() => setShowSpoiler((s) => !s)}
            title={showSpoiler ? undefined : "Spoiler! Klik untuk reveal"}
            className={`cursor-pointer rounded transition ${
              showSpoiler ? spoilerRevealedClassName : spoilerHiddenClassName
            }`}
          >
            {character.alternativeSpoiler.join(", ")}
          </span>
        </>
      )}
    </p>
  );
}

// stacked=true renders each stat as a label-above-value block (like
// AnimeDetail's Studio/Sumber/Tayang sidebar) instead of one "Label: value"
// line — used for the desktop sidebar, while the inline form still suits
// the tighter mobile layout
export function StatRows({
  birthday,
  character,
  extraStats,
  className,
  labelClassName,
  valueClassName,
  spoilerRevealedClassName,
  spoilerHiddenClassName,
  stacked = false,
}) {
  const rows = [
    birthday && { label: "Birthday", value: birthday },
    character.age && { label: "Age", value: character.age },
    character.gender && { label: "Gender", value: character.gender },
    ...extraStats,
  ].filter(Boolean);

  if (stacked) {
    return (
      <div className={className}>
        {rows.map((row) => (
          <div key={row.label}>
            <p className={labelClassName}>{row.label}</p>
            <p className={`mt-0.5 ${valueClassName}`}>
              <SpoilerSegments
                text={row.value}
                spoilerRevealedClassName={spoilerRevealedClassName}
                spoilerHiddenClassName={spoilerHiddenClassName}
                inline
              />
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {rows.map((row) => (
        <p key={row.label}>
          <span className={labelClassName}>{row.label}: </span>
          <span className={valueClassName}>
            <SpoilerSegments
              text={row.value}
              spoilerRevealedClassName={spoilerRevealedClassName}
              spoilerHiddenClassName={spoilerHiddenClassName}
              inline
            />
          </span>
        </p>
      ))}
    </div>
  );
}
