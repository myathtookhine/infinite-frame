import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAdminCache } from '../context/AdminCacheContext';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ArtworkListItem from '../components/ArtworkListItem';
import axios from 'axios';
import { ENDPOINTS } from '../config';

const Artworks = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { getCachedData, setCachedData } = useAdminCache();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  // const [selectedAttributeType, setSelectedAttributeType] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [categories, setCategories] = useState([]);
  // const [attributeTypes, setAttributeTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';

  // Fetch artworks and categories on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const worksKey = `artworks_${user.id}`;
    const catsKey = `categories_list_${user.id}`;

    const cachedWorks = getCachedData(worksKey);
    const cachedCats = getCachedData(catsKey);

    if (cachedWorks) setArtworks(cachedWorks.data);
    if (cachedCats) setCategories(cachedCats.data);

    if (!cachedWorks || !cachedCats) {
      setLoading(true);
    } else {
      setLoading(false);
    }

    try {
      // Fetch artworks and categories in parallel
      const [artworksRes, categoriesRes] = await Promise.all([
        axios.get(ENDPOINTS.ARTWORKS, {
          headers: { 'x-admin-id': user.id }
        }),
        axios.get(ENDPOINTS.CATEGORIES, {
          headers: { 'x-admin-id': user.id }
        })
        // Removed attribute types fetching
      ]);

      // Check for changes
      const worksChanged = JSON.stringify(cachedWorks?.data || []) !== JSON.stringify(artworksRes.data);
      const catsChanged = JSON.stringify(cachedCats?.data || []) !== JSON.stringify(categoriesRes.data);

      if (worksChanged) {
        setArtworks(artworksRes.data);
        setCachedData(worksKey, artworksRes.data);
      }
      if (catsChanged) {
        setCategories(categoriesRes.data);
        setCachedData(catsKey, categoriesRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      if (!cachedWorks) alert('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  // Filter artworks (client-side for search, server-side for category would be better)
  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || artwork.category_id === selectedCategory;

    // Removed attribute type filtering
    // const matchesAttributeType = !selectedAttributeType ||
    //   (artwork.attributes && artwork.attributes.some(attr => attr.type === selectedAttributeType));

    return matchesSearch && matchesCategory;
  });

  const handleEdit = (id) => {
    navigate(`/artworks/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      const worksKey = `artworks_${user.id}`;
      try {
        await axios.delete(`${ENDPOINTS.ARTWORKS}/${id}`, {
          headers: { 'x-admin-id': user.id }
        });

        // Remove from local state and update cache
        const newWorks = artworks.filter(a => a.id !== id);
        setArtworks(newWorks);
        setCachedData(worksKey, newWorks);

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-4 lg:mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>
            Artworks
          </h1>
          <p className={`${subtextColor} font-sans`}>
            Manage your artwork inventory
          </p>
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
            disabled={loading}
          />
        </div>

        {/* Category Filter */}
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={loading}
          placeholder="All Categories"
          options={categories.map(category => ({
            value: category.id,
            label: category.name
          }))}
          className="w-full md:w-64"
        />
      </div>

      {/* Artworks List */}
      <div>
        {loading ? (
          <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
            <div className={`w-8 h-8 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
            <p className={subtextColor}>Loading artworks...</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="p-12 text-center">
            <p className={subtextColor}>
                {searchQuery || selectedCategory
                ? 'No artworks match your search criteria.'
                : 'No artworks found. Create one to get started.'}
            </p>
          </div>
        ) : (
              <div>
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
