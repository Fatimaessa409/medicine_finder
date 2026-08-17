const User = require("../models/userSchema");
const validator = require("validator");

exports.signup = async (req, res) => {
  try {
    if (!validator.isEmail(req.body["Email"])) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const checkUserExistence = await User.findOne({ 
      Email: req.body["Email"] 
      });
    if (checkUserExistence) {
      return res.status(409).json({ message: "User already exists" });
    }

    if (req.body["password"] !== req.body["passwordConfirm"]) {
      return res.status(400).json({
        message: "Please enter matching password and password confirm",
      });
    }

    const newUser = await User.create({
      firstName: req.body["firstName"],
      lastName: req.body["lastName"],
      username: req.body["username"],
      Email: req.body["Email"],
      phonenumber: req.body["phonenumber"],
      password: req.body["password"],
      passwordConfirm: req.body["passwordConfirm"],
      passwordChangedAt: Date.now(),
    });

    return res.status(201).json({
      message: "Signup successfully",
      user: {
        _id: newUser["_id"],
        firstName: newUser["firstName"],
        lastName: newUser["lastName"],
        username: newUser["username"],
        Email: newUser["Email"],
        role: newUser["role"],
      },
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ message: `${field} is already taken` });
    }
    res.status(500).json({ message: err.message });
  }
};

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