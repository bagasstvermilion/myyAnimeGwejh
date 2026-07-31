import { useEffect, useRef, useState } from "react";
import {
  displayName,
  removeAvatar,
  updateDisplayName,
  uploadAvatar,
} from "../../lib/avatar";
import userLogo from "../../assets/img/user-logo.png";

export default function EditProfileDialog({ open, user, onClose }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && user) setName(displayName(user));
  }, [open, user]);

  if (!open) return null;

  const avatarUrl = user?.user_metadata?.avatar_url;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setError("");
    try {
      await uploadAvatar(file, user.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setIsRemoving(true);
    setError("");
    try {
      await removeAvatar(user.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    try {
      await updateDisplayName(name);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-100">
        <h3 className="font-display text-lg font-semibold text-zinc-900">
          Edit Profil
        </h3>

        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-zinc-100/70 px-4 py-5 text-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Ganti foto profil"
              className="group/avatar relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-violet-100 disabled:cursor-not-allowed"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="h-9 w-9 bg-gradient-to-br from-pink-400 to-violet-600"
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
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover/avatar:opacity-100">
                {isUploading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                    <path
                      d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={isRemoving || isUploading}
                aria-label="Hapus foto profil"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white ring-2 ring-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRemoving ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                    <path
                      d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {name || displayName(user)}
            </p>
            <p className="mt-0.5 max-w-[200px] truncate text-xs text-violet-600">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mt-4 text-left">
          <label className="text-xs font-medium text-zinc-500">Nama</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className="mt-1 w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
