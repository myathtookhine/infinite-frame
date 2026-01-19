import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ImageCropperModal from './ImageCropperModal';

const MultipleImageUploader = ({ images, onImagesChange, label = "Additional Images" }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImages, setTempImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);

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

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className={`absolute top-2 right-2 p-1.5 rounded-md ${
                  isDark ? 'bg-black/70 hover:bg-black/90' : 'bg-white/70 hover:bg-white/90'
                } backdrop-blur-sm transition-all`}
                title="Remove image"
              >
                <XMarkIcon className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </button>

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
    </div>
  );
};

export default MultipleImageUploader;
