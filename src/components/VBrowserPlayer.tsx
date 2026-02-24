"use client";

import React, { useState, useEffect } from 'react';
import { Monitor, AlertCircle, RefreshCw } from 'lucide-react';

interface VBrowserPlayerProps {
    roomId: string;
    url?: string;
    serverUrl?: string; // Optional: URL of the Neko server
}

const VBrowserPlayer: React.FC<VBrowserPlayerProps> = ({ roomId, url, serverUrl = 'https://neko.example.com' }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState(url);

    // In a real implementation, we would use the Neko room ID to connect to the Neko server.
    // Neko supports embedding via iframe if configured correctly.
    // Transitioning URLs in Neko often requires an API call, but we can reflect it in the UI/iframe URL for now.
    const nekoEmbedUrl = `${serverUrl}/?embed=true&room=${roomId}${url ? `&url=${encodeURIComponent(url)}` : ''}`;

    useEffect(() => {
        if (url && url !== currentUrl) {
            setIsLoading(true);
            setCurrentUrl(url);
            // Simulate Neko navigation delay
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [url, currentUrl]);

    useEffect(() => {
        // Initial loading state
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleRetry = () => {
        setIsLoading(true);
        setError(null);
        setTimeout(() => setIsLoading(false), 1500);
    };

    return (
        <div className="v-browser-container">
            {isLoading && (
                <div className="v-browser-overlay">
                    <div className="spinner"></div>
                    <p>Connecting to Cloud Browser...</p>
                </div>
            )}

            {error ? (
                <div className="v-browser-overlay error">
                    <AlertCircle size={48} color="#ff4d4d" />
                    <h3>Connection Failed</h3>
                    <p>{error}</p>
                    <button onClick={handleRetry} className="btn-retry">
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            ) : (
                <iframe
                    src={nekoEmbedUrl}
                    className="v-browser-iframe"
                    allow="autoplay; fullscreen; microphone; camera; display-capture; clipboard-read; clipboard-write"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setError("Could not connect to Neko server. Please check the server status.")}
                />
            )}

            <div className="v-browser-info">
                <Monitor size={14} />
                <span>Virtual Browser Active</span>
            </div>

            <style jsx>{`
                .v-browser-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    background: #111;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .v-browser-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }

                .v-browser-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    gap: 16px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .v-browser-overlay.error {
                    background: rgba(15, 5, 5, 0.95);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #00ff88;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .btn-retry {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .btn-retry:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .v-browser-info {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    pointer-events: none;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

export default VBrowserPlayer;
