"use client";

import React from 'react';
import MediaCarousel from './MediaCarousel';
import { useWatchHistory } from '@/hooks/useWatchHistory';

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ContinueWatching() {
    const { continueWatching } = useWatchHistory();

    if (!continueWatching || continueWatching.length === 0) return null;

    // Group items by date
    const groupedItems: any[] = [];
    let lastDate = '';

    continueWatching.forEach(item => {
        const dateStr = formatDate(item.timestamp);
        if (dateStr !== lastDate) {
            groupedItems.push({
                id: `date-${dateStr}`,
                media_type: 'date_marker',
                title: dateStr
            });
            lastDate = dateStr;
        }

        groupedItems.push({
            id: item.id,
            title: item.title,
            name: item.title,
            poster_path: item.poster,
            vote_average: 0,
            overview: '',
            progress: item.progress,
            media_type: item.type
        });
    });

    return (
        <MediaCarousel
            title="🕑 Continue Watching"
            items={groupedItems}
        />
    );
}
