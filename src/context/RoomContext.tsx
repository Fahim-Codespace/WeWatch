"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { useFileTransfer } from '@/hooks/useFileTransfer';

interface Message {
    id: string;
    sender: string;
    text?: string;
    voiceUrl?: string;
    timestamp: number;
}

interface Participant {
    id: string;
    name: string;
    isHost: boolean;
}

interface RoomSettings {
    persistent: boolean;
    isSandboxEnabled?: boolean;
}

interface Media {
    type: 'movie' | 'tv';
    id: number;
    title: string;
    poster?: string;
}

interface RoomContextType {
    socket: Socket | null;
    roomId: string | null;
    participants: Participant[];
    messages: Message[];
    videoState: {
        url: string;
        playing: boolean;
        currentTime: number;
        sourceType: 'url' | 'local' | 'embed';
    };
    media: Media | null;
    roomSettings: RoomSettings;
    setVideoUrl: (url: string, type: 'url' | 'local' | 'embed') => void;
    changeMedia: (media: Media) => void;
    togglePlay: () => void;
    seekVideo: (time: number) => void;
    sendMessage: (text: string) => void;
    sendVoiceMessage: (blob: Blob) => void;
    joinRoom: (id: string, name: string) => void;
    updateRoomSettings: (settings: Partial<RoomSettings>) => void;
    currentUserName: string;
    fileTransfer: {
        startFileShare: (file: File) => Promise<void>;
        requestFile: (hostId: string) => void;
        transferState: any;
        downloadUrl: string | null;
        isHost: boolean;
    };
    notification: { message: string; id: string } | null;
    setNotification: (notification: { message: string; id: string } | null) => void;
    leaveRoom: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUserName, setCurrentUserName] = useState('');
    const [videoState, setVideoState] = useState<RoomContextType['videoState']>({
        url: '',
        playing: false,
        currentTime: 0,
        sourceType: 'url'
    });
    const [media, setMedia] = useState<Media | null>(null);
    const [roomSettings, setRoomSettings] = useState<RoomSettings>({
        persistent: false,
        isSandboxEnabled: true
    });

    const [notification, setNotification] = useState<{ message: string; id: string } | null>(null);

    // Helper to show notification
    const showNotification = useCallback((message: string) => {
        setNotification({ message, id: uuidv4() });
        // Clear after 3 seconds
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const isLocalAction = useRef(false);

    // File Transfer Hook
    const fileTransfer = useFileTransfer(socket, currentUserName);

    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const newSocket = io(socketUrl);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setSocket(newSocket);
        });

        // Socket event listeners
        newSocket.on('room-state', (state: { participants: Participant[], videoState: any, media?: Media, settings?: RoomSettings }) => {
            setParticipants(state.participants);
            if (state.videoState.url) {
                setVideoState(state.videoState);
            }
            if (state.media) {
                setMedia(state.media);
            }
            if (state.settings) {
                setRoomSettings(state.settings);
            }
        });

        newSocket.on('user-joined', (participant: Participant) => {
            setParticipants(prev => [...prev, participant]);
            showNotification(`${participant.name} joined the room`);
        });

        newSocket.on('user-left', ({ id, name }) => {
            setParticipants(prev => prev.filter(p => p.id !== id));
            showNotification(`${name} left the room`);
        });

        newSocket.on('room-settings-updated', (settings: RoomSettings & { userName?: string }) => {
            setRoomSettings(settings);
            if (settings.userName) {
                showNotification(`${settings.userName} updated room settings`);
            } else {
                showNotification('Room settings updated');
            }
        });

        newSocket.on('media-changed', (newMedia: Media & { userName?: string }) => {
            setMedia(newMedia);
            if (newMedia.userName) {
                showNotification(`${newMedia.userName} changed the media to ${newMedia.title}`);
            }
        });

        newSocket.on('video-play', (data?: { userName?: string }) => {
            if (!isLocalAction.current) {
                setVideoState(prev => ({ ...prev, playing: true }));
                if (data?.userName) showNotification(`${data.userName} played the video`);
            }
        });

        newSocket.on('video-pause', (data?: { userName?: string }) => {
            if (!isLocalAction.current) {
                setVideoState(prev => ({ ...prev, playing: false }));
                if (data?.userName) showNotification(`${data.userName} paused the video`);
            }
        });

        newSocket.on('video-seek', (data: { time: number; userName?: string } | number) => {
            if (!isLocalAction.current) {
                const time = typeof data === 'object' ? data.time : data;
                setVideoState(prev => ({ ...prev, currentTime: time }));

                if (typeof data === 'object' && data.userName) {
                    showNotification(`${data.userName} seeked to ${formatTime(time)}`);
                }
            }
        });

        newSocket.on('video-change', ({ url, sourceType, userName }) => {
            if (!isLocalAction.current) {
                setVideoState(prev => ({ ...prev, url, sourceType, currentTime: 0, playing: false }));
                if (userName) showNotification(`${userName} changed the video`);
            }
        });

        newSocket.on('receive-message', (message: Message) => {
            setMessages(prev => [...prev, message]);
        });

        newSocket.on('receive-voice', (voiceData: Message) => {
            setMessages(prev => [...prev, voiceData]);
        });

        return () => {
            newSocket.close();
        };
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    // Helper format time for notifications
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const joinRoom = useCallback((id: string, name: string) => {
        // Clear previous room state
        setMessages([]);
        setParticipants([]);
        setVideoState({
            url: '',
            playing: false,
            currentTime: 0,
            sourceType: 'url'
        });
        setMedia(null);
        setRoomSettings({ persistent: false });
        setNotification(null);

        setRoomId(id);
        setCurrentUserName(name);
        socket?.emit('join-room', { roomId: id, userName: name });
    }, [socket]);

    const leaveRoom = useCallback(() => {
        if (roomId && socket) {
            // Socket.io automatically handles leaving rooms on the server side when emitting a specific event or disconnecting
            // But we can emit an explicit leave event if we want custom server logic, or just rely on 'disconnect' if we close.
            // However, we probably don't want to close the socket entirely if we want to reuse it, 
            // BUT for this app, we can just emit a 'leave-room' or simply clear state.
            // The server listens for disconnect, but we are not disconnecting the socket, just leaving the room logically.
            // Server.js shows: if (currentRoomId) socket.leave(currentRoomId) inside 'join-room'.
            // It doesn't have an explicit 'leave-room' handler, but we can add one OR just rely on the fact that
            // when we navigate away, we want to clear local state.
            // Actually, looking at server.js, there IS NO explicit 'leave-room' handler.
            // We should add one to server.js OR just emit 'join-room' with null? No.
            // We should probably add a 'leave-room' event to server.js for cleanliness,
            // OR we can just disconnect the socket to force a leave.
            // Let's disconnect and reconnect for simplicity and robustness.
            socket.disconnect();
            const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
            setSocket(newSocket);

            // Clear local state
            setRoomId(null);
            setParticipants([]);
            setMessages([]);
            setVideoState({
                url: '',
                playing: false,
                currentTime: 0,
                sourceType: 'url'
            });
            setMedia(null);
            setRoomSettings({ persistent: false, isSandboxEnabled: true });
        }
    }, [roomId, socket]);

    const updateRoomSettings = useCallback((settings: Partial<RoomSettings>) => {
        socket?.emit('update-room-settings', settings);
        // Optimistic update
        setRoomSettings(prev => ({ ...prev, ...settings }));
    }, [socket]);

    const changeMedia = useCallback((newMedia: Media) => {
        setMedia(newMedia);
        socket?.emit('change-media', newMedia);
    }, [socket]);

    const setVideoUrl = useCallback((url: string, type: 'url' | 'local' | 'embed') => {
        isLocalAction.current = true;
        setVideoState(prev => ({ ...prev, url, sourceType: type, playing: false, currentTime: 0 }));
        socket?.emit('video-change', { url, sourceType: type });
        setTimeout(() => { isLocalAction.current = false; }, 100);
    }, [socket]);

    const togglePlay = useCallback(() => {
        isLocalAction.current = true;
        const newPlayingState = !videoState.playing;
        setVideoState(prev => ({ ...prev, playing: newPlayingState }));

        if (newPlayingState) {
            socket?.emit('video-play');
        } else {
            socket?.emit('video-pause');
        }
        setTimeout(() => { isLocalAction.current = false; }, 100);
    }, [socket, videoState.playing]);

    const seekVideo = useCallback((time: number) => {
        isLocalAction.current = true;
        setVideoState(prev => ({ ...prev, currentTime: time }));
        socket?.emit('video-seek', { time });
        setTimeout(() => { isLocalAction.current = false; }, 100);
    }, [socket]);

    const sendMessage = useCallback((text: string) => {
        const msg = { id: uuidv4(), sender: currentUserName, text, timestamp: Date.now() };
        setMessages(prev => [...prev, msg]);
        socket?.emit('send-message', msg);
    }, [socket, currentUserName]);

    const sendVoiceMessage = useCallback((blob: Blob) => {
        const voiceUrl = URL.createObjectURL(blob);
        const msg = { id: uuidv4(), sender: currentUserName, voiceUrl, timestamp: Date.now() };
        setMessages(prev => [...prev, msg]);
        socket?.emit('send-voice', msg);
    }, [socket, currentUserName]);

    return (
        <RoomContext.Provider
            value={{
                socket,
                roomId,
                participants,
                messages,
                videoState,
                media,
                roomSettings,
                setVideoUrl,
                changeMedia,
                togglePlay,
                seekVideo,
                sendMessage,
                sendVoiceMessage,
                joinRoom,
                updateRoomSettings,
                currentUserName,
                fileTransfer,
                notification,
                setNotification,
                leaveRoom
            }}
        >
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => {
    const context = useContext(RoomContext);
    if (!context) throw new Error('useRoom must be used within a RoomProvider');
    return context;
};
