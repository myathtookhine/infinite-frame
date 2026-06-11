import React, { useEffect, useRef } from 'react';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../assets/if.svg';
import Lottie from 'lottie-react';
import { useState } from 'react';
import animationData from '../assets/ifLogo.json';

const LandingPage = () => {
  const observerRef = useRef(null);
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    // Track Visit (Super Admin Analytics)
    const trackVisit = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://infinite-frame-server.onrender.com/api';
        await fetch(`${apiUrl}/public/visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('Failed to track visit:', err);
      }
    };
    trackVisit();
  }, []);


  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const lottieRef = useRef();

  return (
    <div className="min-h-screen bg-theme text-theme">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
          <div
            className="h-10 w-10 cursor-pointer"
            onMouseEnter={() => lottieRef.current?.goToAndPlay(0)}
          >
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              loop={false}
              className="h-full w-full"
            />
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center px-8 md:px-16 lg:px-24 pt-32 pb-24">
        <div className="max-w-7xl w-full">
          <div className="reveal space-y-16 mt-4">
            <h1 className={`font-bold uppercase leading-[0.9] tracking-tighter whitespace-pre-line ${language === 'my'
              ? 'text-4xl md:text-4xl lg:text-5xl'
              : 'text-6xl md:text-8xl lg:text-9xl'
              }`}>
              {t('hero.title')}
            </h1>

            <p className="text-xl md:text-2xl max-w-3xl font-light leading-relaxed opacity-70">
              {t('hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <a
                href="https://admin.infiniteframe.online"
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-theme-inverse border-2 border-theme text-sm font-bold uppercase tracking-wider hover-lift"
              >
                {t('hero.cta')}
                <ArrowRightIcon className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-10 py-5 border-2 border-theme text-sm font-bold uppercase tracking-wider hover-lift"
              >
                {t('hero.learn')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-40 px-8 md:px-16 lg:px-24 border-t border-theme">
        <div className="max-w-7xl mx-auto">
          <div className="reveal mb-32">
            <h2 className={`font-bold uppercase leading-[0.9] tracking-tighter whitespace-pre-line ${language === 'my'
              ? 'text-4xl md:text-4xl lg:text-5xl'
              : 'text-6xl md:text-8xl lg:text-9xl'
              }`}>
              {t('features.title')}
            </h2>
            <p className="text-xl md:text-2xl opacity-70 max-w-3xl font-light">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24 lg:gap-x-32 lg:gap-y-32">
            {['space', 'hassle', 'access', 'quality'].map((key, index) => (
              <div
                key={index}
                className="reveal border-l-4 border-theme pl-8 space-y-6"
              >
                <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">{t(`features.items.${key}.title`)}</h3>
                <p className="text-lg md:text-xl opacity-70 leading-relaxed font-light">{t(`features.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-40 px-8 md:px-16 lg:px-24 border-t border-theme">
        <div className="max-w-7xl mx-auto">
          <div className="reveal mb-24 text-center md:text-left">
            <h2 className={`font-bold uppercase leading-[0.9] tracking-tighter whitespace-pre-line ${language === 'my'
              ? 'text-4xl md:text-4xl lg:text-5xl'
              : 'text-6xl md:text-8xl lg:text-9xl'
              }`}>
              {t('pricing.title')}
            </h2>
            <p className="text-xl md:text-2xl opacity-70 max-w-3xl font-light mt-6">
              {t('pricing.subtitle')}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center md:justify-start gap-4 mt-12 bg-theme p-1 border-2 border-theme w-fit mx-auto md:mx-0">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all ${billingCycle === 'monthly' ? 'bg-theme-inverse text-theme-inverse' : 'opacity-50 hover:opacity-100'}`}
              >
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all ${billingCycle === 'yearly' ? 'bg-theme-inverse text-theme-inverse' : 'opacity-50 hover:opacity-100'}`}
              >
                {t('pricing.yearly')}
                <span className="text-[10px] bg-theme-inverse text-theme-inverse px-1.5 py-0.5 border border-theme">
                  {t('pricing.save')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['free', 'pro', 'deluxe'].map((planKey) => {
              const plan = t(`pricing.plans.${planKey}`, { returnObjects: true });
              // Check if plan is an object (it should be since we use returnObjects: true if supported, 
              // but our custom t doesn't support returnObjects. I'll handle it manually)

              // Manual retrieval since custom t doesn't support returnObjects:
              const title = t(`pricing.plans.${planKey}.title`);
              const basePrice = t(`pricing.plans.${planKey}.price`);
              const description = t(`pricing.plans.${planKey}.description`);

              // Handle Price calculation
              let displayPrice = basePrice;
              if (planKey !== 'free' && billingCycle === 'yearly') {
                const numericPrice = parseInt(basePrice.replace(/,/g, ''));
                const yearlyDiscountedMonthly = Math.floor((numericPrice * 12 * 0.8) / 12);
                displayPrice = yearlyDiscountedMonthly.toLocaleString();
              }

              return (
                <div
                  key={planKey}
                  className={`reveal flex flex-col p-10 border-2 border-theme ${planKey === 'pro' ? 'bg-theme-inverse text-theme-inverse scale-105 z-10' : 'bg-theme'}`}
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold uppercase tracking-tighter mb-2">{title}</h3>
                    <p className="text-sm opacity-70 font-light">{description}</p>
                  </div>

                  <div className="mb-10 flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter">{displayPrice}</span>
                    <span className="text-sm font-bold uppercase opacity-50">MMK / {t('pricing.monthly')}</span>
                  </div>

                  <ul className="space-y-4 mb-12 flex-1">
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const feature = t(`pricing.plans.${planKey}.features.${i}`);
                      if (feature === `pricing.plans.${planKey}.features.${i}`) return null;
                      return (
                        <li key={i} className="flex items-start gap-3">
                          <CheckIcon className={`w-5 h-5 shrink-0 ${planKey === 'pro' ? 'text-theme-inverse' : 'text-theme'}`} />
                          <span className="text-sm font-medium leading-tight">{feature}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <a
                    href="https://admin.infiniteframe.online/register"
                    className={`inline-flex items-center justify-center py-4 text-xs font-bold uppercase tracking-widest border-2 transition-all hover-lift ${planKey === 'pro' ? 'bg-theme text-theme border-transparent' : 'bg-theme-inverse text-theme-inverse border-theme'}`}
                  >
                    {t('pricing.getStarted')}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-40 px-8 md:px-16 lg:px-24 border-t border-theme">
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal space-y-12">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-tight">
              {t('about.title')}
            </h2>
            <p className="text-md md:text-xl opacity-70 leading-relaxed max-w-3xl mx-auto font-light">
              {t('about.description')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-8 md:px-16 lg:px-24 border-t border-theme">
        <div className="max-w-7xl mx-auto">
          <div className="reveal space-y-16">
            <h2 h2 className={`font-bold uppercase leading-[0.9] tracking-tighter whitespace-pre-line ${language === 'my'
              ? 'text-2xl md:text-2xl lg:text-4xl'
              : 'text-6xl md:text-8xl lg:text-9xl'
              }`}>
              {t('cta.title')}
            </h2>
            <a
              href="https://admin.infiniteframe.online"
              className="group inline-flex items-center gap-4 px-12 py-6 bg-theme-inverse border-2 border-theme text-base font-bold uppercase tracking-wider hover-lift"
            >
              {t('cta.button')}
              <ArrowRightIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 md:px-16 lg:px-24 border-t border-theme">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="text-sm font-semibold uppercase tracking-wider">
            {t('nav.brand')}
          </div>
          <p className="text-sm opacity-50">&copy; 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
