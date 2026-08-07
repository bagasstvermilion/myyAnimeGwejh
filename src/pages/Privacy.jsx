import { useNavigate } from "react-router-dom";
import { gradientBorderStyle } from "../lib/gradientBorder";
import { useMetaTags } from "../lib/useMetaTags";

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-zinc-900">
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  const navigate = useNavigate();

  useMetaTags(
    "Kebijakan Privasi - MyAnimeGwe",
    "Kebijakan privasi MyAnimeGwe: data apa yang dikumpulkan, cara dipakai, dan layanan pihak ketiga yang terlibat.",
  );

  return (
    <div className="px-4 py-12 sm:px-8 lg:px-14">
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={gradientBorderStyle()}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full py-1.5 pl-3 pr-4 text-sm font-medium text-zinc-900 transition hover:opacity-80"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <defs>
            <linearGradient
              id="privacy-back-chevron-gradient"
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
            d="M15 5l-7 7 7 7"
            stroke="url(#privacy-back-chevron-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Kembali
      </button>

      <div className="mx-auto max-w-2xl">
        <h1 className="mt-6 font-display text-2xl font-semibold text-zinc-900 sm:text-3xl">
          Kebijakan Privasi
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Terakhir diperbarui: 6 Agustus 2026
        </p>

        <p className="mt-6 text-sm leading-relaxed text-zinc-600">
          MyAnimeGwe ("kami") adalah aplikasi pencatat anime pribadi. Halaman
          ini menjelaskan data apa yang kami kumpulkan dari kamu, kenapa, dan
          gimana cara kamu bisa mengontrolnya.
        </p>

        <Section title="1. Data yang Kami Kumpulkan">
          <p>Saat kamu daftar dan pakai MyAnimeGwe, kami menyimpan:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Alamat email dan password (di-hash, gak disimpan mentah)</li>
            <li>
              Nama tampilan dan foto profil, baik yang kamu isi manual atau yang
              ikut kebawa otomatis dari akun Google kalau kamu masuk pakai
              Google Sign-In
            </li>
            <li>
              Daftar anime yang kamu simpan (judul, status tonton, progress
              episode)
            </li>
            <li>
              Data teknis dasar seperti alamat IP dan info browser, buat
              keperluan keamanan dan analitik
            </li>
          </ul>
        </Section>

        <Section title="2. Cara Data Dipakai">
          <ul className="list-disc space-y-1 pl-5">
            <li>Autentikasi dan menjaga sesi login kamu tetap aman</li>
            <li>Nampilin dan ngelola daftar anime pribadi kamu</li>
            <li>
              Mencegah penyalahgunaan akun (misalnya penanganan akun yang
              di-banned)
            </li>
            <li>Memahami cara pengunjung memakai situs, secara agregat</li>
          </ul>
          <p>Kami gak pernah menjual data pribadi kamu ke pihak manapun.</p>
        </Section>

        <Section title="3. Layanan Pihak Ketiga">
          <p>MyAnimeGwe menggunakan beberapa layanan pihak ketiga berikut:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-zinc-800">Supabase</span> :
              hosting akun, database, dan autentikasi
            </li>
            <li>
              <span className="font-medium text-zinc-800">Google Sign-In</span>{" "}
              : opsi login pakai akun Google
            </li>
            <li>
              <span className="font-medium text-zinc-800">*******</span> :
              sumber data anime (judul, gambar, sinopsis, dll) dan kami tidak
              menerima data pribadi kamu
            </li>
            <li>
              <span className="font-medium text-zinc-800">Google AdSense</span>{" "}
              : menampilkan iklan, dan bisa memakai cookie untuk personalisasi
              iklan sesuai kebijakan Google
            </li>
            <li>
              <span className="font-medium text-zinc-800">
                Vercel Analytics
              </span>{" "}
              : analitik pengunjung situs secara anonim/agregat
            </li>
          </ul>
        </Section>

        <Section title="4. Cookies">
          <p>
            Situs ini memakai cookie yang diperlukan untuk sesi login, serta
            cookie dari Google AdSense dan Vercel Analytics untuk personalisasi
            iklan dan analitik. Kamu bisa mengatur/menonaktifkan cookie lewat
            pengaturan browser kamu, meskipun beberapa fitur mungkin jadi gak
            jalan optimal.
          </p>
        </Section>

        <Section title="5. Hak Kamu atas Data">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Ubah nama tampilan dan foto profil kapan aja lewat halaman profil
            </li>
            <li>Hapus anime dari daftar kamu kapan aja</li>
            <li>
              Minta penghapusan akun beserta seluruh data terkait dengan
              menghubungi kami (kontak di bawah)
            </li>
          </ul>
        </Section>

        <Section title="6. Kontak">
          <p>
            Ada pertanyaan soal privasi atau data kamu? Hubungi kami di{" "}
            <a
              href="mailto:admin.myanimegwe@gmail.com"
              className="font-medium text-violet-600 hover:underline"
            >
              admin.myanimegwe@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
