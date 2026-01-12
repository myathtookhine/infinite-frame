import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../config';

const ArtistSelector = ({ onSelect, selectedId }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const fetchArtists = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await axios.get(`${ENDPOINTS.ATTRIBUTES}/users`, {
          headers: { 'x-admin-id': user.id } 
        });
        setArtists(response.data);
      } catch (err) {
        console.error("Failed to fetch artists", err);
      } finally {
        setLoading(false);
      }
    };

    // Need access to Auth to get ID for header? 
    // Yes, but let's assume parent sets up axios or we get it from storage for simplicity in this quick fix.
    // Ideally useAuth()
    
    // I will refactor to use useAuth inside.
    fetchArtists();
  }, []);

  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const bg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';

  return (
    <div className={`flex items-center gap-3 p-4 mb-6 rounded-lg border-2 ${borderColor} ${bg}`}>
      <div className={`p-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
        <UserIcon className={`h-5 w-5 ${textColor}`} />
      </div>
      <div className="flex-1">
        <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${subtextColor}`}>
          Select Artist to View
        </label>
        <select
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full bg-transparent font-sans font-semibold text-sm ${textColor} focus:outline-none cursor-pointer`}
          disabled={loading}
        >
          <option value="" className="text-black">-- Select an Artist --</option>
          {artists.map(artist => (
            <option key={artist.id} value={artist.id} className="text-black">
              {artist.username} ({artist.email})
            </option>
          ))}
        </select>
      </div>
      {loading && <div className="text-xs text-blue-500">Loading...</div>}
    </div>
  );
};

export default ArtistSelector;
