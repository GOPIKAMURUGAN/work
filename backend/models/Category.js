// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true }, // stores file path or cloud URL
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  createdAt: { type: Date, default: Date.now },
});

CategorySchema.index({ name: 1, parent: 1 }, { unique: true }); // unique per parent

module.exports = mongoose.model('Category', CategorySchema);
