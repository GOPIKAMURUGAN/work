// models/VendorCategoryPrice.js
const mongoose = require("mongoose");

const VendorCategoryPriceSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true }, // ADD THIS
  vendorName: { type: String, required: true },
  businessName: { type: String, required: true },
  phone: { type: String, required: true },

  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // optional but recommended

  level1: { type: String },
  level2: { type: String },
  level3: { type: String },
  level4: { type: String },
  level5: { type: String },

  price: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("VendorCategoryPrice", VendorCategoryPriceSchema);
