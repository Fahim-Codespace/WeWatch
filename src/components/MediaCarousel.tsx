"use client";

import React, { useRef } from 'react';
import MediaCard from './MediaCard';
import { Movie, TVShow } from '@/types/media';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaCarouselProps {
    title: string;
    items: (Movie | TVShow)[];
    mediaType?: 'movie' | 'tv';
}

export default function MediaCarousel({ title, items, mediaType }: MediaCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div style={{ marginBottom: '40px' }}>
            {/* Section Title */}
            <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '16px',
                color: '#fff',
                paddingLeft: '20px'
            }}>
                {title}
            </h2>

            {/* Carousel Container */}
            <div style={{ position: 'relative', group: 'carousel' }}>
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="carousel-arrow carousel-arrow-left"
                    style={{
                        position: 'absolute',
                        left: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        color: '#fff'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="carousel-arrow carousel-arrow-right"
                    style={{
                        position: 'absolute',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        color: '#fff'
                    }}
                >
                    <ChevronRight size={24} />
                </button>

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        padding: '0 20px',
                        scrollBehavior: 'smooth'
                    }}
                    className="hide-scrollbar"
                >
                    {items.map((item) => (
                        <MediaCard key={item.id} media={item} mediaType={mediaType} />
                    ))}
                </div>
            </div>

            <style jsx>{`
                .carousel-arrow:hover {
                    background: rgba(0, 255, 136, 0.2) !important;
                    border-color: var(--primary) !important;
                }
                div:hover .carousel-arrow {
                    opacity: 1;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
