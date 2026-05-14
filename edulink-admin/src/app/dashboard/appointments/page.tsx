'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAdminSocket } from '@/components/SocketProvider';

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useAdminSocket();

  useEffect(() => { api.getAppointments().then(setAppts).finally(() => setLoading(false)); }, [refreshTrigger]);

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Appointments</h2>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Time</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Tutor</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {appts.map(a => (
              <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{a.date}</td>
                <td className="py-3 px-4 text-gray-500">{a.start_time} - {a.end_time}</td>
                <td className="py-3 px-4">{a.student_first} {a.student_last}</td>
                <td className="py-3 px-4">{a.tutor_name}</td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status] || 'bg-gray-100'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {appts.length === 0 && <p className="text-center py-8 text-gray-400">No appointments found</p>}
      </div>
    </div>
  );
}
