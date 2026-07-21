import AnimeCard from './AnimeCard'

export default function AnimeGrid({ animeList, showRank = false }) {
  if (!animeList?.length) return null

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {animeList.map((anime, i) => (
        <AnimeCard key={anime.mal_id} anime={anime} rank={showRank ? i + 1 : null} />
      ))}
    </div>
  )
}
