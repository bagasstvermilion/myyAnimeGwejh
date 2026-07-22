import { Link } from "react-router-dom";
import PosterCollage from "./PosterCollage";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/2 h-[680px] w-[680px] -translate-y-1/2 rounded-full bg-gradient-to-br from-pink-400 to-violet-600 opacity-10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-pink-300 to-violet-400 opacity-10 blur-[100px]"
      />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-8 py-20 lg:grid-cols-2 lg:px-14 lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            Personal Anime Tracker
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl">
            Catat semua anime yang pernah kamu tonton
          </h1>
          <p className="mt-6 max-w-md text-base text-zinc-500">
            Cari, simpan, dan pantau progress nonton anime kamu sendiri. Lengkap
            sampai ke detail informasi dan jadwalnya!
          </p>
          <p className="mt-4 max-w-md border-l-2 border-violet-300 pl-4 font-display text-base italic text-zinc-400">
            "List anime kamu, dimana dan kapan saja."
          </p>

          <div className="mt-10 flex items-center gap-3">
            <Link
              to="/browse"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Mulai cari anime
            </Link>
            <Link
              to="/my-list"
              className="rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
            >
              Lihat list-ku
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <PosterCollage />
        </div>
      </div>
    </section>
  );
}
