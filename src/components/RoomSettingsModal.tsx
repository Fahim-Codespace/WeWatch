"use client";

import React from 'react';
import { X, Shield, Info } from 'lucide-react';

interface RoomSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isHost: boolean;
    persistent: boolean;
    onTogglePersistence: (enabled: boolean) => void;
}

export default function RoomSettingsModal({
    isOpen,
    onClose,
    isHost,
    persistent,
    onTogglePersistence
}: RoomSettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div className="glass" style={{
                width: '500px',
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)',
                background: '#0a0a0a'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={20} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Room Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Persistence Toggle */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        opacity: isHost ? 1 : 0.5,
                        pointerEvents: isHost ? 'auto' : 'none'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>Keep Room Alive</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                                Prevent the room from being deleted when everyone leaves. Useful for recurring watch parties.
                            </div>
                        </div>

                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={persistent}
                                onChange={(e) => onTogglePersistence(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {!isHost && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 170, 0, 0.1)',
                            border: '1px solid rgba(255, 170, 0, 0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.85rem',
                            color: '#ffaa00'
                        }}>
                            <Info size={16} />
                            Only the room host can change these settings.
                        </div>
                    )}

                </div>

                <style jsx>{`
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 50px;
                        height: 28px;
                    }
                    .switch input { 
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #333;
                        transition: .4s;
                        border-radius: 34px;
                    }
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 20px;
                        width: 20px;
                        left: 4px;
                        bottom: 4px;
                        background-color: white;
                        transition: .4s;
                        border-radius: 50%;
                    }
                    input:checked + .slider {
                        background-color: var(--primary);
                    }
                    input:checked + .slider:before {
                        transform: translateX(22px);
                    }
                `}</style>
            </div>
        </div>
    );
}
