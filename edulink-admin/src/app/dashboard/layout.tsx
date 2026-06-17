'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { SocketProvider } from '@/components/SocketProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setReady(true);
    } else {
      router.replace('/login');
    }
  }, []); // Run once on mount only

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8">{children}</main>
      </div>
    </SocketProvider>
  );
}
