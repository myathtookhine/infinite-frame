import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

const SidebarLink = ({ to, children, icon: Icon, onClick, isDark }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md font-sans text-sm mb-1 transition-colors duration-150 ${
          isActive
            ? isDark
              ? "bg-gray-800 text-white"
              : "bg-gray-200 text-black"
            : isDark
            ? "text-gray-400 hover:bg-gray-800 hover:text-white"
            : "text-gray-600 hover:bg-gray-200 hover:text-black"
        }`
      }
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </NavLink>
  );
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const bgColor = isDark ? "bg-[#0a0a0a]" : "bg-gray-100";
  const headerBg = isDark ? "bg-[#141414]" : "bg-white";
  const headerBorder = isDark ? "border-gray-800" : "border-gray-300";
  const sidebarBg = isDark ? "bg-[#141414]" : "bg-white";
  const textColor = isDark ? "text-white" : "text-black";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const contentBg = isDark ? "md:bg-[#141414]" : "md:bg-white";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-black/5";
  const iconColor = isDark ? "text-white" : "text-black";

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Mobile Header - Only visible on mobile */}
      <header
        className={`md:hidden border-b ${headerBorder} p-4 flex items-center justify-between ${headerBg} sticky top-0 z-20`}
      >
        <button
          className={`p-2 rounded ${hoverBg}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
        >
          <Bars3Icon className={`h-6 w-6 ${iconColor}`} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/vite.svg" alt="Logo" className="h-6 w-6" />
          <span className={`font-sans text-lg font-semibold ${textColor}`}>
            Infinit Frame
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded ${hoverBg}`}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <SunIcon className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <MoonIcon className={`h-5 w-5 ${iconColor}`} />
          )}
        </button>
      </header>

      {/* Backdrop for mobile when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex md:p-4 md:gap-4 min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 ${sidebarBg} ${textColor} w-64 p-4 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:z-auto md:rounded-2xl md:h-[calc(100vh-2rem)] md:sticky md:top-4 ${
            isDark
              ? "md:border md:border-gray-800"
              : "md:border md:border-gray-300"
          }`}
          aria-label="Sidebar"
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`font-sans text-xl font-semibold ${textColor}`}>
                Infinit Frame
              </h2>
              <div className={`font-sans text-xs ${subtextColor}`}>
                Admin Portal
              </div>
            </div>
            <button
              className={`md:hidden p-1 rounded ${
                isDark ? "hover:bg-white/10" : "hover:bg-black/5"
              } transition-colors`}
              aria-label="Close menu"
              onClick={closeSidebar}
            >
              <XMarkIcon className={`h-6 w-6 ${iconColor}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1"
            role="navigation"
            aria-label="Main navigation"
          >
            <SidebarLink
              to="/dashboard"
              icon={HomeIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              Dashboard
            </SidebarLink>
            <SidebarLink
              to="/profile"
              icon={UserCircleIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              Profile
            </SidebarLink>
          </nav>

          {/* Theme Toggle & Logout */}
          <div
            className={`mt-auto pt-4 space-y-2 ${
              isDark ? "border-t border-white/10" : "border-t border-black/10"
            }`}
          >
            <button
              onClick={toggleTheme}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md ${
                isDark
                  ? "text-white hover:bg-white/10"
                  : "text-black hover:bg-black/5"
              } font-sans transition-colors duration-150`}
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md ${
                isDark
                  ? "text-white hover:bg-white/10"
                  : "text-black hover:bg-black/5"
              } font-sans transition-colors duration-150`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 ${contentBg} md:rounded-2xl md:min-h-[calc(100vh-2rem)] md:my-0 ${
            isDark
              ? "md:border md:border-gray-800"
              : "md:border md:border-gray-300"
          }`}
        >
          <main className="p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
