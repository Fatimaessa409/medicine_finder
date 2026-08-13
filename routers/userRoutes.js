const express = require("express");
const router = express.Router();

const userController =require("../controllers/userController");

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/savePharmacy", userController.savePharmacy);
router.get("/savedPharmacies", userController.getSavedPharmacies);
router.delete("/removePharmacy", userController.removeSavedPharmacy);

module.exports = router;

