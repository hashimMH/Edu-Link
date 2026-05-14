'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Users, Calendar, CheckCircle, XCircle, Star, Clock, Video } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getUpcoming()])
      .then(([s, u]) => { setStats(s); setUpcoming(u); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const cards = stats ? [
    { label: 'Current Students', value: stats.currentStudents, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Booked Classes', value: stats.bookedClasses, icon: Calendar, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Completed', value: stats.completedClasses, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Cancelled', value: stats.cancelledClasses, icon: XCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Avg Rating', value: stats.averageRating, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
  ] : [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}><c.icon size={20} /></div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {upcoming && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">Next Upcoming Class</h3>
          </div>
          <div className="bg-primary/5 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">{upcoming.studentName}</p>
              <p className="text-gray-500 mt-1">{upcoming.dateTime}</p>
              <p className="text-sm text-gray-400">{upcoming.duration}</p>
            </div>
            <div className="text-right flex items-center gap-3">
              <button onClick={() => router.push('/dashboard/live-class/' + (upcoming.appointmentId || upcoming.id))} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition">
                <Video size={16} /> Join Class
              </button>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Upcoming</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
