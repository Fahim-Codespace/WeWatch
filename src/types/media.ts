// Media type definitions for TMDB API responses

export interface Movie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    video: boolean;
}

export interface TVShow {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    origin_country: string[];
    original_language: string;
}

export interface Genre {
    id: number;
    name: string;
}

export interface WatchProvider {
    provider_id: number;
    provider_name: string;
    logo_path: string;
    display_priority: number;
}

export interface WatchProvidersResponse {
    results: WatchProvider[];
}

export interface MediaDetails extends Movie {
    genres: Genre[];
    runtime: number;
    status: string;
    tagline: string;
    budget: number;
    revenue: number;
    production_companies: ProductionCompany[];
    credits?: {
        cast: CastMember[];
        crew: CrewMember[];
    };
    videos?: {
        results: Video[];
    };
    images?: {
        backdrops: Image[];
        posters: Image[];
        logos: Image[];
    };
    similar?: {
        results: Movie[];
    };
    recommendations?: {
        results: Movie[];
    };
    belongs_to_collection?: Collection | null;
}

export interface TVShowDetails extends TVShow {
    genres: Genre[];
    number_of_seasons: number;
    number_of_episodes: number;
    seasons: Season[];
    status: string;
    tagline: string;
    created_by: Creator[];
    credits?: {
        cast: CastMember[];
        crew: CrewMember[];
    };
    videos?: {
        results: Video[];
    };
    images?: {
        backdrops: Image[];
        posters: Image[];
        logos: Image[];
    };
    similar?: {
        results: TVShow[];
    };
    recommendations?: {
        results: TVShow[];
    };
}

export interface Season {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string;
    episode_count: number;
}

export interface Episode {
    id: number;
    episode_number: number;
    season_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string;
    vote_average: number;
    runtime: number;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface CrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface ProductionCompany {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
}

export interface Creator {
    id: number;
    name: string;
    profile_path: string | null;
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface Image {
    aspect_ratio: number;
    height: number;
    iso_639_1: string | null;
    file_path: string;
    vote_average: number;
    vote_count: number;
    width: number;
}

export interface Collection {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
}

export interface SearchResult {
    page: number;
    results: (Movie | TVShow)[];
    total_pages: number;
    total_results: number;
}

export type MediaType = 'movie' | 'tv';

export interface StreamSource {
    label: string;
    url: string;
    health: 'unknown' | 'good' | 'slow' | 'failed';
}
