const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  price: { type: Number, default: null },
  terms: { type: String, default: '' },
  visibleToUser: { type: Boolean, default: false },
  visibleToVendor: { type: Boolean, default: false },
  sequence: { type: Number, default: 0 }, // ordering within siblings
  createdAt: { type: Date, default: Date.now },
});

CategorySchema.index({ name: 1, parent: 1 }, { unique: true });
CategorySchema.index({ parent: 1, sequence: 1 });
module.exports = mongoose.model('Category', CategorySchema);