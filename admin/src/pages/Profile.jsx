import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  UserIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Profile = () => {
  const { user, changePassword, updateProfile, logout } = useAuth();
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
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  const textColor = isDark ? "text-white" : "text-black";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const cardBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const cardBorder = isDark ? "border-[#262626]" : "border-gray-300";
  const hoverBorder = isDark
    ? "hover:border-[#404040]"
    : "hover:border-gray-400";

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

    // Validation
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

    // Attempt to change password
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
        <h2 className={`font-sans text-3xl sm:text-5xl mb-2 ${textColor}`}>
          Profile Settings
        </h2>
        <p className={`font-sans ${subtextColor} text-sm sm:text-base`}>
          Manage your account information
        </p>
      </div>

      {/* Username Update Form */}
      <div
        className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg mb-6 transition-all ${hoverBorder}`}
      >
        <h3 className={`font-sans text-xl sm:text-2xl mb-4 ${textColor}`}>
          Update Username
        </h3>
        <form onSubmit={handleUsernameUpdate} className="space-y-4">
          {/* Username Error/Success Messages */}
          {usernameError && (
            <div className="bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 text-sm font-sans rounded font-medium">
              {usernameError}
            </div>
          )}

          {usernameSuccess && (
            <div className="bg-green-50 border-2 border-green-600 text-green-700 px-4 py-3 text-sm font-sans rounded font-medium">
              {usernameSuccess}
            </div>
          )}

          <Input
            id="username"
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter new username"
            autoComplete="username"
            icon={UserIcon}
          />

          <Button type="submit" variant="primary" size="md" block>
            Update Username
          </Button>
        </form>
      </div>

      {/* Change Password Form */}
      <div
        className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg mb-6 transition-all ${hoverBorder}`}
      >
        <h3 className={`font-sans text-xl sm:text-2xl mb-4 ${textColor}`}>
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Password Error/Success Messages */}
          {passwordError && (
            <div className="bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 text-sm font-sans rounded font-medium">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border-2 border-green-600 text-green-700 px-4 py-3 text-sm font-sans rounded font-medium">
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
      </div>

      {/* Sign Out Section */}
      <div
        className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg transition-all ${hoverBorder}`}
      >
        <h3 className={`font-sans text-xl sm:text-2xl mb-2 ${textColor}`}>
          Sign Out
        </h3>
        <p className={`font-sans ${subtextColor} mb-4 text-sm sm:text-base`}>
          Sign out from your admin account
        </p>
        <Button
          onClick={handleSignOut}
          variant="secondary"
          size="md"
          className="flex items-center gap-2"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </main>
  );
};

export default Profile;
