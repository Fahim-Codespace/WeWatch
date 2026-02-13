"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, MessageSquare, Users, Trash2, Play, Pause, X } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format time (mm:ss)
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const CustomAudioPlayer = ({ src, sender, isMe }: { src: string, sender: string, isMe: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
            <audio ref={audioRef} src={src} style={{ display: 'none' }} />
            <button
                onClick={togglePlay}
                style={{
                    background: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isMe ? '#000' : '#fff'
                }}
            >
                {isPlaying ? <Pause size={16} fill={isMe ? "#000" : "#fff"} /> : <Play size={16} fill={isMe ? "#000" : "#fff"} />}
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{
                    height: '4px',
                    background: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: isMe ? '#000' : '#fff',
                        transition: 'width 0.1s linear'
                    }}></div>
                </div>
                <div style={{
                    fontSize: '0.65rem',
                    color: isMe ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                    textAlign: 'right'
                }}>
                    {formatTime(duration)}
                </div>
            </div>
        </div>
    );
};

export default function ChatSystem({ showUsersOnly = false }: { showUsersOnly?: boolean }) {
    const { messages, sendMessage, sendVoiceMessage, participants, currentUserName, socket } = useRoom();
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    // Removed internal activeTab state
    const scrollRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText.trim());
            setInputText('');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => setAudioChunks((prev) => [...prev, e.data]);
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                sendVoiceMessage(audioBlob);
                setAudioChunks([]);
            };
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Failed to start recording:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            // Stop but don't save
            mediaRecorderRef.current.onstop = null; // Clear handler
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setAudioChunks([]);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    return (
        <div className="glass" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(10, 10, 10, 0.4)',
            overflow: 'hidden'
        }}>
            {/* Tabs are removed in favor of parent sidebar control */}

            {!showUsersOnly ? (
                <>
                    {/* Messages Area */}
                    <div ref={scrollRef} style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        alignSelf: msg.sender === currentUserName ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%'
                                    }}
                                >
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '4px',
                                        textAlign: msg.sender === currentUserName ? 'right' : 'left'
                                    }}>
                                        {msg.sender}
                                    </div>
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background: msg.sender === currentUserName ? 'var(--primary)' : 'var(--secondary)',
                                        color: msg.sender === currentUserName ? '#000' : '#fff',
                                        fontWeight: msg.sender === currentUserName ? '600' : '400',
                                        fontSize: '0.9rem',
                                        boxShadow: msg.sender === currentUserName ? '0 4px 12px var(--primary-glow)' : 'none'
                                    }}>
                                        {msg.text && <div>{msg.text}</div>}
                                        {msg.voiceUrl && (
                                            <CustomAudioPlayer
                                                src={msg.voiceUrl}
                                                sender={msg.sender}
                                                isMe={msg.sender === currentUserName}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(5,5,5,0.4)' }}>
                        {!isRecording ? (
                            // Normal Text Input
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'var(--secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '24px',
                                            padding: '12px 16px',
                                            color: '#fff',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={startRecording}
                                    style={{
                                        background: 'var(--secondary)',
                                        border: 'none',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <Mic size={20} />
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, justifyContent: 'center' }}
                                    disabled={!inputText.trim()}
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        ) : (
                            // Recording UI
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                <div style={{
                                    flex: 1,
                                    background: 'rgba(255, 68, 68, 0.1)',
                                    borderRadius: '24px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    border: '1px solid rgba(255, 68, 68, 0.2)'
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: '#ff4444',
                                        boxShadow: '0 0 10px #ff4444',
                                        animation: 'pulse 1.5s infinite'
                                    }}></div>
                                    <span style={{ color: '#ff4444', fontWeight: '600', fontFamily: 'monospace' }}>
                                        Recording {formatTime(recordingTime)}...
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={cancelRecording}
                                    style={{
                                        background: 'var(--secondary)',
                                        border: 'none',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ff4444',
                                        cursor: 'pointer'
                                    }}
                                    title="Cancel"
                                >
                                    <Trash2 size={20} />
                                </button>

                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    style={{
                                        background: 'var(--primary)',
                                        border: 'none',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#000',
                                        cursor: 'pointer',
                                        boxShadow: '0 0 20px var(--primary-glow)'
                                    }}
                                    title="Send Voice Message"
                                >
                                    <Send size={20} />
                                </button>

                                <style jsx>{`
                                    @keyframes pulse {
                                        0% { opacity: 1; transform: scale(1); }
                                        50% { opacity: 0.5; transform: scale(0.8); }
                                        100% { opacity: 1; transform: scale(1); }
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>

                    {/* Watchers Section (Restored) */}
                    <div style={{
                        padding: '16px 20px',
                        borderTop: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Users size={14} />
                            <span>Room Members ({participants.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                            {participants.map((p) => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        background: p.id === socket?.id ? 'var(--primary)' : 'var(--secondary)',
                                        border: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: p.id === socket?.id ? '#000' : '#fff',
                                        fontWeight: '700',
                                        fontSize: '0.8rem'
                                    }}>
                                        {p.name[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{
                                            fontWeight: '500',
                                            fontSize: '0.9rem',
                                            color: '#fff',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {p.name} {p.id === socket?.id && '(You)'}
                                        </div>
                                    </div>
                                    {p.isHost && (
                                        <div style={{
                                            fontSize: '0.65rem',
                                            background: 'rgba(255, 215, 0, 0.1)',
                                            color: '#ffd700',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255, 215, 0, 0.2)'
                                        }}>
                                            HOST
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px 0' }}>
                        Watchers ({participants.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {participants.map((p) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#000',
                                    fontWeight: '800'
                                }}>
                                    {p.name[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600' }}>{p.name} {p.id === 'Me' ? '(You)' : ''}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{p.isHost ? 'Host' : 'Watcher'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
