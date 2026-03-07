import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheckIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import axios from 'axios';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const tableHeaderClass = isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600";
  const tableRowClass = isDark ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50";
  const textClass = isDark ? "text-gray-300" : "text-gray-900";

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/subscription/admin/list?status=${filter}`, {
        headers: { 'x-admin-id': user?.id }
      });
      setSubscriptions(response.data);
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
      await axios.post(`${apiUrl}/subscription/admin/verify`, {
        subscription_id: id,
        status,
        notes,
        expiry_date
      }, {
        headers: { 'x-admin-id': user?.id }
      });

      alert('Action completed successfully');
      fetchSubscriptions();
    } catch (err) {
      console.error('Error verifying subscription:', err);
      alert(err.response?.data?.message || 'Error processing request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${isDark ? "text-white" : "text-[#151416]"} mb-2 flex items-center gap-3`}>
            <ShieldCheckIcon className="w-10 h-10 text-theme" />
            Subscription Management
          </h1>
          <p className={`font-sans text-sm sm:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Review and verify admin subscription requests.
          </p>
        </div>

        <div className={`flex items-center gap-1 p-1 border rounded-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          {['pending', 'active', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 text-[10px] font-black uppercase cursor-pointer tracking-widest rounded-lg transition-all ${filter === s
                ? 'bg-theme-inverse shadow-lg'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-white'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-xl`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className={`${tableHeaderClass} uppercase font-sans text-xs`}>
              <tr>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4 text-center">Plan</th>
                <th className="px-6 py-4 text-center">Billing</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Receipt</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center">{t('common.loading')}</td></tr>
              ) : subscriptions.map((sub) => (
                <tr key={sub.id} className={`${tableRowClass} transition-colors border-b last:border-0 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <td className="px-6 py-4">
                    <div className={`font-bold ${textClass}`}>{sub.username}</div>
                    <div className="text-[10px] opacity-40 uppercase tracking-tight">{sub.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black uppercase text-theme text-xs tracking-tighter">{sub.plan_type}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {sub.billing_cycle}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-mono font-bold ${textClass}`}>{sub.amount.toLocaleString()} MMK</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a 
                      href={sub.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-theme hover:underline text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                    {sub.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVerify(sub.id, 'active')}
                          disabled={processingId === sub.id}
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVerify(sub.id, 'rejected')}
                          disabled={processingId === sub.id}
                            className="!p-2 hover:!bg-red-500 hover:!text-white border-none"
                        >
                            <XCircleIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    ) : (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${sub.status === 'active'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                            }`}>
                        {sub.status}
                      </span>
                    )}
                    </div>
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
    </main>
  );
};

export default SubscriptionManagement;
