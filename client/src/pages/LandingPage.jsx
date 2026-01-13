const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Infinite Frame</h1>
          <div className="hero-divider"></div>
          <p className="hero-subtitle">
            Where Art Finds Its Digital Home
          </p>
          <p className="hero-description">
            A curated platform for artists to showcase their work and connect with art enthusiasts worldwide.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Why Infinite Frame?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <h3 className="feature-title">Showcase Your Work</h3>
            <p className="feature-description">
              Create your own personalized gallery space to display your artwork with a unique URL.
            </p>
          </div>

          <div className="feature-card">
            <h3 className="feature-title">Professional Presence</h3>
            <p className="feature-description">
              Build your artist profile with contact information, social links, and gallery details.
            </p>
          </div>

          <div className="feature-card">
            <h3 className="feature-title">Public Access</h3>
            <p className="feature-description">
              Share your gallery URL with collectors, galleries, and art enthusiasts effortlessly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to Showcase Your Art?</h2>
        <p className="cta-description">
          Join Infinite Frame and create your professional gallery today.
        </p>
        <a href="/admin" className="cta-button">
          Get Started
        </a>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p className="footer-text">© 2026 Infinite Frame. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
