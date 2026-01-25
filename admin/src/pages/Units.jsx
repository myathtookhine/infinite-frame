import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ENDPOINTS } from '../config';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PencilSquareIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Units = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitName, setUnitName] = useState('');
  const [unitSymbol, setUnitSymbol] = useState('');
  const [error, setError] = useState('');
  
  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#141414]' : 'bg-white';

  const fetchUnits = async () => {
    setLoading(true);
    const config = {
      headers: { 'x-admin-id': user.id }
    };

    try {
      const response = await axios.get(ENDPOINTS.UNITS, config);
      setUnits(response.data);
    } catch (err) {
      console.error('Error fetching units:', err);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setError('');
    setEditingUnit(null);
    setUnitName('');
    setUnitSymbol('');
    setIsModalOpen(true);
  };

  const openEditModal = (unit) => {
    setError('');
    setEditingUnit(unit);
    setUnitName(unit.name);
    setUnitSymbol(unit.symbol);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitName.trim() || !unitSymbol.trim()) return;

    setLoading(true);
    const config = { headers: { 'x-admin-id': user.id } };

    try {
      if (editingUnit) {
        const response = await axios.put(`${ENDPOINTS.UNITS}/${editingUnit.id}`, { 
          name: unitName, 
          symbol: unitSymbol 
        }, config);
        setUnits(units.map(unit => unit.id === editingUnit.id ? response.data : unit));
      } else {
        const response = await axios.post(ENDPOINTS.UNITS, { 
          name: unitName, 
          symbol: unitSymbol 
        }, config);
        setUnits([...units, response.data]);
      }
      setIsModalOpen(false);
      setUnitName('');
      setUnitSymbol('');
      setEditingUnit(null);
    } catch (err) {
      console.error('Error saving unit:', err);
      setError(err.response?.data?.message || 'Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;

    setLoading(true);
    const config = { headers: { 'x-admin-id': user.id } };

    try {
      await axios.delete(`${ENDPOINTS.UNITS}/${id}`, config);
      setUnits(units.filter(unit => unit.id !== id));
    } catch (err) {
      console.error('Error deleting unit:', err);
      alert(err.response?.data?.message || 'Failed to delete unit');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (unit) => {
    const config = { headers: { 'x-admin-id': user.id } };
    const newStatus = !unit.is_active;

    try {
      const response = await axios.put(`${ENDPOINTS.UNITS}/${unit.id}`, {
        is_active: newStatus
      }, config);

      setUnits(units.map(u => u.id === unit.id ? { ...u, is_active: response.data.is_active } : u));
    } catch (err) {
      console.error("Failed to toggle status", err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header with Add Button */}
      <div className="mb-4 lg:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Units</h1>
          <p className={`${subtextColor} font-sans`}>
            Manage measurement units for artwork dimensions (e.g., cm, inch, meter).
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="w-full md:w-auto flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="whitespace-nowrap">Add Unit</span>
        </Button>
      </div>

      {/* Units List */}
      <div className="space-y-3">
        {loading && units.length === 0 ? (
          <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
            <div className={`w-8 h-8 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
            <p className={subtextColor}>Loading units...</p>
          </div>
        ) : units.length === 0 ? (
          <div className={`rounded-xl border-2 ${borderColor} ${cardBg} p-12 text-center`}>
            <p className={subtextColor}>No units found. Create one to get started.</p>
          </div>
        ) : (
          units.map((unit) => (
            <div
              key={unit.id}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 ${borderColor} ${cardBg} hover:shadow-md transition-all group animate-in fade-in slide-in-from-left-2 duration-300`}
            >
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <ScaleIcon className={`h-5 w-5 flex-shrink-0 ${textColor}`} />
                <div>
                  <span className={`text-sm sm:text-base font-sans font-semibold ${textColor} block ${!unit.is_active ? 'opacity-50 line-through decoration-2' : ''}`}>
                    {unit.name}
                  </span>
                  <span className={`text-xs ${subtextColor}`}>Symbol: {unit.symbol}</span>
                </div>
                {!unit.is_active && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Disabled</span>}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(unit)}
                  className={`p-2 !border-0 ${isDark ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'
                    }`}
                  title="Edit"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDelete(unit.id)}
                  className={`p-2 !border-0 ${isDark ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-black/5'
                    }`}
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
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
                {editingUnit ? `Edit ${editingUnit.name}` : 'Add New Unit'}
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
                label="Unit Name"
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g. Centimeter, Inch, Meter"
              />
              
              <div>
                <Input
                  label="Unit Symbol"
                  type="text"
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                  placeholder="e.g. cm, in, m"
                />
                <p className={`text-xs ${subtextColor} mt-1`}>Short abbreviation for display</p>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}
              
              {editingUnit && (
                <div className="space-y-4 mt-4">
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${textColor}`}>
                      Status
                      <p className={`text-xs ${subtextColor} font-normal`}>
                        {editingUnit.is_active ? 'Currently Active' : 'Currently Disabled'}
                      </p>
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const newStatus = !editingUnit.is_active;
                        await handleToggleStatus(editingUnit);
                        setEditingUnit({ ...editingUnit, is_active: newStatus });
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editingUnit.is_active
                        ? (isDark ? 'bg-white' : 'bg-[#151416]')
                        : (isDark ? 'bg-[#262626]' : 'bg-gray-200')
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${editingUnit.is_active ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDark && editingUnit.is_active ? '!bg-black' : ''}`}
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
                  disabled={loading || !unitName.trim() || !unitSymbol.trim()}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {editingUnit ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  {editingUnit ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Units;
