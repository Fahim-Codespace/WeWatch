"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { ChevronDown, Search, Play, Download } from 'lucide-react';

interface Episode {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string;
    runtime: number;
    vote_average: number;
}

interface Season {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
}

interface EpisodeSelectorProps {
    tvId: number;
    tvTitle: string;
    currentSeason: number;
    currentEpisode: number;
    seasons: Season[];
    onEpisodeSelect: (season: number, episode: number) => void;
}

export default function EpisodeSelector({
    tvId,
    tvTitle,
    currentSeason,
    currentEpisode,
    seasons,
    onEpisodeSelect
}: EpisodeSelectorProps) {
    const [selectedSeason, setSelectedSeason] = useState(currentSeason);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchEpisodes() {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/tmdb/tv/${tvId}/season/${selectedSeason}`
                );
                const data = await response.json();
                setEpisodes(data.episodes || []);
            } catch (error) {
                console.error('Error fetching episodes:', error);
            } finally {
                setLoading(false);
            }
        }

        if (selectedSeason > 0) {
            fetchEpisodes();
        }
    }, [tvId, selectedSeason]);

    // Update selected season if currentSeason changes externally
    useEffect(() => {
        setSelectedSeason(currentSeason);
    }, [currentSeason]);

    const filteredEpisodes = episodes.filter(ep =>
        ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.overview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSeason(parseInt(e.target.value));
    };

    const handleEpisodeClick = (episodeNumber: number) => {
        onEpisodeSelect(selectedSeason, episodeNumber);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px',
            height: '100%'
        }}>
            {/* Controls Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Season Selector */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <select
                        value={selectedSeason}
                        onChange={handleSeasonChange}
                        style={{
                            width: '100%',
                            background: 'var(--secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            padding: '12px 40px 12px 16px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            appearance: 'none',
                            outline: 'none'
                        }}
                    >
                        {seasons.map(season => (
                            <option key={season.id} value={season.season_number}>
                                {season.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={18}
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: 'var(--text-muted)'
                        }}
                    />
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search episodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            padding: '10px 12px 10px 36px',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Episode List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <div className="spinner-sm" style={{ margin: '0 auto 12px' }}></div>
                        Loading season...
                    </div>
                ) : (
                    filteredEpisodes.map((episode) => {
                        const isCurrent = episode.episode_number === currentEpisode && selectedSeason === currentSeason;

                        return (
                            <div
                                key={episode.id}
                                onClick={() => handleEpisodeClick(episode.episode_number)}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: isCurrent ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                                    border: isCurrent ? '1px solid rgba(0, 255, 136, 0.2)' : '1px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isCurrent) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {/* Thumbnail */}
                                <div style={{
                                    position: 'relative',
                                    width: '100px',
                                    height: '56px',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    background: '#222'
                                }}>
                                    {episode.still_path ? (
                                        <Image
                                            src={getImageUrl(episode.still_path, 'w300')}
                                            alt={episode.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#555' }}>No Image</span>
                                        </div>
                                    )}
                                    {isCurrent && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(0,0,0,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                background: 'var(--primary)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Play size={12} fill="#000" color="#000" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: isCurrent ? 'var(--primary)' : '#fff',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {episode.episode_number}. {episode.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {episode.overview || 'No description'}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style jsx>{`
                .spinner-sm {
                    width: 24px;
                    height: 24px;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
