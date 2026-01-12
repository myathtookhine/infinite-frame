import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ConfigManager from '../components/ConfigManager';
import ArtistSelector from '../components/ArtistSelector';

const Categories = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState('');
  
  // Super Admin: View Only
  // Others: CRUD
  const isReadOnly = user?.role === 'super_admin';

  const textColor = isDark ? 'text-white' : 'text-black';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Categories</h1>
        <p className={`${subtextColor} font-sans`}>
          {isReadOnly 
            ? "View categories created by artists." 
            : "Manage your artwork categories (e.g., Painting, Photography)."}
        </p>
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
      />
    </div>
  );
};

export default Categories;
