'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TutorsPage() {
  const [data, setData] = useState<any>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', accent: '', country: '', description: '', videoUrl: '',
    isAvailable: true, rating: 0, interests: '',
    bio: '', experienceYears: '',
  });

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    api.getTutors(params.toString()).then(d => { setData(d); setTutors(d.tutors || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      name: t.name, accent: t.accent || '', country: t.country || '',
      description: t.description || '', videoUrl: t.video_url || '',
      isAvailable: t.is_available, rating: t.rating,
      interests: (t.interests || []).join(', '),
      bio: t.bio || '', experienceYears: t.experience_years || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateTutor(editing.id, {
        ...form,
        interests: form.interests.split(',').map((s: string) => s.trim()).filter(Boolean),
      });
      setEditing(null);
      load();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Tutors</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tutors.map(t => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.accent} · {t.country?.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 font-semibold">★ {t.rating}</span>
                <button onClick={() => openEdit(t)} className="p-1 hover:bg-gray-100 rounded"><Edit3 size={16} className="text-blue-500" /></button>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{t.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {(t.interests || []).map((i: string) => (
                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{i}</span>
              ))}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${t.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {t.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        ))}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => { setPage(page - 1); load(page - 1); }}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {data.page} of {data.pages}
          </span>
          <button
            onClick={() => { setPage(page + 1); load(page + 1); }}
            disabled={page >= data.pages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Tutor</h3>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full px-3 py-2 border rounded-lg" />
              <input value={form.accent} onChange={e => setForm({ ...form, accent: e.target.value })} placeholder="Accent" className="w-full px-3 py-2 border rounded-lg" />
              <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Country code (au, us, uk...)" className="w-full px-3 py-2 border rounded-lg" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 border rounded-lg" rows={3} />
              <input value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="Video URL" className="w-full px-3 py-2 border rounded-lg" />
              <input value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })} placeholder="Interests (comma-separated)" className="w-full px-3 py-2 border rounded-lg" />
              <textarea value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Bio" className="w-full px-3 py-2 border rounded-lg" rows={3} />
              <input type="number" value={form.experienceYears || ''} onChange={e => setForm({ ...form, experienceYears: e.target.value })} placeholder="Experience (years)" className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} /> Available</label>
                <input type="number" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: parseFloat(e.target.value) })} placeholder="Rating" className="w-24 px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark">Update</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
