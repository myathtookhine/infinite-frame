const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/auth');
const app = express();

// Middlewares
// Allowed Origins
const allowedOrigins = [
  'http://localhost:5173',           // Local Development
  'http://localhost:5174',
  'http://localhost:3000',           // Alternative Local
  'https://infiniteframe.online',    // Production Client
  'https://www.infiniteframe.online',
  'https://admin.infiniteframe.online', // Production Admin
  'https://infinite-frame.vercel.app'   // Vercel Deployments (if any)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-id']
}));
app.use(express.json());

// API Routes
app.get('/', (req, res) => {
  res.send('Infinite Frame API is running peacefully...');
});

// Public routes (no authentication)
app.use('/api/public', require('./routes/publicGallery'));
app.use('/api/public', require('./routes/public')); // New general public routesFor tracking

// Protected routes
app.use('/api', authRoutes); 
app.use('/api/attributes', require('./routes/attributes'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/units', require('./routes/units'));
app.use('/api/artworks', require('./routes/artworks'));
app.use('/api/config', require('./routes/config')); // Master Data (Categories, etc.)
app.use('/api/admin-management', require('./routes/adminManagement')); // Super Admin Utils
app.use('/api/banner', require('./routes/banner')); // Banner Upload
app.use('/api/analytics', require('./routes/analytics')); // Analytics Charts

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});