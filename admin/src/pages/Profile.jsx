import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  UserIcon,
  LockClosedIcon,
  ArrowRightStartOnRectangleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { user, changePassword, updateProfile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  const textColor = isDark ? "text-white" : "text-[#151416]";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");

    if (!username || username.trim() === "") {
      setUsernameError("Username cannot be empty");
      return;
    }

    const result = await updateProfile(username);
    if (result.success) {
      setUsernameSuccess(result.message);
      setTimeout(() => setUsernameSuccess(""), 3000);
    } else {
      setUsernameError(result.error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordSuccess(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } else {
      setPasswordError(result.error);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>{t('nav.profile')}</h1>
        <p className={`font-sans text-sm sm:text-base ${subtextColor}`}>
          Manage your account and subscription
        </p>
      </div>

      {/* Subscription Status Card */}
      {user?.role !== 'super_admin' && (
        <section className={`p-6 mb-8 border-2 rounded-2xl ${isDark ? 'border-theme/30 bg-theme/5' : 'border-theme/20 bg-theme/5'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-theme/20' : 'bg-theme/10'}`}>
                <CreditCardIcon className="w-8 h-8 text-theme" />
              </div>
              <div>
                <h2 className={`text-sm font-bold uppercase tracking-wider opacity-50 ${textColor}`}>{t('subscription.current_plan')}</h2>
                <p className={`text-2xl font-black uppercase tracking-tighter ${textColor}`}>{user?.subscription_plan || 'Free'}</p>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-2">
              {user?.subscription_expiry ? (
                <div className="text-left md:text-right">
                  <p className={`text-[10px] font-bold uppercase tracking-widest opacity-50 ${textColor}`}>{t('subscription.expiry')}</p>
                  <p className={`text-lg font-mono font-bold ${textColor}`}>{new Date(user.subscription_expiry).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className={`text-xs font-medium opacity-70 ${textColor}`}>Lifetime access for Free plan</p>
              )}
              {user?.subscription_plan !== 'deluxe' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/subscription')}
                  className="mt-2"
                >
                  {t('subscription.upgrade')}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Username Update Form */}
      <section className={`py-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Update Username</h2>
        <form onSubmit={handleUsernameUpdate} className="space-y-4">
          {usernameError && (
            <div className={`border-2 px-4 py-3 text-sm font-sans rounded font-medium ${isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-600 text-red-700'}`}>
              {usernameError}
            </div>
          )}

          {usernameSuccess && (
            <div className={`border-2 px-4 py-3 text-sm font-sans rounded font-medium ${isDark ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-600 text-green-700'}`}>
              {usernameSuccess}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              containerClassName="flex-1"
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter new username"
              autoComplete="username"
              icon={UserIcon}
            />
            <div className="flex flex-col justify-end mb-1">
              <Button type="submit" variant="primary" size="md">
                Update
              </Button>
            </div>
          </div>
        </form>
      </section>

      {/* Language Settings */}
      <section className={`py-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <h2 className={`text-xl font-sans font-bold ${textColor} mb-1`}>{t('common.language')}</h2>
        <p className={`text-sm font-sans ${subtextColor} mb-6`}>
          Select your preferred language for the admin dashboard
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setLanguage('en')}
            className={`flex items-center justify-between p-4 cursor-pointer rounded-xl border-2 transition-all duration-200 sm:w-64 ${language === 'en'
              ? (isDark ? 'border-white bg-white/5 shadow-lg shadow-white/10' : 'border-gray-900 bg-gray-900/5 shadow-lg shadow-gray-900/10')
              : isDark
                ? 'border-neutral-800 bg-neutral-900/40 opacity-60 hover:opacity-100 hover:border-neutral-700'
                : 'border-gray-100 bg-gray-50/50 opacity-60 hover:opacity-100 hover:border-gray-200'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${language === 'en' ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white') : (isDark ? 'bg-neutral-800 text-gray-500' : 'bg-gray-200 text-gray-500')}`}>
                EN
              </div>
              <span className={`font-sans font-bold ${language === 'en' ? textColor : subtextColor}`}>English</span>
            </div>
            {language === 'en' && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'} animate-pulse`} />}
          </button>

          <button
            onClick={() => setLanguage('my')}
            className={`flex items-center justify-between p-4 cursor-pointer rounded-xl border-2 transition-all duration-200 sm:w-64 ${language === 'my'
              ? (isDark ? 'border-white bg-white/5 shadow-lg shadow-white/10' : 'border-gray-900 bg-gray-900/5 shadow-lg shadow-gray-900/10')
              : isDark
                ? 'border-neutral-800 bg-neutral-900/40 opacity-60 hover:opacity-100 hover:border-neutral-700'
                : 'border-gray-100 bg-gray-50/50 opacity-60 hover:opacity-100 hover:border-gray-200'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${language === 'my' ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white') : (isDark ? 'bg-neutral-800 text-gray-500' : 'bg-gray-200 text-gray-500')}`}>
                MY
              </div>
              <span className={`font-sans font-bold ${language === 'my' ? textColor : subtextColor}`}>မြန်မာဘာသာ</span>
            </div>
            {language === 'my' && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'} animate-pulse`} />}
          </button>
        </div>
      </section>

      {/* Change Password Form */}
      <section className={`py-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passwordError && (
            <div className={`border-2 px-4 py-3 text-sm font-sans rounded font-medium ${isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-600 text-red-700'}`}>
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className={`border-2 px-4 py-3 text-sm font-sans rounded font-medium ${isDark ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-600 text-green-700'}`}>
              {passwordSuccess}
            </div>
          )}

          <Input
            id="currentPassword"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            autoComplete="current-password"
            icon={LockClosedIcon}
            showPasswordToggle
          />

          <Input
            id="newPassword"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
            icon={LockClosedIcon}
            showPasswordToggle
          />

          <Input
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            icon={LockClosedIcon}
            showPasswordToggle
          />

          <Button type="submit" variant="primary" size="md" block>
            Update Password
          </Button>
        </form>
      </section>

      {/* Sign Out Section */}
      <section className="py-8">
        <h2 className={`text-xl font-sans font-bold ${textColor} mb-1`}>Sign Out</h2>
        <p className={`text-sm font-sans ${subtextColor} mb-4`}>Sign out from your admin account</p>
        <Button
          onClick={handleSignOut}
          variant="secondary"
          size="md"
          className="flex items-center gap-2"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
          Sign Out Now
        </Button>
      </section>
    </main>
  );
};

export default Profile;
