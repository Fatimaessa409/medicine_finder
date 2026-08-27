const User = require("../models/userSchema");
const validator = require("validator");
const generateToken = require("../utils/generateToken");



exports.login = async (req, res) => {
  try {
    const { Email, password } = req.body;
    const user = await User.findOne({ Email });

    if (!user || !(await user.checkPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    return res.status(200).json({
      message: "Logged in successfully",
      user: {
        _id: user["_id"],
        firstName: user["firstName"],
        lastName: user["lastName"],
        username: user["username"],
        Email: user["Email"],
        role: user["role"],
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (req.user["role"] === "pharmacy") {
      return res.status(400).json({ message: "Use /api/pharmacies/me for a pharmacy account" });
    }

    const user = await User.findById(req.user["_id"]);
    return res.status(200).json(user);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};