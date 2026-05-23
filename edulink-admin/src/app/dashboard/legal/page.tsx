'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Save, Shield, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LegalPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string>('privacy');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const data = await api.getLegalPages();
      setPages(data);
      if (data.length > 0 && !activeKey) setActiveKey(data[0].key);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const page = pages.find(p => p.key === activeKey);
    if (page) {
      setTitle(page.title);
      setContent(page.content);
    }
  }, [activeKey, pages]);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updateLegalPage(activeKey, { title, content });
      setMsg('Saved successfully');
      load();
    } catch (err: any) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></Link>
        <h2 className="text-2xl font-bold">Legal Pages</h2>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes('Saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-2 mb-6">
        {pages.map(p => (
          <button
            key={p.key}
            onClick={() => setActiveKey(p.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeKey === p.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.key === 'privacy' ? <Shield size={16} /> : <FileText size={16} />}
            {p.title}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Content (Markdown)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm resize-y"
              placeholder="Write markdown content here..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
