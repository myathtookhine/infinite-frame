import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'

// Hide app loader after React mounts
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    // Small delay to ensure app is rendered
    setTimeout(() => {
      loader.classList.add('fade-out');
      // Remove from DOM after transition
      setTimeout(() => loader.remove(), 400);
    }, 300);
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Run after initial render
hideLoader();

