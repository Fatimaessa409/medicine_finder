const express = require("express");
const router = express.Router();
const { getPharmacyDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get("/pharmacy", protect, authorize("pharmacy"), getPharmacyDashboard);

module.exports = router;
