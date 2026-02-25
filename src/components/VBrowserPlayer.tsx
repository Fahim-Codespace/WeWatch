"use client";

import React, { useState, useEffect } from 'react';
import { Monitor, AlertCircle, RefreshCw } from 'lucide-react';

interface VBrowserPlayerProps {
    roomId: string;
    url?: string;
    serverUrl?: string; // Optional: URL of the Neko server
    password?: string;
    userName?: string;
}

const VBrowserPlayer: React.FC<VBrowserPlayerProps> = ({
    roomId,
    url,
    serverUrl = 'https://web-production-05d59.up.railway.app',
    password = process.env.NEXT_PUBLIC_NEKO_PASSWORD || 'watch123',
    userName
}) => {
    // Force a valid name (destructuring default value doesn't catch null)
    const displayUserName = userName || 'Guest';

    console.log("VBrowserPlayer - roomId:", roomId);
    console.log("VBrowserPlayer - userName (raw):", userName);
    console.log("VBrowserPlayer - userName (display):", displayUserName);
    console.log("VBrowserPlayer - url:", url);
    console.log("VBrowserPlayer - serverUrl:", serverUrl);

    const [error, setError] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState(url);

    // Neko supports automatic login via 'usr', 'pwd' and 'name' query parameters
    // We use 'cast=1' to remove all Neko UI elements (sidebar, menus) for a seamless experience
    const nekoEmbedUrl = `${serverUrl}/?cast=1&room=${encodeURIComponent(roomId || 'default')}${url ? `&url=${encodeURIComponent(url)}` : ''}${password ? `&pwd=${encodeURIComponent(password)}` : ''}&usr=${encodeURIComponent(displayUserName)}&name=${encodeURIComponent(displayUserName)}`;

    console.log("VBrowserPlayer - Final iFrame URL:", nekoEmbedUrl);

    useEffect(() => {
        if (url && url !== currentUrl) {
            setCurrentUrl(url);
        }
    }, [url, currentUrl]);

    const handleRetry = () => {
        setError(null);
        // Force iframe reload
        const iframe = document.querySelector('.v-browser-iframe') as HTMLIFrameElement;
        if (iframe) iframe.src = nekoEmbedUrl;
    };

    return (
        <div className="v-browser-container">
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
                    allow="autoplay; fullscreen; microphone; camera; display-capture; clipboard-read; clipboard-write; forms"
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
