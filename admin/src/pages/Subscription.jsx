import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CreditCardIcon, CheckIcon, CloudArrowUpIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

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
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const tableHeaderClass = isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600";
  const tableRowClass = isDark ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50";
  const textClass = isDark ? "text-gray-300" : "text-gray-900";
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentRes, historyRes] = await Promise.all([
        fetch(`${apiUrl}/subscription/payment-info`, {
          headers: { 'x-admin-id': user?.id }
        }),
        fetch(`${apiUrl}/subscription/my-subscriptions`, {
          headers: { 'x-admin-id': user?.id }
        })
      ]);
      const paymentData = await paymentRes.json();
      const historyData = await historyRes.json();
      setPaymentInfo(Array.isArray(paymentData) ? paymentData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !receiptFile) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('plan_type', selectedPlan.type);
      formData.append('billing_cycle', billingCycle);
      formData.append('amount', selectedPlan.price);
      formData.append('receipt', receiptFile);
      formData.append('notes', notes);

      const response = await fetch(`${apiUrl}/subscription/submit`, {
        method: 'POST',
        headers: {
          'x-admin-id': user?.id
        },
        body: formData
      });

      if (response.ok) {
        alert(t('common.success'));
        setSelectedPlan(null);
        setReceiptFile(null);
        setReceiptPreview(null);
        setNotes('');
        setIsModalOpen(false);
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
    {
      type: 'free',
      price: 0,
      color: 'text-gray-500',
      features: [
        'Max Artwork Count: 20',
        'Domain: IF slug domain (e.g. online/slug)',
        'Layout: Default gallery layout',
        'Analytics: Basic analytic dashboard',
        'Support: Standard support (Email, Chat)'
      ]
    },
    {
      type: 'pro',
      price: 15000,
      color: 'text-purple-500',
      features: [
        'Max Artwork Count: 100',
        'Domain: IF slug domain',
        'Layout: 3 customized gallery layouts (IF)',
        'Analytics: Basic analytic dashboard',
        'Support: Priority support (Email, Chat, Phone calls)',
        'Extra: Access to upcoming features'
      ]
    },
    {
      type: 'deluxe',
      price: 45000,
      color: 'text-pink-500',
      features: [
        'Max Artwork Count: Unlimited',
        'Domain: Custom domain support',
        'Layout: Fully customized layouts (IF)',
        'Analytics: Advanced analytics',
        'Support: Priority support (Email, Chat, Phone calls)',
        'Extra: Access to upcoming features'
      ]
    }
  ];

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <main className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${isDark ? "text-white" : "text-[#151416]"} mb-2`}>
            {t('subscription.title')}
          </h1>
          <p className={`font-sans text-sm sm:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
        {plans.map((plan) => (
          <div 
            key={plan.type}
            className={`flex flex-col p-6 border-2 transition-all ${selectedPlan?.type === plan.type ? 'border-theme ring-1 ring-theme' : isDark ? 'border-[#262626] hover:border-gray-700' : 'border-gray-200 hover:border-gray-300'} ${isDark ? 'bg-[#141414]' : 'bg-white'} rounded-xl`}
          >
            <h3 className="text-xl font-bold uppercase mb-4">{plan.type}</h3>
            <div className="flex items-baseline gap-1 mb-6 border-b pb-6 border-dashed border-gray-500/10">
              <span className="text-3xl font-black">{plan.price.toLocaleString()}</span>
              <span className="text-xs uppercase opacity-50 font-bold">MMK / {t('subscription.monthly')}</span>
            </div>

            <div className="flex-1 space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 group">
                  <CheckIcon className={`w-4 h-4 ${plan.type === 'deluxe' ? 'text-pink-500' : plan.type === 'pro' ? 'text-purple-500' : 'text-theme'} shrink-0 mt-0.5`} />
                  <span className="text-xs font-bold opacity-60 group-hover:opacity-100 transition-opacity capitalize tracking-tight">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-dashed border-gray-500/10">
              {plan.type === 'free' ? (
                user?.subscription_plan === 'free' && (
                  <div className={`py-4 text-center font-black uppercase tracking-widest text-[10px] opacity-40`}>
                    {t('subscription.subscribed')}
                  </div>
                )
              ) : (
                <Button
                  block
                  variant={selectedPlan?.type === plan.type ? 'primary' : 'secondary'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan);
                    setIsModalOpen(true);
                    }}
                    disabled={user?.subscription_plan === plan.type}
                    className="py-4 font-black uppercase tracking-widest"
                  >
                    {user?.subscription_plan === plan.type ? t('subscription.subscribed') : t('subscription.select_plan')}
                  </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment & Request Modal */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 border-2 rounded-3xl shadow-2xl ${isDark ? 'bg-[#141414] border-theme/30' : 'bg-white border-gray-200'} animate-in zoom-in-95 duration-300`}>
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-6 right-6 p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#151416]'} transition-colors z-10`}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                <CreditCardIcon className="w-8 h-8 text-theme" />
                Plan: {selectedPlan.type}
              </h2>
              <p className={`text-sm opacity-50 font-bold uppercase mt-1`}>
                Total Amount: {selectedPlan.price.toLocaleString()} MMK / {billingCycle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left: Payment Info */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 border-b pb-2">
                  Payment Destination
                </h3>
                <div className="space-y-4">
                  {paymentInfo.map((pay) => (
                    <div key={pay.id} className={`p-5 border-2 ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'} rounded-2xl group transition-all`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-theme tracking-wider bg-theme/10 px-2 py-0.5 rounded">
                          {pay.provider}
                        </span>
                      </div>
                      <p className="text-xl font-mono font-black tracking-tight mb-1">{pay.account_number}</p>
                      <p className="text-xs font-bold opacity-60 uppercase">{pay.account_name}</p>
                    </div>
                  ))}
                  {paymentInfo.length === 0 && (
                    <p className="text-sm opacity-50 italic">No payment information available.</p>
                  )}
                </div>
              </div>

              {/* Right: Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 border-b pb-2">
                  Submit Receipt
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Upload Payment Slip</label>
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${isDark ? 'border-white/10 hover:border-theme/40 bg-black/20' : 'border-gray-300 hover:border-theme/40 bg-gray-50'}`}>
                      <input 
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setReceiptFile(file);
                            setReceiptPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {receiptPreview ? (
                        <div className="flex flex-col items-center">
                          <div className="relative group/preview">
                            <img src={receiptPreview} alt="Receipt preview" className="max-h-40 object-contain rounded-xl shadow-lg mb-3" />
                            <div className="absolute inset-0 bg-theme/20 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <CloudArrowUpIcon className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-theme">Change Image</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4">
                          <div className="p-3 rounded-full bg-theme/10 mb-3 group-hover:scale-110 transition-transform">
                            <CloudArrowUpIcon className="w-8 h-8 text-theme" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">Click or drag to upload</span>
                          <span className="text-[10px] mt-1 opacity-40">JPG, PNG OR WEBP (MAX 8MB)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      placeholder="Enter any additional details..."
                      className={`w-full p-4 text-sm font-medium border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-theme/30 transition-all ${isDark ? 'bg-black/40 border-white/5 focus:border-theme/50' : 'bg-gray-50 border-gray-100 focus:border-theme/50'}`}
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <Button
                      block
                      type="submit"
                      disabled={submitting}
                      className="py-4 font-black uppercase tracking-widest shadow-xl shadow-theme/20"
                    >
                      {submitting ? t('common.loading') : t('subscription.submit_request')}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-3 mt-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subscription History Table */}
      <div className="mt-12">
        <h2 className={`text-xl font-bold mb-6 ${textClass}`}>Subscription History</h2>
        <div className={`overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-xl`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className={`${tableHeaderClass} uppercase font-sans text-xs`}>
                <tr>
                  <th className="px-6 py-4">Plan / Billing</th>
                  <th className="px-6 py-4">Request Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={`px-6 py-10 text-center ${subtextColor}`}>
                      No subscription history found.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className={`${tableRowClass} transition-colors border-b last:border-0 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                      <td className="px-6 py-4">
                        <div className={`font-bold ${textClass} uppercase`}>{item.plan_type}</div>
                        <div className="text-[10px] opacity-40 uppercase tracking-tight">{item.billing_cycle}</div>
                      </td>
                      <td className={`px-6 py-4 ${textClass}`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : item.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono ${textClass}`}>
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Subscription;
