import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const SIZE = 56;
const MARGIN = 12;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function AssistiveTouch() {
  const { user, role } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - SIZE - MARGIN,
    y: window.innerHeight - SIZE - 96,
  }));
  const [viewport, setViewport] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const [copied, setCopied] = useState(false);
  const dragRef = useRef({ dragging: false, moved: false, offsetX: 0, offsetY: 0 });
  const rootRef = useRef(null);

  useEffect(() => {
    function handleResize() {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setPos((p) => ({
        x: clamp(p.x, MARGIN, window.innerWidth - SIZE - MARGIN),
        y: clamp(p.y, MARGIN, window.innerHeight - SIZE - MARGIN),
      }));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePointerMove(e) {
    if (!dragRef.current.dragging) return;
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    dragRef.current.moved = true;
    setPos({
      x: clamp(point.clientX - dragRef.current.offsetX, MARGIN, window.innerWidth - SIZE - MARGIN),
      y: clamp(point.clientY - dragRef.current.offsetY, MARGIN, window.innerHeight - SIZE - MARGIN),
    });
  }

  function handlePointerUp() {
    dragRef.current.dragging = false;
    window.removeEventListener("mousemove", handlePointerMove);
    window.removeEventListener("mouseup", handlePointerUp);
    window.removeEventListener("touchmove", handlePointerMove);
    window.removeEventListener("touchend", handlePointerUp);
    if (!dragRef.current.moved) setOpen((o) => !o);
  }

  function handlePointerDown(e) {
    const point = e.touches ? e.touches[0] : e;
    dragRef.current = {
      dragging: true,
      moved: false,
      offsetX: point.clientX - pos.x,
      offsetY: point.clientY - pos.y,
    };
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
  }

  if (role !== "tester") return null;

  const openUp = pos.y > viewport.h / 2;
  const openLeft = pos.x > viewport.w / 2;

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function clearCacheAndReload() {
    queryClient.clear();
    window.location.reload();
  }

  return (
    <div ref={rootRef} className="fixed z-[100]" style={{ left: pos.x, top: pos.y }}>
      <button
        type="button"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        aria-label="Assistive Touch — mode debugging"
        className="flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-600 text-white shadow-xl transition active:cursor-grabbing active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="white" strokeWidth="2" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute w-64 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-zinc-100 ${
            openUp ? "bottom-16" : "top-16"
          } ${openLeft ? "right-0" : "left-0"}`}
        >
          <div className="rounded-xl bg-zinc-50 p-3 text-xs">
            <p className="font-semibold text-zinc-900">{user?.email}</p>
            <p className="mt-1 text-zinc-500">Role: {role}</p>
            <p className="mt-0.5 text-zinc-500">Path: {location.pathname}</p>
            <p className="mt-0.5 text-zinc-500">
              Viewport: {viewport.w}×{viewport.h}
            </p>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Reload halaman
            </button>
            <button
              type="button"
              onClick={clearCacheAndReload}
              className="cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Clear cache & reload
            </button>
            <button
              type="button"
              onClick={copyUrl}
              className="cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              {copied ? "Tersalin!" : "Copy URL halaman"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
