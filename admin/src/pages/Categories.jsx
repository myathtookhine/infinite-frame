import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAdminCache } from '../context/AdminCacheContext';
import axios from 'axios';
import { ENDPOINTS } from '../config';
import ArtistSelector from '../components/ArtistSelector';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PencilSquareIcon,
  TagIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Categories = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { getCachedData, setCachedData } = useAdminCache();
  const [selectedArtist, setSelectedArtist] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState('');
  
  // Super Admin: Can Edit but Not Delete
  // Others: Full CRUD
  const isSuperAdmin = user?.role === 'super_admin';
  const isReadOnly = false; // Allow super admin to edit

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';

  const fetchCategories = async () => {
    const cacheKey = `categories_${selectedArtist || (isSuperAdmin ? 'all' : 'owner')}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
      setCategories(cached.data);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const config = {
      headers: { 'x-admin-id': user.id },
      params: {
        target_user_id: selectedArtist ? selectedArtist : (isSuperAdmin ? 'all' : undefined)
      }
    };

    try {
      const response = await axios.get(ENDPOINTS.CATEGORIES, config);

      const currentDataStr = JSON.stringify(cached?.data || []);
      const newDataStr = JSON.stringify(response.data);

      if (currentDataStr !== newDataStr) {
        setCategories(response.data);
        setCachedData(cacheKey, response.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (!cached) setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtist]);

  const openAddModal = () => {
    setError('');
    setEditingCategory(null);
    setCategoryName('');
    setSortOrder(0);
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setError('');
    setEditingCategory(category);
    setCategoryName(category.name);
    setSortOrder(category.sort_order || 0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setLoading(true);
    const config = { headers: { 'x-admin-id': user.id } };
    const payload = {
      name: categoryName,
      sort_order: parseInt(sortOrder) || 0
    };

    const cacheKey = `categories_${selectedArtist || (isSuperAdmin ? 'all' : 'owner')}`;

    try {
      if (editingCategory) {
        const response = await axios.put(`${ENDPOINTS.CATEGORIES}/${editingCategory.id}`, payload, config);
        const newCats = categories.map(cat => cat.id === editingCategory.id ? response.data : cat);
        setCategories(newCats);
        setCachedData(cacheKey, newCats);
      } else {
        const response = await axios.post(ENDPOINTS.CATEGORIES, payload, config);
        const newCats = [...categories, response.data].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
        setCategories(newCats);
        setCachedData(cacheKey, newCats);
      }
      setIsModalOpen(false);
      setCategoryName('');
      setSortOrder(0);
      setEditingCategory(null);
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    const config = { headers: { 'x-admin-id': user.id } };
    const cacheKey = `categories_${selectedArtist || (isSuperAdmin ? 'all' : 'owner')}`;

    try {
      await axios.delete(`${ENDPOINTS.CATEGORIES}/${id}`, config);
      const newCats = categories.filter(cat => cat.id !== id);
      setCategories(newCats);
      setCachedData(cacheKey, newCats);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (category) => {
    const config = { headers: { 'x-admin-id': user.id } };
    const newStatus = !category.is_active;
    const cacheKey = `categories_${selectedArtist || (isSuperAdmin ? 'all' : 'owner')}`;

    try {
      const response = await axios.put(`${ENDPOINTS.CATEGORIES}/${category.id}`, {
        is_active: newStatus
      }, config);

      const newCats = categories.map(cat => cat.id === category.id ? { ...cat, is_active: response.data.is_active } : cat);
      setCategories(newCats);
      setCachedData(cacheKey, newCats);
    } catch (err) {
      console.error("Failed to toggle status", err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header with Add Button */}
      <div className="mb-4 lg:mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Categories</h1>
          <p className={`${subtextColor} font-sans`}>
            {isSuperAdmin
              ? "Manage categories for all artists."
              : "Manage your artwork categories (e.g., Painting, Photography)."}
          </p>
        </div>

        {!isSuperAdmin && (
          <Button
            onClick={openAddModal}
            className="hidden md:flex w-auto items-center justify-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="whitespace-nowrap">Add Category</span>
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <ArtistSelector
          onSelect={setSelectedArtist}
          selectedId={selectedArtist}
        />
      )}

      {/* Categories List */}
      <div className="space-y-3 pb-20 md:pb-8 lg:pb-8">
        {loading && categories.length === 0 ? (
          <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
            <div className={`w-8 h-8 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
            <p className={subtextColor}>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
            <p className={subtextColor}>
              {isSuperAdmin && !selectedArtist
                ? "No categories found in the system."
                : "No categories found. Create one."}
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 ${borderColor} ${cardBg} hover:shadow-md transition-all group animate-in fade-in slide-in-from-left-2 duration-300`}
            >
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <ArchiveBoxIcon className={`h-5 w-5 flex-shrink-0 ${textColor}`} />
                <div>
                  <p>
                    <span className={`text-sm sm:text-base font-sans font-semibold ${textColor} block truncate ${!category.is_active ? 'opacity-50 line-through decoration-2' : ''}`}>
                      {category.name}
                    </span>
                  </p>
                  <p><span className={`text-xs ${subtextColor} block mt-0.5`}>
                    Sorting Order : {category.sort_order}
                  </span></p>
                  {category.owner_name && <span className={`text-xs ${subtextColor}`}>by {category.owner_name}</span>}
                </div>
                {!category.is_active && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Disabled</span>}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* Edit button for everyone */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(category)}
                  className={`p-2 !border-0 ${isDark ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'
                    }`}
                  title="Edit"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </Button>

                {/* Delete button only for non-super-admin */}
                {!isSuperAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className={`p-2 !border-0 ${isDark ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-black/5'
                      }`}
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-md p-6 rounded-2xl border-2 ${borderColor} ${cardBg} shadow-2xl animate-in fade-in zoom-in duration-300`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-sans font-bold ${textColor}`}>
                {editingCategory ? `Edit ${editingCategory.name}` : 'Add New Category'}
              </h3>
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                className="p-1 !border-0"
              >
                <XMarkIcon className={`h-6 w-6 ${subtextColor}`} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                autoFocus
                label="Category Name"
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Painting, Sculpture, Photography"
              />

              <Input
                label="Sort Order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                helperText="Lower numbers appear first (e.g. 1, 2, 3)"
              />

              {error && <p className="text-red-500 text-xs">{error}</p>}
              {editingCategory && (
                <div className="space-y-4 mt-4">
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${textColor}`}>
                      Status
                      <p className={`text-xs ${subtextColor} font-normal`}>
                        {editingCategory.is_active ? 'Currently Active' : 'Currently Disabled'}
                      </p>
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const newStatus = !editingCategory.is_active;
                        await handleToggleStatus(editingCategory);
                        setEditingCategory({ ...editingCategory, is_active: newStatus });
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editingCategory.is_active
                        ? (isDark ? 'bg-white' : 'bg-[#151416]')
                        : (isDark ? 'bg-[#262626]' : 'bg-gray-200')
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${editingCategory.is_active ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDark && editingCategory.is_active ? '!bg-black' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !categoryName.trim()}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {editingCategory ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  {editingCategory ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile FAB Button */}
      {!isSuperAdmin && (
        <button
          onClick={openAddModal}
          className="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 rounded-full bg-[#151416] dark:bg-white text-white dark:text-[#151416] shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="text-lg font-semibold">Add New</span>
        </button>
      )}
    </div>
  );
};

export default Categories;

