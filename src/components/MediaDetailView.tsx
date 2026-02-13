"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Plus, X, ArrowLeft, Star, Calendar, Clock, Check } from 'lucide-react';
import { MediaDetails, TVShowDetails, Video } from '@/types/media';
import { getImageUrl } from '@/lib/tmdb';
import { formatRuntime, getYear, formatRating } from '@/lib/streamSources';
import { useWatchHistory } from '@/hooks/useWatchHistory';

interface MediaDetailViewProps {
    media: MediaDetails | TVShowDetails;
    type: 'movie' | 'tv';
    onPlay?: () => void;
    onBack?: () => void;
}

export default function MediaDetailView({ media, type, onPlay, onBack }: MediaDetailViewProps) {
    const router = useRouter();
    const [showTrailer, setShowTrailer] = useState(false);
    const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchHistory();
    const isInList = watchlist.some(item => item.id === media.id && item.type === type);

    const title = type === 'movie' ? (media as any).title : (media as any).name;
    const releaseDate = type === 'movie' ? (media as any).release_date : (media as any).first_air_date;
    const rating = formatRating(media.vote_average);
    const backdropUrl = getImageUrl(media.backdrop_path, 'original');
    const posterUrl = getImageUrl(media.poster_path, 'w500');

    // Find trailer
    const trailer = (media as any).videos?.results?.find(
        (v: Video) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
            {/* Hero Section */}
            <div className="hero-container">
                {/* Backdrop Image */}
                <Image
                    src={backdropUrl}
                    alt={title}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
                    priority
                />

                {/* Back Button */}
                <button
                    onClick={() => {
                        if (onBack) {
                            onBack();
                        } else {
                            router.back();
                        }
                    }}
                    style={{
                        position: 'absolute',
                        top: '40px',
                        left: '40px',
                        zIndex: 100,
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Go Back"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* Gradient Overlays */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.8) 20%, rgba(5,5,5,0.2) 60%, rgba(5,5,5,0.6) 100%)'
                }} />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to right, #050505 0%, rgba(5,5,5,0.5) 40%, transparent 100%)'
                }} />

                {/* Content Container */}
                <div className="container hero-content-inner">
                    {/* Floating Poster */}
                    <div className="floating-poster">
                        <Image
                            src={posterUrl}
                            alt={title}
                            width={350}
                            height={525}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>

                    {/* Hero Text */}
                    <div className="hero-text">
                        {/* Genres/Tags */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {media.genres?.map(g => (
                                <span key={g.id} style={{
                                    padding: '4px 12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#e5e5e5',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {g.name}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="hero-title">
                            {title}
                        </h1>

                        {/* Tagline / Quote */}
                        {media.tagline && (
                            <p className="hero-tagline">
                                "{media.tagline}"
                            </p>
                        )}

                        {/* Short Overview */}
                        <p className="hero-overview">
                            {media.overview}
                        </p>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            {onPlay ? (
                                <button className="btn-play" onClick={onPlay}>
                                    <Play size={24} fill="#000" />
                                    Play Now
                                </button>
                            ) : (
                                <Link href={
                                    type === 'tv'
                                        ? `/watch?media=${type}-${media.id}&title=${encodeURIComponent(title)}&season=1&episode=1`
                                        : `/watch?media=${type}-${media.id}&title=${encodeURIComponent(title)}`
                                }>
                                    <button className="btn-play">
                                        <Play size={24} fill="#000" />
                                        Play Now
                                    </button>
                                </Link>
                            )}

                            <button
                                className="btn-watchlist"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (isInList) {
                                        removeFromWatchlist(media.id, type);
                                    } else {
                                        addToWatchlist(media, type);
                                    }
                                }}
                                style={{
                                    background: isInList ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                    borderColor: isInList ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)',
                                    color: isInList ? 'var(--primary)' : '#fff'
                                }}
                            >
                                {isInList ? <Check size={24} /> : <Plus size={24} />}
                                {isInList ? 'In Watchlist' : 'Watchlist'}
                            </button>

                            {trailer && (
                                <button
                                    onClick={() => setShowTrailer(true)}
                                    className="btn-trailer"
                                >
                                    Watch Trailer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trailer Modal */}
            {showTrailer && trailer && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px'
                }}>
                    <button
                        onClick={() => setShowTrailer(false)}
                        style={{
                            position: 'absolute',
                            top: '40px',
                            right: '40px',
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={32} />
                    </button>
                    <div style={{ width: '100%', maxWidth: '1200px', aspectRatio: '16/9' }}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                            title="Trailer"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ borderRadius: '16px', boxShadow: '0 0 100px rgba(0,0,0,0.5)' }}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Info */}
            <div className="container main-grid">
                {/* Left Column (Details) */}
                <div className="details-column">
                    {/* Trailer Section Inline (if preferred) */}
                    {trailer && (
                        <div style={{ marginBottom: '60px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '2px' }}></span>
                                Trailer
                            </h3>
                            <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${trailer.key}`}
                                    title="Main Trailer"
                                    frameBorder="0"
                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Overview */}
                    <div style={{ marginBottom: '60px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '2px' }}></span>
                            Overview
                        </h3>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#a1a1aa' }}>
                            {media.overview}
                        </p>
                    </div>

                    {/* Collection Banner */}
                    {(media as any).belongs_to_collection && (
                        <div className="collection-banner">
                            <Image
                                src={getImageUrl((media as any).belongs_to_collection.backdrop_path, 'original')}
                                alt={(media as any).belongs_to_collection.name}
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }} />

                            <div style={{ position: 'relative', zIndex: 10, padding: '40px' }}>
                                <p style={{ color: 'var(--primary)', fontWeight: '700', marginBottom: '8px', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Part of</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '20px' }}>{(media as any).belongs_to_collection.name}</h2>
                                <button className="btn-collection">
                                    View Collection
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Cast */}
                    {media.credits?.cast && media.credits.cast.length > 0 && (
                        <div style={{ marginBottom: '60px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '2px' }}></span>
                                Cast
                            </h3>
                            <div className="cast-grid">
                                {media.credits.cast.slice(0, 8).map((actor) => (
                                    <div key={actor.id} style={{ textAlign: 'center' }}>
                                        <div style={{
                                            width: '100%',
                                            aspectRatio: '1/1',
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            marginBottom: '12px',
                                            background: 'var(--secondary)',
                                            border: '2px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {actor.profile_path ? (
                                                <Image
                                                    src={getImageUrl(actor.profile_path, 'w200')}
                                                    alt={actor.name}
                                                    width={140}
                                                    height={140}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#222' }} />
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>{actor.name}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{actor.character}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (Stats) */}
                <div className="stats-column">
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '30px',
                        position: 'sticky',
                        top: '40px'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                            Media Info
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Release Date</p>
                                <p style={{ fontSize: '1rem', fontWeight: '600' }}>{releaseDate}</p>
                            </div>

                            <div>
                                <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Status</p>
                                <p style={{ fontSize: '1rem', fontWeight: '600', color: media.status === 'Released' ? 'var(--primary)' : '#fff' }}>
                                    {media.status}
                                </p>
                            </div>

                            {type === 'movie' && (media as any).original_title && (
                                <div>
                                    <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Original Title</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600', fontStyle: 'italic' }}>{(media as any).original_title}</p>
                                </div>
                            )}

                            {type === 'movie' && (media as any).runtime > 0 && (
                                <div>
                                    <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Runtime</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>{formatRuntime((media as any).runtime)}</p>
                                </div>
                            )}

                            {type === 'movie' && (media as any).budget > 0 && (
                                <div>
                                    <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Budget</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>{formatCurrency((media as any).budget)}</p>
                                </div>
                            )}

                            {type === 'movie' && (media as any).revenue > 0 && (
                                <div>
                                    <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Revenue</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>{formatCurrency((media as any).revenue)}</p>
                                </div>
                            )}

                            <div>
                                <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Original Language</p>
                                <p style={{ fontSize: '1rem', fontWeight: '600', textTransform: 'uppercase' }}>{(media as any).original_language}</p>
                            </div>

                            {media.vote_average > 0 && (
                                <div>
                                    <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '4px' }}>Rating</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Star fill="var(--primary)" color="var(--primary)" size={16} />
                                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{rating}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '12px' }}>Production</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {(media as any).production_companies?.map((pc: any) => (
                                    <span key={pc.id} style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                        {pc.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hero-container {
                    position: relative;
                    height: 85vh;
                    width: 100%;
                    overflow: hidden;
                }

                .hero-content-inner {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 1400px;
                    padding: 0 40px 60px;
                    display: flex;
                    align-items: flex-end;
                    gap: 60px;
                }

                .floating-poster {
                    flex-shrink: 0;
                    width: 350px;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                    border: 1px solid rgba(255,255,255,0.1);
                    position: relative;
                    z-index: 10;
                }

                .hero-text {
                    flex: 1;
                    padding-bottom: 20px;
                    z-index: 10;
                }

                .hero-title {
                    font-size: 4.5rem;
                    font-weight: 900;
                    line-height: 1.1;
                    margin-bottom: 16px;
                    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }

                .hero-tagline {
                    font-size: 1.4rem;
                    color: var(--primary);
                    font-style: italic;
                    margin-bottom: 24px;
                    font-weight: 500;
                }

                .hero-overview {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: #d4d4d8;
                    max-width: 800px;
                    margin-bottom: 32px;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .action-buttons {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .btn-play {
                    height: 56px;
                    padding: 0 32px;
                    background: #fff;
                    color: #000;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .btn-play:hover { transform: scale(1.02); }

                .btn-watchlist {
                    height: 56px;
                    padding: 0 32px;
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid rgba(255,255,255,0.2);
                    cursor: pointer;
                    backdrop-filter: blur(10px);
                    transition: background 0.2s ease;
                }
                .btn-watchlist:hover { background: rgba(255,255,255,0.1); }

                .btn-trailer {
                    height: 56px;
                    padding: 0 32px;
                    background: transparent;
                    color: #fff;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: none;
                    cursor: pointer;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                }

                .main-grid {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 40px;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 350px;
                    gap: 60px;
                }

                .collection-banner {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    height: 250px;
                    margin-bottom: 60px;
                    display: flex;
                    align-items: center;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .btn-collection {
                    padding: 12px 24px;
                    background: #fff;
                    color: #000;
                    border-radius: 8px;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .cast-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 20px;
                }

                @media (max-width: 1024px) {
                    .hero-container {
                        height: 70vh;
                    }
                    .floating-poster {
                        display: none;
                    }
                    .hero-content-inner {
                        padding: 0 20px 40px;
                    }
                    .hero-title {
                        font-size: 3rem;
                    }
                    .main-grid {
                        grid-template-columns: 1fr;
                        padding: 20px;
                        gap: 40px;
                    }
                    .stats-column {
                        order: 2;
                    }
                    .details-column {
                        order: 1;
                    }
                }

                @media (max-width: 768px) {
                    .hero-container {
                        height: auto;
                        min-height: 85vh;
                        display: flex;
                        align-items: flex-end;
                    }
                    .hero-content-inner {
                        position: relative;
                        bottom: auto;
                        left: auto;
                        transform: none;
                        padding: 120px 20px 40px;
                    }
                    .hero-title {
                        font-size: 2.5rem;
                        line-height: 1.1;
                    }
                    .hero-tagline {
                        font-size: 1.1rem;
                    }
                    .action-buttons {
                        gap: 10px;
                    }
                    .btn-play, .btn-watchlist, .btn-trailer {
                        height: 48px;
                        padding: 0 20px;
                        font-size: 0.9rem;
                        flex: 1;
                        justify-content: center;
                    }
                    .cast-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    );
}
