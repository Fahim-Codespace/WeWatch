"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipForward, SkipBack, Link as LinkIcon, FileVideo, Monitor, MonitorOff, Film, Loader, Download, Info } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import { useScreenShare } from '@/hooks/useScreenShare';
import Hls from 'hls.js';
import PlayerSettings from './PlayerSettings';
import { useWatchHistory } from '@/hooks/useWatchHistory';

interface VideoPlayerProps {
    initialSources?: { label: string; url: string }[];
    isSandboxEnabled?: boolean;
    media?: {
        id: number;
        type: 'movie' | 'tv';
        title: string;
        poster: string | null;
        season?: number;
        episode?: number;
    };
}

export default function VideoPlayer({ initialSources, isSandboxEnabled = true, media }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const { videoState, togglePlay, seekVideo, setVideoUrl, socket, roomId, fileTransfer, notification } = useRoom();
    const { isSharing, screenStream, remoteScreenStream, startScreenShare, stopScreenShare } = useScreenShare();
    const [showControls, setShowControls] = useState(true);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [tempUrl, setTempUrl] = useState('');
    const [tempUrls, setTempUrls] = useState<string[]>(['']); // Multiple URLs
    const [videoSources, setVideoSources] = useState<{ url: string; label: string; health: 'unknown' | 'good' | 'slow' | 'failed' }[]>([]);
    const [activeServerIndex, setActiveServerIndex] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [availableQualities, setAvailableQualities] = useState<{ index: number; height: number; label: string }[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 means auto
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const isRemoteAction = useRef(false); // Flag to prevent sync loops

    const { updateProgress } = useWatchHistory();
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        if (initialSources && initialSources.length > 0) {
            const formattedSources = initialSources.map(s => ({
                ...s,
                health: 'unknown' as const
            }));
            setVideoSources(formattedSources);
            setActiveServerIndex(0);
        }
    }, [initialSources]);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validUrls = tempUrls.filter(url => url.trim());
        if (validUrls.length > 0) {
            // Create sources with labels
            const sources = validUrls.map((url, index) => ({
                url: url.trim(),
                label: `Server ${index + 1}`,
                health: 'unknown' as const
            }));
            setVideoSources(sources);
            setActiveServerIndex(0);
            setVideoUrl(sources[0].url, 'url');
            setIsUrlModalOpen(false);
            setTempUrls(['']);
        }
    };

    const switchServer = (index: number) => {
        if (index >= 0 && index < videoSources.length) {
            setActiveServerIndex(index);
            const url = videoSources[index].url;
            const isEmbed = url.includes('/embed/') || url.includes('/v2/') || url.includes('player.') || url.includes('.mov/');
            setVideoUrl(url, isEmbed ? 'embed' : 'url');
        }
    };

    const handleVideoError = () => {
        // Safe check for videoSources
        if (!videoSources || videoSources.length === 0) {
            console.warn('Video error occurred but no alternative sources available (likely local file or direct URL)');
            return;
        }

        // Mark current server as failed
        const updatedSources = [...videoSources];
        if (updatedSources[activeServerIndex]) {
            updatedSources[activeServerIndex].health = 'failed';
            setVideoSources(updatedSources);
        }

        // Try next server
        const nextIndex = activeServerIndex + 1;
        if (nextIndex < videoSources.length) {
            console.log(`Server ${activeServerIndex + 1} failed, switching to Server ${nextIndex + 1}`);
            switchServer(nextIndex);
        } else {
            console.error('All servers failed');
        }
    };

    const handleClearVideo = () => {
        // Clean up HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        setVideoUrl('', 'url');
        setProgress(0);
    };

    const handleQualityChange = (qualityIndex: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = qualityIndex;
            setCurrentQuality(qualityIndex);
        }
    };

    const handleSpeedChange = (speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    };


    // Socket listeners removed - RoomContext handles state updates

    // HLS.js integration & P2P File Playback
    useEffect(() => {
        if (!videoRef.current) return;

        let url = videoState.url;

        // P2P File Transfer Logic
        if (videoState.sourceType === 'local' && !fileTransfer.isHost) {
            if (fileTransfer.downloadUrl) {
                url = fileTransfer.downloadUrl;
            } else {
                // Not ready yet
                return;
            }
        }

        if (!url) return;

        const video = videoRef.current;

        // Clean up previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // Check if it's an HLS stream (.m3u8)
        if (url.includes('.m3u8') || url.includes('m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hlsRef.current = hls;
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('HLS stream loaded successfully');

                    // Detect available quality levels
                    const levels = hls.levels.map((level, index) => ({
                        index,
                        height: level.height,
                        label: level.height >= 1080 ? `${level.height}p (FHD)` :
                            level.height >= 720 ? `${level.height}p (HD)` :
                                `${level.height}p`
                    }));

                    // Add Auto option
                    setAvailableQualities([
                        { index: -1, height: 0, label: 'Auto' },
                        ...levels
                    ]);
                    setCurrentQuality(-1); // Start with auto
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = url;
            }
        } else {
            // Regular video file
            video.src = url;
            video.load(); // Force load for blobs/files
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoState.url, fileTransfer.downloadUrl, fileTransfer.isHost, videoState.sourceType]); // Added dependencies

    useEffect(() => {
        if (!videoRef.current) return;

        const playVideo = async () => {
            try {
                if (videoState.playing) {
                    await videoRef.current?.play();
                } else {
                    videoRef.current?.pause();
                }
            } catch (e) {
                console.warn('Playback state change failed:', e);
            }
        };

        playVideo();
    }, [videoState.playing]);

    useEffect(() => {
        if (!videoRef.current) return;
        if (Math.abs(videoRef.current.currentTime - videoState.currentTime) > 1) {
            videoRef.current.currentTime = videoState.currentTime;
        }
    }, [videoState.currentTime]);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        const percent = (current / duration) * 100;
        setProgress(percent);

        // Update buffered range
        if (videoRef.current.buffered.length > 0) {
            const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
            setBuffered((bufferedEnd / duration) * 100);
        }

        // Save progress every 5 seconds
        const now = Date.now();
        if (now - lastUpdateRef.current > 5000) {
            console.log('Attempting to save progress...', {
                mediaPresent: !!media,
                duration,
                canSave: media && duration > 0 && !isNaN(duration)
            });

            if (media && duration > 0 && !isNaN(duration)) {
                lastUpdateRef.current = now;
                console.log('Saving progress for:', media.title, percent);
                updateProgress({
                    id: media.id,
                    type: media.type,
                    title: media.title,
                    poster: media.poster,
                    progress: percent,
                    duration: duration,
                    season: media.season,
                    episode: media.episode
                });
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current || isRemoteAction.current) return;
        const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
        seekVideo(newTime);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (videoState.playing) setShowControls(false);
        }, 3000);
    };

    const toggleFullScreen = () => {
        if (!videoRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            videoRef.current.parentElement?.requestFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "00:00";
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
    };

    const handleLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // If in a room, start P2P stream
            if (socket && roomId) {
                await fileTransfer.startFileShare(file);
                // The host also needs to see the video locally
                const url = URL.createObjectURL(file);
                setVideoUrl(url, 'local');
            } else {
                // Offline / No Room
                const url = URL.createObjectURL(file);
                setVideoUrl(url, 'local');
            }
        }
    };

    // Handle screen share stream
    useEffect(() => {
        if (screenVideoRef.current && (screenStream || remoteScreenStream)) {
            screenVideoRef.current.srcObject = screenStream || remoteScreenStream;
        }
    }, [screenStream, remoteScreenStream]);

    const activeStream = screenStream || remoteScreenStream;

    return (
        <div
            className="glass"
            onMouseMove={handleMouseMove}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                overflow: 'hidden',
                background: '#000',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid var(--glass-border)'
            }}
        >
            {/* Screen Share Display */}
            {activeStream ? (
                <video
                    ref={screenVideoRef}
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ) : videoState.url ? (
                videoState.sourceType === 'embed' ? (
                    !videoState.playing ? (
                        // Start Session Overlay for Embeds
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(' + (media?.poster || '') + ') center/cover no-repeat',
                            color: '#fff',
                            gap: '24px',
                            zIndex: 10
                        }}>
                            <div style={{ textAlign: 'center', maxWidth: '600px', padding: '0 20px' }}>
                                <h2 style={{ fontSize: '2rem', marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                    {media?.title || 'Synchronized Session'}
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                                    Ready to watch? Click start to begin for everyone.
                                </p>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6 text-sm text-yellow-200/80 max-w-md mx-auto">
                                    <p className="flex items-center gap-2 justify-center font-medium mb-1">
                                        <Info size={16} /> Note on controls
                                    </p>
                                    Once started, pause/seek controls inside the video player are local only.
                                </div>
                            </div>

                            <button
                                onClick={() => togglePlay()}
                                className="btn-primary"
                                style={{
                                    padding: '16px 48px',
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    boxShadow: '0 0 30px var(--primary-glow)',
                                    transform: 'scale(1)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Play size={28} fill="currentColor" />
                                Start Session
                            </button>
                        </div>
                    ) : (
                        // Render iframe for embed sources
                        <iframe
                            key={videoState.url}
                            src={videoState.url}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                pointerEvents: 'auto',
                                zIndex: 1
                            }}
                            referrerPolicy="origin"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            {...(isSandboxEnabled ? { sandbox: "allow-scripts allow-same-origin allow-presentation" } : {})}
                        />
                    )
                ) : (
                    // Render video element HTML5
                    <video
                        ref={videoRef}
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onTimeUpdate={handleTimeUpdate}
                        onClick={() => togglePlay()}
                        onError={handleVideoError}
                    />
                )
            ) : (
                // No Video Selected
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '20px',
                    color: 'var(--text-muted)'
                }}>
                    <Film size={64} style={{ opacity: 0.2 }} />
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#fff', marginBottom: '8px' }}>No video selected</h2>
                        <p>Upload a local file or enter a URL to start watching together</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileVideo size={18} />
                            Open File
                            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleLocalFile} />
                        </label>
                        <button className="btn-secondary" onClick={() => setIsUrlModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LinkIcon size={18} />
                            Paste URL
                        </button>
                    </div>
                </div>
            )}


            {/* URL Modal */}
            {isUrlModalOpen && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="glass" style={{ padding: '30px', width: '500px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ margin: 0, color: 'var(--primary)' }}>Add Video Sources</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Add multiple URLs as backup servers. If one fails, it will automatically switch to the next.
                        </p>
                        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {tempUrls.map((url, index) => (
                                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            Server {index + 1}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter .mp4, .m3u8, or stream URL"
                                            value={url}
                                            onChange={(e) => {
                                                const newUrls = [...tempUrls];
                                                newUrls[index] = e.target.value;
                                                setTempUrls(newUrls);
                                            }}
                                            autoFocus={index === 0}
                                            style={{
                                                background: 'var(--secondary)',
                                                border: '1px solid var(--glass-border)',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    {tempUrls.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setTempUrls(tempUrls.filter((_, i) => i !== index))}
                                            style={{
                                                background: 'rgba(255, 68, 68, 0.1)',
                                                border: '1px solid rgba(255, 68, 68, 0.2)',
                                                color: '#ff4444',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                marginTop: '20px'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setTempUrls([...tempUrls, ''])}
                                className="btn-secondary"
                                style={{ alignSelf: 'flex-start' }}
                            >
                                Add another URL
                            </button>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Load Video</button>
                                <button type="button" className="btn-secondary" onClick={() => { setIsUrlModalOpen(false); setTempUrls(['']); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {/* Video Overlay / Controls */}
            {
                (videoState.sourceType !== 'embed' || (videoState.sourceType === 'embed' && videoState.playing)) && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '40px 20px 20px',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.4s cubic-bezier(0,4, 0, 0.2, 1)',
                        pointerEvents: showControls ? 'all' : 'none',
                        zIndex: 20
                    }}>
                        {/* Only show progress bar for non-embeds */}
                        {videoState.sourceType !== 'embed' && (
                            <div style={{ position: 'relative', height: '6px', marginBottom: '20px', cursor: 'pointer' }}>
                                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
                                <div style={{ position: 'absolute', width: `${buffered}%`, height: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
                                <div style={{ position: 'absolute', width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={progress}
                                    onChange={handleSeek}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {/* Standard Controls (Non-Embed) */}
                                {videoState.sourceType !== 'embed' ? (
                                    <>
                                        <button
                                            onClick={() => togglePlay()}
                                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                                        >
                                            {videoState.playing ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" />}
                                        </button>
                                        <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                            <SkipForward size={20} fill="#fff" />
                                        </button>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => setIsMuted(!isMuted)}
                                                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                                            >
                                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                            </button>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={volume}
                                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                style={{ width: '80px', accentColor: 'var(--primary)' }}
                                            />
                                        </div>

                                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500', fontFamily: 'monospace' }}>
                                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(videoRef.current?.duration || 0)}
                                        </span>
                                    </>
                                ) : (
                                    // Controls for Embeds (Stop Session)
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => togglePlay()} // Toggles playing to false -> shows start overlay
                                            className="btn-secondary"
                                            style={{
                                                background: 'rgba(255, 68, 68, 0.15)',
                                                color: '#ff4444',
                                                border: '1px solid rgba(255, 68, 68, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Pause size={18} fill="currentColor" />
                                            Stop Session
                                        </button>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Playing shared content
                                        </span>
                                    </div>
                                )}

                            </div>


                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {videoState.url && !activeStream && (
                                    <button
                                        onClick={handleClearVideo}
                                        style={{
                                            background: 'rgba(255, 68, 68, 0.1)',
                                            border: '1px solid rgba(255, 68, 68, 0.2)',
                                            color: '#ff4444',
                                            cursor: 'pointer',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontWeight: '600',
                                            fontSize: '0.8rem'
                                        }}
                                        title="Change Video"
                                    >
                                        <FileVideo size={16} />
                                        Change Video
                                    </button>
                                )}
                                <button
                                    onClick={() => isSharing ? stopScreenShare() : startScreenShare()}
                                    style={{
                                        background: isSharing ? 'var(--primary)' : 'none',
                                        border: 'none',
                                        color: isSharing ? '#000' : '#fff',
                                        cursor: 'pointer',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    title={isSharing ? 'Stop Screen Share' : 'Start Screen Share'}
                                >
                                    {isSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                                </button>
                                <button
                                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                    style={{
                                        background: isSettingsOpen ? 'rgba(0, 255, 136, 0.1)' : 'none',
                                        border: 'none',
                                        color: isSettingsOpen ? 'var(--primary)' : '#fff',
                                        cursor: 'pointer',
                                        padding: '6px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <Settings size={20} />
                                </button>

                                <button
                                    onClick={toggleFullScreen}
                                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                                >
                                    <Maximize size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Player Settings Panel */}
                        <PlayerSettings
                            isOpen={isSettingsOpen}
                            onClose={() => setIsSettingsOpen(false)}
                            currentQuality={currentQuality}
                            availableQualities={availableQualities}
                            onQualityChange={handleQualityChange}
                            playbackSpeed={playbackSpeed}
                            onSpeedChange={handleSpeedChange}
                            servers={videoSources}
                            activeServerIndex={activeServerIndex}
                            onServerChange={switchServer}
                        />
                    </div>
                )
            }
            {/* P2P File Transfer Overlay */}
            {
                !fileTransfer.isHost && (
                    <>
                        {/* Downloading Overlay */}
                        {(fileTransfer.transferState.status === 'connecting' || fileTransfer.transferState.status === 'transferring') && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0,0,0,0.8)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 20
                            }}>
                                <div className="loading-spinner" style={{ marginBottom: '20px' }}>
                                    <Loader size={48} className="animate-spin" color="var(--primary)" />
                                </div>
                                <h3 style={{ color: '#fff', marginBottom: '8px' }}>Downloading File...</h3>
                                <div style={{
                                    width: '300px',
                                    height: '6px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${fileTransfer.transferState.progress}%`,
                                        height: '100%',
                                        background: 'var(--primary)',
                                        transition: 'width 0.2s ease'
                                    }} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                                    {fileTransfer.transferState.progress}% of {fileTransfer.transferState.fileSize ? (fileTransfer.transferState.fileSize / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown size'}
                                </p>
                            </div>
                        )}

                        {/* Accept Transfer Overlay */}
                        {fileTransfer.transferState.status === 'idle' && fileTransfer.transferState.fileName && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0,0,0,0.85)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 20
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(0, 255, 136, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                    border: '1px solid var(--primary)'
                                }}>
                                    <Download size={40} color="var(--primary)" />
                                </div>
                                <h2 style={{ color: '#fff', marginBottom: '8px' }}>P2P File Stream Available</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                                    The host is streaming <strong>{fileTransfer.transferState.fileName}</strong>
                                </p>
                                <button
                                    onClick={() => {
                                        if (fileTransfer.transferState.hostId) {
                                            fileTransfer.requestFile(fileTransfer.transferState.hostId);
                                        }
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'var(--primary)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 0 20px var(--primary-glow)'
                                    }}
                                >
                                    <Download size={18} />
                                    Download & Watch
                                </button>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '16px', maxWidth: '400px', textAlign: 'center' }}>
                                    Note: This file will be downloaded to your device's memory for playback. Large files may take some time.
                                </p>
                            </div>
                        )}
                    </>
                )
            }
            {/* Notification Overlay */}
            {
                videoState.sourceType !== 'embed' && (notification ||  /* Create a local state for notification if needed, but context handles it */ false) && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translate(-50%, 0)',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(4px)',
                        zIndex: 10,
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        pointerEvents: 'none',
                        animation: 'fadeInOut 3s ease-in-out',
                        display: notification ? 'block' : 'none'
                    }}>
                        {notification?.message}
                    </div>
                )
            }

            {/* Embed Source Notification Overlay */}
            {videoState.sourceType === 'embed' && notification && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translate(-50%, 0)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100, // Higher z-index for iframes
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    pointerEvents: 'none',
                    display: notification ? 'block' : 'none'
                }}>
                    {notification.message}
                </div>
            )}
        </div>
    );
}
