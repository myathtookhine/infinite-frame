import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import { ArrowRight, ArrowRightCircle } from 'lucide-react';

const GalleryArtworkSection = ({ categories = [], artworks = [], gallerySlug }) => {
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

      // Return all categories sorted by name (grouped object values)
      return Object.values(grouped);
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
      <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-8 text-center">Categories</h2>

      <div className="relative">
        <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-4 mb-12 overflow-x-auto pb-4 md:pb-0 scrollbar-hide px-0 md:px-0 snap-x">
          {categoriesWithArtworks.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap flex-shrink-0 snap-center px-6 py-4 min-w-[120px] text-center text-sm uppercase tracking-wider transition-all duration-300 border-b-4 cursor-pointer ${activeCategory === cat.id
                ? 'border-black dark:border-white text-white dark:text-black font-bold bg-black dark:bg-white'
                : 'border-black dark:border-white text-gray-500 dark:text-gray-400 bg-white dark:bg-white/2 hover:bg-gray-100 dark:hover:bg-white/20'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Mobile scroll indicator */}
        {/* {categoriesWithArtworks.length > 2 && (
          <div className="absolute right-0 top-0 bottom-4 md:hidden z-10 flex items-center pr-1 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80 w-12 justify-end">
            <ArrowRightCircle className="w-6 h-6 text-theme opacity-80 animate-pulse" />
          </div>
        )} */}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

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

                      {activeGroup.items.length > 0 ? (
              <Masonry
                              breakpointCols={masonryBreakpoints}
                              className="flex -ml-8 w-auto"
                              columnClassName="pl-8 bg-clip-padding"
                          >
                              {activeGroup.items.map((art, index) => (
                                <ArtworkCard key={art.id} artwork={art} index={index} gallerySlug={gallerySlug} />
                              ))}
                          </Masonry>
                      ) : (
                          <div className="text-center py-20 opacity-50 font-light">
                              No artworks found in this category.
                          </div>
                      )}
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

const ArtworkCard = ({ artwork, index, gallerySlug }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="mb-12 group block"
    >
      <Link to={`/${gallerySlug}/artwork/${artwork.id}`} className="block">
        <div className="relative overflow-hidden mb-4">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
            src={artwork.main_image}
            alt={artwork.title}
            className="w-full h-auto object-cover block rounded"
          />
          {/* Overlay for small detail hint (optional) */}
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-start gap-4">
            <h4 className="font-bold text-lg leading-tight group-hover:text-theme/80 transition-colors">
              {artwork.title}
            </h4>
          </div>
          
          {artwork.description && (
            <p className="text-sm opacity-60 line-clamp-2 leading-relaxed">
              {artwork.description}
            </p>
          )}

          <div className="flex justify-between items-end">
             <div className="text-xs uppercase tracking-wider opacity-50 font-mono">
              {Number(artwork.width)} x {Number(artwork.height)} {artwork.unit_name}
            </div>
            
            <div className="text-right flex flex-col items-end gap-1">
              {/* Status Badge */}
              {artwork.status === 'available' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider text-green-900 dark:text-green-400">
                  Available
                </span>
              )}
              {artwork.status === 'reserved' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider text-orange-900 dark:text-orange-400">
                  Reserved
                </span>
              )}
              {artwork.status === 'sold' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider text-red-900 dark:text-red-400">
                  Sold
                </span>
              )}
              {artwork.status === 'private collection' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider text-gray-900 dark:text-gray-400">
                  Private Collection
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default GalleryArtworkSection;
