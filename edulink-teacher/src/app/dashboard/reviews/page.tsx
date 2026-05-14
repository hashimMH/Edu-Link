'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Star } from 'lucide-react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getReviews().then(setReviews).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Reviews</h2>
      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-start gap-4">
            <div className="bg-yellow-50 rounded-xl p-3 flex flex-col items-center min-w-[60px]">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-600 mt-1">{r.rating}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{r.studentName || r.student_name}</p>
              <p className="text-sm text-gray-500">{r.date} · {r.time}</p>
              {r.comment && <p className="text-gray-600 text-sm mt-2">{r.comment}</p>}
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-400 text-center py-12">No reviews yet</p>}
      </div>
    </div>
  );
}
