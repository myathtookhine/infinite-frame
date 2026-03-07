import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CreditCardIcon, CheckIcon, CloudArrowUpIcon, ClockIcon } from '@heroicons/react/24/outline';

const Subscription = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentInfo, setPaymentInfo] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentRes, historyRes] = await Promise.all([
        fetch(`${apiUrl}/subscription/payment-info`),
        fetch(`${apiUrl}/subscription/my-subscriptions`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      const paymentData = await paymentRes.json();
      const historyData = await historyRes.json();
      setPaymentInfo(paymentData);
      setHistory(historyData);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !receiptUrl) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/subscription/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan_type: selectedPlan.type,
          billing_cycle: billingCycle,
          amount: selectedPlan.price,
          receipt_url: receiptUrl,
          notes: notes
        })
      });

      if (response.ok) {
        alert(t('common.success'));
        setSelectedPlan(null);
        setReceiptUrl('');
        setNotes('');
        fetchData();
      } else {
        alert(t('common.error'));
      }
    } catch (err) {
      console.error('Error submitting subscription:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const plans = [
    { type: 'free', price: 0, color: 'text-gray-500' },
    { type: 'pro', price: 15000, color: 'text-purple-500' },
    { type: 'deluxe', price: 45000, color: 'text-pink-500' }
  ];

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">{t('subscription.title')}</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('subscription.current_plan')}: <span className="font-bold uppercase text-theme">{user?.subscription_plan || 'Free'}</span>
          </p>
        </div>
        {user?.subscription_expiry && (
          <div className={`px-4 py-2 border ${isDark ? 'border-theme/20 bg-theme/5' : 'border-gray-200 bg-gray-50'} rounded-lg text-right`}>
            <p className="text-[10px] uppercase font-bold opacity-50">{t('subscription.expiry')}</p>
            <p className="font-mono text-sm">{new Date(user.subscription_expiry).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.type}
            className={`p-6 border-2 transition-all ${selectedPlan?.type === plan.type ? 'border-theme ring-1 ring-theme' : isDark ? 'border-[#262626] hover:border-gray-700' : 'border-gray-200 hover:border-gray-300'} ${isDark ? 'bg-[#141414]' : 'bg-white'} rounded-xl cursor-pointer`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3 className="text-xl font-bold uppercase mb-4">{plan.type}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-black">{plan.price.toLocaleString()}</span>
              <span className="text-xs uppercase opacity-50">MMK / {t('subscription.monthly')}</span>
            </div>
            <button 
              className={`w-full py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${selectedPlan?.type === plan.type ? 'bg-theme text-white' : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
            >
              {user?.subscription_plan === plan.type ? t('subscription.current') : t('subscription.select_plan')}
            </button>
          </div>
        ))}
      </div>

      {/* Payment & Request Form */}
      {selectedPlan && selectedPlan.type !== 'free' && (
        <div className={`p-8 border-2 ${isDark ? 'border-[#262626] bg-[#141414]' : 'border-gray-200 bg-white'} rounded-2xl animate-in fade-in slide-in-from-bottom-4`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Payment Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold uppercase flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-theme" />
                {t('subscription.payment_info')}
              </h2>
              <div className="space-y-4">
                {paymentInfo.map((pay) => (
                  <div key={pay.id} className={`p-4 border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'} rounded-lg`}>
                    <p className="text-xs font-bold uppercase opacity-50">{pay.provider}</p>
                    <p className="text-lg font-bold">{pay.account_number}</p>
                    <p className="text-xs opacity-70">{pay.account_name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-bold uppercase flex items-center gap-2">
                <CloudArrowUpIcon className="w-5 h-5 text-theme" />
                {t('subscription.upload_receipt')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-2 opacity-50">Receipt URL (Link to screenshot)</label>
                  <input 
                    type="text" 
                    required 
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder="https://imgur.com/..."
                    className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-2 opacity-50">Notes (Optional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-theme text-white font-bold uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submitting ? t('common.loading') : t('subscription.submit_request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription History */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold uppercase flex items-center gap-2">
          <ClockIcon className="w-5 h-5 opacity-50" />
          {t('subscription.history')}
        </h2>
        <div className={`overflow-hidden border ${isDark ? 'border-[#262626]' : 'border-gray-200'} rounded-xl`}>
          <table className="w-full text-left text-sm">
            <thead className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">{t('subscription.title')}</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">{t('subscription.status')}</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">{t('subscription.expiry')}</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10">
              {history.map((item) => (
                <tr key={item.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 font-bold uppercase">{item.plan_type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                      item.status === 'active' ? 'bg-green-500/20 text-green-500' : 
                      item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 opacity-50">{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center opacity-50">No subscription history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
