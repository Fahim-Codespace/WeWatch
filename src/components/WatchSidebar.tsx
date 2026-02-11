"use client";

import React, { useState } from 'react';
import { MessageSquare, List, Server, Users, X } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import ChatSystem from './ChatSystem';
import EpisodeSelector from './EpisodeSelector';

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
    activeServerUrl
}: WatchSidebarProps) {
    const [activeTab, setActiveTab] = useState<'episodes' | 'servers' | 'chat'>('chat');
    const [isOpen, setIsOpen] = useState(true);

    // Determine default tab on mount logic modification if needed, but 'chat' is a safe default for a social room.
    // If not in a room (just browsing?), maybe different, but sidebar implies context. 
    // The previous logic was: mediaType === 'tv' ? 'episodes' : 'servers'

    // Let's refine the initial state slightly to prefer Chat if roomId exists, else fallback.
    // However, since this component is mostly used IN a room, 'chat' is the requested primary.

    return (
        <div className={`watch-sidebar ${isOpen ? 'open' : 'closed'}`}>
            {/* Tabs Header */}
            <div className="sidebar-header">
                {roomId && (
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`sidebar-tab ${activeTab === 'chat' ? 'active' : ''}`}
                    >
                        <MessageSquare size={18} />
                        <span>Chat</span>
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('servers')}
                    className={`sidebar-tab ${activeTab === 'servers' ? 'active' : ''}`}
                >
                    <Server size={18} />
                    <span>Servers</span>
                </button>

                {mediaType === 'tv' && (
                    <button
                        onClick={() => setActiveTab('episodes')}
                        className={`sidebar-tab ${activeTab === 'episodes' ? 'active' : ''}`}
                    >
                        <List size={18} />
                        <span>Episodes</span>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="sidebar-content">

                {/* Chat Tab */}
                {activeTab === 'chat' && roomId && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <ChatSystem />
                    </div>
                )}

                {/* Servers Tab */}
                {activeTab === 'servers' && (
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Stream Sources
                        </h3>
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
