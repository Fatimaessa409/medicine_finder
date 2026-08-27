const express = require("express");
const router = express.Router();
const { getCatalog, getMedicineById, createMedicine, searchMedicines } = require("../controllers/medicineController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get("/search", searchMedicines);
router.get("/", getCatalog);
router.get("/:id", getMedicineById);

router.post("/", protect, authorize("pharmacy"), createMedicine);

module.exports = router;
