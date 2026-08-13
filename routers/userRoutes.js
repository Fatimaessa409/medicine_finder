const express = require("express");

const {
  signup,
  login,
  savePharmacy,
  getSavedPharmacies,
  removeSavedPharmacy
} = require("../controllers/userController");

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/savePharmacy", savePharmacy);
router.get("/savedPharmacies", getSavedPharmacies);
router.delete("/removePharmacy", removeSavedPharmacy);
module.exports = router;