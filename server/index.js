const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', authRoutes); 
app.use('/api/config', configRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});