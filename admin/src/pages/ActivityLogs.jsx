import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../config';
import { useTheme } from '../context/ThemeContext';
import { ClockIcon, UserIcon, ComputerDesktopIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Input from '../components/ui/Input';

const ITEMS_PER_PAGE = 15;

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const { user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(ENDPOINTS.ADMIN_MANAGEMENT.LOGS, {
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

  // Filter logs based on search and date
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = searchTerm === '' ||
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Use local date for comparison (YYYY-MM-DD format)
    const logDateTime = new Date(log.created_at);
    const logDateStr = `${logDateTime.getFullYear()}-${String(logDateTime.getMonth() + 1).padStart(2, '0')}-${String(logDateTime.getDate()).padStart(2, '0')}`;
    const matchesDate = selectedDate === '' || logDateStr === selectedDate;

    return matchesSearch && matchesDate;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const tableHeaderClass = isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600";
  const tableRowClass = isDark ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50";
  const textClass = isDark ? "text-gray-300" : "text-gray-900";
  const inputClass = isDark
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
    : "bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-black";
  const paginationBtnClass = isDark
    ? "px-3 py-1 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    : "px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";
  const paginationActiveClass = isDark
    ? "px-3 py-1 rounded bg-white text-black font-bold"
    : "px-3 py-1 rounded bg-[#151416] text-white font-bold";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <h1 className={`text-2xl font-sans font-bold ${isDark ? "text-white" : "text-black"}`}>
            Activity Logs
          </h1>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Track login and logout activities of all admins
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={MagnifyingGlassIcon}
            className="!py-2 !text-sm !rounded-lg w-52"
            containerClassName=""
          />

          {/* Date Filter */}
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`!py-2 !text-sm !rounded-lg ${isDark ? 'dark-date' : 'light-date'}`}
            containerClassName=""
          />

          {/* Clear Filters */}
          {(searchTerm || selectedDate) && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${isDark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-black hover:bg-gray-100"
                }`}
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading logs...</div>
      ) : (
          <>
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
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No activity recorded yet.</td>
                    </tr>
              ) : (
                      currentLogs.map((log) => (
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
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${log.action === 'LOGIN'
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Showing {startIndex + 1} - {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={paginationBtnClass}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={currentPage === page ? paginationActiveClass : paginationBtnClass}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={paginationBtnClass}
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
      )}
    </div>
  );
};

export default ActivityLogs;

