import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ImageCropperModal from './ImageCropperModal';

const SingleImageUploader = ({ image, onImageChange, label = "Main Image" }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [tempImageFile, setTempImageFile] = useState(null);

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

          {/* Delete Button */}
          <button
            type="button"
            onClick={removeImage}
            className={`absolute top-2 right-2 p-1.5 rounded-md ${
              isDark ? 'bg-black/70 hover:bg-black/90' : 'bg-white/70 hover:bg-white/90'
            } backdrop-blur-sm transition-all`}
            title="Remove image"
          >
            <XMarkIcon className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </button>

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
    </div>
  );
};

export default SingleImageUploader;
