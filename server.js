const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGIN
            ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
            : "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Store room data
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    let currentRoomId = null;
    let currentUserName = null;

    socket.on('join-room', ({ roomId, userName }) => {
        // Leave previous room if any
        if (currentRoomId) {
            socket.leave(currentRoomId);
            const prevRoom = rooms.get(currentRoomId);
            if (prevRoom) {
                prevRoom.participants = prevRoom.participants.filter(p => p.id !== socket.id);
                socket.to(currentRoomId).emit('user-left', { id: socket.id, name: currentUserName });
                if (prevRoom.participants.length === 0) {
                    rooms.delete(currentRoomId);
                }
            }
        }

        currentRoomId = roomId;
        currentUserName = userName;
        socket.join(roomId);

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                participants: [],
                videoState: {
                    url: '',
                    playing: false,
                    currentTime: 0,
                    sourceType: 'url'
                },
                media: null, // Track current media { type, id, title, poster }
                settings: {
                    settings: {
                        persistent: false,
                        isSandboxEnabled: true
                    }
                }
            });
        }

        const room = rooms.get(roomId);
        const participant = {
            id: socket.id,
            name: userName,
            isHost: room.participants.length === 0
        };

        room.participants.push(participant);

        // Send current room state to the new user
        socket.emit('room-state', {
            participants: room.participants,
            videoState: room.videoState,
            media: room.media, // Send current media
            settings: room.settings
        });

        // Notify others in the room
        socket.to(roomId).emit('user-joined', participant);

        console.log(`${userName} joined room ${roomId}`);
    });

    // Room Settings
    socket.on('update-room-settings', (settings) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        // Only allow if user is host? Ideally yes, but for now open.
        // In real app, check if socket.id is host.
        if (room) {
            room.settings = { ...room.settings, ...settings };
            socket.to(currentRoomId).emit('room-settings-updated', {
                ...room.settings,
                userName: currentUserName
            });
        }
    });

    // Media Logic
    socket.on('change-media', (media) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.media = media; // Update room media state
            // Broadcast to others
            socket.to(currentRoomId).emit('media-changed', {
                ...media,
                userName: currentUserName
            });
        }
    });

    // Video control events
    socket.on('video-play', (data) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.videoState.playing = true;
            // Broadcast to everyone else in the room
            socket.to(currentRoomId).emit('video-play', {
                ...data,
                userName: currentUserName // Ensure server-side validation of sender name
            });
        }
    });

    socket.on('video-pause', (data) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.videoState.playing = false;
            socket.to(currentRoomId).emit('video-pause', {
                ...data,
                userName: currentUserName
            });
        }
    });

    socket.on('video-seek', (data) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            // Check if data is object or number (for backward compatibility, though we expect object now)
            const time = typeof data === 'object' ? data.time : data;

            room.videoState.currentTime = time;
            socket.to(currentRoomId).emit('video-seek', {
                time,
                userName: currentUserName
            });
        }
    });

    socket.on('video-change', ({ url, sourceType }) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            room.videoState.url = url;
            room.videoState.sourceType = sourceType;
            room.videoState.currentTime = 0;
            room.videoState.playing = false; // Start paused for sync start
            socket.to(currentRoomId).emit('video-change', {
                url,
                sourceType,
                userName: currentUserName
            });
        }
    });

    // Chat events
    socket.on('send-message', (message) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            socket.to(currentRoomId).emit('receive-message', {
                ...message,
                sender: currentUserName
            });
        }
    });

    socket.on('send-voice', (voiceData) => {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
            socket.to(currentRoomId).emit('receive-voice', {
                ...voiceData,
                sender: currentUserName
            });
        }
    });

    // Screen sharing events
    socket.on('screen-share-start', (data) => {
        if (!currentRoomId) return;
        socket.to(currentRoomId).emit('screen-share-started', {
            userId: socket.id,
            userName: currentUserName
        });
    });

    socket.on('screen-share-stop', () => {
        if (!currentRoomId) return;
        socket.to(currentRoomId).emit('screen-share-stopped', {
            userId: socket.id
        });
    });

    socket.on('request-screen-share', (data) => {
        io.to(data.to).emit('request-screen-share', {
            from: socket.id
        });
    });

    socket.on('screen-share-offer', (data) => {
        io.to(data.to).emit('screen-share-offer', {
            ...data,
            from: socket.id
        });
    });

    socket.on('screen-share-answer', (data) => {
        io.to(data.to).emit('screen-share-answer', {
            ...data,
            from: socket.id
        });
    });

    socket.on('screen-share-ice-candidate', (data) => {
        io.to(data.to).emit('screen-share-ice-candidate', {
            ...data,
            from: socket.id
        });
    });

    // File Transfer Signaling
    socket.on('file-share-start', (data) => {
        if (!currentRoomId) return;
        // Broadcast to all other users in the room that a file stream is available
        socket.to(currentRoomId).emit('file-share-started', {
            fileId: data.fileId,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType,
            hostId: socket.id,
            hostName: currentUserName
        });
    });

    socket.on('file-share-stop', () => {
        if (!currentRoomId) return;
        socket.to(currentRoomId).emit('file-share-stopped', {
            hostId: socket.id
        });
    });

    socket.on('request-file-share', (data) => {
        // Viewer requests to connect to Host
        io.to(data.to).emit('request-file-share', {
            from: socket.id,
            userName: currentUserName
        });
    });

    socket.on('file-share-offer', (data) => {
        io.to(data.to).emit('file-share-offer', {
            ...data,
            from: socket.id
        });
    });

    socket.on('file-share-answer', (data) => {
        io.to(data.to).emit('file-share-answer', {
            ...data,
            from: socket.id
        });
    });

    socket.on('file-share-ice-candidate', (data) => {
        io.to(data.to).emit('file-share-ice-candidate', {
            ...data,
            from: socket.id
        });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
                room.participants = room.participants.filter(p => p.id !== socket.id);

                socket.to(currentRoomId).emit('user-left', {
                    id: socket.id,
                    name: currentUserName
                });

                // Clean up empty rooms ONLY if not persistent
                if (room.participants.length === 0) {
                    if (!room.settings?.persistent) {
                        rooms.delete(currentRoomId);
                        console.log(`Room ${currentRoomId} deleted (empty)`);
                    } else {
                        console.log(`Room ${currentRoomId} persisted (empty)`);
                    }
                }
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 WeWatch Socket.io server running on port ${PORT}`);
});
