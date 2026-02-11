"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, MessageSquare, Users, Trash2 } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatSystem() {
    const { messages, sendMessage, sendVoiceMessage, participants, currentUserName } = useRoom();
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
    const scrollRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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
        } catch (err) {
            console.error("Failed to start recording:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'chat' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'chat' ? '2px solid var(--primary)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <MessageSquare size={18} />
                    Messages
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <Users size={18} />
                    Watchers ({participants.length})
                </button>
            </div>

            {activeTab === 'chat' ? (
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
                                            <audio src={msg.voiceUrl} controls style={{ height: '30px', width: '180px', filter: msg.sender === currentUserName ? 'invert(1)' : 'none' }} />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(5,5,5,0.4)' }}>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onMouseLeave={stopRecording}
                                style={{
                                    background: isRecording ? '#ff4444' : 'var(--secondary)',
                                    border: 'none',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isRecording ? '0 0 20px rgba(255, 68, 68, 0.4)' : 'none'
                                }}
                            >
                                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
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
                    </div>
                </>
            ) : (
                <div style={{ padding: '20px' }}>
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
