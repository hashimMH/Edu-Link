'use client';
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { connectAdminSocket } from '@/lib/socket';
import { Bell, X } from 'lucide-react';

interface Toast {
  id: number;
  title: string;
  body: string;
}

interface SocketCtx {
  notifCount: number;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  clearNotifs: () => void;
  refreshTrigger: number;
}

const SocketContext = createContext<SocketCtx>({
  notifCount: 0,
  toasts: [],
  dismissToast: () => {},
  clearNotifs: () => {},
  refreshTrigger: 0,
});

export function useAdminSocket() { return useContext(SocketContext); }

export function SocketProvider({ children }: { children: ReactNode }) {
  const [notifCount, setNotifCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const toastIdRef = useRef(0);

  useEffect(() => {
    const socket = connectAdminSocket();

    const notifHandler = (notif: any) => {
      setNotifCount(prev => prev + 1);
      const id = ++toastIdRef.current;
      setToasts(prev => [...prev, { id, title: notif.title, body: notif.body || '' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
      setRefreshTrigger(prev => prev + 1);
    };

    const apptHandler = (data: any) => {
      const msg = data.action === 'created' ? 'A new appointment was booked' : 'An appointment was cancelled';
      const id = ++toastIdRef.current;
      setToasts(prev => [...prev, { id, title: 'Appointment Update', body: msg }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
      setRefreshTrigger(prev => prev + 1);
    };

    socket.on('new_notification', notifHandler);
    socket.on('appointment_update', apptHandler);
    return () => {
      socket.off('new_notification', notifHandler);
      socket.off('appointment_update', apptHandler);
    };
  }, []);

  const clearNotifs = () => setNotifCount(0);

  return (
    <SocketContext.Provider value={{
      notifCount, toasts,
      dismissToast: (id: number) => setToasts(prev => prev.filter(t => t.id !== id)),
      clearNotifs,
      refreshTrigger,
    }}>
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(t => (
            <div key={t.id} className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-slide-in max-w-sm">
              <Bell size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                {t.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.body}</p>}
              </div>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-gray-400 hover:text-white flex-shrink-0"><X size={14} /></button>
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
