import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheckIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

const SubscriptionManagement = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/subscription/admin/list?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setSubscriptions(data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    const notes = prompt('Enter notes (optional):');
    let expiry_date = null;
    
    if (status === 'active') {
      const days = prompt('Enter valid days (e.g., 30 for monthly, 365 for yearly):', '30');
      if (!days) return;
      const date = new Date();
      date.setDate(date.getDate() + parseInt(days));
      expiry_date = date.toISOString();
    }

    setProcessingId(id);
    try {
      const response = await fetch(`${apiUrl}/subscription/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription_id: id,
          status,
          notes,
          expiry_date
        })
      });

      if (response.ok) {
        alert('Action completed successfully');
        fetchSubscriptions();
      } else {
        alert('Error processing request');
      }
    } catch (err) {
      console.error('Error verifying subscription:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
            <ShieldCheckIcon className="w-10 h-10 text-theme" />
            Subscription Management
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Review and verify admin subscription requests.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 border rounded-lg bg-theme/5">
          {['pending', 'active', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${filter === s ? 'bg-theme text-white' : 'opacity-50 hover:opacity-100'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-hidden border ${isDark ? 'border-[#262626]' : 'border-gray-200'} rounded-xl bg-theme`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDark ? 'bg-white/5 font-mono' : 'bg-gray-50 font-sans'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">Admin</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">Plan</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">Billing</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">Amount</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">Receipt</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center">{t('common.loading')}</td></tr>
              ) : subscriptions.map((sub) => (
                <tr key={sub.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="font-bold">{sub.username}</div>
                    <div className="text-[10px] opacity-50">{sub.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold uppercase text-theme">{sub.plan_type}</span>
                  </td>
                  <td className="px-6 py-4 uppercase text-[10px] font-mono">{sub.billing_cycle}</td>
                  <td className="px-6 py-4 font-mono">{sub.amount.toLocaleString()} MMK</td>
                  <td className="px-6 py-4">
                    <a 
                      href={sub.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-500 hover:underline text-[10px] font-bold uppercase"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Image
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    {sub.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleVerify(sub.id, 'active')}
                          disabled={processingId === sub.id}
                          className="p-1.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleVerify(sub.id, 'rejected')}
                          disabled={processingId === sub.id}
                          className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase ${sub.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                        {sub.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && subscriptions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center opacity-50 font-mono">No subscription requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
