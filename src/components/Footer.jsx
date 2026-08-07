import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative border-t-2 border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-1.5 px-8 py-5 text-center lg:px-14">
        <span className="font-display text-xs font-semibold text-zinc-900 sm:text-sm">
          © 2026 MyAnimeGwe. All Rights Reserved.
        </span>
        <p className="mt-1 text-[10px] text-zinc-400 sm:text-[11px]">
          Dibuat dengan <span className="text-fuchsia-500">♥</span> oleh Bagas —
          credit to myy bini Lailaaa ❤️
        </p>

        <Link
          to="/privacy"
          className="mt-3 text-[10px] text-zinc-400 underline-offset-2 transition hover:text-zinc-600 hover:underline sm:absolute sm:bottom-5 sm:right-8 sm:mt-0 sm:text-[11px] lg:right-14"
        >
          Kebijakan Privasi &gt;
        </Link>
      </div>
    </footer>
  );
}
