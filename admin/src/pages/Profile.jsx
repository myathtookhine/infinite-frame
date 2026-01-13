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
  const { user, changePassword, updateProfile, updateGalleryInfo, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Gallery Info State
  const [slug, setSlug] = useState(user?.slug || "");
  const [galleryName, setGalleryName] = useState(user?.gallery_name || "");
  const [description, setDescription] = useState(user?.description || "");
  const [address, setAddress] = useState(user?.address || "");
  const [phoneNumbers, setPhoneNumbers] = useState(user?.phone_numbers || []);
  const [socialLinks, setSocialLinks] = useState(user?.social_links || {});
  const [galleryError, setGalleryError] = useState("");
  const [gallerySuccess, setGallerySuccess] = useState("");

  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setSlug(user.slug || "");
      setGalleryName(user.gallery_name || "");
      setDescription(user.description || "");
      setAddress(user.address || "");
      setPhoneNumbers(user.phone_numbers || []);
      setSocialLinks(user.social_links || {});
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

  const handleGalleryInfoUpdate = async (e) => {
    e.preventDefault();
    setGalleryError("");
    setGallerySuccess("");

    const result = await updateGalleryInfo({
      slug,
      gallery_name: galleryName,
      description,
      address,
      phone_numbers: phoneNumbers,
      social_links: socialLinks
    });

    if (result.success) {
      setGallerySuccess(result.message);
      setTimeout(() => setGallerySuccess(""), 3000);
    } else {
      setGalleryError(result.error);
    }
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const removePhoneNumber = (index) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const updatePhoneNumber = (index, value) => {
    const updated = [...phoneNumbers];
    updated[index] = value;
    setPhoneNumbers(updated);
  };

  const addSocialLink = () => {
    const platform = prompt("Enter platform name (e.g., Instagram, Facebook):");
    if (platform && platform.trim()) {
      setSocialLinks({ ...socialLinks, [platform.trim().toLowerCase()]: "" });
    }
  };

  const removeSocialLink = (platform) => {
    const updated = { ...socialLinks };
    delete updated[platform];
    setSocialLinks(updated);
  };

  const updateSocialLink = (platform, url) => {
    setSocialLinks({ ...socialLinks, [platform]: url });
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

      {/* Gallery Information Form */}
      <div
        className={`border-2 ${cardBorder} ${cardBg} p-6 sm:p-8 rounded-lg mb-6 transition-all ${hoverBorder}`}
      >
        <h3 className={`font-sans text-xl sm:text-2xl mb-4 ${textColor}`}>
          Gallery Information
        </h3>
        <form onSubmit={handleGalleryInfoUpdate} className="space-y-4">
          {/* Gallery Error/Success Messages */}
          {galleryError && (
            <div className="bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 text-sm font-sans rounded font-medium">
              {galleryError}
            </div>
          )}

          {gallerySuccess && (
            <div className="bg-green-50 border-2 border-green-600 text-green-700 px-4 py-3 text-sm font-sans rounded font-medium">
              {gallerySuccess}
            </div>
          )}

          <Input
            id="slug"
            label="Gallery Slug (URL)"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g., lawkanatgallery"
          />
          <p className={`text-xs ${subtextColor} -mt-2`}>
            Your gallery will be accessible at: infiniteframe.online/{slug || "your-slug"}
          </p>

          <Input
            id="galleryName"
            label="Gallery Name"
            type="text"
            value={galleryName}
            onChange={(e) => setGalleryName(e.target.value)}
            placeholder="Enter gallery display name"
          />

          <div>
            <label htmlFor="description" className={`block text-sm font-sans font-medium mb-2 ${textColor}`}>
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your gallery..."
              maxLength={2000}
              rows={4}
              className={`w-full px-4 py-3 border-2 ${cardBorder} rounded-md font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
            />
            <p className={`text-xs ${subtextColor} mt-1`}>
              {description.length}/2000 characters
            </p>
          </div>

          <div>
            <label htmlFor="address" className={`block text-sm font-sans font-medium mb-2 ${textColor}`}>
              Address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your gallery address..."
              maxLength={500}
              rows={3}
              className={`w-full px-4 py-3 border-2 ${cardBorder} rounded-md font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
            />
          </div>

          {/* Phone Numbers */}
          <div>
            <label className={`block text-sm font-sans font-medium mb-2 ${textColor}`}>
              Phone Numbers
            </label>
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => updatePhoneNumber(index, e.target.value)}
                  placeholder="Enter phone number"
                  className={`flex-1 px-4 py-3 border-2 ${cardBorder} rounded-md font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
                />
                <Button
                  type="button"
                  onClick={() => removePhoneNumber(index)}
                  variant="secondary"
                  size="md"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addPhoneNumber}
              variant="secondary"
              size="md"
              className="mt-2"
            >
              + Add Phone Number
            </Button>
          </div>

          {/* Social Links */}
          <div>
            <label className={`block text-sm font-sans font-medium mb-2 ${textColor}`}>
              Social Links
            </label>
            {Object.entries(socialLinks).map(([platform, url]) => (
              <div key={platform} className="mb-3">
                <label className={`block text-xs font-sans mb-1 ${subtextColor} capitalize`}>
                  {platform}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateSocialLink(platform, e.target.value)}
                    placeholder={`Enter ${platform} URL`}
                    className={`flex-1 px-4 py-3 border-2 ${cardBorder} rounded-md font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
                  />
                  <Button
                    type="button"
                    onClick={() => removeSocialLink(platform)}
                    variant="secondary"
                    size="md"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={addSocialLink}
              variant="secondary"
              size="md"
              className="mt-2"
            >
              + Add Social Link
            </Button>
          </div>

          <Button type="submit" variant="primary" size="md" block>
            Update Gallery Info
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
