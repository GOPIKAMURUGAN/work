const express = require("express");
const multer = require("multer");
const Category = require("../models/Category");

const router = express.Router();

// setup multer
const upload = multer({ dest: "uploads/" });

// create category
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    if (!name || !req.file) {
      return res.status(400).json({ message: "Name and image are required" });
    }

    const category = new Category({
      name,
      image: `/uploads/${req.file.filename}`,
      parentId: parentId || null,
    });

    await category.save();
    res.json(category);
  } catch (err) {
    next(err); // ✅ forward error to global handler
  }
});

// get categories
router.get("/", async (req, res, next) => {
  try {
    const { parentId } = req.query;
    const query = parentId ? { parentId } : { parentId: null };
    const categories = await Category.find(query);
    res.json(categories);
  } catch (err) {
    next(err);
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

module.exports = router;
