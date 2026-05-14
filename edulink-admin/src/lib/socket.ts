'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectAdminSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('admin_token');
  if (!token) throw new Error('No auth token');

  socket = io('http://localhost:3000', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('[WS] Admin connected:', socket?.id));
  socket.on('disconnect', (r) => console.log('[WS] Disconnected:', r));

  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
