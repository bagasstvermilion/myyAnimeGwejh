import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { displayName } from "../../lib/avatar";
import userLogo from "../../assets/img/user-logo.png";

export default function UserMenu({ onEditProfile, onPreviewPhoto }) {
  const { user, isAdmin, role, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url;

  if (!user) {
    return (
      <div className="border-l border-zinc-100 pl-6">
        <Link to="/login" className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-6 w-6 shrink-0 bg-gradient-to-br from-pink-400 to-violet-600"
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
          <span className="text-sm font-medium text-zinc-700">Masuk</span>
        </Link>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative border-l border-zinc-100 pl-6">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-2"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="h-6 w-6 shrink-0 bg-gradient-to-br from-pink-400 to-violet-600"
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
        )}
        <span className="max-w-[140px] truncate text-sm font-medium text-zinc-700">
          {displayName(user)}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-zinc-100">
          <div className="relative flex flex-col items-center gap-2 rounded-2xl bg-zinc-100/70 px-4 py-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEditProfile();
              }}
              aria-label="Edit profil"
              className="absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-violet-600 transition hover:bg-violet-100"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={onPreviewPhoto}
                  aria-label="Lihat foto profil"
                  className="cursor-pointer"
                >
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover transition-opacity hover:opacity-80"
                  />
                </button>
              ) : (
                <span
                  aria-hidden
                  className="h-8 w-8 bg-gradient-to-br from-pink-400 to-violet-600"
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
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {displayName(user)}
              </p>
              <p className="mt-0.5 max-w-[200px] truncate text-xs text-violet-600">
                {user.email}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="p-2">
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 shrink-0"
                  aria-hidden
                >
                  <path
                    d="M4 13h6V4H4v9ZM4 20h6v-4H4v4ZM14 20h6v-9h-6v9ZM14 4v4h6V4h-6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {role === "moderator" ? "Dashboard Moderator" : "Dashboard Admin"}
              </Link>
            </div>
          )}

          <div className="my-2 h-px bg-zinc-100" />

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              signOut();
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 shrink-0"
              aria-hidden
            >
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
