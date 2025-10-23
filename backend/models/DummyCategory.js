const mongoose = require('mongoose');

const DummyCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'DummyCategory', default: null },
  price: { type: Number, default: null },
  terms: { type: String, default: '' },
  visibleToUser: { type: Boolean, default: false },
  visibleToVendor: { type: Boolean, default: false },
  sequence: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

DummyCategorySchema.index({ name: 1, parent: 1 }, { unique: true });
DummyCategorySchema.index({ parent: 1, sequence: 1 });

module.exports = mongoose.model('DummyCategory', DummyCategorySchema, 'dummycategories');
