'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LessonsPage() {
  const [data, setData] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', duration: '', description: '', userId: '', videoUrl: '' });

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    api.getLessons(params.toString()).then(d => { setData(d); setLessons(d.lessons || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', duration: '', description: '', userId: '', videoUrl: '' }); setShowModal(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ title: l.title, duration: l.duration, description: l.description || '', userId: l.user_id, videoUrl: l.video_url || '' }); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.updateLesson(editing.id, form);
      else await api.createLesson(form);
      setShowModal(false); load();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    await api.deleteLesson(id); load();
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Lessons</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"><Plus size={18} /> Add Lesson</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Duration</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map(l => (
              <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{l.title}</td>
                <td className="py-3 px-4 text-gray-500">{l.duration}</td>
                <td className="py-3 px-4">{l.first_name} {l.last_name}</td>
                <td className="py-3 px-4 text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => openEdit(l)} className="p-1 hover:bg-gray-100 rounded mr-1"><Edit3 size={16} className="text-blue-500" /></button>
                  <button onClick={() => handleDelete(l.id)} className="p-1 hover:bg-gray-100 rounded"><Trash2 size={16} className="text-red-500" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'Create'} Lesson</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 border rounded-lg" required />
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="Duration (e.g. 6:10 mins)" className="w-full px-3 py-2 border rounded-lg" required />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 border rounded-lg" rows={2} />
              <input value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} placeholder="Student User ID" className="w-full px-3 py-2 border rounded-lg" required />
              <input value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="Video URL (optional)" className="w-full px-3 py-2 border rounded-lg" />
              <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark">{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
