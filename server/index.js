const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');

const app = express();

// Middlewares
app.use(cors({
  origin: [
    'https://admin.infiniteframe.online',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// API Routes အပေါ်နားမှာ ထည့်ပေးပါ
app.get('/', (req, res) => {
  res.send('Infinite Frame API is running peacefully...');
});

// API Routes
app.use('/api', authRoutes); 
app.use('/api/config', configRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});