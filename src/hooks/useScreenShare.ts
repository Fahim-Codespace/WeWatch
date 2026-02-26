"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRoom } from '@/context/RoomContext';

export const useScreenShare = () => {
    const [isSharing, setIsSharing] = useState(false);
    const [screenShareError, setScreenShareError] = useState<string | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const { socket } = useRoom();

    // Base STUN servers for connectivity
    const iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ];

    // Optional TURN server from env, if configured
    if (
        typeof process !== 'undefined' &&
        process.env.NEXT_PUBLIC_TURN_URL &&
        process.env.NEXT_PUBLIC_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_TURN_CREDENTIAL
    ) {
        iceServers.push({
            urls: process.env.NEXT_PUBLIC_TURN_URL.split(',').map(u => u.trim()),
            username: process.env.NEXT_PUBLIC_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
        });
    }

    const configuration: RTCConfiguration = {
        iceServers
    };

    const stopScreenShare = useCallback(() => {
        setScreenShareError(null);
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
        setIsSharing(false);
        socket?.emit('screen-share-stop', {});

        // Close all peer connections
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
    }, [screenStream, socket]);

    const createOffer = useCallback(async (targetUserId: string) => {
        if (!screenStream) return;

        const pc = new RTCPeerConnection(configuration);
        peerConnections.current.set(targetUserId, pc);

        screenStream.getTracks().forEach(track => {
            const sender = pc.addTrack(track, screenStream);
            if (track.kind === 'video') {
                const params = sender.getParameters();
                if (!params.encodings || params.encodings.length === 0) {
                    params.encodings = [{}];
                }
                // Prefer higher quality; browsers may clamp based on network
                params.encodings[0].maxBitrate = 2_500_000; // ~2.5 Mbps
                params.encodings[0].maxFramerate = 30;
                sender.setParameters(params).catch(err => {
                    console.warn('Failed to set video encoding parameters', err);
                });
            }
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit('screen-share-ice-candidate', {
                    candidate: event.candidate,
                    to: targetUserId
                });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit('screen-share-offer', {
            offer,
            to: targetUserId
        });
    }, [screenStream, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on('screen-share-started', async ({ userId, userName }) => {
            console.log(`${userName} started screen sharing`);
            // Request offer from the sharer
            if (socket.id !== userId) {
                socket.emit('request-screen-share', { to: userId });
            }
        });

        socket.on('screen-share-stopped', ({ userId }) => {
            const pc = peerConnections.current.get(userId);
            if (pc) {
                pc.close();
                peerConnections.current.delete(userId);
            }
            setRemoteScreenStream(null);
        });

        socket.on('screen-share-offer', async ({ offer, from }) => {
            const pc = new RTCPeerConnection(configuration);
            peerConnections.current.set(from, pc);

            pc.ontrack = (event) => {
                setRemoteScreenStream(event.streams[0]);
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('screen-share-ice-candidate', {
                        candidate: event.candidate,
                        to: from
                    });
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('screen-share-answer', {
                answer,
                to: from
            });
        });

        socket.on('screen-share-answer', async ({ answer, from }) => {
            const pc = peerConnections.current.get(from);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('request-screen-share', async ({ from }) => {
            // When someone requests our screen share, create an offer for them
            if (screenStream) {
                createOffer(from);
            }
        });

        socket.on('screen-share-ice-candidate', async ({ candidate, from }) => {
            const pc = peerConnections.current.get(from);
            if (pc && candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        return () => {
            socket.off('screen-share-started');
            socket.off('screen-share-stopped');
            socket.off('screen-share-offer');
            socket.off('screen-share-answer');
            socket.off('screen-share-ice-candidate');
            socket.off('request-screen-share');
        };
    }, [socket, screenStream, createOffer, configuration]);

    const startScreenShare = useCallback(async (customStream?: MediaStream) => {
        setScreenShareError(null);
        try {
            if (typeof window === 'undefined' || typeof navigator === 'undefined') {
                setScreenShareError('Screen share is not available in this context.');
                return;
            }
            // getDisplayMedia only works in secure contexts (HTTPS or localhost)
            if (!window.isSecureContext) {
                setScreenShareError('Screen share requires a secure connection. Open the app at https://… or http://localhost:3000');
                return;
            }
            if (!navigator.mediaDevices?.getDisplayMedia) {
                setScreenShareError('Screen share is not supported in this browser. Try Chrome or Edge and use https:// or http://localhost.');
                return;
            }

            let stream: MediaStream;

            if (customStream) {
                stream = customStream;
            } else {
                const constraints = {
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30, max: 60 },
                        cursor: 'motion' as const
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                };

                stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            }

            setScreenStream(stream);
            setIsSharing(true);

            // Notify others
            socket?.emit('screen-share-start', {});

            // Handle when user stops sharing via browser UI (only applicable for screen share)
            if (!customStream) {
                const [videoTrack] = stream.getVideoTracks();
                if (videoTrack) {
                    videoTrack.onended = () => {
                        stopScreenShare();
                    };
                }
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Screen share failed';
            console.error('Error starting screen share:', error);
            if (String(message).toLowerCase().includes('permission') || (error as { name?: string })?.name === 'NotAllowedError') {
                setScreenShareError('Permission denied. Please allow screen or tab sharing when prompted.');
            } else {
                setScreenShareError(message);
            }
        }
    }, [socket, stopScreenShare]);

    return {
        isSharing,
        screenShareError,
        screenStream,
        remoteScreenStream,
        startScreenShare,
        stopScreenShare
    };
};
