const express = require("express");
const router = express.Router();
const {
  addInventory,
  getMyInventory,
  getInventoryByPharmacy,
  updateInventory,
  deleteInventory,
} = require("../controllers/inventoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get("/pharmacy/:pharmacyId", getInventoryByPharmacy);
router.get("/mine", protect, authorize("pharmacy"), getMyInventory);

router.post("/", protect, authorize("pharmacy"), addInventory);
router.put("/:id", protect, authorize("pharmacy"), updateInventory);
router.delete("/:id", protect, authorize("pharmacy"), deleteInventory);

module.exports = router;
