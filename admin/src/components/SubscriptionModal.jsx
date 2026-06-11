import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { XMarkIcon, SparklesIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

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

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';

  const content = {
    welcome: {
      title: "Welcome to Infinite Frame",
      desc: "You are currently on the Free plan. Showcase up to 20 artworks with our standard layout.",
      cta: "Explore Plans"
    },
    warning: {
      title: "Subscription Expiring Soon",
      desc: "Your plan will expire in less than 5 days. Renew now to maintain your gallery features.",
      cta: "Renew Now"
    },
    expired: {
      title: "Subscription Expired",
      desc: "Your subscription has expired. Some features may be limited until you renew.",
      cta: "Renew Plan"
    }
  }[modalType];

  const getIcon = () => {
    switch (modalType) {
      case 'welcome':
        return (
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'} mb-6 animate-in zoom-in duration-300`}>
            <SparklesIcon className={`h-10 w-10 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
        );
      case 'warning':
        return (
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'} mb-6 animate-in zoom-in duration-300`}>
            <ClockIcon className={`h-10 w-10 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
        );
      case 'expired':
        return (
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isDark ? 'bg-red-500/10' : 'bg-red-50'} mb-6 animate-in zoom-in duration-300`}>
            <ExclamationTriangleIcon className={`h-10 w-10 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Modal Content */}
      <div className={`relative w-full max-w-md p-8 rounded-3xl border ${borderColor} ${cardBg} shadow-2xl animate-in zoom-in-95 duration-300 text-center`}>
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        >
          <XMarkIcon className={`w-6 h-6 ${subtextColor}`} />
        </button>

        <div className="flex flex-col items-center">
          {getIcon()}
          
          <h2 className={`text-2xl font-black uppercase tracking-tight mb-3 ${textColor}`}>
            {content.title}
          </h2>
          <p className={`text-sm font-medium leading-relaxed max-w-[280px] mx-auto mb-8 ${subtextColor}`}>
            {content.desc}
          </p>

          <div className="w-full">
            <Button
              block
              onClick={() => {
                setIsOpen(false);
                navigate('/subscription');
              }}
              className="py-4 font-black uppercase tracking-widest text-xs"
            >
              {content.cta}
            </Button>
            <Button
              block
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="py-4 mt-2 font-black uppercase tracking-widest text-xs"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
