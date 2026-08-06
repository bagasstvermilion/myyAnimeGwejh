import { useEffect, useRef, useState } from "react";
import { gradientBorderStyle } from "../lib/gradientBorder";

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  panelAlign = "right",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function renderOptions() {
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const value = opt.value ?? opt;
          const text = opt.label ?? opt;
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              style={active ? gradientBorderStyle("#f6effc") : undefined}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "text-zinc-900"
                  : "text-zinc-700 ring-1 ring-zinc-200 hover:ring-violet-300"
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={gradientBorderStyle(selected.length ? "#f6effc" : "#fafafa")}
        className="flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-zinc-900 transition hover:opacity-80 sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-sm"
      >
        {label}
        {/* fixed width (not just reserved-when-empty) so the button never
            resizes — otherwise it still shifts every time the count's
            digit count changes, e.g. going from (1) to (2) to (10) */}
        <span
          className={`inline-block w-8 text-center ${selected.length ? "" : "invisible"}`}
        >
          ({selected.length || 1})
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`msf-chevron-${label}`}
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
            d="M6 9l6 6 6-6"
            stroke={`url(#msf-chevron-${label})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* mobile: centered modal instead of an anchored dropdown — a
              panel wide enough to lay options out horizontally can't be
              reliably anchored under either button without spilling past
              a screen edge, so it just centers on the viewport instead */}
          <div
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 sm:hidden"
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-zinc-100"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100"
                >
                  ✕
                </button>
              </div>
              {renderOptions()}
            </div>
          </div>

          {/* sm+: original anchored dropdown */}
          <div
            className={`absolute z-20 mt-2 hidden w-72 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-zinc-100 sm:block ${
              panelAlign === "left" ? "left-0" : "right-0"
            }`}
          >
            {renderOptions()}
          </div>
        </>
      )}
    </div>
  );
}
