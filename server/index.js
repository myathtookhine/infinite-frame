const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/auth');
const app = express();

// Middlewares
app.use(cors({
  origin: true, // Allow all origins for dev simplicity or specific list
  credentials: true
}));
app.use(express.json());

// API Routes
app.get('/', (req, res) => {
  res.send('Infinite Frame API is running peacefully...');
});

app.use('/api', authRoutes); 
app.use('/api/attributes', require('./routes/attributes'));
app.use('/api/config', require('./routes/config')); // Master Data (Categories, etc.)
app.use('/api/admin-management', require('./routes/adminManagement')); // Super Admin Utils

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});