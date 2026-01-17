import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const GalleryView = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    const fetchGallery = async () => {
      try {
        setLoading(true);
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
          setGallery(response.data.data);
        } else {
          setError('Gallery not found');
        }
      } catch (err) {
        console.error('Error fetching gallery:', err);
        if (err.response?.status === 404) {
          setError('Gallery not found');
        } else {
          setError('Failed to load gallery. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchGallery();
    }
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

      <div className="max-w-6xl mx-auto px-8 md:px-16 lg:px-24 py-32">

        {/* Banner */}
        {gallery.banner_enabled && gallery.banner_image_url && (
          <div className="reveal mb-16 -mx-8 md:-mx-16 lg:-mx-24">
            <div className="overflow-hidden">
              <img
                src={gallery.banner_image_url}
                alt={`${decodeHtml(gallery.gallery_name) || gallery.username} banner`}
                className="w-full h-auto object-cover"
                style={{ aspectRatio: '1200/630' }}
              />
            </div>
          </div>
        )}

        {/* Header */}
        <header className="reveal text-center mb-32 pt-16">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter leading-tight mb-8">
            {decodeHtml(gallery.gallery_name) || gallery.username}
          </h1>
          <div className="w-32 h-1 bg-theme mx-auto"></div>
        </header>
        
        {/* Description */}
        {gallery.description && (
          <section className="reveal text-center mb-32 max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl font-light leading-relaxed opacity-70">
              {decodeHtml(gallery.description)}
            </p>
          </section>
        )}

        {/* Contact Information */}
        {(gallery.address || gallery.email || (gallery.phone_numbers && gallery.phone_numbers.length > 0)) && (
          <section className="reveal mb-32 border-t border-theme pt-32">
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
          <section className="reveal text-center mb-32 border-t border-theme pt-32">
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

        <footer className="text-center pt-16 border-t border-theme">
          <p className="text-sm uppercase tracking-wider opacity-50">@{gallery.username}</p>
        </footer>
      </div>
    </div>
  );
};

export default GalleryView;
