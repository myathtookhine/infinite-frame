import React, { useEffect, useRef } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

const LandingPage = () => {
  const observerRef = useRef(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
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

  return (
    <div className="min-h-screen bg-theme text-theme">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wider">
            {t('nav.brand')}
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
          {/* <div className="flex gap-12 text-sm uppercase tracking-wider opacity-70">
            <a href="#" className="hover:opacity-100">{t('footer.privacy')}</a>
            <a href="#" className="hover:opacity-100">{t('footer.terms')}</a>
            <a href="#" className="hover:opacity-100">{t('footer.contact')}</a>
          </div> */}
          <p className="text-sm opacity-50">&copy; 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
