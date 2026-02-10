"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { getTrending, searchMulti } from '@/lib/tmdb';
import MediaCard from './MediaCard';
import { Movie, TVShow } from '@/types/media';

interface BrowseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (media: Movie | TVShow) => void;
}

export default function BrowseModal({ isOpen, onClose, onSelect }: BrowseModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<(Movie | TVShow)[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch data
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let data;
                if (debouncedQuery.trim()) {
                    data = await searchMulti(debouncedQuery);
                } else {
                    data = await getTrending('all', 'week');
                }

                if (data && data.results) {
                    const filtered = data.results.filter((item: any) => item.media_type !== 'person');
                    setResults(filtered);
                }
            } catch (error) {
                console.error("Error fetching browse data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [debouncedQuery, isOpen]);

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
                width: '1000px',
                maxWidth: '100%',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(5, 5, 5, 0.5)'
                }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search for movies or TV shows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--secondary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '12px 16px 12px 42px',
                                color: '#fff',
                                outline: 'none',
                                transition: 'border-color 0.3s ease'
                            }}
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '16px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    background: 'rgba(5, 5, 5, 0.3)'
                }}>
                    {loading ? (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '12px',
                            color: 'var(--text-muted)'
                        }}>
                            <Loader2 size={32} className="spin" />
                            <span>Loading...</span>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '20px'
                        }}>
                            {results.map((media) => (
                                <MediaCard
                                    key={media.id}
                                    media={media}
                                    onClick={() => onSelect(media)}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                        }}>
                            No results found. Try a different search.
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
