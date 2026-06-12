# Infinite Frame

Infinite Frame is a modern, responsive digital exhibition platform designed for artists to showcase their work through personalized online galleries. It provides a comprehensive ecosystem including a powerful artist dashboard (admin) and an elegant, shareable client-side gallery.

Explore the platform at **[infiniteframe.online](https://infiniteframe.online)** or manage your gallery via the **[Artist Dashboard](https://admin.infiniteframe.online)**.

## 🚀 Key Features

### 🎨 Artist Dashboard (Admin)
The administrative portal serves as the headquarters for artists to manage their digital presence.
- **Secure Onboarding**: Registration flow with email verification via OTP (One-Time Password).
- **Gallery Customization**: 
  - Manage gallery identity including name, biography, and professional contact information.
  - Interactive banner upload and toggling for a customized brand experience.
- **Comprehensive Artwork Management**:
  - Full CRUD operations for artworks.
  - Support for main and secondary images with built-in cropping and optimization.
  - Detailed metadata support: categories, attributes (medium, technique, dimensions), and pricing.
- **Analytics & Insights**: Track gallery performance with view counts for the overall gallery and individual artworks.
- **Super Admin Tools**: Global management for system-wide categories, measurement units, and administrative roles.

### 🖼️ Public Gallery (Client)
The client-facing application is optimized for visual impact and ease of access.
- **Personalized Slug URLs**: Each registered artist receives a unique, shareable URL based on their identifier (e.g., `infiniteframe.online/artist-slug`). This serves as their professional online gallery.
- **Responsive Exhibition**: A sleek masonry grid layout that elegantly showcases artworks across all devices (Desktop, Tablet, Mobile).
- **Categorized Views**: Easy navigation for visitors to filter artworks by specific categories.
- **Artwork Detail Pages**: Immersive viewing experience with high-resolution images, detailed piece information, and smooth animations.

---

## 🛠️ Technology Stack

Infinite Frame is built with a modern, high-performance stack:

**Frontend**
- **React 19**: Utilizing the latest React features for a dynamic UI.
- **Vite**: Ultra-fast build tool for modern web development.
- **Tailwind CSS 4**: Modern utility-first CSS for responsive and premium design.
- **Framer Motion**: Smooth micro-animations and transitions.
- **React Router 7**: Robust client-side routing.

**Backend**
- **Node.js & Express**: High-performance runtime and framework for the API layer.
- **PostgreSQL**: Reliable relational database (hosted via **Supabase**).
- **JWT & Bcrypt**: Secure token-based authentication and industry-standard password hashing.
- **Nodemailer**: Automated transactional emails for secure OTP registration.
- **Sharp**: Professional-grade image processing and optimization for fast loading times.

---

## 📂 Project Structure

The codebase is organized into three main components:

- `/admin`: The React-based artist dashboard.
- `/client`: The React-based public gallery and landing page.
- `/server`: The Node.js/Express API handling data, authentication, and file processing.
