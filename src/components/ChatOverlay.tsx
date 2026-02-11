"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '@/context/RoomContext';

interface ChatOverlayProps {
    isOpen: boolean;
    onToggle: () => void;
    showFloatingButton?: boolean;
}

// Reuse formatTime from ChatSystem (or move to helper)
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function ChatOverlay({ isOpen, onToggle, showFloatingButton = true }: ChatOverlayProps) {
    const { messages, sendMessage, sendVoiceMessage, currentUserName } = useRoom();
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastMsgCount = useRef(messages.length);

    // Voice State
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Track unread messages when closed
    useEffect(() => {
        if (!isOpen) {
            const diff = messages.length - lastMsgCount.current;
            if (diff > 0) {
                setUnreadCount(prev => prev + diff);
            }
        } else {
            setUnreadCount(0);
        }
        lastMsgCount.current = messages.length;
    }, [messages, isOpen]);

    // Auto-scroll
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText.trim());
            setInputText('');
        }
    };

    // --- Voice Logic (Duplicated for now, ideally shared/hook) ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => setAudioChunks(prev => [...prev, e.data]);
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                sendVoiceMessage(audioBlob);
                setAudioChunks([]);
                if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            };
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) {
            console.error("Failed to record", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            setAudioChunks([]);
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
    };

    return (
        <>
            {/* Draggable Toggle Button (Visible when closed) */}
            {!isOpen && showFloatingButton && (
                <motion.button
                    drag
                    dragMomentum={false}
                    dragConstraints={{ left: 0, right: window.innerWidth - 60, top: 0, bottom: window.innerHeight - 60 }}
                    onClick={onToggle}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        position: 'absolute',
                        bottom: '100px',
                        right: '20px',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        cursor: 'grab'
                    }}
                >
                    <MessageSquare size={24} color="#000" fill="#000" />
                    {unreadCount > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            background: '#ff4444',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #000'
                        }}>
                            {unreadCount}
                        </div>
                    )}
                </motion.button>
            )}

            {/* Chat Window (Visible when open) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag
                        dragMomentum={false}
                        style={{
                            position: 'absolute',
                            top: '20%',
                            right: '20px',
                            width: '350px',
                            height: '500px',
                            maxHeight: '70vh',
                            background: 'rgba(10, 10, 10, 0.85)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 50,
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'grab',
                                background: 'rgba(255,255,255,0.03)'
                            }}
                            className="drag-handle"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                <MessageSquare size={18} color="var(--primary)" />
                                <span>Live Chat</span>
                            </div>
                            <button
                                onClick={onToggle}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} style={{
                            flex: 1,
                            padding: '16px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {messages.map((msg) => (
                                <div key={msg.id} style={{
                                    alignSelf: msg.sender === currentUserName ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%'
                                }}>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '2px',
                                        textAlign: msg.sender === currentUserName ? 'right' : 'left'
                                    }}>
                                        {msg.sender}
                                    </div>
                                    <div style={{
                                        padding: '8px 12px',
                                        borderRadius: '12px',
                                        background: msg.sender === currentUserName ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        color: msg.sender === currentUserName ? '#000' : '#fff',
                                        fontSize: '0.9rem'
                                    }}>
                                        {msg.text}
                                        {msg.voiceUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ fontSize: '1.2rem' }}>🔊</div>
                                                <span>Voice Message</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)' }}>
                            {!isRecording ? (
                                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Message..."
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        onMouseDown={e => e.stopPropagation()} // Prevent drag start on input click
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '20px',
                                            padding: '8px 12px',
                                            color: '#fff',
                                            outline: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0 4px' }}
                                    >
                                        <Mic size={20} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim()}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', opacity: inputText.trim() ? 1 : 0.5 }}
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                                    <div style={{
                                        flex: 1,
                                        background: 'rgba(255, 68, 68, 0.1)',
                                        borderRadius: '24px',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: '1px solid rgba(255, 68, 68, 0.2)',
                                        fontSize: '0.85rem'
                                    }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', animation: 'pulse 1s infinite' }}></div>
                                        <span style={{ color: '#ff4444', fontFamily: 'monospace' }}>{formatTime(recordingTime)}</span>
                                    </div>
                                    <button onClick={cancelRecording} style={{ background: 'none', border: 'none', color: '#ff4444' }}><Trash2 size={18} /></button>
                                    <button onClick={stopRecording} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={16} /></button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </>
    );
}
