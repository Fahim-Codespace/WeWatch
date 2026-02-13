"use client";

import React from 'react';
import MediaCarousel from './MediaCarousel';
import { useWatchHistory } from '@/hooks/useWatchHistory';

export default function ContinueWatching() {
    const { continueWatching } = useWatchHistory();

    if (!continueWatching || continueWatching.length === 0) return null;

    // Convert WatchProgressItem to MediaItem format for Carousel
    // We might need to adjust MediaCard to show progress bar
    const items = continueWatching.map(item => ({
        id: item.id,
        title: item.title, // or name
        name: item.title,
        poster_path: item.poster,
        vote_average: 0, // Not stored
        overview: '',
        progress: item.progress // Pass progress to item
    }));

    return (
        <MediaCarousel
            title="🕑 Continue Watching"
            items={items as any}
            mediaType="movie" // Mix of types, but card handles it if we pass type in item?
        // Actually MediaCarousel takes a strict mediaType prop usually.
        // Let's check MediaCard compatibility.
        />
    );
}
