const express = require("express");
const mongoose = require("mongoose");
const Vendor = require("../models/Vendor");
const VendorPrice = require("../models/VendorPricing");
const Category = require("../models/Category");
const VendorCategoryPrice = require("../models/VendorCategoryPrice");
const Customer = require("../models/Customer"); // ✅ MISSING IMPORT
const getCategoryModel = require("../utils/getCategoryModel");

const router = express.Router();

/**
 * Build category tree safely (recursive)
 */
async function buildVendorPreviewTree(categoryId, vendorId) {
  const category = await Category.findById(categoryId).lean();
  if (!category) return null;

  // Fetch vendor-specific price
  const priceDoc = await VendorCategoryPrice.findOne({ vendorId, categoryId }).lean();
  const price = priceDoc?.price ?? category.price;

  // Find children categories recursively
  const childrenCats = await Category.find({ parent: categoryId }).lean();
  const children = [];
  for (const child of childrenCats) {
    const childTree = await buildVendorPreviewTree(child._id, vendorId);
    if (childTree) children.push(childTree);
  }

  return {
    id: category._id,
    name: category.name,
    price,
    imageUrl: category.imageUrl,
    children,
  };
}


 
/**
 * GET all vendors
 */
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().lean();

    const safeVendors = await Promise.all(
      vendors.map(async (v) => {
        let customer = null;
        let category = null;

        try {
          if (v.customerId) {
            customer = await Customer.findById(v.customerId, "fullNumber phone").lean();
          }
        } catch {}
        try {
          if (v.categoryId) {
            category = await Category.findById(v.categoryId, "name price").lean();
          }
        } catch {}

        return {
          ...v,
          customerId: customer || null,
          categoryId: category || null,
        };
      })
    );

    res.json(safeVendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

/**
 * GET single vendor
 */
router.get("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate("customerId", "fullNumber phone")
      .populate("categoryId", "name price");

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch vendor" });
  }
});

/**
 * GET vendor's category tree
 */
/**
 * GET vendor's category tree (all nested subcategories)
 */
router.get("/:vendorId/categories", async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(vendorId))
      return res.status(400).json({ message: "Invalid vendorId" });

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const vendorPricings = await VendorPrice.find({ vendorId }).lean();
    const vendorPricingMap = {};
    vendorPricings.forEach((p) => {
      vendorPricingMap[p.categoryId.toString()] = p.price;
    });

    // Recursive function to build full category tree
    async function buildCategoryTree(catId) {
      const category = await Category.findById(catId).lean();
      if (!category) return null;

      const price = vendorPricingMap[category._id.toString()] ?? category.price;

      const childrenDocs = await Category.find({ parent: catId }).lean();
      const children = await Promise.all(childrenDocs.map((child) => buildCategoryTree(child._id)));

      return {
        id: category._id,
        name: category.name,
        defaultPrice: category.price,
        vendorPrice: price,
        imageUrl: category.imageUrl || null,
        children: children.filter(Boolean),
      };
    }

    // Start from vendor root category or top-level root
    const root = vendor.categoryId
      ? await Category.findById(vendor.categoryId).lean()
      : await Category.findOne({ parent: null }).lean();

    if (!root) return res.status(404).json({ message: "No root category found" });

    const tree = await buildCategoryTree(root._id);

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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


/**
 * UPDATE vendor-specific price
 */
router.put("/:vendorId/prices", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { categoryId, price } = req.body;
    if (!categoryId || !price)
      return res.status(400).json({ message: "categoryId and price are required" });

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice))
      return res.status(400).json({ message: "Valid price is required" });

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const category = await Category.findById(categoryId).lean();
    if (!category) return res.status(404).json({ message: "Category not found" });

    await VendorPrice.findOneAndUpdate(
      { vendorId, categoryId },
      { vendorId, categoryId, price: parsedPrice },
      { upsert: true, new: true }
    );

    // Build category path
    const path = [];
    let tempCat = category;
    while (tempCat) {
      path.unshift(tempCat.name);
      if (!tempCat.parent) break;
      tempCat = await Category.findById(tempCat.parent).lean();
    }

    const CategoryModel = getCategoryModel(category.name);
    const entry = {
      vendorId: vendor._id,
      vendorName: vendor.contactName,
      businessName: vendor.businessName,
      phone: vendor.phone,
      categoryId: category._id,
      price: parsedPrice,
    };
    path.forEach((lvl, idx) => (entry[`level${idx + 1}`] = lvl));

    const saved = await CategoryModel.findOneAndUpdate(
      { vendorId: vendor._id },
      entry,
      { upsert: true, new: true }
    );

    res.json({ message: "Vendor price updated successfully", saved });
  } catch (err) {
    console.error("Error updating vendor price:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

/**
 * GET vendor preview
 */
// GET vendor preview with all nested subcategories
router.get("/:vendorId/preview/:categoryId", async (req, res) => {
  try {
    const { vendorId, categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId))
      return res.status(400).json({ message: "Invalid vendorId" });
    if (!mongoose.Types.ObjectId.isValid(categoryId))
      return res.status(400).json({ message: "Invalid categoryId" });

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    // Fetch all vendor pricing for faster lookup
    const vendorPricings = await VendorCategoryPrice.find({ vendorId }).lean();
    const vendorPricingMap = {};
    vendorPricings.forEach(p => {
      vendorPricingMap[p.categoryId.toString()] = p.price;
    });

    // Helper: find top-most parent
    async function findRoot(catId) {
      let cat = await Category.findById(catId).lean();
      while (cat.parent) {
        cat = await Category.findById(cat.parent).lean();
      }
      return cat;
    }

    const root = await findRoot(categoryId);

    // Recursive function to build tree
    async function buildTree(catId) {
      const cat = await Category.findById(catId).lean();
      if (!cat) return null;

      const price = vendorPricingMap[cat._id.toString()] ?? cat.price;

      const childrenDocs = await Category.find({ parent: catId }).lean();
      const children = await Promise.all(childrenDocs.map(c => buildTree(c._id)));

      return {
        id: cat._id,
        name: cat.name,
        price,
        imageUrl: cat.imageUrl || null,
        terms: cat.terms || "",
        children: children.filter(Boolean),
      };
    }

    const tree = await buildTree(root._id);

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
    console.error("Error fetching vendor preview:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});








module.exports = router;
