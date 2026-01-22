import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ThemeToggle';

const ArtworkDetail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-theme text-theme flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-2xl reveal">
           <div className="w-24 h-1 bg-theme mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6">
            Coming Soon
          </h1>
          <p className="text-lg md:text-xl font-light opacity-70 mb-12">
            The detailed view for this artwork is currently under construction.
            <br />
            Please check back later for more information.
          </p>
           <div className="w-24 h-1 bg-theme mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail;
