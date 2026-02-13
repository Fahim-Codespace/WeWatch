import MediaCarousel from "@/components/MediaCarousel";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ProviderSelector from "@/components/ProviderSelector";
import { Film } from "lucide-react";
import { getTrending, getPopularMovies, getPopularTVShows } from "@/lib/tmdb";
import Link from "next/link";
import ContinueWatching from "@/components/ContinueWatching";
import Watchlist from "@/components/Watchlist";

export default async function Home() {
  // Fetch trending and popular content
  const trendingAll = await getTrending('all', 'week');
  const popularMovies = await getPopularMovies();
  const popularTVShows = await getPopularTVShows();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
      {/* Navbar */}
      <Navbar />

      {/* Hero Section - Room Creation */}
      <div id="create-room" style={{ paddingTop: '80px' }}>
        <Hero />
      </div>

      {/* Provider Selection */}
      <ProviderSelector />

      {/* Divider */}
      <div style={{
        padding: '60px 0 40px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '800',
          marginBottom: '12px',
          color: '#fff'
        }}>
          Or Browse Our Library
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Discover trending movies and popular shows
        </p>
      </div>

      {/* Content Sections */}
      <div id="browse" style={{ flex: 1, paddingBottom: '60px' }}>
        <ContinueWatching />
        <Watchlist />
        <MediaCarousel title="🔥 Trending Now" items={trendingAll.results.slice(0, 20)} />
        <MediaCarousel title="🎬 Popular Movies" items={popularMovies.results.slice(0, 20)} mediaType="movie" />
        <MediaCarousel title="📺 Popular TV Shows" items={popularTVShows.results.slice(0, 20)} mediaType="tv" />
      </div>

      {/* Footer */}
      <footer style={{ padding: '40px 0', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
        <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <p>© 2026 WeWatch Platform. Stream together, anywhere.</p>
          <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>
            Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>TMDB</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
