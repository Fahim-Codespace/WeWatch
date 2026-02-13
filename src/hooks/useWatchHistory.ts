import { useState, useEffect } from 'react';
import {
    getWatchlist,
    getWatchProgress,
    addToWatchlist as add,
    removeFromWatchlist as remove,
    saveWatchProgress as save,
    WatchlistItem,
    WatchProgressItem
} from '@/lib/localStorage';
import { MediaDetails, TVShowDetails } from '@/types/media';

export function useWatchHistory() {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [history, setHistory] = useState<WatchProgressItem[]>([]);

    useEffect(() => {
        // Initial load
        setWatchlist(getWatchlist());
        setHistory(getWatchProgress());

        // Listen for storage events (cross-tab)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'wewatch_watchlist') setWatchlist(getWatchlist());
            if (e.key === 'wewatch_progress') setHistory(getWatchProgress());
        };

        // Listen for custom events (same-tab)
        const handleCustomWatchlist = () => setWatchlist(getWatchlist());
        const handleCustomProgress = () => setHistory(getWatchProgress());

        window.addEventListener('storage', handleStorage);
        window.addEventListener('storage-watchlist', handleCustomWatchlist);
        window.addEventListener('storage-progress', handleCustomProgress);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('storage-watchlist', handleCustomWatchlist);
            window.removeEventListener('storage-progress', handleCustomProgress);
        };
    }, []);

    const addToWatchlist = (media: MediaDetails | TVShowDetails, type: 'movie' | 'tv') => {
        add(media, type);
    };

    const removeFromWatchlist = (id: number, type: 'movie' | 'tv') => {
        remove(id, type);
    };

    const updateProgress = (item: Omit<WatchProgressItem, 'timestamp'>) => {
        save(item);
    };

    return {
        watchlist,
        continueWatching: history,
        addToWatchlist,
        removeFromWatchlist,
        updateProgress
    };
}
