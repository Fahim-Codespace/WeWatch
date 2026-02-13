"use client";

import React from 'react';
import MediaCarousel from './MediaCarousel';
import { useWatchHistory } from '@/hooks/useWatchHistory';

export default function Watchlist() {
    const { watchlist } = useWatchHistory();

    if (!watchlist || watchlist.length === 0) return null;

    const items = watchlist.map(item => ({
        id: item.id,
        title: item.title,
        name: item.title,
        poster_path: item.poster,
        vote_average: 0,
        overview: '',
        media_type: item.type // Important for routing
    }));

    return (
        <MediaCarousel
            title="📑 Your Watchlist"
            items={items as any}
        />
    );
}
