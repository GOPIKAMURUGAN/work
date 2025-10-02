const express = require("express");
const multer = require("multer");
const Category = require("../models/Category");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// helper: log duration
function logApi(req, res, label) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms ${label || ""}`);
  });
}

/* ---------------- CREATE CATEGORY ---------------- */
router.post("/", async (req, res, next) => {
  logApi(req, res, "create-category");
  try {
    const { name, parentId, price, terms, visibleToUser, visibleToVendor } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    if (!parentId) {
      const exists = await Category.findOne({ name, parent: null });
      if (exists) return res.status(400).json({ message: "Category already exists" });
    }

    const parsedSequence = (() => {
      const seq = Number(req.body.sequence);
      return Number.isNaN(seq) ? 0 : seq;
    })();

    const parsedPrice = (() => {
      if (price === "" || price === undefined || price === null) return null;
      const n = Number(price);
      return Number.isNaN(n) ? null : n;
    })();

    const category = new Category({
      name,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      parent: parentId || null,
      price: parsedPrice,
      terms,
      visibleToUser: String(visibleToUser) === "true",
      visibleToVendor: String(visibleToVendor) === "true",
      sequence: parsedSequence,
    });

    const saved = await category.save();
    console.log("💾 Saved category:", { id: saved._id.toString(), name: saved.name });
    res.json(saved);
  } catch (err) {
    console.error("🔥 POST /api/categories error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ---------------- GET CATEGORIES ---------------- */
router.get("/", async (req, res, next) => {
  logApi(req, res, "list-categories");
  try {
    let { parentId } = req.query;
    parentId = parentId === "null" ? null : parentId;
    const categories = await Category.find({ parent: parentId }).sort({
      sequence: 1,
      createdAt: -1,
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

/* ---------------- UPDATE CATEGORY ---------------- */
router.put("/:id", upload.single("image"), async (req, res, next) => {
  logApi(req, res, "update-category");
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const { name, price, terms, visibleToUser, visibleToVendor } = req.body;

    if (name !== undefined) category.name = name;
    category.price = price === "" || price === undefined ? null : Number(price);
    category.terms = terms !== undefined ? terms : category.terms;
    category.visibleToUser = visibleToUser === "true";
    category.visibleToVendor = visibleToVendor === "true";

    if (req.body.sequence !== undefined) {
      category.sequence = req.body.sequence === "" ? 0 : Number(req.body.sequence);
    }
    if (req.file) category.imageUrl = `/uploads/${req.file.filename}`;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error("🔥 PUT /api/categories/:id error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ---------------- DELETE CATEGORY ---------------- */
router.delete("/:id", async (req, res, next) => {
  logApi(req, res, "delete-category");
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

/* ---------------- GET SINGLE CATEGORY ---------------- */
router.get("/:id", async (req, res, next) => {
  logApi(req, res, "get-category");
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error("🔥 GET /api/categories/:id error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ---------------- DEBUG ROUTES ---------------- */
router.get("/_debug/count", async (req, res, next) => {
  logApi(req, res, "debug-count");
  try {
    const count = await Category.countDocuments({});
    const conn = require("mongoose").connection;
    res.json({
      count,
      dbName: conn.db ? conn.db.databaseName : null,
      collection: Category.collection.collectionName,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/_debug/probe", async (req, res, next) => {
  logApi(req, res, "debug-probe");
  try {
    const probeName = `__probe_${Date.now()}`;
    const saved = await Category.create({ name: probeName });
    const conn = require("mongoose").connection;
    res.json({
      saved: { id: saved._id.toString(), name: saved.name },
      dbName: conn.db ? conn.db.databaseName : null,
      collection: Category.collection.collectionName,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
