const express = require("express");
const mongoose = require("mongoose");
const Vendor = require("../models/Vendor");
const VendorPrice = require("../models/VendorPricing");
const Category = require("../models/Category");
const VendorCategoryPrice = require("../models/VendorCategoryPrice");
const Customer = require("../models/Customer"); // ✅ MISSING IMPORT
const getCategoryModel = require("../utils/getCategoryModel");
const VendorLocation = require("../models/VendorLocation");

const router = express.Router();

/**
 * 🔹 Middleware: Log every API call in this router
 */
router.use((req, res, next) => {
  const start = Date.now();
  console.log(`[API START] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[API END] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

/**
 * Build category tree safely (recursive)
 */
async function buildVendorPreviewTree(categoryId, vendorId) {
  const category = await Category.findById(categoryId).lean();
  if (!category) return null;

  // Fetch vendor-specific price
  const priceDoc = await VendorCategoryPrice.findOne({ vendorId, categoryId }).lean();
  const price = priceDoc?.price ?? category.price;

  // Find children recursively
  const childrenCats = await Category.find({ parent: categoryId })
    .sort({ sequence: 1, createdAt: -1 })
    .lean();

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
 * Category-level vendor counts (total and by status)
 * GET /api/vendors/categories/counts
 * Optional: ?categoryId=<id>
 */
router.get("/categories/counts", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const match = {};
    if (categoryId) match.categoryId = new mongoose.Types.ObjectId(categoryId);

    const totalAgg = await Vendor.aggregate([
      { $match: match },
      { $group: { _id: "$categoryId", total: { $sum: 1 } } },
    ]);

    const statusAgg = await Vendor.aggregate([
      { $match: match },
      { $group: { _id: { categoryId: "$categoryId", status: "$status" }, count: { $sum: 1 } } },
    ]);

    const totals = new Map(totalAgg.map((d) => [String(d._id), d.total]));
    const statusMap = new Map();
    statusAgg.forEach((d) => {
      const catId = String(d._id.categoryId);
      const st = d._id.status || "Waiting for Approval";
      if (!statusMap.has(catId)) statusMap.set(catId, {});
      statusMap.get(catId)[st] = d.count;
    });

    const cats = await Category.find(categoryId ? { _id: categoryId } : { parent: null }).lean();
    const result = cats.map((c) => ({
      categoryId: c._id,
      name: c.name,
      imageUrl: c.imageUrl,
      totalVendors: totals.get(String(c._id)) || 0,
      statusCounts: statusMap.get(String(c._id)) || {},
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /vendors/categories/counts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Vendors by category and status
 * GET /api/vendors/byCategory/:categoryId?status=Accepted
 */


// GET vendors by category and status
router.get("/byCategory/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    // Match vendors for this categoryId
    const match = { categoryId: new mongoose.Types.ObjectId(categoryId) };

    // Optional: filter by status
    if (status) {
      match.status = new RegExp(`^${status}$`, "i");
    }

    const vendors = await Vendor.find(match)
      .populate("customerId", "fullNumber phone")
      .populate("categoryId", "name price")
      .lean();

    res.json(vendors);
  } catch (err) {
    console.error("GET /vendors/byCategory error:", err);
    res.status(500).json({ message: "Server error" });
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
        // Recursive function to build full category tree
    async function buildCategoryTree(catId) {
      const category = await Category.findById(catId).lean();
      if (!category) return null;

      const price = vendorPricingMap[category._id.toString()] ?? category.price;

      const childrenDocs = await Category.find({ parent: catId }).sort({ sequence: 1, createdAt: -1 }).lean();
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
 * GET all vendors by status (ignores category)
 * Example: /api/vendors/byStatus/Waiting%20for%20Approval
 */
router.get("/byStatus/:status", async (req, res) => {
  try {
    const { status } = req.params;

    // Use case-insensitive exact match
    const vendors = await Vendor.find({ status: new RegExp(`^${status}$`, "i") })
      .populate("customerId", "fullNumber phone")
      .populate("categoryId", "name")
      .lean();

    res.json(vendors);
  } catch (err) {
    console.error("GET /vendors/byStatus error:", err);
    res.status(500).json({ message: "Server error" });
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
 * CREATE vendor
 */
router.post("/", async (req, res) => {
  try {
    const { customerId, phone, businessName, contactName, categoryId } = req.body;

    if (!customerId || !phone || !businessName || !contactName || !categoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // make sure customer exists
    const customer = await Customer.findById(customerId).lean();
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // make sure category exists
    const category = await Category.findById(categoryId).lean();
    if (!category) return res.status(404).json({ message: "Category not found" });

    const vendor = new Vendor({
      customerId,
      phone,
      businessName,
      contactName,
      categoryId,
    });

    await vendor.save();

    res.status(201).json(vendor);
  } catch (err) {
    console.error("Error creating vendor:", err);
    res.status(500).json({ message: "Failed to create vendor" });
  }
});


/**
 * GET vendor preview
 */
// GET vendor preview with all nested subcategories
// GET vendor preview (optimized)
router.get("/:vendorId/preview/:categoryId", async (req, res) => {
  try {
    const { vendorId, categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    // 1. Fetch vendor
    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    // 2. Fetch all categories once
    const allCategories = await Category.find().sort({ sequence: 1, createdAt: -1 }).lean();

    // 3. Build category map
    const catMap = {};
    allCategories.forEach((c) => { catMap[c._id.toString()] = { ...c, children: [] }; });

    // 4. Build tree structure (parent → children)
    allCategories.forEach((c) => {
      if (c.parent) {
        const parent = catMap[c.parent.toString()];
        if (parent) parent.children.push(catMap[c._id.toString()]);
      }
    });

    // 5. Fetch vendor-specific prices in one query
    const vendorPricings = await VendorCategoryPrice.find({ vendorId }).lean();
    const vendorPricingMap = {};
    vendorPricings.forEach((p) => {
      vendorPricingMap[p.categoryId.toString()] = p.price;
    });

    // 6. Find root category for this preview
    let root = catMap[categoryId];
    while (root?.parent) {
      root = catMap[root.parent.toString()];
    }
    if (!root) return res.status(404).json({ message: "Root category not found" });

    // 7. Attach vendorPrice + transform recursively
    function attachPrices(node) {
      const vendorPrice = vendorPricingMap[node._id.toString()] ?? node.price;

      return {
        id: node._id,
        name: node.name,
        price: node.price,
        vendorPrice,
        imageUrl: node.imageUrl || null,
        terms: node.terms || "",
        children: node.children.map(attachPrices),
      };
    }

    const tree = attachPrices(root);

    // 8. Vendor location
    const location = await VendorLocation.findOne({ vendorId }).lean();

    res.json({
      vendor: {
        id: vendor._id,
        contactName: vendor.contactName,
        businessName: vendor.businessName,
        phone: vendor.phone,
        location: location || null,
      },
      categories: tree,
    });
  } catch (err) {
    console.error("Error fetching vendor preview:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});





// GET /api/vendors/:vendorId/location
router.get("/:vendorId/location", async (req, res) => {
  try {
    const location = await VendorLocation.findOne({ vendorId: req.params.vendorId });
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// PUT /api/vendors/:vendorId/location


router.put("/:vendorId/location", async (req, res) => {
  try {
    const { lat, lng, address, nearbyLocations } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    // Ensure nearbyLocations is always an array of strings
    const safeNearbyLocations = Array.isArray(nearbyLocations)
      ? nearbyLocations.map(String)
      : [];

    // Reverse geocode safely
    let area = "";
    let city = "";
    try {
      if (lat && lng) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        area = data.address?.suburb || data.address?.neighbourhood || "";
        city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "";
      }
    } catch (err) {
      console.error("Reverse geocode failed", err);
    }

    const vendorLocation = await VendorLocation.findOneAndUpdate(
      { vendorId: req.params.vendorId },
      { lat, lng, address, area, city, nearbyLocations: safeNearbyLocations },
      { upsert: true, new: true }
    );

    res.json({ success: true, location: vendorLocation });
  } catch (err) {
    console.error("PUT /location error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});






module.exports = router;
