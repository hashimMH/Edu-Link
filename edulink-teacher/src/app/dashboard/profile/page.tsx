'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Save, User, Video, Upload, Trash2, Plus, Award, Briefcase, Camera } from 'lucide-react';

const INTERESTS_LIST = ['Arabic', 'English', 'Mathematics', 'Science', 'Programming', 'Business', 'Vocabulary', 'Reading', 'Writing', 'Grammar'];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [tutor, setTutor] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Personal form
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', country: '' });

  // Tutor form
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [accent, setAccent] = useState('');
  const [description, setDescription] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.getProfile();
        setProfile(p);
        setForm({ firstName: p.firstName, lastName: p.lastName, email: p.email, password: '', country: p.country || '' });
        setAvatarUrl(p.avatarUrl || null);

        const tutors = await api.getTutors();
        const myTutor = tutors.find((t: any) => t.userId === p.id) || tutors[0];
        if (myTutor) {
          setTutor(myTutor);
          // Get full tutor data from API
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
            const res = await fetch(`${apiUrl}/api/users/tutors/${myTutor.id}`, {
              headers: { 'Authorization': 'Bearer ' + localStorage.getItem('teacher_token') }
            });
            const full = await res.json();
            if (full.data) {
              setBio(full.data.bio || '');
              setExperience(full.data.experienceYears ? String(full.data.experienceYears) : '');
              setAccent(full.data.accent || '');
              setDescription(full.data.description || '');
              setInterests(full.data.interests || []);
              setVideoUrl(full.data.videoUrl || full.data.video || full.data.introVideoUrl || '');
            }
          } catch (_) {}

          // Load certificates
          try { setCerts(await api.getCertificates()); } catch (_) {}
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const savePersonal = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      const data: any = { firstName: form.firstName, lastName: form.lastName, email: form.email, country: form.country };
      if (form.password) data.password = form.password;
      await api.updateProfile(data);
      setMsg('Profile updated!');
    } catch (err: any) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  const saveTutor = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updateTutorProfile({
        bio, experienceYears: parseInt(experience) || 0,
        accent, description,
        interests: interests.length ? interests : undefined,
      });
      setMsg('Tutor profile updated!');
    } catch (err: any) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('video', file);
    setSaving(true);
    try {
      const res = await api.uploadVideo(fd);
      if (res.success) { setVideoUrl(res.data.url); setMsg('Video uploaded!'); }
    } catch (err: any) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    setAvatarUploading(true);
    try {
      const token = localStorage.getItem('teacher_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
      const res = await fetch(`${apiUrl}/api/users/avatar`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.data.avatarUrl);
        setMsg('Profile picture updated!');
      } else {
        setMsg(data.message || 'Upload failed');
      }
    } catch (err: any) { setMsg(err.message); }
    finally { setAvatarUploading(false); }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const title = prompt('Certificate title:', file.name) || file.name;
    const fd = new FormData();
    fd.append('certificate', file);
    fd.append('title', title);
    try {
      const res = await api.uploadCertificate(fd);
      if (res.success) { setCerts(prev => [...prev, res.data]); setMsg('Certificate uploaded!'); }
    } catch (err: any) { setMsg(err.message); }
  };

  const deleteCert = async (id: string) => {
    if (!confirm('Delete this certificate?')) return;
    await api.deleteCertificate(id);
    setCerts(prev => prev.filter(c => c.id !== id));
  };

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Profile</h2>
      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes('updated') || msg.includes('uploaded') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4"><User size={20} className="text-primary" /><h3 className="text-lg font-semibold">Personal Information</h3></div>
          
          {/* Avatar upload */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl?.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || ''}${avatarUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile Picture</p>
              <p className="text-xs text-gray-500 mt-0.5">Click to upload a new photo</p>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>

          <form onSubmit={savePersonal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
              <input value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="au, us, uk..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>

        {/* Tutor Profile */}
        <div className="space-y-6">
          {/* Bio & Experience */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4"><Briefcase size={20} className="text-purple-500" /><h3 className="text-lg font-semibold">Professional Info</h3></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell students about yourself, your teaching style..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Experience (years)</label>
                  <input type="number" value={experience} onChange={e => setExperience(e.target.value)} placeholder="5" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Accent</label>
                  <input value={accent} onChange={e => setAccent(e.target.value)} placeholder="Australian Accent" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Short description shown on your tutor card..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>
              <button onClick={saveTutor} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"><Save size={16} /> Save</button>
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-3">Interests & Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_LIST.map(i => (
                <button key={i} onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${interests.includes(i) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Intro Video */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4"><Video size={20} className="text-blue-500" /><h3 className="text-lg font-semibold">Intro Video</h3></div>
            {videoUrl ? (
              <div className="space-y-3">
                <video src={videoUrl?.startsWith('http') ? videoUrl : `${process.env.NEXT_PUBLIC_API_URL || ''}${videoUrl}`} controls className="w-full rounded-lg max-h-48 bg-black" />
                <p className="text-xs text-gray-400 truncate">{videoUrl}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">No intro video yet. Upload one to show students.</p>
            )}
            <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            <button onClick={() => videoRef.current?.click()} disabled={saving}
              className="mt-3 flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
              <Upload size={14} /> {videoUrl ? 'Replace Video' : 'Upload Video'}
            </button>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Award size={20} className="text-yellow-500" /><h3 className="text-lg font-semibold">Certificates</h3></div>
              <input ref={certRef} type="file" accept="image/*,.pdf" onChange={handleCertUpload} className="hidden" />
              <button onClick={() => certRef.current?.click()} className="flex items-center gap-1 text-sm bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-lg hover:bg-yellow-100"><Plus size={14} /> Add</button>
            </div>
            {certs.length > 0 ? (
              <div className="space-y-2">
                {certs.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <a href={c.file_url?.startsWith('http') ? c.file_url : `${process.env.NEXT_PUBLIC_API_URL || ''}${c.file_url}`} target="_blank" className="text-sm text-primary hover:underline truncate flex-1">{c.title}</a>
                    <button onClick={() => deleteCert(c.id)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No certificates added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
