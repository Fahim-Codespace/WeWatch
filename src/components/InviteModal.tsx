"use client";

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Facebook, MessageCircle, Instagram, Twitter } from 'lucide-react';
import { useParams } from 'next/navigation';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
    const params = useParams();
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const roomId = params?.id as string;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = [
        {
            name: 'Facebook',
            icon: <Facebook size={24} />,
            color: '#1877F2',
            action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank')
        },
        {
            name: 'WhatsApp',
            icon: <MessageCircle size={24} />, // Using MessageCircle as WhatsApp icon proxy if generic, but usually specific icon is better. Lucide has standard icons.
            color: '#25D366',
            action: () => window.open(`https://api.whatsapp.com/send?text=Join my watch party! ${encodeURIComponent(currentUrl)}`, '_blank')
        },
        {
            name: 'Messenger',
            icon: <MessageCircle size={24} />,
            color: '#0084FF',
            // Messenger web share is tricky, often redirects to FB. Using a generic intent or just copying. 
            // Better to guide user to copy link for Messenger if native share isn't supported.
            action: () => {
                // Try standard mobile share if available, else copy
                if (navigator.share) {
                    navigator.share({
                        title: 'Watch Party',
                        text: 'Join my watch party on WeWatch!',
                        url: currentUrl
                    }).catch(() => handleCopy());
                } else {
                    handleCopy();
                }
            }
        },
        {
            name: 'Twitter/X',
            icon: <Twitter size={24} />,
            color: '#000000',
            action: () => window.open(`https://twitter.com/intent/tweet?text=Join my watch party on WeWatch!&url=${encodeURIComponent(currentUrl)}`, '_blank')
        }
        // Instagram doesn't support web sharing via URL.
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div
                className="glass"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '450px',
                    maxWidth: '90%',
                    padding: '30px',
                    position: 'relative',
                    background: '#0a0a0a',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '5px'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'rgba(0, 255, 136, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        border: '1px solid rgba(0, 255, 136, 0.2)'
                    }}>
                        <Share2 size={30} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Invite Friends</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Share the link to watch together in real-time
                    </p>
                </div>

                {/* Copy Link Section */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
                        ROOM LINK
                    </label>
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        background: 'var(--secondary)',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <input
                            type="text"
                            value={currentUrl}
                            readOnly
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.9rem',
                                outline: 'none',
                                fontFamily: 'monospace'
                            }}
                        />
                        <button
                            onClick={handleCopy}
                            style={{
                                background: copied ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                color: copied ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Social Share Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px'
                }}>
                    {shareLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={link.action}
                            title={`Share to ${link.name}`}
                            style={{
                                background: 'var(--secondary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '16px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease, background 0.2s ease',
                                color: '#fff'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--secondary)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ color: link.color }}>{link.icon}</div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{link.name}</span>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Or share Room ID: <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{roomId}</span>
                </div>
            </div>
        </div>
    );
}
