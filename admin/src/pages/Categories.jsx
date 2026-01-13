import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ENDPOINTS } from '../config';
import ArtistSelector from '../components/ArtistSelector';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PencilSquareIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Input from '../components/ui/Input';

const Categories = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  
  // Super Admin: View Only
  // Others: CRUD
  const isSuperAdmin = user?.role === 'super_admin';
  const isReadOnly = isSuperAdmin;

  const textColor = isDark ? 'text-white' : 'text-black';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';

  const fetchCategories = async () => {
    setLoading(true);
    const config = {
      headers: { 'x-admin-id': user.id },
      params: {
        target_user_id: selectedArtist ? selectedArtist : (isSuperAdmin ? 'all' : undefined)
      }
    };

    try {
      const response = await axios.get(ENDPOINTS.CATEGORIES, config);
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtist]);

  const openAddModal = () => {
    setError('');
    setEditingCategory(null);
    setCategoryName('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setError('');
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setLoading(true);
    const config = { headers: { 'x-admin-id': user.id } };

    try {
      if (editingCategory) {
        const response = await axios.put(`${ENDPOINTS.CATEGORIES}/${editingCategory.id}`, { name: categoryName }, config);
        setCategories(categories.map(cat => cat.id === editingCategory.id ? response.data : cat));
      } else {
        const response = await axios.post(ENDPOINTS.CATEGORIES, { name: categoryName }, config);
        setCategories([...categories, response.data]);
      }
      setIsModalOpen(false);
      setCategoryName('');
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

    try {
      await axios.delete(`${ENDPOINTS.CATEGORIES}/${id}`, config);
      setCategories(categories.filter(cat => cat.id !== id));
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

    try {
      const response = await axios.put(`${ENDPOINTS.CATEGORIES}/${category.id}`, {
        is_active: newStatus
      }, config);

      setCategories(categories.map(cat => cat.id === category.id ? { ...cat, is_active: response.data.is_active } : cat));
    } catch (err) {
      console.error("Failed to toggle status", err);
      alert("Failed to update status");
    }
  };

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
            onClick={openAddModal}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-md font-sans font-bold text-sm cursor-pointer transition-all duration-300 ${isDark
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black text-white hover:bg-gray-800'
              }`}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="whitespace-nowrap">Add Category</span>
          </button>
        )}
      </div>

      {isSuperAdmin && (
        <ArtistSelector
          onSelect={setSelectedArtist}
          selectedId={selectedArtist}
        />
      )}

      {/* Categories List */}
      <div className="space-y-3">
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
                <TagIcon className={`h-5 w-5 flex-shrink-0 ${textColor}`} />
                <span className={`text-sm sm:text-base font-sans font-semibold ${textColor} block truncate ${!category.is_active ? 'opacity-50 line-through decoration-2' : ''}`}>
                  {category.name}
                </span>
                {!category.is_active && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Disabled</span>}
                {category.owner_name && <span className={`text-xs ${subtextColor}`}>by {category.owner_name}</span>}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => !isReadOnly && handleToggleStatus(category)}
                  disabled={isReadOnly}
                  title={isReadOnly ? (category.is_active ? "Active" : "Disabled") : (category.is_active ? "Click to Disable" : "Click to Enable")}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer'
                    } ${category.is_active
                      ? (isDark ? 'bg-white' : 'bg-black')
                      : (isDark ? 'bg-[#262626]' : 'bg-gray-200')
                    }`}
                >
                  <span
                    aria-hidden="true"
                    className={`${category.is_active ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDark && category.is_active ? '!bg-black' : ''}`}
                  />
                </button>

                {!isReadOnly && (
                  <>
                    <button
                      onClick={() => openEditModal(category)}
                      className={`p-2.5 rounded-lg transition-all cursor-pointer ${isDark ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'
                        }`}
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className={`p-2.5 rounded-lg transition-all cursor-pointer ${isDark ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-black/5'
                        }`}
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </>
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
          <div className={`relative w-full max-w-md p-8 rounded-2xl border-2 ${borderColor} ${cardBg} shadow-2xl animate-in fade-in zoom-in duration-300`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-sans font-bold ${textColor}`}>
                {editingCategory ? `Edit ${editingCategory.name}` : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1 rounded-md cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'} transition-colors`}
              >
                <XMarkIcon className={`h-6 w-6 ${subtextColor}`} />
              </button>
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
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-3 rounded-md font-sans font-bold text-sm border-2 ${borderColor} ${textColor} cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !categoryName.trim()}
                  className={`flex-1 py-3 rounded-md flex items-center justify-center gap-2 font-sans font-bold text-sm cursor-pointer transition-all duration-300 ${isDark
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                >
                  {editingCategory ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  {editingCategory ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

