"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import WatchSidebar from '@/components/WatchSidebar';
import { useRoom } from '@/context/RoomContext';
import { getStreamSources } from '@/lib/streamSources';
import { getTVShowDetails } from '@/lib/tmdb';
import { ArrowLeft, Users, Film } from 'lucide-react';

function WatchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setVideoUrl, roomId, videoState } = useRoom();
    const [mediaTitle, setMediaTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sources, setSources] = useState<any[]>([]);
    const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
    const [mediaId, setMediaId] = useState<number>(0);
    const [currentSeason, setCurrentSeason] = useState(1);
    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [seasons, setSeasons] = useState<any[]>([]);

    useEffect(() => {
        const mediaParam = searchParams.get('media');
        const titleParam = searchParams.get('title');
        const seasonParam = searchParams.get('season');
        const episodeParam = searchParams.get('episode');

        if (mediaParam && titleParam) {
            setMediaTitle(decodeURIComponent(titleParam));
            const [type, id] = mediaParam.split('-');
            const parsedId = parseInt(id);

            if ((type === 'movie' || type === 'tv') && !isNaN(parsedId)) {
                setMediaType(type as 'movie' | 'tv');
                setMediaId(parsedId);

                // For TV shows, get season and episode
                if (type === 'tv') {
                    const season = seasonParam ? parseInt(seasonParam) : 1;
                    const episode = episodeParam ? parseInt(episodeParam) : 1;
                    setCurrentSeason(season);
                    setCurrentEpisode(episode);

                    // Fetch TV show details for seasons
                    getTVShowDetails(parsedId).then(details => {
                        setSeasons(details.seasons || []);
                    });

                    // Get stream sources for the episode
                    const streamSources = getStreamSources('tv', parsedId, season, episode);
                    setSources(streamSources);

                    if (streamSources.length > 0) {
                        setVideoUrl(streamSources[0].url, 'embed');
                        setIsLoading(false);
                    } else {
                        setIsLoading(false);
                    }
                } else {
                    // Movie
                    const streamSources = getStreamSources('movie', parsedId);
                    setSources(streamSources);

                    if (streamSources.length > 0) {
                        setVideoUrl(streamSources[0].url, 'embed');
                        setIsLoading(false);
                    } else {
                        setIsLoading(false);
                    }
                }
            }
        } else {
            setIsLoading(false);
        }
    }, [searchParams, setVideoUrl]);


    // Handle episode selection
    const handleEpisodeSelect = (season: number, episode: number) => {
        setIsLoading(true); // Show loading state
        router.push(`/watch?media=tv-${mediaId}&title=${encodeURIComponent(mediaTitle)}&season=${season}&episode=${episode}`);
    };

    // Handle server selection from Sidebar
    const handleServerSelect = (url: string) => {
        setVideoUrl(url, 'embed');
    };

    return (
        <div className="watch-page-container">
            {/* Minimalist Floating Header */}
            <header className="watch-header">
                <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {mediaTitle && (
                        <div className="title-container">
                            <span className="media-title">
                                {mediaTitle}
                            </span>
                            {mediaType === 'tv' && (
                                <span className="episode-info">
                                    S{currentSeason} : E{currentEpisode}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ pointerEvents: 'auto' }}>
                    {!roomId && (
                        <button
                            onClick={() => {
                                const mediaParam = searchParams.get('media');
                                const titleParam = searchParams.get('title');
                                if (mediaParam && titleParam) {
                                    const newRoomId = Math.random().toString(36).substring(2, 10);
                                    router.push(`/room/${newRoomId}?media=${mediaParam}&title=${titleParam}`);
                                }
                            }}
                            className="btn-primary start-party-btn"
                        >
                            <Users size={18} />
                            <span>Start Party</span>
                        </button>
                    )}
                    {roomId && (
                        <div className="room-active-badge">
                            <Users size={16} />
                            <span>Room Active</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="watch-content">

                {/* Video Player Area */}
                <div className="video-section">
                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading Stream...</p>
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: '100%' }}>
                            <VideoPlayer initialSources={sources} />
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <WatchSidebar
                    roomId={roomId || undefined}
                    mediaType={mediaType}
                    seasons={seasons}
                    tvId={mediaId}
                    tvTitle={mediaTitle}
                    currentSeason={currentSeason}
                    currentEpisode={currentEpisode}
                    onEpisodeSelect={handleEpisodeSelect}
                    sources={sources}
                    onServerSelect={handleServerSelect}
                    activeServerUrl={videoState.url}
                />

            </div>

            <style jsx>{`
                .watch-page-container {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #000;
                    overflow: hidden;
                }

                .watch-header {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 50;
                    padding: 20px 24px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    pointer-events: none;
                }

                .btn-back {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    color: #fff;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-back:hover { background: rgba(255,255,255,0.2); }

                .title-container {
                    display: flex;
                    flex-direction: column;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                }

                .media-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #fff;
                }
                
                .episode-info {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.7);
                }

                .start-party-btn {
                    padding: 8px 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
                }

                .room-active-badge {
                    padding: 6px 16px;
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid var(--primary);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--primary);
                    font-size: 0.9rem;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                }

                .watch-content {
                    flex: 1;
                    display: flex;
                    width: 100%;
                    height: 100%;
                }

                .video-section {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #000;
                    position: relative;
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    color: rgba(255,255,255,0.5);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .watch-content {
                        flex-direction: column;
                    }
                    .video-section {
                        flex: none;
                        width: 100%;
                        aspect-ratio: 16/9;
                        height: auto;
                    }
                    /* Header Adjustments */
                    .watch-header {
                        padding: 10px 16px;
                    }
                    .media-title {
                        font-size: 1rem;
                        max-width: 150px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .start-party-btn span {
                        display: none;
                    }
                    .start-party-btn {
                        padding: 8px;
                    }
                }
            `}</style>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
            </div>
        }>
            <WatchPageContent />
        </Suspense>
    );
}
