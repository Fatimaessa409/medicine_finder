const User = require("../models/userSchema");
const validator = require("validator");
const Medicine = require("../models/medicineSchema");

exports.saveMedicine = async (req, res) => {
  try {
    const medicineId = req.body["medicineId"];

    if (!medicineId) {
      return res.status(400).json({ message: "medicineId is required" });
    }

    const medicineExists = await Medicine.findById(medicineId);
    if (!medicineExists) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const user = await User.findById(req.user["_id"]);

    const alreadySaved = user["savedMedicines"].some(
      (id) => id.toString() === medicineId
    );
    if (alreadySaved) {
      return res.status(400).json({ message: "Medicine already saved" });
    }

    user["savedMedicines"].push(medicineId);
    await user.save();

    return res.status(200).json({
      message: "Medicine saved successfully",
      savedMedicines: user["savedMedicines"],
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};


exports.getSavedMedicines = async (req, res) => {
  try {
    const user = await User.findById(req.user["_id"]).populate("savedMedicines");

    return res.status(200).json({
      savedMedicines: user["savedMedicines"],
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.removeSavedMedicine = async (req, res) => {
  try {
    const medicineId = req.params["medicineId"];

    const user = await User.findById(req.user["_id"]);

    user["savedMedicines"] = user["savedMedicines"].filter(
      (id) => id.toString() !== medicineId
    );

    await user.save();

    return res.status(200).json({
      message: "Medicine removed from saved list",
      savedMedicines: user["savedMedicines"],
    });



  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

