"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWatchProviders, getImageUrl } from '@/lib/tmdb';
import { WatchProvider } from '@/types/media';
import Image from 'next/image';

export default function ProviderSelector() {
    const router = useRouter();
    const [providers, setProviders] = useState<WatchProvider[]>([]);
    const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProviders() {
            try {
                setLoading(true);
                const data = await getWatchProviders();
                setProviders(data);
            } catch (error) {
                console.error('Error fetching providers:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProviders();
    }, []);

    const handleProviderClick = (providerId: number, providerName: string) => {
        router.push(`/provider/${providerId}?type=${mediaType}&name=${encodeURIComponent(providerName)}`);
    };

    return (
        <div style={{
            padding: '40px 0',
            background: 'linear-gradient(180deg, rgba(5,5,5,0.5) 0%, rgba(5,5,5,0) 100%)'
        }}>
            <div className="container">
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: '800',
                            marginBottom: '8px'
                        }}>
                            Browse by <span style={{ color: 'var(--primary)' }}>Provider</span>
                        </h2>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem'
                        }}>
                            Discover content from your favorite streaming services
                        </p>
                    </div>

                    {/* Media Type Toggle */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        background: 'var(--secondary)',
                        padding: '4px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <button
                            onClick={() => setMediaType('movie')}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '6px',
                                background: mediaType === 'movie' ? 'var(--primary)' : 'transparent',
                                color: mediaType === 'movie' ? '#000' : 'var(--text-muted)',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Movies
                        </button>
                        <button
                            onClick={() => setMediaType('tv')}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '6px',
                                background: mediaType === 'tv' ? 'var(--primary)' : 'transparent',
                                color: mediaType === 'tv' ? '#000' : 'var(--text-muted)',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            TV Shows
                        </button>
                    </div>
                </div>

                {/* Provider Icons */}
                {loading ? (
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        padding: '20px 0'
                    }}>
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '16px',
                                    background: 'var(--secondary)',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    flexShrink: 0
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        padding: '20px 0',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--primary) var(--secondary)'
                    }}>
                        {providers.map((provider) => (
                            <div
                                key={provider.provider_id}
                                onClick={() => handleProviderClick(provider.provider_id, provider.provider_name)}
                                style={{
                                    position: 'relative',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: '2px solid var(--glass-border)',
                                    background: '#fff'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 255, 136, 0.3)';
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                }}
                            >
                                <Image
                                    src={getImageUrl(provider.logo_path, 'w200')}
                                    alt={provider.provider_name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />

                                {/* Tooltip */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-35px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(0, 0, 0, 0.9)',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    transition: 'opacity 0.2s ease',
                                    zIndex: 10
                                }}
                                    className="provider-tooltip"
                                >
                                    {provider.provider_name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                
                div:hover .provider-tooltip {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}
