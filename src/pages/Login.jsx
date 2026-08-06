import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { checkBanStatus } from "../lib/banStatus";
import { useMetaTags } from "../lib/useMetaTags";
import DotDecoration from "../components/DotDecoration";
import BanCountdownDialog from "../components/dialog/BanCountdownDialog";
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
  const [banInfo, setBanInfo] = useState(null);

  useMetaTags(
    "Masuk - MyAnimeGwe",
    "Masuk untuk mengelola daftar anime dan progress nonton kamu di MyAnimeGwe.",
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    // let people type just "admin" instead of a full address — only fall
    // back to @gmail.com when they haven't typed an "@" themselves, so
    // "admin@jp.com" still goes through untouched
    const finalEmail = email.includes("@")
      ? email.trim()
      : `${email.trim()}@gmail.com`;

    // fire both requests together — checking ban status doesn't depend on
    // the sign-in result, so there's no need to wait for it to fail first
    const authPromise =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email: finalEmail, password })
        : supabase.auth.signUp({ email: finalEmail, password });
    const banStatusPromise =
      mode === "signin"
        ? checkBanStatus(finalEmail)
        : Promise.resolve({ banned: false });

    const [{ error: authError }, banStatus] = await Promise.all([
      authPromise,
      banStatusPromise,
    ]);

    setIsSubmitting(false);

    if (authError) {
      if (mode === "signin" && banStatus.banned) {
        setBanInfo(banStatus);
        return;
      }
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

  async function handleGoogleSignIn() {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${from}` },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-69px)] max-w-[1440px] items-center justify-center overflow-hidden px-4 py-6 sm:px-8 sm:py-10 lg:px-14">
      <DotDecoration />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl ring-1 ring-zinc-100 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden
            className="h-10 w-10 bg-gradient-to-br from-pink-400 to-violet-600 sm:h-12 sm:w-12"
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

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:mt-6 sm:gap-3">
          <div>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              required
              placeholder="Username atau email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:px-5 sm:py-3"
            />
            {/* {email && !email.includes("@") && (
              <p className="mt-1 px-4 text-xs text-zinc-400">
                Bakal masuk sebagai {email.trim()}@gmail.com
              </p>
            )} */}
          </div>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:px-5 sm:py-3"
          />

          <div className="min-h-5 px-1">
            {error && (
              <p className="line-clamp-1 text-sm text-red-500">{error}</p>
            )}
            {message && (
              <p className="line-clamp-1 text-sm text-emerald-600">{message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 cursor-pointer rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3"
          >
            {isSubmitting
              ? "Memproses..."
              : mode === "signin"
                ? "Masuk"
                : "Daftar"}
          </button>
        </form>

        <div className="my-3 flex items-center gap-3 sm:my-5">
          <div className="h-px flex-1 bg-zinc-100" />
          <span className="text-xs text-zinc-400">atau</span>
          <div className="h-px flex-1 bg-zinc-100" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 sm:py-3"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.37l3.99-3.09Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.63l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
            />
          </svg>
          Masuk dengan Google
        </button>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-3 w-full cursor-pointer text-center text-sm font-medium text-violet-600 transition hover:opacity-70 sm:mt-5"
        >
          {mode === "signin"
            ? "Belum punya akun? Daftar"
            : "Udah punya akun? Masuk"}
        </button>

        <Link
          to="/"
          className="mt-2 block text-center text-xs text-zinc-400 transition hover:text-zinc-600 sm:mt-4"
        >
          Kembali ke Dashboard
        </Link>
      </div>

      {banInfo && (
        <BanCountdownDialog
          bannedUntil={banInfo.bannedUntil}
          duration={banInfo.duration}
          reason={banInfo.reason}
          onClose={() => setBanInfo(null)}
        />
      )}
    </div>
  );
}
