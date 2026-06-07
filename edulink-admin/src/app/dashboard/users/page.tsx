'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2, Edit3, X } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'student' });

  const load = (p = page, s = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (s) params.set('search', s);
    api.getUsers(params.toString()).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(1, search); };

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'student' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ firstName: u.first_name, lastName: u.last_name, email: u.email, password: '', role: u.role });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateUser(editing.id, { firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) });
      } else {
        await api.createUser(form);
      }
      setShowModal(false);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await api.deleteUser(id);
    load();
  };

  if (loading && !data) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Users</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">
          <Plus size={18} /> Add User
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Search</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Interests</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.users?.map((u: any) => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">
                  <button onClick={() => router.push(`/dashboard/users/detail?id=${u.id}`)} className="text-primary hover:underline text-left">
                    {u.first_name} {u.last_name}
                  </button>
                </td>
                <td className="py-3 px-4 text-gray-500">{u.email}</td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(u.interests || []).slice(0, 3).map((i: string) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{i}</span>
                    ))}
                    {(u.interests || []).length > 3 && (
                      <span className="text-xs text-gray-400">+{u.interests.length - 3}</span>
                    )}
                    {(!u.interests || u.interests.length === 0) && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => openEdit(u)} className="p-1 hover:bg-gray-100 rounded mr-1"><Edit3 size={16} className="text-blue-500" /></button>
                  <button onClick={() => handleDelete(u.id)} className="p-1 hover:bg-gray-100 rounded"><Trash2 size={16} className="text-red-500" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: data.pages }, (_, i) => (
            <button key={i} onClick={() => { setPage(i + 1); load(i + 1, search); }} className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-primary text-white' : 'bg-gray-100'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit User' : 'Create User'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First Name" className="w-full px-3 py-2 border rounded-lg" required />
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last Name" className="w-full px-3 py-2 border rounded-lg" required />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="w-full px-3 py-2 border rounded-lg" required />
              <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'New password (optional)' : 'Password'} type="password" className="w-full px-3 py-2 border rounded-lg" required={!editing} />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark">{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
