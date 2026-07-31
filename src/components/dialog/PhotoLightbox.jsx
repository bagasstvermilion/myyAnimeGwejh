export default function PhotoLightbox({ open, src, onClose }) {
  if (!open || !src) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <img
        src={src}
        alt=""
        className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="absolute right-6 top-6 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M6 6l12 12M18 6 6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
