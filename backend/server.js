// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const categoryRoutes = require('./routes/categoryRoutes');
const path = require('path');
const fs = require('fs');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/categories', categoryRoutes);

// ✅ Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.stack || err.message || err);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message || "Unknown error",
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));
