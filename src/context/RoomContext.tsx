"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

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
        persistent: false
    });

    const isLocalAction = useRef(false);

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
        });

        newSocket.on('user-left', ({ id, name }) => {
            setParticipants(prev => prev.filter(p => p.id !== id));
        });

        newSocket.on('room-settings-updated', (settings: RoomSettings) => {
            setRoomSettings(settings);
        });

        newSocket.on('media-changed', (newMedia: Media) => {
            setMedia(newMedia);
        });

        newSocket.on('video-play', () => {
            if (!isLocalAction.current) {
                setVideoState(prev => ({ ...prev, playing: true }));
            }
        });

        newSocket.on('video-pause', () => {
            if (!isLocalAction.current) {
                setVideoState(prev => ({ ...prev, playing: false }));
            }
        });

        newSocket.on('video-seek', (time: number) => {
            if (!isLocalAction.current) {
                setVideoState(prev => ({ ...prev, currentTime: time }));
            }
        });

        newSocket.on('video-change', ({ url, sourceType }) => {
            if (!isLocalAction.current) {
                setVideoState(prev => ({ ...prev, url, sourceType, currentTime: 0, playing: false }));
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
    }, []);

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

        setRoomId(id);
        setCurrentUserName(name);
        socket?.emit('join-room', { roomId: id, userName: name });
    }, [socket]);

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
        socket?.emit('video-seek', time);
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
                currentUserName
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
