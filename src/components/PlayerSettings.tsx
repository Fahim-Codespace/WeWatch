"use client";

import React, { useState } from 'react';
import { Settings, X, Gauge, Zap, Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PlayerSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentQuality: number;
    availableQualities: { index: number; height: number; label: string }[];
    onQualityChange: (index: number) => void;
    playbackSpeed: number;
    onSpeedChange: (speed: number) => void;
    servers: { url: string; label: string; health: 'unknown' | 'good' | 'slow' | 'failed' }[];
    activeServerIndex: number;
    onServerChange: (index: number) => void;
}

const SPEED_OPTIONS = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: 'Normal' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 1.75, label: '1.75x' },
    { value: 2, label: '2x' }
];

export default function PlayerSettings({
    isOpen,
    onClose,
    currentQuality,
    availableQualities,
    onQualityChange,
    playbackSpeed,
    onSpeedChange,
    servers,
    activeServerIndex,
    onServerChange
}: PlayerSettingsProps) {
    const [activeTab, setActiveTab] = useState<'quality' | 'speed' | 'servers'>('quality');

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '60px',
                right: '10px',
                width: '280px',
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Player Settings</span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex'
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                {servers.length > 0 && (
                    <button
                        onClick={() => setActiveTab('servers')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'servers' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            borderBottom: activeTab === 'servers' ? '2px solid var(--primary)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <Server size={16} />
                        Servers
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('quality')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'quality' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'quality' ? '2px solid var(--primary)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Gauge size={16} />
                    Quality
                </button>
                <button
                    onClick={() => setActiveTab('speed')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'speed' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'speed' ? '2px solid var(--primary)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Zap size={16} />
                    Speed
                </button>
            </div>

            {/* Content */}
            <div style={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {activeTab === 'servers' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {servers.map((server, index) => {
                            const healthIcon = server.health === 'good' ? <CheckCircle size={16} /> :
                                server.health === 'failed' ? <XCircle size={16} /> :
                                    server.health === 'slow' ? <AlertCircle size={16} /> :
                                        <Server size={16} />;
                            const healthColor = server.health === 'good' ? 'var(--primary)' :
                                server.health === 'failed' ? '#ff4444' :
                                    server.health === 'slow' ? '#ffaa00' :
                                        'var(--text-muted)';

                            return (
                                <button
                                    key={index}
                                    onClick={() => onServerChange(index)}
                                    style={{
                                        padding: '12px 16px',
                                        background: activeServerIndex === index ? 'rgba(0, 255, 136, 0.1)' : 'var(--secondary)',
                                        border: activeServerIndex === index ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: activeServerIndex === index ? 'var(--primary)' : '#fff',
                                        cursor: 'pointer',
                                        fontWeight: activeServerIndex === index ? '700' : '500',
                                        fontSize: '0.9rem',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <span>{server.label}</span>
                                    <span style={{ color: healthColor, display: 'flex', alignItems: 'center' }}>
                                        {healthIcon}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : activeTab === 'quality' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {availableQualities.length > 0 ? (
                            availableQualities.map((quality) => (
                                <button
                                    key={quality.index}
                                    onClick={() => onQualityChange(quality.index)}
                                    style={{
                                        padding: '12px 16px',
                                        background: currentQuality === quality.index ? 'rgba(0, 255, 136, 0.1)' : 'var(--secondary)',
                                        border: currentQuality === quality.index ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: currentQuality === quality.index ? 'var(--primary)' : '#fff',
                                        cursor: 'pointer',
                                        fontWeight: currentQuality === quality.index ? '700' : '500',
                                        fontSize: '0.9rem',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {quality.label}
                                </button>
                            ))
                        ) : (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem'
                            }}>
                                No quality options available for this video
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {SPEED_OPTIONS.map((speed) => (
                            <button
                                key={speed.value}
                                onClick={() => onSpeedChange(speed.value)}
                                style={{
                                    padding: '12px 16px',
                                    background: playbackSpeed === speed.value ? 'rgba(0, 255, 136, 0.1)' : 'var(--secondary)',
                                    border: playbackSpeed === speed.value ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    color: playbackSpeed === speed.value ? 'var(--primary)' : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: playbackSpeed === speed.value ? '700' : '500',
                                    fontSize: '0.9rem',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {speed.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
