import { MediaDetails, TVShowDetails } from '@/types/media';

export interface WatchProgressItem {
    id: number;
    type: 'movie' | 'tv';
    title: string;
    poster: string | null;
    progress: number; // 0-100
    timestamp: number;
    duration: number;
    season?: number;
    episode?: number;
}

export interface WatchlistItem {
    id: number;
    type: 'movie' | 'tv';
    title: string;
    poster: string | null;
    vote_average: number;
    addedAt: number;
}

const KEYS = {
    WATCHLIST: 'wewatch_watchlist',
    PROGRESS: 'wewatch_progress'
};

// --- Watchlist ---

export const getWatchlist = (): WatchlistItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const item = window.localStorage.getItem(KEYS.WATCHLIST);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error('Error reading watchlist', e);
        return [];
    }
};

export const addToWatchlist = (media: MediaDetails | TVShowDetails, type: 'movie' | 'tv') => {
    const list = getWatchlist();
    const isMovie = type === 'movie';
    const title = isMovie ? (media as any).title : (media as any).name;

    if (list.some(item => item.id === media.id && item.type === type)) return list;

    const newItem: WatchlistItem = {
        id: media.id,
        type,
        title,
        poster: media.poster_path,
        vote_average: media.vote_average || 0,
        addedAt: Date.now()
    };

    const newList = [newItem, ...list];
    window.localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(newList));
    window.dispatchEvent(new Event('storage-watchlist')); // Custom event for reactivity
    return newList;
};

export const removeFromWatchlist = (id: number, type: 'movie' | 'tv') => {
    const list = getWatchlist();
    const newList = list.filter(item => !(item.id === id && item.type === type));
    window.localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(newList));
    window.dispatchEvent(new Event('storage-watchlist'));
    return newList;
};

export const isInWatchlist = (id: number, type: 'movie' | 'tv') => {
    const list = getWatchlist();
    return list.some(item => item.id === id && item.type === type);
};

// --- Progress ---

export const getWatchProgress = (): WatchProgressItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const item = window.localStorage.getItem(KEYS.PROGRESS);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error('Error reading progress', e);
        return [];
    }
};

export const saveWatchProgress = (item: Omit<WatchProgressItem, 'timestamp'>) => {
    const list = getWatchProgress();
    // Remove existing entry for this media
    const filtered = list.filter(i => !(i.id === item.id && i.type === item.type));

    const newItem: WatchProgressItem = {
        ...item,
        timestamp: Date.now()
    };

    // Add to top
    const newList = [newItem, ...filtered].slice(0, 50); // Keep last 50 items
    window.localStorage.setItem(KEYS.PROGRESS, JSON.stringify(newList));
    // Dispatch event only occasionally to avoid spamming updates during playback? 
    // Actually, fine to dispatch, consumers should debounce if needed.
    window.dispatchEvent(new Event('storage-progress'));
    return newList;
};

export const getMediaProgress = (id: number, type: 'movie' | 'tv') => {
    const list = getWatchProgress();
    return list.find(item => item.id === id && item.type === type);
};
