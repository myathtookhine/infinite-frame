import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import { useGallery } from '../context/GalleryContext';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

import GalleryArtworkSection from '../components/GalleryArtworkSection';


const GalleryView = () => {
  const { slug } = useParams();
  const { cacheGallery, saveScrollPosition, getCachedGallery } = useGallery();

  // Try to load from cache first
  const cached = getCachedGallery(slug);

  const [gallery, setGallery] = useState(cached?.data || null);
  const [loading, setLoading] = useState(!cached?.data);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef(null);

  // Scroll to Top Logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToContent = () => {
    const content = document.getElementById('gallery-content');
    if (content) {
      const navHeight = 80; // Approximate nav height
      const targetPosition = content.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Save scroll position on unmount or slug change
  useEffect(() => {
    return () => {
      saveScrollPosition(slug, window.scrollY);
    };
  }, [slug, saveScrollPosition]);

  useEffect(() => {
    // Check if we need to fetch (stale-while-revalidate pattern)
    // We try to use cache for immediate render, but always fetch fresh data in background

    const currentCached = getCachedGallery(slug);

    // Immediate state sync and scroll restore if cached
    if (currentCached?.data) {
      if (!gallery || gallery.id !== currentCached.data.id) {
        setGallery(currentCached.data);
      }

      // Restore scroll immediately
      setTimeout(() => {
        window.scrollTo(0, currentCached.scrollPosition || 0);
      }, 0);
    } else {
      // No cache: Scroll top and show loader
      window.scrollTo(0, 0);
      if (!gallery) setLoading(true);
    }

    const fetchGallery = async () => {
      try {
        // Only show loading if we have absolutely nothing
        if (!gallery && !currentCached?.data) setLoading(true);
        setError(null);
        
        const getBaseUrl = () => {
          let envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          if (envUrl.endsWith('/')) {
            envUrl = envUrl.slice(0, -1);
          }
          return envUrl;
        };

        const baseUrl = getBaseUrl();
        let endpoint = '';
        if (baseUrl.endsWith('/api')) {
          endpoint = `${baseUrl}/public/gallery/${slug}`;
        } else {
          endpoint = `${baseUrl}/api/public/gallery/${slug}`;
        }

        const response = await axios.get(endpoint);
        
        if (response.data.success) {
          const newData = response.data.data;

          // Check if data actually changed to avoid unnecessary re-renders
          const currentDataStr = JSON.stringify(currentCached?.data || {});
          const newDataStr = JSON.stringify(newData);

          if (currentDataStr !== newDataStr) {
            setGallery(newData);
            cacheGallery(slug, newData);
          }
        } else {
          if (!currentCached?.data) setError('Gallery not found');
        }
      } catch (err) {
        console.error('Error fetching gallery:', err);
        if (!currentCached?.data) {
          if (err.response?.status === 404) {
            setError('Gallery not found');
          } else {
            setError('Failed to load gallery. Please try again later.');
             }
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchGallery();
    }
  }, [slug]); // Depend mainly on slug

  // Track Visit (Separate from data fetching)
  useEffect(() => {
    if (!slug) return;

    const trackVisit = async () => {
      // Session Check: Avoid double counting on refresh
      const sessionKey = `visited_gallery_${slug}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already visited in this session
      }

      try {
        const getBaseUrl = () => {
          let envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          if (envUrl.endsWith('/api')) return envUrl; // If explicitly has /api
          return `${envUrl}/api`;
        };

        await axios.post(`${getBaseUrl()}/public/gallery/${slug}/visit`);

        // Mark as visited
        sessionStorage.setItem(sessionKey, 'true');
      } catch (err) {
        console.error('Failed to track visit:', err);
      }
    };

    trackVisit();
  }, [slug]);


  useEffect(() => {
    if (!loading && !error && gallery) {
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
    }
  }, [loading, error, gallery]);

  const decodeHtml = (html) => {
    if (!html) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme text-theme">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-theme border-t-transparent animate-spin mx-auto mb-8" />
          <p className="text-sm uppercase tracking-wider font-light opacity-70">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-theme text-theme">
        <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
          <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-end">
            <ThemeToggle />
          </div>
        </nav>

        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="text-center max-w-2xl pt-20">
            <h1 className="text-8xl md:text-9xl font-bold mb-8">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-8">Not Found</h2>
            <p className="text-lg md:text-xl opacity-70 mb-8 font-light">
              The gallery you're looking for doesn't exist.
            </p>
            <div className="border-2 border-theme p-6 text-sm font-mono opacity-50">
              {slug}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme text-theme gallery-view">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wider">
            {decodeHtml(gallery.gallery_name) || gallery.username}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-0 md:px-8 lg:px-8 pt-20 pb-0 md:pt-28 lg:pt-32 lg:pb-0 relative group">
        {/* Banner */}
        {gallery.banner_enabled && gallery.banner_image_url && (
          <div className="reveal mb-8 sm:mb-8 relative">
            <div className="overflow-hidden md:rounded-lg">
              <img
                src={gallery.banner_image_url}
                alt={`${decodeHtml(gallery.gallery_name) || gallery.username} banner`}
                className="w-full h-auto object-cover"
                style={{ aspectRatio: '1200/630' }}
              />
            </div>
            {/* Learn More / Scroll Down Button */}
            <div className="hidden lg:block absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
              <button
                onClick={scrollToContent}
                className="flex flex-row items-center gap-2 text-white/80 hover:text-white transition-colors animate-bounce cursor-pointer bg-black/20 backdrop-blur-sm p-2 px-8 rounded-full hover:bg-black/40"
              >
                <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">Learn More</span>
                <ChevronDownIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div id="gallery-content" className="max-w-6xl mx-auto px-4 md:px-8 lg:px-8 pb-24">
        {/* Header */}
        <header className={`reveal text-center ${gallery.banner_enabled && gallery.banner_image_url ? 'pt-0' : 'pt-32'} sm:pt-16`}>
          <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold capitalize tracking-tighter leading-tight mb-4 sm:mb-4">
            {decodeHtml(gallery.gallery_name) || gallery.username}
          </h1>
          <div className="w-32 h-1 bg-theme mx-auto"></div>
        </header>
        
        {/* Description */}
        {gallery.description && (
          <section className="reveal text-left mb-20 mx-auto border-b pb-24">
            <p className="text-md md:text-xl font-light leading-relaxed opacity-70 text-center">
              {decodeHtml(gallery.description)}
            </p>
          </section>
        )}

        {/* Gallery Categories tabs and Gallery Artwork grid  */}
        {gallery.categories && gallery.artworks && (
          <GalleryArtworkSection
            categories={gallery.categories}
            artworks={gallery.artworks}
            gallerySlug={slug}
          />
        )}

        {/* Contact Information */}
        {(gallery.address || gallery.email || (gallery.phone_numbers && gallery.phone_numbers.length > 0)) && (
          <section className="reveal mb-36 border-t border-theme pt-32 mt-18">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-16 text-center">Contact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {gallery.address && (
                <div className="border-l-4 border-theme pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPinIcon className="w-6 h-6" />
                    <span className="text-sm uppercase tracking-wider font-bold">Address</span>
                  </div>
                  <p className="text-base font-light opacity-70">{decodeHtml(gallery.address)}</p>
                </div>
              )}

              {gallery.email && (
                <div className="border-l-4 border-theme pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <EnvelopeIcon className="w-6 h-6" />
                    <span className="text-sm uppercase tracking-wider font-bold">Email</span>
                  </div>
                  <a href={`mailto:${gallery.email}`} className="text-base font-light opacity-70 hover:opacity-100 underline">
                    {gallery.email}
                  </a>
                </div>
              )}


              {gallery.phone_numbers && gallery.phone_numbers.length > 0 && (
                <div className="border-l-4 border-theme pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <PhoneIcon className="w-6 h-6" />
                    <span className="text-sm uppercase tracking-wider font-bold">Phone</span>
                  </div>
                  <div className="space-y-2">
                    {gallery.phone_numbers.map((phone, index) => (
                      <a key={index} href={`tel:${phone}`} className="block text-base font-light opacity-70 hover:opacity-100 underline">
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Social Links */}
        {gallery.social_links && Object.keys(gallery.social_links).length > 0 && (
          <section className="reveal text-center mb-28 border-t border-theme pt-32">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-16">Connect</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {Object.entries(gallery.social_links).map(([platform, url]) => (
                <a 
                  key={platform} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 border-2 border-theme text-sm font-bold uppercase tracking-wider hover:bg-theme-inverse transition-all"
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>


      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 p-3 rounded-full bg-theme-inverse text-theme-inverse shadow-lg transition-all duration-300 transform border border-theme hover:scale-110 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
          }`}
        title="Scroll to top"
      >
        <ArrowUpIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default GalleryView;
