import { useQuery } from '@tanstack/react-query'
import { getTopAnime } from '../lib/anilist'
import DotDecoration from './DotDecoration'

const LAYOUT = [
  { box: 'left-0 top-20 w-36', rotate: 'rotate-[-9deg]', z: 15 },
  { box: 'left-24 top-0 w-40', rotate: 'rotate-[5deg]', z: 35 },
  { box: 'left-56 top-24 w-36', rotate: 'rotate-[-4deg]', z: 25 },
  { box: 'left-36 top-56 w-32', rotate: 'rotate-[11deg]', z: 15 },
  { box: 'left-[2px] top-[19rem] w-28', rotate: 'rotate-[7deg]', z: 5 },
]

const SLOT_COUNT = LAYOUT.length
// must match the 6.2s "turn" length baked into the poster-crossfade
// keyframes (see index.css)
const TURN_SECONDS = 6.2
// stagger each slot's float cycle a bit so they don't all bob in unison
const FLOAT_STAGGER_SECONDS = 0.7

export default function PosterCollage() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-anime', 'hero'],
    // fetch a fixed 25 (5 slots x 5 rotations) regardless of what other
    // pages ask for — the poster-crossfade keyframes assume exactly 5
    // turns per loop, so a different pool size leaves a gap with nothing
    // visible partway through the cycle
    queryFn: () => getTopAnime(1, { perPage: 25 }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const pool = data?.data ?? []
  const rotations = Math.floor(pool.length / SLOT_COUNT)

  return (
    <div className="relative h-[460px] w-full max-w-[420px]">
      <DotDecoration />

      {isLoading &&
        LAYOUT.map((slot, i) => (
          <div
            key={i}
            className={`absolute aspect-[2/3] animate-pulse rounded-2xl bg-zinc-200 ${slot.box}`}
          />
        ))}

      {rotations > 0 &&
        LAYOUT.map((slot, slotIndex) => (
          <div
            key={slotIndex}
            className={`absolute aspect-[2/3] animate-poster-float ${slot.box}`}
            style={{
              zIndex: slot.z,
              animationDelay: `-${slotIndex * FLOAT_STAGGER_SECONDS}s`,
            }}
          >
            {Array.from({ length: rotations }, (_, turn) => {
              const anime = pool[turn * SLOT_COUNT + slotIndex]
              if (!anime) return null
              const isCycling = rotations > 1

              return (
                <img
                  key={turn}
                  src={anime.images?.webp?.image_url}
                  alt={turn === 0 ? anime.title : ''}
                  aria-hidden={turn !== 0}
                  style={{
                    animationDelay: isCycling ? `-${turn * TURN_SECONDS}s` : undefined,
                    opacity: isCycling ? undefined : 1,
                  }}
                  className={`absolute inset-0 h-full w-full rounded-2xl object-cover shadow-xl ring-4 ring-white ${
                    slot.rotate
                  } ${isCycling ? 'animate-poster-crossfade' : ''}`}
                />
              )
            })}
          </div>
        ))}
    </div>
  )
}
