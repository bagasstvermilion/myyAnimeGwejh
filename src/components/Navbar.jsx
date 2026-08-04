import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/img/logo.png";
import { useAuth } from "../context/AuthContext";
import UserMenu from "./navbar/UserMenu";
import MobileNavSidebar from "./navbar/MobileNavSidebar";
import EditProfileDialog from "./dialog/EditProfileDialog";
import PhotoLightbox from "./dialog/PhotoLightbox";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    end: true,
    icon: (
      <path
        d="M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    to: "/browse",
    label: "Browse",
    end: false,
    icon: (
      <>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M21 21l-4.35-4.35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    to: "/my-list",
    label: "My List",
    end: false,
    icon: (
      <path
        d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-4-6 4V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const itemRefs = useRef([]);
  const headerRef = useRef(null);
  const [underline, setUnderline] = useState({
    left: 0,
    width: 0,
    ready: false,
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to),
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  useEffect(() => {
    const measure = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur"
      >
        <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-8 lg:px-14">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Buka menu"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden
              >
                {mobileMenuOpen ? (
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>

            <NavLink to="/" className="flex items-center gap-2">
              <img src={logo} alt="" className="h-8 w-8" />
              <span className="hidden font-display text-lg font-semibold text-zinc-900 sm:inline">
                MyAnimeGwe
              </span>
            </NavLink>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative hidden items-center gap-9 md:flex">
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

            <UserMenu
              onEditProfile={() => setEditProfileOpen(true)}
              onPreviewPhoto={() => setPhotoPreviewOpen(true)}
            />
          </div>
        </nav>
      </header>

      <MobileNavSidebar
        open={mobileMenuOpen}
        items={NAV_ITEMS}
        topOffset={headerHeight}
        onClose={() => setMobileMenuOpen(false)}
      />

      <EditProfileDialog
        open={editProfileOpen}
        user={user}
        onClose={() => setEditProfileOpen(false)}
      />

      <PhotoLightbox
        open={photoPreviewOpen}
        src={user?.user_metadata?.avatar_url}
        onClose={() => setPhotoPreviewOpen(false)}
      />
    </>
  );
}
