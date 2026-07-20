import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/img/logo.png";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/browse", label: "Browse", end: false },
  { to: "/my-list", label: "My List", end: false },
];

export default function Navbar() {
  const location = useLocation();
  const itemRefs = useRef([]);
  const [underline, setUnderline] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

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
    <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4 lg:px-14">
        <NavLink to="/" className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8" />
          <span className="font-display text-lg font-semibold text-zinc-900">
            Myy Anime Gwejh
          </span>
        </NavLink>

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
      </nav>
    </header>
  );
}
