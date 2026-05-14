'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

export default function EarningsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPaymentSummary(), api.getPayments()])
      .then(([s, p]) => { setSummary(s); setPayments(p); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Earnings</h2>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign size={20} className="text-green-600" /><span className="text-sm text-gray-500">Balance</span></div>
            <p className="text-3xl font-bold text-green-700">${summary.balance?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={20} className="text-blue-600" /><span className="text-sm text-gray-500">Total Income</span></div>
            <p className="text-3xl font-bold text-blue-700">${summary.income?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-2"><Clock size={20} className="text-yellow-600" /><span className="text-sm text-gray-500">Pending</span></div>
            <p className="text-3xl font-bold text-yellow-700">${summary.pending?.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
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
                <td className="py-3 px-4">{p.type}</td>
                <td className="py-3 px-4 text-gray-500">{p.cardType} ····{p.cardNumber?.slice(-4) || '****'}</td>
                <td className="py-3 px-4 text-right font-medium">${p.amount?.toFixed(2)}</td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
