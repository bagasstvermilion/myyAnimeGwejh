import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import DotDecoration from "../components/DotDecoration";
import userLogo from "../assets/img/user-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/my-list";

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const { error: authError } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Akun berhasil dibuat!");
      setMode("signin");
      return;
    }

    navigate(from, { replace: true });
  }

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setMessage("");
  }

  return (
    <div className="relative mx-auto flex max-w-[1440px] items-center justify-center overflow-hidden px-8 py-20 lg:px-14">
      <DotDecoration />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl ring-1 ring-zinc-100">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden
            className="h-12 w-12 bg-gradient-to-br from-pink-400 to-violet-600"
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
          <h1 className="mt-2 font-display text-2xl font-semibold text-zinc-900">
            {mode === "signin" ? "Masuk" : "Daftar"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {mode === "signin"
              ? "Masuk buat lihat & kelola list anime kamu."
              : "Bikin akun buat mulai nyimpen list anime kamu."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />

          <div className="min-h-5 px-1">
            {error && (
              <p className="line-clamp-1 text-sm text-red-500">{error}</p>
            )}
            {message && (
              <p className="line-clamp-1 text-sm text-emerald-600">
                {message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 cursor-pointer rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Memproses..."
              : mode === "signin"
                ? "Masuk"
                : "Daftar"}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-5 w-full cursor-pointer text-center text-sm font-medium text-violet-600 transition hover:opacity-70"
        >
          {mode === "signin"
            ? "Belum punya akun? Daftar"
            : "Udah punya akun? Masuk"}
        </button>

        <Link
          to="/"
          className="mt-4 block text-center text-xs text-zinc-400 transition hover:text-zinc-600"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
