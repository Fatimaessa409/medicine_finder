const Pharmacy = require("../models/pharmacySchema");
const User = require("../models/userSchema");
const Medicine = require("../models/medicineSchema");
const Inventory = require("../models/inventorySchema");
const Comment = require("../models/commentSchema");
const validator = require("validator");
const generateMapsUrl = require("../utils/generateMapsUrl");


const safeMapsUrl = (pharmacy) => {
  if (pharmacy["location"] && pharmacy["location"]["coordinates"] && pharmacy["location"]["coordinates"].length === 2) {
    return generateMapsUrl(pharmacy["location"]["coordinates"]);
  }
  return null;
};


exports.createPharmacy = async (req, res) => {
  try {
    if (!req.body["name"]) {
      return res.status(400).json({ message: "Pharmacy name is required" });
    }
    if (!req.body["email"]) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!validator.isEmail(req.body["email"])) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (!req.body["password"]) {
      return res.status(400).json({ message: "Password is required" });
    }
     if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters"});
    }

    const existing = await Pharmacy.findOne({ email: req.body["email"] });
    if (existing) {
      return res.status(409).json({ message: "A pharmacy with this email already exists" });
    }

    const pharmacy = await Pharmacy.create({
      name: req.body["name"],
      email: req.body["email"],
      password: req.body["password"],
    });

    return res.status(201).json({
      message: "Pharmacy created successfully",
      pharmacy: {
        _id: pharmacy["_id"],
        name: pharmacy["name"],
        email: pharmacy["email"],
        isActive: pharmacy["isActive"],
      },
    });

  } catch (err) {
    console.log(err);
    if (err["code"] === 11000) {
      return res.status(409).json({ message: "A pharmacy with this email already exists" });
    }
    res.status(500).json({ message: err.message });

  }
};



exports.getAllPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find();

    const withMaps = pharmacies.map((p) => ({
      ...p.toObject(),
      mapsUrl: safeMapsUrl(p),
    }));

    return res.status(200).json(withMaps);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};



exports.activatePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params["id"],
      { isActive: true },
      { new: true }
    ).select("-password");
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    return res.status(200).json({ message: "Pharmacy activated", pharmacy: pharmacy });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};


exports.deactivatePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params["id"],
      { isActive: false },
      { new: true }
    ).select("-password");
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    return res.status(200).json({ message: "Pharmacy deactivated", pharmacy: pharmacy });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};


exports.deletePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params["id"]);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    await Inventory.deleteMany({ pharmacy: pharmacy["_id"] });
    await Comment.deleteMany({ pharmacy: pharmacy["_id"] });
    await pharmacy.deleteOne();

    return res.status(200).json({ message: "Pharmacy, its inventory, and reviews were removed" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};


exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPharmacies = await Pharmacy.countDocuments();
    const activePharmacies = await Pharmacy.countDocuments({ isActive: true });
    const totalMedicines = await Medicine.countDocuments();
    const totalInventoryItems = await Inventory.countDocuments();

    return res.status(200).json({
      totalUsers: totalUsers,
      totalPharmacies: totalPharmacies,
      activePharmacies: activePharmacies,
      deactivatedPharmacies: totalPharmacies - activePharmacies,
      totalMedicines: totalMedicines,
      totalInventoryItems: totalInventoryItems,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

