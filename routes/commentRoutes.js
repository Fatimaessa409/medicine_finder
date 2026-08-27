const express = require("express");
const router = express.Router();
const {
  getCommentsForPharmacy,
  getMyPharmacyComments,
  addComment,
  deleteComment,
} = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get("/pharmacy/:pharmacyId", getCommentsForPharmacy);
router.get("/mine", protect, authorize("pharmacy"), getMyPharmacyComments);

router.post("/pharmacy/:pharmacyId", addComment);
router.delete("/:id", protect, authorize("admin"), deleteComment);

module.exports = router;
