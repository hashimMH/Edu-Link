'use client';
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { connectTeacherSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { MessageSquare, X } from 'lucide-react';

interface Toast {
  id: number;
  text: string;
  chatId: string;
}

interface SocketCtx {
  unreadCount: number;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  clearUnread: (chatId: string) => void;
}

const SocketContext = createContext<SocketCtx>({
  unreadCount: 0,
  toasts: [],
  dismissToast: () => {},
  clearUnread: () => {},
});

export function useSocket() { return useContext(SocketContext); }

export function SocketProvider({ children }: { children: ReactNode }) {
  const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const unreadRef = useRef(unreadChats);

  useEffect(() => { unreadRef.current = unreadChats; }, [unreadChats]);

  useEffect(() => {
    const socket = connectTeacherSocket();

    const handler = (msg: any) => {
      const chatId = msg.chatId;
      setUnreadChats(prev => new Set(prev).add(chatId));

      const id = ++toastIdRef.current;
      setToasts(prev => [...prev, {
        id,
        chatId,
        text: `New message from ${msg.senderName || 'someone'}`,
      }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);

      // Refresh conversations in background
      api.getConversations().catch(() => {});
    };

    socket.on('new_message', handler);
    return () => { socket.off('new_message', handler); };
  }, []);

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  const clearUnread = (chatId: string) => {
    setUnreadChats(prev => {
      const next = new Set(prev);
      next.delete(chatId);
      return next;
    });
  };

  return (
    <SocketContext.Provider value={{
      unreadCount: unreadChats.size,
      toasts,
      dismissToast,
      clearUnread,
    }}>
      {/* Global toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(t => (
            <div key={t.id} className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in max-w-sm">
              <MessageSquare size={16} className="text-primary flex-shrink-0" />
              <p className="text-sm flex-1">{t.text}</p>
              <button onClick={() => dismissToast(t.id)} className="text-gray-400 hover:text-white"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>
      {children}
    </SocketContext.Provider>
  );
}
