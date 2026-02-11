"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipForward, SkipBack, Link as LinkIcon, FileVideo, Monitor, MonitorOff, MessageSquare, Film } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import { useScreenShare } from '@/hooks/useScreenShare';
import Hls from 'hls.js';
import PlayerSettings from './PlayerSettings';
import ChatOverlay from './ChatOverlay';

interface VideoPlayerProps {
    initialSources?: { label: string; url: string }[];
    isSandboxEnabled?: boolean;
}

export default function VideoPlayer({ initialSources, isSandboxEnabled = true }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const { videoState, togglePlay, seekVideo, setVideoUrl, socket, roomId, messages } = useRoom();
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
    // const [isSafetyMode, setIsSafetyMode] = useState(true); // Replaced by prop
    const [shieldActive, setShieldActive] = useState(true);
    const isRemoteAction = useRef(false); // Flag to prevent sync loops
    const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const lastMessageCountRef = useRef(messages.length);

    useEffect(() => {
        if (messages.length > lastMessageCountRef.current) {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                if (videoState.playing) setShowControls(false);
            }, 3000);
        }
        lastMessageCountRef.current = messages.length;
    }, [messages.length, videoState.playing]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            console.log('Fullscreen change:', isFull);
            setIsFullscreen(isFull);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari/Chrome legacy
        document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox legacy
        document.addEventListener('msfullscreenchange', handleFullscreenChange); // IE/Edge legacy

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Fallback check for fullscreen (some browsers/iframes don't fire events reliably)
    useEffect(() => {
        const interval = setInterval(() => {
            // Check standard API or dimension match
            const isFull = !!document.fullscreenElement ||
                (typeof window !== 'undefined' && window.innerWidth === screen.width && window.innerHeight === screen.height);

            if (isFull !== isFullscreen) {
                console.log('Fullscreen fallback check:', isFull);
                setIsFullscreen(isFull);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isFullscreen]);

    // Fallback check for fullscreen (some browsers/iframes don't fire events reliably)
    useEffect(() => {
        const interval = setInterval(() => {
            // Check standard API or dimension match
            const isFull = !!document.fullscreenElement ||
                (typeof window !== 'undefined' && window.innerWidth === screen.width && window.innerHeight === screen.height);

            if (isFull !== isFullscreen) {
                console.log('Fullscreen fallback check:', isFull);
                setIsFullscreen(isFull);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isFullscreen]);

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
        // Mark current server as failed
        const updatedSources = [...videoSources];
        updatedSources[activeServerIndex].health = 'failed';
        setVideoSources(updatedSources);

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

    // HLS.js integration
    useEffect(() => {
        if (!videoRef.current || !videoState.url) return;

        const video = videoRef.current;
        const url = videoState.url;

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
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoState.url]);

    useEffect(() => {
        if (!videoRef.current) return;

        if (videoState.playing) {
            videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
        } else {
            videoRef.current.pause();
        }
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
        setProgress((current / duration) * 100);

        // Update buffered range
        if (videoRef.current.buffered.length > 0) {
            const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
            setBuffered((bufferedEnd / duration) * 100);
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

    const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setVideoUrl(url, 'local');
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
            {activeStream && (
                <video
                    ref={screenVideoRef}
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            )}

            {/* Regular Video Display */}
            {!activeStream && videoState.url ? (
                videoState.sourceType === 'embed' ? (
                    // Render iframe for embed sources (VidSrc, 2Embed, etc.)
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {isSandboxEnabled && shieldActive && (
                            <div
                                onClick={() => setShieldActive(false)}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 20,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.01)', // Almost invisible but catches clicks
                                }}
                            >
                                <div style={{
                                    padding: '12px 24px',
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    pointerEvents: 'none', // Label doesn't block click to parent
                                    opacity: 0.8
                                }}>
                                    Shield Active: Click anywhere to unlock player
                                </div>
                            </div>
                        )}
                        <iframe
                            key={videoState.url}
                            src={videoState.url}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            referrerPolicy="origin"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            sandbox={isSandboxEnabled
                                ? "allow-scripts allow-same-origin allow-forms"
                                : undefined
                            }
                        />
                    </div>
                ) : (
                    // Render video element for direct URLs and local files
                    <video
                        ref={videoRef}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onTimeUpdate={handleTimeUpdate}
                        onClick={() => togglePlay()}
                        onError={handleVideoError}
                    />
                )
            ) : !activeStream && (
                <div className="no-video-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '20px',
                    color: 'var(--text-muted)',
                    padding: '60px 20px 20px', // Increased top padding to push content down
                    textAlign: 'center'
                }}>
                    <Film className="no-video-icon" size={64} style={{ opacity: 0.2 }} />
                    <div className="no-video-text" style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#fff', marginBottom: '8px' }}>No video selected</h2>
                        <p>Upload a local file or enter a URL to start watching together</p>
                    </div>
                    <div className="no-video-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto', marginBottom: '40px' }}>
                        <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileVideo size={18} />
                            Open File
                            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleLocalFile} />
                        </label>
                        <button className="btn-secondary" onClick={() => setIsUrlModalOpen(true)}>
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
                                + Add Another Server
                            </button>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Load Video</button>
                                <button type="button" className="btn-secondary" onClick={() => { setIsUrlModalOpen(false); setTempUrls(['']); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Video Overlay / Controls - Only show for non-embed sources AND when there is a video/stream */}
            {((videoState.sourceType !== 'embed' && (videoState.url || activeStream)) || isFullscreen) && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '40px 20px 20px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    opacity: showControls ? 1 : 0,
                    transition: 'opacity 0.4s cubic-bezier(0,4, 0, 0.2, 1)',
                    pointerEvents: showControls ? 'all' : 'none'
                }}>
                    {/* Progress Bar */}
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                            {/* Always render chat button in controls, but only visible/active if in fullscreen or if we want it always accessible */}
                            {(isFullscreen || true) && (
                                <button
                                    onClick={() => setIsChatOverlayOpen(!isChatOverlayOpen)}
                                    style={{
                                        background: isChatOverlayOpen ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: isChatOverlayOpen ? '#000' : '#fff',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: '10px',
                                        position: 'relative',
                                        display: isFullscreen ? 'flex' : 'none' // Strict visibility check via display
                                    }}
                                    title="Chat"
                                >
                                    <MessageSquare size={20} />
                                    {messages.length > lastMessageCountRef.current && !isChatOverlayOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-2px',
                                            right: '-2px',
                                            width: '8px',
                                            height: '8px',
                                            background: '#ff4444',
                                            borderRadius: '50%',
                                            border: '1px solid #000'
                                        }} />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

            {/* Chat Overlay - Rendered LAST to be on top of everything, including overlay controls */}
            <ChatOverlay
                isOpen={isChatOverlayOpen}
                onToggle={() => setIsChatOverlayOpen(!isChatOverlayOpen)}
                showFloatingButton={false}
            />
            <style jsx>{`
                @media (max-width: 768px) {
                    .no-video-container {
                        gap: 12px !important;
                    }
                    .no-video-icon {
                        width: 48px !important;
                        height: 48px !important;
                    }
                    .no-video-text h2 {
                        font-size: 1.2rem !important;
                    }
                    .no-video-text p {
                        font-size: 0.9rem !important;
                    }
                    .no-video-actions {
                        flex-direction: column;
                        width: 100%;
                        max-width: 240px;
                        gap: 10px !important;
                    }
                    .no-video-actions .btn-secondary {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}

