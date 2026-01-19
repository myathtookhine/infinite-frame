import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  
  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-400';

  const mainImage = artwork.main_image;

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
    <div className={`py-6 border-b ${borderColor} flex items-center gap-4`}>
      {/* Artwork Image Thumbnail */}
      <div className="flex-shrink-0">
        <img
          src={mainImage || ImageNotFound}
          alt={artwork.name}
          className="w-20 h-20 object-cover rounded-md"
        />
      </div>

      {/* Artwork Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-base sm:text-lg font-sans font-bold ${textColor} truncate`}>
            {artwork.name}
          </h3>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(artwork.status)}`}>
            {artwork.status}
          </span>
        </div>
        <p className={`text-sm ${subtextColor}`}>
          {formatPrice(artwork.price, artwork.currency)}
        </p>
        {artwork.width && artwork.height && (
          <p className={`text-xs ${subtextColor} mt-1`}>
            {artwork.width} × {artwork.height}
            {artwork.depth && ` × ${artwork.depth}`} {artwork.unit_symbol}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
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
  );
};

export default ArtworkListItem;
