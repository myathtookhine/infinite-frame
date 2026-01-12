import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ConfigManager from '../components/ConfigManager';
import ArtistSelector from '../components/ArtistSelector';
import { PlusIcon } from '@heroicons/react/24/outline';

const Categories = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState('');
  const openAddModalRef = useRef(null);
  
  // Super Admin: View Only
  // Others: CRUD
  const isReadOnly = user?.role === 'super_admin';

  const textColor = isDark ? 'text-white' : 'text-black';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header with Add Button */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Categories</h1>
          <p className={`${subtextColor} font-sans`}>
            {isReadOnly
              ? "View categories created by artists."
              : "Manage your artwork categories (e.g., Painting, Photography)."}
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => openAddModalRef.current && openAddModalRef.current()}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-md font-sans font-bold text-sm cursor-pointer transition-all duration-300 ${isDark
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black text-white hover:bg-gray-800'
              }`}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="whitespace-nowrap">Add Item</span>
          </button>
        )}
      </div>

      {isReadOnly && (
        <ArtistSelector 
          onSelect={setSelectedArtist} 
          selectedId={selectedArtist} 
        />
      )}

      <ConfigManager 
        key={selectedArtist} // Remount to refresh
        type="Category" 
        title="Categories" 
        isReadOnly={isReadOnly}
        targetUserId={selectedArtist}
        hideHeader={true}
        renderAddButton={(openModal) => { openAddModalRef.current = openModal; }}
      />
    </div>
  );
};

export default Categories;
