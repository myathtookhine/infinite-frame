import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { XMarkIcon, SparklesIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const SubscriptionModal = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'welcome', 'warning', 'expired'

  useEffect(() => {
    if (!user) return;

    const checkSubscription = () => {
      const now = new Date();
      const expiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
      
      // 1. Expired Check
      if (expiry && now > expiry) {
        setModalType('expired');
        setIsOpen(true);
        return;
      }

      // 2. Warning Check (5 days = 432,000,000 ms)
      if (expiry && (expiry - now) < 432000000) {
        setModalType('warning');
        setIsOpen(true);
        return;
      }

      // 3. Welcome Check (If free and first time login in this session)
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
      if (user.subscription_plan === 'free' && !hasSeenWelcome) {
        setModalType('welcome');
        setIsOpen(true);
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }
    };

    // Small delay to let dashboard load
    const timer = setTimeout(checkSubscription, 1000);
    return () => clearTimeout(timer);
  }, [user]);

  if (!isOpen) return null;

  const content = {
    welcome: {
      title: "Welcome to Infinite Frame",
      desc: "You are currently on the Free plan. Showcase up to 20 artworks with our standard layout.",
      icon: <SparklesIcon className="w-12 h-12 text-yellow-500" />,
      cta: "Explore Plans"
    },
    warning: {
      title: "Subscription Expiring Soon",
      desc: `Your plan will expire in less than 5 days. Renew now to maintain your gallery features.`,
      icon: <ClockIcon className="w-12 h-12 text-orange-500" />,
      cta: "Renew Now"
    },
    expired: {
      title: "Subscription Expired",
      desc: "Your subscription has expired. Some features may be limited until you renew.",
      icon: <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />,
      cta: "Renew Plan"
    }
  }[modalType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md p-8 border-2 rounded-3xl shadow-2xl ${isDark ? 'bg-[#141414] border-theme/30' : 'bg-white border-gray-200'} animate-in zoom-in-95 duration-300`}>
        <button 
          onClick={() => setIsOpen(false)}
          className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            {content.icon}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{content.title}</h2>
            <p className={`text-sm font-light leading-relaxed max-w-[280px] mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {content.desc}
            </p>
          </div>

          <div className="w-full pt-4">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/subscription');
              }}
              className="w-full py-4 bg-theme text-white font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-theme/20"
            >
              {content.cta}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 mt-2 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
