'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  CreditCard, Bell, Package, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAdminSocket } from '@/components/SocketProvider';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/tutors', label: 'Tutors', icon: GraduationCap },
  { href: '/dashboard/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: true },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { notifCount, clearNotifs } = useAdminSocket();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <img src="/logo.png" alt="EduLink" className="h-10" />
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Admin</span>
        </div>
        <nav className="p-4 space-y-1">
          {nav.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setOpen(false);
                  if (item.badge) clearNotifs();
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon size={20} />
                  {item.label}
                </span>
                {item.badge && notifCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full transition">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
