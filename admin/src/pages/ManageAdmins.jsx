import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../config';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  NoSymbolIcon, 
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const { isDark } = useTheme();

  // config required for super admin routes
  const config = {
    headers: { 'x-admin-id': user?.id }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(ENDPOINTS.ADMIN_MANAGEMENT.BASE, config);
      setAdmins(res.data);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(ENDPOINTS.ADMIN_MANAGEMENT.BASE, formData, config);
      setShowModal(false);
      setFormData({ username: '', email: '', password: '' });
      fetchAdmins();
      alert("New Admin Created Successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if(!window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} this user?`)) return;

    try {
      await axios.put(ENDPOINTS.ADMIN_MANAGEMENT.STATUS(id), { status: newStatus }, config);
      fetchAdmins();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This cannot be undone!")) return;
    try {
      await axios.delete(ENDPOINTS.ADMIN_MANAGEMENT.DELETE(id), config);
      fetchAdmins();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const tableHeaderClass = isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600";
  const tableRowClass = isDark ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50";
  const textClass = isDark ? "text-gray-300" : "text-gray-900";
  const modalBg = isDark ? "bg-[#141414] border border-[#262626]" : "bg-white";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-sans font-bold ${isDark ? "text-white" : "text-black"}`}>
            Manage Admins
          </h1>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Create and manage individual artist accounts
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} variant="primary" className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add New Admin
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`${tableHeaderClass} uppercase font-sans text-xs`}>
              <tr>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {admins.length === 0 ? (
                 <tr>
                   <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No admins found. Create one!</td>
                 </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className={tableRowClass}>
                    <td className={`px-6 py-4 font-medium ${textClass}`}>{admin.username}</td>
                    <td className={`px-6 py-4 ${textClass}`}>{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        admin.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${textClass}`}>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       {/* Toggle Status */}
                       <button 
                        onClick={() => toggleStatus(admin.id, admin.status)}
                        title={admin.status === 'active' ? "Suspend User" : "Activate User"}
                        className={`p-1 rounded transition-colors ${
                          admin.status === 'active' 
                            ? "text-orange-500 hover:bg-orange-100" 
                            : "text-green-500 hover:bg-green-100"
                        }`}
                      >
                        {admin.status === 'active' ? <NoSymbolIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
                      </button>

                      {/* Delete */}
                      <button 
                        onClick={() => handleDelete(admin.id)}
                        title="Delete User"
                        className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                      >
                         <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl relative ${modalBg}`}>
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h2 className={`text-xl font-bold mb-6 ${textClass}`}>Create New Admin</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <Input 
                id="new-username"
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Ex: artist_one"
                required
              />
              <Input 
                id="new-email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Ex: artist@example.com"
                required
              />
              <Input 
                id="new-password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Strong Password"
                required
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;
