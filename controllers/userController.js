const User = require("../models/userSchema");
const validator = require("validator");

exports.signup = async (req, res) => {
  try {
    if (!validator.isEmail(req.body["Email"])) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const checkUserExistence = await User.findOne({
      $or: [
        { Email: req.body["Email"] },
        { username: req.body["username"] },
        { phonenumber: req.body["phonenumber"] },
      ],
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
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        Email: newUser.Email,
        role: newUser.role,
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
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        Email: user.Email,
        role: user.role,
        pharmacy: user.pharmacy,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.savePharmacy = async (req, res) => {
  try {

    const user = await User.findById(
      req.body["userId"]
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const pharmacyId = req.body["pharmacyId"];


    if (user.savedPharmacies.includes(pharmacyId)) {
      return res.status(400).json({
        message: "Pharmacy already saved"
      });
    }


    user.savedPharmacies.push(pharmacyId);

    await user.save();


    return res.status(200).json({
      message: "Pharmacy saved successfully",
      savedPharmacies: user.savedPharmacies
    });


  } catch (err) {

    console.log(err);

    return res.status(500).json({
      message: err.message
    });

  }
};



exports.getSavedPharmacies = async (req, res) => {
  try {

    const user = await User.findById(
      req.body["userId"]
    ).populate("savedPharmacies");


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    return res.status(200).json({
      savedPharmacies: user.savedPharmacies
    });


  } catch (err) {

    console.log(err);

    return res.status(500).json({
      message: err.message
    });

  }
};


exports.removeSavedPharmacy = async (req, res) => {
  try {

    const user = await User.findById(
      req.body["userId"]
    );


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const pharmacyId =
      req.body["pharmacyId"];


    user.savedPharmacies =
      user.savedPharmacies.filter(
        (id) => id.toString() !== pharmacyId
      );


    await user.save();


    return res.status(200).json({
      message: "Pharmacy removed successfully",
      savedPharmacies: user.savedPharmacies
    });


  } catch (err) {

    console.log(err);

    return res.status(500).json({
      message: err.message
    });

  }
};
