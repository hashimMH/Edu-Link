'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Mail, Calendar, BookOpen, Star, MapPin, Save } from 'lucide-react';

export default function UserDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('id') || '';
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', role: 'student',
    country: '', isActive: true, interests: '' as string,
    password: '',
  });

  const load = async () => {
    try {
      const data = await api.getUser(userId);
      setUser(data);
      setForm({
        firstName: data.first_name, lastName: data.last_name,
        email: data.email, role: data.role,
        country: data.country || '',
        isActive: data.is_active,
        interests: (data.interests || []).join(', '),
        password: '',
      });
    } catch (err: any) { alert(err.message); router.back(); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.updateUser(userId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        country: form.country || undefined,
        isActive: form.isActive,
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
        ...(form.password ? { password: form.password } : {}),
      });
      setMsg('Updated successfully');
      load();
    } catch (err: any) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;
  if (!user) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">User Details</h2>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
            {user.avatar_url ? (
              <img src={`${process.env.NEXT_PUBLIC_API_URL || ''}${user.avatar_url}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-400 font-medium">
                {(user.first_name?.[0] || '?').toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold">{user.first_name} {user.last_name}</h3>
          <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {user.role}
          </span>
          <span className={`mt-2 px-3 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>

          <div className="w-full mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Mail size={14} /> {user.email}
            </div>
            {user.country && (
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={14} /> {user.country.toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} /> Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Stats */}
          {user.stats && (
            <div className="w-full mt-6 grid grid-cols-3 gap-2">
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{user.stats.appointments}</p>
                <p className="text-[10px] text-gray-500">Appointments</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{user.stats.lessons}</p>
                <p className="text-[10px] text-gray-500">Lessons</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{user.stats.reviews}</p>
                <p className="text-[10px] text-gray-500">Reviews</p>
              </div>
            </div>
          )}

          {/* Interests */}
          {user.interests?.length > 0 && (
            <div className="w-full mt-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Interests</p>
              <div className="flex flex-wrap gap-1">
                {user.interests.map((i: string) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">{i}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Edit User</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password (leave blank to keep)</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="au, us, uk..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Interests (comma-separated)</label>
              <input value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="Arabic, English, Mathematics" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary" />
              <label htmlFor="isActive" className="text-sm text-gray-600">Active user</label>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
