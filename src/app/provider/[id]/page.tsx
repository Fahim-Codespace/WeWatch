"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { discoverByProvider, searchMovies, searchTVShows, getMediaProviders } from '@/lib/tmdb';
import { Movie, TVShow } from '@/types/media';
import MediaCard from '@/components/MediaCard';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

function ProviderPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const providerId = parseInt(params.id as string);
    const providerName = searchParams.get('name') || 'Provider';
    const initialType = (searchParams.get('type') as 'movie' | 'tv') || 'movie';

    const [mediaType, setMediaType] = useState<'movie' | 'tv'>(initialType);
    const [content, setContent] = useState<(Movie | TVShow)[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        async function fetchContent() {
            setLoading(true);
            try {
                if (searchQuery.trim()) {
                    // Search Mode
                    setIsSearching(true);
                    const searchFunc = mediaType === 'movie' ? searchMovies : searchTVShows;
                    const searchResults = await searchFunc(searchQuery, 1);

                    // Filter results by provider availability
                    // We check the first 20 results (1 page)
                    const filteredResults = await Promise.all(
                        searchResults.results.map(async (item: any) => {
                            try {
                                const providers = await getMediaProviders(mediaType, item.id);
                                const usProviders = providers.results['US']; // Assuming US region
                                if (!usProviders) return null;

                                const flatrate = usProviders.flatrate || [];
                                const ads = usProviders.ads || [];
                                const available = [...flatrate, ...ads].some((p: any) => p.provider_id === providerId);

                                return available ? item : null;
                            } catch (e) {
                                return null;
                            }
                        })
                    );

                    setContent(filteredResults.filter(Boolean) as (Movie | TVShow)[]);
                    setTotalPages(1); // Search results are not paginated in this simple implementation
                } else {
                    // Discover Mode
                    setIsSearching(false);
                    const data = await discoverByProvider(mediaType, providerId, page);
                    setContent(data.results);
                    setTotalPages(Math.min(data.total_pages, 500));
                }
            } catch (error) {
                console.error('Error fetching provider content:', error);
            } finally {
                setLoading(false);
            }
        }

        // Debounce search if typing? No, let's trigger on enter or effect.
        // For simplicity, let's use a timeout for search query, but I'll add a form/submit handler for better UX.
        // Or actually, just effect is fine with a small debounce if I type.
        // I'll effectively debounce the API call here if I used a debounced input.
        // But since I bound it to `searchQuery` directly, I should debounce the EFFECT execution or add a separate trigger.
        // I will use a separate trigger for "Enter" key in the UI part, and only update `searchQuery` when submitted.

        fetchContent();
    }, [providerId, mediaType, page, searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Trigger fetch via state change (handled by useEffect)
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', paddingTop: '80px' }}>
            {/* Header */}
            <div style={{
                padding: '24px 0',
                background: 'rgba(5, 5, 5, 0.8)',
                borderBottom: '1px solid var(--glass-border)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                backdropFilter: 'blur(20px)'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={() => router.push('/')}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></div>

                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            margin: 0
                        }}>
                            {providerName} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>Content</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' }}>
                        {/* Search Input */}
                        <form
                            onSubmit={(e) => { e.preventDefault(); /* Logic handled by input change for now or blur? */ }}
                            style={{ position: 'relative', width: '100%', maxWidth: '300px' }}
                        >
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder={`Search in ${providerName}...`}
                                defaultValue={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchQuery((e.target as HTMLInputElement).value);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    background: 'var(--secondary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '10px 12px 10px 40px',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    outline: 'none'
                                }}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </form>

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
                                onClick={() => { setMediaType('movie'); setPage(1); }}
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
                                onClick={() => { setMediaType('tv'); setPage(1); }}
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
                </div>
            </div>

            {/* Content Grid */}
            <div className="container" style={{ padding: '40px 0' }}>
                {loading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '24px'
                    }}>
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    aspectRatio: '2/3',
                                    borderRadius: '12px',
                                    background: 'var(--secondary)',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                }}
                            />
                        ))}
                    </div>
                ) : content.length > 0 ? (
                    <>
                        {isSearching && (
                            <div style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                                Showing search results for "{searchQuery}" available on {providerName}
                            </div>
                        )}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '24px',
                            marginBottom: '40px'
                        }}>
                            {content.map((item) => (
                                <MediaCard
                                    key={item.id}
                                    media={item}
                                    mediaType={mediaType}
                                />
                            ))}
                        </div>

                        {/* Pagination (Only for Discover mode) */}
                        {!isSearching && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '20px 0'
                            }}>
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="btn-secondary"
                                    style={{
                                        padding: '8px 12px',
                                        opacity: page === 1 ? 0.5 : 1,
                                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Page <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{page}</span> of {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="btn-secondary"
                                    style={{
                                        padding: '8px 12px',
                                        opacity: page === totalPages ? 0.5 : 1,
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-muted)'
                    }}>
                        <p>{isSearching ? `No results found for "${searchQuery}" on ${providerName}` : 'No content found for this provider.'}</p>
                        {isSearching && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    marginTop: '16px',
                                    color: 'var(--primary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default function ProviderPage() {
    return (
        <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
            </div>
        }>
            <ProviderPageContent />
        </Suspense>
    );
}
