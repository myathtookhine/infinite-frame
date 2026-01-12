import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  PaintBrushIcon,
  SparklesIcon,
  VariableIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  PencilSquareIcon,
  FolderPlusIcon,
  TagIcon
} from '@heroicons/react/24/outline';

// Use the same base as AuthContext
const API_BASE_URL = 'http://localhost:5000/api/attributes';

const ConfigManager = ({ type, title, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { id, name }
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDark } = useTheme();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/${type}`);
      setItems(response.data);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setLoading(true);
    const config = { headers: { 'x-admin-id': user.id } };

    try {
      if (editingItem) {
        // UPDATE (PUT)
        const response = await axios.put(`${API_BASE_URL}/${editingItem.id}`, { name: newItemName }, config);
        setItems(items.map(item => item.id === editingItem.id ? response.data : item));
        setIsModalOpen(false);
        setEditingItem(null);
        setNewItemName('');
      } else {
        // CREATE (POST)
        const response = await axios.post(`${API_BASE_URL}`, { type, name: newItemName }, config);
        setItems([...items, response.data]);
        setNewItemName('');
        setIsModalOpen(false);
      }
      onRefresh && onRefresh(); // Refresh parent if needed
    } catch (err) {
      console.error(`Error saving ${type}:`, err);
      setError(err.response?.data?.message || `Failed to save ${title}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item) => {
    setError('');
    setEditingItem(item);
    setNewItemName(item.name);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setError('');
    setEditingItem(null);
    setNewItemName('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    const config = { headers: { 'x-admin-id': user.id } };

    try {
      await axios.delete(`${API_BASE_URL}/${id}`, config);
      setItems(items.filter(item => item.id !== id));
      onRefresh && onRefresh();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert(err.response?.data?.message || `Failed to delete item`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const inputBg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <TagIcon className={`h-6 w-6 ${textColor}`} />
          </div>
          <div className="min-w-0">
            <h2 className={`text-xl sm:text-2xl font-sans font-bold ${textColor} truncate`}>{title}</h2>
            <p className={`text-sm ${subtextColor} truncate`}>
              {isSuperAdmin ? `Manage ${title} options` : `View available ${title} options`}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openAddModal}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-md font-sans font-bold text-sm cursor-pointer transition-all duration-300 ${isDark
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-black text-white hover:bg-gray-800'
              }`}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="whitespace-nowrap">Add Item</span>
          </button>
        )}
      </div>

      <div className="w-full">
        {/* List Entries */}
        <div className="w-full">
          <div className="mb-6 relative">
            <MagnifyingGlassIcon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${subtextColor}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className={`w-full pl-12 pr-4 py-3 rounded-md border-2 ${borderColor} ${inputBg} ${textColor} focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all font-sans text-sm`}
            />
          </div>

          <div className="space-y-3">
            {loading && items.length === 0 ? (
              <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
                <div className={`w-8 h-8 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
                <p className={subtextColor}>Loading items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
                  <p className={subtextColor}>No items found for {title}.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 ${borderColor} ${cardBg} hover:shadow-md transition-all group animate-in fade-in slide-in-from-left-2 duration-300`}
                >
                  <div className="min-w-0 flex-1">
                    <span className={`text-sm sm:text-base font-sans font-semibold ${textColor} block truncate`}>
                      {item.name}
                    </span>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 sm:gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(item)}
                        className={`p-2.5 rounded-lg transition-all cursor-pointer ${isDark ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'
                          }`}
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`p-2.5 rounded-lg transition-all cursor-pointer ${isDark ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-black/5'
                          }`}
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-md p-8 rounded-2xl border-2 ${borderColor} ${cardBg} shadow-2xl animate-in fade-in zoom-in duration-300`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-sans font-bold ${textColor}`}>
                {editingItem ? `Edit ${editingItem.name}` : `Add New to ${title}`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`p-1 rounded-md cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'} transition-colors`}
              >
                <XMarkIcon className={`h-6 w-6 ${subtextColor}`} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-xs font-sans font-bold uppercase tracking-widest mb-2 ${subtextColor}`}>Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter name`}
                  className={`w-full px-4 py-3 rounded-md border-2 ${borderColor} ${inputBg} ${textColor} focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all font-sans text-sm`}
                />
              </div>
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
                  disabled={loading || !newItemName.trim()}
                  className={`flex-1 py-3 rounded-md flex items-center justify-center gap-2 font-sans font-bold text-sm cursor-pointer transition-all duration-300 ${
                    isDark 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-black text-white hover:bg-gray-800'
                  } disabled:opacity-50`}
                >
                  {editingItem ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  {editingItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const [types, setTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  // New Type Modal State
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeFirstItem, setNewTypeFirstItem] = useState('');
  const [createError, setCreateError] = useState('');

  const fetchTypes = async (shouldSelectLast = false) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/types`);
      const fetchedTypes = response.data;
      setTypes(fetchedTypes);

      // Initial Load Logic: Select first if nothing selected
      if (!activeTab && fetchedTypes.length > 0) {
        setActiveTab(fetchedTypes[0]);
      }
      return fetchedTypes;
    } catch (err) {
      console.error('Error fetching types:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim() || !newTypeFirstItem.trim()) {
      setCreateError("Both Group Name and the First Item are required.");
      return;
    }

    const config = { headers: { 'x-admin-id': user.id } };

    try {
      // 1. Create
      await axios.post(`${API_BASE_URL}`, {
        type: newTypeName,
        name: newTypeFirstItem
      }, config);

      // 2. Refresh List
      const response = await axios.get(`${API_BASE_URL}/types`);
      setTypes(response.data);

      // 3. Switch Tab to New One
      setActiveTab(newTypeName);

      // 4. Reset Form
      setIsNewTypeModalOpen(false);
      setNewTypeName('');
      setNewTypeFirstItem('');
      setCreateError('');
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || "Failed to create group.");
    }
  };

  const sidebarBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Attribute Settings</h1>
          <p className={`${subtextColor} font-sans`}>Configure master data and attributes for artworks.</p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsNewTypeModalOpen(true)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-sans font-bold text-sm cursor-pointer transition-all ${isDark
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-black text-white hover:bg-gray-800'
              }`}
          >
            <FolderPlusIcon className="h-5 w-5" />
            <span>New Attribute Group</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 flex-wrap">
        {/* Dynamic Sidebar/Tabs */}
        <div className="flex flex-wrap gap-2 pb-4 mb-6 -mx-4 px-4 no-scrollbar md:mx-0 md:px-0 md:flex-col md:w-64 md:space-y-1 md:pb-0 md:mb-0 scroll-smooth">
          {types.length === 0 && !loading && (
            <div className={`p-4 text-xs ${subtextColor} text-center border-2 border-dashed ${borderColor} rounded-md`}>
              No categories found. Create one to get started.
            </div>
          )}

          {types.map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl font-sans text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] md:min-w-0 cursor-pointer border ${
                activeTab === type
                  ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                  : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-black/5')
              }`}
            >
              {/* Used generic icon for all dynamic types */}
              <TagIcon className="h-5 w-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{type}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab ? (
            <ConfigManager 
              key={activeTab}
              type={activeTab}
              title={activeTab}
              onRefresh={fetchTypes}
            />
          ) : (
            !loading && (
              <div className={`flex flex-col items-center justify-center h-64 border-2 border-dashed ${borderColor} rounded-2xl`}>
                <ArchiveBoxIcon className={`h-12 w-12 mb-4 ${subtextColor}`} />
                <p className={subtextColor}>Select a category or create a new one.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Super Admin: Create New Attribute Type Modal */}
      {isNewTypeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewTypeModalOpen(false)}></div>
          <div className={`relative w-full max-w-md p-8 rounded-2xl border-2 ${borderColor} ${cardBg} shadow-2xl animate-in fade-in zoom-in duration-300`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-sans font-bold ${textColor}`}>
                New Attribute Group
              </h3>
              <button
                onClick={() => setIsNewTypeModalOpen(false)}
                className={`p-1 rounded-md cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'} transition-colors`}
              >
                <XMarkIcon className={`h-6 w-6 ${subtextColor}`} />
              </button>
            </div>

            <form onSubmit={handleCreateType} className="space-y-5">
              <p className={`text-sm ${subtextColor}`}>
                Create a new category grouping (e.g., "Materials", "Framing").
                You must add at least one item to initialize it.
              </p>

              {/* Group Name */}
              <div>
                <label className={`block text-xs font-sans font-bold uppercase tracking-widest mb-2 ${subtextColor}`}>Group Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Materials"
                  className={`w-full px-4 py-3 rounded-md border-2 ${borderColor} ${inputBg} ${textColor} focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all font-sans text-sm`}
                />
              </div>

              {/* First Item */}
              <div>
                <label className={`block text-xs font-sans font-bold uppercase tracking-widest mb-2 ${subtextColor}`}>First Item Name</label>
                <input
                  type="text"
                  value={newTypeFirstItem}
                  onChange={(e) => setNewTypeFirstItem(e.target.value)}
                  placeholder="e.g. Wood"
                  className={`w-full px-4 py-3 rounded-md border-2 ${borderColor} ${inputBg} ${textColor} focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all font-sans text-sm`}
                />
              </div>

              {createError && <p className="text-red-500 text-xs">{createError}</p>}

              <button
                type="submit"
                disabled={!newTypeName.trim() || !newTypeFirstItem.trim()}
                className={`w-full py-3 rounded-md flex items-center justify-center gap-2 font-sans font-bold text-sm cursor-pointer transition-all duration-300 ${isDark
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-black text-white hover:bg-gray-800'
                  } disabled:opacity-50`}
              >
                <PlusIcon className="h-4 w-4" />
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
