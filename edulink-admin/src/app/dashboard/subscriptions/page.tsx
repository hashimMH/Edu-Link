'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Edit3, X, ToggleLeft, ToggleRight, Power, PowerOff } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [masterToggling, setMasterToggling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', price: 0, lessons: 0, duration: '' });

  const load = async () => {
    const [subsData, masterData] = await Promise.all([
      api.getSubscriptions(),
      api.getSubscriptionsMaster().catch(() => ({ enabled: true })),
    ]);
    setSubs(subsData);
    setMasterEnabled(masterData.enabled);
    setLoading(false);
  };
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

  const handleToggle = async (s: any) => {
    setToggling(s.id);
    try {
      await api.updateSubscription(s.id, { isActive: !s.is_active });
      setSubs(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !s.is_active } : x));
    } catch (err: any) { alert(err.message); }
    finally { setToggling(null); }
  };

  const handleMasterToggle = async () => {
    setMasterToggling(true);
    try {
      const next = !masterEnabled;
      await api.toggleSubscriptionsMaster(next);
      setMasterEnabled(next);
    } catch (err: any) { alert(err.message); }
    finally { setMasterToggling(false); }
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-sm text-gray-500 mt-1">
            Active plans are visible to users. Inactive plans are hidden everywhere.
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">
          <Plus size={18} /> Add Plan
        </button>
      </div>

      {/* Master toggle */}
      <div className={`mb-6 p-4 rounded-xl border-2 transition ${masterEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${masterEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
              {masterEnabled ? <Power size={20} className="text-green-600" /> : <PowerOff size={20} className="text-red-600" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Subscriptions {masterEnabled ? 'Enabled' : 'Disabled'}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {masterEnabled
                  ? 'Users can see and purchase subscription plans'
                  : 'All subscription plans, settings, and options are hidden from the entire app'}
              </p>
            </div>
          </div>
          <button
            onClick={handleMasterToggle}
            disabled={masterToggling}
            className={`relative inline-flex items-center transition ${masterToggling ? 'opacity-50' : ''}`}
          >
            {masterEnabled ? (
              <ToggleRight size={42} className="text-green-500 hover:text-green-600 transition" />
            ) : (
              <ToggleLeft size={42} className="text-gray-300 hover:text-gray-400 transition" />
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subs.map(s => (
          <div key={s.id} className={`bg-white rounded-xl shadow-sm border p-5 transition-opacity ${s.is_active ? '' : 'opacity-60'}`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{s.title}</h3>
              {/* Toggle switch */}
              <button
                onClick={() => handleToggle(s)}
                disabled={toggling === s.id}
                className={`relative inline-flex items-center transition-colors ${toggling === s.id ? 'opacity-50' : ''}`}
                title={s.is_active ? 'Click to deactivate — hides from users' : 'Click to activate — shows to users'}
              >
                {s.is_active ? (
                  <ToggleRight size={36} className="text-green-500 hover:text-green-600 transition" />
                ) : (
                  <ToggleLeft size={36} className="text-gray-300 hover:text-gray-400 transition" />
                )}
              </button>
            </div>
            <p className="text-3xl font-bold text-primary mb-1">${s.price}</p>
            <p className="text-sm text-gray-500 mb-1">{s.lessons} Lessons · {s.duration}</p>
            <span className={`inline-block text-xs px-2 py-1 rounded-full mb-4 ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {s.is_active ? 'Visible to users' : 'Hidden from users'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={() => handleDelete(s.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {subs.length === 0 && (
        <p className="text-gray-400 text-center py-12">No subscription plans yet. Create one to start.</p>
      )}

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
