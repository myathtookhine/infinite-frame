import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CreditCardIcon, CheckIcon, CloudArrowUpIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import InputTextarea from '../components/ui/InputTextarea';
import axios from 'axios';

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
  const [dragActive, setDragActive] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const tableHeaderClass = isDark ? "bg-[#1f1f1f] text-gray-300" : "bg-gray-100 text-gray-600";
  const tableRowClass = isDark ? "border-[#262626] hover:bg-white/5" : "border-gray-200 hover:bg-gray-50";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentRes, historyRes] = await Promise.all([
        axios.get(`${apiUrl}/subscription/payment-info`, {
          headers: { 'x-admin-id': user?.id }
        }),
        axios.get(`${apiUrl}/subscription/my-subscriptions`, {
          headers: { 'x-admin-id': user?.id }
        })
      ]);
      setPaymentInfo(Array.isArray(paymentRes.data) ? paymentRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
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

      const response = await axios.post(`${apiUrl}/subscription/submit`, formData, {
        headers: {
          'x-admin-id': user?.id
        }
      });

      if (response.status === 200 || response.status === 201) {
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
      alert(err.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
    e.target.value = '';
  };

  const processFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 8MB. Please choose a smaller image.');
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
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

  if (loading) return (
    <div className="max-w-7xl mx-auto pb-18 md:pb-0">
      <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
        <div className={`w-8 h-8 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
        <p className={subtextColor}>{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto">
      {/* Header */}
      <div className={`mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-dashed ${borderColor}`}>
        <div>
          <h1 className={`text-3xl font-black uppercase tracking-tight ${textColor}`}>
            {t('subscription.title')}
          </h1>
          <p className={`text-sm ${subtextColor} font-medium mt-1`}>
            {t('subscription.current_plan')}: <span className={`font-bold uppercase ${textColor}`}>{user?.subscription_plan || 'Free'}</span>
          </p>
        </div>
        {user?.subscription_expiry && (
          <div className={`px-4 py-2 border-2 ${borderColor} ${cardBg} rounded-xl text-right`}>
            <p className={`text-[10px] uppercase font-bold tracking-widest ${subtextColor}`}>{t('subscription.expiry')}</p>
            <p className={`font-mono text-sm font-bold ${textColor}`}>{new Date(user.subscription_expiry).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
        {plans.map((plan) => (
          <div 
            key={plan.type}
            className={`flex flex-col p-8 border-2 transition-all duration-300 ${
              selectedPlan?.type === plan.type 
                ? isDark ? 'border-white ring-4 ring-white/10' : 'border-gray-900 ring-4 ring-gray-900/10' 
                : `${borderColor} hover:-translate-y-1 ${isDark ? 'hover:border-gray-600' : 'hover:border-gray-400'}`
            } ${cardBg} rounded-2xl group`}
          >
            <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${plan.color}`}>{plan.type}</h3>
            <div className={`flex items-baseline gap-1 mb-6 border-b pb-6 border-dashed ${borderColor}`}>
              <span className={`text-4xl font-black tracking-tight ${textColor}`}>{plan.price.toLocaleString()}</span>
              <span className={`text-xs uppercase font-bold tracking-widest ${subtextColor}`}>MMK / {t('subscription.monthly')}</span>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckIcon className={`w-5 h-5 ${plan.type === 'deluxe' ? 'text-pink-500' : plan.type === 'pro' ? 'text-purple-500' : 'text-neutral-500'} shrink-0`} />
                  <span className={`text-sm font-medium ${subtextColor} group-hover:${textColor} transition-colors tracking-tight leading-snug`}>{feature}</span>
                </div>
              ))}
            </div>

            <div className={`mt-auto pt-6 border-t border-dashed ${borderColor}`}>
              {plan.type === 'free' ? (
                user?.subscription_plan === 'free' ? (
                  <div className={`py-4 text-center font-black uppercase tracking-widest text-[10px] ${subtextColor} opacity-60`}>
                    {t('subscription.subscribed')}
                  </div>
                ) : (
                  <div className={`py-4 text-center font-black uppercase tracking-widest text-[10px] ${subtextColor} opacity-60`}>
                    Included
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
                  className="py-4 font-black uppercase tracking-widest text-xs"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-10 rounded-3xl border ${borderColor} ${cardBg} shadow-2xl animate-in zoom-in-95 duration-200`}>
            
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
            >
              <XMarkIcon className={`h-6 w-6 ${subtextColor}`} />
            </button>

            <div className={`mb-10 border-b pb-6 border-dashed ${borderColor}`}>
              <h2 className={`text-3xl font-black uppercase tracking-tight flex items-center gap-3 ${textColor}`}>
                <CreditCardIcon className={`w-8 h-8 ${selectedPlan.color}`} />
                Plan: {selectedPlan.type}
              </h2>
              <p className={`text-sm ${subtextColor} font-bold uppercase tracking-widest mt-2`}>
                Total Amount: <span className={textColor}>{selectedPlan.price.toLocaleString()} MMK</span> / {billingCycle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left: Payment Info */}
              <div className="space-y-6">
                <h3 className={`text-xs font-black uppercase tracking-widest ${subtextColor} border-b pb-3 border-dashed ${borderColor}`}>
                  Payment Destination
                </h3>
                <div className="space-y-4">
                  {paymentInfo.map((pay) => (
                    <div key={pay.id} className={`p-6 border-2 ${borderColor} ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'} rounded-2xl transition-all group hover:border-gray-400`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                        }`}>
                          {pay.provider}
                        </span>
                      </div>
                      <p className={`text-2xl font-mono font-black tracking-tight mb-2 ${textColor}`}>{pay.account_number}</p>
                      <p className={`text-sm font-bold uppercase tracking-wide ${subtextColor}`}>{pay.account_name}</p>
                    </div>
                  ))}
                  {paymentInfo.length === 0 && (
                    <div className={`p-6 border-2 border-dashed ${borderColor} rounded-2xl text-center`}>
                      <p className={`text-sm ${subtextColor} font-medium`}>No payment information available.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className={`text-xs font-black uppercase tracking-widest ${subtextColor} border-b pb-3 border-dashed ${borderColor}`}>
                  Submit Receipt
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${textColor}`}>Upload Payment Slip <span className="text-red-500">*</span></label>
                    
                    <div
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                        dragActive
                          ? isDark ? 'border-white bg-white/5 scale-[1.02]' : 'border-black bg-black/5 scale-[1.02]'
                          : `${borderColor} ${isDark ? 'hover:bg-white/5 hover:border-gray-500' : 'hover:bg-black/5 hover:border-gray-400'}`
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input 
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required={!receiptFile}
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {receiptPreview ? (
                        <div className="flex flex-col items-center">
                          <div className="relative group/preview w-full">
                            <img src={receiptPreview} alt="Receipt preview" className="max-h-48 w-auto mx-auto object-contain rounded-xl shadow-lg mb-4" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-sm">
                              <CloudArrowUpIcon className="w-10 h-10 text-white" />
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Click or drag to change image</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-6">
                          <div className={`p-4 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'} mb-4`}>
                            <CloudArrowUpIcon className={`w-10 h-10 ${subtextColor}`} />
                          </div>
                          <span className={`text-sm font-bold ${textColor} mb-2`}>Drop receipt here or click to upload</span>
                          <span className={`text-xs font-medium uppercase tracking-widest ${subtextColor}`}>JPG, PNG, WebP • Max 8MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <InputTextarea
                    label="Notes (Optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional details about your payment..."
                    rows={3}
                  />

                  <div className={`flex justify-end gap-3 pt-6 border-t border-dashed ${borderColor}`}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !receiptFile}
                      className="px-8"
                    >
                      {submitting ? t('common.loading') : t('subscription.submit_request')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subscription History Table */}
      <div className="mt-12 pb-18 md:pb-0">
        <h2 className={`text-xl font-black uppercase tracking-tight mb-6 ${textColor}`}>Subscription History</h2>
        <div className={`overflow-hidden border-2 ${borderColor} rounded-2xl`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className={`${tableHeaderClass} uppercase font-black tracking-widest text-[10px]`}>
                <tr>
                  <th className="px-6 py-5">Plan / Billing</th>
                  <th className="px-6 py-5">Request Date</th>
                  <th className="px-6 py-5 text-right">Price</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">Expiry Date</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#262626]' : 'divide-gray-200'}`}>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`px-6 py-10 text-center ${subtextColor}`}>
                      No subscription history found.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className={`${tableRowClass} transition-colors border-b last:border-0 ${borderColor}`}>
                      <td className="px-6 py-4">
                        <div className={`font-bold ${textColor} uppercase`}>{item.plan_type}</div>
                        <div className={`text-[10px] ${subtextColor} uppercase tracking-tight`}>{item.billing_cycle}</div>
                      </td>
                      <td className={`px-6 py-4 ${textColor}`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${textColor}`}>
                        {item.amount?.toLocaleString()} MMK
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${item.status === 'active'
                          ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                          : item.status === 'pending'
                            ? isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono ${textColor}`}>
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
