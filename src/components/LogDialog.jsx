import { useEffect, useRef, useState } from "react";

const DOT_SPACING_PX = 8; // h-1 (4px) + gap-1 (4px)

function LogConnector() {
  const ref = useRef(null);
  const [count, setCount] = useState(2);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const dots = Math.round(entry.contentRect.height / DOT_SPACING_PX);
      setCount(Math.max(2, dots));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-1"
    >
      {Array.from({ length: count }).map((_, dotIndex) => (
        <span
          key={dotIndex}
          className="h-1 w-1 shrink-0 rounded-full bg-zinc-300"
        />
      ))}
    </div>
  );
}

function formatLogDate(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function isUnbanLog(log) {
  return log.action ? log.action === "unban" : log.message.includes("unban");
}

function isPermanentBanLog(log) {
  return log.message.includes("permanen");
}

function nodeColor(log) {
  if (isUnbanLog(log)) return "bg-emerald-400";
  if (isPermanentBanLog(log)) return "bg-red-500";
  return "bg-amber-400";
}

export default function LogDialog({ open, email, logs, onClose }) {
  if (!open) return null;

  const ordered = [...logs].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl ring-1 ring-zinc-100">
        <h3 className="font-display text-lg font-semibold text-zinc-900">
          Log Aksi
        </h3>
        <p className="mt-1 text-sm text-zinc-500">{email}</p>

        <div className="mt-4 max-h-[28rem] overflow-y-auto">
          {ordered.length === 0 && (
            <p className="text-sm text-zinc-400">Belum ada aksi tercatat.</p>
          )}
          {ordered.map((log, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-6 items-center">
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 border-zinc-900 ${nodeColor(
                      log,
                    )}`}
                  />
                </div>
                {i < ordered.length - 1 && <LogConnector />}
              </div>
              <p className="pb-8 text-sm leading-6 text-zinc-700">
                {formatLogDate(log.at)} : {log.message}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
