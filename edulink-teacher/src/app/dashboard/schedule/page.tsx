'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Calendar, Clock, Trash2, Plus, X, Search } from 'lucide-react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'];

export default function SchedulePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'classes' | 'availability'>('classes');
  const [classes, setClasses] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [avDay, setAvDay] = useState('MON');
  const [avStart, setAvStart] = useState('08:00 AM');
  const [avEnd, setAvEnd] = useState('10:00 AM');

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'classes') setClasses(await api.getClasses());
      else setAvailability(await api.getAvailability());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this class?')) return;
    await api.cancelClass(id);
    load();
  };

  const convertTo24 = (t: string) => {
    const parts = t.split(' ');
    const time = parts[0];
    const period = parts[1];
    let nums = time.split(':').map(Number);
    let h = nums[0];
    const m = nums[1];
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  const handleSaveAv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.setAvailability({ dayOfWeek: avDay, startTime: convertTo24(avStart), endTime: convertTo24(avEnd), isRecurring: true });
      setShowAdd(false);
      setAvailability(await api.getAvailability());
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteAv = async (id: string) => {
    if (!confirm('Remove this availability slot?')) return;
    try {
      const token = localStorage.getItem('teacher_token');
      await fetch('/api/teacher/availability/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      setAvailability(await api.getAvailability());
    } catch (err: any) { alert(err.message); }
  };

  const statusColor = (s: string) => {
    if (s === 'upcoming') return 'bg-blue-100 text-blue-700';
    if (s === 'completed') return 'bg-green-100 text-green-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Schedule</h2>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button onClick={() => setTab('classes')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'classes' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Classes</button>
        <button onClick={() => setTab('availability')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'availability' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Availability</button>
      </div>

      {loading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /> : null}

      {tab === 'classes' && !loading && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          {classes.filter(c => !search || c.studentName.toLowerCase().includes(search.toLowerCase())).map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{c.studentName}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {c.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {c.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(c.status)}`}>{c.status}</span>
                {c.status === 'upcoming' && (
                  <>
                    <button onClick={() => router.push(`/dashboard/live-class?roomId=${c.appointmentId || c.id}`)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                      Join Class
                    </button>
                    <button onClick={() => handleCancel(c.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {classes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No classes found</p>
          ) : classes.filter(c => !search || c.studentName.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
            <p className="text-gray-400 text-center py-8">No classes match your search</p>
          ) : null}
        </div>
      )}

      {tab === 'availability' && !loading && (
        <div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark mb-4"><Plus size={16} /> Add Slot</button>

          <div className="grid gap-3">
            {availability.map(a => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-semibold text-sm">{a.dayOfWeek}</span>
                  <span className="text-gray-600">{a.startTime} - {a.endTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{a.isRecurring ? 'Weekly' : 'One-time'}</span>
                  <button onClick={() => handleDeleteAv(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {availability.length === 0 && <p className="text-gray-400 text-center py-8">No availability set yet</p>}
          </div>

          {showAdd && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Add Availability</h3>
                  <button onClick={() => setShowAdd(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleSaveAv} className="space-y-4">
                  <select value={avDay} onChange={e => setAvDay(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={avStart} onChange={e => setAvStart(e.target.value)} className="px-3 py-2 border rounded-lg">
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={avEnd} onChange={e => setAvEnd(e.target.value)} className="px-3 py-2 border rounded-lg">
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark">Save</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
