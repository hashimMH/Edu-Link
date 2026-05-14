'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAdminSocket } from '@/components/SocketProvider';
import { Users, GraduationCap, Calendar, CreditCard, BookOpen, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useAdminSocket();

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!stats) return <p className="text-red-500">Failed to load data</p>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Students', value: stats.totalStudents, icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Teachers', value: stats.totalTeachers, icon: GraduationCap, color: 'bg-purple-50 text-purple-600' },
    { label: 'Tutors', value: stats.totalTutors, icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Appointments', value: stats.totalAppointments, icon: Calendar, color: 'bg-orange-50 text-orange-600' },
    { label: 'Upcoming', value: stats.upcomingAppointments, icon: Calendar, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Lessons', value: stats.totalLessons, icon: BookOpen, color: 'bg-pink-50 text-pink-600' },
    { label: 'Messages', value: stats.totalMessages, icon: MessageSquare, color: 'bg-teal-50 text-teal-600' },
    { label: 'Revenue', value: `$${stats.totalRevenue?.toLocaleString() || 0}`, icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Payments', value: stats.totalPayments, icon: CreditCard, color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers?.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{u.first_name} {u.last_name}</td>
                  <td className="py-3 px-4 text-gray-500">{u.email}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                  <td className="py-3 px-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
