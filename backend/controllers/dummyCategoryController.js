// controllers/dummyCategoryController.js
const DummyCategory = require("../models/DummyCategory");
const DummySubcategory = require("../models/DummySubcategory");
const fs = require("fs");

function parseNumber(value, defaultNull = true) {
  if (value === undefined || value === null) return defaultNull ? null : 0;
  if (value === "") return defaultNull ? null : 0;
  const n = Number(value);
  return Number.isNaN(n) ? (defaultNull ? null : 0) : n;
}

// GET dummy categories (top-level if no parentId, else subcategories of given category)
exports.getCategories = async (req, res) => {
  try {
    const parentId = req.query.parentId || null;
    if (!parentId || parentId === "null") {
      const cats = await DummyCategory.find({}).sort({ sequence: 1, createdAt: -1 });
      return res.json(cats);
    }
    const subcats = await DummySubcategory.find({ category: parentId }).sort({ sequence: 1, createdAt: -1 });
    return res.json(subcats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE dummy category or subcategory depending on presence of parentId
exports.createCategory = async (req, res) => {
  try {
    const { name, parentId, price, terms, visibleToUser, visibleToVendor } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const parsedPrice = parseNumber(price, true);
    const parsedSequence = parseNumber(req.body.sequence, false);

    if (!parentId) {
      // Create top-level category
      const exists = await DummyCategory.findOne({ name });
      if (exists) return res.status(400).json({ message: "Category already exists" });

      const category = new DummyCategory({
        name,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        price: parsedPrice,
        terms,
        visibleToUser: String(visibleToUser) === "true",
        visibleToVendor: String(visibleToVendor) === "true",
        sequence: parsedSequence,
      });
      await category.save();
      return res.json(category);
    }

    // Create subcategory under given category
    const parent = await DummyCategory.findById(parentId);
    if (!parent) return res.status(404).json({ message: "Parent category not found" });
    const dup = await DummySubcategory.findOne({ name, category: parentId });
    if (dup) return res.status(400).json({ message: "Subcategory already exists under this category" });

    const subcategory = new DummySubcategory({
      name,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      category: parentId,
      price: parsedPrice,
      terms,
      visibleToUser: String(visibleToUser) === "true",
      visibleToVendor: String(visibleToVendor) === "true",
      sequence: parsedSequence,
    });
    await subcategory.save();
    return res.json(subcategory);
  } catch (err) {
    console.error("Create dummy category error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// UPDATE dummy category or subcategory by id (auto-detect)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, terms, visibleToUser, visibleToVendor } = req.body;

    let doc = await DummyCategory.findById(id);
    let modelType = "category";
    if (!doc) {
      doc = await DummySubcategory.findById(id);
      modelType = doc ? "subcategory" : null;
    }
    if (!doc) return res.status(404).json({ message: "Item not found" });

    if (name !== undefined) doc.name = name;
    doc.price = parseNumber(price, true);
    if (terms !== undefined) doc.terms = terms;
    if (visibleToUser !== undefined) doc.visibleToUser = String(visibleToUser) === "true";
    if (visibleToVendor !== undefined) doc.visibleToVendor = String(visibleToVendor) === "true";
    if (req.body.sequence !== undefined) doc.sequence = parseNumber(req.body.sequence, false);
    if (req.file) doc.imageUrl = `/uploads/${req.file.filename}`;

    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error("Update dummy category error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

async function deleteImageIfLocal(imageUrl) {
  if (imageUrl && imageUrl.startsWith("/uploads/")) {
    const localPath = imageUrl.slice(1);
    try {
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    } catch (e) {
      console.error("Error deleting file", localPath, e.message);
    }
  }
}

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DummyCategory.findById(id);
    if (category) {
      // Delete all subcategories under it
      const subs = await DummySubcategory.find({ category: id });
      for (const s of subs) {
        await deleteImageIfLocal(s.imageUrl);
      }
      await DummySubcategory.deleteMany({ category: id });
      await deleteImageIfLocal(category.imageUrl);
      await DummyCategory.findByIdAndDelete(id);
      return res.json({ message: "Deleted category and its subcategories" });
    }

    const subcategory = await DummySubcategory.findById(id);
    if (!subcategory) return res.status(404).json({ message: "Item not found" });
    await deleteImageIfLocal(subcategory.imageUrl);
    await DummySubcategory.findByIdAndDelete(id);
    return res.json({ message: "Deleted subcategory" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET single by id (search both collections) and normalize parent field
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DummyCategory.findById(id);
    if (category) {
      return res.json({ ...category.toObject(), parent: null });
    }
    const subcategory = await DummySubcategory.findById(id);
    if (!subcategory) return res.status(404).json({ message: "Item not found" });
    return res.json({ ...subcategory.toObject(), parent: subcategory.category });
  } catch (err) {
    console.error("Get dummy category error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
