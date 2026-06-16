import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { storage } from './storage';

const PROD_URL = 'https://edu-link-9mwd.onrender.com';
const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const SOCKET_URL = __DEV__ ? `http://${LOCAL_HOST}:3003` : PROD_URL;

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await storage.getToken();
  if (!token) throw new Error('No auth token');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.log('[WS] Connection error:', err.message);
  });

  return new Promise((resolve, reject) => {
    socket!.on('connect', () => {
      console.log('[WS] Connected:', socket?.id);
      resolve(socket!);
    });
    socket!.on('connect_error', (err) => reject(err));
    // Timeout after 10s
    setTimeout(() => {
      if (!socket?.connected) reject(new Error('Socket connection timeout'));
    }, 10000);
    // Connect AFTER all listeners are attached
    socket!.connect();
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
