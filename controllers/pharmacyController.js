// const User = require("../models/userSchema");
const validator = require("validator");
const Pharmacy = require("../models/pharmacySchema");
const Inventory = require("../models/inventorySchema");
const Comment = require("../models/commentSchema");
const generateMapsUrl = require("../utils/generateMapsUrl");

exports.createPharmacy = async (req, res) => {
  try {

    if (req.user["role"] !== "admin") {   // only admin can create a pharmacy
      return res.status(403).json({
        message: "Only admin can create a pharmacy"
      });
    }

    if (!req.body["name"]) {
      return res.status(400).json({ message: "Pharmacy name is required" });
    }
    if (!req.body["address"]) {
      return res.status(400).json({ message: "Address is required" });
    }
    if (!req.body["email"]) {
      return res.status(400).json({ message: "email is required" });
    }
    
    if (req.body["lng"] === undefined || req.body["lat"] === undefined) {
      return res.status(400).json({ message: "lng and lat are required" });
    }
    if (!req.body["firstName"]) {
      return res.status(400).json({ message: "first name is required" });
    }
    if (!req.body["lastName"]) {
      return res.status(400).json({ message: "last name is required" });
    }
    if (!req.body["username"]) {
      return res.status(400).json({ message: "username is required" });
    }
    if (!req.body["phonenumber"]) {
      return res.status(400).json({ message: "phone number is required" });
    }
    if (!req.body["password"]) {
      return res.status(400).json({ message: "password is required" });
    }
      if (req.body["password"] !== req.body["passwordConfirm"]) {
      return res.status(400).json({
        message: "Please enter matching password and password confirm"
      });
    }
    if (req.body["password"].length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

if (!validator.isEmail(req.body["email"])) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    const checkUserExistence = await pharmacy.findOne({Email: req.body["Email"]});
    if (checkUserExistence) {
      return res.status(409).json({ message:"pharmacy  already exists" });
    }

    const newpharmacy = await User.create({
      firstName: req.body["firstName"],
      lastName: req.body["lastName"],
      username: req.body["username"],
      Email: req.body["Email"],
      phonenumber: req.body["phonenumber"],
      password: req.body["password"],
      passwordConfirm: req.body["password"],
      role: "pharmacy",
    });

    let pharmacy;
    try {
      pharmacy = await Pharmacy.create({
        name: req.body["name"],
        address: req.body["address"],
        phone: req.body["phone"],
        openingHours: req.body["openingHours"],
        owner: newpharmacy["_id"],
        email: req.body["Email"],
        location: {
          type: "Point",
          coordinates: [Number(req.body["lng"]), Number(req.body["lat"])],
        },
      });
    } catch (pharmacyErr) {
      // roll back the owner account so we don't leave an orphaned user
      // with role "pharmacy" but no pharmacy attached
      await User.findByIdAndDelete(newpharmacy["_id"]);
      throw pharmacyErr;
    }

    newpharmacy["pharmacy"] = pharmacy["_id"];
    await newpharmacy.save({ validateBeforeSave: false });

    return res.status(201).json({
      ...pharmacy.toObject(),
      mapsUrl: generateMapsUrl(pharmacy["location"]["coordinates"]),
      owner: {
        _id: newpharmacy["_id"],
        firstName:newpharmacy["firstName"],
        lastName: newpharmacy["lastName"],
        username: newpharmacy["username"],
        Email: newpharmacy["Email"],
      },
    });

  } catch (err) {
    console.log(err);
    if (err["code"] === 11000) {
      const field = Object.keys(err["keyValue"])[0];
      return res.status(409).json({ message: `${field} is already taken` });
    }
    res.status(500).json({ message: err.message });

  }
};

exports.getPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ isActive: true }).populate("owner", "firstName lastName Email");

    const withMaps = pharmacies.map((p) => ({
      ...p.toObject(),
      mapsUrl: generateMapsUrl(p["location"]["coordinates"]),
    }));

    return res.status(200).json(withMaps);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.getNearbyPharmacies = async (req, res) => {
  try {
    const lng = req.query["lng"];
    const lat = req.query["lat"];
    const maxDistance = req.query["maxDistance"] || 10000;

    if (lng === undefined || lat === undefined) {
      return res.status(400).json({ message: "lng and lat query params are required" });
    }

    const pharmacies = await Pharmacy.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance),
        },
      },
    });

    const withMaps = pharmacies.map((p) => ({
      ...p.toObject(),
      mapsUrl: generateMapsUrl(p["location"]["coordinates"]),
    }));

    return res.status(200).json(withMaps);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params["id"]).populate("owner", "firstName lastName Email");
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const ratingAgg = await Comment.aggregate([
      { $match: { pharmacy: pharmacy["_id"] } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]);
    const rating = ratingAgg[0]
      ? { average: Number(ratingAgg[0]["avgRating"].toFixed(1)), count: ratingAgg[0]["reviewCount"] }
      : { average: null, count: 0 };

    return res.status(200).json({
      ...pharmacy.toObject(),
      mapsUrl: generateMapsUrl(pharmacy["location"]["coordinates"]),
      rating: rating,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.updatePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params["id"]);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const isOwner = pharmacy["owner"].toString() === req.user["_id"].toString();
    if (!isOwner && req.user["role"] !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this pharmacy" });
    }

    if (req.body["name"] !== undefined) pharmacy["name"] = req.body["name"];
    if (req.body["address"] !== undefined) pharmacy["address"] = req.body["address"];
    if (req.body["phone"] !== undefined) pharmacy["phone"] = req.body["phone"];
    if (req.body["openingHours"] !== undefined) pharmacy["openingHours"] = req.body["openingHours"];
    if (typeof req.body["isActive"] === "boolean") pharmacy["isActive"] = req.body["isActive"];
    if (req.body["lng"] !== undefined && req.body["lat"] !== undefined) {
      pharmacy["location"]["coordinates"] = [Number(req.body["lng"]), Number(req.body["lat"])];
    }

    await pharmacy.save();

    return res.status(200).json({
      ...pharmacy.toObject(),
      mapsUrl: generateMapsUrl(pharmacy["location"]["coordinates"]),
    });

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

    const isOwner = pharmacy["owner"].toString() === req.user["_id"].toString();
    if (!isOwner && req.user["role"] !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this pharmacy" });
    }

    await Inventory.deleteMany({ pharmacy: pharmacy["_id"] });
    await Comment.deleteMany({ pharmacy: pharmacy["_id"] });
    await User.findByIdAndUpdate(pharmacy["owner"], { pharmacy: null });
    await pharmacy.deleteOne();

    return res.status(200).json({ message: "Pharmacy, its inventory, and reviews were removed" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

// pharmacy owner convenience - "view own pharmacy" without knowing the id
exports.getMyPharmacy = async (req, res) => {
  try {
    if (!req.user["pharmacy"]) {
      return res.status(404).json({ message: "You have no registered pharmacy yet" });
    }

    const pharmacy = await Pharmacy.findById(req.user["pharmacy"]);

    return res.status(200).json({
      ...pharmacy.toObject(),
      mapsUrl: generateMapsUrl(pharmacy["location"]["coordinates"]),
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.changePassword = async (req, res) => {
  try {

    const pharmacy = await Pharmacy.findById(
      req.params["id"]
    );


    if (!pharmacy) {
      return res.status(404).json({
        message: "Pharmacy not found"
      });
    }


    const isOwner =
      pharmacy["owner"].toString() ===
      req.user["_id"].toString();
      if (!isOwner) {
      return res.status(403).json({
        message: "Only the pharmacy owner can change the password"
      });
    }


    const {
      currentPassword,
      newPassword,
      passwordConfirm
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !passwordConfirm
    ) {
      return res.status(400).json({
        message:
          "Current password, new password and passwordConfirm are required"
      });
    }


    const passwordCorrect =
      await bcrypt.compare(
        currentPassword,
        pharmacy["password"]
      );

if (!passwordCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect"
      });
    }


    if (newPassword !== passwordConfirm) {
      return res.status(400).json({
        message:
          "New password and passwordConfirm do not match"
      });
    }


    if (newPassword.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters"
      });
    }
    pharmacy["password"] =
      await bcrypt.hash(newPassword, 12);

    pharmacy["passwordChangedAt"] = Date.now();


    await pharmacy.save();


    return res.status(200).json({
      message: "Password changed successfully"
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      message: err.message
    });

  }
};