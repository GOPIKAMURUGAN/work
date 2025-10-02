// routes/vendorPricing.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const VendorCategoryPrice = require("../models/VendorCategoryPrice");
const Vendor = require("../models/Vendor");
const Category = require("../models/Category");

// Middleware to log request + timing
router.use((req, res, next) => {
  const start = Date.now();
  console.log(`[API CALL] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[API DONE] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// GET all pricing for a vendor (creates default if not exists)
router.get("/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    console.warn("Invalid vendorId:", vendorId);
    return res.status(400).json({ message: "Invalid vendorId" });
  }

  try {
    console.log("Fetching vendor", vendorId);
    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    console.log("Fetching existing pricing for vendor:", vendorId);
    let pricingData = await VendorCategoryPrice.find({ vendorId }).lean();

    if (pricingData.length === 0) {
      console.log("No pricing found, creating defaults...");
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
      console.log("Default pricing seeded:", pricingData.length, "items");
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
    console.warn("Invalid vendorId/pricingId:", { vendorId, pricingId });
    return res.status(400).json({ message: "Invalid vendorId or pricingId" });
  }

  try {
    console.log(`Updating pricing ${pricingId} for vendor ${vendorId} → new price: ${price}`);
    const updated = await VendorCategoryPrice.findOneAndUpdate(
      { _id: pricingId, vendorId },
      { price },
      { new: true }
    );

    if (!updated) {
      console.warn("Pricing not found:", pricingId);
      return res.status(404).json({ message: "Pricing not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating vendor pricing:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET pricing for a vendor & specific category
router.get("/:vendorId/:categoryId", async (req, res) => {
  const { vendorId, categoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
    console.warn("Invalid vendorId/categoryId:", { vendorId, categoryId });
    return res.status(400).json({ message: "Invalid vendorId or categoryId" });
  }

  try {
    console.log(`Fetching pricing for vendor ${vendorId}, category ${categoryId}`);
    let pricing = await VendorCategoryPrice.find({ vendorId, categoryId }).lean();

    if (!pricing) pricing = [];
    res.json(Array.isArray(pricing) ? pricing : [pricing]);
  } catch (err) {
    console.error("Error fetching vendor category pricing:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
