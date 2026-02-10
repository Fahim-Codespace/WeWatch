"use client";

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchMulti } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { getMediaTitle, getYear, getMediaReleaseDate } from '@/lib/streamSources';
import Image from 'next/image';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSearch = async (searchQuery: string) => {
        setQuery(searchQuery);

        if (searchQuery.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        try {
            const data = await searchMulti(searchQuery);
            const filtered = data.results
                .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                .slice(0, 8);
            setResults(filtered);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResultClick = (item: any) => {
        const type = item.media_type === 'movie' ? 'movie' : 'tv';
        const title = getMediaTitle(item);

        // Navigate to Media Detail Page
        router.push(`/media/${type}/${item.id}`);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '8px 12px',
                gap: '8px',
                minWidth: '300px'
            }}>
                <Search size={18} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Search movies & TV shows..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontSize: '0.9rem',
                        flex: 1
                    }}
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setIsOpen(false);
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={16} color="var(--text-muted)" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999
                        }}
                    />

                    {/* Results */}
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        background: 'rgba(10, 10, 10, 0.98)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}>
                        {isLoading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Searching...
                            </div>
                        ) : results.length > 0 ? (
                            results.map((item) => {
                                const title = getMediaTitle(item);
                                const releaseDate = getMediaReleaseDate(item);
                                const year = getYear(releaseDate);
                                const type = item.media_type === 'movie' ? 'Movie' : 'TV Show';

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleResultClick(item)}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--glass-border)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 136, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: '50px',
                                            height: '75px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            background: 'var(--secondary)'
                                        }}>
                                            {item.poster_path && (
                                                <Image
                                                    src={getImageUrl(item.poster_path, 'w200')}
                                                    alt={title}
                                                    width={50}
                                                    height={75}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.95rem',
                                                fontWeight: '600',
                                                color: '#fff',
                                                marginBottom: '4px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {title}
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                <span>{type}</span>
                                                <span>•</span>
                                                <span>{year}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : query.length >= 2 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No results found
                            </div>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}
