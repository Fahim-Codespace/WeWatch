"use client";

import React, { useState } from 'react';
import { MessageSquare, List, Server, X } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import EpisodeSelector from './EpisodeSelector';
// import ChatSystem from './ChatSystem'; // Chat is rendered directly if needed, or via component?
// In the user's legacy code, ChatSystem was used.
// But the user replaced it? Wait, let's check step 1416 again.
// The user's code had:
// {activeTab === 'chat' && roomId && (
//      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//          <ChatSystem /> // It WAS used!
//      </div>
// )}
// I need to make sure ChatSystem is imported.

import ChatSystem from './ChatSystem';

interface WatchSidebarProps {
    roomId?: string;
    mediaType: 'movie' | 'tv';
    seasons?: any[];
    // Episode Selector props
    tvId?: number;
    tvTitle?: string;
    currentSeason?: number;
    currentEpisode?: number;
    onEpisodeSelect?: (season: number, episode: number) => void;
    // Server props
    sources: any[];
    onServerSelect: (url: string) => void;
    activeServerUrl?: string;
    // Sandbox props
    isSandboxEnabled?: boolean;
    onToggleSandbox?: (enabled: boolean) => void;
}

export default function WatchSidebar({
    roomId,
    mediaType,
    seasons,
    tvId,
    tvTitle,
    currentSeason,
    currentEpisode,
    onEpisodeSelect,
    sources,
    onServerSelect,
    activeServerUrl,
    isSandboxEnabled = true,
    onToggleSandbox
}: WatchSidebarProps) {
    const [activeTab, setActiveTab] = useState<'episodes' | 'servers' | 'chat'>(
        mediaType === 'tv' ? 'episodes' : 'servers'
    );
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={`watch-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                {mediaType === 'tv' && (
                    <button
                        onClick={() => setActiveTab('episodes')}
                        className={`sidebar-tab ${activeTab === 'episodes' ? 'active' : ''}`}
                    >
                        <List size={18} />
                        <span>Episodes</span>
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('servers')}
                    className={`sidebar-tab ${activeTab === 'servers' ? 'active' : ''}`}
                >
                    <Server size={18} />
                    <span>Servers</span>
                </button>
                {roomId && (
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`sidebar-tab ${activeTab === 'chat' ? 'active' : ''}`}
                    >
                        <MessageSquare size={18} />
                        <span>Chat</span>
                    </button>
                )}
            </div>

            <div className="sidebar-content">
                {/* Episodes Tab */}
                {activeTab === 'episodes' && mediaType === 'tv' && (
                    <div style={{ padding: '0' }}>
                        {seasons && seasons.length > 0 && tvId && tvTitle ? (
                            <EpisodeSelector
                                tvId={tvId}
                                tvTitle={tvTitle}
                                currentSeason={currentSeason || 1}
                                currentEpisode={currentEpisode || 1}
                                seasons={seasons}
                                onEpisodeSelect={onEpisodeSelect || (() => { })}
                            />
                        ) : (
                            <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Loading episodes...
                            </div>
                        )}
                    </div>
                )}

                {/* Servers Tab */}
                {activeTab === 'servers' && (
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                                Stream Sources
                            </h3>
                            {/* Sandbox Toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }} title="Toggle Sandbox Mode">
                                <span>Sandbox</span>
                                <div style={{
                                    width: '36px',
                                    height: '20px',
                                    background: isSandboxEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    position: 'relative',
                                    transition: 'background 0.3s ease',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        background: '#fff',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: '1px',
                                        left: isSandboxEnabled ? '17px' : '1px',
                                        transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                    <input
                                        type="checkbox"
                                        checked={isSandboxEnabled}
                                        onChange={(e) => onToggleSandbox?.(e.target.checked)}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </label>
                        </div>
                        {sources.map((source, index) => {
                            const isActive = source.url === activeServerUrl;
                            return (
                                <button
                                    key={index}
                                    onClick={() => onServerSelect(source.url)}
                                    style={{
                                        padding: '12px 16px',
                                        background: isActive ? 'rgba(0, 255, 136, 0.1)' : 'var(--secondary)',
                                        border: `1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                                        borderRadius: '8px',
                                        color: isActive ? 'var(--primary)' : '#fff',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Server size={16} />
                                        <span style={{ fontWeight: '500' }}>{source.label || `Server ${index + 1}`}</span>
                                    </div>
                                    {isActive && (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                                    )}
                                </button>
                            );
                        })}
                        {sources.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No servers found.
                            </div>
                        )}
                    </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && roomId && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <ChatSystem />
                    </div>
                )}

            </div>

            <style jsx>{`
                .watch-sidebar {
                    background: var(--secondary);
                    border-left: 1px solid var(--glass-border);
                    display: flex;
                    flex-direction: column;
                    transition: width 0.3s ease, min-width 0.3s ease;
                    overflow: hidden;
                    position: relative;
                    padding-top: 80px;
                }
                .watch-sidebar.open {
                    width: 350px;
                    min-width: 350px;
                }
                .watch-sidebar.closed {
                    width: 0;
                    min-width: 0;
                }

                .sidebar-header {
                    display: flex;
                    border-bottom: 1px solid var(--glass-border);
                    background: rgba(0,0,0,0.2);
                }

                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    background: #0a0a0a;
                }

                .sidebar-tab {
                    flex: 1;
                    padding: 16px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    alignItems: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s ease;
                }
                .sidebar-tab:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.02);
                }
                .sidebar-tab.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                    background: rgba(0, 255, 136, 0.05);
                }

                @media (max-width: 768px) {
                    .watch-sidebar {
                        padding-top: 0;
                        border-left: none;
                        border-top: 1px solid var(--glass-border);
                    }
                    .watch-sidebar.open {
                        width: 100%;
                        min-width: 100%;
                        height: 100%;
                        flex: 1;
                    }
                }
            `}</style>
        </div>
    );
}
