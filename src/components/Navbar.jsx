import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/img/logo.png";
import userLogo from "../assets/img/user-logo.png";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/browse", label: "Browse", end: false },
  { to: "/my-list", label: "My List", end: false },
];

function displayNameFromEmail(email) {
  const local = email.split("@")[0];
  return local
    .replace(/[._]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Navbar() {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const itemRefs = useRef([]);
  const [underline, setUnderline] = useState({
    left: 0,
    width: 0,
    ready: false,
  });
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

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to),
  );

  useEffect(() => {
    const measure = () => {
      const el = itemRefs.current[activeIndex];
      if (el)
        setUnderline({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4 lg:px-14">
        <NavLink to="/" className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8" />
          <span className="font-display text-lg font-semibold text-zinc-900">
            Myy Anime Gwejh
          </span>
        </NavLink>

        <div className="flex items-center gap-8">
          <div className="relative flex items-center gap-9">
            {NAV_ITEMS.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                ref={(el) => (itemRefs.current[i] = el)}
                className={({ isActive }) =>
                  `pb-1.5 text-sm font-medium transition ${
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-violet-600 transition-all duration-300 ease-out"
              style={{
                left: underline.left,
                width: underline.width,
                opacity: underline.ready ? 1 : 0,
              }}
            />
          </div>

          <div ref={menuRef} className="relative border-l border-zinc-100 pl-6">
            {!user && (
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
                <span className="text-sm font-medium text-zinc-700">
                  Masuk
                </span>
              </Link>
            )}

            {user && (
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex cursor-pointer items-center gap-2"
              >
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
                <span className="max-w-[140px] truncate text-sm font-medium text-zinc-700">
                  {user.email}
                </span>
              </button>
            )}

              {user && menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-zinc-100">
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-zinc-100/70 px-4 py-5 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
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
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {displayNameFromEmail(user.email)}
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
                        Dashboard Admin
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
        </div>
      </nav>
    </header>
  );
}
