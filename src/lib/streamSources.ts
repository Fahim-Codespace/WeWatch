import { MediaType, StreamSource } from '@/types/media';

/**
 * Get streaming sources for a movie or TV show
 * Uses multiple embedding services as fallback servers
 */
export function getStreamSources(
    mediaType: MediaType,
    tmdbId: number,
    season?: number,
    episode?: number
): StreamSource[] {
    const sources: StreamSource[] = [];

    if (mediaType === 'movie') {
        // Movie sources - 12 servers for maximum reliability
        sources.push(
            {
                label: 'VidLink',
                url: `https://vidlink.pro/movie/${tmdbId}?autoplay=true`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.cc',
                url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.vip',
                url: `https://vidsrc.vip/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.to',
                url: `https://vidsrc.to/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Autoembed',
                url: `https://player.autoembed.cc/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.xyz',
                url: `https://vidsrc.xyz/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.me',
                url: `https://vidsrc.me/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Embedsu',
                url: `https://embed.su/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Moviesapi',
                url: `https://moviesapi.club/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: '2Embed',
                url: `https://www.2embed.cc/embed/${tmdbId}&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'SuperEmbed',
                url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'NontonGo',
                url: `https://www.NontonGo.win/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Smashystream',
                url: `https://player.smashy.stream/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'VidSrc Pro',
                url: `https://vidsrc.pro/embed/movie/${tmdbId}?auto_play=1&autoplay=1`,
                health: 'unknown'
            }
        );
    } else if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
        // TV show sources - 12 servers for maximum reliability
        sources.push(
            {
                label: 'VidLink',
                url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?autoplay=true`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.cc',
                url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.vip',
                url: `https://vidsrc.vip/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.to',
                url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Autoembed',
                url: `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.xyz',
                url: `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Vidsrc.me',
                url: `https://vidsrc.me/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Embedsu',
                url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Moviesapi',
                url: `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: '2Embed',
                url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'SuperEmbed',
                url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'NontonGo',
                url: `https://www.NontonGo.win/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'Smashystream',
                url: `https://player.smashy.stream/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            },
            {
                label: 'VidSrc Pro',
                url: `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}?auto_play=1&autoplay=1`,
                health: 'unknown'
            }
        );
    }

    return sources;
}

/**
 * Format runtime in minutes to "Xh Ym" format
 */
export function formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

/**
 * Format release date to year
 */
export function getYear(dateString: string): string {
    return dateString ? new Date(dateString).getFullYear().toString() : 'N/A';
}

/**
 * Format vote average to 1 decimal place
 */
export function formatRating(rating: number): string {
    return rating.toFixed(1);
}

/**
 * Check if media is a movie or TV show
 */
export function isMovie(media: any): boolean {
    return 'title' in media;
}

export function isTVShow(media: any): boolean {
    return 'name' in media;
}

/**
 * Get media title (works for both movies and TV shows)
 */
export function getMediaTitle(media: any): string {
    return isMovie(media) ? media.title : media.name;
}

/**
 * Get media release date (works for both movies and TV shows)
 */
export function getMediaReleaseDate(media: any): string {
    return isMovie(media) ? media.release_date : media.first_air_date;
}
