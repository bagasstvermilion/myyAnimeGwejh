import Hero from "../components/Hero";
import { useMetaTags } from "../lib/useMetaTags";

export default function Home() {
  useMetaTags(
    "Home - MyAnimeGwe",
    "Catat, cari, dan pantau progress nonton anime kamu sendiri. Lengkap sampai ke detail informasi dan jadwalnya!",
  );

  return <Hero />;
}
