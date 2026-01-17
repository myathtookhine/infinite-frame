import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import Button from './ui/Button';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { PhotoIcon, TrashIcon, CheckIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const BannerUpload = ({ userId, initialBannerUrl, initialEnabled, onUpdate }) => {
  const { isDark } = useTheme();
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl || null);
  const [enabled, setEnabled] = useState(initialEnabled || false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ aspect: 1200 / 630 });
  const [uploading, setUploading] = useState(null); // null | 'uploading' | 'deleting'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const textColor = isDark ? 'text-white' : 'text-black';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const API_URL = import.meta.env.VITE_API_URL;

  // Handle file selection
  const handleFileSelect = (e) => {
    setError('');
    setSuccess('');
    
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setError('Only JPG and PNG files are allowed');
      return;
    }

    // Validate file size (8MB)
    if (file.size > 8 * 1024 * 1024) {
      setError(`File size too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 8MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Validate dimensions
        if (img.width < 1200 || img.height < 630) {
          setError(`Image too small: ${img.width}x${img.height}px. Minimum: 1200x630px`);
          setPreviewUrl(null);
          setSelectedFile(null);
          return;
        }

        setPreviewUrl(event.target.result);
        setSelectedFile(file);
        // Set initial crop area to be immediately visible
        setCrop({
          unit: '%',
          width: 80,
          height: 80,
          x: 10,
          y: 10,
          aspect: 1200 / 630
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading('uploading');
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('banner', selectedFile);
      formData.append('userId', userId);

      const response = await fetch(`${API_URL}/banner/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setBannerUrl(data.banner.banner_image_url);
      setEnabled(data.banner.banner_enabled);
      setSuccess('Banner uploaded successfully!');
      setPreviewUrl(null);
      setSelectedFile(null);
      
      if (onUpdate) onUpdate(data.banner);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your banner image?')) return;

    setUploading('deleting');
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/banner/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && data.message === 'No banner to delete') {
          // Already deleted, just update UI
          setBannerUrl(null);
          setEnabled(false);
          setSuccess('Banner already removed');
        } else {
          throw new Error(data.message || 'Delete failed');
        }
      } else {
        setBannerUrl(null);
        setEnabled(false);
        setSuccess('Banner deleted successfully');
      }
      
      if (onUpdate) onUpdate({ banner_image_url: null, banner_enabled: false });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle enable/disable toggle
  const handleToggle = async (newEnabled) => {
    setUploading('toggling');
    setError('');

    try {
      const response = await fetch(`${API_URL}/banner/toggle/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Toggle failed');
      }

      setEnabled(newEnabled);
      setSuccess(`Banner ${newEnabled ? 'enabled' : 'disabled'} on public gallery`);
      
      if (onUpdate) onUpdate(data.banner);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error/Success Messages */}
      {error && (
        <div className={`border-2 px-4 py-3 text-sm font-sans rounded font-medium ${isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-600 text-red-700'}`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`border-2 px-4 py-3 text-sm font-sans rounded font-medium ${isDark ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-600 text-green-700'}`}>
          {success}
        </div>
      )}

      {/* Skeleton Loading During Upload/Delete */}
      {uploading && (
        <div className="space-y-3">
          <div className={`relative overflow-hidden rounded-md border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`} style={{ aspectRatio: '1200/630' }}>
            {/* Shimmer Background */}
            <div className={`absolute inset-0 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div
                className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{
                  animation: 'shimmer 2s infinite'
                }}
              />
            </div>

            {/* Operation Icon & Message */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {uploading === 'uploading' && (
                <>
                  <ArrowUpTrayIcon className={`h-16 w-16 mb-4 animate-pulse ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-sans ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Uploading banner...
                  </p>
                </>
              )}
              {uploading === 'deleting' && (
                <>
                  <TrashIcon className={`h-16 w-16 mb-4 animate-pulse ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-sans ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Deleting banner...
                  </p>
                </>
              )}
            </div>
          </div>

          <style>{`
            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </div>
      )}

      {/* Current Banner Preview */}
      {bannerUrl && !previewUrl && !uploading && (
        <div className="space-y-3">
          <div className={`relative overflow-hidden rounded-md border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
            <img 
              src={bannerUrl} 
              alt="Current banner" 
              className="w-full h-auto"
              style={{ aspectRatio: '1200/630' }}
            />
          </div>
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <label className={`text-sm font-sans ${textColor}`}>
              Display on public gallery
            </label>
            <button
              onClick={() => handleToggle(!enabled)}
              disabled={uploading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled 
                  ? (isDark ? 'bg-white' : 'bg-black')
                  : (isDark ? 'bg-gray-700' : 'bg-gray-300')
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                } ${isDark && enabled ? 'bg-black' : ''}`}
              />
            </button>
          </div>

          {/* Delete Button */}
          <Button
            onClick={handleDelete}
            variant="secondary"
            size="sm"
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            Delete Banner
          </Button>
        </div>
      )}

      {/* File Upload / Preview  */}
      {(!bannerUrl || previewUrl) && (
        <div>
          {previewUrl ? (
            <div className="space-y-3">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={1200 / 630}
                ruleOfThirds
                className={`max-w-full rounded-md border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}
              >
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full"
                />
              </ReactCrop>

              <div className={`p-3 rounded-md ${isDark ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-100'} border-2`}>
                <p className={`text-xs font-sans ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Adjust the crop area above. Final size will be 1200x630px in WebP format.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  variant="primary"
                  size="md"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  {uploading ? 'Uploading...' : 'Upload Banner'}
                </Button>
                <Button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  variant="secondary"
                  size="md"
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`w-full p-8 border-2 border-dashed rounded-md transition-colors ${
                  isDark 
                    ? 'border-white/20 hover:border-white/40 hover:bg-white/5' 
                    : 'border-black/20 hover:border-black/40 hover:bg-black/5'
                } disabled:opacity-50`}
              >
                <div className="flex flex-col items-center gap-3">
                  <PhotoIcon className={`h-12 w-12 ${subtextColor}`} />
                  <div className={`text-sm font-sans ${textColor}`}>
                    Click to upload banner image
                  </div>
                  <div className={`text-xs font-sans ${subtextColor}`}>
                    JPG or PNG • Max 8MB • Min 1200x630px
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      {!bannerUrl && !previewUrl && (
        <div className={`p-4 rounded-md border-2 ${isDark ? 'bg-gray-900/20 border-gray-800/40' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs font-sans ${subtextColor} leading-relaxed`}>
            Upload a banner image for your public gallery. The image will be converted to WebP format 
            and displayed at 1200x630px. You can enable or disable the banner display after uploading.
          </p>
        </div>
      )}
    </div>
  );
};

export default BannerUpload;
