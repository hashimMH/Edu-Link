'use client';
import Sidebar from '@/components/Sidebar';
import { SocketProvider } from '@/components/SocketProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8">{children}</main>
      </div>
    </SocketProvider>
  );
}
