// Mock data for artworks feature

export const mockCategories = [
  { id: 'cat1', name: 'Painting' },
  { id: 'cat2', name: 'Sculpture' },
  { id: 'cat3', name: 'Photography' },
  { id: 'cat4', name: 'Mixed Media' }
];

export const mockArtworks = [
  {
    id: '1',
    mainImage: {
      id: 'img1',
      url: 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Sunset+Main',
    },
    additionalImages: [
      { 
        id: 'img2', 
        url: 'https://via.placeholder.com/800x600/FF8E8E/FFFFFF?text=Sunset+Alt+1', 
      },
      { 
        id: 'img3', 
        url: 'https://via.placeholder.com/800x600/FFA5A5/FFFFFF?text=Sunset+Alt+2', 
      }
    ],
    name: 'Sunset Over Bagan',
    isUntitled: false,
    description: 'A beautiful oil painting capturing the golden hour at Bagan temples. The warm tones reflect the peaceful atmosphere of this ancient landscape.',
    createdYear: 2024,
    createdMonth: 'March',
    category: 'cat1', // Painting
    width: 40,
    height: 30,
    depth: null,
    unitId: null, // Will be populated from units API
    unitName: 'Centimeter',
    unitSymbol: 'cm',
    status: 'available',
    isFramed: true,
    editionInfo: 'Limited Edition 1/50',
    hasSignature: true,
    hasCOA: true,
    price: '200000',
    currency: 'MMK'
  },
  {
    id: '2',
    mainImage: {
      id: 'img4', 
      url: 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Untitled+Main', 
    },
    additionalImages: [],
    name: 'Untitled',
    isUntitled: true,
    description: '',
    createdYear: 2025,
    createdMonth: null,
    category: 'cat2', // Sculpture
    width: 15,
    height: 25,
    depth: 10,
    unitId: null,
    unitName: 'Centimeter',
    unitSymbol: 'cm',
    status: 'sold',
    isFramed: false,
    editionInfo: '',
    hasSignature: false,
    hasCOA: false,
    price: '500000',
    currency: 'MMK'
  },
  {
    id: '3',
    mainImage: {
      id: 'img5', 
      url: 'https://via.placeholder.com/800x600/95E1D3/FFFFFF?text=Dancer+Main', 
    },
    additionalImages: [
      { 
        id: 'img6', 
        url: 'https://via.placeholder.com/800x600/A8E6D7/FFFFFF?text=Dancer+Alt', 
      }
    ],
    name: 'Traditional Dancer',
    isUntitled: false,
    description: 'Acrylic painting celebrating Myanmar traditional dance. Rich colors and dynamic movement capture the essence of cultural heritage.',
    createdYear: 2023,
    createdMonth: 'December',
    category: 'cat1', // Painting
    width: 50,
    height: 70,
    depth: null,
    unitId: null,
    unitName: 'Centimeter',
    unitSymbol: 'cm',
    status: 'reserved',
    isFramed: true,
    editionInfo: 'Original',
    hasSignature: true,
    hasCOA: true,
    price: '800000',
    currency: 'MMK'
  }
];

// Helper function to get category name by id
export const getCategoryName = (categoryId) => {
  const category = mockCategories.find(cat => cat.id === categoryId);
  return category ? category.name : 'Unknown';
};

// Helper function to format price
export const formatPrice = (price, currency = 'MMK') => {
  return `${parseInt(price).toLocaleString()} ${currency}`;
};
