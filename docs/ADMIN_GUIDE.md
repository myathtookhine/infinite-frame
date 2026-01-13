# Infinite Frame - Admin Portal

A minimalist, Zen-inspired admin portal built with React, Vite, and Tailwind CSS v4.

## Philosophy

**Everything is temporary** - A black & white, minimalist design focused on clarity and simplicity.

## Features

- ✨ Clean Black & White UI
- 🔐 Authentication System
- 🎨 Reusable Component Library
- 📱 Responsive Design
- ⚡ Built with Vite for fast development

## Project Structure

```
/admin/src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx      # Reusable button with variants
│   │   └── Input.jsx       # Reusable input component
│   └── ProtectedRoute.jsx  # Route protection HOC
├── context/
│   └── AuthContext.jsx     # Authentication state management
├── pages/
│   ├── Login.jsx           # Login page
│   ├── Dashboard.jsx       # Main dashboard
│   └── ChangePassword.jsx  # Password change page
├── layout/
│   └── (future layouts)
├── App.jsx                 # Main app with routing
└── App.css                 # Global styles with Tailwind
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Default Login Credentials:**
   - Username: `admin`
   - Password: `123123`

## Components

### Button Component
Supports multiple variants and sizes:
- **Variants:** `primary` (solid black), `secondary` (outline black)
- **Sizes:** `sm`, `md`, `lg`
- **Block mode:** Full width option

```jsx
import Button from './components/ui/Button';

<Button variant="primary" size="md" block>
  Sign In
</Button>
```

### Input Component
Consistent styled input with label and error support:

```jsx
import Input from './components/ui/Input';

<Input
  label="Username"
  type="text"
  placeholder="Enter username"
/>
```

## Styling

- **Headings:** Inter (Sans-serif)
- **UI Elements:** Inter (Sans-serif)
- **Primary Color:** #000000 (Black)
- **Secondary Color:** #FFFFFF (White)

## Routes

- `/login` - Public login page
- `/dashboard` - Protected dashboard (requires auth)
- `/change-password` - Protected password change page

## Authentication

Simple localStorage-based authentication for demonstration:
- Login stores a dummy token
- Protected routes check for token
- Logout clears the session

## Development

The project uses:
- **React 19.2.0** - Latest React with hooks
- **Vite 7.2.4** - Fast build tool
- **Tailwind CSS v4** - Utility-first CSS
- **React Router Dom** - Client-side routing

## Future Enhancements

- Admin layout with sidebar navigation
- User management
- Content management
- Analytics dashboard
- Settings page

---

**Built with ❤️ for Infinite Frame**
