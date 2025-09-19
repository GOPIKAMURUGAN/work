const express = require("express");
const Vendor = require("../models/Vendor");
const VendorPrice = require("../models/VendorPricing");
const Category = require("../models/Category");
const VendorCategoryPrice = require("../models/VendorCategoryPrice");
const getCategoryModel = require("../utils/getCategoryModel");
const getCategoryCollection = require("../utils/getCategoryModel"); // same function, different name
const router = express.Router();

/**
 * Build category tree recursively
 */
async function buildCategoryTree(parentId, vendorPricingMap) {
  const categories = await Category.find({ parent: parentId }).lean();
  const result = [];

  for (const cat of categories) {
    result.push({
      id: cat._id,
      name: cat.name,
      defaultPrice: cat.price,
      vendorPrice: vendorPricingMap[cat._id.toString()] ?? cat.price,
      visibleToUser: cat.visibleToUser,
      visibleToVendor: cat.visibleToVendor,
      children: await buildCategoryTree(cat._id, vendorPricingMap),
    });
  }

  return result;
}

/**
 * GET vendor's category tree with merged prices
 */
/**
 * GET vendor's category tree with merged prices + vendor details
 */
router.get("/:vendorId/categories", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const vendorPricings = await VendorPrice.find({ vendorId }).lean();
    const vendorPricingMap = {};
    vendorPricings.forEach((p) => {
      vendorPricingMap[p.categoryId.toString()] = p.price;
    });

    // Get root category (either vendor-specific or first root)
    let root = null;
    if (vendor.categoryId) root = await Category.findById(vendor.categoryId).lean();
    if (!root) root = await Category.findOne({ parent: null }).lean();
    if (!root) return res.status(404).json({ message: "No root category found" });

    // Recursive function to build category tree
    async function buildCategoryTreeSafe(parentId) {
      if (!parentId) return [];
      const categories = await Category.find({ parent: parentId }).lean();
      const result = [];
      for (const cat of categories) {
        const children = await buildCategoryTreeSafe(cat._id);
        result.push({
          id: cat._id,
          name: cat.name,
          defaultPrice: cat.price,
          vendorPrice: vendorPricingMap[cat._id.toString()] ?? cat.price,
          visibleToUser: cat.visibleToUser,
          visibleToVendor: cat.visibleToVendor,
          children,
        });
      }
      return result;
    }

    const tree = {
      id: root._id,
      name: root.name,
      defaultPrice: root.price,
      vendorPrice: vendorPricingMap[root._id.toString()] ?? root.price,
      children: await buildCategoryTreeSafe(root._id),
    };

    // Return both vendor and categories
    res.json({
      vendor: {
        id: vendor._id,
        contactName: vendor.contactName,
        businessName: vendor.businessName,
        phone: vendor.phone,
      },
      categories: tree,
    });
  } catch (err) {
    console.error("Error fetching vendor categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});




async function getCategoryPath(catId) {
  const path = [];
  let cat = await Category.findById(catId).lean();
  while (cat) {
    path.unshift(cat.name);
    if (!cat.parent) break;
    cat = await Category.findById(cat.parent).lean();
  }
  return path; // ['Tutor','Online','NEET','Chemistry']
}

/**
 * UPDATE vendor-specific price
 */
/**
 * UPDATE vendor-specific price safely
 */
router.put("/:vendorId/prices", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { categoryId, price } = req.body;

    if (!categoryId)
      return res.status(400).json({ message: "categoryId is required" });
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice))
      return res.status(400).json({ message: "Valid price is required" });

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const category = await Category.findById(categoryId).lean();
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Update main VendorPrice table
    await VendorPrice.findOneAndUpdate(
      { vendorId, categoryId },
      { vendorId, categoryId, price: parsedPrice },
      { upsert: true, new: true }
    );

    // Build path for dynamic levels
    const path = [];
    let tempCat = category;
    while (tempCat) {
      path.unshift(tempCat.name);
      if (!tempCat.parent) break;
      tempCat = await Category.findById(tempCat.parent).lean();
    }

    // Save in dynamic category collection
    const categoryName = category.name; // e.g., "Tutor"
    const CategoryModel = getCategoryModel(categoryName);

    const entry = {
      vendorName: vendor.contactName,
      businessName: vendor.businessName,
      phone: vendor.phone,
      price: parsedPrice,
    };
    path.forEach((lvl, idx) => (entry[`level${idx + 1}`] = lvl));

    const saved = await CategoryModel.findOneAndUpdate(
      { vendorName: vendor.contactName }, // filter by vendor
      entry,
      { upsert: true, new: true }
    );

    res.json({ message: "Vendor price updated successfully", saved });
  } catch (err) {
    console.error("Error updating vendor price:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});



/**
 * CREATE vendor
 */
router.get("/:vendorId/categories", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const vendorPricings = await VendorPrice.find({ vendorId }).lean();
    const vendorPricingMap = {};
    vendorPricings.forEach((p) => {
      vendorPricingMap[p.categoryId.toString()] = p.price;
    });

    // Get root category (either vendor-specific or first root)
    let root = null;
    if (vendor.categoryId) root = await Category.findById(vendor.categoryId).lean();
    if (!root) root = await Category.findOne({ parent: null }).lean();
    if (!root) return res.status(404).json({ message: "No root category found" });

    // Recursive function to build category tree
    async function buildCategoryTreeSafe(parentId) {
      if (!parentId) return [];
      const categories = await Category.find({ parent: parentId }).lean();
      const result = [];
      for (const cat of categories) {
        const children = await buildCategoryTreeSafe(cat._id);
        result.push({
          id: cat._id,
          name: cat.name,
          defaultPrice: cat.price,
          vendorPrice: vendorPricingMap[cat._id.toString()] ?? cat.price,
          visibleToUser: cat.visibleToUser,
          visibleToVendor: cat.visibleToVendor,
          children,
        });
      }
      return result;
    }

    // Root category tree
    const tree = {
      id: root._id,
      name: root.name,
      defaultPrice: root.price,
      vendorPrice: vendorPricingMap[root._id.toString()] ?? root.price,
      children: await buildCategoryTreeSafe(root._id),
    };

    // 👉 Send vendor details + categories together
    res.json({
      vendor: {
        id: vendor._id,
        contactName: vendor.contactName,
        businessName: vendor.businessName,
        phone: vendor.phone,
      },
      categories: tree,
    });
  } catch (err) {
    console.error("Error fetching vendor categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all vendors
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate("customerId", "fullNumber phone")   // get customer details
      .populate("categoryId", "name price");        // optional: category details

    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});


/**
 * LIST all vendors
 */
// GET single vendor by ID
router.get("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate("customerId", "fullNumber phone")   // get customer details
      .populate("categoryId", "name price");        // ✅ include category details

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch vendor" });
  }
});


module.exports = router;
