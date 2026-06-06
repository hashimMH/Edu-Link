'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    api.getPayments(params.toString()).then(d => { setData(d); setPayments(d.payments || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Payments</h2>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-semibold">
          Page Total: ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Card</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">{p.date}</td>
                <td className="py-3 px-4">{p.first_name} {p.last_name}</td>
                <td className="py-3 px-4">{p.type}</td>
                <td className="py-3 px-4 text-gray-500">{p.card_type} ····{p.card_last_four}</td>
                <td className="py-3 px-4 text-right font-medium">${p.amount?.toFixed(2)}</td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span></td>
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
    </div>
  );
}
