import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PhotoIcon, XMarkIcon, EyeIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ImageCropperModal from './ImageCropperModal';

const MultipleImageUploader = ({ images, onImagesChange, label = "Additional Images" }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImages, setTempImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-300';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

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
    validateAndProcessFiles(files);
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    validateAndProcessFiles(files);
    // Reset input value so same files can be selected again
    e.target.value = '';
  };

  const validateAndProcessFiles = (files) => {
    const validatedFiles = [];
    
    const processFile = (file, index) => {
      return new Promise((resolve) => {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          resolve({ valid: false, reason: 'type' });
          return;
        }

        // Check file size (max 8MB)
        const maxSize = 8 * 1024 * 1024;
        if (file.size > maxSize) {
          resolve({ valid: false, reason: 'size' });
          return;
        }

        // Check dimensions
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          if (img.width < 1200) {
            URL.revokeObjectURL(objectUrl);
            resolve({ valid: false, reason: 'dimensions' });
            return;
          }

          // Valid image
          validatedFiles.push({
            url: objectUrl,
            file: file,
            index: index
          });
          resolve({ valid: true });
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({ valid: false, reason: 'load' });
        };

        img.src = objectUrl;
      });
    };

    Promise.all(files.map((file, index) => processFile(file, index)))
      .then((results) => {
        const errorCount = results.filter(r => !r.valid).length;
        
        if (validatedFiles.length > 0) {
          // Start cropping process
          setTempImages(validatedFiles);
          setCurrentCropIndex(0);
          setCropperOpen(true);
        }
        
        if (errorCount > 0) {
          alert(`${errorCount} image(s) were rejected. Images must be JPEG/PNG/WebP, at least 1200px wide, and under 8MB.`);
        }
      });
  };

  const handleCropComplete = (croppedImage) => {
    const tempImage = tempImages[currentCropIndex];
    const newImage = {
      id: `img-${Date.now()}-${tempImage.index}`,
      url: croppedImage.url,
      file: tempImage.file,
      croppedBlob: croppedImage.blob
    };

    onImagesChange([...images, newImage]);

    // Move to next image or close
    if (currentCropIndex < tempImages.length - 1) {
      setCurrentCropIndex(currentCropIndex + 1);
    } else {
      // All done
      tempImages.forEach(img => URL.revokeObjectURL(img.url));
      setTempImages([]);
      setCurrentCropIndex(0);
      setCropperOpen(false);
    }
  };

  const handleCropperClose = () => {
    // Cleanup temp images
    tempImages.forEach(img => URL.revokeObjectURL(img.url));
    setTempImages([]);
    setCurrentCropIndex(0);
    setCropperOpen(false);
  };

  const removeImage = (imageId) => {
    const filtered = images.filter(img => img.id !== imageId);
    onImagesChange(filtered);
  };

  return (
    <div>
      <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
        {label} (Optional)
      </label>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <PhotoIcon className={`h-10 w-10 mx-auto mb-3 ${subtextColor}`} />
        <p className={`text-sm font-sans font-medium ${textColor} mb-1`}>
          Drop additional images here or click to upload
        </p>
        <p className={`text-xs ${subtextColor}`}>
          JPEG, PNG, WebP • Min width: 1200px • Max 8MB each • Multiple files supported
        </p>
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative rounded-lg overflow-hidden border-2 ${borderColor} transition-all`}
            >
              {/* Image */}
              <div className="aspect-square">
                <img
                  src={image.url}
                  alt={`Additional ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-2">
                {/* Preview Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(image.url);
                    setPreviewOpen(true);
                  }}
                  className="p-3 rounded transition-all backdrop-blur-sm cursor-pointer"
                  title="Preview image"
                >
                  <EyeIcon className="h-4 w-4 text-white" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="p-3 rounded transition-all backdrop-blur-sm cursor-pointer"
                  title="Remove image"
                >
                  <XMarkIcon className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Image Number */}
              <div className="absolute bottom-2 left-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  isDark ? 'bg-black/70 text-white backdrop-blur-sm' : 'bg-white/70 text-gray-700 backdrop-blur-sm'
                }`}>
                  #{index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className={`text-xs ${subtextColor} mt-2`}>
          {images.length} additional image{images.length !== 1 ? 's' : ''} uploaded
        </p>
      )}

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={handleCropperClose}
        imageSrc={tempImages[currentCropIndex]?.url}
        onCropComplete={handleCropComplete}
      />

      {/* Preview Modal */}
      {previewOpen && previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => {
              if (!hasDragged) {
                setPreviewOpen(false);
                setPreviewImage(null);
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
              msOverflowStyle: 'none'
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
          >
            <img
              src={previewImage}
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
                setPreviewImage(null);
                setZoom(100);
                setScrollPos({ x: 0, y: 0 });
              }}
              className={`absolute top-4 right-4 p-2 rounded-md cursor-pointer backdrop-blur-sm transition-all`}
              title="Close preview"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUploader;
