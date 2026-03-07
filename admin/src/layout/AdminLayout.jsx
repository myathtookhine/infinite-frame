import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  SwatchIcon,
  UserGroupIcon,
  ClockIcon,
  ArchiveBoxIcon,
  PhotoIcon,
  ScaleIcon,
  ChevronRightIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  LanguageIcon
} from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from '../context/LanguageContext';

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
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const bgColor = isDark ? "bg-[#0a0a0a]" : "bg-transparent";
  const headerBg = isDark ? "bg-[#141414]" : "bg-white";
  const headerBorder = isDark ? "border-[#262626]" : "border-gray-300";
  const sidebarBg = isDark ? "bg-[#141414]" : "bg-white";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const contentBg = isDark ? "lg:bg-[#141414]" : "lg:bg-white";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-black/5";
  const iconColor = isDark ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Mobile Header - Only visible on mobile */}
      <header
        className={`lg:hidden border-b ${headerBorder} p-4 flex items-center justify-start ${headerBg} sticky top-0 z-20`}
      >
        <button
          className={`p-2 rounded me-4 ${hoverBg}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
        >
          <Bars3Icon className={`h-6 w-6 ${iconColor}`} />
        </button>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className={`font-sans text-lg font-semibold ${textColor} hover:opacity-80 transition-opacity`}>
            {user?.gallery_name || user?.username || 'Gallery Admin'}
          </Link>
        </div>
      </header>

      {/* Backdrop for mobile when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex lg:p-4 lg:gap-3 min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 ${sidebarBg} ${textColor} w-64 p-4 z-[70] flex flex-col transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:z-auto lg:rounded-2xl lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4 ${
            isDark
            ? "lg:border lg:border-[#262626]"
            : "lg:border lg:border-gray-300"  
          }`}
          aria-label="Sidebar"
        >
          {/* Sidebar Header - Fixed */}
          <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-4 border-b border-current/10">
            <div>
              <h2 className={`font-sans text-xl font-semibold ${textColor}`}>
                {user?.gallery_name || user?.username || 'Gallery Admin'}
              </h2>
              <div className={`font-sans text-xs ${subtextColor} flex items-center gap-2`}>
                Admin Portal
                {user?.role === 'super_admin' && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Super
                  </span>
                )}
              </div>
            </div>
            <button
              className={`lg:hidden p-1 rounded ${
                isDark ? "hover:bg-white/10" : "hover:bg-black/5"
              } transition-colors`}
              aria-label="Close menu"
              onClick={closeSidebar}
            >
              <XMarkIcon className={`h-6 w-6 ${iconColor}`} />
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav
            className="flex-1 overflow-y-auto no-scrollbar"
            role="navigation"
            aria-label="Main navigation"
          >
            <SidebarLink
              to="/dashboard"
              icon={HomeIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              {t('nav.dashboard')}
            </SidebarLink>

            <SidebarLink
              to="/categories"
              icon={ArchiveBoxIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              {t('nav.categories')}
            </SidebarLink>

            <SidebarLink
              to="/artwork-attributes"
              icon={SwatchIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              Artwork Attributes
            </SidebarLink>

            <SidebarLink
              to="/artworks"
              icon={PhotoIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              {t('nav.artworks')}
            </SidebarLink>

            <SidebarLink
              to="/subscription"
              icon={CreditCardIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              {t('nav.subscription')}
            </SidebarLink>

            {user?.role === 'super_admin' && (
              <SidebarLink
                to="/subscription-management"
                icon={ShieldCheckIcon}
                onClick={closeSidebar}
                isDark={isDark}
              >
                Subscription Mgmt
              </SidebarLink>
            )}

            {user?.role === 'super_admin' && (
              <>
                <SidebarLink
                  to="/manage-admins"
                  icon={UserGroupIcon}
                  onClick={closeSidebar}
                  isDark={isDark}
                >
                  Manage Admins
                </SidebarLink>

                <SidebarLink
                  to="/activity-logs"
                  icon={ClockIcon}
                  onClick={closeSidebar}
                  isDark={isDark}
                >
                  Activity Logs
                </SidebarLink>
              </>
            )}
          </nav>

          {/* Theme Toggle & Profile - Fixed */}
          <div
            className={`flex-shrink-0 mt-auto pt-2 space-y-2 ${
              isDark ? "border-t border-white/10" : "border-t border-black/10"
            }`}
          >

            <SidebarLink
              to="/profile"
              icon={UserCircleIcon}
              onClick={closeSidebar}
              isDark={isDark}
            >
              <div className="flex items-center justify-between flex-1">
                <span>{t('nav.profile')}</span>
                <ChevronRightIcon className="w-4 h-4" />
              </div>
            </SidebarLink>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-3 py-2 w-full rounded-md font-sans text-sm mb-1 transition-colors duration-150 ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}`}
            >
              <XMarkIcon className="h-5 w-5" />
              {t('nav.logout')}
            </button>

            <div className="px-2 mt-2 space-y-3">
              <ThemeToggle showLabel={true} />

              <button
                onClick={toggleLanguage}
                className={`flex items-center gap-3 w-full px-1 text-sm font-sans font-medium transition-opacity hover:opacity-80 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                <LanguageIcon className="h-5 w-5" />
                <span>{language === 'my' ? 'English' : 'မြန်မာဘာသာ'}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 min-w-0 overflow-hidden ${contentBg} lg:rounded-2xl lg:min-h-[calc(100vh-2rem)] lg:my-0 ${
            isDark
            ? "lg:border lg:border-[#262626]"
            : "lg:border lg:border-gray-300"
          }`}
        >
          <main className="p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
