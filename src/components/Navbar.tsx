"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Film, Menu, X } from 'lucide-react';
import SearchBar from './SearchBar';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(5, 5, 5, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--glass-border)'
        }}>
            <div className="container" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Logo */}
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{
                            background: 'var(--primary)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px var(--primary-glow)'
                        }}>
                            <Film size={18} color="#000" fill="#000" />
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-1px', color: '#fff' }}>
                            WE<span style={{ color: 'var(--primary)' }}>WATCH</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="desktop-menu" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <SearchBar />
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-toggle"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu">
                        <SearchBar />
                    </div>
                )}
            </div>

            <style jsx>{`
                .nav-link {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-muted);
                    text-decoration: none;
                    transition: color 0.2s;
                    white-space: nowrap;
                }
                .nav-link:hover {
                    color: #fff;
                }

                .mobile-toggle {
                    display: none;
                    background: none;
                    border: none;
                    color: #fff;
                    cursor: pointer;
                }

                .mobile-menu {
                    display: none;
                }

                /* Mobile Styles */
                @media (max-width: 768px) {
                    .desktop-menu {
                        display: none !important;
                    }

                    .mobile-toggle {
                        display: block;
                    }

                    .mobile-menu {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        padding-top: 16px;
                        border-top: 1px solid rgba(255,255,255,0.05);
                        margin-top: 16px;
                        animation: slideDown 0.3s ease;
                    }
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </nav>
    );
}
