import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ThemeToggle';

const ArtworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    const fetchArtwork = async () => {
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
        // Assuming the endpoint for fetching a single artwork
        const endpoint = `${baseUrl}/api/public/artworks/${id}`;

        const response = await axios.get(endpoint);

        if (response.data.success) {
          setArtwork(response.data.data);
          setActiveImage(response.data.data.main_image);
        } else {
          setError('Artwork not found');
        }
      } catch (err) {
        console.error('Error fetching artwork:', err);
        if (err.response?.status === 404) {
          setError('Artwork not found');
        } else {
          setError('Failed to load artwork details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArtwork();
    }
  }, [id]);

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
          <p className="text-sm uppercase tracking-wider font-light opacity-70">Loading Artwork...</p>
        </div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-theme text-theme flex flex-col">
        <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
          <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <ThemeToggle />
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <h1 className="text-6xl md:text-8xl font-bold mb-4">404</h1>
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">{error || 'Artwork Not Found'}</h2>
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 border-2 border-theme uppercase font-bold tracking-wider hover:bg-theme-inverse hover:text-theme-inverse transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme text-theme flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-24 px-8 md:px-16 lg:px-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">

          {/* Left Column: Images */}
          <div className="space-y-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group">
              <img
                src={activeImage}
                alt={artwork.title}
                className="w-full h-auto object-contain max-h-[80vh] mx-auto"
              />
            </div>

            {/* Additional Images Thumbnails */}
            {artwork.additional_images && artwork.additional_images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                <button
                  onClick={() => setActiveImage(artwork.main_image)}
                  className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${activeImage === artwork.main_image ? 'border-theme opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={artwork.main_image} alt="Main view" className="w-full h-full object-cover" />
                </button>
                {artwork.additional_images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${activeImage === img ? 'border-theme opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information */}
          <div className="flex flex-col h-full">
            <div className="mb-8 border-b border-theme/20 pb-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight leading-none">
                  {artwork.title}
                </h1>
                {/* Status Badges */}
                {artwork.status === 'sold' && (
                  <span className="px-3 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-full border border-red-500">
                    Sold
                  </span>
                )}
                {artwork.status === 'reserved' && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold uppercase tracking-wider rounded-full border border-orange-500">
                    Reserved
                  </span>
                )}
              </div>

              {artwork.artist_name && (
                <h2 className="text-xl opacity-70 font-light mb-1">
                  {artwork.artist_name}
                </h2>
              )}
              {artwork.year && (
                <p className="text-sm opacity-50 font-mono">
                  {artwork.year}
                </p>
              )}
            </div>

            <div className="space-y-8 flex-1">
              {/* Price */}
              <div>
                {artwork.show_price !== false && artwork.is_for_sale && artwork.price ? (
                  <div className="text-2xl md:text-3xl font-light">
                    {Number(artwork.price).toLocaleString()}
                    <span className="text-base ml-2 opacity-60">{artwork.currency || 'MMK'}</span>
                  </div>
                ) : (
                  <div className="text-xl uppercase tracking-wider font-light opacity-70">
                    Price on Request
                  </div>
                )}
              </div>

              {/* Dimensions & Quick Stats */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                {artwork.width && artwork.height && (
                  <div>
                    <span className="block opacity-50 text-xs uppercase tracking-wider mb-1">Dimensions</span>
                    <span className="font-medium">
                      {artwork.width} × {artwork.height} {artwork.depth ? `× ${artwork.depth}` : ''} {artwork.unit_name || 'cm'}
                    </span>
                  </div>
                )}

                {artwork.medium && (
                  <div>
                    <span className="block opacity-50 text-xs uppercase tracking-wider mb-1">Medium</span>
                    <span className="font-medium capitalize">{artwork.medium}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {artwork.description && (
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-50">About the work</h3>
                  <p className="font-light leading-relaxed opacity-80 whitespace-pre-line">
                    {decodeHtml(artwork.description)}
                  </p>
                </div>
              )}

              {/* Additional Details / Attributes */}
              {artwork.attributes && artwork.attributes.length > 0 && (
                <div className="pt-8 border-t border-theme/10">
                  <div className="flex flex-wrap gap-2">
                    {artwork.attributes.map((attr, idx) => (
                      <span key={idx} className="px-3 py-1 bg-theme/5 rounded-full text-xs uppercase tracking-wider opacity-70">
                        {attr.name || attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Action Button */}
            <div className="mt-12 pt-8 border-t border-theme/20">
              <button
                className="w-full py-4 bg-theme-inverse text-theme-inverse border border-theme hover:bg-theme hover:text-theme transition-all duration-300 font-bold uppercase tracking-widest text-sm"
                onClick={() => {
                  // Handle inquiry - either mailto or scroll to contact
                  const subject = `Inquiry: ${artwork.title}`;
                  const body = `I am interested in the artwork "${artwork.title}". Please send me more information.`;
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Inquire about this work
              </button>
              <p className="text-center text-xs opacity-40 mt-4">
                Clicking will open your default email client
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArtworkDetail;
