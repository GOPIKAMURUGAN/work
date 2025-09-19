const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  price: { type: Number, default: null },
  terms: { type: String, default: '' },
  visibleToUser: { type: Boolean, default: false },
  visibleToVendor: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

CategorySchema.index({ name: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);