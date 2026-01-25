import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { GalleryProvider } from './context/GalleryContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <GalleryProvider>
          <App />
        </GalleryProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
