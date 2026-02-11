"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRoom } from '@/context/RoomContext';
import VideoPlayer from '@/components/VideoPlayer';
import ChatSystem from '@/components/ChatSystem';
import BrowseModal from '@/components/BrowseModal';
import RoomSettingsModal from '@/components/RoomSettingsModal';
import InviteModal from '@/components/InviteModal';
import { Share2, Users, Settings, LogOut, Info, UserCircle, Film, Search, ArrowLeft } from 'lucide-react';
import { getStreamSources } from '@/lib/streamSources';
import { getTrending, getTVShowDetails, getSeasonDetails, getImageUrl } from '@/lib/tmdb';
import EpisodeSelector from '@/components/EpisodeSelector';
import WatchSidebar from '@/components/WatchSidebar';
import { Episode, Season } from '@/types/media';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        socket,
        joinRoom,
        videoState,
        setVideoUrl,
        currentUserName,
        participants,
        roomSettings,
        updateRoomSettings
    } = useRoom();
    const [isJoined, setIsJoined] = useState(false);
    const [userName, setUserName] = useState('');
    const [mediaTitle, setMediaTitle] = useState('');
    const [showBrowseModal, setShowBrowseModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [browseResults, setBrowseResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [shouldInitVideo, setShouldInitVideo] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Media State
    const [mediaId, setMediaId] = useState<number | null>(null);
    const [isTvShow, setIsTvShow] = useState(false);
    const [tvId, setTvId] = useState<number | null>(null);
    const [currentSeason, setCurrentSeason] = useState(1);
    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [tvDetails, setTvDetails] = useState<any>(null);

    const [rememberName, setRememberName] = useState(false);

    // Load saved global name on mount
    useEffect(() => {
        const savedGlobalName = localStorage.getItem('wewatch_global_username');
        if (savedGlobalName) {
            setUserName(savedGlobalName);
            setRememberName(true);
        }
    }, []);

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (userName.trim() && params.id && socket) {
            // Persist name for this room (existing logic)
            localStorage.setItem(`wewatch_name_${params.id}`, userName.trim());

            // Handle global remember name
            if (rememberName) {
                localStorage.setItem('wewatch_global_username', userName.trim());
            } else {
                localStorage.removeItem('wewatch_global_username');
            }

            joinRoom(params.id as string, userName.trim());
            setIsJoined(true);

            // Trigger video initialization check
            setShouldInitVideo(true);
        }
    };

    // Auto-rejoin on refresh
    useEffect(() => {
        if (!params.id || isJoined || !socket) return;

        const savedName = localStorage.getItem(`wewatch_name_${params.id}`);
        if (savedName) {
            console.log('Auto-rejoining with saved name:', savedName);
            setUserName(savedName);
            joinRoom(params.id as string, savedName);
            setIsJoined(true);
            setShouldInitVideo(true);
        }
    }, [params.id, joinRoom, isJoined, socket]);

    const handleLeaveRoom = () => {
        if (params.id) {
            localStorage.removeItem(`wewatch_name_${params.id}`);
        }
        router.push('/');
    };

    // Auto-load video when socket is ready and user has joined
    useEffect(() => {
        if (!shouldInitVideo || !socket) return;

        const mediaParam = searchParams.get('media');
        const titleParam = searchParams.get('title');

        if (mediaParam && titleParam) {
            setMediaTitle(decodeURIComponent(titleParam));
            const [type, id] = mediaParam.split('-');

            if ((type === 'movie' || type === 'tv') && id) {
                const sources = getStreamSources(type as 'movie' | 'tv', parseInt(id));
                // Auto-load the first source with correct sourceType
                if (sources.length > 0) {
                    // Slight delay to ensure join-room event is processed first
                    setTimeout(() => {
                        console.log('Emitting initial video state:', sources[0].url);
                        setVideoUrl(sources[0].url, 'embed');
                        // Dispatch sources to VideoPlayer
                        const event = new CustomEvent('load-video-sources', {
                            detail: { sources }
                        });
                        window.dispatchEvent(event);
                    }, 500);
                }
            }
        }

        setShouldInitVideo(false);
    }, [shouldInitVideo, socket, searchParams, setVideoUrl]);

    // Parse URL to detect TV show and fetch details

    useEffect(() => {
        if (!videoState.url) return;

        const parseUrl = (url: string) => {
            // TV Regex
            const tvPathRegex = /\/tv\/(\d+)[\/-](\d+)[\/-](\d+)/;
            const tvQueryRegex = /(?:video_id=|embedtv\/)(\d+).*?[?&]s=(\d+).*?[?&]e=(\d+)/;

            // Movie Regex
            const moviePathRegex = /\/movie\/(\d+)/;
            const movieQueryRegex = /(?:video_id=|movie\/)(\d+)/;

            const tvMatch = url.match(tvPathRegex) || url.match(tvQueryRegex);
            if (tvMatch) {
                return {
                    type: 'tv',
                    id: parseInt(tvMatch[1]),
                    season: parseInt(tvMatch[2]),
                    episode: parseInt(tvMatch[3])
                };
            }

            const movieMatch = url.match(moviePathRegex) || url.match(movieQueryRegex);
            if (movieMatch) {
                return {
                    type: 'movie',
                    id: parseInt(movieMatch[1])
                };
            }

            return null;
        };

        const parsed = parseUrl(videoState.url);

        if (parsed) {
            setMediaId(parsed.id);
            if (parsed.type === 'tv') {
                setIsTvShow(true);
                setTvId(parsed.id);
                setCurrentSeason(parsed.season || 1);
                setCurrentEpisode(parsed.episode || 1);
            } else {
                setIsTvShow(false);
                setTvId(null);
            }
        }
    }, [videoState.url]);

    // Fetch TV details when ID changes
    useEffect(() => {
        if (!tvId) return;

        const fetchData = async () => {
            try {
                const details = await getTVShowDetails(tvId);
                setTvDetails(details);
                setSeasons(details.seasons || []);
            } catch (error) {
                console.error("Error fetching TV details:", error);
            }
        };

        fetchData();
    }, [tvId]);



    const handleEpisodeSelect = (season: number, episode: number) => {
        if (!tvId) return;
        const sources = getStreamSources('tv', tvId, season, episode);
        if (sources.length > 0) {
            setVideoUrl(sources[0].url, 'embed');
        }
    };

    const handleServerSelect = (url: string) => {
        setVideoUrl(url, 'embed');
    };


    const copyInviteLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    // Show name modal if not joined
    if (!isJoined) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#050505',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decorative Elements */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'var(--primary)',
                    filter: 'blur(150px)',
                    opacity: '0.05',
                    zIndex: 0,
                    borderRadius: '50%'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'var(--accent)',
                    filter: 'blur(180px)',
                    opacity: '0.05',
                    zIndex: 0,
                    borderRadius: '50%'
                }}></div>

                <div className="glass" style={{
                    padding: '40px',
                    width: '450px',
                    maxWidth: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    zIndex: 1
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--primary)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 0 30px var(--primary-glow)'
                        }}>
                            <UserCircle size={36} color="#000" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
                            Join <span style={{ color: 'var(--primary)' }}>Room</span>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Enter your name to join the watch party
                        </p>
                    </div>

                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(0, 255, 136, 0.05)',
                        border: '1px solid rgba(0, 255, 136, 0.2)',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            ROOM ID
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace' }}>
                            {params.id}
                        </div>
                    </div>

                    <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                marginBottom: '8px',
                                color: 'var(--foreground)'
                            }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name..."
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                autoFocus
                                maxLength={20}
                                style={{
                                    width: '100%',
                                    background: 'var(--secondary)',
                                    border: '1px solid var(--glass-border)',
                                    padding: '14px 16px',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            />
                        </div>

                        {/* Remember Name Checkbox */}
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            color: 'var(--text-muted)'
                        }}>
                            <input
                                type="checkbox"
                                checked={rememberName}
                                onChange={(e) => setRememberName(e.target.checked)}
                                style={{
                                    accentColor: 'var(--primary)',
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer'
                                }}
                            />
                            Wanna remember the name for future joins?
                        </label>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!userName.trim() || !socket}
                                style={{
                                    flex: 1,
                                    opacity: (userName.trim() && socket) ? 1 : 0.5,
                                    cursor: (userName.trim() && socket) ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {socket ? 'Join Room' : 'Connecting...'}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => router.push('/')}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--glass-border)'
                    }}>
                        Ready to watch together? Enter your name to join!
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505' }}>
            {/* Room Header */}
            <header style={{
                padding: '12px 24px',
                background: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {mediaId && (
                        <button
                            onClick={() => {
                                const type = isTvShow ? 'tv' : 'movie';
                                router.push(`/media/${type}/${mediaId}`);
                            }}
                            className="btn-back"
                            title="Back to details"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></div>

                    <div
                        onClick={() => router.push('/')}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                    >
                        <div style={{
                            background: 'var(--primary)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px var(--primary-glow)'
                        }}>
                            <Film size={18} color="#000" fill="#000" />
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>
                            WE<span style={{ color: 'var(--primary)' }}>WATCH</span>
                        </span>
                    </div>
                    <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="room-id-badge">
                            <span style={{ color: 'var(--primary)' }}>ROOM:</span> {params.id}
                        </div>
                        {mediaTitle && (
                            <>
                                <div style={{ height: '20px', width: '1px', background: 'var(--glass-border)' }}></div>
                                <div className="media-title-badge" style={{
                                    padding: '4px 12px',
                                    background: 'rgba(0, 255, 136, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    border: '1px solid rgba(0, 255, 136, 0.2)',
                                    color: 'var(--primary)',
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    🎬 {mediaTitle}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        onClick={() => setShowBrowseModal(true)}
                        className="btn-primary browse-btn"
                    >
                        <Film size={18} />
                        <span>Browse</span>
                    </button>

                    <div className="watching-badge">
                        <Users size={16} />
                        <span>{participants.length}</span>
                    </div>

                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="btn-secondary invite-btn"
                        title="Invite Friends"
                    >
                        <Share2 size={16} />
                        <span>Invite</span>
                    </button>

                    <button
                        className="btn-secondary settings-btn"
                        onClick={() => setShowSettingsModal(true)}
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        onClick={handleLeaveRoom}
                        className="leave-btn"
                    >
                        <LogOut size={16} />
                        <span>Leave Room</span>
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="room-content">
                {/* Playback Area */}
                <div className="video-area">
                    <VideoPlayer />


                </div>

                {/* Sidebar */}
                <WatchSidebar
                    roomId={params.id as string}
                    mediaType={isTvShow ? 'tv' : 'movie'}
                    seasons={seasons}
                    tvId={mediaId || undefined}
                    tvTitle={mediaTitle}
                    currentSeason={currentSeason}
                    currentEpisode={currentEpisode}
                    onEpisodeSelect={handleEpisodeSelect}
                    sources={isTvShow && mediaId ? getStreamSources('tv', mediaId, currentSeason, currentEpisode) : (mediaId ? getStreamSources('movie', mediaId) : [])}
                    onServerSelect={handleServerSelect}
                    activeServerUrl={videoState.url}
                />
            </div>

            <style jsx>{`
                .room-header {
                    padding: 12px 24px;
                    background: rgba(10, 10, 10, 0.8);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid var(--glass-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 64px;
                }

                .room-content {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }

                .video-area {
                    flex: 1;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    overflow-y: auto;
                    background: #000;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .btn-back {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                }

                .btn-back:hover {
                    background: var(--primary);
                    color: black;
                    transform: translateX(-5px);
                    box-shadow: 0 0 20px var(--primary-glow);
                    border-color: var(--primary);
                }

                .room-id-badge {
                    padding: 4px 12px;
                    background: var(--secondary);
                    borderRadius: 6px;
                    fontSize: 0.8rem;
                    fontWeight: 600;
                    border: 1px solid var(--glass-border);
                    display: flex;
                    alignItems: center;
                    gap: 6px;
                    white-space: nowrap;
                }

                .badge {
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    border: 1px solid transparent;
                }
                .badge.warning { background: rgba(255, 170, 0, 0.1); color: #ffaa00; border-color: rgba(255, 170, 0, 0.2); }
                .badge.success { background: rgba(0, 255, 136, 0.1); color: var(--primary); border-color: rgba(0, 255, 136, 0.2); }

                .sync-banner {
                    padding: 20px;
                }

                .watching-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    background: var(--secondary);
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--glass-border);
                }

                .leave-btn {
                    background: rgba(255, 68, 68, 0.1);
                    color: #ff4444;
                    border: 1px solid rgba(255, 68, 68, 0.2);
                    border-radius: 8px;
                    padding: 8px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                }
                .leave-btn:hover { background: rgba(255, 68, 68, 0.2); }

                .settings-btn { width: 38px; height: 38px; padding: 0; justify-content: center; }

                @media (max-width: 1024px) {
                    .media-title-badge { display: none; }
                }

                @media (max-width: 768px) {
                    .room-id-badge { display: none; }
                    .room-content {
                        flex-direction: column;
                    }
                    .video-area {
                        padding: 12px;
                        flex: none;
                        height: auto;
                    }
                    .room-header {
                        padding: 10px 16px;
                        height: auto;
                        flex-wrap: wrap;
                        gap: 10px;
                    }
                    .header-actions {
                        width: 100%;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    .browse-btn span, 
                    .invite-btn span, 
                    .leave-btn span {
                        display: none;
                    }
                    .browse-btn, .invite-btn, .leave-btn {
                        padding: 10px;
                    }
                    .watching-badge {
                        padding: 10px;
                    }
                }
            `}</style>

            {/* Browse Modal */}
            <BrowseModal
                isOpen={showBrowseModal}
                onClose={() => setShowBrowseModal(false)}
                onSelect={(media) => {
                    const isMovie = 'title' in media;
                    const type = isMovie ? 'movie' : 'tv';
                    router.push(`/media/${type}/${media.id}`);
                    setShowBrowseModal(false);
                }}
            />
            {/* Room Settings Modal */}
            <RoomSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                isHost={participants.find(p => p.id === socket?.id)?.isHost || false}
                persistent={roomSettings?.persistent || false}
                onTogglePersistence={(enabled) => updateRoomSettings({ persistent: enabled })}
            />

            {/* Invite Modal */}
            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
            />
        </div>
    );
}
