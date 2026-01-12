import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import { ClockIcon, UserIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin-management/logs`, {
          headers: { 'x-admin-id': user?.id }
        });
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  const tableHeaderClass = isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600";
  const tableRowClass = isDark ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50";
  const textClass = isDark ? "text-gray-300" : "text-gray-900";

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-sans font-bold ${isDark ? "text-white" : "text-black"}`}>
          Activity Logs
        </h1>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Track login and logout activities of all admins
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading logs...</div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`${tableHeaderClass} uppercase font-sans text-xs`}>
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length === 0 ? (
                 <tr>
                   <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No activity recorded yet.</td>
                 </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={tableRowClass}>
                    <td className={`px-6 py-4 flex items-center gap-2 ${textClass}`}>
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 ${textClass}`}>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <div>
                            <div className="font-medium">{log.username}</div>
                            <div className="text-xs text-gray-500">{log.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        log.action === 'LOGIN' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${textClass} font-mono text-xs`}>
                        <div className="flex items-center gap-2">
                            <ComputerDesktopIcon className="w-4 h-4 text-gray-400" />
                            {log.ip_address || 'Unknown'}
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
