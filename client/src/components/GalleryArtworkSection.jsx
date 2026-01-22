import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import { ArrowRight } from 'lucide-react';

const GalleryArtworkSection = ({ categories = [], artworks = [] }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  // Group artworks by category and filter out empty categories
  const categoriesWithArtworks = useMemo(() => {
    const grouped = {};
    
    // Initialize groups for all categories
    categories.forEach(cat => {
      grouped[cat.id] = {
        ...cat,
        items: []
      };
    });

    // Distribute artworks
    artworks.forEach(art => {
      if (grouped[art.category_id]) {
        grouped[art.category_id].items.push(art);
      }
    });

    // Filter out categories with no artworks
    return Object.values(grouped).filter(cat => cat.items.length > 0);
  }, [categories, artworks]);

  // Set initial active category
  useEffect(() => {
    if (categoriesWithArtworks.length > 0 && !activeCategory) {
      setActiveCategory(categoriesWithArtworks[0].id);
    }
  }, [categoriesWithArtworks, activeCategory]);

  if (categoriesWithArtworks.length === 0) {
    return null;
  }

  const activeGroup = categoriesWithArtworks.find(c => c.id === activeCategory);

  const masonryBreakpoints = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
      <div className="w-full rounded-lg">
          
      {/* Category Tabs */}
      <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8 text-center">Categories</h2>
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {categoriesWithArtworks.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-6 text-sm uppercase tracking-wider transition-all duration-300 border-b-4 cursor-pointer ${
              activeCategory === cat.id
                ? 'border-theme text-theme font-bold'
                : 'border-transparent text-theme/60 hover:text-theme hover:border-theme/30'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Artworks Grid */}
      <AnimatePresence mode="wait">
        {activeGroup && (
          <motion.div
            key={activeGroup.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 text-center md:text-left hidden">
              <h3 className="text-2xl font-bold uppercase tracking-tight opacity-80">{activeGroup.name}</h3>
            </div>

            <Masonry
              breakpointCols={masonryBreakpoints}
              className="flex -ml-8 w-auto"
              columnClassName="pl-8 bg-clip-padding"
            >
              {activeGroup.items.map((art, index) => (
                <ArtworkCard key={art.id} artwork={art} index={index} />
              ))}
            </Masonry>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .my-masonry-grid {
          display: flex;
          margin-left: -30px; /* gutter size offset */
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 30px; /* gutter size */
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
};

const ArtworkCard = ({ artwork, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="mb-12 group block"
    >
        <Link to={`/artwork/${artwork.id}`} className="block">
        <div className="relative overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
            src={artwork.main_image}
            alt={artwork.title}
            className="w-full h-auto object-cover block"
          />
          {/* Overlay for small detail hint (optional) */}
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-start gap-4">
            <h4 className="font-bold text-lg leading-tight group-hover:text-theme/80 transition-colors">
              {artwork.title}
            </h4>
            {artwork.status === 'sold' && (
              <span className="text-xs font-bold uppercase text-red-500 border border-red-500 px-2 py-0.5 rounded-full">
                Sold
              </span>
            )}
             {artwork.status === 'reserved' && (
              <span className="text-xs font-bold uppercase text-orange-500 border border-orange-500 px-2 py-0.5 rounded-full">
                Reserved
              </span>
            )}
          </div>
          
          {artwork.description && (
            <p className="text-sm opacity-60 line-clamp-2 leading-relaxed">
              {artwork.description}
            </p>
          )}

          <div className="pt-2 flex justify-between items-end border-t border-theme/10 mt-3 group-hover:border-theme/30 transition-colors">
             <div className="text-xs uppercase tracking-wider opacity-50 font-mono">
              {Number(artwork.width)} x {Number(artwork.height)} {artwork.unit_name}
            </div>
            
            <div className="text-right">
              {artwork.show_price !== false && artwork.is_for_sale && artwork.price ? (
                 <span className="font-semibold">
                    {Number(artwork.price).toLocaleString()} <span className="text-xs font-normal opacity-70">{artwork.currency}</span>
                 </span>
              ) : (
                <span className="text-xs uppercase italic opacity-50">Inquire</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default GalleryArtworkSection;
