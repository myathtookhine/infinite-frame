import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GalleryView from './pages/GalleryView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:slug" element={<GalleryView />} />
        <Route path="/" element={
          <div className="home-container">
            <h1>Infinite Frame</h1>
            <p>Enter a gallery slug in the URL to view a gallery.</p>
            <p className="example">Example: /lawkanatgallery</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

