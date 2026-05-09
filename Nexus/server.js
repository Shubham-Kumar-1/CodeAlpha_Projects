import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ExpressPeerServer } from 'peer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs'
});

app.use('/peerjs', peerServer);
app.use(express.static('dist'));

// For development, we'll assume the client is running on Vite's port
// or served via 'dist' after build.

const rooms = {};

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userData) => {
        socket.join(roomId);
        
        if (!rooms[roomId]) {
            rooms[roomId] = { host: userId, users: {} };
        }
        rooms[roomId].users[userId] = { ...userData, socketId: socket.id };
        
        // Notify others and sync current state
        socket.to(roomId).emit('user-connected', userId, userData);
        socket.emit('room-info', {
            host: rooms[roomId].host,
            users: rooms[roomId].users
        });

        socket.on('disconnect', () => {
            if (rooms[roomId]) {
                delete rooms[roomId].users[userId];
                if (rooms[roomId].host === userId) {
                    const remainingUsers = Object.keys(rooms[roomId].users);
                    if (remainingUsers.length > 0) {
                        rooms[roomId].host = remainingUsers[0];
                        io.to(roomId).emit('new-host', rooms[roomId].host);
                    } else {
                        delete rooms[roomId];
                    }
                }
            }
            socket.to(roomId).emit('user-disconnected', userId);
        });

        socket.on('send-message', (message, userName) => {
            io.to(roomId).emit('create-message', message, userName, userData.avatar);
        });

        socket.on('draw', (data) => {
            socket.to(roomId).emit('draw', data);
        });

        socket.on('clear-whiteboard', () => {
            socket.to(roomId).emit('clear-whiteboard');
        });

        socket.on('file-share', (fileData) => {
            socket.to(roomId).emit('file-share', fileData);
        });

        socket.on('hand-raise', (userId, isRaised) => {
            socket.to(roomId).emit('hand-raise', userId, isRaised);
        });

        socket.on('reaction', (userId, emoji) => {
            socket.to(roomId).emit('reaction', userId, emoji);
        });

        socket.on('mute-user', (targetUserId, mute) => {
            if (rooms[roomId].host === userId) {
                io.to(rooms[roomId].users[targetUserId].socketId).emit('remote-mute', mute);
            }
        });

        socket.on('kick-user', (targetUserId) => {
            if (rooms[roomId].host === userId) {
                io.to(rooms[roomId].users[targetUserId].socketId).emit('kicked');
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
