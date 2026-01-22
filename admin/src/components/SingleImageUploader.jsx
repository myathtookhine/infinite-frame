import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PhotoIcon, XMarkIcon, EyeIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ImageCropperModal from './ImageCropperModal';

const SingleImageUploader = ({ image, onImageChange, label = "Main Image" }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [tempImageFile, setTempImageFile] = useState(null);
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
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-300';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

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
      validateAndProcessFile(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      validateAndProcessFile(files[0]);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const validateAndProcessFile = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Check file size (max 8MB)
    const maxSize = 8 * 1024 * 1024; // 8MB in bytes
    if (file.size > maxSize) {
      alert('File size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    // Check image dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Check minimum width
      if (img.width < 1200) {
        alert('Image width must be at least 1200px. Current width: ' + img.width + 'px');
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // All validations passed - open cropper
      setTempImageSrc(objectUrl);
      setTempImageFile(file);
      setCropperOpen(true);
    };

    img.onerror = () => {
      alert('Failed to load image. Please try another file.');
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const handleCropComplete = (croppedImage) => {
    const newImage = {
      id: `img-${Date.now()}`,
      url: croppedImage.url,
      file: tempImageFile, // Original file
      croppedBlob: croppedImage.blob // Cropped blob for upload
    };
    onImageChange(newImage);
    
    // Cleanup
    if (tempImageSrc) {
      URL.revokeObjectURL(tempImageSrc);
    }
    setTempImageSrc(null);
    setTempImageFile(null);
  };

  const removeImage = () => {
    if (image?.url) {
      URL.revokeObjectURL(image.url);
    }
    onImageChange(null);
  };

  return (
    <div>
      <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
        {label} *
      </label>

      {!image ? (
        /* Upload Area */
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? isDark ? 'border-white bg-white/5' : 'border-black bg-black/5'
              : `${borderColor} ${hoverBg}`
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <PhotoIcon className={`h-12 w-12 mx-auto mb-4 ${subtextColor}`} />
          <p className={`text-sm font-sans font-medium ${textColor} mb-1`}>
            Drop main image here or click to upload
          </p>
          <p className={`text-xs ${subtextColor}`}>
            JPEG, PNG, WebP • Min width: 1200px • Max size: 8MB
          </p>
        </div>
      ) : (
        /* Image Preview */
        <div className={`relative rounded-lg overflow-hidden border-2 ${borderColor}`}>
          <div className="aspect-video">
            <img
              src={image.url}
              alt="Main preview"
              className="w-full h-full object-cover"
            />
          </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-2">
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="p-2 rounded-md bg-white/80 backdrop-blur-md transition-all cursor-pointer"
                title="Preview image"
              >
                <EyeIcon className="h-4 w-4 text-neutral-900" />
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={removeImage}
                className="p-2 rounded-md bg-white/80 backdrop-blur-md transition-all cursor-pointer"
                title="Remove image"
              >
                <XMarkIcon className="h-4 w-4 text-neutral-900" />
              </button>
            </div>

          {/* Main Badge */}
          <div className="absolute bottom-2 left-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              MAIN IMAGE
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          if (tempImageSrc) {
            URL.revokeObjectURL(tempImageSrc);
          }
          setTempImageSrc(null);
          setTempImageFile(null);
        }}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
      />

      {/* Preview Modal */}
      {previewOpen && image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              src={image.url}
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
              className={`absolute top-4 right-4 p-2 rounded-md bg-white/80 backdrop-blur-md transition-all cursor-pointer`}
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

export default SingleImageUploader;
