import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const GalleryView = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`http://localhost:5000/api/public/gallery/${slug}`);
        
        if (response.data.success) {
          setGallery(response.data.data);
        } else {
          setError('Gallery not found');
        }
      } catch (err) {
        console.error('Error fetching gallery:', err);
        if (err.response?.status === 404) {
          setError('Gallery not found');
        } else {
          setError('Failed to load gallery. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchGallery();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="gallery-container">
        <div className="gallery-not-found">
          <h1>404</h1>
          <h2>Gallery Not Found</h2>
          <p>The gallery you're looking for doesn't exist or has been removed.</p>
          <p className="slug-info">Slug: <code>{slug}</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-content">
        <header className="gallery-header">
          <h1 className="gallery-title">{gallery.gallery_name || gallery.username}</h1>
          <div className="gallery-divider"></div>
        </header>
        
        <section className="gallery-description">
          <p>{gallery.description || 'Welcome to our gallery.'}</p>
        </section>

        {/* Contact Information */}
        {(gallery.address || gallery.email || gallery.phone_numbers?.length > 0) && (
          <section className="gallery-contact">
            <h2 className="contact-title">Contact Information</h2>
            
            {gallery.address && (
              <div className="contact-item">
                <span className="contact-label">Address:</span>
                <span className="contact-value">{gallery.address}</span>
              </div>
            )}
            
            {gallery.email && (
              <div className="contact-item">
                <span className="contact-label">Email:</span>
                <a href={`mailto:${gallery.email}`} className="contact-link">{gallery.email}</a>
              </div>
            )}
            
            {gallery.phone_numbers && gallery.phone_numbers.length > 0 && (
              <div className="contact-item">
                <span className="contact-label">Phone:</span>
                <div className="contact-phones">
                  {gallery.phone_numbers.map((phone, index) => (
                    <a key={index} href={`tel:${phone}`} className="contact-link phone-link">
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Social Links */}
        {gallery.social_links && Object.keys(gallery.social_links).length > 0 && (
          <section className="gallery-social">
            <h2 className="social-title">Connect With Us</h2>
            <div className="social-links">
              {Object.entries(gallery.social_links).map(([platform, url]) => (
                <a 
                  key={platform} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="gallery-footer">
          <p className="gallery-username">Curated by @{gallery.username}</p>
        </footer>
      </div>
    </div>
  );
};

export default GalleryView;
