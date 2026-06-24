'use client';
import { useEffect, useState } from 'react';

export default function PrivacyPage() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://edulink-backend-zcgw9.ondigitalocean.app';
    fetch(`${apiUrl}/api/legal/privacy`)
      .then(r => r.json())
      .then(d => { if (d.success) setContent(d.data.content); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : content ? (
          <div className="prose prose-gray max-w-none bg-white rounded-xl shadow-sm border p-8"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-gray-600">
            <p>Privacy policy content is currently unavailable. Please check back later.</p>
            <p className="mt-2">Contact us at <a href="mailto:hashim@salih.tech" className="text-primary underline">hashim@salih.tech</a></p>
          </div>
        )}
        <p className="text-sm text-gray-400 mt-8">© {new Date().getFullYear()} EduLink. All rights reserved.</p>
      </div>
    </main>
  );
}
