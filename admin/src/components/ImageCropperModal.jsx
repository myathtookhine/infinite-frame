import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Button from './ui/Button';

const ImageCropperModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const { isDark } = useTheme();
  const [crop, setCrop] = useState({
    unit: '%',
    width: 70,
    height: 70,
    x: 15,
    y: 15
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgColor = isDark ? 'bg-[#0A0A0A]' : 'bg-white';
  const overlayBg = isDark ? 'bg-black/80' : 'bg-black/50';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-300';

  useEffect(() => {
    if (isOpen) {
      // Reset crop to default when opening
      setCrop({
        unit: '%',
        width: 70,
        height: 70,
        x: 15,
        y: 15
      });
      setCompletedCrop(null);
    }
  }, [isOpen]);

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(blob => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        blob.name = 'cropped.jpg';
        const croppedUrl = URL.createObjectURL(blob);
        resolve({ blob, url: croppedUrl });
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const croppedWidth = completedCrop.width * scaleX;

    // Validate minimum width
    if (croppedWidth < 1200) {
      alert(`Cropped image width must be at least 1200px. Current: ${Math.round(croppedWidth)}px`);
      return;
    }

    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`}>
      <div className={`${bgColor} rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-6 border-b ${borderColor}`}>
          <h2 className={`text-2xl font-sans font-bold ${textColor}`}>
            Crop Image
          </h2>
          <p className={`text-sm mt-1 ${subtextColor}`}>
            Adjust the crop area for your artwork
          </p>
        </div>

        {/* Crop Area */}
        <div className="p-6 flex justify-center">
          {crop.width && crop.height ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop"
                style={{ maxWidth: '100%', maxHeight: '60vh' }}
              />
            </ReactCrop>
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className={`text-sm ${subtextColor}`}>Loading...</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`p-6 border-t ${borderColor} flex gap-3 justify-end`}>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!completedCrop}
          >
            Save Crop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
