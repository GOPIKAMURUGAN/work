const express = require("express");
const router = express.Router();
const VendorPricing = require("../models/VendorPricing");
const Category = require("../models/Category");

// Recursive helper to build pricing for all levels
const buildPricingRecursive = async (vendorId, parent = null, parentCategoryId = null, parentCategoryName = null) => {
  const categories = await Category.find({ parent });

  let pricingData = [];

  for (const cat of categories) {
    // Add current category/subcategory
    pricingData.push({
      vendorId,
      categoryId: parentCategoryId ? parentCategoryId : cat._id,
      categoryName: parentCategoryName ? parentCategoryName : cat.name,
      subcategoryId: cat._id,
      subcategoryName: cat.name,
      price: cat.price,
    });

    // Recurse for children
    const childrenPricing = await buildPricingRecursive(
      vendorId,
      cat._id,
      parentCategoryId ? parentCategoryId : cat._id,
      cat.name
    );
    pricingData = pricingData.concat(childrenPricing);
  }

  return pricingData;
};

// GET all pricing for a vendor (creates if not exists)
router.get("/:vendorId", async (req, res) => {
  const { vendorId } = req.params;
  try {
    let pricingData = await VendorPrice.find({ vendorId }).lean();
    if (pricingData.length === 0) {
      // create default pricing if not exists
      const categories = await Category.find().lean();
      pricingData = categories.map(cat => ({
        vendorId,
        categoryId: cat._id,
        subcategoryId: null,
        categoryName: cat.name,
        subcategoryName: null,
        price: cat.price
      }));
      await VendorPrice.insertMany(pricingData);
      pricingData = await VendorPrice.find({ vendorId }).lean();
    }
    res.json(pricingData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch vendor pricing" });
  }
});

// PUT update price
router.put("/:vendorId/:pricingId", async (req, res) => {
  const { vendorId, pricingId } = req.params;
  const { price } = req.body;
  try {
    const updated = await VendorPrice.findOneAndUpdate(
      { _id: pricingId, vendorId },
      { price },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update price" });
  }
});


module.exports = router;