'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Bell, Send, Users, Search } from 'lucide-react';

export default function NotificationsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState<'broadcast' | 'single'>('broadcast');

  useEffect(() => {
    api.getUsers('limit=200').then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  const sendBroadcast = async () => {
    if (!title) return;
    setSending(true); setMsg('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ title, body }),
      });
      const d = await res.json();
      setMsg(d.message || 'Sent!');
      setTitle(''); setBody('');
    } catch (err: any) { setMsg(err.message); }
    finally { setSending(false); }
  };

  const sendSingle = async () => {
    if (!title || !selectedUser) return;
    setSending(true); setMsg('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/notifications/user/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ title, body }),
      });
      const d = await res.json();
      setMsg(`Sent to ${selectedUser.first_name} ${selectedUser.last_name}`);
      setTitle(''); setBody(''); setSelectedUser(null);
    } catch (err: any) { setMsg(err.message); }
    finally { setSending(false); }
  };

  const filteredUsers = users.filter(u =>
    !search || `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes('Sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button onClick={() => setTab('broadcast')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'broadcast' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>
          <Users size={14} className="inline mr-1" /> Broadcast
        </button>
        <button onClick={() => setTab('single')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'single' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>
          <Bell size={14} className="inline mr-1" /> Single User
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">{tab === 'broadcast' ? 'Send to All Users' : 'Send to Specific User'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Notification title..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
                placeholder="Optional message body..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
            </div>
            {tab === 'single' && selectedUser && (
              <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-xs text-red-500">Remove</button>
              </div>
            )}
            <button onClick={tab === 'broadcast' ? sendBroadcast : sendSingle}
              disabled={sending || !title || (tab === 'single' && !selectedUser)}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
              <Send size={14} /> {sending ? 'Sending...' : tab === 'broadcast' ? 'Send to All' : 'Send Notification'}
            </button>
          </div>
        </div>

        {/* User list (single mode) */}
        {tab === 'single' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Select User</h3>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search users..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredUsers.slice(0, 50).map(u => (
                <button key={u.id} onClick={() => setSelectedUser(u)}
                  className={`w-full text-left p-3 rounded-lg text-sm hover:bg-gray-50 transition ${selectedUser?.id === u.id ? 'bg-primary/5 border border-primary/20' : ''}`}>
                  <p className="font-medium">{u.first_name} {u.last_name}</p>
                  <p className="text-xs text-gray-400">{u.email} · <span className={u.role === 'teacher' ? 'text-purple-500' : 'text-blue-500'}>{u.role}</span></p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
