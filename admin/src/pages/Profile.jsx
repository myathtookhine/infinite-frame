import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import InputTextarea from "../components/ui/InputTextarea";
import ContentCard from "../components/ui/ContentCard";
import {
  UserIcon,
  LockClosedIcon,
  TrashIcon,
  ArrowRightStartOnRectangleIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import Toast from "../components/ui/Toast";
import BannerUpload from "../components/BannerUpload";

const Profile = () => {
  const { user, changePassword, updateProfile, updateGalleryInfo, updateUser, logout } = useAuth();
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
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "info" });

  // Banner State
  const [bannerUrl, setBannerUrl] = useState(user?.banner_image_url || null);
  const [bannerEnabled, setBannerEnabled] = useState(user?.banner_enabled || false);

  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Helper to decode HTML entities (e.g. &#x27; -> ')
  const decodeHtml = (html) => {
    if (!html) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      setUsername(user.username);
      setSlug(user.slug || "");
      setGalleryName(decodeHtml(user.gallery_name || ""));
      setDescription(decodeHtml(user.description || ""));
      setAddress(decodeHtml(user.address || ""));
      setPhoneNumbers(user.phone_numbers || []);
      setSocialLinks(user.social_links || {});
      setBannerUrl(user.banner_image_url || null);
      setBannerEnabled(user.banner_enabled || false);
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
      setToast({
        isVisible: true,
        message: result.message,
        type: "success"
      });
    } else {
      setToast({
        isVisible: true,
        message: result.error,
        type: "danger"
      });
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

  const copyToClipboard = () => {
    const url = `infiniteframe.online/${slug || "your-slug"}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast({ isVisible: true, message: "URL Copied to Clipboard", type: "info" });
    });
  };

  const handleBannerUpdate = (bannerData) => {
    // Update local state
    setBannerUrl(bannerData.banner_image_url);
    setBannerEnabled(bannerData.banner_enabled);

    // Update user context and localStorage
    updateUser({
      banner_image_url: bannerData.banner_image_url,
      banner_enabled: bannerData.banner_enabled
    });
  };

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>Profile Settings</h1>
        <p className={`font-sans text-sm sm:text-base ${subtextColor}`}>
          Manage your account information
        </p>
      </div>

      {/* Username Update Form */}
      <ContentCard title="Update Username">
        <form onSubmit={handleUsernameUpdate} className="space-y-4">
          {/* Username Error/Success Messages */}
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
      </ContentCard>

      {/* Gallery Banner Upload */}
      <ContentCard
        title="Gallery Banner"
        subtitle="Upload a banner image for your public gallery (1200x630px minimum)"
      >
        <BannerUpload
          userId={user?.id}
          initialBannerUrl={bannerUrl}
          initialEnabled={bannerEnabled}
          onUpdate={handleBannerUpdate}
        />
      </ContentCard>

      {/* Gallery Information Form */}
      <ContentCard title="Gallery Information">
        <form onSubmit={handleGalleryInfoUpdate} className="space-y-4">

          <Input
            id="slug"
            label="Gallery Slug (URL)"
            type="text"
            value={slug}
            placeholder="e.g., lawkanatgallery"
            onChange={(e) => {
              let val = e.target.value.toLowerCase();
              val = val.replace(/\s+/g, '-'); // Replace spaces with -
              val = val.replace(/[^a-z0-9-]/g, ''); // Remove illegal chars
              setSlug(val);
            }}
          />
          <div className={`mt-2 p-4 rounded-md border-2 ${isDark ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-100'} transition-all`}>
            <p className={`text-xs mb-2 flex items-center gap-1.5 font-sans font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></span>
              Only lowercase letters and hyphens are allowed.
            </p>
            <p className={`text-xs font-sans mt-4 mb-2 opacity-70 ${isDark ? 'text-white font-semibold' : 'text-black font-semibold'}`}>
              Live URL :
            </p>
            <div className="flex items-end justify-between">
              <p className="text-sm font-sans">
                <strong className={isDark ? 'text-white font-black' : 'text-black font-black'}>infiniteframe.online/{slug || "your-slug"}</strong>
              </p>
              <button
                type="button"
                onClick={copyToClipboard}
                className={`flex items-center gap-1.5 text-xs font-sans font-bold transition-all cursor-pointer ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                <ClipboardIcon className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>

          <Input
            id="galleryName"
            label="Gallery Name"
            type="text"
            value={galleryName}
            onChange={(e) => setGalleryName(e.target.value)}
            placeholder="Enter gallery display name"
          />

          <InputTextarea
            id="description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your gallery..."
            maxLength={2000}
            rows={4}
            height="200px"
          />
          <p className={`text-xs mt-1 ${subtextColor}`}>
            {description.length}/2000 characters
          </p>

          <InputTextarea
            id="address"
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your gallery address..."
            maxLength={500}
            rows={3}
          />

          {/* Phone Numbers */}
          <div>
            <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
              Phone Numbers
            </label>
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  containerClassName="flex-1"
                  type="text"
                  value={phone}
                  onChange={(e) => updatePhoneNumber(index, e.target.value)}
                  placeholder="Enter phone number"
                />
                <Button
                  type="button"
                  onClick={() => removePhoneNumber(index)}
                  variant="secondary"
                  size="md"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addPhoneNumber}
              variant="secondary"
              size="sm"
              className="mt-2"
            >
              + Add Phone Number
            </Button>
          </div>

          {/* Social Links */}
          <div className='mt-6 mb-6'>
            <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
              Social Links
            </label>
            {Object.entries(socialLinks).map(([platform, url]) => (
              <div key={platform} className="mb-3">
                <div className="flex gap-2">
                  <Input
                    containerClassName="flex-1"
                    label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    type="url"
                    value={url}
                    onChange={(e) => updateSocialLink(platform, e.target.value)}
                    placeholder={`Enter ${platform} URL`}
                  />
                  <div className="flex flex-col justify-end">
                    <Button
                      type="button"
                      onClick={() => removeSocialLink(platform)}
                      variant="secondary"
                      size="md"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={addSocialLink}
              variant="secondary"
              size="sm"
              className="mt-2"
            >
              + Add Social Link
            </Button>
          </div>


          <Button type="submit" variant="primary" size="md" block>
            Update Gallery Info
          </Button>
        </form>
      </ContentCard>

      {/* Change Password Form */}
      <ContentCard title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Password Error/Success Messages */}
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
      </ContentCard>

      {/* Sign Out Section */}
      <ContentCard
        title="Sign Out"
        subtitle="Sign out from your admin account"
      >
        <Button
          onClick={handleSignOut}
          variant="secondary"
          size="md"
          className="flex items-center gap-2"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
          Sign Out Now
        </Button>
      </ContentCard>

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </main>
  );
};

export default Profile;
