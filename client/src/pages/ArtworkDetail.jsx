import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeftIcon, PencilIcon, DocumentCheckIcon, Square2StackIcon, EyeIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ThemeToggle';

const ArtworkDetail = () => {
  const { gallerySlug, artworkIdentifier } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  // Touch gesture states
  const [lastTapTime, setLastTapTime] = useState(0);
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [baseZoom, setBaseZoom] = useState(100);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (previewOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [previewOpen]);

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
        // Handle double /api issue if VITE_API_URL includes /api
        let endpoint = '';
        if (baseUrl.endsWith('/api')) {
          endpoint = `${baseUrl}/public/gallery/${gallerySlug}/artwork/${artworkIdentifier}`;
        } else {
          endpoint = `${baseUrl}/api/public/gallery/${gallerySlug}/artwork/${artworkIdentifier}`;
        }

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

    if (artworkIdentifier) {
      fetchArtwork();
    }
  }, [artworkIdentifier]);

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
    <div className="min-h-screen bg-theme text-theme flex flex-col gallery-view">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
            <button 
            onClick={() => gallerySlug ? navigate(`/${gallerySlug}`) : navigate(-1)}
            className="group flex items-center gap-2 text-sm font-bold uppercase cursor-pointer tracking-wider hover:opacity-70 transition-opacity"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-24 px-8 md:px-16 lg:px-24 max-w-4xl mx-auto w-full">
        <div className="flex flex-col gap-12">

          {/* Left Column: Images */}
          <div className="space-y-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group">
              <img
                src={activeImage} 
                alt={artwork.name}
                className="w-full h-full object-fit mx-auto"
              />

              {/* Preview Button Overlay */}
              <div className="absolute top-4 right-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="p-2 rounded-md bg-white/80 backdrop-blur-md transition-all cursor-pointer hover:bg-white shadow-sm"
                  title="Preview image"
                >
                  <EyeIcon className="h-5 w-5 text-neutral-900" />
                </button>
              </div>
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
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl md:text-4xl lg:text-4xl font-bold uppercase tracking-tighter leading-[0.9]">
                  {artwork.name}
                </h1>
              </div>

              <div className="flex items-start gap-12 mt-6">
                {artwork.created_year && (
                  <div>
                    <span className="block opacity-50 text-xs uppercase tracking-wider mb-2">Year of work</span>
                    <span className="text-lg font-light">
                      {artwork.created_year}
                    </span>
                  </div>
                )}

                <div>
                  <span className="block opacity-50 text-xs uppercase tracking-wider mb-2">Status</span>
                  <div className="flex items-center">
                    {artwork.status === 'available' && (
                      <span className="inline-flex items-center rounded-full text-[14px] font-bold uppercase tracking-wider text-green-900 dark:text-green-400">
                        Available to collect
                      </span>
                    )}
                    {artwork.status === 'reserved' && (
                      <span className="inline-flex items-center rounded-full text-[14px] font-bold uppercase tracking-wider text-orange-900 dark:text-orange-400">
                        Reserved
                      </span>
                    )}
                    {artwork.status === 'sold' && (
                      <span className="inline-flex items-center rounded-full text-[14px] font-bold uppercase tracking-wider text-red-900 dark:text-red-400">
                        Sold
                      </span>
                    )}
                    {artwork.status === 'private collection' && (
                      <span className="inline-flex items-center rounded-full text-[14px] font-bold uppercase tracking-wider text-gray-900 dark:text-gray-400">
                        Private Collection
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10 flex-1">
              {/* Price */}
              <div>
                {artwork.show_price !== false && artwork.is_for_sale && artwork.price ? (
                  <div className="text-3xl md:text-4xl font-light tracking-tight">
                    {Number(artwork.price).toLocaleString()} 
                    <span className="text-lg ml-2 opacity-60 font-normal">{artwork.currency || 'MMK'}</span>
                  </div>
                ) : (
                    <div className="text-2xl uppercase tracking-wider font-light opacity-70">
                      Price Unavailable
                  </div>
                )}
              </div>

              {/* Dimensions & Framed/unframed*/}
              <div className="grid grid-cols-2 gap-12 text-sm">
                {/* Dimensions */}
                {artwork.width && artwork.height && (
                  <div>
                    <span className="block opacity-50 text-xs uppercase tracking-wider mb-2">Dimensions</span>
                    <span className="text-lg font-light">
                      {artwork.width} × {artwork.height} {artwork.depth ? `× ${artwork.depth}` : ''} {artwork.unit_name || 'cm'}
                    </span>
                  </div>
                )}

                {/* Frame Status */}
                <div>
                  <span className="block opacity-50 text-xs uppercase tracking-wider mb-2">Frame</span>
                  <span className="text-lg font-light">
                    {artwork.is_framed ? 'Framed' : 'Not Included Frame'}
                  </span>
                </div>
              </div>

              {/* Tags (Attributes) Grouped by Type */}
              {artwork.attributes && artwork.attributes.length > 0 && (
                <div className="pt-2 space-y-6">
                  {Object.entries(artwork.attributes.reduce((acc, attr) => {
                    const type = attr.type || 'Other';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(attr);
                    return acc;
                  }, {})).sort(([a], [b]) => {
                    // specific order preferences if needed, else alphabetical
                    const order = ['Medium', 'Style', 'Technique', 'Subject'];
                    const indexA = order.indexOf(a);
                    const indexB = order.indexOf(b);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.localeCompare(b);
                  }).map(([type, attrs]) => (
                    <div key={type}>
                      <span className="block opacity-50 text-xs uppercase tracking-wider mb-3">{type}</span>
                      <div className="flex flex-wrap gap-2">
                        {attrs.map((attr, idx) => (
                          <span key={idx} className="px-4 py-1.5 border border-theme/20 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-theme hover:text-theme-inverse transition-colors cursor-default">
                            {attr.name || attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Info Display  */}

              {/* Additional Details (Edition & Authenticity) */}
              {artwork.show_additional_details && (
                <div className="grid grid-cols-2 gap-12 text-sm">
                  {(artwork.has_signature || artwork.has_coa) && (
                    <div>
                      <span className="block opacity-50 text-xs uppercase tracking-wider mb-2">Authenticity</span>
                      <div className="flex flex-col gap-2">
                        {artwork.has_signature && (
                          <div className="flex items-center gap-2">
                            <PencilIcon className="w-4 h-4 opacity-70" />
                            <span className="text-sm font-light">Signed by Artist</span>
                          </div>
                        )}
                        {artwork.has_coa && (
                          <div className="flex items-center gap-2">
                            <DocumentCheckIcon className="w-4 h-4 opacity-70" />
                            <span className="text-sm font-light">COA Included</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {artwork.edition_info && (
                    <div>
                      <span className="block opacity-50 text-xs uppercase tracking-wider mb-2">Edition</span>
                      <div className="flex items-center gap-2">
                        <Square2StackIcon className="w-4 h-4 opacity-70" />
                        <span className="text-sm font-light">{artwork.edition_info}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {artwork.description && (
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-50">About the work</h3>
                  <p className="text-lg font-light leading-relaxed opacity-80 whitespace-pre-line">
                    {decodeHtml(artwork.description)}
                  </p>
                </div>
              )}

            </div>

            {/* Action Button */}
            {/* <div className="mt-12 pt-8 border-t border-theme/20">
              <button
                className="w-full py-4 bg-theme-inverse text-theme-inverse border border-theme hover:bg-theme hover:text-theme transition-all duration-300 font-bold uppercase tracking-widest text-sm"
                onClick={() => {
                  // Handle inquiry - either mailto or scroll to contact
                  const subject = `Inquiry: ${artwork.name}`;
                  const body = `I am interested in the artwork "${artwork.name}". Please send me more information.`;
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Inquire about this work
              </button>
              <p className="text-center text-xs opacity-40 mt-4">
                Clicking will open your default email client
              </p>
            </div> */}
          </div>
        </div>
      </main>
      {/* Preview Modal */}
      {previewOpen && activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black backdrop-blur-sm"
            onClick={(e) => {
              if (!hasDragged) {
                setPreviewOpen(false);
                setZoom(100);
                setScrollPos({ x: 0, y: 0 });
              }
              setHasDragged(false);
            }}
          />
          <div
            className="relative max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              animation: 'modalZoomIn 0.8s ease-out'
            }}
            onMouseDown={(e) => {
              if (zoom > 100) {
                setIsDragging(true);
                setHasDragged(false);
                setDragStart({ x: e.clientX - scrollPos.x, y: e.clientY - scrollPos.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging && zoom > 100) {
                e.preventDefault();
                setHasDragged(true);
                const newX = e.clientX - dragStart.x;
                const newY = e.clientY - dragStart.y;
                setScrollPos({ x: newX, y: newY });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={(e) => {
              const touches = e.touches;

              if (touches.length === 2) {
                // Pinch zoom start
                const distance = Math.sqrt(
                  Math.pow(touches[1].clientX - touches[0].clientX, 2) +
                  Math.pow(touches[1].clientY - touches[0].clientY, 2)
                );
                setInitialPinchDistance(distance);
                setBaseZoom(zoom);
              } else if (touches.length === 1) {
                // Check for double tap
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;

                if (tapLength < 300 && tapLength > 0) {
                  // Double tap detected
                  setZoom(zoom === 200 ? 100 : 200);
                  setScrollPos({ x: 0, y: 0 });
                }
                setLastTapTime(currentTime);

                // Single finger pan start (when zoomed)
                if (zoom > 100) {
                  setIsDragging(true);
                  setHasDragged(false);
                  setDragStart({
                    x: touches[0].clientX - scrollPos.x,
                    y: touches[0].clientY - scrollPos.y
                  });
                }
              }
            }}
            onTouchMove={(e) => {
              const touches = e.touches;

              if (touches.length === 2 && initialPinchDistance) {
                // Pinch zoom
                e.preventDefault();
                const distance = Math.sqrt(
                  Math.pow(touches[1].clientX - touches[0].clientX, 2) +
                  Math.pow(touches[1].clientY - touches[0].clientY, 2)
                );
                const scale = distance / initialPinchDistance;
                const newZoom = Math.min(200, Math.max(50, baseZoom * scale));
                setZoom(newZoom);
              } else if (touches.length === 1 && isDragging && zoom > 100) {
                // Single finger pan
                e.preventDefault();
                setHasDragged(true);
                const newX = touches[0].clientX - dragStart.x;
                const newY = touches[0].clientY - dragStart.y;
                setScrollPos({ x: newX, y: newY });
              }
            }}
            onTouchEnd={() => {
              setIsDragging(false);
              setInitialPinchDistance(null);
            }}
          >
            <img
              src={activeImage}
              alt="Preview"
              style={{
                transform: `scale(${zoom / 100}) translate(${scrollPos.x}px, ${scrollPos.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s',
                transformOrigin: 'center center',
                userSelect: 'none',
                pointerEvents: zoom > 100 ? 'none' : 'auto'
              }}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.max(50, zoom - 25));
                }}
                className="p-2 rounded-md cursor-pointer backdrop-blur-sm transition-all bg-black/50 hover:bg-black/70"
                title="Zoom out"
                disabled={zoom <= 50}
              >
                <MagnifyingGlassMinusIcon className="h-5 w-5 text-white" />
              </button>
              <div className="px-3 py-2 rounded-md backdrop-blur-sm bg-black/50 text-white text-sm font-medium">
                {zoom}%
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.min(200, zoom + 25));
                }}
                className="p-2 rounded-md cursor-pointer backdrop-blur-sm transition-all bg-black/50 hover:bg-black/70"
                title="Zoom in"
                disabled={zoom >= 200}
              >
                <MagnifyingGlassPlusIcon className="h-5 w-5 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(100);
                  setScrollPos({ x: 0, y: 0 });
                }}
                className="p-2 rounded-md cursor-pointer backdrop-blur-sm transition-all bg-black/50 hover:bg-black/70"
                title="Reset zoom"
              >
                <ArrowPathIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewOpen(false);
                setZoom(100);
                setScrollPos({ x: 0, y: 0 });
              }}
              className={`absolute top-4 right-4 p-2 rounded-md bg-white/80 backdrop-blur-md transition-all cursor-pointer hover:bg-white`}
              title="Close preview"
            >
              <XMarkIcon className="h-6 w-6 text-neutral-900" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkDetail;
