const validator = require("validator");
const Pharmacy = require("../models/pharmacySchema");
// const Inventory = require("../models/inventorySchema");
const Comment = require("../models/commentSchema");
const generateMapsUrl = require("../utils/generateMapsUrl");
const generateToken = require("../utils/generateToken");

const safeMapsUrl = (pharmacy) => {
  if (pharmacy["location"] && pharmacy["location"]["coordinates"] && pharmacy["location"]["coordinates"].length === 2) {
    return generateMapsUrl(pharmacy["location"]["coordinates"]);
  }
  return null;
};

exports.login = async (req, res) => {
  try {
    const email = req.body["email"];
    const password = req.body["password"];

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const pharmacy = await Pharmacy.findOne({ email: email }).select("+password");

    if (!pharmacy || !(await pharmacy.checkPassword(password, pharmacy["password"]))) {
      return res.status(401).json({ message: "Invalid credentials" });

    }

    if (!pharmacy["isActive"]) {
      return res.status(403).json({ message: "This pharmacy account has been deactivated" });
    }

    return res.status(200).json({
      message: "Logged in successfully",
      token: generateToken(pharmacy["_id"], "pharmacy"),
      pharmacy: {
        _id: pharmacy["_id"],
        name: pharmacy["name"],
        email: pharmacy["email"],
        ownerFirstName: pharmacy["ownerFirstName"],
        ownerLastName: pharmacy["ownerLastName"],
        isActive: pharmacy["isActive"],
      },
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};



// pharmacy owner convenience - "view own pharmacy" without knowing the id
exports.getMyPharmacy = async (req, res) => {
  try {
    
    const pharmacy = await Pharmacy.findById(req.user["_id"]);
    if (!pharmacy){
      return res.status(404).json({message:"Pharmacy not found"});
    }

    return res.status(200).json({
      ...pharmacy.toObject(),
      mapsUrl: safeMapsUrl(pharmacy),
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.updatePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.user["_id"]);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // const isOwner = pharmacy["owner"].toString() === req.user["_id"].toString();
    // if (!isOwner && req.user["role"] !== "admin") {
    //   return res.status(403).json({ message: "Not authorized to update this pharmacy" });
    // }

    if (req.body["name"] !== undefined) pharmacy["name"] = req.body["name"];
    if (req.body["address"] !== undefined) pharmacy["address"] = req.body["address"];
    if (req.body["phone"] !== undefined) pharmacy["phone"] = req.body["phone"];
    if (req.body["openingHours"] !== undefined) pharmacy["openingHours"] = req.body["openingHours"];
    // if (typeof req.body["isActive"] === "boolean") pharmacy["isActive"] = req.body["isActive"];
    if (req.body["ownerFirstName"] !== undefined) pharmacy["ownerFirstName"] = req.body["ownerFirstName"];
    if (req.body["ownerLastName"] !== undefined) pharmacy["ownerLastName"] = req.body["ownerLastName"];


    if (req.body["email"] !== undefined) {
      if (!validator.isEmail(req.body["email"])) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      pharmacy["email"] = req.body["email"];
    }


    if (req.body["lng"] !== undefined && req.body["lat"] !== undefined) {
      pharmacy["location"] = {
        type: "Point",
        coordinates: [Number(req.body["lng"]), Number(req.body["lat"])],
      };
    }


    await pharmacy.save();

    return res.status(200).json({
      ...pharmacy.toObject(),
      mapsUrl: safeMapsUrl(pharmacy),
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};


exports.changeMyPassword = async (req, res) => {
  try {
    const currentPassword = req.body["currentPassword"];
    const newPassword = req.body["newPassword"];
    const newPasswordConfirm = req.body["newPasswordConfirm"];

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      return res.status(400).json({ message: "currentPassword, newPassword and newPasswordConfirm are required" });
    }
    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({ message: "New password and confirmation do not match" });
    }

    
    const pharmacy = await Pharmacy.findById(req.user["_id"]).select("+password");

    if (!(await pharmacy.checkPassword(currentPassword, pharmacy["password"]))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    pharmacy["password"] = newPassword;
    await pharmacy.save();

    return res.status(200).json({ message: "Password changed successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.getPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ isActive: true }).select("-password");

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
      mapsUrl: safeMapsUrl(p),
    }));

    return res.status(200).json(withMaps);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params["id"]).select("-password");
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
      mapsUrl: safeMapsUrl(pharmacy),
      rating: rating,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};
