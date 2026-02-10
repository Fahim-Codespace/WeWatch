"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Movie, TVShow } from '@/types/media';
import { getImageUrl } from '@/lib/tmdb';
import { getMediaTitle, getMediaReleaseDate, getYear, formatRating, isMovie } from '@/lib/streamSources';
import { Star } from 'lucide-react';

interface MediaCardProps {
    media: Movie | TVShow;
    mediaType?: 'movie' | 'tv';
    onClick?: () => void;
}

export default function MediaCard({ media, mediaType, onClick }: MediaCardProps) {
    const router = useRouter();
    const title = getMediaTitle(media);
    const releaseDate = getMediaReleaseDate(media);
    const year = getYear(releaseDate);
    const rating = formatRating(media.vote_average);
    const type = mediaType || (isMovie(media) ? 'movie' : 'tv');

    const handleClick = () => {
        if (onClick) {
            onClick();
            return;
        }

        // Navigate to Media Detail Page
        router.push(`/media/${type}/${media.id}`);
    };

    return (
        <div
            onClick={handleClick}
            style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                aspectRatio: '2/3',
                minWidth: '200px'
            }}
            className="media-card"
        >
            {/* Poster Image */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                    src={getImageUrl(media.poster_path, 'w500')}
                    alt={title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 200px"
                />
            </div>

            {/* Overlay on Hover */}
            <div className="media-card-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '16px'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '4px',
                    lineHeight: '1.2'
                }}>
                    {title}
                </h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)'
                }}>
                    <span>{year}</span>
                    <span>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="var(--primary)" color="var(--primary)" />
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{rating}</span>
                    </div>
                </div>
            </div>

            {/* Rating Badge (Always Visible) */}
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: '700'
            }}>
                <Star size={12} fill="var(--primary)" color="var(--primary)" />
                <span style={{ color: 'var(--primary)' }}>{rating}</span>
            </div>

            <style jsx>{`
                .media-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 40px rgba(0, 255, 136, 0.2);
                }
                .media-card:hover .media-card-overlay {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
