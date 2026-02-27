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
import MediaDetailView from '@/components/MediaDetailView';
import { Share2, Users, Settings, LogOut, Info, UserCircle, Film, Search, ArrowLeft, Menu, X } from 'lucide-react';
import { getStreamSources } from '@/lib/streamSources';
import { getTrending, getTVShowDetails, getMovieDetails, getSeasonDetails, getImageUrl } from '@/lib/tmdb';
import EpisodeSelector from '@/components/EpisodeSelector';
import WatchSidebar from '@/components/WatchSidebar';
import { MediaDetails, TVShowDetails, Season } from '@/types/media';

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
        updateRoomSettings,
        changeMedia,
        media,
        leaveRoom
    } = useRoom();
    const [isJoined, setIsJoined] = useState(false);
    const [userName, setUserName] = useState('');
    const [mediaTitle, setMediaTitle] = useState('');
    const [showBrowseModal, setShowBrowseModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [browseResults, setBrowseResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{ media: any; type: 'movie' | 'tv' } | null>(null);
    const [shouldInitVideo, setShouldInitVideo] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Media State
    const [mediaId, setMediaId] = useState<number | null>(null);
    const [isTvShow, setIsTvShow] = useState(false);
    const [tvId, setTvId] = useState<number | null>(null);
    const [currentSeason, setCurrentSeason] = useState(1);
    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [tvDetails, setTvDetails] = useState<TVShowDetails | null>(null);
    const [movieDetails, setMovieDetails] = useState<MediaDetails | null>(null);

    const [rememberName, setRememberName] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
        const roomId = Array.isArray(params.id) ? params.id[0] : params.id;

        if (userName.trim() && roomId && socket) {
            // Persist name for this room
            localStorage.setItem(`wewatch_name_${roomId}`, userName.trim());

            // Handle global remember name
            if (rememberName) {
                localStorage.setItem('wewatch_global_username', userName.trim());
            } else {
                localStorage.removeItem('wewatch_global_username');
            }

            joinRoom(roomId, userName.trim());
            setIsJoined(true);

            // Trigger video initialization check
            setShouldInitVideo(true);
        }
    };

    // Check for existing session on mount
    useEffect(() => {
        if (!params.id) return;

        const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
        const key = `wewatch_name_${roomId}`;
        const savedName = localStorage.getItem(key);

        console.log('[Auth] Checking session for room:', roomId);
        console.log('[Auth] Key:', key, 'Value:', savedName);

        if (!savedName) {
            console.log('[Auth] No session found, showing join form');
            setIsCheckingAuth(false);
        } else {
            console.log('[Auth] Found session, pre-filling user:', savedName);
            setUserName(savedName);
            // Still let user confirm or change name before joining
            setIsCheckingAuth(false);
        }
    }, [params.id]);

    const handleLeaveRoom = () => {
        if (params.id) {
            localStorage.removeItem(`wewatch_name_${params.id}`);
        }
        leaveRoom();
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

    // Sync Media Context with URL/Title
    useEffect(() => {
        if (media) {
            setMediaTitle(media.title);

            // Validate if we need to update URL (avoid infinite loops)
            // If the current ID in params doesn't match media.id, update URL
            const currentMediaParam = searchParams.get('media'); // e.g. movie-123
            const newMediaParam = `${media.type}-${media.id}`;

            if (currentMediaParam !== newMediaParam) {
                const newUrl = `/watch?media=${newMediaParam}&title=${encodeURIComponent(media.title)}`;
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, [media, searchParams]);



    // Fetch TV details when ID changes
    useEffect(() => {
        if (!mediaId) return;

        const fetchData = async () => {
            try {
                if (isTvShow) {
                    const details = await getTVShowDetails(mediaId);
                    setTvDetails(details);
                    setSeasons(details.seasons || []);
                } else {
                    const details = await getMovieDetails(mediaId);
                    setMovieDetails(details);
                }
            } catch (error) {
                console.error("Error fetching details:", error);
            }
        };

        fetchData();
    }, [mediaId, isTvShow]);



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

    // Show loading state while checking for session
    if (isCheckingAuth) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#050505',
                color: 'var(--primary)'
            }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground animate-pulse">Reconnecting to room...</p>
                </div>
            </div>
        );
    }

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
            <header className="room-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {mediaId && (
                        <button
                            onClick={() => {
                                if (isTvShow && tvDetails) {
                                    setPreviewMedia({ media: tvDetails, type: 'tv' });
                                } else if (!isTvShow && movieDetails) {
                                    setPreviewMedia({ media: movieDetails, type: 'movie' });
                                } else {
                                    const type = isTvShow ? 'tv' : 'movie';
                                    router.push(`/media/${type}/${mediaId}`);
                                }
                            }}
                            className="btn-back"
                            title="Back to details"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}

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
                        <span className="brand-text" style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>
                            WE<span style={{ color: 'var(--primary)' }}>WATCH</span>
                        </span>
                    </div>

                    <div className="room-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="divider" style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></div>
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
                        title="Browse Media"
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
                        title="Room Settings"
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        onClick={handleLeaveRoom}
                        className="leave-btn"
                        title="Leave Room"
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
                    <VideoPlayer
                        isSandboxEnabled={roomSettings.isSandboxEnabled ?? true}
                        media={mediaId ? {
                            id: mediaId,
                            type: isTvShow ? 'tv' : 'movie',
                            title: mediaTitle || 'Unknown',
                            poster: isTvShow ? (tvDetails?.poster_path || null) : (movieDetails?.poster_path || null),
                            season: isTvShow ? currentSeason : undefined,
                            episode: isTvShow ? currentEpisode : undefined
                        } : undefined}
                    />
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

                    isSandboxEnabled={roomSettings.isSandboxEnabled ?? true}
                    onToggleSandbox={(enabled) => updateRoomSettings({ isSandboxEnabled: enabled })}
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
                    width: 100%;
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

                .room-info {
                    display: flex; 
                    align-items: center; 
                    gap: 10px;
                }

                .divider {
                    height: 24px; width: 1px; background: var(--glass-border);
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
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    border: 1px solid var(--glass-border);
                    display: flex;
                    align-items: center;
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
                    white-space: nowrap;
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
                    .room-id-badge, .divider { display: none; }

                    .room-content {
                        flex-direction: column;
                    }
                    .video-area {
                        padding: 0;
                        flex: none;
                        width: 100%;
                        height: auto;
                        aspect-ratio: 16/9;
                    }

                    /* Mobile Landscape Mode */
                    @media (orientation: landscape) and (max-height: 500px) {
                        .room-content {
                            flex-direction: row;
                        }
                        .video-area {
                            width: 50%;
                            height: 100%;
                            padding: 0;
                            aspect-ratio: auto;
                        }
                    }

                    .room-header {
                        padding: 10px 16px;
                        height: 60px;
                        gap: 10px;
                    }
                    .brand-text {
                        font-size: 1rem;
                    }

                    /* Header Actions - Mobile */
                    .header-actions {
                        flex: 1;
                        justify-content: flex-end;
                        gap: 8px;
                    }

                    .browse-btn span, 
                    .invite-btn span, 
                    .leave-btn span,
                    .watching-badge span {
                        display: none;
                    }

                    .browse-btn, .invite-btn, .leave-btn, .watching-badge {
                        padding: 0;
                        width: 34px;
                        height: 34px;
                        display: flex;
                        align-items: center;
                        justify-content: center; 
                        border-radius: 8px;
                    }
                    
                    .watching-badge {
                        padding: 0 8px; 
                        width: auto;
                    }
                    
                    .watching-badge span {
                         display: inline-block;
                         font-size: 0.8rem;
                    }
                }

                /* Extra-small phones: hide watcher count to keep header from overflowing */
                @media (max-width: 480px) {
                    .watching-badge {
                        display: none;
                    }
                    .room-header {
                        padding: 8px 12px;
                    }
                    .btn-back {
                        width: 34px;
                        height: 34px;
                    }
                }
            `}</style>

            {/* Browse Modal */}
            <BrowseModal
                isOpen={showBrowseModal}
                onClose={() => setShowBrowseModal(false)}
                onSelect={(selectedMedia) => {
                    const isMovie = 'title' in selectedMedia;
                    const type = isMovie ? 'movie' : 'tv';
                    const title = isMovie ? selectedMedia.title : (selectedMedia as any).name;

                    // Immediately load and sync the selected media for the room
                    changeMedia({
                        type,
                        id: selectedMedia.id,
                        title,
                        poster: selectedMedia.poster_path || undefined
                    });

                    const sources = getStreamSources(type, selectedMedia.id);
                    if (sources.length > 0) {
                        setVideoUrl(sources[0].url, 'embed');
                    }

                    // Also open the detail overlay so the user can see info / change episodes, etc.
                    setPreviewMedia({ media: selectedMedia, type });
                    setShowBrowseModal(false);
                }}
            />

            {/* Media Detail Preview Overlay */}
            {previewMedia && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    background: '#050505',
                    overflowY: 'auto'
                }}>
                    <MediaDetailView
                        media={previewMedia.media as any}
                        type={previewMedia.type as 'movie' | 'tv'}
                        onBack={() => setPreviewMedia(null)}
                        onPlay={() => {
                            const media = previewMedia.media;
                            const type = previewMedia.type;
                            const isMovie = type === 'movie';
                            const title = isMovie ? (media as any).title : (media as any).name;

                            // 1. Sync Metadata
                            changeMedia({
                                type,
                                id: media.id,
                                title,
                                poster: media.poster_path || undefined
                            });

                            // 2. Sync Video
                            const sources = getStreamSources(type, media.id);
                            if (sources.length > 0) {
                                setVideoUrl(sources[0].url, 'embed');
                            }

                            // 3. Update Local URL (History only, no navigation away)
                            const newUrl = `/room/${params.id}?media=${type}-${media.id}&title=${encodeURIComponent(title)}`;
                            window.history.pushState(null, '', newUrl);

                            setPreviewMedia(null);
                        }}
                    />
                </div>
            )}
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
