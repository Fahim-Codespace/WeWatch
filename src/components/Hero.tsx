"use client";

import React, { useState } from 'react';
import { Play, Search, Plus, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

export default function Hero() {
    const [roomId, setRoomId] = useState('');
    const router = useRouter();

    const handleCreateRoom = () => {
        const id = uuidv4().substring(0, 8);
        router.push(`/room/${id}`);
    };

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomId.trim()) {
            router.push(`/room/${roomId.trim()}`);
        }
    };

    return (
        <div className="container" style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '40px 20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                    padding: '8px 16px',
                    background: 'rgba(0, 255, 136, 0.1)',
                    borderRadius: '20px',
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                    color: 'var(--primary)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    <Play size={16} fill="var(--primary)" />
                    <span>Sync Your Movie Experience</span>
                </div>

                <h1 className="glow-text" style={{
                    fontSize: 'clamp(3rem, 10vw, 5rem)',
                    fontWeight: '900',
                    lineHeight: '1',
                    marginBottom: '24px',
                    letterSpacing: '-2px'
                }}>
                    WATCH <span style={{ color: 'var(--primary)' }}>TOGETHER</span><br />
                    ANYWHERE.
                </h1>

                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '1.2rem',
                    maxWidth: '600px',
                    margin: '0 auto 40px',
                    lineHeight: '1.6'
                }}>
                    Experience movies in perfect sync with your friends. Chat, share reactions, and enjoy together, no matter the distance.
                </p>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '16px'
                    }}>
                        <button className="btn-primary" onClick={handleCreateRoom}>
                            <Plus size={20} />
                            Create Movie Room
                        </button>

                        <div style={{
                            display: 'flex',
                            background: 'var(--secondary)',
                            borderRadius: '8px',
                            padding: '4px',
                            border: '1px solid var(--glass-border)',
                            transition: 'border-color 0.3s ease'
                        }} onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                            <form onSubmit={handleJoinRoom} style={{ display: 'flex' }}>
                                <input
                                    type="text"
                                    placeholder="Enter Room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        padding: '8px 16px',
                                        outline: 'none',
                                        width: '200px'
                                    }}
                                />
                                <button type="submit" className="btn-secondary" style={{ padding: '8px 16px' }}>
                                    <UserPlus size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </motion.div>

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
                zIndex: -1,
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
                zIndex: -1,
                borderRadius: '50%'
            }}></div>
        </div>
    );
}
