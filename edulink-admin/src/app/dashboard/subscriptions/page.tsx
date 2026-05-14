'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', price: 0, lessons: 0, duration: '' });

  const load = () => api.getSubscriptions().then(setSubs).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', price: 0, lessons: 0, duration: '' }); setShowModal(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ title: s.title, price: s.price, lessons: s.lessons, duration: s.duration }); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.updateSubscription(editing.id, form);
      else await api.createSubscription(form);
      setShowModal(false); load();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await api.deleteSubscription(id); load();
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"><Plus size={18} /> Add Plan</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subs.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="text-3xl font-bold text-primary mb-1">${s.price}</p>
            <p className="text-sm text-gray-500 mb-4">{s.lessons} Lessons · {s.duration}</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"><Edit3 size={14} /> Edit</button>
              <button onClick={() => handleDelete(s.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'Create'} Plan</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 border rounded-lg" required />
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} placeholder="Price ($)" className="w-full px-3 py-2 border rounded-lg" required />
              <input type="number" value={form.lessons} onChange={e => setForm({ ...form, lessons: parseInt(e.target.value) || 0 })} placeholder="Number of lessons" className="w-full px-3 py-2 border rounded-lg" required />
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="Duration (e.g. 28 hrs 40 mins)" className="w-full px-3 py-2 border rounded-lg" required />
              <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark">{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
