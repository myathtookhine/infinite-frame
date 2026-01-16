import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GalleryView from './pages/GalleryView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:slug" element={<GalleryView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
