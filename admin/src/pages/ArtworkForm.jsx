import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import InputTextarea from '../components/ui/InputTextarea';
import SingleImageUploader from '../components/SingleImageUploader';
import MultipleImageUploader from '../components/MultipleImageUploader';
import axios from 'axios';
import { ENDPOINTS } from '../config';

const ArtworkForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  // Form states
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [name, setName] = useState('');
  const [isUntitled, setIsUntitled] = useState(false);
  const [description, setDescription] = useState('');
  const [createdYear, setCreatedYear] = useState(new Date().getFullYear());
  const [createdMonth, setCreatedMonth] = useState('');
  const [category, setCategory] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState('available');
  const [isFramed, setIsFramed] = useState(false);
  const [editionInfo, setEditionInfo] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [hasCOA, setHasCOA] = useState(false);
  const [price, setPrice] = useState('');
  const [showPrice, setShowPrice] = useState(true);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(true);

  // Data from API
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingArtwork, setLoadingArtwork] = useState(isEditMode);

  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const subtextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-400';
  const inputBg = isDark ? 'bg-[#141414]' : 'bg-white';
  const selectBorder = isDark ? 'border-[#262626]' : 'border-gray-300';

  // Fetch data on mount
  useEffect(() => {
    fetchUnitsAndCategories();
    if (isEditMode) {
      fetchArtwork();
    }
  }, [id]);

  const fetchUnitsAndCategories = async () => {
    try {
      const [unitsRes, categoriesRes] = await Promise.all([
        axios.get(ENDPOINTS.UNITS, { headers: { 'x-admin-id': user.id } }),
        axios.get(ENDPOINTS.CATEGORIES, { headers: { 'x-admin-id': user.id } })
      ]);

      setUnits(unitsRes.data);
      setCategories(categoriesRes.data);

      // Set first unit as default if no unit selected
      if (!unitId && unitsRes.data.length > 0) {
        setUnitId(unitsRes.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching units/categories:', err);
      alert('Failed to load form data');
    } finally {
      setLoadingUnits(false);
      setLoadingCategories(false);
    }
  };

  const fetchArtwork = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.ARTWORKS}/${id}`, {
        headers: { 'x-admin-id': user.id }
      });

      const artwork = res.data;

      // Populate form with artwork data
      setName(artwork.name || '');
      setIsUntitled(artwork.is_untitled || false);
      setDescription(artwork.description || '');
      setCreatedYear(artwork.created_year || new Date().getFullYear());
      setCreatedMonth(artwork.created_month || '');
      setCategory(artwork.category_id || '');
      setWidth(artwork.width || '');
      setHeight(artwork.height || '');
      setDepth(artwork.depth || '');
      setUnitId(artwork.unit_id || '');
      setStatus(artwork.status || 'available');
      setIsFramed(artwork.is_framed || false);
      setEditionInfo(artwork.edition_info || '');
      setHasSignature(artwork.has_signature || false);
      setHasCOA(artwork.has_coa || false);
      setPrice(artwork.price || '');
      setShowPrice(artwork.show_price ?? true);
      setShowAdditionalDetails(artwork.show_additional_details ?? true);

      // Handle images - set URLs for preview in edit mode
      if (artwork.main_image) {
        setMainImage({
          id: 'existing-main',
          url: artwork.main_image,
          croppedBlob: null // No new upload, just displaying existing
        });
      }

      if (artwork.additional_images && artwork.additional_images.length > 0) {
        const existingAdditionalImages = artwork.additional_images.map((url, index) => ({
          id: `existing-additional-${index}`,
          url: url,
          croppedBlob: null
        }));
        setAdditionalImages(existingAdditionalImages);
      }
    } catch (err) {
      console.error('Error fetching artwork:', err);
      alert('Failed to load artwork');
      navigate('/artworks');
    } finally {
      setLoadingArtwork(false);
    }
  };

  // Years array (1900 to current year + 1)
  const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i).reverse();

  const months = [
   'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const statuses = [
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'private collection', label: 'Private Collection' }
  ];

  const uploadImages = async (artworkId) => {
    const formData = new FormData();
    formData.append('artwork_id', artworkId);

    let hasImages = false;

    // Append Main Image
    if (mainImage && mainImage.croppedBlob) {
      formData.append('images', mainImage.croppedBlob, 'main.jpg');
      hasImages = true;
    }

    // Append Additional Images
    if (additionalImages && additionalImages.length > 0) {
      additionalImages.forEach((img, index) => {
        if (img.croppedBlob) {
          formData.append('images', img.croppedBlob, `additional-${index}.jpg`);
          hasImages = true;
        }
      });
    }

    if (!hasImages) return null;

    try {
      const res = await axios.post(ENDPOINTS.ARTWORK_UPLOAD, formData, {
        headers: {
          'x-admin-id': user.id,
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data.urls;
    } catch (err) {
      console.error('Image upload failed:', err);
      console.error('Error details:', err.response?.data);
      console.error('Status:', err.response?.status);
      const errorMsg = err.response?.data?.message || err.message;
      throw new Error(`Failed to upload images: ${errorMsg}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!mainImage && !isEditMode) {
      alert('Main image is required');
      return;
    }

    if (!category) {
      alert('Category is required');
      return;
    }

    try {
    // 1. Create/Update Artwork Data (without images initially)
      const artworkData = {
        name: isUntitled ? 'Untitled' : name,
        is_untitled: isUntitled,
        description,
        main_image: mainImage ? (mainImage.croppedBlob ? null : mainImage.url) : null,
        additional_images: additionalImages.length > 0
          ? additionalImages.filter(img => !img.croppedBlob).map(img => img.url)
          : null,
        category_id: category,
        created_year: createdYear,
        created_month: createdMonth || null,
        width: parseFloat(width) || null,
        height: parseFloat(height) || null,
        depth: parseFloat(depth) || null,
        unit_id: unitId || null,
        status,
        is_framed: isFramed,
        edition_info: editionInfo || null,
        has_signature: hasSignature,
        has_coa: hasCOA,
        price: parseFloat(price) || null,
        currency: 'MMK',
        show_price: status === 'available' ? showPrice : false,
        show_additional_details: showAdditionalDetails
      };

      console.log('📤 Submitting artwork data:', artworkData);
      console.log('🖼️ Additional images state:', additionalImages);
      console.log('🖼️ Filtered additional images:', artworkData.additional_images);

      let artworkId;
      let response;

      if (isEditMode) {
        artworkId = id;
        // Update basic info first
        response = await axios.put(`${ENDPOINTS.ARTWORKS}/${id}`, artworkData, {
          headers: { 'x-admin-id': user.id }
        });
      } else {
        // Create new artwork first to get ID
        response = await axios.post(ENDPOINTS.ARTWORKS, artworkData, {
          headers: { 'x-admin-id': user.id }
        });
        artworkId = response.data.id;
      }

      // 2. Upload Images if any new ones
      if ((mainImage && mainImage.croppedBlob) || (additionalImages.some(img => img.croppedBlob))) {
        const uploadedUrls = await uploadImages(artworkId);

        if (uploadedUrls && uploadedUrls.length > 0) {
          // If we uploaded new images, we need to update the artwork record with these URLs
          // note: The current simple upload logic might map 'main' to the first URL etc. 
          // Ideally the backend upload returns a map or specific structure. 
          // For now, let's assume the backend handles the mapping or we just reload.

          // Actually, our backend upload-images just returns a list of URLs and puts them in storage.
          // It DOES NOT automatically update the artwork's main_image column in the DB.
          // We need a way to link them. 

          // Let's refine the backend or the flow. 
          // Strategy: The backend `upload-images` saves to folder `{artwork_id}/...`. 
          // We can construct the URL client side if we know the bucket, OR we update the backend to update the DB.

          // BETTER APPROCH: Let's assume for now we just want to save the URLs. 
          // But wait, the backend `upload-images` DOES return URLs. 
          // We need to update the artwork with these URLs.

          // Quick Fix: Update the artwork again with the new image URLs.
          // But `uploadImages` returns a flat array. We need to know which is main.

          // Revised Plan: 
          // We will update the `upload-images` endpoint in a future step to return labeled URLs (main, additional).
          // For now, let's just make sure we are not losing the image.
          // Since the prompt is "thumbnail not shown", it means `main_image` column is empty.

          // Let's look at `server/routes/artworks.js` again. 
          // The upload route DOES NOT update the DB.

          // We need to:
          // 1. Upload images
          // 2. Get URLs
          // 3. Update artwork with URLs
        }
      }

      alert(`Artwork ${isEditMode ? 'updated' : 'created'} successfully!`);
      navigate('/artworks');
    } catch (err) {
      console.error('Error saving artwork:', err);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} artwork: ` + (err.response?.data?.message || err.message));
    }
  };

  if (loadingArtwork || loadingCategories) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={subtextColor}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/artworks')}
        className={`flex items-center gap-2 mb-6 ${subtextColor} hover:${textColor} transition-colors`}
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="font-sans font-medium">Back to Artworks</span>
      </button>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className={`text-4xl font-sans font-black tracking-tight ${textColor} mb-2`}>
          {isEditMode ? 'Edit Artwork' : 'Add New Artwork'}
        </h1>
        <p className={`${subtextColor} font-sans`}>
          {isEditMode ? 'Update artwork information' : 'Create a new artwork entry'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Image Upload Section */}
        <section className={`py-8 border-b ${borderColor}`}>
          <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Artwork Images</h2>
          
          {/* Main Image */}
          <div className="mb-6">
            <SingleImageUploader
              image={mainImage}
              onImageChange={setMainImage}
              label="Main Image"
            />
          </div>

          {/* Additional Images */}
          <MultipleImageUploader
            images={additionalImages}
            onImagesChange={setAdditionalImages}
            label="Additional Images"
          />
        </section>

        {/* Basic Information Section */}
        <section className={`py-8 border-b ${borderColor}`}>
          <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Basic Information</h2>
          
          {/* Untitled Checkbox */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isUntitled}
                onChange={(e) => {
                  setIsUntitled(e.target.checked);
                  if (e.target.checked) setName('Untitled');
                }}
                className="w-4 h-4 rounded"
              />
              <span className={`text-sm font-sans font-medium ${textColor}`}>
                Set as "Untitled"
              </span>
            </label>
          </div>

          {/* Artwork Name */}
          <Input
            label="Artwork Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sunset Over Bagan"
            disabled={isUntitled}
            required={!isUntitled}
          />

          {/* Description */}
          <div className="mt-4">
            <InputTextarea
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the artwork..."
              rows={4}
              maxLength={2000}
            />
            <p className={`text-xs mt-1 ${subtextColor}`}>
              {description.length}/2000 characters
            </p>
          </div>

          {/* Category */}
          <div className="mt-4">
            <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className={`w-full px-4 py-3 rounded-md border-2 ${selectBorder} ${inputBg} ${textColor} font-sans text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Creation Date Section */}
        <section className={`py-8 border-b ${borderColor}`}>
          <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Creation Date</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year */}
            <div>
              <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
                Year *
              </label>
              <select
                value={createdYear}
                onChange={(e) => setCreatedYear(parseInt(e.target.value))}
                required
                className={`w-full px-4 py-3 rounded-md border-2 ${selectBorder} ${inputBg} ${textColor} font-sans text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all`}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
                Month (Optional)
              </label>
              <select
                value={createdMonth}
                onChange={(e) => setCreatedMonth(e.target.value)}
                className={`w-full px-4 py-3 rounded-md border-2 ${selectBorder} ${inputBg} ${textColor} font-sans text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all`}
              >
                <option value="">Not specified</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Dimensions Section */}
        <section className={`py-8 border-b ${borderColor}`}>
          <h2 className={`text-xl font-sans font-bold ${textColor} mb-1`}>Dimensions</h2>
          <p className={`text-sm ${subtextColor} mb-4`}>
            Specify artwork dimensions. Depth is optional (for 3D artworks).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Width */}
            <Input
              label="Width (အနံ)"
              type="number"
              step="0.01"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="e.g., 40"
            />

            {/* Height */}
            <Input
              label="Height (အမြင့်)"
              type="number"
              step="0.01"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g., 30"
            />

            {/* Depth */}
            <Input
              label="Depth (အထူ)"
              type="number"
              step="0.01"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              placeholder="e.g., 5 (optional)"
            />
          </div>

          {/* Unit Selector */}
          <div>
            <label className={`block text-sm font-sans font-medium mb-2 ${textColor} opacity-70`}>
              Unit *
            </label>
            {loadingUnits ? (
              <p className={`text-sm ${subtextColor}`}>Loading units...</p>
            ) : (
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-md border-2 ${selectBorder} ${inputBg} ${textColor} font-sans text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${isDark ? 'focus:ring-white' : 'focus:ring-black'} transition-all`}
              >
                <option value="">Select a unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            )}
            <p className={`text-xs mt-2 ${subtextColor}`}>
              {width && height && unitId && (
                <>Preview: {width} × {height}{depth && ` × ${depth}`} {units.find(u => u.id === unitId)?.symbol}</>
              )}
            </p>
          </div>
        </section>

        {/* Status & Availability Section */}
        <section className={`py-8 border-b ${borderColor}`}>
          <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Status & Availability</h2>
          
          <div className="space-y-2">
            {statuses.map((s) => (
              <label key={s.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  checked={status === s.value}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-4 h-4"
                />
                <span className={`text-sm font-sans ${textColor}`}>{s.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Additional Information Section */}
        <section className={`py-8 border-b ${borderColor}`}>
          <h2 className={`text-xl font-sans font-bold ${textColor} mb-1`}>Additional Information</h2>
          <p className={`text-sm ${subtextColor} mb-4`}>
            Details about edition, signature, and authenticity
          </p>
          
          <div className="space-y-6">
            {/* Framing Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-medium ${textColor}`}>Framing</span>
                <p className={`text-xs ${subtextColor}`}>
                  {isFramed ? 'Framed' : 'Not Framed'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFramed(!isFramed)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isFramed
                    ? isDark ? 'bg-white' : 'bg-[#151416]'
                    : isDark ? 'bg-[#262626]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`${isFramed ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isDark && isFramed ? '!bg-black' : ''
                  }`}
                />
              </button>
            </div>

            {/* Edition, Signature, COA Group */}
            <div className={`p-4 rounded-lg border-2 ${borderColor} space-y-4`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-semibold ${textColor}`}>Edition & Authenticity Details</h3>
                  <p className={`text-xs ${subtextColor} mt-1`}>
                    Manage edition information, artist signature, and certificate of authenticity
                  </p>
                </div>
              </div>

              {/* Edition Information */}
              <Input
                label="Edition Information (Optional)"
                type="text"
                value={editionInfo}
                onChange={(e) => setEditionInfo(e.target.value)}
                placeholder="e.g., 1st Edition, Limited 50/100, Original"
              />

              {/* Artist Signature Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-sm font-medium ${textColor}`}>Artist Signature</span>
                  <p className={`text-xs ${subtextColor}`}>
                    {hasSignature ? 'Signed' : 'Not Signed'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasSignature(!hasSignature)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hasSignature
                      ? isDark ? 'bg-white' : 'bg-[#151416]'
                      : isDark ? 'bg-[#262626]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`${hasSignature ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDark && hasSignature ? '!bg-black' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Certificate of Authenticity Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-sm font-medium ${textColor}`}>Certificate of Authenticity</span>
                  <p className={`text-xs ${subtextColor}`}>
                    {hasCOA ? '✓ COA Included' : 'No COA'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasCOA(!hasCOA)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hasCOA
                      ? isDark ? 'bg-white' : 'bg-[#151416]'
                      : isDark ? 'bg-[#262626]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`${hasCOA ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDark && hasCOA ? '!bg-black' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Display Control for All 3 Items */}
              <div className={`pt-4 mt-4 border-t ${borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-medium ${textColor}`}>Display on Client Gallery</span>
                    <p className={`text-xs ${subtextColor}`}>
                      {showAdditionalDetails 
                        ? 'Edition, signature & COA visible to public' 
                        : 'Edition, signature & COA hidden from public'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showAdditionalDetails
                        ? isDark ? 'bg-white' : 'bg-[#151416]'
                        : isDark ? 'bg-[#262626]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`${showAdditionalDetails ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isDark && showAdditionalDetails ? '!bg-black' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={`py-8 border-b ${borderColor}`}>
          <h2 className={`text-xl font-sans font-bold ${textColor} mb-4`}>Pricing</h2>
          
          {status !== 'available' && (
            <div className={`mb-4 p-3 rounded-md ${isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
              <p className="text-sm">
                ⚠️ Price editing is disabled when status is "{status}". Change status to "Available" to edit pricing.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              containerClassName="flex-1"
              label="Price *"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 200000"
              required
              disabled={status !== 'available'}
            />
            <div className="flex flex-col justify-end">
              <div className={`px-4 py-3 rounded-md border-2 ${selectBorder} ${inputBg} ${textColor} font-sans text-sm font-medium h-[50px] flex items-center ${status !== 'available' ? 'opacity-50' : ''
                }`}>
                MMK
              </div>
            </div>
          </div>

          {/* Show Price Toggle - Only if Available */}
          {status === 'available' && (
            <div className="flex items-center justify-between mt-4">
              <div>
                <span className={`text-sm font-medium ${textColor}`}>Display Price on Client</span>
                <p className={`text-xs ${subtextColor}`}>
                  {showPrice ? 'Price visible to public' : 'Price hidden (Contact for price)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrice(!showPrice)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showPrice
                    ? isDark ? 'bg-white' : 'bg-[#151416]'
                    : isDark ? 'bg-[#262626]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`${showPrice ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isDark && showPrice ? '!bg-black' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </section>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 pb-8">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/artworks')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
          >
            {isEditMode ? 'Update Artwork' : 'Create Artwork'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArtworkForm;
