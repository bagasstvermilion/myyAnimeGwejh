import { NavLink } from "react-router-dom";

export default function MobileNavSidebar({ open, items, topOffset, onClose }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      style={{ top: topOffset }}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`absolute left-0 top-0 flex h-full w-48 max-w-[65vw] flex-col gap-1 bg-white p-3 shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
              {item.icon}
            </svg>
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
