// routes/vendorPricing.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const VendorCategoryPrice = require("../models/VendorCategoryPrice");
const Vendor = require("../models/Vendor");
const Category = require("../models/Category");

// GET all pricing for a vendor (creates default if not exists)
router.get("/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return res.status(400).json({ message: "Invalid vendorId" });
  }

  try {
    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    let pricingData = await VendorCategoryPrice.find({ vendorId }).lean();

    if (pricingData.length === 0) {
      const categories = await Category.find().lean();

      pricingData = categories.map((cat) => ({
        vendorId,
        vendorName: vendor.contactName,
        businessName: vendor.businessName,
        phone: vendor.phone,
        categoryId: cat._id,
        subcategoryId: null,
        categoryName: cat.name,
        subcategoryName: null,
        price: cat.price,
      }));

      await VendorCategoryPrice.insertMany(pricingData);
      pricingData = await VendorCategoryPrice.find({ vendorId }).lean();
    }

    res.json(pricingData);
  } catch (err) {
    console.error("Error fetching vendor pricing:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update a pricing item
router.put("/:vendorId/:pricingId", async (req, res) => {
  const { vendorId, pricingId } = req.params;
  const { price } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(pricingId)) {
    return res.status(400).json({ message: "Invalid vendorId or pricingId" });
  }

  try {
    const updated = await VendorCategoryPrice.findOneAndUpdate(
      { _id: pricingId, vendorId },
      { price },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Pricing not found" });

    res.json(updated);
  } catch (err) {
    console.error("Error updating vendor pricing:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET pricing for a vendor & specific category
// GET pricing for a vendor & specific category
router.get("/:vendorId/:categoryId", async (req, res) => {
  const { vendorId, categoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: "Invalid vendorId or categoryId" });
  }

  try {
    let pricing = await VendorCategoryPrice.find({ vendorId, categoryId }).lean();

    // If no pricing found, return empty array instead of 404
    if (!pricing) pricing = [];
    
    // Ensure it's always an array
    res.json(Array.isArray(pricing) ? pricing : [pricing]);
  } catch (err) {
    console.error("Error fetching vendor category pricing:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
