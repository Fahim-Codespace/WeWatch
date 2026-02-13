import { useState, useRef, useCallback, useEffect } from 'react';

interface TransferState {
    status: 'idle' | 'offering' | 'connecting' | 'transferring' | 'completed' | 'error';
    progress: number;
    fileName?: string;
    fileSize?: number;
    error?: string;
    hostId?: string; // Added hostId
}

const CHUNK_SIZE = 16384; // 16KB chunks

import { Socket } from 'socket.io-client';

export const useFileTransfer = (socket: Socket | null, currentUserName: string) => {
    const [transferState, setTransferState] = useState<TransferState>({ status: 'idle', progress: 0 });
    const [isHost, setIsHost] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Refs for heavy objects/state
    const fileRef = useRef<File | null>(null);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
    const receivedChunks = useRef<ArrayBuffer[]>([]);
    const receivedBytes = useRef(0);
    const fileMetadata = useRef<{ name: string; size: number; type: string } | null>(null);

    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // --- Host Logic ---

    const startFileShare = useCallback(async (file: File) => {
        if (!socket) return;
        fileRef.current = file;
        setIsHost(true);
        setTransferState({
            status: 'offering',
            progress: 0,
            fileName: file.name,
            fileSize: file.size
        });

        const fileId = Math.random().toString(36).substr(2, 9);
        socket.emit('file-share-start', {
            fileId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });
        console.log('Started file share:', file.name);
    }, [socket]);

    const sendFile = async (channel: RTCDataChannel) => {
        if (!fileRef.current) return;
        const file = fileRef.current;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        setTransferState(prev => ({ ...prev, status: 'transferring' }));

        let offset = 0;
        let chunkIndex = 0;

        const readSlice = (o: number) => {
            const slice = file.slice(offset, o + CHUNK_SIZE);
            const reader = new FileReader();

            reader.onload = (e) => {
                if (channel.readyState !== 'open') return;

                if (e.target?.result) {
                    try {
                        channel.send(e.target.result as ArrayBuffer);
                        offset += (e.target.result as ArrayBuffer).byteLength;
                        chunkIndex++;

                        // Update progress (approximate for all peers if multi-peer, but simplified here)
                        // In mesh, we might be sending to multiple, so this progress is local "sending" progress
                        // Ideally we track progress per peer, but for UI we can just show "sending"
                    } catch (err) {
                        console.error('Error sending chunk:', err);
                    }

                    if (offset < file.size) {
                        // Flow control: Wait if bufferedAmount is too high
                        if (channel.bufferedAmount > 16 * 1024 * 1024) { // 16MB buffer limit
                            setTimeout(() => readSlice(offset), 100);
                        } else {
                            readSlice(offset);
                        }
                    } else {
                        console.log('File sent successfully');
                        setTransferState(prev => ({ ...prev, status: 'completed', progress: 100 }));
                    }
                }
            };
            reader.readAsArrayBuffer(slice);
        };

        readSlice(0);
    };

    // --- Viewer Logic ---

    const requestFile = useCallback((hostId: string) => {
        if (!socket) return;
        setIsHost(false);
        setTransferState({ status: 'connecting', progress: 0 });
        receivedChunks.current = [];
        receivedBytes.current = 0;
        setDownloadUrl(null);

        socket.emit('request-file-share', { to: hostId });
    }, [socket]);

    // --- Signal Handling ---

    useEffect(() => {
        if (!socket) return;

        // 1. Host receives request
        socket.on('request-file-share', async ({ from, userName }) => {
            console.log(`User ${userName} (${from}) requested file`);

            // Create PeerConnection
            const pc = new RTCPeerConnection(configuration);
            peerConnections.current.set(from, pc);

            // Create Data Channel
            const channel = pc.createDataChannel("file-transfer");
            dataChannels.current.set(from, channel);

            channel.onopen = () => {
                console.log(`Data channel open with ${userName}`);
                sendFile(channel);
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('file-share-ice-candidate', { candidate: event.candidate, to: from });
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('file-share-offer', { offer, to: from });
        });

        // 2. Viewer receives offer
        socket.on('file-share-offer', async ({ offer, from, fileName, fileSize, fileType }) => {
            console.log('Received offer from host');

            const pc = new RTCPeerConnection(configuration);
            peerConnections.current.set(from, pc);

            pc.ondatachannel = (event) => {
                const channel = event.channel;
                dataChannels.current.set(from, channel);

                channel.onmessage = (e) => {
                    const chunk = e.data as ArrayBuffer;
                    receivedChunks.current.push(chunk);
                    receivedBytes.current += chunk.byteLength;

                    // Calculate progress
                    if (fileMetadata.current?.size) {
                        const percent = Math.min(100, Math.round((receivedBytes.current / fileMetadata.current.size) * 100));
                        setTransferState(prev => ({ ...prev, status: 'transferring', progress: percent }));

                        if (receivedBytes.current >= fileMetadata.current.size) {
                            console.log('Download complete!');
                            const blob = new Blob(receivedChunks.current, { type: fileMetadata.current.type });
                            const url = URL.createObjectURL(blob);
                            setDownloadUrl(url);
                            setTransferState(prev => ({ ...prev, status: 'completed', progress: 100 }));
                            receivedChunks.current = []; // cleanup RAM? Maybe keep until unmount
                        }
                    }
                };
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('file-share-ice-candidate', { candidate: event.candidate, to: from });
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('file-share-answer', { answer, to: from });
        });

        // 3. Host receives answer
        socket.on('file-share-answer', async ({ answer, from }) => {
            const pc = peerConnections.current.get(from);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        // ICE Candidates
        socket.on('file-share-ice-candidate', async ({ candidate, from }) => {
            const pc = peerConnections.current.get(from);
            if (pc && candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Metadata broadcast (Separate from signaling for simplicity in detection)
        socket.on('file-share-started', (data) => {
            if (!isHost) {
                // Viewer sees a file is available
                fileMetadata.current = {
                    name: data.fileName,
                    size: data.fileSize,
                    type: data.fileType
                };
                setTransferState({
                    status: 'idle', // ready to request
                    progress: 0,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    hostId: data.hostId
                });
            }
        });

        return () => {
            socket.off('request-file-share');
            socket.off('file-share-offer');
            socket.off('file-share-answer');
            socket.off('file-share-ice-candidate');
            socket.off('file-share-started');
        };
    }, [socket, isHost]);

    return {
        startFileShare,
        requestFile,
        transferState,
        downloadUrl,
        isHost
    };
};
