'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3003';
  const configured = (window as any).__NEXT_DATA__?.props?.pageProps || {};
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectTeacherSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('teacher_token');
  if (!token) throw new Error('No auth token');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
  socket = io(apiUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('[WS] Teacher connected:', socket?.id));
  socket.on('disconnect', (r) => console.log('[WS] Disconnected:', r));
  socket.on('connect_error', (err) => console.log('[WS] Error:', err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
