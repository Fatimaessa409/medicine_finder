const express = require("express");
const router = express.Router();
const {
  createPharmacy,
  getAllPharmacies,
  activatePharmacy,
  deactivatePharmacy,
  deletePharmacy,
  getDashboard,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// every route below requires an authenticated admin
router.use(protect, authorize("admin"));

router.get("/pharmacies", getAllPharmacies);
router.post("/pharmacies", createPharmacy);
router.patch("/pharmacies/:id/activate", activatePharmacy);
router.patch("/pharmacies/:id/deactivate", deactivatePharmacy);
router.delete("/pharmacies/:id", deletePharmacy);

router.get("/dashboard", getDashboard);

module.exports = router;
