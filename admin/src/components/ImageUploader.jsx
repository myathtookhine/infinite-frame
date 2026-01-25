import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PhotoIcon, XMarkIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

const ImageUploader = ({ images, onImagesChange, onSetMain }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-300';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';
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
    handleFiles(files);
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    // For mock implementation, create preview URLs
    const newImages = files.map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file: file,
      isMain: images.length ===  0 && index === 0 // First image of first upload is main
    }));

    onImagesChange([...images, ...newImages]);
  };

  const removeImage = (imageId) => {
    const filtered = images.filter(img => img.id !== imageId);
    // If removed image was main and there are other images, make first one main
    if (filtered.length > 0) {
      const removedWasMain = images.find(img => img.id === imageId)?.isMain;
      if (removedWasMain) {
        filtered[0].isMain = true;
      }
    }
    onImagesChange(filtered);
  };

  return (
    <div>
      {/* Upload Area */}
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
          multiple
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <PhotoIcon className={`h-12 w-12 mx-auto mb-4 ${subtextColor}`} />
        <p className={`text-sm font-sans font-medium ${textColor} mb-1`}>
          Drop images here or click to upload
        </p>
        <p className={`text-xs ${subtextColor}`}>
          PNG, JPG (max 5MB each)
        </p>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative rounded-lg overflow-hidden border-2 ${
                image.isMain
                  ? isDark ? 'border-blue-500' : 'border-blue-600'
                  : borderColor
              } transition-all`}
            >
              {/* Image */}
              <div className="aspect-square">
                <img
                  src={image.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Delete Button - Always visible at top-right */}
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

              {/* Main Indicator - Bottom-left with radio icon */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <button
                  type="button"
                  onClick={() => !image.isMain && onSetMain(image.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                    image.isMain
                      ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                      : isDark 
                        ? 'bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm' 
                        : 'bg-white/70 hover:bg-white/90 text-gray-700 backdrop-blur-sm'
                  } ${!image.isMain ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={image.isMain}
                >
                  {/* Radio Check Icon */}
                  <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    image.isMain
                      ? 'border-white bg-white'
                      : isDark ? 'border-white' : 'border-gray-600'
                  }`}>
                    {image.isMain && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <span>Main</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className={`text-xs ${subtextColor} mt-2`}>
          {images.length} image{images.length !== 1 ? 's' : ''} uploaded. 
          {images.some(img => img.isMain) && ' Blue border indicates main image.'}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
