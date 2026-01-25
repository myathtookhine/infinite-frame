import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../config';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  PlusIcon, 
  TrashIcon, 
  NoSymbolIcon, 
  CheckCircleIcon,
  XMarkIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', isSuperAdmin: false });
  const [resetData, setResetData] = useState({ id: null, password: '' });
  const [errors, setErrors] = useState({});
  
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

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    // Handle checkbox vs text input
    const val = type === 'checkbox' ? checked : value;

    // Clear error
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }

    if (id === 'username') {
      const isValid = /^[a-zA-Z0-9]*$/.test(value);
      if (!isValid) {
        setErrors(prev => ({ ...prev, username: 'Username can only contain letters and numbers.' }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [id]: val }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic Validation
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    // Email is optional now
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await axios.post(ENDPOINTS.ADMIN_MANAGEMENT.BASE, formData, config);
      setShowModal(false);
      resetForm();
      fetchAdmins();
    } catch (err) {
      const msg = err.response?.data?.message?.toLowerCase() || "failed to create admin";
      if (msg.includes('email')) {
        setErrors({ email: err.response.data.message });
      } else if (msg.includes('username')) {
        setErrors({ username: err.response.data.message });
      } else {
        setErrors({ general: err.response?.data?.message || "Failed to create admin" });
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetData.password || resetData.password.length < 8) {
      setErrors({ resetPassword: 'Password must be at least 8 characters' });
      return;
    }

    try {
      await axios.put(ENDPOINTS.ADMIN_MANAGEMENT.RESET_PASSWORD(resetData.id), { newPassword: resetData.password }, config);
      setShowResetModal(false);
      setResetData({ id: null, password: '' });
      alert("Password reset successfully!");
    } catch (err) {
      setErrors({ resetPassword: err.response?.data?.message || "Failed to reset password" });
    }
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', isSuperAdmin: false });
    setResetData({ id: null, password: '' });
    setErrors({});
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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-sans font-bold ${isDark ? "text-white" : "text-black"}`}>
            Manage Admins
          </h1>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Create and manage individual artist accounts
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} variant="primary" className="w-full md:w-auto flex items-center justify-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add New Admin
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
          /* Responsive Table Wrapper */
          <div className="w-full overflow-hidden">
            <div className={`overflow-x-auto rounded-lg border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className={`${tableHeaderClass} uppercase font-sans text-xs`}>
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">Username</th>
                    <th className="px-6 py-3 whitespace-nowrap">Email</th>
                    <th className="px-6 py-3 whitespace-nowrap">Role</th>
                    <th className="px-6 py-3 whitespace-nowrap">Status</th>
                    <th className="px-6 py-3 whitespace-nowrap">Created At</th>
                    <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No admins found. Create one!</td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className={tableRowClass}>
                        <td className={`px-6 py-4 font-medium whitespace-nowrap ${textClass}`}>{admin.username}</td>
                        <td className={`px-6 py-4 whitespace-nowrap ${textClass}`}>{admin.email || '-'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap ${textClass}`}>
                          <span className={`text-xs uppercase font-bold px-2 py-1 rounded border ${admin.role === 'super_admin' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-gray-300 text-gray-600'
                            }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Individual'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${admin.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {admin.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${textClass}`}>
                          {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                          {admin.id !== user?.id && (
                            <>
                              <button
                                onClick={() => { setResetData({ id: admin.id, password: '' }); setShowResetModal(true); }}
                                title="Reset Password"
                                className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                              >
                                <KeyIcon className="w-5 h-5" />
                              </button>

                              <button
                                onClick={() => toggleStatus(admin.id, admin.status)}
                                title={admin.status === 'active' ? "Suspend User" : "Activate User"}
                                className={`p-1 rounded transition-colors ${admin.status === 'active'
                                  ? "text-orange-500 hover:bg-orange-100"
                                  : "text-green-500 hover:bg-green-100"
                                  }`}
                              >
                                {admin.status === 'active' ? <NoSymbolIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                              </button>

                              <button
                                onClick={() => handleDelete(admin.id)}
                                title="Delete User"
                                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl relative ${modalBg}`}>
            <button 
              onClick={() => { setShowModal(false); resetForm(); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h2 className={`text-xl font-bold mb-6 ${textClass}`}>Create New Admin</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <Input 
                id="username"
                label="Username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Ex: adminhtoo"
                error={errors.username}
              />
              <Input 
                id="email"
                label="Email (Optional)"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ex: artist@example.com"
                error={errors.email}
              />
              <Input 
                id="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Strong Password"
                error={errors.password}
              />

              {/* Super Admin Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isSuperAdmin"
                  checked={formData.isSuperAdmin}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="isSuperAdmin" className={`text-sm font-medium cursor-pointer ${textClass}`}>
                  Set as Superadmin
                </label>
              </div>

              {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
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

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl relative ${modalBg}`}>
            <button
              onClick={() => { setShowResetModal(false); resetForm(); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <h2 className={`text-xl font-bold mb-6 ${textClass}`}>Reset Password</h2>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                id="resetPassword"
                label="New Password"
                type="password"
                value={resetData.password}
                onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                placeholder="New Strong Password"
                error={errors.resetPassword}
              />

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowResetModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Reset Password
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
