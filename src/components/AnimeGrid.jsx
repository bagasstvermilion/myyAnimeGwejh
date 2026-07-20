import AnimeCard from './AnimeCard'

export default function AnimeGrid({ animeList }) {
  if (!animeList?.length) return null

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {animeList.map((anime) => (
        <AnimeCard key={anime.mal_id} anime={anime} />
      ))}
    </div>
  )
}
