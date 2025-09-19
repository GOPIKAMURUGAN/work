const express = require("express");
const multer = require("multer");
const Category = require("../models/Category");

const router = express.Router();

// setup multer
const upload = multer({ dest: "uploads/" });

// create category
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const { name, parentId, price, terms, visibleToUser, visibleToVendor } =
      req.body;

    if (!name || !req.file)
      return res.status(400).json({ message: "Name and image required" });

    if (!parentId) {
      const exists = await Category.findOne({ name, parent: null });
      if (exists)
        return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({
      name,
      imageUrl: `/uploads/${req.file.filename}`,
      parent: parentId || null,
      price: price ? Number(price) : undefined,
      terms,
      visibleToUser: visibleToUser === "true",
      visibleToVendor: visibleToVendor === "true",
    });

    await category.save();
    res.json(category);
  } catch (err) {
    console.error("🔥 POST /api/categories error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// get categories
router.get("/", async (req, res, next) => {
  try {
    let { parentId } = req.query;
    parentId = parentId === "null" ? null : parentId;
    const categories = await Category.find({ parent: parentId }).sort({
      createdAt: -1,
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Update category
router.put("/:id", upload.single("image"), async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const { name, price, terms, visibleToUser, visibleToVendor } = req.body;

    if (name !== undefined) category.name = name;

    // If price is empty string or null → set null
    // Convert price properly
    category.price = price === "" || price === undefined ? null : Number(price);

    // If terms is empty string → set empty
    category.terms = terms !== undefined ? terms : category.terms;

    category.visibleToUser = visibleToUser === "true";
    category.visibleToVendor = visibleToVendor === "true";

    if (req.file) category.imageUrl = `/uploads/${req.file.filename}`;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error("🔥 PUT /api/categories/:id error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// delete category
router.delete("/:id", async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

// get single category by id
router.get("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error("🔥 GET /api/categories/:id error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;
