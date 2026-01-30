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
  const [selectedArtist, setSelectedArtist] = useState('');
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [categories, setCategories] = useState([]);
  // const [attributeTypes, setAttributeTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === 'super_admin';

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';

  // Fetch artworks and categories on mount
  useEffect(() => {
    fetchData();
  }, [selectedArtist]);

  // Reset category filter when artist filter changes to prevent stale hidden filters
  useEffect(() => {
    setSelectedCategory('');
  }, [selectedArtist]);

  // Fetch artists list for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchArtists = async () => {
        try {
          const response = await axios.get(`${ENDPOINTS.ATTRIBUTES}/users`, {
            headers: { 'x-admin-id': user.id }
          });
          setArtists(response.data);
        } catch (err) {
          console.error("Failed to fetch artists", err);
        }
      };
      fetchArtists();
    }
  }, [isSuperAdmin, user.id]);

  const fetchData = async () => {
    const worksKey = `artworks_${user.id}_${selectedArtist || 'all'}`;
    const catsKey = `categories_list_${user.id}_${selectedArtist || 'all'}`;

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
      const targetId = selectedArtist || (isSuperAdmin ? 'all' : undefined);

      // Construct URLs directly to ensure params are passed correctly
      const artworksUrl = `${ENDPOINTS.ARTWORKS}${targetId ? `?target_user_id=${targetId}` : ''}`;
      const categoriesUrl = `${ENDPOINTS.CATEGORIES}${targetId ? `?target_user_id=${targetId}` : ''}`;

      // Fetch artworks and categories in parallel
      const [artworksRes, categoriesRes] = await Promise.all([
        axios.get(artworksUrl, {
          headers: { 'x-admin-id': user.id }
        }),
        axios.get(categoriesUrl, {
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
    // Ignore category filter for Super Admin (since dropdown is hidden)
    const matchesCategory = isSuperAdmin || !selectedCategory || artwork.category_id === selectedCategory;

    // Strict client-side filter for Artist to ensure correctness
    const matchesArtist = !isSuperAdmin || !selectedArtist || artwork.admin_id === selectedArtist;

    // Removed attribute type filtering
    // const matchesAttributeType = !selectedAttributeType ||
    //   (artwork.attributes && artwork.attributes.some(attr => attr.type === selectedAttributeType));

    return matchesSearch && matchesCategory && matchesArtist;
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

        {/* Add Artwork Button - Hidden for Super Admin */}
        {!isSuperAdmin && (
          <Button
            onClick={handleAddArtwork}
            className="hidden md:flex w-auto items-center justify-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="whitespace-nowrap">Add Artwork</span>
          </Button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
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

        {/* Category Filter - Hidden for Super Admin */}
        {!isSuperAdmin ? (
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
        ) : (
          /* Artist Filter for Super Admin */
          <Select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            disabled={loading}
            placeholder="-- All Artists --"
            options={artists.map(artist => ({
              value: artist.id,
              label: `${artist.username} (${artist.email})`
            }))}
            className="w-full md:w-64"
          />
        )}
      </div>

      {/* Artworks List */}
      <div className='pb-18 md:pb-0'>
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
                  : 'No artworks found. Please create one to get started!'}
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

      {/* Mobile FAB Button */}
      {!isSuperAdmin && (
        <button
          onClick={handleAddArtwork}
          className="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 rounded-full bg-[#151416] dark:bg-white text-white dark:text-[#151416] shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="text-lg font-semibold">Add New</span>
        </button>
      )}
    </div>
  );
};

export default Artworks;
