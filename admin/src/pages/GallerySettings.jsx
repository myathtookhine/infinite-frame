import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import InputTextarea from "../components/ui/InputTextarea";
import { TrashIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { useLanguage } from '../context/LanguageContext';
import Toast from "../components/ui/Toast";
import BannerUpload from "../components/BannerUpload";

const GallerySettings = () => {
  const { user, updateGalleryInfo, updateUser } = useAuth();
  const { t } = useLanguage();

  const [slug, setSlug] = useState(user?.slug || "");
  const [galleryName, setGalleryName] = useState(user?.gallery_name || "");
  const [description, setDescription] = useState(user?.description || "");
  const [address, setAddress] = useState(user?.address || "");
  const [phoneNumbers, setPhoneNumbers] = useState(user?.phone_numbers || []);
  const [socialLinks, setSocialLinks] = useState(user?.social_links || {});
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "info" });

  const [bannerUrl, setBannerUrl] = useState(user?.banner_image_url || null);
  const [bannerEnabled, setBannerEnabled] = useState(user?.banner_enabled || false);

  const { isDark } = useTheme();

  const decodeHtml = (html) => {
    if (!html) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
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

  const handleGalleryInfoUpdate = async (e) => {
    e.preventDefault();

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

  const copyToClipboard = () => {
    const url = `infiniteframe.online/${slug || "your-slug"}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast({ isVisible: true, message: "URL Copied to Clipboard", type: "info" });
    });
  };

  const handleBannerUpdate = (bannerData) => {
    setBannerUrl(bannerData.banner_image_url);
    setBannerEnabled(bannerData.banner_enabled);

    updateUser({
      banner_image_url: bannerData.banner_image_url,
      banner_enabled: bannerData.banner_enabled
    });
  };

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>{t('nav.gallery_settings')}</h1>
        <p className={`font-sans text-sm sm:text-base ${subtextColor}`}>
          Manage your public gallery page information
        </p>
      </div>

      {/* Gallery Banner Upload */}
      <section className={`py-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <h2 className={`text-xl font-sans font-bold ${textColor} mb-1`}>Gallery Banner</h2>
        <p className={`text-sm font-sans ${subtextColor} mb-4`}>Upload a banner image for your public gallery (1200x630px minimum)</p>
        <BannerUpload
          userId={user?.id}
          initialBannerUrl={bannerUrl}
          initialEnabled={bannerEnabled}
          onUpdate={handleBannerUpdate}
        />
      </section>

      {/* Gallery Information Form */}
      <section className={`py-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Gallery Information</h2>
        <form onSubmit={handleGalleryInfoUpdate} className="space-y-4">

          <Input
            id="slug"
            label="Gallery Slug (URL)"
            type="text"
            value={slug}
            placeholder="e.g., lawkanatgallery"
            onChange={(e) => {
              let val = e.target.value.toLowerCase();
              val = val.replace(/\s+/g, '-');
              val = val.replace(/[^a-z0-9-]/g, '');
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
            minHeight="250px"
            height="350px"
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
      </section>

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </main>
  );
};

export default GallerySettings;
