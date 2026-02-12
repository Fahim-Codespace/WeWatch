"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRoom } from '@/context/RoomContext';

export const useScreenShare = () => {
    const [isSharing, setIsSharing] = useState(false);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const { socket } = useRoom();

    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

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
    }, [socket, screenStream]);

    const startScreenShare = useCallback(async (customStream?: MediaStream) => {
        try {
            let stream: MediaStream;

            if (customStream) {
                stream = customStream;
            } else {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });
            }

            setScreenStream(stream);
            setIsSharing(true);

            // Notify others
            socket?.emit('screen-share-start', {});

            // Handle when user stops sharing via browser UI (only applicable for screen share)
            if (!customStream) {
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };
            }

            // Create peer connections for broadcasting
            // In a real implementation, you'd create connections to all participants
            // For now, we'll create offers when needed

        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    }, [socket]);

    const stopScreenShare = useCallback(() => {
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
            pc.addTrack(track, screenStream);
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

    return {
        isSharing,
        screenStream,
        remoteScreenStream,
        startScreenShare,
        stopScreenShare
    };
};
