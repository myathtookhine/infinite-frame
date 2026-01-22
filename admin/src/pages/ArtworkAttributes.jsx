import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ConfigManager from '../components/ConfigManager';
import ArtistSelector from '../components/ArtistSelector';
import { 
  FolderPlusIcon,
  FolderIcon,
  ArchiveBoxIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import { ENDPOINTS } from '../config';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ArtworkAttributes = () => {
  const [types, setTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState(''); // For Super Admin
  const { isDark } = useTheme();
  const { user } = useAuth();

  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isReadOnly = isSuperAdmin; 

  // New Type Modal State
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeFirstItem, setNewTypeFirstItem] = useState('');
  const [createError, setCreateError] = useState('');

  const fetchTypes = async () => {
    setLoading(true);
    const config = { 
      headers: { 'x-admin-id': user.id },
      params: {
        target_user_id: selectedArtist ? selectedArtist : (isSuperAdmin ? 'all' : undefined)
      }
    }; 

    try {
      const response = await axios.get(`${ENDPOINTS.ATTRIBUTES}/types`, config);
      const fetchedTypes = response.data.filter(t => t.type !== 'Category');
      
      setTypes(fetchedTypes);
      
      if (fetchedTypes.length > 0) {
        // If activeTab is not in the new list, switch to first. 
        // Or if simple switch, just reset to first.
        const currentTabExists = fetchedTypes.find(t => t.type === activeTab);
        if (!currentTabExists) {
            setActiveTab(fetchedTypes[0].type);
        }
      } else {
        setActiveTab('');
      }
      return fetchedTypes;
    } catch (err) {
      console.error('Error fetching types:', err);
      setTypes([]);
      setActiveTab('');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtist]); // Refetch when artist changes

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim() || !newTypeFirstItem.trim()) {
       setCreateError("Both Group Name and the First Item are required.");
       return;
    }

    const config = { headers: { 'x-admin-id': user.id } };

    try {
      await axios.post(ENDPOINTS.ATTRIBUTES, { 
        type: newTypeName, 
        name: newTypeFirstItem 
      }, config);
      
      // Refresh
      const response = await axios.get(`${ENDPOINTS.ATTRIBUTES}/types`, config);
      const fetchedTypes = response.data.filter(t => t.type !== 'Category');
      setTypes(fetchedTypes);
      setActiveTab(newTypeName);
      
      setIsNewTypeModalOpen(false);
      setNewTypeName('');
      setNewTypeFirstItem('');
      setCreateError('');
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || "Failed to create group.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Artwork Attributes</h1>
          <p className={`${subtextColor} font-sans`}>
             {isReadOnly 
               ? "View attributes defined by artists." 
               : "Manage your other attributes (Styles, Mediums, etc)."}
          </p>
        </div>
        
        {!isReadOnly && (
          <Button
            onClick={() => setIsNewTypeModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2"
          >
            <FolderPlusIcon className="h-5 w-5" />
            <span>New Attribute Group</span>
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <ArtistSelector 
            onSelect={setSelectedArtist} 
            selectedId={selectedArtist} 
        />
      )}

      <div className="flex flex-col md:flex-row md:gap-8 flex-wrap">
        {/* Dynamic Sidebar/Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 lg:mb-6 -mx-4 px-4 no-scrollbar md:mx-0 md:px-0 md:flex-col md:w-64 md:space-y-1 md:pb-0 md:mb-0 scroll-smooth">
          {/* Loading skeleton for tabs */}
          {loading && (
            <div className="space-y-2 md:space-y-1 w-full">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-14 md:h-16 rounded-xl border-2 ${borderColor} ${cardBg} animate-pulse`}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {types.length === 0 && !loading && (
             <div className={`p-4 text-xs ${subtextColor} text-center border-2 border-dashed ${borderColor} rounded-md`}>
              {isSuperAdmin && !selectedArtist ? "No attributes found in the system." : "No attributes found. Create one."}
             </div>
          )}

          {/* Type tabs */}
          {!loading && types.map((item, idx) => {
             return (
              <button
                key={`${item.type}-${idx}`}
                onClick={() => setActiveTab(item.type)}
                className={`flex flex-col items-start justify-center gap-1 px-4 py-3 md:px-5 md:py-4 rounded-xl font-sans text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] md:min-w-0 cursor-pointer border ${
                  activeTab === item.type
                  ? (isDark ? 'bg-white text-black' : 'bg-[#151416] text-white')
                    : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-black/5')
                }`}
              >
                <div className="flex items-center gap-2">
                   <FolderIcon className="h-4 w-4 flex-shrink-0" />
                   <span>{item.type}</span>
                </div>
              </button>
             );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Loading state for content */}
          {loading ? (
            <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center animate-in fade-in duration-300`}>
              <div className={`w-8 h-8 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
              <p className={subtextColor}>Loading attributes...</p>
            </div>
          ) : activeTab ? (
            <ConfigManager 
              key={`${activeTab}-${selectedArtist}`} // Re-mount when artist changes
              type={activeTab} 
              title={activeTab} 
              isReadOnly={isReadOnly}
              targetUserId={selectedArtist} // Pass down specific filter
              onRefresh={() => fetchTypes()}
            />
            ) : (
                <div className={`flex flex-col items-center justify-center h-64 border-2 border-dashed ${borderColor} rounded-2xl`}>
                  <ArchiveBoxIcon className={`h-12 w-12 mb-4 ${subtextColor}`} />
                  <p className={subtextColor}>Select an attribute type.</p>
                </div>
          )}
        </div>
      </div>

      {/* Access Control: Only Admin can create new groups */}
      {!isReadOnly && isNewTypeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewTypeModalOpen(false)}></div>
          <div className={`relative w-full max-w-md p-6 rounded-2xl border-2 ${borderColor} ${cardBg} shadow-2xl animate-in fade-in zoom-in duration-300`}>
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
                 Create a new grouping (e.g., "Materials", "Themes").
               </p>

               {/* Group Name */}
              <Input
                autoFocus
                label="Group Name"
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Materials"
              />

               {/* First Item */}
              <Input
                label="First Item Name"
                type="text"
                value={newTypeFirstItem}
                onChange={(e) => setNewTypeFirstItem(e.target.value)}
                placeholder="e.g. Wood"
              />

              {createError && <p className="text-red-500 text-xs">{createError}</p>}

              <button
                  type="submit"
                  disabled={!newTypeName.trim() || !newTypeFirstItem.trim()}
                  className={`w-full py-3 rounded-md flex items-center justify-center gap-2 font-sans font-bold text-sm cursor-pointer transition-all duration-300 ${
                    isDark 
                      ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-[#151416] text-white hover:bg-[#2a2a2c]'
                  } disabled:opacity-50`}
                >
                  <FolderPlusIcon className="h-4 w-4" />
                  Create Group
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkAttributes;
