import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

import { ENDPOINTS } from '../config';
import Input from './ui/Input';
import Button from './ui/Button';

const ConfigManager = ({ type, title, isReadOnly = false, onRefresh, targetUserId, hideHeader = false, renderAddButton }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { id, name }
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDark } = useTheme();
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    const isSuperAdmin = user?.role === 'super_admin';
    const config = { 
        headers: { 'x-admin-id': user.id },
      params: {
        target_user_id: targetUserId ? targetUserId : (isSuperAdmin ? 'all' : undefined)
      }
    }; 

    try {
      const response = await axios.get(`${ENDPOINTS.ATTRIBUTES}/${type}`, config);
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
        const response = await axios.put(`${ENDPOINTS.ATTRIBUTES}/${editingItem.id}`, { name: newItemName }, config);
        setItems(items.map(item => item.id === editingItem.id ? response.data : item));
        setIsModalOpen(false);
        setEditingItem(null);
        setNewItemName('');
      } else {
        // CREATE (POST)
        const response = await axios.post(ENDPOINTS.ATTRIBUTES, { type, name: newItemName }, config);
        setItems([...items, response.data]);
        setNewItemName('');
        setIsModalOpen(false);
      }
      onRefresh && onRefresh(); 
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
      await axios.delete(`${ENDPOINTS.ATTRIBUTES}/${id}`, config);
      setItems(items.filter(item => item.id !== id));
      onRefresh && onRefresh();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert(err.response?.data?.message || `Failed to delete item`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    // Optimistic Update (Optional, but UI feels faster) - Let's do normal api wait for safety
    // setLoading(true); // Maybe don't block whole UI for toggle, just local loading? 
    // We already have global loading. Let's just do it.

    const config = { headers: { 'x-admin-id': user.id } };
    const newStatus = !item.is_active;

    try {
      const response = await axios.put(`${ENDPOINTS.ATTRIBUTES}/${item.id}`, { 
            is_active: newStatus 
        }, config);
        
        // Update Local State
        setItems(items.map(i => i.id === item.id ? { ...i, is_active: response.data.is_active } : i));
        
    } catch (err) {
        console.error("Failed to toggle status", err);
        alert("Failed to update status");
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

  // Expose openAddModal for external button
  const addButton = !isReadOnly && (
    <Button
      onClick={openAddModal}
      className="w-full sm:w-auto flex items-center justify-center gap-2"
      variant="secondary"
    >
      <PlusIcon className="h-4 w-4" />
      <span className="whitespace-nowrap">Add New</span>
    </Button>
  );

  // Call renderAddButton callback if provided
  if (renderAddButton && !isReadOnly) {
    renderAddButton(openAddModal);
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h2 className={`text-xl sm:text-2xl font-sans font-bold ${textColor} truncate`}>{title}</h2>
              <p className={`text-sm ${subtextColor} truncate`}>
                {isReadOnly ? `View available ${title} options` : `Manage ${title} options`}
              </p>
            </div>
          </div>

          {addButton}
        </div>
      )}

      <div className="w-full">
        {/* List Entries */}
        <div className="w-full">
          {/* <div className="mb-6">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              icon={MagnifyingGlassIcon}
              containerClassName=""
            />
          </div> */}

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
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    <span className={`text-sm sm:text-base font-sans font-semibold ${textColor} block truncate ${!item.is_active ? 'opacity-50 line-through decoration-2' : ''}`}>
                      {item.name}
                    </span>
                    {!item.is_active && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Disabled</span>}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                      {/* Status Switch - Visible to All, Interactive only if !isReadOnly */}
                      <button
                        onClick={() => !isReadOnly && handleToggleStatus(item)}
                        disabled={isReadOnly}
                        title={isReadOnly ? (item.is_active ? "Active" : "Disabled") : (item.is_active ? "Click to Disable" : "Click to Enable")}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none me-2 ${
                          isReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer'
                        } ${
                          item.is_active 
                            ? (isDark ? 'bg-white' : 'bg-black') 
                            : (isDark ? 'bg-[#262626]' : 'bg-gray-200')
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            item.is_active ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDark && item.is_active ? '!bg-black' : ''}`} 
                        />
                      </button>

                      {!isReadOnly && (
                        <>
                        <Button
                          variant="secondary"
                            onClick={() => openEditModal(item)}
                          className={`p-2 !border-0 ${
                              isDark ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'
                            }`}
                            title="Edit"
                          size="sm"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="secondary"
                            onClick={() => handleDelete(item.id)}
                          className={`p-2 !border-0 ${
                              isDark ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-black/5'
                            }`}
                            title="Delete"
                          size="sm"
                          >
                            <TrashIcon className="h-5 w-5" />
                        </Button>
                        </>
                      )}
                  </div>
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
                label="Name"
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Enter name"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
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
                  disabled={loading || !newItemName.trim()}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {editingItem ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  {editingItem ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigManager;
