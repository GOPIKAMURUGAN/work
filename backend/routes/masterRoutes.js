const express = require("express");
const multer = require("multer");
const Master = require("../models/Master");

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

/* ---------------- GET masters (roots or by parentId) ---------------- */
router.get("/", async (req, res) => {
  logApi(req, res, "list-masters");
  try {
    const parentId = req.query.parentId || null;
    const filter = parentId ? { parent: parentId } : { parent: null };
    const masters = await Master.find(filter).sort({ sequence: 1, createdAt: -1 });
    res.json(masters);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ---------------- GET one master ---------------- */
router.get("/:id", async (req, res) => {
  logApi(req, res, "get-master");
  try {
    const item = await Master.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ---------------- CREATE master ---------------- */
router.post("/", upload.single("image"), async (req, res) => {
  logApi(req, res, "create-master");
  try {
    const { name, parentId, visibleToUser, visibleToVendor, sequence } = req.body;
    console.log("POST /api/masters", { name, parentId });

    if (!name) return res.status(400).json({ message: "Name required" });

    const exists = await Master.findOne({ name, parent: parentId || null });
    if (exists) return res.status(400).json({ message: "Already exists" });

    const master = new Master({
      name,
      parent: parentId || null,
      imageUrl: req.file ? `/${req.file.path.replace(/\\/g, "/")}` : null,
      visibleToUser: visibleToUser === "true",
      visibleToVendor: visibleToVendor === "true",
      sequence: Number.isNaN(Number(sequence)) ? 0 : Number(sequence),
    });
    await master.save();
    console.log("Created master", master._id, master.name);

    // Auto-seed children if creating Status at root
    if (!parentId && name && name.trim().toLowerCase() === "status") {
      const children = ["Accepted", "Pending", "Rejected"];
      for (const childName of children) {
        const existsChild = await Master.findOne({ name: childName, parent: master._id });
        if (!existsChild) {
          const child = new Master({ name: childName, parent: master._id });
          await child.save();
          console.log("Seeded status child", childName, child._id.toString());
        }
      }
    }

    res.json(master);
  } catch (err) {
    console.error("POST /api/masters error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ---------------- UPDATE master ---------------- */
router.put("/:id", upload.single("image"), async (req, res) => {
  logApi(req, res, "update-master");
  try {
    const { name, visibleToUser, visibleToVendor, sequence } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (typeof visibleToUser !== "undefined") updates.visibleToUser = visibleToUser === "true";
    if (typeof visibleToVendor !== "undefined") updates.visibleToVendor = visibleToVendor === "true";
    if (typeof sequence !== "undefined") updates.sequence = Number(sequence) || 0;
    if (req.file) updates.imageUrl = `/${req.file.path.replace(/\\/g, "/")}`;

    const item = await Master.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ---------------- DELETE master ---------------- */
router.delete("/:id", async (req, res) => {
  logApi(req, res, "delete-master");
  try {
    await Master.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;
