import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ArtworkListItem from '../components/ArtworkListItem';
import axios from 'axios';
import { ENDPOINTS } from '../config';

const Artworks = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const selectBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const selectBorder = isDark ? 'border-[#262626]' : 'border-gray-300';

  // Fetch artworks and categories on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch artworks and categories in parallel
      const [artworksRes, categoriesRes] = await Promise.all([
        axios.get(ENDPOINTS.ARTWORKS, {
          headers: { 'x-admin-id': user.id }
        }),
        axios.get(ENDPOINTS.CATEGORIES, {
          headers: { 'x-admin-id': user.id }
        })
      ]);

      setArtworks(artworksRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  // Filter artworks (client-side for search, server-side for category would be better)
  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || artwork.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (id) => {
    navigate(`/artworks/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      try {
        await axios.delete(`${ENDPOINTS.ARTWORKS}/${id}`, {
          headers: { 'x-admin-id': user.id }
        });

        // Remove from local state
        setArtworks(artworks.filter(a => a.id !== id));
        alert('Artwork deleted successfully');
      } catch (err) {
        console.error('Error deleting artwork:', err);
        alert('Failed to delete artwork');
      }
    }
  };

  const handleAddArtwork = () => {
    navigate('/artworks/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={subtextColor}>Loading artworks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-4 lg:mb-10">
        <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>
          Artworks
        </h1>
        <p className={`${subtextColor} font-sans`}>
          Manage your artwork inventory
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search artworks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={MagnifyingGlassIcon}
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full px-4 py-3 rounded-md border-2 ${selectBorder} ${selectBg} ${textColor} font-sans text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              isDark ? 'focus:ring-white' : 'focus:ring-black'
            } transition-all`}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Artwork Button */}
        <Button
          onClick={handleAddArtwork}
          className="w-full md:w-auto flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="whitespace-nowrap">Add Artwork</span>
        </Button>
      </div>

      {/* Artworks List */}
      <div className={`rounded-xl border-2 ${borderColor} ${cardBg}`}>
        {filteredArtworks.length === 0 ? (
          <div className="p-12 text-center">
            <p className={subtextColor}>
              {searchQuery || selectedCategory
                ? 'No artworks match your search criteria.'
                : 'No artworks found. Create one to get started.'}
            </p>
          </div>
        ) : (
          <div className="px-4 sm:px-6">
            {filteredArtworks.map((artwork) => (
              <ArtworkListItem
                key={artwork.id}
                artwork={artwork}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Artworks;
