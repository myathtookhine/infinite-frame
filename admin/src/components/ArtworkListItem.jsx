import { useState, useEffect } from 'react';
import { PencilSquareIcon, TrashIcon, EyeIcon, XMarkIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import Button from './ui/Button';
import ImageNotFound from '../assets/Image-not-found.png';

// Format price helper
const formatPrice = (price, currency = 'MMK') => {
  if (!price) return 'Price not set';
  const formatted = new Intl.NumberFormat('en-US').format(price);
  return `${currency} ${formatted}`;
};

const ArtworkListItem = ({ artwork, onEdit, onDelete }) => {
  const { isDark } = useTheme();
  
  // Preview modal states
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

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-neutral-800' : 'border-neutral-200';

  const mainImage = artwork.main_image;

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

  // Status badge colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return isDark ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-200';
      case 'sold':
        return isDark ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200';
      case 'reserved':
        return isDark ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'private collection':
        return isDark ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div className={`pb-4 mb-4 border-b ${borderColor} flex items-center gap-4`}>
        {/* Artwork Image Thumbnail */}
        <div className="flex-shrink-0 relative">
          <img
            src={mainImage || ImageNotFound}
            alt={artwork.name}
            className="w-20 h-20 object-cover rounded-md"
          />
          {/* Eye Icon Preview Button */}
          {mainImage && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="absolute top-1 left-1 p-2 rounded-md transition-all bg-black/40 backdrop-blur-lg cursor-pointer"
              title="Preview image"
            >
              <EyeIcon className="h-3 w-3 text-white" />
            </button>
          )}
        </div>

        {/* Artwork Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-base sm:text-lg font-sans font-bold ${textColor} truncate`}>
              {artwork.name}
            </h3>

          </div>
          <p className={`text-sm ${subtextColor}`}>
            {formatPrice(artwork.price, artwork.currency)}
          </p>
          {/* {artwork.width && artwork.height && (
            <p className={`text-xs ${subtextColor} mt-1`}>
              {artwork.width} × {artwork.height}
              {artwork.depth && ` × ${artwork.depth}`} {artwork.unit_symbol}
            </p>
          )} */}
          <p className='mt-1'><span className={`text-[8px] uppercase font-bold px-2 py-1 rounded-full border ${getStatusColor(artwork.status)}`}>
            {artwork.status}
          </span></p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(artwork.id)}
            className={`p-2 !border-0 ${isDark ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'}`}
            title="Edit"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDelete(artwork.id)}
            className={`p-2 !border-0 ${isDark ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-black/5'}`}
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && mainImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black backdrop-blur-sm"
            onClick={() => {
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
              src={mainImage}
              alt={artwork.name}
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
              className="absolute top-4 right-4 p-2 rounded-md bg-white/80 backdrop-blur-md transition-all cursor-pointer"
              title="Close preview"
            >
              <XMarkIcon className="h-6 w-6 text-neutral-900" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ArtworkListItem;
