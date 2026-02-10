import { Movie, TVShow, MediaDetails, TVShowDetails, SearchResult, Genre, Episode } from '@/types/media';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image size helpers
export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500') => {
    if (!path) return '/placeholder-movie.png';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Generic fetch helper
async function tmdbFetch<T>(endpoint: string): Promise<T> {
    if (!TMDB_API_KEY) {
        console.error('TMDB_API_KEY is not defined!');
        throw new Error('TMDB API key is missing');
    }

    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;

    console.log('Fetching TMDB:', endpoint);

    const response = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        console.error(`TMDB API Error: ${response.status} ${response.statusText}`);
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }

    return response.json();
}

// Trending content
export async function getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week') {
    return tmdbFetch<SearchResult>(`/trending/${mediaType}/${timeWindow}`);
}

// Search
export async function searchMulti(query: string, page: number = 1) {
    return tmdbFetch<SearchResult>(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
}

export async function searchMovies(query: string, page: number = 1) {
    return tmdbFetch<SearchResult>(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
}

export async function searchTVShows(query: string, page: number = 1) {
    return tmdbFetch<SearchResult>(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`);
}

// Movie details
export async function getMovieDetails(movieId: number) {
    return tmdbFetch<MediaDetails>(`/movie/${movieId}?append_to_response=credits,videos,images,recommendations,similar,reviews`);
}

// TV show details
export async function getTVShowDetails(tvId: number) {
    return tmdbFetch<TVShowDetails>(`/tv/${tvId}?append_to_response=credits,videos,images,recommendations,similar,reviews`);
}

// Season details
export async function getSeasonDetails(tvId: number, seasonNumber: number) {
    return tmdbFetch<{ episodes: Episode[] }>(`/tv/${tvId}/season/${seasonNumber}`);
}

// Discover movies
export async function discoverMovies(params: {
    page?: number;
    genre?: number;
    sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc';
    year?: number;
} = {}) {
    const queryParams = new URLSearchParams({
        page: params.page?.toString() || '1',
        sort_by: params.sortBy || 'popularity.desc',
        ...(params.genre && { with_genres: params.genre.toString() }),
        ...(params.year && { year: params.year.toString() })
    });

    return tmdbFetch<SearchResult>(`/discover/movie?${queryParams}`);
}

// Discover TV shows
export async function discoverTVShows(params: {
    page?: number;
    genre?: number;
    sortBy?: 'popularity.desc' | 'vote_average.desc' | 'first_air_date.desc';
} = {}) {
    const queryParams = new URLSearchParams({
        page: params.page?.toString() || '1',
        sort_by: params.sortBy || 'popularity.desc',
        ...(params.genre && { with_genres: params.genre.toString() })
    });

    return tmdbFetch<SearchResult>(`/discover/tv?${queryParams}`);
}

// Get genres
export async function getMovieGenres() {
    return tmdbFetch<{ genres: Genre[] }>('/genre/movie/list');
}

export async function getTVGenres() {
    return tmdbFetch<{ genres: Genre[] }>('/genre/tv/list');
}

export async function getGenres(type: 'movie' | 'tv'): Promise<Genre[]> {
    const data = await tmdbFetch<{ genres: Genre[] }>(`/genre/${type}/list`);
    return data.genres;
}

export async function getEpisode(tvId: number, seasonNumber: number, episodeNumber: number): Promise<Episode> {
    return tmdbFetch<Episode>(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
}

// Watch Provider Functions
// Watch Provider Functions
export async function getWatchProviders(region: string = 'US'): Promise<import('@/types/media').WatchProvider[]> {
    const movieProviders = await tmdbFetch<{ results: any[] }>(`/watch/providers/movie?watch_region=${region}`);
    const tvProviders = await tmdbFetch<{ results: any[] }>(`/watch/providers/tv?watch_region=${region}`);

    // Combine and deduplicate providers
    const allProviders = [...movieProviders.results, ...tvProviders.results];
    const uniqueProviders = Array.from(
        new Map(allProviders.map(p => [p.provider_id, p])).values()
    );

    // Specific order requested: Netflix, Prime, HBO, Disney, Crunchyroll
    // Netflix: 8
    // Prime Video: 9, 119
    // HBO Max / Max: 384, 1899
    // Disney+: 337
    // Crunchyroll: 283
    const priorityIds = [8, 9, 119, 384, 1899, 337, 283];

    const sorted = uniqueProviders.sort((a, b) => {
        const indexA = priorityIds.indexOf(a.provider_id);
        const indexB = priorityIds.indexOf(b.provider_id);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return a.display_priority - b.display_priority;
    });

    return sorted.slice(0, 30);
}

export async function discoverByProvider(
    type: 'movie' | 'tv',
    providerId: number,
    page: number = 1,
    region: string = 'US'
): Promise<{ results: (Movie | TVShow)[]; total_pages: number; total_results: number }> {
    return tmdbFetch<{ results: (Movie | TVShow)[]; total_pages: number; total_results: number }>(
        `/discover/${type}?with_watch_providers=${providerId}&watch_region=${region}&page=${page}&sort_by=popularity.desc`
    );
}

export async function getMediaProviders(type: 'movie' | 'tv', id: number) {
    return tmdbFetch<{ results: any }>(`/${type}/${id}/watch/providers`);
}

// Popular content
export async function getPopularMovies(page: number = 1) {
    return tmdbFetch<SearchResult>(`/movie/popular?page=${page}`);
}

export async function getPopularTVShows(page: number = 1) {
    return tmdbFetch<SearchResult>(`/tv/popular?page=${page}`);
}

// Top rated
export async function getTopRatedMovies(page: number = 1) {
    return tmdbFetch<SearchResult>(`/movie/top_rated?page=${page}`);
}

export async function getTopRatedTVShows(page: number = 1) {
    return tmdbFetch<SearchResult>(`/tv/top_rated?page=${page}`);
}

// Now playing (movies in theaters)
export async function getNowPlayingMovies(page: number = 1) {
    return tmdbFetch<SearchResult>(`/movie/now_playing?page=${page}`);
}

// Upcoming movies
export async function getUpcomingMovies(page: number = 1) {
    return tmdbFetch<SearchResult>(`/movie/upcoming?page=${page}`);
}

// On the air (TV shows currently airing)
export async function getOnTheAirTVShows(page: number = 1) {
    return tmdbFetch<SearchResult>(`/tv/on_the_air?page=${page}`);
}
