const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const categoryRoutes = require('./routes/categoryRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Serve static files from /uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/vendors', vendorRoutes);

const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

app.listen(5000, () => console.log('Server running on port 5000'));
